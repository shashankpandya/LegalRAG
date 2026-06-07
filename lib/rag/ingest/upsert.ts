import { createHash } from "crypto";
import { vectorStore } from "@/lib/rag/providers";
import { COLLECTION_NAME, EMBEDDING_DIMENSION } from "@/lib/rag/providers/types";
import type { Chunk } from "@/lib/rag/chunker";
import { updateJob } from "./job";

/**
 * Generate a deterministic UUID from (docId, chunkIndex).
 * Re-ingesting the same doc overwrites existing points, not duplicates.
 */
function deterministicId(docId: string, chunkIndex: number): string {
  const hash = createHash("sha256")
    .update(`${docId}:${chunkIndex}`)
    .digest("hex");
  // Format as UUID-like string for Qdrant
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Upsert step — ensures collection exists, then writes embedded chunks to
 * Qdrant with full payload.
 * Idempotent via deterministic point IDs from (doc_id, chunk_index).
 */
export async function upsertStep(
  jobId: string,
  docId: string,
  docName: string,
  userId: string | null,
  isPublic: boolean,
  chunks: Chunk[],
  vectors: number[][],
): Promise<number> {
  await updateJob(jobId, { status: "upserting" });

  // Ensure the Qdrant collection exists before attempting to write.
  // This is a no-op if it already exists (idempotent).
  await vectorStore.ensureCollection(COLLECTION_NAME, EMBEDDING_DIMENSION);

  const points = chunks.map((chunk, i) => ({
    id: deterministicId(docId, chunk.chunkIndex),
    vector: vectors[i],
    payload: {
      child_text: chunk.childText,
      parent_text: chunk.parentText,
      doc_id: docId,
      doc_name: docName,
      user_id: userId,
      is_public: isPublic,
      page: chunk.page,
      chunk_index: chunk.chunkIndex,
      created_at: Date.now(),
    },
  }));

  // Upsert in batches of 100 points
  const BATCH_SIZE = 100;
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    await vectorStore.upsert(COLLECTION_NAME, batch);

    await updateJob(jobId, {
      progress: { chunksUpserted: Math.min(i + BATCH_SIZE, points.length) },
    });
  }

  return points.length;
}
