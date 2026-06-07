import Link from "next/link";
import { type User } from "@supabase/supabase-js";
import { signOut } from "@/lib/actions/auth";
import { createNewChat } from "@/lib/actions/chats";
import { Button } from "@/components/ui/button";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  ClipboardCheck,
  LogOut,
  Scale,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/compliance", label: "Compliance", icon: ClipboardCheck },
];

interface SidebarProps {
  user: User;
  chats: { id: string; title: string; updated_at: string }[];
}

/**
 * Desktop sidebar — Server Component.
 * Chats are fetched once in the layout and passed as a prop.
 */
export function Sidebar({ user, chats }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card" data-onboarding="sidebar-nav">
      <div className="flex items-center justify-between border-b px-4 py-3" data-onboarding="welcome">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">LegalRAG</span>
        </div>
        <OnboardingTour />
      </div>

      <nav className="space-y-1 px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
            aria-label={item.label}
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
          {/* + button → creates a new chat and goes straight to chat interface */}
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

        {chats.length > 0 ? (
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block truncate rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                title={chat.title}
              >
                {chat.title}
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-3 text-xs text-muted-foreground">
            No chats yet — ask your first question above.
          </p>
        )}
      </div>

      <div className="border-t px-4 py-4" data-onboarding="user-section">
        <p className="truncate text-xs text-muted-foreground mb-2">{user.email}</p>
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            type="submit"
            aria-label="Sign out of your account"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
