"use client";

import { useState, Suspense, lazy } from "react";
import { toast } from "sonner";
import { Scale, User, Copy, Check, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { CitationCard } from "./citation-card";

// Lazy-load the markdown renderer — ~40 KB gzipped, only needed for
// assistant messages, so excluded from the initial JS bundle.
const MarkdownRenderer = lazy(() => import("./markdown-renderer"));

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { doc_id: string; doc_name: string; page: number; snippet?: string }[] | null;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [citationsExpanded, setCitationsExpanded] = useState(true);

  // Deduplicate citations by doc_id + page so the same page isn't listed twice
  const citations = message.citations
    ? Array.from(
        new Map(
          message.citations.map((c) => [`${c.doc_id}::${c.page}`, c]),
        ).values(),
      ).map((c) => ({
        doc_id: c.doc_id,
        doc_name: c.doc_name,
        page: c.page,
        snippet: c.snippet,
      }))
    : [];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <div className={`group flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
      )}

      <div className="relative max-w-[85%] sm:max-w-[75%] min-w-0">
        {/* Message bubble */}
        <div
          className={`rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-foreground border"
          }`}
        >
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-muted-foreground" aria-label="Thinking">
              <span className="flex gap-0.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
              </span>
              Thinking
            </span>
          ) : isUser ? (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
          ) : (
            <Suspense fallback={
              <div className="animate-pulse space-y-1.5">
                <div className="h-3 w-full rounded bg-muted-foreground/10" />
                <div className="h-3 w-4/5 rounded bg-muted-foreground/10" />
                <div className="h-3 w-3/5 rounded bg-muted-foreground/10" />
              </div>
            }>
              <MarkdownRenderer content={message.content} />
            </Suspense>
          )}
        </div>

        {/* ── Persistent citations — shown permanently under every assistant message ── */}
        {!isUser && !isStreaming && citations.length > 0 && (
          <div className="mt-2.5 rounded-lg border bg-card/60 overflow-hidden">
            {/* Collapsible header */}
            <button
              onClick={() => setCitationsExpanded((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-expanded={citationsExpanded}
              aria-controls={`citations-${message.id}`}
            >
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-foreground">
                  {citations.length} source{citations.length > 1 ? "s" : ""} used
                </span>
              </div>
              {citationsExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              )}
            </button>

            {/* Citation cards */}
            {citationsExpanded && (
              <div
                id={`citations-${message.id}`}
                className="px-3 pb-3 pt-1 grid gap-2 sm:grid-cols-2"
              >
                {citations.map((c, i) => (
                  <CitationCard
                    key={`${c.doc_id}-${c.page}-${i}`}
                    citation={{
                      doc_name: c.doc_name,
                      doc_id: c.doc_id,
                      page: c.page,
                    }}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Copy button */}
        {!isUser && !isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 py-0.5"
            title="Copy to clipboard"
            aria-label="Copy message to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary ring-1 ring-primary/30">
          <User className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
