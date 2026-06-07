"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { MessageInput } from "./message-input";

/**
 * NewChatWindow — shown at /chat/new before any message is sent.
 *
 * No chat row exists yet. On first submit:
 * 1. POST /api/chat/create  → creates the DB row, returns { chatId }
 * 2. Redirect to /chat/{chatId}?initial={question}
 *    → ChatWindow fires the question automatically via ?initial=
 *
 * This ensures empty sessions are never saved to the DB.
 */
export function NewChatWindow() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(question: string) {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to create chat");
        setIsLoading(false);
        return;
      }

      const { chatId } = await res.json();
      // Redirect — ChatWindow will auto-fire the question via ?initial=
      router.push(`/chat/${chatId}?initial=${encodeURIComponent(question)}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
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
          {[
            "How do I register a Pvt Ltd company?",
            "What are the GST registration requirements?",
            "What rights do data principals have under DPDP Act?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleSubmit(q)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t bg-background px-3 sm:px-4 py-3 sm:py-4">
        <MessageInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
