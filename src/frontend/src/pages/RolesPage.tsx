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
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Edit2,
  FileDown,
  Filter,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const APP_MODULES = [
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
  "Catalogue",
  "Customer Master",
  "Supplier Master",
  "Roles",
  "Permissions",
  "Configuration",
  "Locations",
  "Groups",
  "Import/Export",
  "Incentives",
];

interface Role {
  id: string;
  name: string;
  description: string;
  screens: string[];
  employeesAssigned: number;
  status: "active" | "inactive";
}

const SAMPLE_ROLES: Role[] = [
  {
    id: "r1",
    name: "Administrator",
    description: "Full access to all modules",
    screens: APP_MODULES,
    employeesAssigned: 2,
    status: "active",
  },
  {
    id: "r2",
    name: "Sales Manager",
    description: "CRM, invoicing and sales access",
    screens: [
      "Dashboard",
      "CRM Contacts",
      "CRM Leads",
      "CRM Deals",
      "Invoicing",
      "Sales Orders",
      "Quotations",
      "Reports",
      "Customer Master",
    ],
    employeesAssigned: 5,
    status: "active",
  },
  {
    id: "r3",
    name: "Accountant",
    description: "Accounting, invoicing and GST access",
    screens: [
      "Dashboard",
      "Accounting",
      "Invoicing",
      "GST Filing",
      "E-Invoice",
      "Purchase Orders",
      "Reports",
    ],
    employeesAssigned: 3,
    status: "active",
  },
  {
    id: "r4",
    name: "Warehouse Staff",
    description: "Inventory and logistics only",
    screens: ["Dashboard", "Inventory", "Logistics"],
    employeesAssigned: 4,
    status: "active",
  },
  {
    id: "r5",
    name: "Viewer",
    description: "Read-only access to reports",
    screens: ["Dashboard", "Reports"],
    employeesAssigned: 1,
    status: "inactive",
  },
];

const EMPTY_ROLE = {
  name: "",
  description: "",
  screens: [] as string[],
  status: "active" as "active" | "inactive",
};

function exportCSV(data: Role[]) {
  const headers = [
    "Role Name",
    "Description",
    "Modules Assigned",
    "Employees",
    "Status",
  ];
  const rows = data.map((r) => [
    r.name,
    r.description,
    r.screens.length,
    r.employeesAssigned,
    r.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "roles.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(SAMPLE_ROLES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteBulk, setDeleteBulk] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState(EMPTY_ROLE);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = roles;
    if (statusFilter !== "all")
      list = list.filter((r) => r.status === statusFilter);
    if (moduleFilter !== "all")
      list = list.filter((r) => r.screens.includes(moduleFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [roles, search, statusFilter, moduleFilter]);

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));

  const toggleScreen = (screen: string) => {
    setFormData((f) => ({
      ...f,
      screens: f.screens.includes(screen)
        ? f.screens.filter((s) => s !== screen)
        : [...f.screens, screen],
    }));
  };

  function openAdd() {
    setFormData(EMPTY_ROLE);
    setEditingRole(null);
    setDialogOpen(true);
  }
  function openEdit(r: Role) {
    setFormData({
      name: r.name,
      description: r.description,
      screens: [...r.screens],
      status: r.status,
    });
    setEditingRole(r);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingRole.id ? { ...r, ...formData } : r)),
      );
      toast.success("Role updated");
    } else {
      setRoles((prev) => [
        ...prev,
        { id: `r${Date.now()}`, ...formData, employeesAssigned: 0 },
      ]);
      toast.success("Role created");
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success("Role deleted");
    setDeleteTarget(null);
  }

  function handleBulkDelete() {
    setRoles((prev) => prev.filter((r) => !selected.has(r.id)));
    toast.success(`${selected.size} roles deleted`);
    setSelected(new Set());
    setDeleteBulk(false);
  }

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
            label: "Add Role",
            icon: <Plus className="size-3.5" />,
            onClick: openAdd,
            variant: "default",
            "data-ocid": "add-role-btn",
          },
          {
            label: "Import",
            icon: <Upload className="size-3.5" />,
            onClick: () => fileRef.current?.click(),
            variant: "outline",
            "data-ocid": "import-roles-btn",
          },
          {
            label: "Export",
            icon: <Download className="size-3.5" />,
            onClick: () => exportCSV(filtered),
            variant: "outline",
            "data-ocid": "export-roles-btn",
          },
        ]}
      />
    </>
  );

  return (
    <ModulePageLayout title="Roles" moduleName="roles" actions={headerActions}>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Roles", value: roles.length },
          {
            label: "Active",
            value: roles.filter((r) => r.status === "active").length,
          },
          {
            label: "Inactive",
            value: roles.filter((r) => r.status === "inactive").length,
          },
          { label: "Total Modules", value: APP_MODULES.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-display font-bold text-foreground">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search role name, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="roles-search"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-32 h-9 text-sm"
            data-ocid="role-status-filter"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger
            className="w-44 h-9 text-sm"
            data-ocid="role-module-filter"
          >
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {APP_MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportCSV(filtered.filter((r) => selected.has(r.id)))
              }
            >
              <FileDown className="size-3.5 mr-1" /> Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteBulk(true)}
              data-ocid="bulk-delete-roles-btn"
            >
              <Trash2 className="size-3.5 mr-1" /> Delete ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Modules</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-16 text-center"
                      data-ocid="roles-empty"
                    >
                      <Shield className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="font-medium text-sm text-foreground">
                        No roles found
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search
                          ? "Try adjusting search or filters"
                          : "Create your first role"}
                      </p>
                      {!search && (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={openAdd}
                          data-ocid="empty-add-role-btn"
                        >
                          <Plus className="size-4 mr-1.5" />
                          Add Role
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((role) => (
                    <TableRow key={role.id} data-ocid={`role-row-${role.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(role.id)}
                          onCheckedChange={() => toggleSelect(role.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {role.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                        {role.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {role.screens.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums">
                          {role.employeesAssigned}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={role.status === "active"}
                          onCheckedChange={(v) => {
                            setRoles((prev) =>
                              prev.map((r) =>
                                r.id === role.id
                                  ? { ...r, status: v ? "active" : "inactive" }
                                  : r,
                              ),
                            );
                          }}
                          data-ocid={`role-toggle-${role.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(role)}
                            aria-label="Edit role"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(role)}
                            aria-label="Delete role"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Sales Manager"
                  data-ocid="role-name-input"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={formData.status === "active"}
                  onCheckedChange={(v) =>
                    setFormData((f) => ({
                      ...f,
                      status: v ? "active" : "inactive",
                    }))
                  }
                  data-ocid="role-status-toggle"
                />
                <Label>
                  {formData.status === "active" ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of this role"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Module Access ({formData.screens.length}/{APP_MODULES.length})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() =>
                      setFormData((f) => ({ ...f, screens: APP_MODULES }))
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setFormData((f) => ({ ...f, screens: [] }))}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border rounded-md p-3 bg-muted/30 max-h-52 overflow-y-auto">
                {APP_MODULES.map((screen) => (
                  <div key={screen} className="flex items-center gap-2">
                    <Checkbox
                      id={`sc-${screen}`}
                      checked={formData.screens.includes(screen)}
                      onCheckedChange={() => toggleScreen(screen)}
                    />
                    <label
                      htmlFor={`sc-${screen}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {screen}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="role-save-btn">
              {editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog
        open={deleteBulk}
        onOpenChange={(v) => !v && setDeleteBulk(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} Roles?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {selected.size} selected roles. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="confirm-bulk-delete-roles-btn"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePageLayout>
  );
}
