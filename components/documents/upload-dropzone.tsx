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
          setUploading(false);
          
          toast.error(errorMessage, { duration: 6000 });
          
          // Show hint in console for debugging
          if (hint) {
            console.warn("Upload hint:", hint);
          }
          return;
        }

        setUploadStatus("success");
        toast.success(
          `${file.name} uploaded — ${data.chunkCount ?? 0} chunks indexed across ${data.pageCount ?? 0} pages`,
          { duration: 5000 }
        );
        router.refresh();
        
        // Reset status after success animation
        setTimeout(() => {
          setUploadStatus("idle");
          setFileName(null);
          setUploading(false);
        }, 2500);
      } catch {
        const errorMessage = "Upload failed — check your connection";
        setErrorInfo({ error: errorMessage });
        setUploadStatus("error");
        setUploading(false);
        toast.error(errorMessage);
      }
    },
    [router],
  );

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: uploading,
    // Prevent dropzone from opening picker on click — we handle it ourselves
    noClick: false,
    noKeyboard: true, // We handle keyboard manually below
  });

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === " ") && !uploading) {
      e.preventDefault();
      openFilePicker();
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        onKeyDown={handleKeyDown}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
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
        aria-label={
          uploading
            ? `Uploading ${fileName ?? "file"}…`
            : "Upload PDF document — click or drag and drop"
        }
        tabIndex={uploading ? -1 : 0}
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
              <p className="text-xs text-primary mt-2 font-medium">Click or drop a file to try again</p>
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
