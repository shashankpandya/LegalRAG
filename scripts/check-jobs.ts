import "./_load-env";
import WebSocket from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error
  globalThis.WebSocket = WebSocket;
}
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await sb
    .from("ingest_jobs")
    .select("id, status, error, progress, document_id, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.log("Query error:", JSON.stringify(error));
  } else {
    console.log("Jobs:", JSON.stringify(data, null, 2));
  }

  // Also check what docs are in Supabase and if they have matching Qdrant vectors
  const { data: docs } = await sb
    .from("documents")
    .select("id, name, status, chunk_count, is_public, user_id")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  console.log("\nPublic documents in Supabase:", JSON.stringify(docs, null, 2));
}

main().catch(console.error);
