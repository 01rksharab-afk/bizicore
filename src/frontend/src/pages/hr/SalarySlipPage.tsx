import { ErrorState } from "@/components/ErrorState";
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
import {
  type CreateSlipInput,
  type SalarySlip,
  SlipStatus,
  type UpdateSlipInput,
  downloadCsvData,
  useEmployeeMap,
  useHrCreateSlip,
  useHrDeleteSlip,
  useHrEmployees,
  useHrPageState,
  useHrSlips,
  useHrUpdateSlip,
} from "@/hooks/useHR";
import {
  BarChart2,
  Download,
  FileText,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const COLUMNS = [
  "Employee",
  "Month",
  "Year",
  "Basic",
  "HRA",
  "DA",
  "Other Allow.",
  "PF",
  "ESI",
  "TDS",
  "Advance Ded.",
  "Net Pay",
  "Status",
];
const PAGE_SIZE = 25;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type SlipFormData = {
  id?: bigint;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  da: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  advanceDeduction: number;
  status?: SlipStatus;
};

const EMPTY_FORM: SlipFormData = {
  employeeId: "",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  basicSalary: 0,
  hra: 0,
  da: 0,
  otherAllowances: 0,
  pfDeduction: 0,
  esiDeduction: 0,
  tdsDeduction: 0,
  advanceDeduction: 0,
};

function calcNet(f: SlipFormData) {
  const gross = f.basicSalary + f.hra + f.da + f.otherAllowances;
  const ded =
    f.pfDeduction + f.esiDeduction + f.tdsDeduction + f.advanceDeduction;
  return gross - ded;
}

export default function SalarySlipPage() {
  const { data: slips = [], isLoading, isError, refetch } = useHrSlips();
  const { data: employees = [] } = useHrEmployees();
  const createSlip = useHrCreateSlip();
  const updateSlip = useHrUpdateSlip();
  const deleteSlip = useHrDeleteSlip();
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
  const [formData, setFormData] = useState<SlipFormData>(EMPTY_FORM);
  const [viewSlip, setViewSlip] = useState<SalarySlip | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalarySlip | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);

  const filtered = useMemo(() => {
    let rows = slips;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((s) =>
        (employeeMap.get(s.employeeId.toString()) ?? "")
          .toLowerCase()
          .includes(q),
      );
    }
    if (statusFilter !== "all")
      rows = rows.filter((s) => s.status === statusFilter);
    if (employeeFilter)
      rows = rows.filter((s) => s.employeeId.toString() === employeeFilter);
    return rows;
  }, [slips, search, statusFilter, employeeFilter, employeeMap]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const allSelected =
    paginated.length > 0 &&
    paginated.every((s) => selectedIds.has(s.id.toString()));

  function openNew() {
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(slip: SalarySlip) {
    setFormData({
      id: slip.id,
      employeeId: slip.employeeId.toString(),
      month: Number(slip.month),
      year: Number(slip.year),
      basicSalary: slip.basicSalary,
      hra: slip.hra,
      da: slip.da,
      otherAllowances: slip.otherAllowances,
      pfDeduction: slip.pfDeduction,
      esiDeduction: slip.esiDeduction,
      tdsDeduction: slip.tdsDeduction,
      advanceDeduction: slip.advanceDeduction,
      status: slip.status,
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!formData.employeeId) {
      toast.error("Select an employee");
      return;
    }
    if (formData.id) {
      const input: UpdateSlipInput = {
        id: formData.id,
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        da: formData.da,
        otherAllowances: formData.otherAllowances,
        pfDeduction: formData.pfDeduction,
        esiDeduction: formData.esiDeduction,
        tdsDeduction: formData.tdsDeduction,
        advanceDeduction: formData.advanceDeduction,
        status: formData.status ?? SlipStatus.draft,
      };
      updateSlip.mutate(input, {
        onSuccess: () => {
          toast.success("Slip updated");
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to update"),
      });
    } else {
      const input: CreateSlipInput = {
        employeeId: BigInt(formData.employeeId),
        month: BigInt(formData.month),
        year: BigInt(formData.year),
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        da: formData.da,
        otherAllowances: formData.otherAllowances,
        pfDeduction: formData.pfDeduction,
        esiDeduction: formData.esiDeduction,
        tdsDeduction: formData.tdsDeduction,
        advanceDeduction: formData.advanceDeduction,
      };
      createSlip.mutate(input, {
        onSuccess: () => {
          toast.success("Slip generated");
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to generate"),
      });
    }
  }

  function toRow(s: SalarySlip): Record<string, string> {
    return {
      Employee:
        employeeMap.get(s.employeeId.toString()) ?? s.employeeId.toString(),
      Month: MONTHS[Number(s.month) - 1] ?? String(s.month),
      Year: String(s.year),
      Basic: String(s.basicSalary),
      HRA: String(s.hra),
      DA: String(s.da),
      "Other Allow.": String(s.otherAllowances),
      PF: String(s.pfDeduction),
      ESI: String(s.esiDeduction),
      TDS: String(s.tdsDeduction),
      "Advance Ded.": String(s.advanceDeduction),
      "Net Pay": String(s.netPay),
      Status: s.status,
    };
  }

  const selectedRows = slips.filter((s) => selectedIds.has(s.id.toString()));

  function printSlip(slip: SalarySlip) {
    const empName = employeeMap.get(slip.employeeId.toString()) ?? "Employee";
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Salary Slip</title></head><body>
      <h2>Salary Slip — ${MONTHS[Number(slip.month) - 1]} ${slip.year}</h2>
      <p><strong>Employee:</strong> ${empName}</p>
      <table border="1" cellpadding="6"><tr><th>Component</th><th>Amount</th></tr>
      <tr><td>Basic Salary</td><td>${slip.basicSalary}</td></tr>
      <tr><td>HRA</td><td>${slip.hra}</td></tr>
      <tr><td>DA</td><td>${slip.da}</td></tr>
      <tr><td>Other Allowances</td><td>${slip.otherAllowances}</td></tr>
      <tr><td>PF Deduction</td><td>-${slip.pfDeduction}</td></tr>
      <tr><td>ESI Deduction</td><td>-${slip.esiDeduction}</td></tr>
      <tr><td>TDS Deduction</td><td>-${slip.tdsDeduction}</td></tr>
      <tr><td>Advance Deduction</td><td>-${slip.advanceDeduction}</td></tr>
      <tr><td><strong>Net Pay</strong></td><td><strong>${slip.netPay}</strong></td></tr>
      </table></body></html>`);
    w.print();
  }

  return (
    <div className="space-y-5" data-ocid="salary-slips-root">
      {isError && (
        <ErrorState module="Salary Slips" onRetry={() => refetch()} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Salary Slips
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {slips.length} slips generated
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="slip-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            data-ocid="slip-report-btn"
          >
            <BarChart2 className="size-3.5 mr-1.5" /> Report
          </Button>
          <Button size="sm" onClick={openNew} data-ocid="slip-new-btn">
            <Plus className="size-3.5 mr-1.5" /> Generate Slip
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-ocid="slip-search"
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
            className="h-8 w-32 text-sm"
            data-ocid="slip-status-filter"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.values(SlipStatus).map((s) => (
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
            data-ocid="slip-emp-filter"
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
                "slips-export.csv",
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
                        ? selectAll(paginated.map((s) => s.id.toString()))
                        : clearSelection()
                    }
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                  #
                </th>
                {["Employee", "Period", "Basic", "Net Pay", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [1, 2, 3].map((k) => (
                    <tr key={k} className="border-b border-border/40">
                      <td className="px-3 py-3" colSpan={8}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : paginated.map((slip, idx) => (
                    <tr
                      key={slip.id.toString()}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`slip-row-${slip.id}`}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(slip.id.toString())}
                          onCheckedChange={() =>
                            toggleSelect(slip.id.toString())
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {employeeMap.get(slip.employeeId.toString()) ??
                          `EMP-${slip.employeeId}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {MONTHS[Number(slip.month) - 1]} {String(slip.year)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{slip.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ₹{slip.netPay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            slip.status === SlipStatus.paid
                              ? "default"
                              : slip.status === SlipStatus.generated
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {slip.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewSlip(slip)}
                            className="text-xs text-accent hover:underline"
                            data-ocid={`slip-view-${slip.id}`}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(slip)}
                            className="text-xs text-muted-foreground hover:underline"
                            data-ocid={`slip-edit-${slip.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => printSlip(slip)}
                            className="text-xs text-muted-foreground hover:underline"
                            data-ocid={`slip-print-${slip.id}`}
                          >
                            <Printer className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(slip)}
                            className="text-xs text-destructive hover:underline"
                            data-ocid={`slip-delete-${slip.id}`}
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
            data-ocid="slip-empty"
          >
            No salary slips.{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={openNew}
            >
              Generate the first one.
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

      {/* View slip dialog */}
      <Dialog open={!!viewSlip} onOpenChange={(v) => !v && setViewSlip(null)}>
        <DialogContent className="max-w-md" data-ocid="slip-view-dialog">
          <DialogHeader>
            <DialogTitle>
              Salary Slip —{" "}
              {viewSlip
                ? `${MONTHS[Number(viewSlip.month) - 1]} ${viewSlip.year}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          {viewSlip && (
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium">
                {employeeMap.get(viewSlip.employeeId.toString()) ??
                  `EMP-${viewSlip.employeeId}`}
              </p>
              <div className="bg-muted/30 rounded-lg divide-y divide-border text-sm">
                {[
                  ["Basic Salary", viewSlip.basicSalary],
                  ["HRA", viewSlip.hra],
                  ["DA", viewSlip.da],
                  ["Other Allowances", viewSlip.otherAllowances],
                  ["PF Deduction", `-${viewSlip.pfDeduction}`],
                  ["ESI Deduction", `-${viewSlip.esiDeduction}`],
                  ["TDS Deduction", `-${viewSlip.tdsDeduction}`],
                  ["Advance Deduction", `-${viewSlip.advanceDeduction}`],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between px-4 py-2"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span>₹{String(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 font-semibold">
                  <span>Net Pay</span>
                  <span className="text-primary">
                    ₹{viewSlip.netPay.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printSlip(viewSlip)}
                >
                  <Printer className="size-3.5 mr-1.5" /> Print PDF
                </Button>
                <Button size="sm" onClick={() => setViewSlip(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-lg" data-ocid="slip-form-dialog">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Salary Slip" : "Generate Salary Slip"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Employee</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="slip-emp-select"
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
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Select
                value={String(formData.month)}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, month: Number(v) }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, year: Number(e.target.value) }))
                }
                className="h-8 text-sm"
              />
            </div>
            {(
              [
                ["basicSalary", "Basic Salary"],
                ["hra", "HRA"],
                ["da", "DA"],
                ["otherAllowances", "Other Allowances"],
                ["pfDeduction", "PF Deduction"],
                ["esiDeduction", "ESI Deduction"],
                ["tdsDeduction", "TDS Deduction"],
                ["advanceDeduction", "Advance Deduction"],
              ] as [keyof SlipFormData, string][]
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number(formData[field] ?? 0)}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      [field]: Number(e.target.value),
                    }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-2 text-sm flex justify-between items-center">
            <span className="text-muted-foreground">Net Pay Preview</span>
            <span className="font-semibold text-primary">
              ₹{calcNet(formData).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createSlip.isPending || updateSlip.isPending}
              data-ocid="slip-save-btn"
            >
              {createSlip.isPending || updateSlip.isPending
                ? "Saving…"
                : formData.id
                  ? "Save"
                  : "Generate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete salary slip?</AlertDialogTitle>
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
                deleteSlip.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Deleted");
                    setDeleteTarget(null);
                  },
                })
              }
              data-ocid="slip-confirm-delete"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} slips?
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
                for (const id of selectedIds) deleteSlip.mutate(BigInt(id));
                clearSelection();
                setBulkDeletePending(false);
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {[
        {
          open: exportOpen,
          setOpen: setExportOpen,
          title: "Export Columns",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "salary-slips.csv",
            );
            setExportOpen(false);
          },
          actionLabel: "Download CSV",
          ocid: "slip-export-dialog",
        },
        {
          open: reportOpen,
          setOpen: setReportOpen,
          title: "Generate Report",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "salary-slips-report.csv",
            );
            setReportOpen(false);
          },
          actionLabel: "Generate",
          ocid: "slip-report-dialog",
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="slip-import-dialog">
          <DialogHeader>
            <DialogTitle>Import Slips</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <input
              type="file"
              accept=".csv"
              className="text-sm w-full"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              data-ocid="slip-import-input"
            />
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
              onClick={() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob(["employeeId,month,year,basicSalary,hra,da,..."], {
                    type: "text/csv",
                  }),
                );
                a.download = "slips-template.csv";
                a.click();
              }}
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
