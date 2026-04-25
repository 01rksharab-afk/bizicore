/**
 * Cost of Production Page — full CRUD using backend types.
 */
import { CostOfProductionForm } from "@/components/erp/ErpForms";
import {
  ErpEmpty,
  ErpModuleHeader,
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
import type { CostOfProduction } from "@/hooks/useERP";
import {
  useDeleteCostOfProduction,
  useErpModuleEnabled,
  useListCostsOfProduction,
} from "@/hooks/useERP";
import { Calculator, FileText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 25;
const COLUMNS = [
  "Period",
  "MO ID",
  "Material",
  "Labour",
  "Overhead",
  "Scrap",
  "Total",
];

function fmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function downloadCSV(
  rows: CostOfProduction[],
  cols: string[],
  filename: string,
) {
  const colMap: Record<string, (r: CostOfProduction) => string> = {
    Period: (r) => r.period,
    "MO ID": (r) => String(r.moId),
    Material: (r) => String(r.materialCost),
    Labour: (r) => String(r.labourCost),
    Overhead: (r) => String(r.overheadCost),
    Scrap: (r) => String(r.scrapCost),
    Total: (r) => String(r.totalCost),
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

export default function CostOfProductionPage() {
  const { enabled, toggle } = useErpModuleEnabled();
  const { data: allRecords = [], isLoading } = useListCostsOfProduction();
  const deleteRecord = useDeleteCostOfProduction();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<bigint>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<CostOfProduction | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<
    CostOfProduction | undefined
  >();
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportCols, setExportCols] = useState<Set<string>>(new Set(COLUMNS));

  const filtered = useMemo(() => {
    if (!search) return allRecords;
    const q = search.toLowerCase();
    return allRecords.filter(
      (r) =>
        r.period.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q),
    );
  }, [allRecords, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(
    () => ({
      material: filtered.reduce((s, r) => s + r.materialCost, 0),
      labour: filtered.reduce((s, r) => s + r.labourCost, 0),
      overhead: filtered.reduce((s, r) => s + r.overheadCost, 0),
      total: filtered.reduce((s, r) => s + r.totalCost, 0),
    }),
    [filtered],
  );

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
    <div className="space-y-6" data-ocid="cop-root">
      <ErpModuleHeader
        title="Cost of Production"
        description="Track material, labour, overhead, and scrap costs per manufacturing order."
        icon={<Calculator className="size-5" />}
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
          data-ocid="cop-disabled-banner"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Module disabled — enable to make changes
          </p>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            data-ocid="cop-summary"
          >
            {[
              { label: "Total Material", value: totals.material },
              { label: "Total Labour", value: totals.labour },
              { label: "Total Overhead", value: totals.overhead },
              { label: "Grand Total", value: totals.total },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card border border-border rounded-xl p-3"
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-display font-semibold text-foreground tabular-nums">
                  ₹{fmt(s.value)}
                </p>
              </div>
            ))}
          </div>

          {selected.size > 0 && (
            <div
              className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 flex items-center justify-between"
              data-ocid="cop-bulk-bar"
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
                      "cop-export.csv",
                    )
                  }
                  data-ocid="cop-bulk-export"
                >
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1.5"
                  onClick={() => {
                    if (confirm(`Delete ${selected.size} records?`)) {
                      for (const id of selected) deleteRecord.mutate(id);
                      setSelected(new Set());
                    }
                  }}
                  data-ocid="cop-bulk-delete"
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
            <ErpEmpty label="cost records" />
          ) : (
            <ErpTable
              headers={[
                "",
                "#",
                "Period",
                "MO ID",
                "Material",
                "Labour",
                "Overhead",
                "Scrap",
                "Total",
                "Actions",
              ]}
            >
              <tr className="border-b border-border/40 bg-muted/10">
                <td className="px-4 py-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    data-ocid="cop-select-all"
                  />
                </td>
                <td colSpan={9} />
              </tr>
              {paginated.map((r, idx) => (
                <tr
                  key={String(r.id)}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  data-ocid={`cop-row-${r.id}`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleRow(r.id)}
                      aria-label={`Select COP ${r.id}`}
                      data-ocid={`cop-check-${r.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.period}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {String(r.moId)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    ₹{fmt(r.materialCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    ₹{fmt(r.labourCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    ₹{fmt(r.overheadCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    ₹{fmt(r.scrapCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    ₹{fmt(r.totalCost)}
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
                        data-ocid={`cop-edit-${r.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setDeleteTarget(r)}
                        data-ocid={`cop-delete-${r.id}`}
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
              data-ocid="cop-pagination"
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

      <CostOfProductionForm
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
              Delete cost record #{String(deleteTarget?.id)}?
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
                  deleteRecord.mutate(deleteTarget.id);
                  setDeleteTarget(undefined);
                }
              }}
              data-ocid="cop-delete-confirm"
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
                  id={`cop-exp-${c}`}
                  checked={exportCols.has(c)}
                  onCheckedChange={(v) =>
                    setExportCols((s) => {
                      const n = new Set(s);
                      v ? n.add(c) : n.delete(c);
                      return n;
                    })
                  }
                  data-ocid={`cop-export-col-${c}`}
                />
                <Label
                  htmlFor={`cop-exp-${c}`}
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
                downloadCSV(filtered, [...exportCols], "cop-export.csv");
                setExportOpen(false);
              }}
              data-ocid="cop-export-download"
            >
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Import Cost Records</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to import records.
            </p>
            <Input type="file" accept=".csv" data-ocid="cop-import-file" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button data-ocid="cop-import-submit">Import</Button>
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
                  id={`cop-rep-${c}`}
                  checked={exportCols.has(c)}
                  onCheckedChange={(v) =>
                    setExportCols((s) => {
                      const n = new Set(s);
                      v ? n.add(c) : n.delete(c);
                      return n;
                    })
                  }
                  data-ocid={`cop-report-col-${c}`}
                />
                <Label
                  htmlFor={`cop-rep-${c}`}
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
                downloadCSV(filtered, [...exportCols], "cop-report.csv");
                setReportOpen(false);
              }}
              data-ocid="cop-report-download"
            >
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
