import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Scale, ArrowRight, Shield, FileText, MessageSquare, CheckCircle, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">LegalRAG</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-xs sm:text-sm">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-powered compliance for Indian startups
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
            Startup compliance,{" "}
            <span className="text-primary">answered instantly</span>
          </h1>

          <p className="text-base text-muted-foreground sm:text-lg leading-relaxed max-w-lg mx-auto text-balance">
            Ask questions about company registration, GST, DPDP Act, FEMA, and more.
            Get cited answers from official legal documents — not hallucinated summaries.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-sm">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                Sign in
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 pt-4 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-lg border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/20 animate-fade-up">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Cited answers</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Every response references the exact document and page number — no hallucinations, no guesswork.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/20 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mb-3">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Upload your docs</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Add your own PDFs. They&apos;re searchable only by you — fully private and secure.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/20 animate-fade-up" style={{ animationDelay: "200ms" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Compliance tracker</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Auto-generated checklist based on your company type — never miss a deadline.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs text-muted-foreground text-balance">
            LegalRAG provides general information only and does not constitute legal advice.
            Consult a qualified professional for your specific situation.
          </p>
        </div>
      </footer>
    </div>
  );
}
