"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, SendHorizontal, Loader2, MessageSquare, Sparkles, Zap, ArrowRight, BookOpen, Shield, Clock } from "lucide-react";
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

  function handleSampleQuestion(q: string) {
    setQuestion(q);
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="page-title">Welcome to LegalRAG</h1>
        <p className="page-description">
          Your AI-powered compliance assistant for Indian startups. Ask questions, get cited answers, and stay compliant.
        </p>
      </div>

      {/* Quick Ask Card */}
      <div className="content-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Ask a compliance question</h2>
              <p className="text-xs text-muted-foreground">Get instant answers with citations from legal documents</p>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Textarea
                placeholder="e.g., What are the requirements for GST registration for a startup?"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 4000))}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className="min-h-[52px] max-h-[140px] resize-none text-base"
                rows={2}
                aria-label="Type your compliance question"
              />
            </div>
            <Button
              onClick={handleAsk}
              disabled={!question.trim() || isSubmitting}
              size="lg"
              className="gap-2 shrink-0 touch-target"
              aria-label="Submit question"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SendHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask</span>
                </>
              )}
            </Button>
          </div>
          
          {/* Sample questions */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Try these questions:
            </p>
            <div className="flex flex-wrap gap-2">
              <SampleChip onClick={handleSampleQuestion}>Company registration process</SampleChip>
              <SampleChip onClick={handleSampleQuestion}>PAN & TAN requirements</SampleChip>
              <SampleChip onClick={handleSampleQuestion}>Employee provident fund</SampleChip>
              <SampleChip onClick={handleSampleQuestion}>Trademark registration</SampleChip>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          icon={MessageSquare}
          title="Chat with AI"
          description="Ask detailed compliance questions and get instantly cited answers."
          href="/chat"
          gradient="from-blue-500 to-indigo-500"
        />
        <QuickActionCard
          icon={Sparkles}
          title="Upload Documents"
          description="Add your own PDFs to build a private searchable knowledge base."
          href="/documents"
          gradient="from-purple-500 to-pink-500"
        />
        <QuickActionCard
          icon={Shield}
          title="Compliance Checklist"
          description="Track regulatory requirements specific to your company type."
          href="/compliance"
          gradient="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard
          icon={BookOpen}
          title="Trusted Sources"
          description="Answers are based on official legal documents and regulations from Indian government sources."
        />
        <InfoCard
          icon={Clock}
          title="Always Available"
          description="Get answers to your compliance questions 24/7 without waiting for expert consultation."
        />
      </div>
    </div>
  );
}

interface SampleChipProps {
  children: React.ReactNode;
  onClick: (q: string) => void;
}

function SampleChip({ children, onClick }: SampleChipProps) {
  return (
    <button
      onClick={() => onClick(children as string)}
      className="text-xs px-3 py-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 border hover:border-primary/30"
    >
      {children}
    </button>
  );
}

interface QuickActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

function QuickActionCard({ icon: Icon, title, description, href, gradient }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group interactive-item block animate-fade-up relative overflow-hidden"
      style={{ animationDelay: "150ms" }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
          <span>Get started</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function InfoCard({ icon: Icon, title, description }: InfoCardProps) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border bg-card animate-fade-up" style={{ animationDelay: "300ms" }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
