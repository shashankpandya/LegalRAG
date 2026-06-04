"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Sparkles } from "lucide-react";

interface MessageInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

export function MessageInput({ onSubmit, isLoading }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

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
    // Allow Enter for new lines, shift+Enter for submit
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      // Allow default behavior (new line)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    if (newValue.length <= 4000) {
      setValue(newValue);
    }
  }

  return (
    <div className="relative">
      {/* Character count indicator */}
      {value.length > 3500 && (
        <div className="absolute -top-5 right-0 text-[10px] text-muted-foreground">
          {4000 - value.length} remaining
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Ask about Indian startup compliance..."
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="min-h-[44px] max-h-[200px] resize-none pr-12 transition-all duration-200"
            rows={1}
            aria-label="Type your message"
          />
          {/* Quick action hint */}
          {value.trim() && (
            <span className="absolute bottom-2.5 right-12 text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 hidden sm:block">
              ⌘↵ to send
            </span>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="shrink-0 touch-target h-[44px] w-[44px] transition-all duration-200"
          aria-label="Send message"
        >
          {isLoading ? (
            <Sparkles className="h-4 w-4 animate-pulse" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Tips when empty */}
      {!value.trim() && !isLoading && (
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <span className="text-muted-foreground/60">Try:</span>
          <span className="text-muted-foreground/80">Company registration • GST compliance • Employment law</span>
        </p>
      )}
    </div>
  );
}
