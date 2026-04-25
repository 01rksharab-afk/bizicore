import { ModulePageLayout } from "@/components/ModulePageLayout";
import { ControlGroup } from "@/components/ui/ControlGroup";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, Search, Upload, UserCog, Users } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type PermAction = "view" | "create" | "edit" | "delete";

interface ModulePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

const ROLES = [
  "Administrator",
  "Sales Manager",
  "Accountant",
  "Warehouse Staff",
  "Viewer",
];
const DEPARTMENTS = ["All", "Sales", "Finance", "Operations", "IT", "HR"];

const MODULES = [
  "Dashboard",
  "CRM Contacts",
  "CRM Leads",
  "CRM Deals",
  "Accounting",
  "Invoicing",
  "Inventory",
  "GST Filing",
  "Purchase Orders",
  "Sales Orders",
  "Quotations",
  "Logistics",
  "B2B Portal",
  "Reports",
  "E-Invoice",
  "Customer Master",
  "Supplier Master",
  "Locations",
  "Groups",
  "Permissions",
  "Roles",
  "Configuration",
];

const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: "1",
    name: "Arjun Kumar",
    email: "arjun@acme.in",
    role: "Sales Manager",
    department: "Sales",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya@acme.in",
    role: "Accountant",
    department: "Finance",
  },
  {
    id: "3",
    name: "Rohit Patel",
    email: "rohit@acme.in",
    role: "Warehouse Staff",
    department: "Operations",
  },
  {
    id: "4",
    name: "Neha Singh",
    email: "neha@acme.in",
    role: "Administrator",
    department: "IT",
  },
  {
    id: "5",
    name: "Kiran Mehta",
    email: "kiran@acme.in",
    role: "Viewer",
    department: "HR",
  },
];

function buildMatrix(role: string): ModulePermission[] {
  return MODULES.map((module) => {
    const isAdmin = role === "Administrator";
    const salesMods = [
      "Dashboard",
      "CRM Contacts",
      "CRM Leads",
      "CRM Deals",
      "Invoicing",
      "Sales Orders",
      "Quotations",
      "Reports",
      "Customer Master",
    ];
    const acctMods = [
      "Dashboard",
      "Accounting",
      "Invoicing",
      "GST Filing",
      "E-Invoice",
      "Purchase Orders",
      "Reports",
    ];
    const whMods = ["Dashboard", "Inventory", "Logistics"];
    const viewerMods = ["Dashboard", "Reports"];
    const access =
      isAdmin ||
      (role === "Sales Manager" && salesMods.includes(module)) ||
      (role === "Accountant" && acctMods.includes(module)) ||
      (role === "Warehouse Staff" && whMods.includes(module)) ||
      (role === "Viewer" && viewerMods.includes(module));
    return {
      module,
      view: access,
      create: access && role !== "Viewer",
      edit: access && role !== "Viewer",
      delete: isAdmin,
    };
  });
}

