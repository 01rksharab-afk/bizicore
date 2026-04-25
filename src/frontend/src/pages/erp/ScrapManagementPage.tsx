/**
 * Scrap Management Page — full CRUD using backend ScrapRecord type.
 * Fields: scrapReason, scrapQty, scrapValue, moId (bigint), recordedBy
 */
import { ScrapManagementForm } from "@/components/erp/ErpForms";
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
import type { ScrapRecord } from "@/hooks/useERP";
import {
  useDeleteScrapRecord,
  useErpModuleEnabled,
  useListScrapRecords,
} from "@/hooks/useERP";
import { FileText, Recycle, Trash2 } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 25;
const COLS = [
  "Scrap Number",
  "MO ID",
  "Reason",
  "Scrap Qty",
  "Scrap Value",
  "Recorded By",
];

function downloadCSV(rows: ScrapRecord[], cols: string[], filename: string) {
  const m: Record<string, (r: ScrapRecord) => string> = {
    "Scrap Number": (r) => String(r.id),
    "MO ID": (r) => String(r.moId),
    Reason: (r) => r.scrapReason,
    "Scrap Qty": (r) => String(r.scrapQty),
    "Scrap Value": (r) => String(r.scrapValue),
    "Recorded By": (r) => r.recordedBy,
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

export default function ScrapManagementPage() {
  const { enabled, toggle } = useErpModuleEnabled();
  const [search, setSearch] = useState("");
  const { data: records = [], isLoading } = useListScrapRecords(search);
  const deleteScrap = useDeleteScrapRecord();
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
  const [editRec, setEditRec] = useState<ScrapRecord | undefined>();
  const [delTarget, setDelTarget] = useState<ScrapRecord | undefined>();
  const [bulkDelOpen, setBulkDelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportCols, setExportCols] = useState<Set<string>>(new Set(COLS));
  const [reportCols, setReportCols] = useState<Set<string>>(new Set(COLS));

  return (
    <div className="space-y-6" data-ocid="scrap-management-root">
      <ErpModuleHeader
        title="Scrap Management"
        description="Track and dispose of production scrap and waste materials."
        icon={<Recycle className="size-5" />}
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
          data-ocid="scrap-disabled-banner"
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
              data-ocid="scrap-bulk-bar"
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
                      "scrap-export.csv",
                    )
                  }
                  data-ocid="scrap-bulk-export"
                >
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1.5"
                  onClick={() => setBulkDelOpen(true)}
                  data-ocid="scrap-bulk-delete"
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
            <ErpEmpty label="Scrap records" />
          ) : (
            <ErpTable
              headers={[
                "",
                "#",
                "Scrap ID",
                "MO ID",
                "Reason",
                "Scrap Qty",
                "Scrap Value",
                "Recorded By",
                "Actions",
              ]}
            >
              <tr className="border-b border-border/40 bg-muted/10">
                <td className="px-4 py-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    data-ocid="scrap-select-all"
                  />
                </td>
                <td colSpan={8} />
              </tr>
              {paginated.map((r, idx) => (
                <tr
                  key={String(r.id)}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  data-ocid={`scrap-row-${r.id}`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleRow(r.id)}
                      aria-label={`Select SCR ${r.id}`}
                      data-ocid={`scrap-check-${r.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-accent">
                    SCR-{String(r.id)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    MO-{String(r.moId)}
                  </td>
                  <td
                    className="px-4 py-3 text-sm max-w-[200px] truncate"
                    title={r.scrapReason}
                  >
                    {r.scrapReason}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.scrapQty}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.scrapValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.recordedBy}
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
                        data-ocid={`scrap-edit-${r.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setDelTarget(r)}
                        data-ocid={`scrap-delete-${r.id}`}
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
              data-ocid="scrap-pagination"
            >
              <span>{records.length} records</span>
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

      <ScrapManagementForm
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
            <AlertDialogTitle>
              Delete SCR-{delTarget ? String(delTarget.id) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (delTarget) {
                  deleteScrap.mutate(delTarget.id);
                  setDelTarget(undefined);
                }
              }}
              data-ocid="scrap-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDelOpen} onOpenChange={setBulkDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} records?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                for (const id of selected) deleteScrap.mutate(id);
                setSelected(new Set());
                setBulkDelOpen(false);
              }}
              data-ocid="scrap-bulk-delete-confirm"
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
                  id={`scrap-exp-${c}`}
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
                  htmlFor={`scrap-exp-${c}`}
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
                downloadCSV(records, [...exportCols], "scrap-export.csv");
                setExportOpen(false);
              }}
              data-ocid="scrap-export-download"
            >
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Import Scrap Records</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Upload a CSV file.</p>
            <Input type="file" accept=".csv" data-ocid="scrap-import-file" />
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => downloadCSV([], COLS, "scrap-template.csv")}
            >
              Download template CSV
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button data-ocid="scrap-import-submit">Import</Button>
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
                  id={`scrap-rep-${c}`}
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
                  htmlFor={`scrap-rep-${c}`}
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
                downloadCSV(records, [...reportCols], "scrap-report.csv");
                setReportOpen(false);
              }}
              data-ocid="scrap-report-download"
            >
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
