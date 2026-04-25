import { Pencil, Trash2 } from "lucide-react";
import { useCallback } from "react";

export interface TableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  idKey?: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onEdit,
  onDelete,
  selectedIds = [],
  onSelectChange,
  idKey = "id" as keyof T,
  isLoading = false,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const getId = useCallback(
    (row: T): string => String(row[idKey] ?? ""),
    [idKey],
  );

  const toggleAll = useCallback(() => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(data.map(getId));
    }
  }, [allSelected, data, getId, onSelectChange]);

  const toggleRow = useCallback(
    (row: T) => {
      if (!onSelectChange) return;
      const id = getId(row);
      if (selectedIds.includes(id)) {
        onSelectChange(selectedIds.filter((s) => s !== id));
      } else {
        onSelectChange([...selectedIds, id]);
      }
    },
    [getId, onSelectChange, selectedIds],
  );

  const hasActions = onEdit ?? onDelete;
  const hasSelect = !!onSelectChange;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="space-y-0 divide-y divide-border">
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((skId) => (
            <div key={skId} className="flex items-center gap-4 px-4 py-3">
              {hasSelect && (
                <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              )}
              {columns.map((col) => (
                <div
                  key={String(col.key)}
                  className="h-4 rounded bg-muted animate-pulse flex-1"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-16 px-4 text-center gap-2"
        data-ocid="data-table-empty"
      >
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg">
          ○
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-border overflow-x-auto"
      data-ocid="data-table"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            {hasSelect && (
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  data-ocid="data-table-select-all"
                  aria-label="Select all rows"
                  className="h-4 w-4 rounded border-border accent-primary"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left font-semibold text-foreground font-display text-xs uppercase tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            {hasActions && (
              <th className="w-24 px-4 py-3 text-right font-semibold text-foreground font-display text-xs uppercase tracking-wide">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIdx) => {
            const id = getId(row);
            const isSelected = selectedIds.includes(id);
            return (
              <tr
                key={id || rowIdx}
                data-ocid={`data-table-row-${id || rowIdx}`}
                className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : "bg-card"}`}
              >
                {hasSelect && (
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row)}
                      aria-label={`Select row ${id}`}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const rawValue = row[col.key as keyof T];
                  return (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 text-foreground max-w-[240px] truncate"
                    >
                      {col.render
                        ? col.render(rawValue, row)
                        : rawValue != null
                          ? String(rawValue)
                          : "—"}
                    </td>
                  );
                })}
                {hasActions && (
                  <td className="w-24 px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          data-ocid={`edit-row-${id}`}
                          aria-label="Edit row"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          data-ocid={`delete-row-${id}`}
                          aria-label="Delete row"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
