"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";
import { renameChat, deleteChat } from "@/lib/actions/chats";

interface ChatListItemProps {
  chat: { id: string; title: string; updated_at: string };
  idx: number;
}

export function ChatListItem({ chat, idx }: ChatListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when entering edit mode
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
      toast.success("Chat renamed");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to rename chat");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${chat.title}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      await deleteChat(chat.id);
      toast.success("Chat deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete chat");
      setIsDeleting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }

  if (isDeleting) {
    return (
      <div
        className="interactive-item flex items-center gap-3 animate-fade-up opacity-50"
        style={{ animationDelay: `${idx * 50}ms` }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Deleting…</p>
      </div>
    );
  }

  return (
    <div
      className="group interactive-item flex items-center gap-3 animate-fade-up"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
        <MessageSquare className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          /* ── Inline rename input ── */
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.slice(0, 100))}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="flex-1 min-w-0 text-sm bg-background border border-primary rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Edit chat title"
            />
            <button
              onClick={saveEdit}
              disabled={isSaving}
              className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition-colors disabled:opacity-50"
              aria-label="Save title"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Cancel rename"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* ── Normal view ── */
          <Link href={`/chat/${chat.id}`} className="block">
            <p className="font-medium text-sm truncate">{chat.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(chat.updated_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </Link>
        )}
      </div>

      {/* Action buttons — visible on hover when not editing */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={startEdit}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Rename chat"
            title="Rename"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete chat"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
