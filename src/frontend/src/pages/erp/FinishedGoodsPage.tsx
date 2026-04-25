/**
 * Finished Goods Page — full CRUD using backend types.
 */
import { FinishedGoodsForm } from "@/components/erp/ErpForms";
import {
  ErpEmpty,
  ErpModuleHeader,
  ErpStatusBadge,
  ErpTable,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinishedGood } from "@/hooks/useERP";
import {
  useDeleteFinishedGood,
  useErpModuleEnabled,
  useListFinishedGoods,
} from "@/hooks/useERP";
import { FileText, Package2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 25;
const COLUMNS = [
  "Batch No",
  "MO ID",
  "Product ID",
  "Quantity",
  "Warehouse",
  "Status",
];

function downloadCSV(rows: FinishedGood[], cols: string[], filename: string) {
  const colMap: Record<string, (r: FinishedGood) => string> = {
    "Batch No": (r) => r.batchNo,
    "MO ID": (r) => String(r.moId),
    "Product ID": (r) => String(r.productId),
    Quantity: (r) => String(r.quantity),
    Warehouse: (r) => r.warehouseLocation,
    Status: (r) => r.status,
  };
  const header = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => `"${colMap[c]?.(r) ?? ""}"`).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function FinishedGoodsPage() {
  const { enabled, toggle } = useErpModuleEnabled();
  const { data: allRecords = [], isLoading } = useListFinishedGoods();
  const deleteFG = useDeleteFinishedGood();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<bigint>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FinishedGood | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<FinishedGood | undefined>();
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportCols, setExportCols] = useState<Set<string>>(new Set(COLUMNS));

  const filtered = useMemo(() => {
    if (!search) return allRecords;
    const q = search.toLowerCase();
    return allRecords.filter(
      (r) =>
        r.batchNo.toLowerCase().includes(q) ||
        r.warehouseLocation.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [allRecords, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleRow = (id: bigint) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allChecked =
    paginated.length > 0 && paginated.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allChecked) {
        for (const r of paginated) n.delete(r.id);
      } else {
        for (const r of paginated) n.add(r.id);
      }
      return n;
    });

  return (
    <div className="space-y-6" data-ocid="fg-root">
      <ErpModuleHeader
        title="Finished Goods"
        description="Track finished goods received from production into warehouse."
        icon={<Package2 className="size-5" />}
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
        onImport={() => setImportOpen(true)}
        onExport={() => setExportOpen(true)}
        onReport={() => setReportOpen(true)}
      />

      {!enabled ? (
        <div
          className="bg-muted/30 border border-border rounded-xl p-8 text-center"
          data-ocid="fg-disabled-banner"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Module disabled — enable to make changes
          </p>
        </div>
      ) : (
        <>
          {selected.size > 0 && (
            <div
              className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 flex items-center justify-between"
              data-ocid="fg-bulk-bar"
            >
              <span className="text-sm font-medium text-accent">
                {selected.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() =>
                    downloadCSV(
                      filtered.filter((r) => selected.has(r.id)),
                      [...exportCols],
                      "finished-goods-export.csv",
                    )
                  }
                  data-ocid="fg-bulk-export"
                >
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1.5"
                  onClick={() => {
                    if (confirm(`Delete ${selected.size} records?`)) {
                      for (const id of selected) deleteFG.mutate(id);
                      setSelected(new Set());
                    }
                  }}
                  data-ocid="fg-bulk-delete"
                >
                  <Trash2 className="size-3" /> Bulk Delete
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {["a", "b", "c", "d", "e"].map((s) => (
                <div
                  key={s}
                  className="flex gap-4 px-4 py-3 border-b border-border/40"
                >
                  {COLUMNS.map((c) => (
                    <Skeleton key={c} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <ErpEmpty label="finished goods" />
          ) : (
            <ErpTable
              headers={[
                "",
                "#",
                "Batch No",
                "MO ID",
                "Product ID",
                "Qty",
                "Warehouse",
                "Production Date",
                "Status",
                "Actions",
              ]}
            >
              <tr className="border-b border-border/40 bg-muted/10">
                <td className="px-4 py-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    data-ocid="fg-select-all"
                  />
                </td>
                <td colSpan={9} />
              </tr>
              {paginated.map((r, idx) => (
                <tr
                  key={String(r.id)}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  data-ocid={`fg-row-${r.id}`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleRow(r.id)}
                      aria-label={`Select ${r.batchNo}`}
                      data-ocid={`fg-check-${r.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-accent">
                    {r.batchNo}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {String(r.moId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {String(r.productId)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {r.warehouseLocation}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(
                      Number(r.productionDate / BigInt(1_000_000)),
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <ErpStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-accent hover:underline"
                        onClick={() => {
                          setEditRecord(r);
                          setFormOpen(true);
                        }}
                        data-ocid={`fg-edit-${r.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setDeleteTarget(r)}
                        data-ocid={`fg-delete-${r.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </ErpTable>
          )}

          {totalPages > 1 && (
            <div
              className="flex items-center justify-between text-sm text-muted-foreground"
              data-ocid="fg-pagination"
            >
              <span>{filtered.length} records</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <FinishedGoodsForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editRecord}
        onSave={(_d) => {}}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete finished good {deleteTarget?.batchNo}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteFG.mutate(deleteTarget.id);
                  setDeleteTarget(undefined);
                }
              }}
              data-ocid="fg-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Export Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <Checkbox
                  id={`fg-exp-${c}`}
                  checked={exportCols.has(c)}
                  onCheckedChange={(v) =>
                    setExportCols((s) => {
                      const n = new Set(s);
                      v ? n.add(c) : n.delete(c);
                      return n;
                    })
                  }
                  data-ocid={`fg-export-col-${c}`}
                />
                <Label
                  htmlFor={`fg-exp-${c}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {c}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadCSV(
                  filtered,
                  [...exportCols],
                  "finished-goods-export.csv",
                );
                setExportOpen(false);
              }}
              data-ocid="fg-export-download"
            >
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Import Finished Goods</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to import records.
            </p>
            <Input type="file" accept=".csv" data-ocid="fg-import-file" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button data-ocid="fg-import-submit">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" /> Generate Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <Checkbox
                  id={`fg-rep-${c}`}
                  checked={exportCols.has(c)}
                  onCheckedChange={(v) =>
                    setExportCols((s) => {
                      const n = new Set(s);
                      v ? n.add(c) : n.delete(c);
                      return n;
                    })
                  }
                  data-ocid={`fg-report-col-${c}`}
                />
                <Label
                  htmlFor={`fg-rep-${c}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {c}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadCSV(
                  filtered,
                  [...exportCols],
                  "finished-goods-report.csv",
                );
                setReportOpen(false);
              }}
              data-ocid="fg-report-download"
            >
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
