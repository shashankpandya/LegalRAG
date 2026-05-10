# LegalRAG ⚖️

> AI-powered legal compliance assistant for Indian startups — ask questions, get cited answers from official legal documents.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)](https://supabase.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC382D)](https://qdrant.tech/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

---

## 🎯 What it does

| Feature | Description |
|---|---|
| **💬 Chat with citations** | Ask about company registration, GST, DPDP Act, FEMA, and more. Every answer cites the exact document and page number. |
| **📄 Upload your PDFs** | Add private documents to your personal knowledge base. Searchable only by you — fully RLS-isolated. |
| **✅ Compliance tracker** | Auto-generated checklist based on your company type (Pvt Ltd, LLP, Sole Prop, etc.). |
| **🔒 Cross-user isolation** | RLS + Qdrant payload filters ensure User A can never see User B's data. |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router)            │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Landing  │  │  Auth    │  │    Dashboard          │ │
│  │  Page    │  │ Login/   │  │ Chat │ Docs │ Comply  │ │
│  └─────────┘  │ Signup   │  └──┬───┴──┬───┴────┬────┘ │
│               └──────────┘     │      │        │      │
│  ┌─────────────────────────────┴──────┴────────┴────┐ │
│  │              API Routes + Server Actions          │ │
│  │  POST /api/chat (SSE)  │  POST /api/ingest       │ │
│  └──────────┬─────────────┴──────────┬──────────────┘ │
│             │                        │                │
│  ┌──────────┴────────────────────────┴──────────────┐ │
│  │           lib/rag/ (Provider Abstraction)         │ │
│  │  Jina v3   │  Cohere v3.5  │  Groq   │  Qdrant  │ │
│  │ Embeddings │   Reranker    │   LLM   │  Vectors  │ │
│  └──────────┬─┴───────┬───────┴────┬────┴─────┬────┘ │
└─────────────┼─────────┼────────────┼──────────┼──────┘
              │         │            │          │
         Jina API  Cohere API   Groq API   Qdrant Cloud
                                               │
                                        Supabase (Auth + PG + RLS)
```

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React with SSR, RSC, Server Actions |
| Auth + DB | Supabase (PostgreSQL + RLS) | Free tier, row-level security, auth out of the box |
| Vector Store | Qdrant Cloud | Free tier, payload filters for multi-tenancy |
| Embeddings | Jina v3 (1024d) | Best free-tier embedding model for retrieval |
| Reranker | Cohere rerank-v3.5 | Dramatically improves retrieval precision |
| LLM | Groq (Llama 3.3 70B) | Fastest inference, free tier, open-weight model |
| UI | shadcn/ui + Tailwind CSS | Production-grade components, fully customizable |
| Hosting | Vercel (Hobby) | Zero-config Next.js hosting, free tier |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (22+ recommended for native WebSocket)
- **pnpm** 9+
- API keys: [Supabase](https://supabase.com), [Qdrant](https://cloud.qdrant.io), [Jina](https://jina.ai), [Cohere](https://cohere.com), [Groq](https://groq.com)

### 1. Clone & install

```bash
git clone https://github.com/shashankpandya/LegalRAG.git
cd LegalRAG
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in all keys — see .env.example for required variables
```

### 3. Apply database schema

Open your Supabase project → **SQL Editor** → paste `db/schema.sql` → **Run**.

This creates 6 tables with RLS policies:
- `profiles` — user profiles (1:1 with auth.users)
- `documents` — uploaded PDFs + public corpus metadata
- `chats` — chat sessions
- `messages` — chat messages with citations JSONB
- `compliance_items` — per-user compliance checklist
- `ingest_jobs` — ingestion pipeline state tracking

### 4. Seed the legal corpus

Place PDF files in `seed-pdfs/` (Companies Act, GST FAQs, DPDP Act, FEMA, etc.), then:

```bash
pnpm seed        # Ingests all PDFs → Qdrant
pnpm test-rag    # Verify retrieval quality (M2 checkpoint)
```

### 5. Run locally

```bash
pnpm dev
# → http://localhost:3000
```

Sign up → ask *"How do I register a Pvt Ltd in India?"* → watch citations + streaming answer.

## 📁 Project Structure

```
app/
  page.tsx                    # Public landing page
  (auth)/                     # Login, signup pages
  (dashboard)/                # Authenticated pages
    dashboard/page.tsx        #   "Ask a question" input
    chat/page.tsx             #   Chat list
    chat/[id]/page.tsx        #   Chat conversation (SSE consumer)
    documents/page.tsx        #   PDF upload + document table
    compliance/page.tsx       #   Auto-seeded compliance checklist
  api/
    chat/route.ts             # POST → SSE streaming RAG
    ingest/route.ts           # POST → PDF upload pipeline

lib/
  rag/
    providers/                # ADR-011 — vendor abstraction
      types.ts                #   Interfaces: Embedding, Rerank, LLM, VectorStore
      jina-embeddings.ts      #   Jina v3 implementation
      cohere-rerank.ts        #   Cohere rerank-v3.5 implementation
      groq-llm.ts             #   Groq Llama 3.3 implementation
      qdrant-store.ts         #   Qdrant Cloud implementation
      index.ts                #   Provider selection (swap vendors here)
    ingest/                   # ADR-012 — decomposed pipeline
      orchestrate.ts          #   parse → chunk → embed → upsert
      job.ts                  #   ingest_jobs lifecycle
    retrieve.ts               # embed → search top-20 → rerank top-5
    prompts.ts                # System + user prompt templates
    chunker.ts                # Parent-child splitter (2500/512/64)
  actions/                    # Server actions (chats, docs, compliance, auth)
  supabase/                   # Client helpers (browser, server, middleware)
  compliance/seed.ts          # Default checklists by company type

components/
  chat/                       # ChatWindow, MessageBubble, MessageInput, CitationCard
  documents/                  # UploadDropzone, DocumentList
  compliance/                 # ComplianceChecklist
  shared/                     # Sidebar, DisclaimerBanner
  ui/                         # shadcn/ui primitives

db/schema.sql                 # PostgreSQL schema (6 tables + RLS + trigger)
scripts/seed.ts               # Corpus seeder (idempotent)
scripts/test-rag.ts           # Retrieval quality test harness
```

## 🔐 Security

- **Row-Level Security** on all 6 tables — users can only access their own data
- **Qdrant payload filters** — vector search includes `user_id` / `is_public` filters
- **Prompt injection defense** — rigid system prompt + delimited context + 0.2 temperature
- **Server-only API keys** — Jina, Cohere, Groq, Qdrant keys never reach the browser
- **HTTPS everywhere** — Vercel, Supabase, Qdrant Cloud all enforce TLS

## 📋 RAG Pipeline

```
Query → Jina v3 Embed → Qdrant Search (top-20) → Cohere Rerank (top-5) → Groq Stream
                                                                              ↓
                                                              Cited answer with disclaimer
```

**Ingestion:**
```
PDF → unpdf Parse → Parent-Child Chunk (2500/512/64) → Jina Embed (batches of 50) → Qdrant Upsert
```

## 🏛️ Architecture Decisions

| ADR | Decision | Rationale |
|---|---|---|
| ADR-001 | Next.js only, no separate backend | Simplicity; RSC + API routes cover everything |
| ADR-002 | unpdf for PDF parsing | Node-native; no Docker/Python dependency |
| ADR-003 | Supabase for auth + database | Free tier; RLS; managed PostgreSQL |
| ADR-004 | Qdrant Cloud for vectors | Free tier; payload filters for multi-tenancy |
| ADR-005 | Groq + Llama 3.3 70B | Fastest inference; free tier; open-weight |
| ADR-006 | Jina v3 embeddings (1024d) | Best free-tier retrieval model |
| ADR-007 | Cohere rerank-v3.5 | Dramatically improves precision over embedding-only |
| ADR-009 | SSE streaming (not WebSockets) | Works through CDNs; simpler; one-way sufficient |
| ADR-010 | Parent-child chunking | Small chunks for precision, parent for LLM context |
| ADR-011 | Provider abstraction | Swap vendors by changing one import |
| ADR-012 | Hobby-first ingestion | Sync pipeline, capped at 4.5MB/25 pages |

## 📜 License

MIT

## ⚖️ Disclaimer

**LegalRAG provides general information only and does not constitute legal advice.**
The information is based on publicly available legal documents and may not reflect the most current legal developments. Always consult a qualified legal professional for advice specific to your situation.
