"use client";

import { OnboardingTour } from "@/components/shared/onboarding-tour";
import { CookieConsent, reopenCookieConsent } from "@/components/shared/cookie-consent";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { Scale, Cookie } from "lucide-react";
import Link from "next/link";

interface DashboardShellProps {
  chats: { id: string; title: string; updated_at: string }[];
  userEmail: string;
}

export function DashboardShell({ chats, userEmail }: DashboardShellProps) {
  return (
    <>
      <CookieConsent />
      <MobileHeader chats={chats} userEmail={userEmail} />
      <footer className="border-t px-4 py-3 hidden md:flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              reopenCookieConsent();
            }}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            aria-label="Revisit cookie preferences"
          >
            <Cookie className="h-3 w-3" />
            Cookie Preferences
          </Link>
        </div>
        <p>LegalRAG provides general information only and does not constitute legal advice.</p>
      </footer>
    </>
  );
}

function MobileHeader({ chats, userEmail }: DashboardShellProps) {
  return (
    <header className="md:hidden flex items-center justify-between border-b bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <MobileSidebar user={{ email: userEmail }} chats={chats} />
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">LegalRAG</span>
        </div>
      </div>
      <OnboardingTour />
    </header>
  );
}
