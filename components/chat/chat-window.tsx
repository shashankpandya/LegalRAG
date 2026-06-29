"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { CitationCard, type Citation } from "./citation-card";
import { Scale, AlertCircle, Loader2, WifiOff } from "lucide-react";
import { useServiceHealth } from "@/lib/hooks/use-service-health";

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

interface CitationEvent {
  type: "citations";
  citations: Citation[];
  hasContext: boolean;
  retrieveError?: string | null;
}

export function ChatWindow({
  chatId,
  initialMessages,
  initialQuestion,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingText, setStreamingText] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasContext, setHasContext] = useState(true);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initialFired = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const health = useServiceHealth();

  // Auto-fire the initial question (from ?initial= param) once on mount.
  // We intentionally omit handleSubmit from deps — it's defined in-scope
  // and we only want this to run once when initialQuestion is set.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialQuestion && !initialFired.current && messages.length === 0) {
      initialFired.current = true;
      handleSubmit(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText]);

  async function handleSubmit(question: string) {
    if (isLoading) return;

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
    setHasContext(true);
    setRetrieveError(null);
    setIsLoading(true);

    // Abort controller for request cancellation / cleanup
    const abortController = new AbortController();
    abortRef.current = abortController;
    // Client-side watchdog: if no [DONE] arrives in 90s, abort
    const watchdog = setTimeout(() => {
      abortController.abort();
    }, 90_000);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, question, history }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || `Error ${res.status}`);
        setIsLoading(false);
        clearTimeout(watchdog);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let receivedDone = false;
      // Track citations locally to avoid stale closure captures
      let localCitations: Citation[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            receivedDone = true;
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: fullText,
              citations: localCitations.map((c) => ({
                doc_id: c.doc_id,
                doc_name: c.doc_name,
                page: c.page,
              })),
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingText("");
            setIsLoading(false);
            clearTimeout(watchdog);
            router.refresh();
            return;
          }

          try {
            const event = JSON.parse(data) as CitationEvent | { type: string; token?: string; message?: string };
            if (event.type === "citations") {
              const citationEvent = event as CitationEvent;
              localCitations = citationEvent.citations || [];
              setCitations(localCitations);
              setHasContext(citationEvent.hasContext ?? true);
              setRetrieveError(citationEvent.retrieveError || null);
            } else if (event.type === "token") {
              fullText += event.token;
              setStreamingText(fullText);
            } else if (event.type === "error") {
              toast.error(event.message || "Stream error");
              setIsLoading(false);
              clearTimeout(watchdog);
              return;
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      // Stream ended without [DONE] — surface an error if we got no text
      if (!receivedDone) {
        if (!fullText) {
          toast.error("The AI didn't return a response. Please try again.");
        } else {
          // Partial response — still show it
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: fullText,
            citations: localCitations.map((c) => ({
              doc_id: c.doc_id,
              doc_name: c.doc_name,
              page: c.page,
            })),
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingText("");
          toast.warning("Response may be incomplete.");
        }
        setIsLoading(false);
        clearTimeout(watchdog);
      }
    } catch (error) {
      clearTimeout(watchdog);
      if (error instanceof Error && error.name === "AbortError") {
        toast.error("Request timed out. The service may be temporarily unavailable — please try again.");
      } else {
        toast.error("Failed to send message. Please check your connection and try again.");
      }
      setIsLoading(false);
    }
  }

  function handleCancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Service degraded banner */}
      {health.status === "degraded" && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-800 dark:text-amber-200">
            Some backend services may be unavailable. Answers could be limited or delayed.
            {health.message && (
              <span className="ml-1 opacity-70">({health.message})</span>
            )}
          </span>
        </div>
      )}

      {/* Context status indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
          {retrieveError ? (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs text-muted-foreground">Knowledge base unavailable — answering from general training</span>
            </>
          ) : citations.length > 0 ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-xs text-muted-foreground">
                {`${citations.length} source${citations.length > 1 ? "s" : ""} found — generating answer…`}
              </span>
            </>
          ) : (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Searching knowledge base…</span>
            </>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5 shadow-sm">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Ask a compliance question
            </p>
            <p className="text-sm text-muted-foreground max-w-md text-balance leading-relaxed">
              Get answers about Indian startup compliance with citations from official legal documents.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <SampleQuestion onClick={handleSubmit}>How do I register a Pvt Ltd company?</SampleQuestion>
              <SampleQuestion onClick={handleSubmit}>What are the GST registration requirements?</SampleQuestion>
              <SampleQuestion onClick={handleSubmit}>How to open a current bank account?</SampleQuestion>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id} className="animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <MessageBubble message={msg} />
          </div>
        ))}

        {isLoading && (
          <div className="animate-fade-up">
            {citations.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Sources</p>
                <div className="flex gap-2 flex-wrap">
                  {citations.map((c, i) => (
                    <CitationCard key={i} citation={c} />
                  ))}
                </div>
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
          </div>
        )}
      </div>

      {/* Context warning when no sources found */}
      {!isLoading && messages.length > 0 && !hasContext && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
          <p className="text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            No specific sources found for this query. Answer provided from general knowledge.
          </p>
        </div>
      )}

      <div className="border-t bg-background px-3 sm:px-4 py-3 sm:py-4">
        <MessageInput onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
      </div>
    </div>
  );
}

function SampleQuestion({ children, onClick }: { children: React.ReactNode; onClick: (q: string) => void }) {
  return (
    <button
      onClick={() => onClick(children as string)}
      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border"
    >
      {children}
    </button>
  );
}
