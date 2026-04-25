/**
 * Routing Page — full CRUD using backend RoutingOperation type.
 * Fields: code, name, description, machineId (bigint), standardTime, costPerHour, sequence (bigint)
 */
import { RoutingForm } from "@/components/erp/ErpForms";
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
import type { RoutingOperation } from "@/hooks/useERP";
import {
  useDeleteRoutingOperation,
  useErpModuleEnabled,
  useListRoutingOperations,
} from "@/hooks/useERP";
import { FileText, GitBranch, Trash2 } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 25;
const COLS = [
  "Routing Code",
  "Operation Name",
  "Machine ID",
  "Std Time (min)",
  "Cost/Hr",
  "Sequence",
];

function downloadCSV(
  rows: RoutingOperation[],
  cols: string[],
  filename: string,
) {
  const m: Record<string, (r: RoutingOperation) => string> = {
    "Routing Code": (r) => r.code,
    "Operation Name": (r) => r.name,
    "Machine ID": (r) => String(r.machineId),
    "Std Time (min)": (r) => String(r.standardTime),
    "Cost/Hr": (r) => String(r.costPerHour),
    Sequence: (r) => String(r.sequence),
    Description: (r) => r.description,
  };
  const blob = new Blob(
    [
      `${cols.join(",")}\n${rows.map((r) => cols.map((c) => `"${m[c]?.(r) ?? ""}"`).join(",")).join("\n")}`,
    ],
    { type: "text/csv" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function RoutingPage() {
  const { enabled, toggle } = useErpModuleEnabled();
  const [search, setSearch] = useState("");
  const { data: records = [], isLoading } = useListRoutingOperations(search);
  const deleteOp = useDeleteRoutingOperation();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const paginated = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [selected, setSelected] = useState<Set<bigint>>(new Set());
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
  const toggleRow = (id: bigint) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const [formOpen, setFormOpen] = useState(false);
  const [editRec, setEditRec] = useState<RoutingOperation | undefined>();
  const [delTarget, setDelTarget] = useState<RoutingOperation | undefined>();
  const [bulkDelOpen, setBulkDelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportCols, setExportCols] = useState<Set<string>>(new Set(COLS));
  const [reportCols, setReportCols] = useState<Set<string>>(new Set(COLS));

  return (
    <div className="space-y-6" data-ocid="routing-root">
      <ErpModuleHeader
        title="Routing / Operations"
        description="Define manufacturing operations, machine assignments, and cycle times."
        icon={<GitBranch className="size-5" />}
        moduleEnabled={enabled}
        onToggle={toggle}
        onNew={() => {
          setEditRec(undefined);
          setFormOpen(true);
        }}
        search={search}
        onSearch={setSearch}
        onImport={() => setImportOpen(true)}
        onExport={() => setExportOpen(true)}
        onReport={() => setReportOpen(true)}
      />

      {!enabled ? (
        <div
          className="bg-muted/30 border border-border rounded-xl p-8 text-center"
          data-ocid="routing-disabled-banner"
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
              data-ocid="routing-bulk-bar"
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
                      records.filter((r) => selected.has(r.id)),
                      [...exportCols],
                      "routing-export.csv",
                    )
                  }
                  data-ocid="routing-bulk-export"
                >
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1.5"
                  onClick={() => setBulkDelOpen(true)}
                  data-ocid="routing-bulk-delete"
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
                  {COLS.map((c) => (
                    <Skeleton key={c} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <ErpEmpty label="routing operations" />
          ) : (
            <ErpTable
              headers={[
                "",
                "#",
                "Routing Code",
                "Operation Name",
                "Machine ID",
                "Std Time (min)",
                "Cost/Hr",
                "Sequence",
                "Actions",
              ]}
            >
              <tr className="border-b border-border/40 bg-muted/10">
                <td className="px-4 py-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    data-ocid="routing-select-all"
                  />
                </td>
                <td colSpan={8} />
              </tr>
              {paginated.map((r, idx) => (
                <tr
                  key={String(r.id)}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  data-ocid={`routing-row-${r.id}`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleRow(r.id)}
                      aria-label={`Select ${r.code}`}
                      data-ocid={`routing-check-${r.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-accent">
                    {r.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    MCH-{String(r.machineId)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.standardTime}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.costPerHour}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {String(r.sequence)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-accent hover:underline"
                        onClick={() => {
                          setEditRec(r);
                          setFormOpen(true);
                        }}
                        data-ocid={`routing-edit-${r.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setDelTarget(r)}
                        data-ocid={`routing-delete-${r.id}`}
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
              data-ocid="routing-pagination"
            >
              <span>{records.length} operations</span>
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

      <RoutingForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editRec}
        onSave={() => {}}
      />

      <AlertDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {delTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (delTarget) {
                  deleteOp.mutate(delTarget.id);
                  setDelTarget(undefined);
                }
              }}
              data-ocid="routing-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDelOpen} onOpenChange={setBulkDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} operations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                for (const id of selected) deleteOp.mutate(id);
                setSelected(new Set());
                setBulkDelOpen(false);
              }}
              data-ocid="routing-bulk-delete-confirm"
            >
              Delete All
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
            {COLS.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <Checkbox
                  id={`routing-exp-${c}`}
                  checked={exportCols.has(c)}
                  onCheckedChange={(v) =>
                    setExportCols((s) => {
                      const n = new Set(s);
                      v ? n.add(c) : n.delete(c);
                      return n;
                    })
                  }
                />
                <Label
                  htmlFor={`routing-exp-${c}`}
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
                downloadCSV(records, [...exportCols], "routing-export.csv");
                setExportOpen(false);
              }}
              data-ocid="routing-export-download"
            >
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Import Routing Operations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Upload a CSV file.</p>
            <Input type="file" accept=".csv" data-ocid="routing-import-file" />
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => downloadCSV([], COLS, "routing-template.csv")}
            >
              Download template CSV
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button data-ocid="routing-import-submit">Import</Button>
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
            {COLS.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <Checkbox
                  id={`routing-rep-${c}`}
                  checked={reportCols.has(c)}
                  onCheckedChange={(v) =>
                    setReportCols((s) => {
                      const n = new Set(s);
                      v ? n.add(c) : n.delete(c);
                      return n;
                    })
                  }
                />
                <Label
                  htmlFor={`routing-rep-${c}`}
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
                downloadCSV(records, [...reportCols], "routing-report.csv");
                setReportOpen(false);
              }}
              data-ocid="routing-report-download"
            >
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
