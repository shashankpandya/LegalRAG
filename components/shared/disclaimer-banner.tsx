import { Scale } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div className="border-b bg-amber-50 dark:bg-amber-950/60 px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-amber-800 dark:text-amber-200" role="note" aria-label="Legal disclaimer">
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 sm:gap-2">
        <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-balance">
          LegalRAG provides general informational guidance based on public legal documents. It is{" "}
          <strong>not</strong> legal advice. Always consult a qualified professional before acting.
        </p>
      </div>
    </div>
  );
}
