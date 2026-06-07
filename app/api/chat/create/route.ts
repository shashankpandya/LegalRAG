import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * POST /api/chat/create
 *
 * Creates a new chat row and returns { chatId }.
 * Called by NewChatWindow before sending the first message.
 * This ensures empty sessions are never persisted — the row only
 * exists once the user has typed something and hit send.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
            );
            } catch {}
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    // Generate title from first question
    const title = question.replace(/[?!.]+$/, "").trim().slice(0, 60);

    const { data: chat, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();

    if (error) {
      return Response.json(
        { error: `Failed to create chat: ${error.message}` },
        { status: 500 },
      );
    }

    return Response.json({ chatId: chat.id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
