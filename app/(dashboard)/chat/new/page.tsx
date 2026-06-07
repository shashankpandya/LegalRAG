import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewChatWindow } from "@/components/chat/new-chat-window";

/**
 * /chat/new — ephemeral "new chat" page.
 *
 * No DB row is created until the user sends their first message.
 * The NewChatWindow client component handles creating the chat + redirecting.
 */
export default async function NewChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-full flex-col">
      <NewChatWindow />
    </div>
  );
}
