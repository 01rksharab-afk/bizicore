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
  type CreateEmployeeInput,
  type Employee,
  EmployeeStatus,
  type UpdateEmployeeInput,
  downloadCsvData,
  useHrCreateEmployee,
  useHrDeleteEmployee,
  useHrEmployees,
  useHrPageState,
  useHrToggleEmployee,
  useHrUpdateEmployee,
} from "@/hooks/useHR";
import {
  BarChart2,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const COLUMNS = [
  "Code",
  "Name",
  "Department",
  "Designation",
  "Email",
  "Phone",
  "Grade",
  "Joining Date",
  "Status",
];
const PAGE_SIZE = 25;

type FormData = Omit<CreateEmployeeInput, never> & {
  id?: bigint;
  enabled?: boolean;
  status?: EmployeeStatus;
};

const EMPTY_FORM: FormData = {
  employeeCode: "",
  name: "",
  department: "",
  designation: "",
  email: "",
  phone: "",
  salaryGrade: "",
  joiningDate: "",
};

export default function EmployeeManagementPage() {
  const {
    data: employees = [],
    isLoading,
    isError,
    refetch,
  } = useHrEmployees();
  const createEmployee = useHrCreateEmployee();
  const updateEmployee = useHrUpdateEmployee();
  const deleteEmployee = useHrDeleteEmployee();
  const toggleEmployee = useHrToggleEmployee();

  const state = useHrPageState(COLUMNS);
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
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
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);

  const departments = useMemo(() => {
    const s = new Set(employees.map((e) => e.department).filter(Boolean));
    return [...s];
  }, [employees]);

  const filtered = useMemo(() => {
    let rows = employees;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      );
    }
    if (statusFilter && statusFilter !== "all")
      rows = rows.filter((e) => e.status === statusFilter);
    if (deptFilter && deptFilter !== "all")
      rows = rows.filter((e) => e.department === deptFilter);
    return rows;
  }, [employees, search, statusFilter, deptFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const allSelected =
    paginated.length > 0 &&
    paginated.every((e) => selectedIds.has(e.id.toString()));

  function openNew() {
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(emp: Employee) {
    setFormData({
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      email: emp.email,
      phone: emp.phone,
      salaryGrade: emp.salaryGrade,
      joiningDate: emp.joiningDate,
      status: emp.status,
      enabled: emp.enabled,
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (formData.id) {
      const input: UpdateEmployeeInput = {
        id: formData.id,
        employeeCode: formData.employeeCode,
        name: formData.name,
        department: formData.department,
        designation: formData.designation,
        email: formData.email,
        phone: formData.phone,
        salaryGrade: formData.salaryGrade,
        joiningDate: formData.joiningDate,
        status: formData.status ?? EmployeeStatus.active,
        enabled: formData.enabled ?? true,
      };
      updateEmployee.mutate(input, {
        onSuccess: () => {
          toast.success("Employee updated");
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to update employee"),
      });
    } else {
      const input: CreateEmployeeInput = {
        employeeCode: formData.employeeCode,
        name: formData.name,
        department: formData.department,
        designation: formData.designation,
        email: formData.email,
        phone: formData.phone,
        salaryGrade: formData.salaryGrade,
        joiningDate: formData.joiningDate,
      };
      createEmployee.mutate(input, {
        onSuccess: () => {
          toast.success("Employee created");
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to create employee"),
      });
    }
  }

  function handleDelete(emp: Employee) {
    deleteEmployee.mutate(emp.id, {
      onSuccess: () => {
        toast.success("Employee deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete"),
    });
  }

  function toRow(e: Employee): Record<string, string> {
    return {
      Code: e.employeeCode,
      Name: e.name,
      Department: e.department,
      Designation: e.designation,
      Email: e.email,
      Phone: e.phone,
      Grade: e.salaryGrade,
      "Joining Date": e.joiningDate,
      Status: e.status,
    };
  }

  function downloadTemplate() {
    const csv =
      "employeeCode,name,department,designation,email,phone,salaryGrade,joiningDate\nEMP-001,John Doe,Engineering,Developer,john@co.com,9999999999,L3,2024-01-01";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "employees-template.csv";
    a.click();
  }

  const selectedRows = employees.filter((e) =>
    selectedIds.has(e.id.toString()),
  );

  return (
    <div className="space-y-5" data-ocid="employees-root">
      {isError && (
        <ErrorState module="Employee Management" onRetry={() => refetch()} />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Employee Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employees.length} total employees
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="emp-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="emp-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            data-ocid="emp-report-btn"
          >
            <BarChart2 className="size-3.5 mr-1.5" /> Report
          </Button>
          <Button size="sm" onClick={openNew} data-ocid="emp-new-btn">
            <Plus className="size-3.5 mr-1.5" /> New Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search name, code, email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-ocid="emp-search"
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
            data-ocid="emp-status-filter"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={EmployeeStatus.active}>Active</SelectItem>
            <SelectItem value={EmployeeStatus.inactive}>Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={deptFilter}
          onValueChange={(v) => {
            setDeptFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="h-8 w-40 text-sm"
            data-ocid="emp-dept-filter"
          >
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Depts</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm"
          data-ocid="emp-bulk-bar"
        >
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
                "employees-export.csv",
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
                        ? selectAll(paginated.map((e) => e.id.toString()))
                        : clearSelection()
                    }
                    aria-label="Select all"
                    data-ocid="emp-select-all"
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
                ? [1, 2, 3, 4, 5].map((k) => (
                    <tr key={k} className="border-b border-border/40">
                      <td className="px-3 py-3" colSpan={COLUMNS.length + 3}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : paginated.map((emp, idx) => (
                    <tr
                      key={emp.id.toString()}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      data-ocid={`emp-row-${emp.id}`}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(emp.id.toString())}
                          onCheckedChange={() =>
                            toggleSelect(emp.id.toString())
                          }
                          aria-label={`Select ${emp.name}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {emp.employeeCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.designation}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.salaryGrade}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp.joiningDate}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            emp.status === EmployeeStatus.active
                              ? "default"
                              : "secondary"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(emp)}
                            className="text-xs text-accent hover:underline"
                            data-ocid={`emp-edit-${emp.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleEmployee.mutate(emp.id)}
                            className="text-xs text-muted-foreground hover:underline"
                            data-ocid={`emp-toggle-${emp.id}`}
                          >
                            <UserCheck className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(emp)}
                            className="text-xs text-destructive hover:underline"
                            data-ocid={`emp-delete-${emp.id}`}
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
            data-ocid="emp-empty"
          >
            No employees found.{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={openNew}
            >
              Add the first one.
            </button>
          </div>
        )}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground"
            data-ocid="emp-pagination"
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

      {/* New/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-lg" data-ocid="emp-form-dialog">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Employee" : "New Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {(
              [
                ["employeeCode", "Employee Code"],
                ["name", "Full Name"],
                ["department", "Department"],
                ["designation", "Designation"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["salaryGrade", "Salary Grade"],
                ["joiningDate", "Joining Date"],
              ] as [keyof FormData, string][]
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`emp-${field}`} className="text-xs">
                  {label}
                </Label>
                <Input
                  id={`emp-${field}`}
                  type={field === "joiningDate" ? "date" : "text"}
                  value={String(formData[field] ?? "")}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, [field]: e.target.value }))
                  }
                  className="h-8 text-sm"
                  data-ocid={`emp-field-${field}`}
                />
              </div>
            ))}
            {formData.id && (
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status ?? EmployeeStatus.active}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, status: v as EmployeeStatus }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="emp-status-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EmployeeStatus.active}>
                      Active
                    </SelectItem>
                    <SelectItem value={EmployeeStatus.inactive}>
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createEmployee.isPending || updateEmployee.isPending}
              data-ocid="emp-save-btn"
            >
              {createEmployee.isPending || updateEmployee.isPending
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
        <AlertDialogContent data-ocid="emp-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              data-ocid="emp-confirm-delete"
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
        <AlertDialogContent data-ocid="emp-bulk-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} employee
              {selectedIds.size !== 1 ? "s" : ""}?
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
                for (const id of selectedIds) deleteEmployee.mutate(BigInt(id));
                clearSelection();
                setBulkDeletePending(false);
              }}
              data-ocid="emp-bulk-confirm-delete"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm" data-ocid="emp-export-dialog">
          <DialogHeader>
            <DialogTitle>Export Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <Checkbox
                  id={`exp-emp-${col}`}
                  checked={exportCols.has(col)}
                  onCheckedChange={() => toggleExportCol(col)}
                />
                <label
                  htmlFor={`exp-emp-${col}`}
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
                downloadCsvData(
                  filtered.map(toRow),
                  [...exportCols],
                  "employees.csv",
                );
                setExportOpen(false);
              }}
              data-ocid="emp-export-confirm"
            >
              Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="emp-import-dialog">
          <DialogHeader>
            <DialogTitle>Import Employees</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="emp-import-file"
                className="text-xs text-muted-foreground uppercase tracking-wide font-medium block mb-1.5"
              >
                Upload CSV File
              </label>
              <input
                id="emp-import-file"
                type="file"
                accept=".csv"
                className="text-sm w-full"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                data-ocid="emp-import-input"
              />
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
              data-ocid="emp-template-download"
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
              data-ocid="emp-import-confirm"
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm" data-ocid="emp-report-dialog">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <Checkbox
                  id={`rep-emp-${col}`}
                  checked={exportCols.has(col)}
                  onCheckedChange={() => toggleExportCol(col)}
                />
                <label
                  htmlFor={`rep-emp-${col}`}
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
                downloadCsvData(
                  filtered.map(toRow),
                  [...exportCols],
                  "employees-report.csv",
                );
                setReportOpen(false);
              }}
              data-ocid="emp-report-confirm"
            >
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
