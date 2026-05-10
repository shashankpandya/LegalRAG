import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";

// Polyfill WebSocket for Node.js 20 (needed by Supabase realtime-js)
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error — ws is compatible enough for Supabase's needs
  globalThis.WebSocket = WebSocket;
}

type JobStatus =
  | "pending"
  | "parsing"
  | "chunking"
  | "embedding"
  | "upserting"
  | "ready"
  | "failed";

interface IngestJob {
  id: string;
  documentId: string;
  userId: string | null;
  status: JobStatus;
  progress: Record<string, number> | null;
  error: string | null;
  attempts: number;
}

/**
 * Creates a Supabase service-role client for job operations.
 * Used by seed.ts and ingest orchestration (server-only).
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function createJob(
  documentId: string,
  userId: string | null,
): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("ingest_jobs")
    .insert({
      document_id: documentId,
      user_id: userId,
      status: "pending",
      attempts: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create ingest job: ${error.message}`);
  return data.id;
}

export async function updateJob(
  jobId: string,
  updates: {
    status?: JobStatus;
    progress?: Record<string, number>;
    error?: string | null;
  },
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("ingest_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) throw new Error(`Failed to update ingest job: ${error.message}`);
}

export async function getJob(jobId: string): Promise<IngestJob> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("ingest_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw new Error(`Failed to get ingest job: ${error.message}`);

  return {
    id: data.id,
    documentId: data.document_id,
    userId: data.user_id,
    status: data.status,
    progress: data.progress,
    error: data.error,
    attempts: data.attempts,
  };
}

export type { JobStatus, IngestJob };
