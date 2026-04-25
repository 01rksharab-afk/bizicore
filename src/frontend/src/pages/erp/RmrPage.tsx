import { RmrForm } from "@/components/erp/ErpForms";
import {
  ErpEmpty,
  ErpModuleHeader,
  ErpStatusBadge,
} from "@/components/erp/ErpShared";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type RawMaterialRequisition,
  useDeleteRawMaterialRequisition,
  useErpModuleEnabled,
  useListRawMaterialRequisitions,
} from "@/hooks/useERP";
import { ClipboardList, FileText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useErpPageState } from "./useErpPageState";

const COLUMNS = ["MO ID", "Requested By", "Items Count", "Status"];
const PAGE_SIZE = 25;

export default function RmrPage() {
  const { enabled, toggle } = useErpModuleEnabled();
  const { data: rmrs = [], isLoading } = useListRawMaterialRequisitions();
  const deleteRmr = useDeleteRawMaterialRequisition();

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    exportOpen,
    setExportOpen,
    importOpen,
    setImportOpen,
    reportOpen,
    setReportOpen,
    exportCols,
    toggleExportCol,
    page,
    setPage,
    importFile,
    setImportFile,
  } = useErpPageState(COLUMNS);

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<
    RawMaterialRequisition | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<
    RawMaterialRequisition | undefined
  >();

  const filtered = useMemo(() => {
    let rows = rmrs;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.requestedBy.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    if (statusFilter && statusFilter !== "all") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    return rows;
  }, [rmrs, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const allSelected =
    paginated.length > 0 &&
    paginated.every((r) => selectedIds.has(String(r.id)));

  function handleSave(_: unknown) {
    setFormOpen(false);
    setEditRecord(undefined);
  }

  function handleDelete(rmr: RawMaterialRequisition) {
    deleteRmr.mutate(rmr.id);
    setDeleteTarget(undefined);
  }

  function downloadCsv(rows: RawMaterialRequisition[], cols: string[]) {
    const colMap: Record<string, (r: RawMaterialRequisition) => string> = {
      "MO ID": (r) => String(r.moId),
      "Requested By": (r) => r.requestedBy,
      "Items Count": (r) => String(r.items.length),
      Status: (r) => r.status,
    };
    const csv = [
      cols.join(","),
      ...rows.map((r) => cols.map((c) => colMap[c]?.(r) ?? "").join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "rmr-export.csv";
    a.click();
  }

  function downloadTemplate() {
    const csv =
      "Req Number,Work Order ID,Item Name,Required Qty,UOM,Status\nRMR-2024-001,wo-1,Steel Rod 10mm,200,PCS,pending";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "rmr-template.csv";
    a.click();
  }

  const selectedRows = rmrs.filter((r) => selectedIds.has(String(r.id)));

  return (
    <div className="space-y-5" data-ocid="rmr-root">
      <ErpModuleHeader
        title="Raw Material Requisition"
        description="Request raw materials needed for manufacturing work orders."
        icon={<ClipboardList className="size-5" />}
        moduleEnabled={enabled}
        onToggle={toggle}
        onNew={() => {
          setEditRecord(undefined);
          setFormOpen(true);
        }}
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilter={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        onImport={() => setImportOpen(true)}
        onExport={() => setExportOpen(true)}
        onReport={() => setReportOpen(true)}
      />

      {!enabled && (
        <div
          className="bg-muted/30 border border-border rounded-xl p-6 text-center text-muted-foreground text-sm"
          data-ocid="rmr-disabled-banner"
        >
          Module disabled — enable to make changes.
        </div>
      )}

      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm"
          data-ocid="rmr-bulk-bar"
        >
          <span className="font-medium text-accent">
            {selectedIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              downloadCsv(selectedRows, COLUMNS);
              clearSelection();
            }}
          >
            Export Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => {
              if (
                confirm(
                  `Delete ${selectedIds.size} records? This cannot be undone.`,
                )
              ) {
                for (const id of selectedIds) deleteRmr.mutate(BigInt(id));
                clearSelection();
              }
            }}
          >
            <Trash2 className="size-3" /> Bulk Delete
          </Button>
          <button
            type="button"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={clearSelection}
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) =>
                      v
                        ? selectAll(paginated.map((r) => String(r.id)))
                        : clearSelection()
                    }
                    aria-label="Select all"
                    data-ocid="rmr-select-all"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                  #
                </th>
                {COLUMNS.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? ["s1", "s2", "s3", "s4", "s5"].map((k) => (
                    <tr key={k} className="border-b border-border/40">
                      <td className="px-3 py-3" colSpan={COLUMNS.length + 3}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : paginated.map((rmr, idx) => (
                    <tr
                      key={rmr.id}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`rmr-row-${rmr.id}`}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(String(rmr.id))}
                          onCheckedChange={() => toggleSelect(String(rmr.id))}
                          aria-label={`Select RMR ${rmr.id}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-accent">
                        {String(rmr.moId)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {rmr.requestedBy}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {rmr.items.length} items
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        —
                      </td>
                      <td className="px-4 py-3">
                        <ErpStatusBadge status={rmr.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (enabled) {
                                setEditRecord(rmr);
                                setFormOpen(true);
                              }
                            }}
                            className="text-xs text-accent hover:underline disabled:opacity-40"
                            disabled={!enabled}
                            data-ocid={`rmr-edit-${rmr.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => enabled && setDeleteTarget(rmr)}
                            className="text-xs text-destructive hover:underline disabled:opacity-40"
                            disabled={!enabled}
                            data-ocid={`rmr-delete-${rmr.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 && (
          <ErpEmpty label="Raw Material Requisitions" />
        )}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground"
            data-ocid="rmr-pagination"
          >
            <span>{filtered.length} records</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <RmrForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditRecord(undefined);
        }}
        onSave={handleSave}
        initial={editRecord}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(undefined)}
      >
        <AlertDialogContent data-ocid="rmr-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete RMR #{String(deleteTarget?.id)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              data-ocid="rmr-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm" data-ocid="rmr-export-dialog">
          <DialogHeader>
            <DialogTitle>Export Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <Checkbox
                  id={`exp-rmr-${col}`}
                  checked={exportCols.has(col)}
                  onCheckedChange={() => toggleExportCol(col)}
                />
                <label
                  htmlFor={`exp-rmr-${col}`}
                  className="text-sm cursor-pointer"
                >
                  {col}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadCsv(filtered, [...exportCols]);
                setExportOpen(false);
              }}
              data-ocid="rmr-export-confirm"
            >
              Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="rmr-import-dialog">
          <DialogHeader>
            <DialogTitle>Import RMRs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="rmr-import-file"
                className="text-xs text-muted-foreground uppercase tracking-wide font-medium block mb-1.5"
              >
                Upload CSV File
              </label>
              <input
                id="rmr-import-file"
                type="file"
                accept=".csv"
                className="text-sm w-full"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                data-ocid="rmr-import-input"
              />
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
              data-ocid="rmr-template-download"
            >
              <FileText className="size-3.5" /> Download Template
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!importFile}
              onClick={() => setImportOpen(false)}
              data-ocid="rmr-import-confirm"
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm" data-ocid="rmr-report-dialog">
          <DialogHeader>
            <DialogTitle>Generate RMR Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <Checkbox
                  id={`rep-rmr-${col}`}
                  checked={exportCols.has(col)}
                  onCheckedChange={() => toggleExportCol(col)}
                />
                <label
                  htmlFor={`rep-rmr-${col}`}
                  className="text-sm cursor-pointer"
                >
                  {col}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadCsv(filtered, [...exportCols]);
                setReportOpen(false);
              }}
              data-ocid="rmr-report-confirm"
            >
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
