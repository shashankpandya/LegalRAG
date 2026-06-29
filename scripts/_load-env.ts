/**
 * Loads .env.local (and .env as fallback) into process.env before the
 * script runs. Import this as the very first line in every script:
 *
 *   import "./_load-env";
 *
 * Works with `npx tsx scripts/foo.ts` without needing --env-file flag.
 */

import * as fs from "fs";
import * as path from "path";

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    // Skip comments and blank lines
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();

    // Only set if not already in environment (lets shell overrides win)
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const root = path.resolve(__dirname, "..");

// Load in priority order: .env first, then .env.local overrides it
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));
