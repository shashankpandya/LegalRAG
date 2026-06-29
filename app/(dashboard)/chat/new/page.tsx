import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewChatWindow } from "@/components/chat/new-chat-window";

/**
 * /chat/new — ephemeral "new chat" page.
 *
 * No DB row is created until the user sends their first message.
 * The NewChatWindow client component handles creating the chat + redirecting.
 * Accepts an optional ?prefill= query param to pre-fill the input (e.g. from Documents page).
 */
export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { prefill } = await searchParams;

  return (
    <div className="flex h-full flex-col">
      <NewChatWindow prefill={prefill} />
    </div>
  );
}
