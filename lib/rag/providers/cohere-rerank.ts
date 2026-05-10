import type { RerankProvider, RerankResult } from "./types";

const COHERE_API_URL = "https://api.cohere.com/v2/rerank";

/**
 * Cohere rerank-v3.5 — REST-only, no SDK (per ADR-004).
 * Includes fallback: if Cohere fails, returns the first topN docs by original order
 * (i.e. Qdrant's raw score). This keeps the pipeline functional during outages.
 */
export const cohereRerank: RerankProvider = {
  name: "cohere-rerank-v3.5",

  async rerank(
    query: string,
    documents: string[],
    topN: number,
  ): Promise<RerankResult[]> {
    try {
      const response = await fetch(COHERE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COHERE_API_KEY!}`,
        },
        body: JSON.stringify({
          model: "rerank-v3.5",
          query,
          documents,
          top_n: topN,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cohere rerank failed (${response.status}): ${errorText}`);
        // Fallback: return first topN by original order (Qdrant score order)
        return documents.slice(0, topN).map((_, i) => ({ index: i, score: 0 }));
      }

      const data = (await response.json()) as {
        results: { index: number; relevance_score: number }[];
      };

      return data.results.map((r) => ({
        index: r.index,
        score: r.relevance_score,
      }));
    } catch (error) {
      console.error("Cohere rerank error, falling back to Qdrant order:", error);
      // Fallback: return first topN by original order
      return documents.slice(0, topN).map((_, i) => ({ index: i, score: 0 }));
    }
  },
};
