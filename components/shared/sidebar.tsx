import Link from "next/link";
import { type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
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
}

/**
 * Sidebar navigation — Server Component.
 * Renders nav links + recent chats + user email + sign out button.
 */
export async function Sidebar({ user }: SidebarProps) {
  const supabase = await createClient();

  // Fetch recent chats (RLS-scoped to current user)
  const { data: chats } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(30);

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Scale className="h-5 w-5" />
        <span className="text-lg font-semibold">LegalRAG</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Recent chats */}
      <div className="flex-1 overflow-y-auto border-t px-3 py-3">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent Chats
          </span>
          <Link href="/chat" title="All chats">
            <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Link>
        </div>
        {chats && chats.length > 0 ? (
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block truncate rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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

      {/* User section */}
      <div className="border-t px-4 py-4">
        <p className="truncate text-xs text-muted-foreground mb-2">{user.email}</p>
        <form action={signOut}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" type="submit">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
