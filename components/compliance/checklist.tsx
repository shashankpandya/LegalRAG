"use client";

import { useState } from "react";
import { toggleItem } from "@/lib/actions/compliance";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  due_date: string | null;
  completed: boolean;
}

interface ComplianceChecklistProps {
  label: string;
  items: ComplianceItem[];
}

/**
 * ComplianceChecklist — card with grouped items and interactive checkboxes.
 * Each toggle calls the server action and shows optimistic UI.
 */
export function ComplianceChecklist({ label, items }: ComplianceChecklistProps) {
  const doneCount = items.filter((i) => i.completed).length;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {doneCount} / {items.length} done
        </span>
      </div>
      <div className="divide-y">
        {items.map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ChecklistItem({ item }: { item: ComplianceItem }) {
  const [completed, setCompleted] = useState(item.completed);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    const next = !completed;
    setCompleted(next); // Optimistic
    setToggling(true);

    try {
      await toggleItem(item.id, next);
    } catch {
      setCompleted(!next); // Revert on error
    } finally {
      setToggling(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
    >
      <div className="mt-0.5 shrink-0">
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : completed ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : ""}`}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        )}
        {item.due_date && (
          <span className="inline-block mt-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            Due: {new Date(item.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  );
}
