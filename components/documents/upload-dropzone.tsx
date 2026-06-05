"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

const MAX_SIZE = 4.5 * 1024 * 1024;

interface UploadResult {
  ok: boolean;
  docId?: string;
  status?: string;
  chunkCount?: number;
  pageCount?: number;
  error?: string;
  details?: string;
  hint?: string;
}

export function UploadDropzone() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ error: string; hint?: string } | null>(null);
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
      setUploadStatus("uploading");
      setErrorInfo(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ingest", {
          method: "POST",
          body: formData,
        });

        const data: UploadResult = await res.json();

        if (!res.ok) {
          const errorMessage = data.error || "Upload failed";
          const hint = data.hint;
          
          setErrorInfo({ error: errorMessage, hint: hint || undefined });
          setUploadStatus("error");
          
          toast.error(errorMessage);
          
          // Show hint in console for debugging
          if (hint) {
            console.warn("Upload hint:", hint);
          }
          return;
        }

        setUploadStatus("success");
        toast.success(`${file.name} uploaded (${data.chunkCount} chunks)`);
        router.refresh();
        
        // Reset status after success animation
        setTimeout(() => {
          setUploadStatus("idle");
          setFileName(null);
        }, 2000);
      } catch {
        const errorMessage = "Upload failed — check your connection";
        setErrorInfo({ error: errorMessage });
        setUploadStatus("error");
        toast.error(errorMessage);
      } finally {
        if (uploadStatus !== "success") {
          setUploading(false);
        }
      }
    },
    [router, uploadStatus],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
          uploadStatus === "success"
            ? "border-green-500 bg-green-500/5"
            : isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : uploadStatus === "error"
                ? "border-red-500/50 bg-red-500/5"
                : uploading
                  ? "border-muted bg-muted/50 cursor-wait"
                  : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5 hover:shadow-md"
        }`}
        role="button"
        aria-label="Upload PDF document"
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label="Choose PDF file" />

        {uploadStatus === "success" ? (
          <div className="space-y-3 animate-fade-up">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Upload complete!</p>
              <p className="text-xs text-muted-foreground mt-1">Your document is now searchable</p>
            </div>
          </div>
        ) : uploadStatus === "uploading" ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Processing {fileName}...</p>
              <p className="text-xs text-muted-foreground mt-1 text-balance max-w-sm">
                Parsing, chunking, and embedding — this may take up to 30 seconds.
              </p>
            </div>
            {/* Progress indicator */}
            <div className="w-full max-w-xs mx-auto h-1 bg-muted rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary/50 animate-pulse rounded-full" style={{ width: "60%" }} />
            </div>
          </div>
        ) : uploadStatus === "error" ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Upload failed</p>
              {errorInfo && (
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">{errorInfo.error}</p>
              )}
            </div>
          </div>
        ) : isDragActive ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-7 w-7 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium">Drop your PDF here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Upload className="h-7 w-7 text-muted-foreground" />
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

      {/* Error hint banner */}
      {uploadStatus === "error" && errorInfo?.hint && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 animate-fade-up">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Configuration issue detected
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {errorInfo.hint}
            </p>
          </div>
        </div>
      )}

      {/* Requirements info */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Accepted: PDF files up to 4.5 MB and 25 pages</p>
        <p className="mt-1 text-muted-foreground/60">Documents are encrypted and only accessible to you</p>
      </div>
    </div>
  );
}
