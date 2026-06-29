"use client";

import { useEffect, useState } from "react";

export type ServiceStatus = "unknown" | "ok" | "degraded" | "down";

interface HealthResult {
  status: ServiceStatus;
  /** Human-readable detail when not ok */
  message?: string;
}

/**
 * Polls /api/health once on mount (and again when the window regains focus).
 * Returns the current service status so the UI can surface warnings.
 */
export function useServiceHealth(): HealthResult {
  const [result, setResult] = useState<HealthResult>({ status: "unknown" });

  async function check() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json().catch(() => ({ ok: false }));

      if (res.ok && data.ok) {
        setResult({ status: "ok" });
      } else {
        // Build a brief message from the checks object
        const failingChecks: string[] = [];
        if (data.checks) {
          for (const [key, val] of Object.entries(
            data.checks as Record<string, { ok: boolean; message: string }>,
          )) {
            if (!val.ok) failingChecks.push(`${key}: ${val.message}`);
          }
        }
        setResult({
          status: "degraded",
          message: failingChecks.length
            ? failingChecks.join(" · ")
            : "Some services may be unavailable",
        });
      }
    } catch {
      // If the health endpoint itself is unreachable, don't alarm the user
      // (they may be offline temporarily)
      setResult({ status: "unknown" });
    }
  }

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return result;
}
