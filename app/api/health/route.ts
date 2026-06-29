import { QdrantClient } from "@qdrant/js-client-rest";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * GET /api/health — checks connectivity to Qdrant and Jina/Groq/Cohere API key presence.
 * Used by the frontend to surface configuration issues to admins.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; message: string }> = {};

  // 1. Environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "QDRANT_URL",
    "QDRANT_API_KEY",
    "JINA_API_KEY",
    "GROQ_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  checks.env = {
    ok: missingVars.length === 0,
    message: missingVars.length === 0
      ? "All required env vars present"
      : `Missing: ${missingVars.join(", ")}`,
  };

  // 2. Qdrant connectivity
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
    });
    await client.getCollections();
    checks.qdrant = { ok: true, message: "Connected" };
  } catch (err) {
    checks.qdrant = {
      ok: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return Response.json(
    { ok: allOk, checks },
    { status: allOk ? 200 : 503 },
  );
}
