import { chunkDocument, type Chunk } from "@/lib/rag/chunker";
import { updateJob } from "./job";

/**
 * Chunk step — splits pages into parent/child chunks, updates job state.
 * Idempotent: re-running produces the same chunks.
 */
export async function chunkStep(
  jobId: string,
  pages: string[],
): Promise<Chunk[]> {
  await updateJob(jobId, { status: "chunking" });

  const chunks = await chunkDocument(pages);

  await updateJob(jobId, {
    progress: { chunksTotal: chunks.length },
  });

  return chunks;
}
