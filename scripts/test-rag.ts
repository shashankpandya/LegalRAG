import "./_load-env";
import { retrieve } from "../lib/rag/retrieve";

/**
 * Test RAG harness — the M2 checkpoint.
 *
 * Run: npx tsx scripts/test-rag.ts
 *
 * Hardcodes 3 canonical questions and prints top-5 reranked chunks.
 * Do NOT proceed to Sprint 04 until these return sensible results.
 */

const TEST_QUESTIONS = [
  "How do I register a Pvt Ltd in India?",
  "What is the GST registration threshold for service businesses?",
  "What rights do data principals have under the DPDP Act?",
];

// Placeholder user ID — only public corpus matches (is_public=true)
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  console.log("=== LegalRAG Test Harness (M2 Checkpoint) ===\n");

  for (const question of TEST_QUESTIONS) {
    console.log(`Q: ${question}`);
    console.log("-".repeat(60));

    try {
      const results = await retrieve(question, PLACEHOLDER_USER_ID);

      if (results.length === 0) {
        console.log("  No results found. Check if corpus is seeded.\n");
        continue;
      }

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const snippet = r.parentText.slice(0, 200).replace(/\n/g, " ");
        console.log(
          `  [${i + 1}] Doc: ${r.docName}, p.${r.page} | score: ${r.score.toFixed(4)}`,
        );
        console.log(`      ${snippet}...`);
      }
    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log();
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
