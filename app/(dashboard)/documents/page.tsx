import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { DocumentList } from "@/components/documents/document-list";
import { LoadingSkeleton } from "@/components/shared/loading-states";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, page_count, chunk_count, status, size_bytes, created_at")
    .eq("is_public", false)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="page-title">Documents</h1>
        <p className="page-description">
          Upload PDFs to expand your knowledge base. Your documents are private and searchable only by you.
        </p>
      </div>

      <UploadDropzone />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <DocumentList documents={documents || []} />
      </Suspense>
    </div>
  );
}
