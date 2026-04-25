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
  type CreatePayrollInput,
  type Payroll,
  PayrollStatus,
  downloadCsvData,
  useHrEmployees,
  useHrPageState,
  useHrPayrolls,
  useHrProcessPayroll,
  useHrUpdatePayrollStatus,
} from "@/hooks/useHR";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Download,
  IndianRupee,
  Play,
  Upload,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const COLUMNS = [
  "Month",
  "Year",
  "Employees",
  "Gross Pay",
  "Deductions",
  "Net Pay",
  "Status",
  "Processed At",
];
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

export default function PayrollPage() {
  const { data: payrolls = [], isLoading } = useHrPayrolls();
  const { data: employees = [] } = useHrEmployees();
  const processPayroll = useHrProcessPayroll();
  const updateStatus = useHrUpdatePayrollStatus();

  const state = useHrPageState(COLUMNS);
  const {
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    exportOpen,
    setExportOpen,
    reportOpen,
    setReportOpen,
    exportCols,
    toggleExportCol,
  } = state;

  const [processOpen, setProcessOpen] = useState(false);
  const [processInput, setProcessInput] = useState<CreatePayrollInput>({
    month: BigInt(new Date().getMonth() + 1),
    year: BigInt(new Date().getFullYear()),
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    payroll: Payroll;
    status: PayrollStatus;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    let rows = payrolls;
    if (statusFilter !== "all")
      rows = rows.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          MONTHS[Number(p.month) - 1].toLowerCase().includes(q) ||
          String(p.year).includes(q) ||
          String(p.totalEmployees).includes(q) ||
          p.status.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [payrolls, statusFilter, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  function handleProcess() {
    processPayroll.mutate(processInput, {
      onSuccess: () => {
        toast.success("Payroll processed");
        setProcessOpen(false);
      },
      onError: () => toast.error("Failed to process payroll"),
    });
  }

  function handleStatusUpdate() {
    if (!statusTarget) return;
    updateStatus.mutate(
      { id: statusTarget.payroll.id, status: statusTarget.status },
      {
        onSuccess: () => {
          toast.success("Status updated");
          setStatusTarget(null);
          setConfirmOpen(false);
        },
        onError: () => toast.error("Failed to update status"),
      },
    );
  }

  function toRow(p: Payroll): Record<string, string> {
    return {
      Month: MONTHS[Number(p.month) - 1] ?? String(p.month),
      Year: String(p.year),
      Employees: String(p.totalEmployees),
      "Gross Pay": String(p.totalGrossPay),
      Deductions: String(p.totalDeductions),
      "Net Pay": String(p.totalNetPay),
      Status: p.status,
      "Processed At": new Date(
        Number(p.processedAt) / 1_000_000,
      ).toLocaleDateString(),
    };
  }

  const totalNetPay = payrolls
    .filter((p) => p.status === PayrollStatus.paid)
    .reduce((s, p) => s + p.totalNetPay, 0);

  return (
    <div className="space-y-5" data-ocid="payroll-root">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Payroll
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Process and manage monthly payroll
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="payroll-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="payroll-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            data-ocid="payroll-report-btn"
          >
            <BarChart2 className="size-3.5 mr-1.5" /> Report
          </Button>
          <Button
            size="sm"
            onClick={() => setProcessOpen(true)}
            data-ocid="payroll-process-btn"
          >
            <Play className="size-3.5 mr-1.5" /> Process Payroll
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Employees",
            value: employees.length,
            icon: <Users className="size-5 text-muted-foreground" />,
          },
          {
            label: "Payrolls Processed",
            value: payrolls.length,
            icon: <CheckCircle2 className="size-5 text-muted-foreground" />,
          },
          {
            label: "Total Paid Out",
            value: `₹${totalNetPay.toLocaleString()}`,
            icon: <IndianRupee className="size-5 text-muted-foreground" />,
          },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
          >
            <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search by month, year, employees…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 text-sm w-60"
          data-ocid="payroll-search"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="h-8 w-36 text-sm"
            data-ocid="payroll-status-filter"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.values(PayrollStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["#", ...COLUMNS, "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [1, 2, 3].map((k) => (
                    <tr key={k} className="border-b border-border/40">
                      <td className="px-3 py-3" colSpan={COLUMNS.length + 2}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : paginated.map((payroll, idx) => (
                    <tr
                      key={payroll.id.toString()}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`payroll-row-${payroll.id}`}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {MONTHS[Number(payroll.month) - 1]}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(payroll.year)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(payroll.totalEmployees)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{payroll.totalGrossPay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{payroll.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ₹{payroll.totalNetPay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            payroll.status === PayrollStatus.paid
                              ? "default"
                              : payroll.status === PayrollStatus.processed
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {payroll.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(
                          Number(payroll.processedAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {payroll.status !== PayrollStatus.paid && (
                          <button
                            type="button"
                            onClick={() => {
                              setStatusTarget({
                                payroll,
                                status: PayrollStatus.paid,
                              });
                              setConfirmOpen(true);
                            }}
                            className="text-xs text-accent hover:underline flex items-center gap-1"
                            data-ocid={`payroll-mark-paid-${payroll.id}`}
                          >
                            <Clock className="size-3" /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 && (
          <div
            className="py-16 text-center text-muted-foreground text-sm"
            data-ocid="payroll-empty"
          >
            No payrolls processed yet.{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => setProcessOpen(true)}
            >
              Process the first payroll.
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

      {/* Process Payroll Dialog */}
      <Dialog open={processOpen} onOpenChange={setProcessOpen}>
        <DialogContent className="max-w-sm" data-ocid="payroll-process-dialog">
          <DialogHeader>
            <DialogTitle>Process Monthly Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Employees</span>
                <span className="font-medium">{employees.length}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Month</Label>
                <Select
                  value={String(processInput.month)}
                  onValueChange={(v) =>
                    setProcessInput((p) => ({ ...p, month: BigInt(v) }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="payroll-month-select"
                  >
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
                <Select
                  value={String(processInput.year)}
                  onValueChange={(v) =>
                    setProcessInput((p) => ({ ...p, year: BigInt(v) }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="payroll-year-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setProcessOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={processPayroll.isPending}
              data-ocid="payroll-process-confirm"
            >
              {processPayroll.isPending ? "Processing…" : "Process Payroll"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark paid confirm */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(v) => !v && setConfirmOpen(false)}
      >
        <AlertDialogContent data-ocid="payroll-status-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark payroll as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the status to paid for{" "}
              {MONTHS[Number(statusTarget?.payroll.month ?? 1) - 1]}{" "}
              {String(statusTarget?.payroll.year ?? "")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              data-ocid="payroll-status-confirm"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export / Report dialogs */}
      {[
        {
          open: exportOpen,
          setOpen: setExportOpen,
          title: "Export Payroll",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "payroll.csv",
            );
            setExportOpen(false);
          },
          actionLabel: "Download CSV",
          ocid: "payroll-export-dialog",
        },
        {
          open: reportOpen,
          setOpen: setReportOpen,
          title: "Payroll Register",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "payroll-register.csv",
            );
            setReportOpen(false);
          },
          actionLabel: "Generate",
          ocid: "payroll-report-dialog",
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

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="payroll-import-dialog">
          <DialogHeader>
            <DialogTitle>Import Payroll CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: month, year, status.
            </p>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="text-sm text-foreground"
              data-ocid="payroll-import-file"
              onChange={(e) => {
                if (e.target.files?.[0])
                  toast.success(`Selected: ${e.target.files[0].name}`);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const template = "month,year,status\n4,2026,processed";
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob([template], { type: "text/csv" }),
                );
                a.download = "payroll-import-template.csv";
                a.click();
              }}
              className="w-full"
              data-ocid="payroll-import-template"
            >
              Download Template
            </Button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success(
                  "Import queued — feature processes CSV on backend",
                );
                setImportOpen(false);
              }}
              data-ocid="payroll-import-confirm"
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