function exportCSV(employees: Employee[]) {
  const headers = ["Name", "Email", "Role", "Department"];
  const rows = employees.map((e) => [e.name, e.email, e.role, e.department]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "permissions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function PermissionsPage() {
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [moduleSearch, setModuleSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>(
    SAMPLE_EMPLOYEES[0],
  );
  const [matrix, setMatrix] = useState<ModulePermission[]>(() =>
    buildMatrix(SAMPLE_EMPLOYEES[0].role),
  );
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((e) => {
        const matchSearch =
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === "All" || e.department === deptFilter;
        return matchSearch && matchDept;
      }),
    [employees, search, deptFilter],
  );

  const filteredMatrix = useMemo(
    () =>
      moduleSearch
        ? matrix.filter((p) =>
            p.module.toLowerCase().includes(moduleSearch.toLowerCase()),
          )
        : matrix,
    [matrix, moduleSearch],
  );

  const allEmpsSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedEmps.has(e.id));
  const toggleEmpSelect = (id: string) =>
    setSelectedEmps((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleAllEmps = () =>
    setSelectedEmps(
      allEmpsSelected ? new Set() : new Set(filteredEmployees.map((e) => e.id)),
    );

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setMatrix(buildMatrix(emp.role));
  };
  const toggle = (module: string, action: PermAction) => {
    setMatrix((prev) =>
      prev.map((p) =>
        p.module === module ? { ...p, [action]: !p[action] } : p,
      ),
    );
  };

  const handleAssign = (empId: string, role: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, role } : e)),
    );
    if (selectedEmployee.id === empId) {
      setSelectedEmployee((e) => ({ ...e, role }));
      setMatrix(buildMatrix(role));
    }
    toast.success(`Role "${role}" assigned`);
  };

  const handleBulkRoleApply = () => {
    if (!bulkRole) {
      toast.error("Select a role to apply");
      return;
    }
    setEmployees((prev) =>
      prev.map((e) => (selectedEmps.has(e.id) ? { ...e, role: bulkRole } : e)),
    );
    if (selectedEmps.has(selectedEmployee.id)) {
      setSelectedEmployee((e) => ({ ...e, role: bulkRole }));
      setMatrix(buildMatrix(bulkRole));
    }
    toast.success(
      `Role "${bulkRole}" applied to ${selectedEmps.size} employees`,
    );
    setSelectedEmps(new Set());
    setBulkOpen(false);
  };

  const headerActions = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) toast.success(`Importing ${f.name}…`);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <ControlGroup
        showToggle={false}
        buttons={[
          {
            label: "Assign Role",
            icon: <UserCog className="size-3.5" />,
            onClick: () => setAssignOpen(true),
            variant: "default",
            "data-ocid": "assign-role-btn",
          },
          {
            label: "Import",
            icon: <Upload className="size-3.5" />,
            onClick: () => fileRef.current?.click(),
            variant: "outline",
            "data-ocid": "import-permissions-btn",
          },
          {
            label: "Export",
            icon: <Download className="size-3.5" />,
            onClick: () => exportCSV(employees),
            variant: "outline",
            "data-ocid": "export-permissions-btn",
          },
        ]}
      />
    </>
  );

  return (
    <ModulePageLayout
      title="User Permissions"
      moduleName="permissions"
      actions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Employee list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                Employees
              </span>
              {selectedEmps.size > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => setBulkOpen(true)}
                  data-ocid="bulk-assign-btn"
                >
                  Bulk Assign ({selectedEmps.size})
                </Button>
              )}
            </CardTitle>
            {/* Search + dept filter */}
            <div className="space-y-2 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="pl-8 h-8 text-sm"
                  data-ocid="employee-search"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-8 text-xs" data-ocid="dept-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === "All" ? "All Departments" : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filteredEmployees.length > 1 && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  checked={allEmpsSelected}
                  onCheckedChange={toggleAllEmps}
                  id="select-all-emps"
                />
                <label
                  htmlFor="select-all-emps"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Select all
                </label>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer ${selectedEmployee.id === emp.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                >
                  <Checkbox
                    checked={selectedEmps.has(emp.id)}
                    onCheckedChange={() => toggleEmpSelect(emp.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => selectEmployee(emp)}
                    data-ocid={`emp-row-${emp.id}`}
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emp.department}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {emp.role}
                    </Badge>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permission matrix */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3 gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">
                {selectedEmployee.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedEmployee.role} · {selectedEmployee.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Filter modules…"
                  className="pl-8 h-8 text-sm w-40"
                  data-ocid="module-search"
                />
              </div>
              <Button
                size="sm"
                onClick={() => toast.success("Permissions saved")}
                data-ocid="save-permissions-btn"
              >
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-52">Module</TableHead>
                    <TableHead className="text-center w-20">View</TableHead>
                    <TableHead className="text-center w-20">Create</TableHead>
                    <TableHead className="text-center w-20">Edit</TableHead>
                    <TableHead className="text-center w-20">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatrix.map((perm) => (
                    <TableRow
                      key={perm.module}
                      data-ocid={`perm-row-${perm.module.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {perm.module}
                      </TableCell>
                      {(
                        ["view", "create", "edit", "delete"] as PermAction[]
                      ).map((action) => (
                        <TableCell key={action} className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={perm[action]}
                              onCheckedChange={() =>
                                toggle(perm.module, action)
                              }
                              data-ocid={`perm-${perm.module.toLowerCase().replace(/\s+/g, "-")}-${action}`}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <AssignRoleForm
            employees={employees}
            onAssign={handleAssign}
            onClose={() => setAssignOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Role Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Apply Role to {selectedEmps.size} Employees
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Role to Apply</Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger data-ocid="bulk-role-select">
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkRoleApply}
              data-ocid="confirm-bulk-assign-btn"
            >
              Apply Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePageLayout>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

interface AssignRoleFormProps {
  employees: Employee[];
  onAssign: (empId: string, role: string) => void;
  onClose: () => void;
}

function AssignRoleForm({ employees, onAssign, onClose }: AssignRoleFormProps) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Employee</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger data-ocid="assign-user-select">
              <SelectValue placeholder="Select employee…" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} ({e.department})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger data-ocid="assign-role-select">
              <SelectValue placeholder="Select role…" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!userId || !role) {
              toast.error("Select both user and role");
              return;
            }
            onAssign(userId, role);
            onClose();
          }}
          data-ocid="confirm-assign-btn"
        >
          Assign Role
        </Button>
      </DialogFooter>
    </>
  );
}
