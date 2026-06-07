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
 * Service-role key bypasses RLS — only used server-side.
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
      progress: {},
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

  // Build update payload
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.error !== undefined) payload.error = updates.error;

  // For progress: fetch current, merge, then write back.
  // This ensures we don't clobber progress keys from prior steps.
  if (updates.progress !== undefined) {
    const { data: current } = await supabase
      .from("ingest_jobs")
      .select("progress")
      .eq("id", jobId)
      .single();

    payload.progress = {
      ...(current?.progress as Record<string, number> | null ?? {}),
      ...updates.progress,
    };
  }

  const { error } = await supabase
    .from("ingest_jobs")
    .update(payload)
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
