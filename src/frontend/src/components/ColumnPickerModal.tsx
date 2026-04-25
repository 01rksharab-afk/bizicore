import { Download, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

export interface ColumnConfig {
  key: string;
  label: string;
}

interface ColumnPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  selectedColumns: string[];
  onSelectionChange: (selected: string[]) => void;
  onExport: () => void;
}

export function ColumnPickerModal({
  isOpen,
  onClose,
  columns,
  selectedColumns,
  onSelectionChange,
  onExport,
}: ColumnPickerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const allSelected = selectedColumns.length === columns.length;
  const noneSelected = selectedColumns.length === 0;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(columns.map((c) => c.key));
    }
  }, [allSelected, columns, onSelectionChange]);

  const toggleColumn = useCallback(
    (key: string) => {
      if (selectedColumns.includes(key)) {
        onSelectionChange(selectedColumns.filter((k) => k !== key));
      } else {
        onSelectionChange([...selectedColumns, key]);
      }
    },
    [selectedColumns, onSelectionChange],
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-ocid="column-picker-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
        aria-label="Export Columns"
        className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-lg outline-none mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-display font-semibold text-foreground">
            Export Columns
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

        {/* Select All */}
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = !noneSelected && !allSelected;
              }}
              onChange={toggleAll}
              data-ocid="column-picker-select-all"
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-foreground">
              Select All ({selectedColumns.length}/{columns.length})
            </span>
          </label>
        </div>

        {/* Column list */}
        <ul className="px-5 py-3 max-h-72 overflow-y-auto space-y-1">
          {columns.map((col) => (
            <li key={col.key}>
              <label className="flex items-center gap-3 py-1.5 cursor-pointer rounded-md px-1 hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  data-ocid={`column-toggle-${col.key}`}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-foreground">{col.label}</span>
              </label>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onExport();
              onClose();
            }}
            disabled={noneSelected}
            data-ocid="column-picker-export"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
