"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, FileWarning } from "lucide-react";

const MAX_SIZE = 4.5 * 1024 * 1024;

export function UploadDropzone() {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

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
        router.refresh();
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
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : uploading
            ? "border-muted bg-muted/50 cursor-wait"
            : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5 hover:shadow-sm"
      }`}
      role="button"
      aria-label="Upload PDF document"
      tabIndex={0}
    >
      <input {...getInputProps()} aria-label="Choose PDF file" />

      {uploading ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Processing {fileName}...</p>
            <p className="text-xs text-muted-foreground mt-1 text-balance">
              Parsing, chunking, and embedding — this may take up to 30 seconds.
            </p>
          </div>
        </div>
      ) : isDragActive ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium">Drop your PDF here</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF only &middot; Max 4.5 MB &middot; 25 pages
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
