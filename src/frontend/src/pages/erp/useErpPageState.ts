/**
 * Shared ERP page state hook — search, filters, selection, dialogs, pagination.
 * Used by all 6 ERP sub-module pages.
 */
import { useCallback, useState } from "react";

export function useErpPageState(columns: string[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Dialogs
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Export column selection (default all selected)
  const [exportCols, setExportCols] = useState<Set<string>>(
    () => new Set(columns),
  );

  const toggleExportCol = useCallback((col: string) => {
    setExportCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    page,
    setPage,
    exportOpen,
    setExportOpen,
    importOpen,
    setImportOpen,
    reportOpen,
    setReportOpen,
    importFile,
    setImportFile,
    exportCols,
    toggleExportCol,
  };
}
