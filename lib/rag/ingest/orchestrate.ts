import { createJob, updateJob } from "./job";
import { parseStep } from "./parse";
import { chunkStep } from "./chunk";
import { embedStep } from "./embed";
import { upsertStep } from "./upsert";

/**
 * Orchestrate — runs the full ingestion pipeline sequentially.
 *
 * Synchronous in MVP (per ADR-012). Same code can be resumed from any step
 * by a future job runner without rewrites.
 *
 * @returns The number of chunks upserted.
 */
export async function orchestrate(
  documentId: string,
  docName: string,
  userId: string | null,
  isPublic: boolean,
  buffer: ArrayBuffer,
): Promise<{ jobId: string; chunkCount: number }> {
  const jobId = await createJob(documentId, userId);

  try {
    // Step 1: Parse PDF
    const { pages } = await parseStep(jobId, buffer);

    // Step 2: Chunk into parent/child
    const chunks = await chunkStep(jobId, pages);

    // Step 3: Embed child chunks
    const vectors = await embedStep(jobId, chunks);

    // Step 4: Upsert to Qdrant
    const chunkCount = await upsertStep(
      jobId,
      documentId,
      docName,
      userId,
      isPublic,
      chunks,
      vectors,
    );

    // Mark complete
    await updateJob(jobId, { status: "ready" });

    return { jobId, chunkCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateJob(jobId, { status: "failed", error: message });
    throw error;
  }
}
