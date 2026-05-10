"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { CitationCard, type Citation } from "./citation-card";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { doc_id: string; doc_name: string; page: number }[] | null;
  created_at: string;
}

interface ChatWindowProps {
  chatId: string;
  initialMessages: Message[];
  initialQuestion?: string;
}

/**
 * ChatWindow — the core SSE consumer.
 *
 * Holds two separate state buffers per Master Prompt:
 * - `messages` (committed) — the full history
 * - `streamingText` (in-flight) — the single streaming assistant bubble
 *
 * This prevents per-token re-render of the entire message list.
 */
export function ChatWindow({
  chatId,
  initialMessages,
  initialQuestion,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingText, setStreamingText] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initialFired = useRef(false);

  // Auto-fire initial question from ?initial= param
  useEffect(() => {
    if (initialQuestion && !initialFired.current && messages.length === 0) {
      initialFired.current = true;
      handleSubmit(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText]);

  async function handleSubmit(question: string) {
    if (isLoading) return;

    // Optimistically add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: question,
      citations: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setStreamingText("");
    setCitations([]);
    setIsLoading(true);

    try {
      // Build history from current messages (last 6 for the API)
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, question, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || `Error ${res.status}`);
        setIsLoading(false);
        return;
      }

      // Parse SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            // Commit streaming text to messages
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: fullText,
              citations: citations.map((c) => ({
                doc_id: c.doc_id,
                doc_name: c.doc_name,
                page: c.page,
              })),
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingText("");
            setIsLoading(false);
            router.refresh(); // refresh sidebar chat list
            return;
          }

          try {
            const event = JSON.parse(data);
            if (event.type === "citations") {
              setCitations(event.citations || []);
            } else if (event.type === "token") {
              fullText += event.token;
              setStreamingText(fullText);
            } else if (event.type === "error") {
              toast.error(event.message || "Stream error");
              setIsLoading(false);
              return;
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Ask a question about Indian startup compliance
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your answers will be cited from official legal documents.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming assistant bubble */}
        {isLoading && (
          <>
            {citations.length > 0 && (
              <div className="flex gap-2 flex-wrap pl-10">
                {citations.map((c, i) => (
                  <CitationCard key={i} citation={c} />
                ))}
              </div>
            )}
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingText || "Thinking...",
                citations: null,
                created_at: new Date().toISOString(),
              }}
              isStreaming={!streamingText}
            />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <MessageInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </>
  );
}
