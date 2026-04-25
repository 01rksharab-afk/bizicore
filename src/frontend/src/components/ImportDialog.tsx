import { Download, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateUrl?: string;
  onImport: (file: File) => void | Promise<void>;
  accept?: string;
  title?: string;
}

export function ImportDialog({
  isOpen,
  onClose,
  templateUrl,
  onImport,
  accept = ".csv,.xlsx,.xls",
  title = "Import Data",
}: ImportDialogProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError("");
      setLoading(false);
      setDragging(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleFile = useCallback((file: File) => {
    setError("");
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a file to import.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onImport(selectedFile);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Import failed. Please check your file and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedFile, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-ocid="import-dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        tabIndex={-1}
        aria-label={title}
        className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-lg mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-display font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Template download */}
          {templateUrl && (
            <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Download the template to see the required format.
              </p>
              <a
                href={templateUrl}
                download
                data-ocid="import-template-download"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0 ml-3"
              >
                <Download className="h-3.5 w-3.5" />
                Template
              </a>
            </div>
          )}

          {/* Drop zone */}
          {/* Drop zone wrapper */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              dragging
                ? "border-primary bg-primary/5"
                : selectedFile
                  ? "border-accent/50 bg-accent/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-ocid="import-dropzone"
              className="w-full flex flex-col items-center justify-center gap-3 p-8 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            >
              <Upload
                className={`h-8 w-8 ${selectedFile ? "text-accent" : "text-muted-foreground"}`}
              />

              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Supported: {accept.split(",").join(", ")}
                  </p>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="sr-only"
              aria-label="File upload"
            />
          </div>

          {/* Error display */}
          {error && (
            <p
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
              data-ocid="import-error"
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || loading}
            data-ocid="import-submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
