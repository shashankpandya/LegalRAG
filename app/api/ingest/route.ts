import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parsePdf } from "@/lib/pdf/parse";
import { orchestrate } from "@/lib/rag/ingest/orchestrate";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB (Hobby body limit)
const MAX_PAGES = 25; // Hobby latency margin per ADR-012

/**
 * POST /api/ingest — PDF upload + full ingestion pipeline.
 * Synchronous in MVP, async-ready by design (ADR-012).
 */
export async function POST(req: Request) {
  try {
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
      return Response.json({ error: "No file" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "PDF exceeds 4.5 MB" },
        { status: 400 },
      );
    }

    // 3. Read file bytes once, then slice for each consumer
    // unpdf's extractText detaches the ArrayBuffer it receives (transfers to worker),
    // so we must give each consumer its own copy.
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Parse to check page count before committing
    const { pageCount } = await parsePdf(bytes.slice().buffer);

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
        { error: `Failed to create document: ${docError.message}` },
        { status: 500 },
      );
    }

    // 5. Run ingestion pipeline (give it a fresh copy of the bytes)
    try {
      const { chunkCount } = await orchestrate(
        doc.id,
        file.name,
        user.id,
        false, // is_public = false (user upload)
        bytes.slice().buffer,
      );

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ingestion failed";
      console.error("[/api/ingest]", message);

      // Mark document as failed
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", doc.id);

      return Response.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    console.error("[/api/ingest]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
