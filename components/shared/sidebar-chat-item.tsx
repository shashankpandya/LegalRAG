"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { renameChat, deleteChat } from "@/lib/actions/chats";

interface SidebarChatItemProps {
  chat: { id: string; title: string; updated_at: string };
}

export function SidebarChatItem({ chat }: SidebarChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(chat.title);
    setIsEditing(true);
  }

  function cancelEdit() {
    setEditValue(chat.title);
    setIsEditing(false);
  }

  async function saveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed) { cancelEdit(); return; }
    if (trimmed === chat.title) { setIsEditing(false); return; }

    setIsSaving(true);
    try {
      await renameChat(chat.id, trimmed);
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to rename");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${chat.title}"?`)) return;
    try {
      await deleteChat(chat.id);
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-1 py-0.5">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value.slice(0, 100))}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="flex-1 min-w-0 text-xs bg-background border border-primary rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Edit chat title"
        />
        <button
          onClick={saveEdit}
          disabled={isSaving}
          className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
          aria-label="Save"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={cancelEdit}
          className="p-0.5 text-muted-foreground hover:bg-muted rounded transition-colors"
          aria-label="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative flex items-center">
      <Link
        href={`/chat/${chat.id}`}
        className="flex-1 truncate rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground pr-14"
        title={chat.title}
      >
        {chat.title}
      </Link>
      {/* Actions: visible on hover OR when any button inside is focused (keyboard accessible) */}
      <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          onClick={startEdit}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={`Rename "${chat.title}"`}
          title="Rename"
          tabIndex={0}
        >
          <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={`Delete "${chat.title}"`}
          title="Delete"
          tabIndex={0}
        >
          <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
