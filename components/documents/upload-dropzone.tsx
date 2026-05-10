"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2 } from "lucide-react";

const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5 MB

/**
 * UploadDropzone — drag-and-drop PDF uploader.
 * Validates client-side, POSTs to /api/ingest, shows toast on result.
 */
export function UploadDropzone() {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Client-side validation
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("PDF exceeds 4.5 MB limit");
        return;
      }

      setUploading(true);
      setFileName(file.name);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ingest", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Upload failed");
          return;
        }

        toast.success(`${file.name} uploaded (${data.chunkCount} chunks)`);
        router.refresh(); // refresh documents list
      } catch {
        toast.error("Upload failed — check your connection");
      } finally {
        setUploading(false);
        setFileName(null);
      }
    },
    [router],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : uploading
            ? "border-muted bg-muted/50 cursor-wait"
            : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
      }`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm font-medium">Processing {fileName}...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Parsing, chunking, and embedding — this may take up to 30 seconds.
          </p>
        </>
      ) : isDragActive ? (
        <>
          <FileText className="h-8 w-8 text-primary mb-2" />
          <p className="text-sm font-medium">Drop your PDF here</p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Drag & drop a PDF, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            Max 4.5 MB, 25 pages. PDF only.
          </p>
        </>
      )}
    </div>
  );
}
