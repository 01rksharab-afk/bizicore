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
  type Attendance,
  AttendanceType,
  type CreateAttendanceInput,
  type UpdateAttendanceInput,
  downloadCsvData,
  useEmployeeMap,
  useHrAttendance,
  useHrCreateAttendance,
  useHrDeleteAttendance,
  useHrEmployees,
  useHrPageState,
  useHrUpdateAttendance,
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
  "Date",
  "Type",
  "Punch In",
  "Punch Out",
  "Hours",
  "Notes",
];
const PAGE_SIZE = 25;

const ATTENDANCE_TYPE_COLORS: Record<string, string> = {
  [AttendanceType.present]: "default",
  [AttendanceType.absent]: "destructive",
  [AttendanceType.halfDay]: "secondary",
  [AttendanceType.leave]: "outline",
};

type AttendanceFormData = {
  id?: bigint;
  employeeId: string;
  date: string;
  attendanceType: AttendanceType;
  punchIn: string;
  punchOut: string;
  totalHours: number;
  notes: string;
};

const EMPTY_FORM: AttendanceFormData = {
  employeeId: "",
  date: new Date().toISOString().split("T")[0],
  attendanceType: AttendanceType.present,
  punchIn: "",
  punchOut: "",
  totalHours: 8,
  notes: "",
};

