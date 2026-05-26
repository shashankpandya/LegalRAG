"use client";

import { useState } from "react";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "chat" | "table";
  count?: number;
}

export function LoadingSkeleton({ variant = "card", count = 3 }: LoadingSkeletonProps) {
  if (variant === "chat") return <ChatSkeleton />;
  if (variant === "table") return <TableSkeleton />;
  if (variant === "list") return <ListSkeleton count={count} />;
  return <CardSkeleton count={count} />;
}

function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-label="Loading content" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2" aria-label="Loading content" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="h-5 w-5 animate-pulse rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex-1 px-4 py-6 space-y-4" aria-label="Loading chat" role="status">
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-primary/10 space-y-2">
          <div className="h-3 w-48 animate-pulse rounded bg-primary/20" />
          <div className="h-3 w-32 animate-pulse rounded bg-primary/20" />
        </div>
      </div>
      <div className="flex gap-3 justify-start">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted shrink-0" />
        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted space-y-2">
          <div className="h-3 w-56 animate-pulse rounded bg-muted-foreground/10" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted-foreground/10" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted-foreground/10" />
        </div>
      </div>
      <span className="sr-only">Loading chat messages...</span>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border bg-card" aria-label="Loading table" role="status">
      <div className="border-b px-4 py-3 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b last:border-0 px-4 py-3 flex gap-4">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message = "An unexpected error occurred. Please try again.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center" role="alert">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <span className="text-xl text-destructive" aria-hidden="true">!</span>
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
