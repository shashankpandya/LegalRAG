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

export function ComplianceChecklist({ label, items }: ComplianceChecklistProps) {
  const doneCount = items.filter((i) => i.completed).length;

  return (
    <div className="rounded-lg border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm">{label}</h3>
        <span className="text-xs text-muted-foreground font-medium">
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
    setCompleted(next);
    setToggling(true);

    try {
      await toggleItem(item.id, next);
    } catch {
      setCompleted(!next);
    } finally {
      setToggling(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      aria-label={`${item.title} — ${completed ? "Completed" : "Not completed"}. Click to toggle.`}
    >
      <div className="mt-0.5 shrink-0">
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : completed ? (
          <CheckCircle className="h-4 w-4 text-green-600 transition-colors" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium transition-all duration-200 ${completed ? "line-through text-muted-foreground" : ""}`}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
        )}
        {item.due_date && (
          <span
            className={`inline-block mt-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              new Date(item.due_date) < new Date() && !completed
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : new Date(item.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && !completed
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {new Date(item.due_date) < new Date() && !completed
              ? "Overdue"
              : `Due: ${new Date(item.due_date).toLocaleDateString()}`}
          </span>
        )}
      </div>
    </button>
  );
}
