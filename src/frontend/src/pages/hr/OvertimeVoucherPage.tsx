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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type CreateOvertimeInput,
  type CreateVoucherInput,
  type Overtime,
  type Voucher,
  VoucherStatus__1,
  VoucherType,
  downloadCsvData,
  useEmployeeMap,
  useHrApproveVoucher,
  useHrCreateOvertime,
  useHrCreateVoucher,
  useHrDeleteOvertime,
  useHrDeleteVoucher,
  useHrEmployees,
  useHrOvertime,
  useHrPageState,
  useHrVouchers,
} from "@/hooks/useHR";
import {
  BarChart2,
  Clock,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const OT_COLUMNS = ["Employee", "Date", "Hours", "Rate", "Amount", "Notes"];
const VC_COLUMNS = ["Employee", "Date", "Type", "Amount", "Notes", "Status"];
const PAGE_SIZE = 25;

type OTForm = {
  employeeId: string;
  date: string;
  hours: number;
  rate: number;
  notes: string;
};
type VCForm = {
  employeeId: string;
  date: string;
  voucherType: VoucherType;
  amount: number;
  notes: string;
};

const EMPTY_OT: OTForm = {
  employeeId: "",
  date: new Date().toISOString().split("T")[0],
  hours: 1,
  rate: 0,
  notes: "",
};
const EMPTY_VC: VCForm = {
  employeeId: "",
  date: new Date().toISOString().split("T")[0],
  voucherType: VoucherType.meal,
  amount: 0,
  notes: "",
};

export default function OvertimeVoucherPage() {
  const { data: employees = [] } = useHrEmployees();
  const { data: overtime = [], isLoading: otLoading } = useHrOvertime();
  const { data: vouchers = [], isLoading: vcLoading } = useHrVouchers();
  const createOt = useHrCreateOvertime();
  const deleteOt = useHrDeleteOvertime();
  const createVc = useHrCreateVoucher();
  const approveVc = useHrApproveVoucher();
  const deleteVc = useHrDeleteVoucher();
  const employeeMap = useEmployeeMap(employees);

  const otState = useHrPageState(OT_COLUMNS);
  const vcState = useHrPageState(VC_COLUMNS);

  const [tab, setTab] = useState("overtime");
  const [otFormOpen, setOtFormOpen] = useState(false);
  const [otForm, setOtForm] = useState<OTForm>(EMPTY_OT);
  const [deleteOtTarget, setDeleteOtTarget] = useState<Overtime | null>(null);
  const [vcFormOpen, setVcFormOpen] = useState(false);
  const [vcForm, setVcForm] = useState<VCForm>(EMPTY_VC);
  const [deleteVcTarget, setDeleteVcTarget] = useState<Voucher | null>(null);

  // OT filtering
  const filteredOt = useMemo(() => {
    let rows = overtime;
    if (otState.search) {
      const q = otState.search.toLowerCase();
      rows = rows.filter(
        (o) =>
          (employeeMap.get(o.employeeId.toString()) ?? "")
            .toLowerCase()
            .includes(q) || o.date.includes(q),
      );
    }
    if (otState.dateFrom) rows = rows.filter((o) => o.date >= otState.dateFrom);
    if (otState.dateTo) rows = rows.filter((o) => o.date <= otState.dateTo);
    if (otState.employeeFilter)
      rows = rows.filter(
        (o) => o.employeeId.toString() === otState.employeeFilter,
      );
    return rows;
  }, [overtime, otState, employeeMap]);

  // Voucher filtering
  const filteredVc = useMemo(() => {
    let rows = vouchers;
    if (vcState.search) {
      const q = vcState.search.toLowerCase();
      rows = rows.filter((v) =>
        (employeeMap.get(v.employeeId.toString()) ?? "")
          .toLowerCase()
          .includes(q),
      );
    }
    if (vcState.statusFilter !== "all")
      rows = rows.filter((v) => v.status === vcState.statusFilter);
    if (vcState.employeeFilter)
      rows = rows.filter(
        (v) => v.employeeId.toString() === vcState.employeeFilter,
      );
    return rows;
  }, [vouchers, vcState, employeeMap]);

  const otPaginated = filteredOt.slice(
    (otState.page - 1) * PAGE_SIZE,
    otState.page * PAGE_SIZE,
  );
  const vcPaginated = filteredVc.slice(
    (vcState.page - 1) * PAGE_SIZE,
    vcState.page * PAGE_SIZE,
  );
  const otPages = Math.max(1, Math.ceil(filteredOt.length / PAGE_SIZE));
  const vcPages = Math.max(1, Math.ceil(filteredVc.length / PAGE_SIZE));

  function handleCreateOt() {
    if (!otForm.employeeId) {
      toast.error("Select an employee");
      return;
    }
    const input: CreateOvertimeInput = {
      employeeId: BigInt(otForm.employeeId),
      date: otForm.date,
      hours: otForm.hours,
      rate: otForm.rate,
      notes: otForm.notes,
    };
    createOt.mutate(input, {
      onSuccess: () => {
        toast.success("Overtime logged");
        setOtFormOpen(false);
      },
      onError: () => toast.error("Failed to log"),
    });
  }

  function handleCreateVc() {
    if (!vcForm.employeeId) {
      toast.error("Select an employee");
      return;
    }
    const input: CreateVoucherInput = {
      employeeId: BigInt(vcForm.employeeId),
      date: vcForm.date,
      voucherType: vcForm.voucherType,
      amount: vcForm.amount,
      notes: vcForm.notes,
    };
    createVc.mutate(input, {
      onSuccess: () => {
        toast.success("Voucher created");
        setVcFormOpen(false);
      },
      onError: () => toast.error("Failed to create"),
    });
  }

  function toOtRow(o: Overtime): Record<string, string> {
    return {
      Employee:
        employeeMap.get(o.employeeId.toString()) ?? o.employeeId.toString(),
      Date: o.date,
      Hours: String(o.hours),
      Rate: String(o.rate),
      Amount: String(o.amount),
      Notes: o.notes,
    };
  }

  function toVcRow(v: Voucher): Record<string, string> {
    return {
      Employee:
        employeeMap.get(v.employeeId.toString()) ?? v.employeeId.toString(),
      Date: v.date,
      Type: v.voucherType,
      Amount: String(v.amount),
      Notes: v.notes,
      Status: v.status,
    };
  }

  function downloadTemplate(type: "ot" | "vc") {
    const csv =
      type === "ot"
        ? "employeeId,date,hours,rate,notes\n1,2026-01-01,2,150,"
        : "employeeId,date,voucherType,amount,notes\n1,2026-01-01,meal,200,";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${type}-template.csv`;
    a.click();
  }

  return (
    <div className="space-y-5" data-ocid="ot-voucher-root">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Overtime & Vouchers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track overtime hours and expense vouchers
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overtime" data-ocid="tab-overtime">
            Overtime
          </TabsTrigger>
          <TabsTrigger value="vouchers" data-ocid="tab-vouchers">
            Vouchers
          </TabsTrigger>
        </TabsList>

        {/* ── Overtime Tab ── */}
        <TabsContent value="overtime" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {overtime.length} records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => otState.setImportOpen(true)}
              >
                <Upload className="size-3.5 mr-1.5" /> Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCsvData(
                    filteredOt.map(toOtRow),
                    OT_COLUMNS,
                    "overtime.csv",
                  );
                }}
              >
                <Download className="size-3.5 mr-1.5" /> Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCsvData(
                    filteredOt.map(toOtRow),
                    OT_COLUMNS,
                    "overtime-report.csv",
                  );
                }}
              >
                <BarChart2 className="size-3.5 mr-1.5" /> Report
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setOtForm(EMPTY_OT);
                  setOtFormOpen(true);
                }}
                data-ocid="ot-new-btn"
              >
                <Plus className="size-3.5 mr-1.5" /> Log Overtime
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search…"
                value={otState.search}
                onChange={(e) => {
                  otState.setSearch(e.target.value);
                  otState.setPage(1);
                }}
                data-ocid="ot-search"
              />
            </div>
            <Select
              value={otState.employeeFilter}
              onValueChange={(v) => {
                otState.setEmployeeFilter(v);
                otState.setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id.toString()} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={otState.dateFrom}
              onChange={(e) => {
                otState.setDateFrom(e.target.value);
                otState.setPage(1);
              }}
              data-ocid="ot-date-from"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={otState.dateTo}
              onChange={(e) => {
                otState.setDateTo(e.target.value);
                otState.setPage(1);
              }}
              data-ocid="ot-date-to"
            />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                      #
                    </th>
                    {OT_COLUMNS.map((h) => (
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
                  {otLoading
                    ? [1, 2, 3].map((k) => (
                        <tr key={k} className="border-b border-border/40">
                          <td
                            colSpan={OT_COLUMNS.length + 2}
                            className="px-3 py-3"
                          >
                            <Skeleton className="h-4 w-full" />
                          </td>
                        </tr>
                      ))
                    : otPaginated.map((ot, idx) => (
                        <tr
                          key={ot.id.toString()}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                          data-ocid={`ot-row-${ot.id}`}
                        >
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {(otState.page - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {employeeMap.get(ot.employeeId.toString()) ??
                              `EMP-${ot.employeeId}`}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {ot.date}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {ot.hours}h
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            ₹{ot.rate}/h
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            ₹{ot.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                            {ot.notes}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setDeleteOtTarget(ot)}
                              className="text-xs text-destructive hover:underline"
                              data-ocid={`ot-delete-${ot.id}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {!otLoading && filteredOt.length === 0 && (
              <div
                className="py-12 text-center text-muted-foreground text-sm"
                data-ocid="ot-empty"
              >
                No overtime records.
              </div>
            )}
            {otPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span>{filteredOt.length} records</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      otState.setPage(Math.max(1, otState.page - 1))
                    }
                    disabled={otState.page === 1}
                  >
                    Prev
                  </Button>
                  <span className="px-2">
                    {otState.page} / {otPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      otState.setPage(Math.min(otPages, otState.page + 1))
                    }
                    disabled={otState.page === otPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Vouchers Tab ── */}
        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {vouchers.length} vouchers
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => vcState.setImportOpen(true)}
              >
                <Upload className="size-3.5 mr-1.5" /> Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCsvData(
                    filteredVc.map(toVcRow),
                    VC_COLUMNS,
                    "vouchers.csv",
                  );
                }}
              >
                <Download className="size-3.5 mr-1.5" /> Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCsvData(
                    filteredVc.map(toVcRow),
                    VC_COLUMNS,
                    "vouchers-report.csv",
                  );
                }}
              >
                <BarChart2 className="size-3.5 mr-1.5" /> Report
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setVcForm(EMPTY_VC);
                  setVcFormOpen(true);
                }}
                data-ocid="vc-new-btn"
              >
                <Plus className="size-3.5 mr-1.5" /> New Voucher
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search…"
                value={vcState.search}
                onChange={(e) => {
                  vcState.setSearch(e.target.value);
                  vcState.setPage(1);
                }}
                data-ocid="vc-search"
              />
            </div>
            <Select
              value={vcState.statusFilter}
              onValueChange={(v) => {
                vcState.setStatusFilter(v);
                vcState.setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.values(VoucherStatus__1).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={vcState.employeeFilter}
              onValueChange={(v) => {
                vcState.setEmployeeFilter(v);
                vcState.setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id.toString()} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                      #
                    </th>
                    {VC_COLUMNS.map((h) => (
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
                  {vcLoading
                    ? [1, 2, 3].map((k) => (
                        <tr key={k} className="border-b border-border/40">
                          <td
                            colSpan={VC_COLUMNS.length + 2}
                            className="px-3 py-3"
                          >
                            <Skeleton className="h-4 w-full" />
                          </td>
                        </tr>
                      ))
                    : vcPaginated.map((vc, idx) => (
                        <tr
                          key={vc.id.toString()}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                          data-ocid={`vc-row-${vc.id}`}
                        >
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {(vcState.page - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {employeeMap.get(vc.employeeId.toString()) ??
                              `EMP-${vc.employeeId}`}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {vc.date}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">{vc.voucherType}</Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            ₹{vc.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                            {vc.notes}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                vc.status === VoucherStatus__1.approved
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {vc.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {vc.status === VoucherStatus__1.pending && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    approveVc.mutate(
                                      { id: vc.id, approved: true },
                                      {
                                        onSuccess: () =>
                                          toast.success("Approved"),
                                      },
                                    )
                                  }
                                  className="text-xs text-accent hover:underline"
                                  data-ocid={`vc-approve-${vc.id}`}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteVcTarget(vc)}
                                className="text-xs text-destructive hover:underline"
                                data-ocid={`vc-delete-${vc.id}`}
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
            {!vcLoading && filteredVc.length === 0 && (
              <div
                className="py-12 text-center text-muted-foreground text-sm"
                data-ocid="vc-empty"
              >
                No vouchers.
              </div>
            )}
            {vcPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span>{filteredVc.length} records</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      vcState.setPage(Math.max(1, vcState.page - 1))
                    }
                    disabled={vcState.page === 1}
                  >
                    Prev
                  </Button>
                  <span className="px-2">
                    {vcState.page} / {vcPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      vcState.setPage(Math.min(vcPages, vcState.page + 1))
                    }
                    disabled={vcState.page === vcPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* OT Form Dialog */}
      <Dialog
        open={otFormOpen}
        onOpenChange={(v) => !v && setOtFormOpen(false)}
      >
        <DialogContent className="max-w-md" data-ocid="ot-form-dialog">
          <DialogHeader>
            <DialogTitle>Log Overtime</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Employee</Label>
              <Select
                value={otForm.employeeId}
                onValueChange={(v) =>
                  setOtForm((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
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
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={otForm.date}
                onChange={(e) =>
                  setOtForm((p) => ({ ...p, date: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hours</Label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={otForm.hours}
                onChange={(e) =>
                  setOtForm((p) => ({ ...p, hours: Number(e.target.value) }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rate (₹/hr)</Label>
              <Input
                type="number"
                min={0}
                value={otForm.rate}
                onChange={(e) =>
                  setOtForm((p) => ({ ...p, rate: Number(e.target.value) }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input
                value={otForm.notes}
                onChange={(e) =>
                  setOtForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOtFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOt}
              disabled={createOt.isPending}
              data-ocid="ot-save-btn"
            >
              {createOt.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Form Dialog */}
      <Dialog
        open={vcFormOpen}
        onOpenChange={(v) => !v && setVcFormOpen(false)}
      >
        <DialogContent className="max-w-md" data-ocid="vc-form-dialog">
          <DialogHeader>
            <DialogTitle>New Voucher</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Employee</Label>
              <Select
                value={vcForm.employeeId}
                onValueChange={(v) =>
                  setVcForm((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
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
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={vcForm.date}
                onChange={(e) =>
                  setVcForm((p) => ({ ...p, date: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={vcForm.voucherType}
                onValueChange={(v) =>
                  setVcForm((p) => ({ ...p, voucherType: v as VoucherType }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(VoucherType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={vcForm.amount}
                onChange={(e) =>
                  setVcForm((p) => ({ ...p, amount: Number(e.target.value) }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input
                value={vcForm.notes}
                onChange={(e) =>
                  setVcForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setVcFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateVc}
              disabled={createVc.isPending}
              data-ocid="vc-save-btn"
            >
              {createVc.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirms */}
      <AlertDialog
        open={!!deleteOtTarget}
        onOpenChange={(v) => !v && setDeleteOtTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete overtime record?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteOtTarget &&
                deleteOt.mutate(deleteOtTarget.id, {
                  onSuccess: () => {
                    toast.success("Deleted");
                    setDeleteOtTarget(null);
                  },
                })
              }
              data-ocid="ot-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteVcTarget}
        onOpenChange={(v) => !v && setDeleteVcTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteVcTarget &&
                deleteVc.mutate(deleteVcTarget.id, {
                  onSuccess: () => {
                    toast.success("Deleted");
                    setDeleteVcTarget(null);
                  },
                })
              }
              data-ocid="vc-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import dialogs */}
      {[
        {
          open: otState.importOpen,
          setOpen: otState.setImportOpen,
          ocid: "ot-import-dialog",
          title: "Import Overtime",
          type: "ot" as const,
          file: otState.importFile,
          setFile: otState.setImportFile,
        },
        {
          open: vcState.importOpen,
          setOpen: vcState.setImportOpen,
          ocid: "vc-import-dialog",
          title: "Import Vouchers",
          type: "vc" as const,
          file: vcState.importFile,
          setFile: vcState.setImportFile,
        },
      ].map(({ open, setOpen, ocid, title, type, file, setFile }) => (
        <Dialog key={ocid} open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm" data-ocid={ocid}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <input
                type="file"
                accept=".csv"
                className="text-sm w-full"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => downloadTemplate(type)}
                className="flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <FileText className="size-3.5" /> Download Template
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!file} onClick={() => setOpen(false)}>
                Import
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
