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
 * Rename a chat. RLS ensures only the owner can update.
 */
export async function renameChat(chatId: string, newTitle: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const trimmed = newTitle.trim().slice(0, 100);
  if (!trimmed) throw new Error("Title cannot be empty");

  const { error } = await supabase
    .from("chats")
    .update({ title: trimmed })
    .eq("id", chatId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to rename chat: ${error.message}`);
}

/**
 * Delete a chat and all its messages (cascade).
 */
export async function deleteChat(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to delete chat: ${error.message}`);
}
