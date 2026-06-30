import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/chat-window";

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ initial?: string }>;
}

// Revalidate this page after each message so sidebar chat list stays fresh
export const revalidate = 0;

/**
 * Chat page — Server Component shell.
 * Loads message history from Supabase (RLS-scoped) and passes to ChatWindow.
 * Fetches chat and messages in parallel to cut latency.
 */
export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params;
  const { initial } = await searchParams;

  const supabase = await createClient();

  // Run auth + chat verification + message fetch in parallel
  const [
    { data: { user } },
    { data: chat },
    { data: messages },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("chats").select("id, title").eq("id", id).single(),
    supabase
      .from("messages")
      .select("id, role, content, citations, created_at")
      .eq("chat_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!user) redirect("/login");
  if (!chat) redirect("/chat");

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
