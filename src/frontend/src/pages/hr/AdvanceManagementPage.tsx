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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  type Advance,
  AdvanceStatus,
  type CreateAdvanceInput,
  type UpdateAdvanceInput,
  downloadCsvData,
  useEmployeeMap,
  useHrAdvances,
  useHrCreateAdvance,
  useHrDeleteAdvance,
  useHrEmployees,
  useHrPageState,
  useHrUpdateAdvance,
} from "@/hooks/useHR";
import {
  BarChart2,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const COLUMNS = [
  "Employee",
  "Request Date",
  "Amount",
  "Reason",
  "Approved By",
  "Status",
];
const PAGE_SIZE = 25;

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [AdvanceStatus.approved]: "default",
  [AdvanceStatus.pending]: "secondary",
  [AdvanceStatus.rejected]: "destructive",
};

type AdvanceFormData = {
  employeeId: string;
  amount: number;
  requestDate: string;
  reason: string;
};

const EMPTY_FORM: AdvanceFormData = {
  employeeId: "",
  amount: 0,
  requestDate: new Date().toISOString().split("T")[0],
  reason: "",
};

export default function AdvanceManagementPage() {
  const { data: advances = [], isLoading } = useHrAdvances();
  const { data: employees = [] } = useHrEmployees();
  const createAdvance = useHrCreateAdvance();
  const updateAdvance = useHrUpdateAdvance();
  const deleteAdvance = useHrDeleteAdvance();
  const employeeMap = useEmployeeMap(employees);

  const state = useHrPageState(COLUMNS);
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    employeeFilter,
    setEmployeeFilter,
    page,
    setPage,
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
    importFile,
    setImportFile,
  } = state;

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<AdvanceFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Advance | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{
    advance: Advance;
    status: AdvanceStatus;
  } | null>(null);

  const filtered = useMemo(() => {
    let rows = advances;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (a) =>
          (employeeMap.get(a.employeeId.toString()) ?? "")
            .toLowerCase()
            .includes(q) || a.reason.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all")
      rows = rows.filter((a) => a.status === statusFilter);
    if (employeeFilter)
      rows = rows.filter((a) => a.employeeId.toString() === employeeFilter);
    return rows;
  }, [advances, search, statusFilter, employeeFilter, employeeMap]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const allSelected =
    paginated.length > 0 &&
    paginated.every((a) => selectedIds.has(a.id.toString()));

  function handleSave() {
    if (!formData.employeeId) {
      toast.error("Select an employee");
      return;
    }
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    const input: CreateAdvanceInput = {
      employeeId: BigInt(formData.employeeId),
      amount: formData.amount,
      requestDate: formData.requestDate,
      reason: formData.reason,
    };
    createAdvance.mutate(input, {
      onSuccess: () => {
        toast.success("Advance request created");
        setFormOpen(false);
      },
      onError: () => toast.error("Failed to create advance request"),
    });
  }

  function handleStatusUpdate() {
    if (!statusUpdateTarget) return;
    const input: UpdateAdvanceInput = {
      id: statusUpdateTarget.advance.id,
      status: statusUpdateTarget.status,
      approvedBy: "Admin",
    };
    updateAdvance.mutate(input, {
      onSuccess: () => {
        toast.success("Status updated");
        setStatusUpdateTarget(null);
      },
      onError: () => toast.error("Failed to update status"),
    });
  }

  function toRow(a: Advance): Record<string, string> {
    return {
      Employee:
        employeeMap.get(a.employeeId.toString()) ?? a.employeeId.toString(),
      "Request Date": a.requestDate,
      Amount: String(a.amount),
      Reason: a.reason,
      "Approved By": a.approvedBy,
      Status: a.status,
    };
  }

  function downloadTemplate() {
    const csv =
      "employeeId,amount,requestDate,reason\n1,5000,2026-01-01,Medical emergency";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "advances-template.csv";
    a.click();
  }

  const selectedRows = advances.filter((a) => selectedIds.has(a.id.toString()));

  // Summary stats
  const totalPending = advances.filter(
    (a) => a.status === AdvanceStatus.pending,
  ).length;
  const totalApproved = advances
    .filter((a) => a.status === AdvanceStatus.approved)
    .reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-5" data-ocid="advances-root">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Advance Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {advances.length} total requests
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="adv-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="adv-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            data-ocid="adv-report-btn"
          >
            <BarChart2 className="size-3.5 mr-1.5" /> Report
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormData(EMPTY_FORM);
              setFormOpen(true);
            }}
            data-ocid="adv-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Advance
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pending Approval",
            value: totalPending,
            className: "text-yellow-600 dark:text-yellow-400",
          },
          {
            label: "Total Approved",
            value: `₹${totalApproved.toLocaleString()}`,
            className: "text-green-600 dark:text-green-400",
          },
          {
            label: "Total Requests",
            value: advances.length,
            className: "text-foreground",
          },
        ].map(({ label, value, className }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-semibold mt-1 ${className}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search employee, reason…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-ocid="adv-search"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="h-8 w-36 text-sm"
            data-ocid="adv-status-filter"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.values(AdvanceStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={employeeFilter}
          onValueChange={(v) => {
            setEmployeeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="h-8 w-40 text-sm"
            data-ocid="adv-emp-filter"
          >
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id.toString()} value={e.id.toString()}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm">
          <span className="font-medium text-accent">
            {selectedIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              downloadCsvData(
                selectedRows.map(toRow),
                [...exportCols],
                "advances-export.csv",
              );
              clearSelection();
            }}
          >
            Export Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => setBulkDeletePending(true)}
          >
            <Trash2 className="size-3 mr-1" /> Bulk Delete
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

      {/* Table */}
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
                        ? selectAll(paginated.map((a) => a.id.toString()))
                        : clearSelection()
                    }
                    aria-label="Select all"
                    data-ocid="adv-select-all"
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
                ? [1, 2, 3].map((k) => (
                    <tr key={k} className="border-b border-border/40">
                      <td className="px-3 py-3" colSpan={COLUMNS.length + 3}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : paginated.map((adv, idx) => (
                    <tr
                      key={adv.id.toString()}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`adv-row-${adv.id}`}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(adv.id.toString())}
                          onCheckedChange={() =>
                            toggleSelect(adv.id.toString())
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {employeeMap.get(adv.employeeId.toString()) ??
                          `EMP-${adv.employeeId}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {adv.requestDate}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ₹{adv.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                        {adv.reason}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {adv.approvedBy || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={STATUS_VARIANTS[adv.status] ?? "secondary"}
                        >
                          {adv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {adv.status === AdvanceStatus.pending && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setStatusUpdateTarget({
                                    advance: adv,
                                    status: AdvanceStatus.approved,
                                  })
                                }
                                className="text-xs text-accent hover:underline"
                                data-ocid={`adv-approve-${adv.id}`}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStatusUpdateTarget({
                                    advance: adv,
                                    status: AdvanceStatus.rejected,
                                  })
                                }
                                className="text-xs text-destructive hover:underline"
                                data-ocid={`adv-reject-${adv.id}`}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(adv)}
                            className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                            data-ocid={`adv-delete-${adv.id}`}
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
          <div
            className="py-16 text-center text-muted-foreground text-sm"
            data-ocid="adv-empty"
          >
            No advance requests.{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setFormData(EMPTY_FORM);
                setFormOpen(true);
              }}
            >
              Create the first one.
            </button>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
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

      {/* New Advance Form */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-md" data-ocid="adv-form-dialog">
          <DialogHeader>
            <DialogTitle>Request Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Employee</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="adv-emp-select"
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id.toString()} value={e.id.toString()}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      amount: Number(e.target.value),
                    }))
                  }
                  className="h-8 text-sm"
                  data-ocid="adv-amount"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Request Date</Label>
                <Input
                  type="date"
                  value={formData.requestDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, requestDate: e.target.value }))
                  }
                  className="h-8 text-sm"
                  data-ocid="adv-date"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, reason: e.target.value }))
                }
                className="text-sm resize-none"
                rows={3}
                data-ocid="adv-reason"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createAdvance.isPending}
              data-ocid="adv-save-btn"
            >
              {createAdvance.isPending ? "Saving…" : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status update confirm */}
      <AlertDialog
        open={!!statusUpdateTarget}
        onOpenChange={(v) => !v && setStatusUpdateTarget(null)}
      >
        <AlertDialogContent data-ocid="adv-status-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusUpdateTarget?.status === AdvanceStatus.approved
                ? "Approve"
                : "Reject"}{" "}
              advance?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Amount: ₹{statusUpdateTarget?.advance.amount.toLocaleString()} for{" "}
              {employeeMap.get(
                statusUpdateTarget?.advance.employeeId.toString() ?? "",
              ) ?? "employee"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              className={
                statusUpdateTarget?.status === AdvanceStatus.rejected
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              data-ocid="adv-status-confirm"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="adv-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete advance request?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget &&
                deleteAdvance.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Deleted");
                    setDeleteTarget(null);
                  },
                })
              }
              data-ocid="adv-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog
        open={bulkDeletePending}
        onOpenChange={(v) => !v && setBulkDeletePending(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} advance requests?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                for (const id of selectedIds) deleteAdvance.mutate(BigInt(id));
                clearSelection();
                setBulkDeletePending(false);
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export / Report dialogs */}
      {[
        {
          open: exportOpen,
          setOpen: setExportOpen,
          title: "Export Advances",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "advances.csv",
            );
            setExportOpen(false);
          },
          actionLabel: "Download CSV",
          ocid: "adv-export-dialog",
        },
        {
          open: reportOpen,
          setOpen: setReportOpen,
          title: "Advance Report",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "advances-report.csv",
            );
            setReportOpen(false);
          },
          actionLabel: "Generate",
          ocid: "adv-report-dialog",
        },
      ].map(({ open, setOpen, title, action, actionLabel, ocid }) => (
        <Dialog key={ocid} open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm" data-ocid={ocid}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {COLUMNS.map((col) => (
                <div key={col} className="flex items-center gap-2">
                  <Checkbox
                    id={`${ocid}-${col}`}
                    checked={exportCols.has(col)}
                    onCheckedChange={() => toggleExportCol(col)}
                  />
                  <label
                    htmlFor={`${ocid}-${col}`}
                    className="text-sm cursor-pointer"
                  >
                    {col}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={action}>{actionLabel}</Button>
            </div>
          </DialogContent>
        </Dialog>
      ))}

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="adv-import-dialog">
          <DialogHeader>
            <DialogTitle>Import Advances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <input
              type="file"
              accept=".csv"
              className="text-sm w-full"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <FileText className="size-3.5" /> Download Template
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!importFile} onClick={() => setImportOpen(false)}>
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
