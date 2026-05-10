import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface Chunk {
  childText: string;
  parentText: string;
  page: number;
  chunkIndex: number;
}

const parentSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2500,
  chunkOverlap: 64,
  separators: ["\n\n", "\n", ".", " ", ""],
});

const childSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 64,
  separators: ["\n\n", "\n", ".", " ", ""],
});

/**
 * Parent-child chunker per ADR-008.
 * - Parent chunks (2500 chars) → sent to LLM for context.
 * - Child chunks (512 chars) → embedded and searched in Qdrant.
 * Each child carries its parent text in the payload.
 *
 * @param pages - Per-page text from parsePdf()
 * @returns Array of Chunk objects with page attribution
 */
export async function chunkDocument(pages: string[]): Promise<Chunk[]> {
  const chunks: Chunk[] = [];
  let globalChunkIndex = 0;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageText = pages[pageIdx];
    if (!pageText || pageText.trim().length === 0) continue;

    // Split page into parent chunks
    const parentChunks = await parentSplitter.splitText(pageText);

    for (const parentText of parentChunks) {
      // Split each parent into child chunks
      const childChunks = await childSplitter.splitText(parentText);

      for (const childText of childChunks) {
        chunks.push({
          childText,
          parentText,
          page: pageIdx + 1, // 1-indexed pages
          chunkIndex: globalChunkIndex++,
        });
      }
    }
  }

  return chunks;
}
