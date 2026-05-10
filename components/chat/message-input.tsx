"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";

interface MessageInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

/**
 * MessageInput — textarea + submit button.
 * Cmd/Ctrl+Enter shortcut to send. Max length 4000 chars.
 */
export function MessageInput({ onSubmit, isLoading }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        placeholder="Ask about Indian startup compliance..."
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 4000))}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        size="icon"
        className="shrink-0"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
