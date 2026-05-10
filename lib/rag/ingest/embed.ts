import { embeddings } from "@/lib/rag/providers";
import { EMBEDDING_BATCH_SIZE } from "@/lib/rag/providers/types";
import type { Chunk } from "@/lib/rag/chunker";
import { updateJob } from "./job";

/**
 * Embed step — batches child texts through the embedding provider.
 * Batches of 50 per constraints.md (Jina rate limit).
 * Idempotent at chunk level: same text → same vector.
 */
export async function embedStep(
  jobId: string,
  chunks: Chunk[],
): Promise<number[][]> {
  await updateJob(jobId, { status: "embedding" });

  const allVectors: number[][] = [];
  const texts = chunks.map((c) => c.childText);

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const vectors = await embeddings.embed(batch, "passage");
    allVectors.push(...vectors);

    await updateJob(jobId, {
      progress: { chunksEmbedded: allVectors.length },
    });
  }

  return allVectors;
}
