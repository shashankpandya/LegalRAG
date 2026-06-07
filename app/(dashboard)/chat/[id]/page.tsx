import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/chat-window";

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ initial?: string }>;
}

/**
 * Chat page — Server Component shell.
 * Loads message history from Supabase (RLS-scoped) and passes to ChatWindow.
 */
export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params;
  const { initial } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify chat exists and belongs to this user (RLS)
  const { data: chat } = await supabase
    .from("chats")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!chat) {
    redirect("/chat");
  }

  // Load messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, citations, created_at")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-full flex-col">
      <ChatWindow
        chatId={id}
        initialMessages={messages || []}
        initialQuestion={initial}
      />
    </div>
  );
}
