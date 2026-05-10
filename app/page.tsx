import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Scale, ArrowRight, Shield, FileText, MessageSquare } from "lucide-react";

/**
 * Landing page — unauthenticated public page.
 * Authenticated users are redirected to /dashboard.
 */
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
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          <span className="text-lg font-semibold">LegalRAG</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Shield className="h-3 w-3" />
            Built for Indian startups
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Startup compliance,{" "}
            <span className="text-primary">answered instantly</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Ask questions about company registration, GST, DPDP Act, FEMA, and more.
            Get cited answers from official legal documents — not hallucinated summaries.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign in</Button>
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid gap-4 pt-8 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 text-left">
              <MessageSquare className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-semibold">Cited answers</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Every response references the exact document and page number.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-left">
              <FileText className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-semibold">Upload your docs</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add your own PDFs. They&apos;re searchable only by you — fully private.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-left">
              <Shield className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-semibold">Compliance tracker</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated checklist based on your company type.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          ⚖️ LegalRAG provides general information only and does not constitute legal advice.
          Consult a qualified professional for your specific situation.
        </p>
      </footer>
    </div>
  );
}
