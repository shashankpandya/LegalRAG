"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Scale, User, Copy, Check, FileText, ChevronRight } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { doc_id: string; doc_name: string; page: number }[] | null;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

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

  const hasCitations = message.citations && message.citations.length > 0;

  return (
    <div className={`group flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
          <Scale className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="relative max-w-[85%] sm:max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground border"
          }`}
        >
          {isStreaming ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
              </span>
              <span>Thinking</span>
            </span>
          ) : (
            <>
              {/* Disclaimer notice at the end of assistant messages */}
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content.split('⚖️').map((part, idx) => (
                  <span key={idx}>
                    {part.trim()}
                    {idx === 0 && message.content.includes('⚖️') && (
                      <>
                        <br /><br />
                        <span className="text-xs italic opacity-70">⚖️ This is general informational guidance, not legal advice. Consult a qualified professional before acting.</span>
                      </>
                    )}
                  </span>
                ))}
              </div>
              
              {/* Inline citations indicator */}
              {!isStreaming && hasCitations && (
                <button
                  onClick={() => setShowCitations(!showCitations)}
                  className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{message.citations!.length} source{message.citations!.length > 1 ? 's' : ''}</span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${showCitations ? 'rotate-90' : ''}`} />
                </button>
              )}
              
              {/* Expanded citations list */}
              {showCitations && hasCitations && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {message.citations!.map((citation, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs bg-background/50 rounded-lg p-2">
                      <FileText className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">{citation.doc_name}</span>
                      <span className="text-muted-foreground">p. {citation.page}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        {!isUser && !isStreaming && message.content && (
          <div className="absolute -bottom-8 left-0 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              title="Copy to clipboard"
              aria-label="Copy message to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
