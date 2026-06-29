# LegalRAG — Service Renewal & Recovery Guide

When a free-tier cloud service expires or gets deleted, the app breaks silently.
This guide tells you **exactly what expires, when, what breaks, and how to fix it** —
both locally and on Vercel.

---

## Table of Contents

1. [Services used and their expiry behaviour](#1-services-used-and-their-expiry-behaviour)
2. [How to diagnose which service broke](#2-how-to-diagnose-which-service-broke)
3. [Qdrant Cloud — cluster deleted / expired](#3-qdrant-cloud--cluster-deleted--expired)
4. [Jina AI — API key exhausted or expired](#4-jina-ai--api-key-exhausted-or-expired)
5. [Cohere — API key exhausted or expired](#5-cohere--api-key-exhausted-or-expired)
6. [Groq — API key rate-limited or expired](#6-groq--api-key-rate-limited-or-expired)
7. [Supabase — project paused or deleted](#7-supabase--project-paused-or-deleted)
8. [Updating keys locally (.env.local)](#8-updating-keys-locally-envlocal)
9. [Updating keys on Vercel](#9-updating-keys-on-vercel)
10. [Re-seeding the vector database after a reset](#10-re-seeding-the-vector-database-after-a-reset)
11. [Quick-reference checklist](#11-quick-reference-checklist)

---

## 1. Services used and their expiry behaviour

| Service | Purpose | Free tier limit | What happens when it expires |
|---|---|---|---|
| **Qdrant Cloud** | Vector database (stores embedded document chunks) | 1 cluster, 1 GB, **no stated expiry but idle clusters can be deleted** | Every upload fails with `404 Not Found`; chat returns no citations |
| **Jina AI** | Text embeddings (`jina-embeddings-v3`) | 1 million tokens/month free | Uploads fail at embedding step; error says "Jina embedding failed (401/429)" |
| **Cohere** | Reranking (`rerank-v3.5`) | ~1000 rerank calls/month free | **Non-fatal** — app falls back to Qdrant score order automatically |
| **Groq** | LLM (`llama-3.3-70b-versatile`) | Rate-limited; keys don't expire but can hit quota | Chat returns no AI response; stream sends an error event |
| **Supabase** | Postgres DB + Auth | Free project **paused after 1 week of inactivity** | Login fails; no documents or chats load; all API routes return 500 |

---

## 2. How to diagnose which service broke

Run the built-in diagnostic script. It tests every layer independently and
tells you exactly which one failed:

```bash
npx tsx scripts/diagnose-rag.ts
```

Or visit the health endpoint while the dev server is running:

```
http://localhost:3000/api/health
```

Expected response when everything is healthy:

```json
{
  "ok": true,
  "checks": {
    "env":    { "ok": true, "message": "All required env vars present" },
    "qdrant": { "ok": true, "message": "Connected" }
  }
}
```

If `ok` is `false`, the `checks` object tells you exactly which service and why.

**Symptom → likely cause quick lookup:**

| Symptom | Likely broken service |
|---|---|
| Upload fails with "Not Found" or "404" | Qdrant cluster deleted |
| Upload fails with "Jina embedding failed (401)" | Jina API key invalid |
| Upload fails with "Jina embedding failed (429)" | Jina monthly quota exhausted |
| Chat shows "Searching knowledge base…" forever | Qdrant or Jina broken |
| Chat returns an answer but with no citations | Qdrant empty (needs reseed) |
| Chat shows "Stream error" toast | Groq key invalid or rate-limited |
| Login page shows error / app won't load | Supabase project paused |
| `/api/health` returns 503 with `qdrant: Cluster not found (404)` | Qdrant cluster deleted |

---

## 3. Qdrant Cloud — cluster deleted / expired

Qdrant's free tier gives you one cluster. If you haven't used it in a while,
they may delete it without warning.

### Signs

- `/api/health` shows `qdrant: Cluster not found (404)`
- Document upload fails with "Vector database error"
- `npx tsx scripts/diagnose-rag.ts` shows ❌ under "Qdrant Cloud"

### Fix — create a new cluster

1. Go to **[cloud.qdrant.io](https://cloud.qdrant.io)** and sign in
2. Click **"Create cluster"**
   - Name: anything (e.g. `legalrag`)
   - Cloud: GCP or AWS, any region close to you
   - Size: free tier (1 node, 1 GB) is fine
3. Wait ~60 seconds for the cluster to start
4. From the cluster detail page, copy the **Cluster URL**
   - Format: `https://<uuid>.<region>.gcp.cloud.qdrant.io`
5. Go to the **"API Keys"** tab → click **"Create"** → copy the key

### Update the keys (see sections 8 and 9)

```
QDRANT_URL=https://<your-new-cluster-url>
QDRANT_API_KEY=<your-new-api-key>
```

### After updating keys — reseed the vector DB

The new cluster is empty. You must re-index all documents:

```bash
# Reseed the public corpus from seed-pdfs/
npx tsx scripts/reseed.ts

# Verify it worked
npx tsx scripts/diagnose-rag.ts
```

Users will also need to re-upload their own PDFs from the Documents page.

---

## 4. Jina AI — API key exhausted or expired

### Signs

- Upload fails mid-way with "Embedding service error"
- `diagnose-rag.ts` shows ❌ under "Jina Embeddings API" with HTTP 401 or 429

### Fix

1. Go to **[jina.ai](https://jina.ai)** → sign in → **API** section
2. Create a new API key (or check remaining quota — 1M tokens/month free)
3. If quota is exhausted, either wait for the monthly reset or upgrade

### Update the key

```
JINA_API_KEY=jina_<your-new-key>
```

No reseed needed if the key just expired mid-use — already-indexed documents
remain in Qdrant. Only new uploads will fail until the key is replaced.

---

## 5. Cohere — API key exhausted or expired

Cohere is used for reranking search results. The app has a **built-in fallback**:
if Cohere fails, it uses Qdrant's raw score order instead. So this is non-fatal —
answers still appear, just with slightly lower quality ranking.

### Fix (when you want to restore full reranking)

1. Go to **[dashboard.cohere.com](https://dashboard.cohere.com)** → API Keys
2. Create a new key

### Update the key

```
COHERE_API_KEY=<your-new-key>
```

---

## 6. Groq — API key rate-limited or expired

### Signs

- Chat sends the question but the AI never replies
- Dev server console shows `[/api/chat] Stream error: ...`
- `diagnose-rag.ts` shows ❌ under "Groq LLM API"

### Fix

1. Go to **[console.groq.com](https://console.groq.com)** → API Keys
2. Create a new key (free tier; keys don't expire but have rate limits)
3. If you're hitting rate limits, wait a few minutes and try again

### Update the key

```
GROQ_API_KEY=gsk_<your-new-key>
```

---

## 7. Supabase — project paused or deleted

Supabase **pauses free projects after 1 week of inactivity**. This is the most
common surprise for local development.

### Signs

- Login page shows "Invalid API key" or hangs
- All pages return errors or blank states
- `diagnose-rag.ts` shows ❌ under "Supabase"

### Fix — unpause the project

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. Find your project — it will show a "Paused" badge
3. Click **"Restore project"** → wait ~2 minutes
4. No key changes needed — same URL and keys work again

### If the project was deleted (not just paused)

You need to recreate it from scratch:

1. Create a new Supabase project
2. In the SQL Editor, paste and run the entire contents of `db/schema.sql`
3. Under **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Update all three keys (see sections 8 and 9)
5. Re-seed documents (see section 10)

### Prevent pausing

Go to your Supabase project → **Settings → General** → enable
**"Prevent project from pausing"** (requires Pro plan, $25/month).

Alternatively, set a cron job or uptime monitor to ping your app's
`/api/health` endpoint every few days — Supabase considers any DB activity
as "active" and won't pause it.

---

## 8. Updating keys locally (.env.local)

Open `c:\Users\admin\.vscode\Code\legalrag-app\.env.local` and replace the
relevant values. The full file structure:

```bash
# ── Supabase (from supabase.com/dashboard → Project Settings → API) ──
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # keep this secret, never commit

# ── Qdrant (from cloud.qdrant.io → your cluster → API Keys) ──
QDRANT_URL=https://<cluster-id>.<region>.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJ...

# ── Jina AI (from jina.ai → API) ──
JINA_API_KEY=jina_...

# ── Cohere (from dashboard.cohere.com → API Keys) ──
COHERE_API_KEY=...

# ── Groq (from console.groq.com → API Keys) ──
GROQ_API_KEY=gsk_...
```

After editing `.env.local`:

```bash
# Stop the dev server (Ctrl+C) then restart it
pnpm dev
```

**Important:** Next.js only reads `.env.local` at startup. You must restart
the dev server every time you change this file.

### Verify locally

```bash
# Check all services are reachable
npx tsx scripts/diagnose-rag.ts

# Or just check the health endpoint (while dev server is running)
curl http://localhost:3000/api/health
```

---

## 9. Updating keys on Vercel

Environment variables on Vercel are separate from your `.env.local` file.
Changes to `.env.local` do NOT affect your deployed app.

### Steps

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. Click your project → **Settings** → **Environment Variables**
3. Find the variable you need to update (e.g. `QDRANT_URL`)
4. Click the **pencil/edit icon** → paste the new value → **Save**
5. Repeat for each changed key

### Redeploy to apply changes

Environment variable changes don't take effect on already-running deployments.
You must trigger a new deployment:

```bash
# Option A — push any commit (even an empty one)
git commit --allow-empty -m "chore: refresh env vars"
git push

# Option B — redeploy from Vercel dashboard
# Deployments tab → click the latest deployment → "Redeploy"
```

### Which variables go where

| Variable | Local (.env.local) | Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ (mark as Secret) |
| `QDRANT_URL` | ✅ | ✅ |
| `QDRANT_API_KEY` | ✅ | ✅ (mark as Secret) |
| `JINA_API_KEY` | ✅ | ✅ (mark as Secret) |
| `COHERE_API_KEY` | ✅ | ✅ (mark as Secret) |
| `GROQ_API_KEY` | ✅ | ✅ (mark as Secret) |

**Vercel environment scope:** Set all variables to **Production + Preview + Development**
unless you intentionally want different keys per environment.

---

## 10. Re-seeding the vector database after a reset

Any time the Qdrant cluster is recreated, all vectors are lost. You need to
re-index the public corpus (the PDFs in `seed-pdfs/`) and ask users to
re-upload their private PDFs.

### Re-index the public corpus

```bash
# Full force-reseed: clears stale Supabase records then re-ingests everything
npx tsx scripts/reseed.ts
```

Expected output:
```
━━━ Step 1: Ensure Qdrant collection ━━━
✓ Collection "legal_chunks" ready (1024d, cosine)

━━━ Step 2: Delete stale public document records from Supabase ━━━
  Found 13 public document records to clear
  ✓ Cleared 13 stale Supabase records

━━━ Step 3: Seed all PDFs ━━━
  → dpdp-act-2023.pdf ... ✓ 847 chunks
  → gst-gstr1-faqs.pdf ... ✓ 312 chunks
  ...

✅ Re-seed successful! RAG should now work for all users.
```

### Verify retrieval works end-to-end

```bash
npx tsx scripts/test-rag.ts
```

This runs three test questions against the live stack. If you see results with
doc names and page numbers, the RAG pipeline is healthy.

### Private user documents

User-uploaded PDFs are **not** stored in `seed-pdfs/`. Users need to re-upload
them from the Documents page in the app. There is no automated recovery path
for private documents — this is by design (privacy).

---

## 11. Quick-reference checklist

Use this when something breaks and you're not sure where to start.

### Step 1 — Run the diagnostic

```bash
npx tsx scripts/diagnose-rag.ts
```

### Step 2 — Find the broken service and fix it

| Health check result | Action |
|---|---|
| `qdrant: Cluster not found (404)` | Section 3 — create new Qdrant cluster |
| `qdrant: 401 Unauthorized` | Section 3 — create new API key in existing cluster |
| Jina 401 in diagnostic | Section 4 — replace JINA_API_KEY |
| Jina 429 in diagnostic | Section 4 — wait for monthly reset or upgrade |
| Groq error in diagnostic | Section 6 — replace GROQ_API_KEY |
| Supabase connection refused | Section 7 — unpause project |
| `env: Missing: QDRANT_URL` | Section 8 — check .env.local has all keys |

### Step 3 — Update the key

- **Locally:** edit `.env.local` → restart `pnpm dev` → Section 8
- **On Vercel:** Vercel dashboard → Settings → Environment Variables → Section 9

### Step 4 — Reseed if Qdrant was recreated

```bash
npx tsx scripts/reseed.ts
npx tsx scripts/test-rag.ts
```

### Step 5 — Verify everything is green

```bash
npx tsx scripts/diagnose-rag.ts
# All items should show ✅
```

---

## Where to get each key

| Service | Sign-in URL | Where to find the key |
|---|---|---|
| Qdrant | cloud.qdrant.io | Cluster detail page → API Keys tab |
| Jina AI | jina.ai | Top-right menu → API |
| Cohere | dashboard.cohere.com | API Keys section |
| Groq | console.groq.com | API Keys section |
| Supabase | supabase.com/dashboard | Project Settings → API |

---

*Last updated: June 2026. Services and UI may change — check the provider's own docs if a URL has moved.*
