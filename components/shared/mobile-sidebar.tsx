"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  ClipboardCheck,
  LogOut,
  Scale,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { createNewChat } from "@/lib/actions/chats";
import { OnboardingTour } from "@/components/shared/onboarding-tour";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/compliance", label: "Compliance", icon: ClipboardCheck },
];

interface ChatItem {
  id: string;
  title: string;
  updated_at: string;
}

interface MobileSidebarProps {
  user: { email?: string };
  chats: ChatItem[];
}

export function MobileSidebar({ user, chats }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-11 w-11"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 w-72 animate-in slide-in-from-left duration-300 bg-card border-r shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                <span className="text-lg font-semibold">LegalRAG</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-1 px-3 py-4" data-onboarding="sidebar-nav">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px]"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto border-t px-3 py-3" data-onboarding="recent-chats">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Chats
                </span>
                {/* + creates a new chat and goes directly to the chat interface */}
                <form action={createNewChat}>
                  <button
                    type="submit"
                    title="New chat"
                    aria-label="Start a new chat"
                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>

              {chats && chats.length > 0 ? (
                <div className="space-y-0.5">
                  {chats.slice(0, 10).map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center truncate rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px]"
                    >
                      {chat.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-3 text-xs text-muted-foreground">No chats yet.</p>
              )}
            </div>

            <div className="border-t px-4 py-4" data-onboarding="user-section">
              <p className="truncate text-xs text-muted-foreground mb-2">{user.email}</p>
              <form action={signOut}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 min-h-[44px]" type="submit">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
