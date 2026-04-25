import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkExport: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
}: BulkActionsBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className="flex items-center justify-between gap-4 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-lg"
        data-ocid="bulk-actions-bar"
      >
        <span className="text-sm font-medium text-foreground">
          <span className="font-bold text-primary">{selectedCount}</span>{" "}
          {selectedCount === 1 ? "item" : "items"} selected
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBulkExport}
            data-ocid="bulk-export-btn"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            data-ocid="bulk-delete-btn"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-ocid="bulk-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} {selectedCount === 1 ? "item" : "items"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {selectedCount} {selectedCount === 1 ? "record" : "records"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                onBulkDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} {selectedCount === 1 ? "item" : "items"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
