import * as fs from "fs";
import * as path from "path";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import { vectorStore } from "../lib/rag/providers";
import { COLLECTION_NAME, EMBEDDING_DIMENSION } from "../lib/rag/providers/types";
import { orchestrate } from "../lib/rag/ingest/orchestrate";

// Polyfill WebSocket for Node.js 20 (Node 22+ has it natively)
// Supabase realtime-js requires WebSocket even if we don't use realtime.
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error — ws is compatible enough for Supabase's needs
  globalThis.WebSocket = WebSocket;
}

/**
 * Seed script — ingests all PDFs from ./seed-pdfs/ into the public corpus.
 *
 * Run: pnpm tsx scripts/seed.ts
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) to insert public documents.
 * Idempotent: skips PDFs already present by (name, is_public=true).
 */
async function main() {
  // Validate env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.QDRANT_URL) throw new Error("Missing QDRANT_URL");
  if (!process.env.QDRANT_API_KEY) throw new Error("Missing QDRANT_API_KEY");
  if (!process.env.JINA_API_KEY) throw new Error("Missing JINA_API_KEY");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  // 1. Ensure Qdrant collection exists with payload indexes
  console.log("Ensuring Qdrant collection...");
  await vectorStore.ensureCollection(COLLECTION_NAME, EMBEDDING_DIMENSION);
  console.log(`✓ Collection '${COLLECTION_NAME}' ready (${EMBEDDING_DIMENSION}d, cosine)\n`);

  // 2. Find seed PDFs
  const seedDir = path.resolve(process.cwd(), "seed-pdfs");
  if (!fs.existsSync(seedDir)) {
    console.error("No seed-pdfs/ directory found. Create it and add PDFs first.");
    process.exit(1);
  }

  const pdfFiles = fs
    .readdirSync(seedDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.log("No PDF files found in seed-pdfs/. Nothing to seed.");
    return;
  }

  console.log(`Found ${pdfFiles.length} PDF(s) in seed-pdfs/\n`);

  // 3. Process each PDF
  let seeded = 0;
  let skipped = 0;

  for (const filename of pdfFiles) {
    // Check if already seeded (idempotent by name + is_public)
    const { data: existing } = await supabase
      .from("documents")
      .select("id")
      .eq("name", filename)
      .eq("is_public", true)
      .maybeSingle();

    if (existing) {
      console.log(`skipped: ${filename} (already seeded)`);
      skipped++;
      continue;
    }

    // Insert document row (user_id=null, is_public=true)
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        name: filename,
        user_id: null,
        is_public: true,
        status: "processing",
      })
      .select("id")
      .single();

    if (docError) {
      console.error(`✗ ${filename}: failed to insert document row: ${docError.message}`);
      continue;
    }

    try {
      // Read PDF file
      const filePath = path.join(seedDir, filename);
      const buffer = fs.readFileSync(filePath);

      // Run the full ingest pipeline
      const { chunkCount } = await orchestrate(
        doc.id,
        filename,
        null, // no user_id for public corpus
        true, // is_public
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      );

      // Update document to ready
      await supabase
        .from("documents")
        .update({ status: "ready", chunk_count: chunkCount })
        .eq("id", doc.id);

      console.log(`seeded: ${filename} (${chunkCount} chunks)`);
      seeded++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ ${filename}: ${message}`);

      // Mark document as failed
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", doc.id);
    }
  }

  console.log(`\nDone. Seeded: ${seeded}, Skipped: ${skipped}, Total: ${pdfFiles.length}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
