import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  /** The module/data name — e.g. "organizations", "inventory" */
  module?: string;
  /** Custom message override */
  message?: string;
  /** Called when the user clicks Retry */
  onRetry?: () => void;
  /** Extra wrapper className */
  className?: string;
}

/**
 * Consistent error card used across all data-loading pages.
 * Shows an alert icon, a "Something went wrong" message, and a Retry button.
 */
export function ErrorState({
  module,
  message,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const displayMsg =
    message ??
    (module
      ? `Something went wrong loading ${module}.`
      : "Something went wrong loading data.");

  return (
    <div
      className={`bg-card border border-destructive/30 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 ${className}`}
      data-ocid="error-state"
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{displayMsg}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Check your connection and try again.
        </p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 mt-1"
          onClick={onRetry}
          data-ocid="error-retry-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
