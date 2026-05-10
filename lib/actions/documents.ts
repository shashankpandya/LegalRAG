"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { vectorStore } from "@/lib/rag/providers";
import { COLLECTION_NAME } from "@/lib/rag/providers/types";

/**
 * Delete a document and its Qdrant vectors.
 * RLS confirms ownership before deletion.
 */
export async function deleteDocument(docId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Delete from Supabase (RLS confirms ownership)
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", docId);

  if (error) throw new Error(`Failed to delete document: ${error.message}`);

  // Delete matching Qdrant points
  try {
    await vectorStore.deleteByFilter(COLLECTION_NAME, {
      must: [{ key: "doc_id", match: { value: docId } }],
    });
  } catch (err) {
    console.error("[deleteDocument] Qdrant cleanup failed:", err);
    // Don't throw — DB row is already deleted, Qdrant points are orphaned but harmless
  }

  revalidatePath("/documents");
}
