import { parsePdf } from "@/lib/pdf/parse";
import { updateJob } from "./job";

/**
 * Parse step — extracts text from PDF buffer, updates job state.
 * Idempotent: re-running just overwrites the result.
 */
export async function parseStep(
  jobId: string,
  buffer: ArrayBuffer,
): Promise<{ pages: string[]; pageCount: number }> {
  await updateJob(jobId, { status: "parsing" });

  const result = await parsePdf(buffer);

  await updateJob(jobId, {
    progress: { pagesParsed: result.pageCount },
  });

  return result;
}
