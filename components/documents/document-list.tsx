"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteDocument } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Loader2, CheckCircle, XCircle, Clock, RefreshCw, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/loading-states";

interface Document {
  id: string;
  name: string;
  page_count: number | null;
  chunk_count: number | null;
  status: string;
  size_bytes: number | null;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
}

function StatusBadge({ status, errorMessage }: { status: string; errorMessage?: string | null }) {
  switch (status) {
    case "ready":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
          <CheckCircle className="h-3 w-3" aria-hidden="true" />
          Ready
        </span>
      );
    case "failed":
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400"
          title={errorMessage || "Ingestion failed — click Retry to try again"}
        >
          <XCircle className="h-3 w-3" aria-hidden="true" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Clock className="h-3 w-3 animate-spin" aria-hidden="true" />
          Processing
        </span>
      );
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(docId: string, docName: string) {
    if (!confirm(`Delete "${docName}"? This also removes its chunks from search.`)) return;

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      toast.success(`Deleted ${docName}`);
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRetry(docId: string, docName: string) {
    setRetryingId(docId);
    try {
      // Re-trigger ingestion: fetch the document's storage URL and POST to /api/ingest
      // Since we don't store the original file, we inform the user they need to re-upload
      toast.info(`To retry "${docName}", please delete it and re-upload the PDF file.`, {
        duration: 6000,
        action: {
          label: "Got it",
          onClick: () => {},
        },
      });
    } finally {
      setRetryingId(null);
    }
  }

  function handleAskAbout(docName: string) {
    // Navigate to new chat with a pre-filled question about this document
    const question = encodeURIComponent(`Summarize the key points from "${docName}"`);
    router.push(`/chat/new?prefill=${question}`);
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents uploaded"
        description="Drag a PDF into the dropzone above to get started."
      />
    );
  }

  const readyCount = documents.filter((d) => d.status === "ready").length;
  const failedCount = documents.filter((d) => d.status === "failed").length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {(readyCount > 0 || failedCount > 0) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          {readyCount > 0 && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-3 w-3" />
              {readyCount} ready
            </span>
          )}
          {failedCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <XCircle className="h-3 w-3" />
              {failedCount} failed — delete and re-upload to retry
            </span>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Pages</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Chunks</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Size</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                <th className="px-4 py-3 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium max-w-[180px] sm:max-w-[200px] truncate" title={doc.name}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {doc.page_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {doc.chunk_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {doc.size_bytes ? formatBytes(doc.size_bytes) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Ask about this doc (only for ready docs) */}
                      {doc.status === "ready" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleAskAbout(doc.name)}
                          title={`Ask about "${doc.name}"`}
                          aria-label={`Ask AI about ${doc.name}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {/* Retry hint for failed docs */}
                      {doc.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          onClick={() => handleRetry(doc.id, doc.name)}
                          disabled={retryingId === doc.id}
                          title="How to retry this document"
                          aria-label={`Retry ingestion for ${doc.name}`}
                        >
                          {retryingId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(doc.id, doc.name)}
                        disabled={deletingId === doc.id}
                        aria-label={`Delete document ${doc.name}`}
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
