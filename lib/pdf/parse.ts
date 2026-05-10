import { extractText } from "unpdf";

/**
 * PDF text extraction via unpdf (Node-native, per ADR-002).
 * Returns per-page text arrays for page-level attribution in chunks.
 */
export async function parsePdf(
  buffer: ArrayBuffer,
): Promise<{ pages: string[]; pageCount: number }> {
  const { text, totalPages } = await extractText(new Uint8Array(buffer), {
    mergePages: false,
  });

  // extractText with mergePages:false returns text as string[]
  const pages = (text as unknown as string[]).map((p) => p.trim());

  return {
    pages,
    pageCount: totalPages,
  };
}
