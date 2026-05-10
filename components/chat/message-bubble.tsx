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

/**
 * MessageBubble — renders user vs assistant messages differently.
 * Copy button on assistant messages. Streaming pulse animation.
 */
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Scale className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="relative max-w-[80%]">
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {isStreaming ? (
            <span className="animate-pulse text-muted-foreground">Thinking...</span>
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>

        {/* Copy button (assistant only, not while streaming) */}
        {!isUser && !isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            title="Copy to clipboard"
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