export default function AttendancePage() {
  const {
    data: attendance = [],
    isLoading,
    isError,
    refetch,
  } = useHrAttendance();
  const { data: employees = [] } = useHrEmployees();
  const createAttendance = useHrCreateAttendance();
  const updateAttendance = useHrUpdateAttendance();
  const deleteAttendance = useHrDeleteAttendance();
  const employeeMap = useEmployeeMap(employees);

  const state = useHrPageState(COLUMNS);
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
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
  const [formData, setFormData] = useState<AttendanceFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Attendance | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);

  const filtered = useMemo(() => {
    let rows = attendance;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((a) => {
        const empName = employeeMap.get(a.employeeId.toString()) ?? "";
        return empName.toLowerCase().includes(q) || a.date.includes(q);
      });
    }
    if (statusFilter !== "all")
      rows = rows.filter((a) => a.attendanceType === statusFilter);
    if (dateFrom) rows = rows.filter((a) => a.date >= dateFrom);
    if (dateTo) rows = rows.filter((a) => a.date <= dateTo);
    if (employeeFilter)
      rows = rows.filter((a) => a.employeeId.toString() === employeeFilter);
    return rows;
  }, [
    attendance,
    search,
    statusFilter,
    dateFrom,
    dateTo,
    employeeFilter,
    employeeMap,
  ]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const allSelected =
    paginated.length > 0 &&
    paginated.every((a) => selectedIds.has(a.id.toString()));

  function openNew() {
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(att: Attendance) {
    setFormData({
      id: att.id,
      employeeId: att.employeeId.toString(),
      date: att.date,
      attendanceType: att.attendanceType,
      punchIn: att.punchIn ?? "",
      punchOut: att.punchOut ?? "",
      totalHours: att.totalHours,
      notes: att.notes,
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!formData.employeeId) {
      toast.error("Select an employee");
      return;
    }
    if (formData.id) {
      const input: UpdateAttendanceInput = {
        id: formData.id,
        employeeId: BigInt(formData.employeeId),
        date: formData.date,
        attendanceType: formData.attendanceType,
        punchIn: formData.punchIn || undefined,
        punchOut: formData.punchOut || undefined,
        totalHours: formData.totalHours,
        notes: formData.notes,
      };
      updateAttendance.mutate(input, {
        onSuccess: () => {
          toast.success("Attendance updated");
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to update"),
      });
    } else {
      const input: CreateAttendanceInput = {
        employeeId: BigInt(formData.employeeId),
        date: formData.date,
        attendanceType: formData.attendanceType,
        punchIn: formData.punchIn || undefined,
        punchOut: formData.punchOut || undefined,
        totalHours: formData.totalHours,
        notes: formData.notes,
      };
      createAttendance.mutate(input, {
        onSuccess: () => {
          toast.success("Attendance logged");
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to log attendance"),
      });
    }
  }

  function toRow(a: Attendance): Record<string, string> {
    return {
      Employee:
        employeeMap.get(a.employeeId.toString()) ?? a.employeeId.toString(),
      Date: a.date,
      Type: a.attendanceType,
      "Punch In": a.punchIn ?? "",
      "Punch Out": a.punchOut ?? "",
      Hours: String(a.totalHours),
      Notes: a.notes,
    };
  }

  function downloadTemplate() {
    const csv =
      "employeeId,date,attendanceType,punchIn,punchOut,totalHours,notes\n1,2026-01-01,present,09:00,18:00,8,";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "attendance-template.csv";
    a.click();
  }

  const selectedRows = attendance.filter((a) =>
    selectedIds.has(a.id.toString()),
  );

  return (
    <div className="space-y-5" data-ocid="attendance-root">
      {isError && <ErrorState module="Attendance" onRetry={() => refetch()} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {attendance.length} records
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="att-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="att-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            data-ocid="att-report-btn"
          >
            <BarChart2 className="size-3.5 mr-1.5" /> Report
          </Button>
          <Button size="sm" onClick={openNew} data-ocid="att-new-btn">
            <Plus className="size-3.5 mr-1.5" /> Log Attendance
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search employee, date…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-ocid="att-search"
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
            data-ocid="att-type-filter"
          >
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(AttendanceType).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
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
            data-ocid="att-emp-filter"
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
        <Input
          type="date"
          className="h-8 w-36 text-sm"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          data-ocid="att-date-from"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          className="h-8 w-36 text-sm"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          data-ocid="att-date-to"
        />
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
                "attendance-export.csv",
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
                        ? selectAll(paginated.map((a) => a.id.toString()))
                        : clearSelection()
                    }
                    aria-label="Select all"
                    data-ocid="att-select-all"
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
                : paginated.map((att, idx) => (
                    <tr
                      key={att.id.toString()}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`att-row-${att.id}`}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(att.id.toString())}
                          onCheckedChange={() =>
                            toggleSelect(att.id.toString())
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {employeeMap.get(att.employeeId.toString()) ??
                          `EMP-${att.employeeId}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {att.date}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            (ATTENDANCE_TYPE_COLORS[att.attendanceType] ??
                              "secondary") as
                              | "default"
                              | "destructive"
                              | "secondary"
                              | "outline"
                          }
                        >
                          {att.attendanceType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {att.punchIn ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {att.punchOut ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {att.totalHours}h
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                        {att.notes}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(att)}
                            className="text-xs text-accent hover:underline"
                            data-ocid={`att-edit-${att.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(att)}
                            className="text-xs text-destructive hover:underline"
                            data-ocid={`att-delete-${att.id}`}
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
            data-ocid="att-empty"
          >
            No attendance records.{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={openNew}
            >
              Log the first entry.
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-md" data-ocid="att-form-dialog">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Attendance" : "Log Attendance"}
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
                  data-ocid="att-emp-select"
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
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
                className="h-8 text-sm"
                data-ocid="att-date"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={formData.attendanceType}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    attendanceType: v as AttendanceType,
                  }))
                }
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="att-type-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AttendanceType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Punch In</Label>
              <Input
                type="time"
                value={formData.punchIn}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, punchIn: e.target.value }))
                }
                className="h-8 text-sm"
                data-ocid="att-punch-in"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Punch Out</Label>
              <Input
                type="time"
                value={formData.punchOut}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, punchOut: e.target.value }))
                }
                className="h-8 text-sm"
                data-ocid="att-punch-out"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total Hours</Label>
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={formData.totalHours}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    totalHours: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-8 text-sm"
                data-ocid="att-hours"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                className="h-8 text-sm"
                data-ocid="att-notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createAttendance.isPending || updateAttendance.isPending
              }
              data-ocid="att-save-btn"
            >
              {createAttendance.isPending || updateAttendance.isPending
                ? "Saving…"
                : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="att-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attendance record?</AlertDialogTitle>
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
                deleteAttendance.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Deleted");
                    setDeleteTarget(null);
                  },
                })
              }
              data-ocid="att-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog
        open={bulkDeletePending}
        onOpenChange={(v) => !v && setBulkDeletePending(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} records?
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
                for (const id of selectedIds)
                  deleteAttendance.mutate(BigInt(id));
                clearSelection();
                setBulkDeletePending(false);
              }}
              data-ocid="att-bulk-confirm-delete"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export / Import / Report dialogs */}
      {[
        {
          open: exportOpen,
          setOpen: setExportOpen,
          title: "Export Columns",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "attendance.csv",
            );
            setExportOpen(false);
          },
          actionLabel: "Download CSV",
          ocid: "att-export-dialog",
        },
        {
          open: reportOpen,
          setOpen: setReportOpen,
          title: "Generate Report",
          action: () => {
            downloadCsvData(
              filtered.map(toRow),
              [...exportCols],
              "attendance-report.csv",
            );
            setReportOpen(false);
          },
          actionLabel: "Generate",
          ocid: "att-report-dialog",
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
        <DialogContent className="max-w-sm" data-ocid="att-import-dialog">
          <DialogHeader>
            <DialogTitle>Import Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="att-import-file"
                className="text-xs text-muted-foreground uppercase tracking-wide font-medium block mb-1.5"
              >
                Upload CSV
              </label>
              <input
                id="att-import-file"
                type="file"
                accept=".csv"
                className="text-sm w-full"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                data-ocid="att-import-input"
              />
            </div>
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
            <Button
              disabled={!importFile}
              onClick={() => setImportOpen(false)}
              data-ocid="att-import-confirm"
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
