/**
 * Force re-seed script — wipes stale public document records from Supabase
 * and re-ingests all PDFs from seed-pdfs/ into Qdrant.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/reseed.ts
 *
 * Use this when Qdrant has been reset or vectors are missing despite
 * Supabase showing documents as "ready".
 */

import * as fs from "fs";
import * as path from "path";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";
import { vectorStore } from "../lib/rag/providers";
import { COLLECTION_NAME, EMBEDDING_DIMENSION } from "../lib/rag/providers/types";
import { orchestrate } from "../lib/rag/ingest/orchestrate";

if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error
  globalThis.WebSocket = WebSocket;
}

async function main() {
  // Validate env
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "QDRANT_URL",
    "QDRANT_API_KEY",
    "JINA_API_KEY",
  ];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log("━━━ Step 1: Ensure Qdrant collection ━━━");
  await vectorStore.ensureCollection(COLLECTION_NAME, EMBEDDING_DIMENSION);
  console.log(`✓ Collection "${COLLECTION_NAME}" ready (${EMBEDDING_DIMENSION}d, cosine)\n`);

  // Check current Qdrant public point count
  const { QdrantClient } = await import("@qdrant/js-client-rest");
  const qc = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
  });

  const colInfo = await qc.getCollection(COLLECTION_NAME);
  const totalPoints = colInfo.points_count ?? 0;
  console.log(`ℹ️  Qdrant currently has ${totalPoints} total points\n`);

  console.log("━━━ Step 2: Delete stale public document records from Supabase ━━━");
  const { data: staleDocs, error: fetchErr } = await supabase
    .from("documents")
    .select("id, name")
    .eq("is_public", true);

  if (fetchErr) {
    console.error("Failed to fetch public docs:", fetchErr.message);
    process.exit(1);
  }

  if (staleDocs && staleDocs.length > 0) {
    console.log(`  Found ${staleDocs.length} public document records to clear:`);
    staleDocs.forEach(d => console.log(`    - ${d.name}`));

    const ids = staleDocs.map(d => d.id);
    const { error: delErr } = await supabase
      .from("documents")
      .delete()
      .in("id", ids);

    if (delErr) {
      console.error("Failed to delete stale docs:", delErr.message);
      process.exit(1);
    }
    console.log(`  ✓ Cleared ${staleDocs.length} stale Supabase records\n`);
  } else {
    console.log("  No stale public docs found\n");
  }

  console.log("━━━ Step 3: Seed all PDFs ━━━");
  const seedDir = path.resolve(process.cwd(), "seed-pdfs");
  if (!fs.existsSync(seedDir)) {
    throw new Error("seed-pdfs/ directory not found");
  }

  const pdfFiles = fs
    .readdirSync(seedDir)
    .filter(f => f.toLowerCase().endsWith(".pdf"));

  console.log(`Found ${pdfFiles.length} PDF(s) in seed-pdfs/\n`);

  let seeded = 0;
  let failed = 0;

  for (const filename of pdfFiles) {
    process.stdout.write(`  → ${filename} ... `);

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
      console.log(`FAILED (insert): ${docError.message}`);
      failed++;
      continue;
    }

    try {
      const filePath = path.join(seedDir, filename);
      const buffer = fs.readFileSync(filePath);

      const { chunkCount } = await orchestrate(
        doc.id,
        filename,
        null,   // user_id = null for public corpus
        true,   // is_public = true
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      );

      await supabase
        .from("documents")
        .update({ status: "ready", chunk_count: chunkCount })
        .eq("id", doc.id);

      console.log(`✓ ${chunkCount} chunks`);
      seeded++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`FAILED: ${msg}`);

      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", doc.id);

      failed++;
    }
  }

  console.log(`\n━━━ Seed Complete ━━━`);
  console.log(`  Seeded: ${seeded}  Failed: ${failed}  Total: ${pdfFiles.length}`);

  // Final Qdrant count
  const colInfoAfter = await qc.getCollection(COLLECTION_NAME);
  const totalAfter = colInfoAfter.points_count ?? 0;

  const pubAfter = await qc.count(COLLECTION_NAME, {
    filter: { must: [{ key: "is_public", match: { value: true } }] },
    exact: true,
  });

  console.log(`\n  Qdrant total points: ${totalAfter}`);
  console.log(`  Qdrant public points: ${pubAfter.count}`);

  if (seeded > 0 && pubAfter.count > 0) {
    console.log("\n✅ Re-seed successful! RAG should now work for all users.\n");
  } else if (failed > 0) {
    console.log("\n⚠️  Some PDFs failed to ingest. Check errors above.\n");
  }
}

main().catch(err => {
  console.error("\n🚨 Reseed failed:", err);
  process.exit(1);
});
