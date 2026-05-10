"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteDocument } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ready":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle className="h-3 w-3" />
          Ready
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
          <Clock className="h-3 w-3 animate-spin" />
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

/**
 * DocumentList — table of user-uploaded documents with delete action.
 */
export function DocumentList({ documents }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-medium">No documents uploaded</p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag a PDF into the dropzone above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Pages</th>
              <th className="px-4 py-3 font-medium">Chunks</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={doc.name}>
                  {doc.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {doc.page_count ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {doc.chunk_count ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {doc.size_bytes ? formatBytes(doc.size_bytes) : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(doc.id, doc.name)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
