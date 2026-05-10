/**
 * Provider selection — the ONLY place that names a vendor outside the impl files.
 * Per ADR-011: swap a provider by changing one import line here.
 */
import { jinaEmbeddings } from "./jina-embeddings";
import { cohereRerank } from "./cohere-rerank";
import { groqLlm } from "./groq-llm";
import { qdrantStore } from "./qdrant-store";

export const embeddings = jinaEmbeddings;
export const rerank = cohereRerank;
export const llm = groqLlm;
export const vectorStore = qdrantStore;
