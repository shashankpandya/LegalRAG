import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ChatRequest } from "@/lib/api/schemas/chat";
import { retrieve } from "@/lib/rag/retrieve";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/rag/prompts";
import { llm } from "@/lib/rag/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Turn a question into a clean chat title (max 60 chars).
 */
function makeChatTitle(question: string): string {
  const cleaned = question.trim().replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  const truncated = cleaned.slice(0, 60);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 30 ? truncated.slice(0, lastSpace) + "…" : truncated + "…";
}

/**
 * POST /api/chat — streaming RAG endpoint.
 *
 * Auth → validate → insert user msg → retrieve context → stream SSE
 * (citations event + token events + [DONE]) → persist assistant msg
 * → auto-title chat if still "New chat" → update timestamp
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

    // 3. Verify chat ownership (RLS + explicit check) + check current title
    const { data: chat } = await supabase
      .from("chats")
      .select("id, title")
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

    // 5. Retrieve relevant context from Qdrant
    // Wrap in a timeout so a Qdrant/Jina outage doesn't hang the stream forever
    let contexts: Awaited<ReturnType<typeof retrieve>> = [];
    let retrieveError: string | null = null;
    try {
      const retrieveWithTimeout = Promise.race([
        retrieve(question, user.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Retrieval timed out after 15s")), 15_000),
        ),
      ]);
      contexts = await retrieveWithTimeout;
    } catch (err) {
      retrieveError = err instanceof Error ? err.message : "Retrieval failed";
      console.warn("[/api/chat] Retrieval error (continuing with empty context):", retrieveError);
      // Continue with empty context rather than failing the whole request
    }

    // 6. Build LLM messages
    const slicedHistory = (history || []).slice(-6);
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

    // 7. Stream SSE
    const encoder = new TextEncoder();
    let fullResponse = "";

    // Auto-title: if the chat is still "New chat", update it from the question.
    // Do this before streaming so the sidebar refreshes correctly.
    const isFirstMessage = chat.title === "New chat";
    if (isFirstMessage) {
      await supabase
        .from("chats")
        .update({ title: makeChatTitle(question) })
        .eq("id", chatId);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Emit citations first so the UI can render them before tokens arrive
          const citationsEvent = {
            type: "citations",
            citations: contexts.map((c) => ({
              doc_name: c.docName,
              page: c.page,
              doc_id: c.docId,
              snippet: c.parentText.slice(0, 200),
            })),
            hasContext: contexts.length > 0,
            retrieveError,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(citationsEvent)}\n\n`),
          );

          // Stream tokens
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

          // Persist assistant message — include snippet so it survives page reload
          await supabase.from("messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: fullResponse,
            citations: contexts.map((c) => ({
              doc_id: c.docId,
              doc_name: c.docName,
              page: c.page,
              snippet: c.parentText.slice(0, 200),
            })),
          });

          // Update chat timestamp so it rises to top of sidebar list
          await supabase
            .from("chats")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", chatId);

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
