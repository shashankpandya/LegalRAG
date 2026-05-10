import { QdrantClient } from "@qdrant/js-client-rest";
import type {
  VectorStoreProvider,
  VectorPoint,
  VectorFilter,
  SearchResult,
} from "./types";

function getClient(): QdrantClient {
  return new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
  });
}

/**
 * Qdrant Cloud vector store provider (per ADR-006).
 * Single collection `legal_chunks`, 1024-dim cosine.
 * Payload indexes: user_id (keyword), is_public (bool), doc_id (keyword).
 */
export const qdrantStore: VectorStoreProvider = {
  name: "qdrant-cloud",

  async ensureCollection(name: string, dimension: number): Promise<void> {
    const client = getClient();

    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === name);

    if (!exists) {
      await client.createCollection(name, {
        vectors: { size: dimension, distance: "Cosine" },
      });
    }

    // Ensure payload indexes for filtering
    const indexFields = [
      { field: "user_id", type: "keyword" as const },
      { field: "is_public", type: "bool" as const },
      { field: "doc_id", type: "keyword" as const },
    ];

    for (const { field, type } of indexFields) {
      try {
        await client.createPayloadIndex(name, {
          field_name: field,
          field_schema: type,
          wait: true,
        });
      } catch {
        // Index may already exist — safe to ignore
      }
    }
  },

  async upsert(collection: string, points: VectorPoint[]): Promise<void> {
    const client = getClient();
    await client.upsert(collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  },

  async search(
    collection: string,
    vector: number[],
    filter: VectorFilter,
    limit: number,
  ): Promise<SearchResult[]> {
    const client = getClient();

    // Build Qdrant filter from our generic filter type
    const qdrantFilter: Record<string, unknown> = {};
    if (filter.should) {
      qdrantFilter.should = filter.should.map((f) => ({
        key: f.key,
        match: f.match,
      }));
    }
    if (filter.must) {
      qdrantFilter.must = filter.must.map((f) => ({
        key: f.key,
        match: f.match,
      }));
    }

    const results = await client.search(collection, {
      vector,
      filter: qdrantFilter,
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      id: typeof r.id === "string" ? r.id : String(r.id),
      score: r.score,
      payload: (r.payload as Record<string, unknown>) ?? {},
    }));
  },

  async deleteByFilter(collection: string, filter: VectorFilter): Promise<void> {
    const client = getClient();

    const qdrantFilter: Record<string, unknown> = {};
    if (filter.must) {
      qdrantFilter.must = filter.must.map((f) => ({
        key: f.key,
        match: f.match,
      }));
    }

    await client.delete(collection, {
      wait: true,
      filter: qdrantFilter,
    });
  },
};
