/**
 * RAG Diagnostic Script
 * Run: npx tsx scripts/diagnose-rag.ts
 *
 * Tests each layer of the RAG pipeline independently and reports
 * exactly where the failure is.
 */

import "./_load-env";
import WebSocket from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error
  globalThis.WebSocket = WebSocket;
}

// ── Helpers ──────────────────────────────────────────────────────
function ok(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.log(`  ❌ ${msg}`); }
function info(msg: string) { console.log(`  ℹ️  ${msg}`); }
function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

async function main() {
  // ── 1. Env vars ────────────────────────────────────────────────
  section("1. Environment Variables");

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "QDRANT_URL",
    "QDRANT_API_KEY",
    "JINA_API_KEY",
    "COHERE_API_KEY",
    "GROQ_API_KEY",
  ];

  let envOk = true;
  for (const key of required) {
    const val = process.env[key];
    if (!val) {
      fail(`${key} is MISSING or empty`);
      envOk = false;
    } else {
      ok(`${key} = ${val.slice(0, 12)}...`);
    }
  }

  if (!envOk) {
    console.log("\n🚨 Fix missing env vars first — aborting.\n");
    process.exit(1);
  }

  // ── 2. Jina Embedding ──────────────────────────────────────────
  section("2. Jina Embeddings API");

  let queryVector: number[] | null = null;
  try {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        input: ["How do I register a company in India?"],
        task: "retrieval.query",
        dimensions: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      fail(`Jina API returned HTTP ${res.status}: ${err.slice(0, 300)}`);
    } else {
      const data = (await res.json()) as { data: { embedding: number[] }[] };
      const vec = data.data[0]?.embedding;
      if (!vec || vec.length !== 1024) {
        fail(`Bad embedding — got length ${vec?.length ?? "undefined"} (expected 1024)`);
      } else {
        ok(`Got 1024-dim embedding. First 3: [${vec.slice(0, 3).map(v => v.toFixed(4)).join(", ")}]`);
        queryVector = vec;
      }
    }
  } catch (e) {
    fail(`Jina call threw: ${e}`);
  }

  // ── 3. Qdrant ──────────────────────────────────────────────────
  section("3. Qdrant Cloud — Collection & Point Count");

  let qdrantHasData = false;
  const COLLECTION = "legal_chunks";

  try {
    const { QdrantClient } = await import("@qdrant/js-client-rest");
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
    });

    const cols = await client.getCollections();
    const colNames = cols.collections.map((c) => c.name);
    info(`Collections: [${colNames.join(", ") || "none"}]`);

    if (!colNames.includes(COLLECTION)) {
      fail(`Collection "${COLLECTION}" does NOT exist — run: pnpm seed`);
    } else {
      ok(`Collection "${COLLECTION}" exists`);

      const colInfo = await client.getCollection(COLLECTION);
      const totalPoints = colInfo.points_count ?? 0;
      info(`Total points: ${totalPoints}`);

      if (totalPoints === 0) {
        fail(`Collection has 0 points — seed has not run or failed silently`);
      } else {
        ok(`${totalPoints} points in Qdrant`);
        qdrantHasData = true;

        // Count public points
        try {
          const pubResult = await client.count(COLLECTION, {
            filter: { must: [{ key: "is_public", match: { value: true } }] },
            exact: true,
          });
          info(`Public points (is_public=true): ${pubResult.count}`);
          if (pubResult.count === 0) {
            fail("0 public points — seeded docs may have been stored with wrong is_public value");
          } else {
            ok(`${pubResult.count} public points available to all users`);
          }
        } catch (e) {
          info(`Could not count public points: ${e}`);
        }

        // Peek at a few raw points
        if (queryVector) {
          section("3b. Raw Search (no filter) — Sanity Check");
          const rawResults = await client.search(COLLECTION, {
            vector: queryVector,
            limit: 3,
            with_payload: true,
          });
          if (rawResults.length === 0) {
            fail("Raw search (no filter) returned 0 — collection may be corrupted");
          } else {
            ok(`Raw search returned ${rawResults.length} results`);
            rawResults.forEach((r, i) => {
              const p = r.payload as Record<string, unknown>;
              info(`  [${i + 1}] score=${r.score.toFixed(4)} doc="${p.doc_name}" p.${p.page} is_public=${p.is_public} user_id=${p.user_id ?? "null"}`);
            });
          }

          section("3c. Filtered Search (is_public=true)");
          const filteredResults = await client.search(COLLECTION, {
            vector: queryVector,
            filter: {
              should: [{ key: "is_public", match: { value: true } }],
            } as Record<string, unknown>,
            limit: 3,
            with_payload: true,
          });
          if (filteredResults.length === 0) {
            fail("Filtered search (is_public=true) returned 0 results");
            info("Root cause: is_public payload stored as wrong type or payload index missing");
          } else {
            ok(`Filtered search returned ${filteredResults.length} results ✓`);
          }
        }
      }
    }
  } catch (e) {
    fail(`Qdrant call threw: ${e}`);
  }

  // ── 4. Cohere ─────────────────────────────────────────────────
  section("4. Cohere Rerank API");

  try {
    const res = await fetch("https://api.cohere.com/v2/rerank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "rerank-v3.5",
        query: "company registration India",
        documents: ["Register a company in India", "GST filing deadline", "Annual ROC compliance"],
        top_n: 2,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      fail(`Cohere HTTP ${res.status}: ${err.slice(0, 200)}`);
      info("Cohere failure is non-fatal — app falls back to Qdrant score order");
    } else {
      const data = await res.json() as { results: { index: number; relevance_score: number }[] };
      ok(`Cohere OK — top result: index=${data.results[0]?.index} score=${data.results[0]?.relevance_score?.toFixed(4)}`);
    }
  } catch (e) {
    fail(`Cohere threw: ${e}`);
    info("Cohere failure is non-fatal — app falls back to Qdrant score order");
  }

  // ── 5. Full retrieve() ─────────────────────────────────────────
  section("5. Full RAG retrieve() Pipeline");

  if (queryVector && qdrantHasData) {
    try {
      const { retrieve } = await import("../lib/rag/retrieve");
      const DUMMY_USER = "00000000-0000-0000-0000-000000000000";
      const results = await retrieve(
        "How do I register a Pvt Ltd company in India?",
        DUMMY_USER
      );

      if (results.length === 0) {
        fail("retrieve() returned 0 results even though Qdrant has data");
        info("Root cause: the should-filter logic or payload type mismatch");
      } else {
        ok(`retrieve() returned ${results.length} context(s) ✓`);
        results.forEach((r, i) => {
          info(`  [${i + 1}] "${r.docName}" p.${r.page} score=${r.score.toFixed(4)}`);
          info(`       ${r.parentText.slice(0, 120).replace(/\n/g, " ")}...`);
        });
      }
    } catch (e) {
      fail(`retrieve() threw: ${e}`);
    }
  } else {
    info("Skipping retrieve() — Jina or Qdrant step failed");
  }

  // ── 6. Groq LLM ───────────────────────────────────────────────
  section("6. Groq LLM API");

  try {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      temperature: 0,
      max_tokens: 5,
      stream: false,
    });
    const reply = completion.choices[0]?.message?.content ?? "";
    ok(`Groq responded: "${reply.trim()}"`);
  } catch (e) {
    fail(`Groq threw: ${e}`);
  }

  // ── 7. Supabase DB ─────────────────────────────────────────────
  section("7. Supabase — Documents & Ingest Jobs");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: docs } = await supabase
      .from("documents")
      .select("id, name, status, chunk_count, is_public")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!docs || docs.length === 0) {
      info("No documents in DB — run pnpm seed");
    } else {
      info("Recent documents in Supabase:");
      docs.forEach((d) => {
        const icon = d.status === "ready" ? "✅" : "❌";
        info(`  ${icon} "${d.name}" | status=${d.status} | chunks=${d.chunk_count ?? 0} | is_public=${d.is_public}`);
      });
    }

    const { data: failedJobs } = await supabase
      .from("ingest_jobs")
      .select("id, status, error, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5);

    if (failedJobs && failedJobs.length > 0) {
      fail(`${failedJobs.length} failed ingest job(s):`);
      failedJobs.forEach((j) => {
        info(`  Error: ${j.error ?? "no error message stored"}`);
      });
    } else {
      ok("No failed ingest jobs");
    }
  } catch (e) {
    fail(`Supabase threw: ${e}`);
  }

  section("DIAGNOSIS COMPLETE");
  console.log("  ✅ items are working correctly.");
  console.log("  ❌ items need to be fixed.\n");
}

main().catch((e) => {
  console.error("\n🚨 Diagnostic crashed:", e);
  process.exit(1);
});
