import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type PortalEmployee,
  usePortalCompanyId,
  usePortalCreateEmployee,
  usePortalDeactivateEmployee,
  usePortalEmployees,
  usePortalUpdateEmployee,
} from "@/hooks/usePortal";
import { Edit, Plus, Search, UserCheck, UserX, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODULE_PERMISSIONS = ["Tasks", "Attendance", "Reports", "Invoices", "HR"];

const PAGE_SIZES = [10, 25, 50];

// ─── Employee Form ─────────────────────────────────────────────────────────────

interface EmployeeFormData {
  name: string;
  designation: string;
  department: string;
  email: string;
  loginPassword: string;
  permissions: string[];
}

const EMPTY_FORM: EmployeeFormData = {
  name: "",
  designation: "",
  department: "",
  email: "",
  loginPassword: "",
  permissions: ["Tasks"],
};

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  editing?: PortalEmployee | null;
  companyId: string;
}

function EmployeeModal({
  open,
  onClose,
  editing,
  companyId,
}: EmployeeModalProps) {
  const createEmployee = usePortalCreateEmployee();
  const updateEmployee = usePortalUpdateEmployee();
  const [form, setForm] = useState<EmployeeFormData>(
    editing
      ? {
          name: editing.name,
          designation: editing.designation,
          department: editing.department,
          email: editing.email,
          loginPassword: editing.loginPassword,
          permissions: editing.permissions,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});

  // Reset form when editing changes
  const handleOpen = () => {
    if (editing) {
      setForm({
        name: editing.name,
        designation: editing.designation,
        department: editing.department,
        email: editing.email,
        loginPassword: editing.loginPassword,
        permissions: editing.permissions,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Partial<EmployeeFormData> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.designation.trim()) errs.designation = "Designation is required";
    if (!form.department.trim()) errs.department = "Department is required";
    if (!editing && !form.loginPassword.trim())
      errs.loginPassword = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editing) {
      updateEmployee.mutate(
        {
          id: editing.id,
          companyId,
          name: form.name,
          designation: form.designation,
          department: form.department,
          email: form.email,
          permissions: form.permissions,
          ...(form.loginPassword ? { loginPassword: form.loginPassword } : {}),
        },
        { onSuccess: onClose },
      );
    } else {
      createEmployee.mutate(
        {
          name: form.name,
          designation: form.designation,
          department: form.department,
          email: form.email,
          loginPassword: form.loginPassword,
          companyId,
          permissions: form.permissions,
        },
        { onSuccess: onClose },
      );
    }
  };

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const isPending = createEmployee.isPending || updateEmployee.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else handleOpen();
      }}
    >
      <DialogContent className="max-w-lg" data-ocid="employee-modal">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {editing && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/60">
              <span className="text-xs text-muted-foreground">
                Employee ID:
              </span>
              <span className="text-sm font-mono font-semibold text-foreground">
                {editing.employeeId}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Full Name *</Label>
              <Input
                id="emp-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="John Doe"
                data-ocid="emp-name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-designation">Designation *</Label>
              <Input
                id="emp-designation"
                value={form.designation}
                onChange={(e) =>
                  setForm((p) => ({ ...p, designation: e.target.value }))
                }
                placeholder="Software Engineer"
                data-ocid="emp-designation"
              />
              {errors.designation && (
                <p className="text-xs text-destructive">{errors.designation}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-department">Department *</Label>
              <Input
                id="emp-department"
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                placeholder="Engineering"
                data-ocid="emp-department"
              />
              {errors.department && (
                <p className="text-xs text-destructive">{errors.department}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="john@company.com"
                data-ocid="emp-email"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="emp-password">
                {editing
                  ? "New Password (leave blank to keep)"
                  : "Temporary Password *"}
              </Label>
              <Input
                id="emp-password"
                type="password"
                value={form.loginPassword}
                onChange={(e) =>
                  setForm((p) => ({ ...p, loginPassword: e.target.value }))
                }
                placeholder={
                  editing
                    ? "Leave blank to keep current"
                    : "Set a temporary password"
                }
                data-ocid="emp-password"
              />
              {errors.loginPassword && (
                <p className="text-xs text-destructive">
                  {errors.loginPassword}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Module Permissions</Label>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_PERMISSIONS.map((perm) => (
                <div key={perm} className="flex items-center gap-2">
                  <Switch
                    id={`perm-${perm}`}
                    checked={form.permissions.includes(perm)}
                    onCheckedChange={() => togglePermission(perm)}
                    data-ocid={`perm-toggle-${perm.toLowerCase()}`}
                  />
                  <Label
                    htmlFor={`perm-${perm}`}
                    className="text-sm cursor-pointer"
                  >
                    {perm}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-ocid="emp-submit"
          >
            {isPending
              ? "Saving..."
              : editing
                ? "Update Employee"
                : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PortalAdminTeamPage() {
  const companyId = usePortalCompanyId();
  const { data: employees = [], isLoading } = usePortalEmployees(companyId);
  const deactivateEmployee = usePortalDeactivateEmployee();
  const updateEmployee = usePortalUpdateEmployee();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PortalEmployee | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Inline confirmation state
  const [confirmTarget, setConfirmTarget] = useState<{
    type: "single" | "bulk";
    emp?: PortalEmployee;
  } | null>(null);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleToggleStatus = (emp: PortalEmployee) => {
    if (!companyId) return;
    if (emp.status === "active") {
      setConfirmTarget({ type: "single", emp });
    } else {
      updateEmployee.mutate({ id: emp.id, companyId, status: "active" });
    }
  };

  const handleBulkDeactivate = () => {
    if (selected.size === 0) {
      toast.error("Select employees first");
      return;
    }
    setConfirmTarget({ type: "bulk" });
  };

  const handleConfirm = () => {
    if (!companyId || !confirmTarget) return;
    if (confirmTarget.type === "single" && confirmTarget.emp) {
      deactivateEmployee.mutate({
        id: confirmTarget.emp.id,
        companyId,
      });
    } else if (confirmTarget.type === "bulk") {
      for (const id of selected) {
        deactivateEmployee.mutate({ id, companyId });
      }
      setSelected(new Set());
    }
    setConfirmTarget(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((e) => e.id)));
    }
  };

  const openAdd = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };
  const openEdit = (emp: PortalEmployee) => {
    setEditingEmployee(emp);
    setModalOpen(true);
  };

  return (
    <PortalLayout requiredRole="portalAdmin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Team Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employees.filter((e) => e.status === "active").length} active ·{" "}
            {employees.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeactivate}
              className="gap-2"
              data-ocid="bulk-deactivate"
            >
              <UserX className="size-3.5" /> Deactivate ({selected.size})
            </Button>
          )}
          <Button
            size="sm"
            onClick={openAdd}
            className="gap-2"
            data-ocid="add-employee-btn"
          >
            <Plus className="size-3.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            data-ocid="team-search"
          />
        </div>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-28" data-ocid="team-page-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={paged.length > 0 && selected.size === paged.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    data-ocid="team-select-all"
                  />
                </TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">
                  Designation
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Department
                </TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                (["r1", "r2", "r3", "r4", "r5"] as const).map((rowKey) => (
                  <TableRow key={rowKey}>
                    {(
                      ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const
                    ).map((colKey) => (
                      <TableCell key={colKey}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "No employees match your search"
                          : "No employees yet. Add your first team member."}
                      </p>
                      {!search && (
                        <Button
                          size="sm"
                          onClick={openAdd}
                          data-ocid="team-empty-add"
                        >
                          Add Employee
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="hover:bg-muted/20"
                    data-ocid={`team-row-${emp.id}`}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.has(emp.id)}
                        onCheckedChange={() => toggleSelect(emp.id)}
                        aria-label={`Select ${emp.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                        {emp.employeeId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-foreground">
                          {emp.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {emp.designation}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {emp.department}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {emp.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          emp.status === "active" ? "default" : "secondary"
                        }
                        className={
                          emp.status === "active"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                            : ""
                        }
                      >
                        {emp.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => openEdit(emp)}
                          aria-label="Edit employee"
                          data-ocid={`edit-emp-${emp.id}`}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`size-7 ${emp.status === "active" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-600 hover:bg-green-500/10"}`}
                          onClick={() => handleToggleStatus(emp)}
                          aria-label={
                            emp.status === "active"
                              ? "Deactivate"
                              : "Reactivate"
                          }
                          data-ocid={`toggle-emp-${emp.id}`}
                        >
                          {emp.status === "active" ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={`page-${i + 1}`}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                  className="size-8 p-0"
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      {companyId && (
        <EmployeeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editingEmployee}
          companyId={companyId}
        />
      )}

      {/* Inline Confirmation Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="text-base font-display font-semibold text-foreground">
              {confirmTarget.type === "bulk"
                ? `Deactivate ${selected.size} employee(s)?`
                : `Deactivate ${confirmTarget.emp?.name}?`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {confirmTarget.type === "bulk"
                ? "Selected employees will lose portal access."
                : "This employee will lose portal access."}
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirm}
                data-ocid="confirm-deactivate"
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
