"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export interface Citation {
  doc_name: string;
  doc_id: string;
  page: number;
  snippet?: string;
}

interface CitationCardProps {
  citation: Citation;
}

export function CitationCard({ citation }: CitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="flex items-start gap-2 rounded-md border bg-card p-2 text-xs max-w-[280px] w-full sm:w-auto text-left transition-all duration-200 hover:bg-accent hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      title={expanded ? "Click to collapse" : "Click to expand"}
      aria-expanded={expanded}
      aria-label={`Citation: ${citation.doc_name}, page ${citation.page}`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate" title={citation.doc_name}>
          {citation.doc_name}
        </p>
        <p className="text-muted-foreground">
          p. {citation.page}
        </p>
        {citation.snippet && (
          <p
            className={`text-muted-foreground mt-1 text-[11px] leading-relaxed ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {citation.snippet}
          </p>
        )}
      </div>
      <div className="shrink-0 mt-0.5">
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
