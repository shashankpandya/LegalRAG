"use client";

import { useState } from "react";
import { Scale, SendHorizontal, Loader2, MessageSquare, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createChat } from "@/lib/actions/chats";

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
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Your compliance command center. Ask questions, manage documents, and track requirements.
        </p>
      </div>

      <div className="content-card" data-onboarding="ask-question">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-base">Ask a compliance question</h2>
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
            aria-label="Type your compliance question"
          />
          <Button
            onClick={handleAsk}
            disabled={!question.trim() || isSubmitting}
            size="icon"
            className="shrink-0 touch-target"
            aria-label="Submit question"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Answers are cited from official legal documents. Press Ctrl+Enter to submit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickActionCard
          icon={MessageSquare}
          title="Chat"
          description="Ask detailed compliance questions and get cited answers instantly."
          href="/chat"
        />
        <QuickActionCard
          icon={Sparkles}
          title="Documents"
          description="Upload PDFs to build your private searchable knowledge base."
          href="/documents"
        />
        <QuickActionCard
          icon={Scale}
          title="Compliance"
          description="Track your regulatory requirements with auto-generated checklists."
          href="/compliance"
        />
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}

function QuickActionCard({ icon: Icon, title, description, href }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="interactive-item block animate-fade-up"
      style={{ animationDelay: "150ms" }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mb-2.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </a>
  );
}
