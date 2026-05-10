import { z } from "zod";

/**
 * Chat endpoint request/response schemas.
 * See: docs/api/chat-endpoint.md § "Body schema"
 */

export const ChatRequest = z.object({
  chatId: z.string().uuid(),
  question: z.string().min(1, "Question is required").max(4000, "Question too long (max 4000 chars)"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

export type ChatRequestInput = z.infer<typeof ChatRequest>;
