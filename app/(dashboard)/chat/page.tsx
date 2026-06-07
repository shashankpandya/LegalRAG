import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNewChat } from "@/lib/actions/chats";
import { EmptyState } from "@/components/shared/loading-states";

export default async function ChatListPage() {
  const supabase = await createClient();

  const { data: chats } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="page-title">Chat</h1>
          <p className="page-description">
            Ask questions about Indian startup compliance and get cited answers.
          </p>
        </div>
        {/* Goes directly to a new chat interface, no intermediate step */}
        <form action={createNewChat}>
          <Button size="sm" className="gap-2 w-full sm:w-auto" type="submit">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </form>
      </div>

      {chats && chats.length > 0 ? (
        <div className="grid gap-2">
          {chats.map((chat, idx) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="interactive-item flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{chat.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(chat.updated_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No chats yet"
          description="Click New chat to start asking compliance questions."
          action={
            <form action={createNewChat}>
              <Button size="sm" className="gap-2" type="submit">
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            </form>
          }
        />
      )}
    </div>
  );
}
