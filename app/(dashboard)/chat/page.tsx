import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createChat } from "@/lib/actions/chats";

/**
 * Chat list page — shows all chats for the current user.
 * Links to individual chat pages.
 */
export default async function ChatListPage() {
  const supabase = await createClient();

  const { data: chats } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">
            Ask questions about Indian startup compliance and get cited answers.
          </p>
        </div>
        <form action={createChat}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </form>
      </div>

      {chats && chats.length > 0 ? (
        <div className="space-y-2">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{chat.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(chat.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No chats yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ask your first question from the dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
