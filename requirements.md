# LegalRAG — Requirements

> Condensed specification for the MVP. For full architecture, see the planning repository.

## Functional Requirements

### FR-1 — RAG Chat
Users can ask natural-language questions about Indian startup compliance and receive
streaming, cited answers from a curated corpus of legal documents.

### FR-2 — Citation Display
Every assistant response includes citation cards showing the source document name,
page number, and a text snippet. Citations appear before the answer starts streaming.

### FR-3 — Document Upload
Authenticated users can upload PDF documents (≤ 4.5 MB, ≤ 25 pages). Uploaded documents
are parsed, chunked, embedded, and stored in the vector database. They are searchable
only by the uploading user (RLS + Qdrant filter).

### FR-4 — Compliance Checklist
Users see an auto-generated compliance checklist based on their company type
(private_limited, llp, sole_prop, partnership, opc). Items can be toggled as complete
and state persists across sessions.

### FR-5 — Chat History
Chats are persisted in the database. The sidebar shows the 30 most recent chats.
Reloading the page preserves message history.

### FR-6 — Authentication
Email + password authentication via Supabase Auth. All dashboard routes are protected
by middleware. RLS enforces per-user data isolation at the database level.

### FR-7 — Cross-User Isolation
User A's uploaded documents and chat history are invisible to User B. The public seed
corpus is visible to all authenticated users. Isolation is enforced at both the
Supabase RLS and Qdrant filter layers.

### FR-8 — Legal Disclaimer
A persistent disclaimer banner appears on all authenticated pages. Every assistant
response ends with a disclaimer line. The landing page footer includes the disclaimer.

### FR-9 — Error & Empty States
Every async surface has skeleton loading states. Every list has an empty state with
a clear call-to-action. Failed operations show a toast notification.

## Non-Functional Requirements

### NFR-1 — Performance
- First chat token ≤ 800 ms p95.
- ~500 tokens/sec streaming from Groq.
- PDF ingestion ≤ 30 seconds for in-spec documents.

### NFR-2 — Security
- All API keys are server-only (never exposed to client).
- Prompt injection defense: rigid system prompt + delimited user content + 0.2 temperature.
- Row-Level Security on all 6 tables.
- HTTPS everywhere (Vercel + Supabase + Qdrant).

### NFR-3 — Hosting
- Vercel Hobby plan (free tier).
- Supabase free tier.
- Qdrant Cloud free tier.
- Zero monthly cost for the MVP.

## Architecture Decisions

| ADR | Decision |
|---|---|
| ADR-001 | Next.js only — no separate backend |
| ADR-002 | unpdf for PDF parsing (Node-native) |
| ADR-003 | Supabase for auth + database |
| ADR-004 | Qdrant Cloud for vector storage |
| ADR-005 | Groq + Llama 3.3 70B for LLM |
| ADR-006 | Jina v3 for embeddings (1024d) |
| ADR-007 | Cohere rerank-v3.5 for reranking |
| ADR-008 | shadcn/ui for components |
| ADR-009 | SSE for chat streaming (not WebSockets) |
| ADR-010 | Parent-child chunking (2500/512/64) |
| ADR-011 | Provider abstraction layers |
| ADR-012 | Hobby-first ingestion (sync, capped) |

## Disclaimer

⚖️ LegalRAG provides general information only and does not constitute legal advice.
Always consult a qualified professional for your specific situation.
