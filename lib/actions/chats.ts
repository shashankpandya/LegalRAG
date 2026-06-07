"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Generate a clean chat title from the first question.
 * Strips punctuation, trims to 60 chars, title-cases it.
 */
function makeChatTitle(question: string): string {
  const cleaned = question
    .trim()
    .replace(/[?!.]+$/, "")   // remove trailing punctuation
    .trim();

  if (cleaned.length <= 60) return cleaned;
  // Truncate at last word boundary before 60 chars
  const truncated = cleaned.slice(0, 60);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 30 ? truncated.slice(0, lastSpace) + "…" : truncated + "…";
}

/**
 * Create a new chat with an initial question and redirect to the chat page.
 * Title is auto-generated from the question.
 *
 * Can be called two ways:
 * 1. From a <form action={createChat}> — receives FormData (creates blank chat)
 * 2. From code: createChat("my question") — creates chat with initial question
 */
export async function createChat(initialQuestionOrFormData?: string | FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialQuestion =
    typeof initialQuestionOrFormData === "string"
      ? initialQuestionOrFormData
      : undefined;

  const { data: chat, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: initialQuestion ? makeChatTitle(initialQuestion) : "New chat",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create chat: ${error.message}`);
  }

  const url = initialQuestion
    ? `/chat/${chat.id}?initial=${encodeURIComponent(initialQuestion)}`
    : `/chat/${chat.id}`;

  redirect(url);
}

/**
 * Navigate to the new-chat page (/chat/new).
 * No DB row is created until the user sends their first message.
 * This prevents empty "New chat" sessions from cluttering the history.
 */
export async function createNewChat() {
  redirect("/chat/new");
}

/**
 * Update a chat's title after the first message is sent.
 * Called from the chat API route after the first assistant response.
 */
export async function updateChatTitle(chatId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("chats")
    .update({ title: makeChatTitle(title) })
    .eq("id", chatId)
    .eq("user_id", user.id)
    .eq("title", "New chat"); // only update if still the default title
}
