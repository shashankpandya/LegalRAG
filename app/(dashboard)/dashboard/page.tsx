"use client";

import { useState } from "react";
import { Scale, SendHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createChat } from "@/lib/actions/chats";

/**
 * Dashboard home — "Ask a question" input + recent activity.
 * Submit creates a new chat and navigates to it with the question.
 */
export default function DashboardPage() {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createChat(trimmed);
    } catch {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your compliance command center. Ask questions, manage documents, and track requirements.
        </p>
      </div>

      {/* Ask a question */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Ask a compliance question</h2>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="e.g., How do I register a Pvt Ltd in India?"
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 4000))}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={2}
          />
          <Button
            onClick={handleAsk}
            disabled={!question.trim() || isSubmitting}
            size="icon"
            className="shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Answers are cited from official legal documents. Press Ctrl+Enter to submit.
        </p>
      </div>
    </div>
  );
}
