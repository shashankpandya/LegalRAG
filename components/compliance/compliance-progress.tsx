"use client";

import { useState, useEffect } from "react";

interface ComplianceProgressProps {
  totalItems: number;
  initialCompleted: number;
}

/**
 * Client component for the compliance progress bar.
 * Listens for a custom "compliance-toggle" event dispatched by the checklist
 * so it updates instantly when tasks are toggled.
 */
export function ComplianceProgress({ totalItems, initialCompleted }: ComplianceProgressProps) {
  const [completed, setCompleted] = useState(initialCompleted);

  useEffect(() => {
    function handleToggle(e: CustomEvent<{ delta: number }>) {
      setCompleted((prev) => Math.max(0, Math.min(totalItems, prev + e.detail.delta)));
    }
    window.addEventListener("compliance-toggle" as string, handleToggle as EventListener);
    return () => {
      window.removeEventListener("compliance-toggle" as string, handleToggle as EventListener);
    };
  }, [totalItems]);

  if (totalItems === 0) return null;

  const pct = Math.round((completed / totalItems) * 100);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <span className="text-lg">{completed === totalItems ? "🎉" : "📊"}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {completed === totalItems
            ? "All compliance items complete!"
            : `${completed} of ${totalItems} items completed`}
        </p>
        <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% compliance complete`}
          />
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
