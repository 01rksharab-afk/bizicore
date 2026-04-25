import { ErrorState } from "@/components/ErrorState";
import { BomForm } from "@/components/erp/ErpForms";
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
  type BillOfMaterial,
  useDeleteBom,
  useErpModuleEnabled,
  useListBoms,
} from "@/hooks/useERP";
import { FileStack, FileText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useErpPageState } from "./useErpPageState";

const COLUMNS = ["Product Name", "Revision", "Components Count", "Status"];
const PAGE_SIZE = 25;

export default function BomPage() {
  const { enabled, toggle } = useErpModuleEnabled();
  const { data: boms = [], isLoading, isError, refetch } = useListBoms();
  const deleteBom = useDeleteBom();

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
  const [editRecord, setEditRecord] = useState<BillOfMaterial | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<
    BillOfMaterial | undefined
  >();
  const [bulkDeletePending, setBulkDeletePending] = useState(false);

  const filtered = useMemo(() => {
    let rows = boms;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (b) =>
          b.productName.toLowerCase().includes(q) ||
          b.revision.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q),
      );
    }
    if (statusFilter && statusFilter !== "all") {
      rows = rows.filter((b) => b.status === statusFilter);
    }
    return rows;
  }, [boms, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const allSelected =
    paginated.length > 0 &&
    paginated.every((b) => selectedIds.has(String(b.id)));

  function openEdit(bom: BillOfMaterial) {
    setEditRecord(bom);
    setFormOpen(true);
  }

  function handleSave(_data: unknown) {
    setFormOpen(false);
    setEditRecord(undefined);
  }

  function handleDelete(bom: BillOfMaterial) {
    deleteBom.mutate(bom.id);
    setDeleteTarget(undefined);
  }

  function downloadCsv(rows: BillOfMaterial[], cols: string[]) {
    const colMap: Record<string, (b: BillOfMaterial) => string> = {
      "Product Name": (b) => b.productName,
      Revision: (b) => b.revision,
      "Components Count": (b) => String(b.components.length),
      Status: (b) => b.status,
    };
    const header = cols.join(",");
    const lines = rows.map((r) =>
      cols.map((c) => colMap[c]?.(r) ?? "").join(","),
    );
    const csv = [header, ...lines].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "bom-export.csv";
    a.click();
  }

  function downloadTemplate() {
    const csv =
      "Item Code,Name,Quantity,Unit,Status\nASM-001,Assembly Unit A,1,EA,pending";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "bom-template.csv";
    a.click();
  }

  const selectedRows = boms.filter((b) => selectedIds.has(String(b.id)));

  return (
    <div className="space-y-5" data-ocid="bom-root">
      {isError && (
        <ErrorState module="Bill of Materials" onRetry={() => refetch()} />
      )}
      <ErpModuleHeader
        title="Bill of Materials"
        description="Define component structures for manufactured products."
        icon={<FileStack className="size-5" />}
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
          data-ocid="bom-disabled-banner"
        >
          Module disabled — enable to make changes.
        </div>
      )}

      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm"
          data-ocid="bom-bulk-bar"
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
            onClick={() => setBulkDeletePending(true)}
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
                        ? selectAll(paginated.map((b) => String(b.id)))
                        : clearSelection()
                    }
                    aria-label="Select all"
                    data-ocid="bom-select-all"
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
                : paginated.map((bom, idx) => (
                    <tr
                      key={bom.id}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`bom-row-${bom.id}`}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(String(bom.id))}
                          onCheckedChange={() => toggleSelect(String(bom.id))}
                          aria-label={`Select ${bom.productName}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {bom.productName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bom.revision}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bom.components.length} parts
                      </td>
                      <td className="px-4 py-3">
                        <ErpStatusBadge status={bom.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => enabled && openEdit(bom)}
                            className="text-xs text-accent hover:underline disabled:opacity-40"
                            disabled={!enabled}
                            data-ocid={`bom-edit-${bom.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => enabled && setDeleteTarget(bom)}
                            className="text-xs text-destructive hover:underline disabled:opacity-40"
                            disabled={!enabled}
                            data-ocid={`bom-delete-${bom.id}`}
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
          <ErpEmpty label="Bill of Materials" />
        )}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground"
            data-ocid="bom-pagination"
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

      <BomForm
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
        <AlertDialogContent data-ocid="bom-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.productName}?
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
              data-ocid="bom-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeletePending}
        onOpenChange={(v) => !v && setBulkDeletePending(false)}
      >
        <AlertDialogContent data-ocid="bom-bulk-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} record
              {selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected Bill of Materials
              entries. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                for (const id of selectedIds) deleteBom.mutate(BigInt(id));
                clearSelection();
                setBulkDeletePending(false);
              }}
              data-ocid="bom-bulk-confirm-delete"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm" data-ocid="bom-export-dialog">
          <DialogHeader>
            <DialogTitle>Export Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <Checkbox
                  id={`exp-bom-${col}`}
                  checked={exportCols.has(col)}
                  onCheckedChange={() => toggleExportCol(col)}
                />
                <label
                  htmlFor={`exp-bom-${col}`}
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
              data-ocid="bom-export-confirm"
            >
              Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="bom-import-dialog">
          <DialogHeader>
            <DialogTitle>Import BOMs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="bom-import-file"
                className="text-xs text-muted-foreground uppercase tracking-wide font-medium block mb-1.5"
              >
                Upload CSV File
              </label>
              <input
                id="bom-import-file"
                type="file"
                accept=".csv"
                className="text-sm w-full"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                data-ocid="bom-import-input"
              />
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
              data-ocid="bom-template-download"
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
              data-ocid="bom-import-confirm"
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm" data-ocid="bom-report-dialog">
          <DialogHeader>
            <DialogTitle>Generate BOM Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <Checkbox
                  id={`rep-bom-${col}`}
                  checked={exportCols.has(col)}
                  onCheckedChange={() => toggleExportCol(col)}
                />
                <label
                  htmlFor={`rep-bom-${col}`}
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
              data-ocid="bom-report-confirm"
            >
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
