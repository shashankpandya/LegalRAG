import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parsePdf } from "@/lib/pdf/parse";
import { orchestrate } from "@/lib/rag/ingest/orchestrate";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB (Hobby body limit)
const MAX_PAGES = 25; // Hobby latency margin per ADR-012

// Validate required environment variables
function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "QDRANT_URL",
    "QDRANT_API_KEY",
    "JINA_API_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);
  return { valid: missing.length === 0, missing };
}

/**
 * POST /api/ingest — PDF upload + full ingestion pipeline.
 * Synchronous in MVP, async-ready by design (ADR-012).
 */
export async function POST(req: Request) {
  try {
    // 0. Validate environment variables
    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      console.error("[/api/ingest] Missing env vars:", envCheck.missing);
      return Response.json(
        {
          error: "Server configuration error — missing required API keys",
          details: `Missing: ${envCheck.missing.join(", ")}`,
          hint: `Add these to your .env.local file: ${envCheck.missing.join(", ")}`,
        },
        { status: 500 },
      );
    }

    // 1. Auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Server Component context
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Read multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `PDF exceeds ${MAX_FILE_SIZE / (1024 * 1024)} MB limit` },
        { status: 400 },
      );
    }

    // 3. Read file bytes once, then slice for each consumer
    // unpdf's extractText detaches the ArrayBuffer it receives (transfers to worker),
    // so we must give each consumer its own copy.
    let pageCount = 0;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      
      // Parse to check page count before committing
      const parseResult = await parsePdf(bytes.slice().buffer);
      pageCount = parseResult.pageCount;

      if (pageCount > MAX_PAGES) {
        return Response.json(
          { error: `PDF exceeds ${MAX_PAGES} pages (has ${pageCount})` },
          { status: 400 },
        );
      }

      // 4. Insert document row
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          name: file.name,
          size_bytes: file.size,
          page_count: pageCount,
          status: "processing",
          is_public: false,
        })
        .select("id")
        .single();

      if (docError) {
        return Response.json(
          { error: `Database error: ${docError.message}` },
          { status: 500 },
        );
      }

      // 5. Run ingestion pipeline (give it a fresh copy of the bytes)
      let chunkCount = 0;
      try {
        const result = await orchestrate(
          doc.id,
          file.name,
          user.id,
          false, // is_public = false (user upload)
          bytes.slice().buffer,
        );
        chunkCount = result.chunkCount;

        // Update document to ready
        await supabase
          .from("documents")
          .update({ status: "ready", chunk_count: chunkCount })
          .eq("id", doc.id);

        return Response.json({
          ok: true,
          docId: doc.id,
          status: "ready",
          chunkCount,
          pageCount,
        });
      } catch (ingestError) {
        const message = ingestError instanceof Error ? ingestError.message : "Ingestion failed";
        console.error("[/api/ingest] Ingestion error:", message);

        // Mark document as failed
        await supabase
          .from("documents")
          .update({ status: "failed" })
          .eq("id", doc.id);

        // Provide helpful error messages based on the error
        let userMessage = message;
        let hint = "";

        const isQdrantError =
          message.includes("Qdrant") ||
          message.includes("Not Found") ||
          message.includes("404") ||
          message.includes("vector") ||
          message.includes("collection");

        const isJinaError =
          message.includes("Jina") ||
          message.includes("embedding") ||
          message.includes("jina");

        const isNetworkError =
          message.includes("fetch") ||
          message.includes("network") ||
          message.includes("ENOTFOUND") ||
          message.includes("ECONNREFUSED") ||
          message.includes("timeout");

        if (isJinaError) {
          userMessage = "Embedding service error — document could not be indexed";
          hint = "Your JINA_API_KEY may be invalid or exhausted. Get a new key at jina.ai and update JINA_API_KEY in .env.local";
        } else if (isQdrantError) {
          userMessage = "Vector database error — the Qdrant cluster may have been deleted or is unreachable";
          hint = "Create a new cluster at cloud.qdrant.io, then update QDRANT_URL and QDRANT_API_KEY in .env.local";
        } else if (isNetworkError) {
          hint = "Network error — verify your API endpoints and internet connection";
        } else {
          hint = "Check the server console for the full error. Common causes: expired API keys, deleted vector database cluster.";
        }

        return Response.json(
          { error: userMessage, hint },
          { status: 500 },
        );
      }
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "PDF parsing failed";
      console.error("[/api/ingest] Parse error:", message);
      return Response.json(
        {
          error: `PDF parsing failed: ${message}`,
          hint: "Ensure the PDF is valid and not password-protected",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[/api/ingest] Unexpected error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Check the server console for the full error stack trace.",
      },
      { status: 500 },
    );
  }
}
