import { createClient } from "@/lib/supabase/server";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { DocumentList } from "@/components/documents/document-list";

/**
 * Documents page — upload dropzone + user document list.
 * Only shows user-owned documents (RLS, is_public=false).
 */
export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, page_count, chunk_count, status, size_bytes, created_at")
    .eq("is_public", false)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Upload PDFs to expand your knowledge base. Your documents are private and searchable only by you.
        </p>
      </div>

      <UploadDropzone />

      <DocumentList documents={documents || []} />
    </div>
  );
}
