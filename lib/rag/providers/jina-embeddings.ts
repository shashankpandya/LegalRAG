import type { EmbeddingProvider, EmbeddingTask } from "./types";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";

/**
 * Jina embeddings v3 — REST-only, no SDK (per ADR-003).
 * Uses `task` to differentiate passage vs query embedding (critical for retrieval quality).
 * Batches handled by caller (max 50 texts per call per constraints.md).
 */
export const jinaEmbeddings: EmbeddingProvider = {
  name: "jina-v3",
  dimension: 1024,

  async embed(texts: string[], task: EmbeddingTask): Promise<number[][]> {
    const jinaTask = task === "passage" ? "retrieval.passage" : "retrieval.query";

    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JINA_API_KEY!}`,
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        input: texts,
        task: jinaTask,
        dimensions: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina embedding failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      data: { embedding: number[] }[];
    };

    return data.data.map((item) => item.embedding);
  },
};
