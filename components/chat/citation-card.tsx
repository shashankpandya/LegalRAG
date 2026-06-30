"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, ExternalLink, BookOpen } from "lucide-react";

export interface Citation {
  doc_name: string;
  doc_id: string;
  page: number;
  snippet?: string;
}

interface CitationCardProps {
  citation: Citation;
  compact?: boolean;
}

export function CitationCard({ citation, compact = false }: CitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`flex items-start gap-2.5 rounded-lg border bg-card p-2.5 text-left transition-all duration-200 hover:bg-accent hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full`}
      aria-expanded={expanded}
      aria-label={`Source: ${citation.doc_name}, page ${citation.page}. ${expanded ? "Click to collapse" : "Click to expand snippet"}`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1.5">
          <p className="font-medium text-xs leading-snug truncate" title={citation.doc_name}>
            {citation.doc_name}
          </p>
          <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground shrink-0 tabular-nums">
            p.{citation.page}
          </span>
        </div>

        {expanded && citation.snippet && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed border-t pt-1.5 line-clamp-4">
            &ldquo;{citation.snippet}&rdquo;
          </p>
        )}

        {!expanded && citation.snippet && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1 opacity-70">
            {citation.snippet}
          </p>
        )}
      </div>
      <div className="shrink-0 mt-0.5">
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
    </button>
  );
}
