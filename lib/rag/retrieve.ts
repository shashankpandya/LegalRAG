import { embeddings, rerank, vectorStore } from "./providers";
import {
  COLLECTION_NAME,
  SEARCH_TOP_K,
  RERANK_TOP_N,
} from "./providers/types";
import type { RetrievedContext } from "./prompts";

/**
 * Retrieve pipeline: embed query → search top-20 → rerank to top-5 → return parent contexts.
 *
 * Uses providers exclusively — no direct vendor calls (per ADR-011).
 * Filter pattern: should:[is_public=true, user_id=currentUserId] (per constraints.md § 5).
 */
export async function retrieve(
  query: string,
  userId: string,
): Promise<RetrievedContext[]> {
  // 1. Embed the query
  const [queryVector] = await embeddings.embed([query], "query");

  // 2. Search Qdrant with user isolation filter
  const searchResults = await vectorStore.search(
    COLLECTION_NAME,
    queryVector,
    {
      should: [
        { key: "is_public", match: { value: true } },
        { key: "user_id", match: { value: userId } },
      ],
    },
    SEARCH_TOP_K,
  );

  if (searchResults.length === 0) {
    return [];
  }

  // 3. Rerank with Cohere (fallback to Qdrant order if Cohere fails)
  const childTexts = searchResults.map(
    (r) => (r.payload.child_text as string) || "",
  );

  const reranked = await rerank.rerank(query, childTexts, RERANK_TOP_N);

  // 4. Gather parent text from the reranked results
  const contexts: RetrievedContext[] = reranked.map((r) => {
    const original = searchResults[r.index];
    return {
      docName: (original.payload.doc_name as string) || "Unknown",
      page: (original.payload.page as number) || 0,
      parentText: (original.payload.parent_text as string) || "",
      docId: (original.payload.doc_id as string) || "",
      score: r.score,
    };
  });

  return contexts;
}
