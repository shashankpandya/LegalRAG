"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Create a new chat and redirect to it.
 *
 * Can be called two ways:
 * 1. From a <form action={createChat}> — receives FormData (ignored, creates blank chat)
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

  // Handle both form action (FormData) and direct call (string)
  const initialQuestion =
    typeof initialQuestionOrFormData === "string"
      ? initialQuestionOrFormData
      : undefined;

  const { data: chat, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: initialQuestion ? initialQuestion.slice(0, 60) : "New chat",
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
