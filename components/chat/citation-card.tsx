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
      className={`flex items-start gap-2.5 rounded-lg border bg-card p-3 text-left transition-all duration-200 hover:bg-accent hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        compact ? "max-w-[200px] w-full sm:w-auto" : "w-full max-w-md"
      }`}
      title={expanded ? "Click to collapse" : "Click to expand"}
      aria-expanded={expanded}
      aria-label={`Citation: ${citation.doc_name}, page ${citation.page}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <BookOpen className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate" title={citation.doc_name}>
            {citation.doc_name}
          </p>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
            p. {citation.page}
          </span>
        </div>
        
        {expanded && citation.snippet && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t pt-2">
            &ldquo;{citation.snippet}&rdquo;
          </p>
        )}
        
        {!expanded && citation.snippet && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-1">
            {citation.snippet}
          </p>
        )}
      </div>
      <div className="shrink-0 mt-1">
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
