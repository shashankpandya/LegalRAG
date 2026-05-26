"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Scale, User, Copy, Check } from "lucide-react";

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
          <Scale className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="relative max-w-[85%] sm:max-w-[75%]">
        <div
          className={`rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-foreground border"
          }`}
        >
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
              </span>
              Thinking
            </span>
          ) : (
            <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
          )}
        </div>

        {!isUser && !isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 py-0.5"
            title="Copy to clipboard"
            aria-label="Copy message to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary ring-1 ring-primary/30">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
