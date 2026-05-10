import { Scale } from "lucide-react";

/**
 * Persistent legal disclaimer banner — renders at the top of the dashboard layout.
 *
 * Non-negotiable per Master Prompt. Built in Sprint 01 so it's never an afterthought.
 * Copy sourced from docs/security/legal-disclaimer-strategy.md.
 *
 * Server Component — no client-side interactivity needed.
 */
export function DisclaimerBanner() {
  return (
    <div className="border-b bg-amber-50 dark:bg-amber-950 px-4 py-2 text-xs text-amber-900 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <Scale className="h-3.5 w-3.5 flex-shrink-0" />
        <p>
          LegalRAG provides general informational guidance based on public legal documents. It is{" "}
          <strong>not</strong> legal advice. Always consult a qualified professional before acting.
        </p>
      </div>
    </div>
  );
}
