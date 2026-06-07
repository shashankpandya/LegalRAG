import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNewChat } from "@/lib/actions/chats";
import { EmptyState } from "@/components/shared/loading-states";
import { ChatListItem } from "@/components/chat/chat-list-item";

export default async function ChatListPage() {
  const supabase = await createClient();

  const { data: rawChats } = await supabase
    .from("chats")
    .select("id, title, updated_at, messages(count)")
    .order("updated_at", { ascending: false });

  // Only show chats that have at least one message
  const chats = (rawChats || [])
    .filter((c) => {
      const count = (c.messages as unknown as { count: number }[])?.[0]?.count ?? 0;
      return count > 0;
    })
    .map(({ id, title, updated_at }) => ({ id, title, updated_at }));

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="page-title">Chat</h1>
          <p className="page-description">
            Ask questions about Indian startup compliance and get cited answers.
          </p>
        </div>
        <form action={createNewChat}>
          <Button size="sm" className="gap-2 w-full sm:w-auto" type="submit">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </form>
      </div>

      {chats.length > 0 ? (
        <div className="grid gap-2">
          {chats.map((chat, idx) => (
            <ChatListItem key={chat.id} chat={chat} idx={idx} />
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
