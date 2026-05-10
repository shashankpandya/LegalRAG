import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ChatRequest } from "@/lib/api/schemas/chat";
import { retrieve } from "@/lib/rag/retrieve";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/rag/prompts";
import { llm } from "@/lib/rag/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/chat — the money endpoint.
 *
 * Auth → validate → insert user msg → retrieve → stream SSE (citations + tokens)
 * → persist assistant msg → update chat → [DONE]
 *
 * See: docs/api/chat-endpoint.md
 */
export async function POST(req: Request) {
  try {
    // 1. Auth
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
            } catch {
              // Server Component context — safe to ignore
            }
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

    // 2. Validate body
    const body = await req.json();
    const parsed = ChatRequest.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const { chatId, question, history } = parsed.data;

    // 3. Verify chat ownership (RLS + explicit check)
    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .single();

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    // 4. Insert user message (before retrieval — persists even if stream fails)
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: question,
    });

    // 5. Retrieve relevant context
    const contexts = await retrieve(question, user.id);

    // 6. Build messages for LLM
    const slicedHistory = (history || []).slice(-6); // last 3 turns
    const llmMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...slicedHistory.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      {
        role: "user" as const,
        content: buildUserPrompt(question, contexts),
      },
    ];

    // 7. Open SSE stream
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Emit citations event first
          const citationsEvent = {
            type: "citations",
            citations: contexts.map((c) => ({
              doc_name: c.docName,
              page: c.page,
              doc_id: c.docId,
              snippet: c.parentText.slice(0, 200),
            })),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(citationsEvent)}\n\n`),
          );

          // Stream tokens from LLM
          for await (const token of llm.stream(llmMessages, {
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            maxTokens: 1024,
          })) {
            fullResponse += token;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", token })}\n\n`,
              ),
            );
          }

          // Persist assistant message with citations
          await supabase.from("messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: fullResponse,
            citations: contexts.map((c) => ({
              doc_id: c.docId,
              doc_name: c.docName,
              page: c.page,
            })),
          });

          // Update chat timestamp
          await supabase
            .from("chats")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", chatId);

          // Emit done
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          console.error("[/api/chat] Stream error:", message);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/chat]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
