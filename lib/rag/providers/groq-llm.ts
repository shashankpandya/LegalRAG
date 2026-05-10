import Groq from "groq-sdk";
import type { LLMProvider, ChatMessage, LLMOptions } from "./types";

/**
 * Groq LLM provider — uses groq-sdk (per ADR-005).
 * Default model: llama-3.3-70b-versatile, temp 0.2, max_tokens 1024.
 * Streaming via AsyncIterable<string>.
 */
export const groqLlm: LLMProvider = {
  name: "groq-llama-3.3-70b",

  async *stream(messages: ChatMessage[], options: LLMOptions): AsyncIterable<string> {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const completion = await groq.chat.completions.create({
      model: options.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  },
};
