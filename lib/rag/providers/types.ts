/**
 * Provider abstraction types — per ADR-011.
 * All vendor calls go through these interfaces.
 * The locked-stack implementations are in sibling files.
 */

// ── Embeddings ──────────────────────────────────────────────────

export type EmbeddingTask = "passage" | "query";

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimension: number;
  embed(texts: string[], task: EmbeddingTask): Promise<number[][]>;
}

// ── Reranker ────────────────────────────────────────────────────

export interface RerankResult {
  index: number;
  score: number;
}

export interface RerankProvider {
  readonly name: string;
  rerank(query: string, documents: string[], topN: number): Promise<RerankResult[]>;
}

// ── LLM ─────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  temperature: number;
  maxTokens: number;
  model: string;
};

export interface LLMProvider {
  readonly name: string;
  stream(messages: ChatMessage[], options: LLMOptions): AsyncIterable<string>;
}

// ── Vector Store ────────────────────────────────────────────────

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
};

export type VectorFilter = {
  should?: { key: string; match: { value: unknown } }[];
  must?: { key: string; match: { value: unknown } }[];
};

export type SearchResult = {
  id: string;
  score: number;
  payload: Record<string, unknown>;
};

export interface VectorStoreProvider {
  readonly name: string;
  ensureCollection(name: string, dimension: number): Promise<void>;
  upsert(collection: string, points: VectorPoint[]): Promise<void>;
  search(
    collection: string,
    vector: number[],
    filter: VectorFilter,
    limit: number,
  ): Promise<SearchResult[]>;
  deleteByFilter(collection: string, filter: VectorFilter): Promise<void>;
}

// ── Shared constants ────────────────────────────────────────────

export const COLLECTION_NAME = "legal_chunks";
export const EMBEDDING_DIMENSION = 1024;
export const SEARCH_TOP_K = 20;
export const RERANK_TOP_N = 5;
export const EMBEDDING_BATCH_SIZE = 50;
