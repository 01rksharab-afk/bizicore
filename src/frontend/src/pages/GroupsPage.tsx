import { ModulePageLayout } from "@/components/ModulePageLayout";
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
  Edit,
  FileDown,
  Filter,
  Layers,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type GroupType = "Customer" | "Supplier" | "Product" | "Employee" | "General";

interface Group {
  id: string;
  name: string;
  groupType: GroupType;
  parentId: string | null;
  description: string;
  members: number;
  status: "active" | "inactive";
}

const GROUP_TYPES: GroupType[] = [
  "Customer",
  "Supplier",
  "Product",
  "Employee",
  "General",
];

const SEED_GROUPS: Group[] = [
  {
    id: "1",
    name: "Premium Customers",
    groupType: "Customer",
    parentId: null,
    description: "High-value B2B customers with special pricing",
    members: 12,
    status: "active",
  },
  {
    id: "2",
    name: "Retail Distributors",
    groupType: "Customer",
    parentId: null,
    description: "Retail channel partners and distributors",
    members: 8,
    status: "active",
  },
  {
    id: "3",
    name: "North India Distributors",
    groupType: "Customer",
    parentId: "2",
    description: "Distributors serving northern India region",
    members: 5,
    status: "active",
  },
  {
    id: "4",
    name: "Export Clients",
    groupType: "Customer",
    parentId: null,
    description: "International clients with export pricing",
    members: 3,
    status: "active",
  },
  {
    id: "5",
    name: "Raw Material Vendors",
    groupType: "Supplier",
    parentId: null,
    description: "Primary raw material supply chain vendors",
    members: 7,
    status: "active",
  },
  {
    id: "6",
    name: "Inactive Partners",
    groupType: "General",
    parentId: null,
    description: "Dormant partner accounts",
    members: 0,
    status: "inactive",
  },
];

const EMPTY_FORM = {
  name: "",
  groupType: "Customer" as GroupType,
  parentId: "none",
  description: "",
};

function exportCSV(data: Group[]) {
  const headers = [
    "Group Name",
    "Group Type",
    "Parent Group",
    "Description",
    "Members",
    "Status",
  ];
  const rows = data.map((g) => [
    g.name,
    g.groupType,
    g.parentId || "—",
    g.description,
    g.members,
    g.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groups.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(SEED_GROUPS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleteBulk, setDeleteBulk] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = groups;
    if (typeFilter !== "all")
      list = list.filter((g) => g.groupType === typeFilter);
    if (statusFilter !== "all")
      list = list.filter((g) => g.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.groupType.toLowerCase().includes(q),
      );
    }
    return list;
  }, [groups, search, typeFilter, statusFilter]);

  const allSelected =
    filtered.length > 0 && filtered.every((g) => selected.has(g.id));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((g) => g.id)));

  function getParentName(parentId: string | null) {
    if (!parentId) return null;
    return groups.find((g) => g.id === parentId)?.name ?? null;
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setDialogOpen(true);
  }
  function openEdit(g: Group) {
    setForm({
      name: g.name,
      groupType: g.groupType,
      parentId: g.parentId ?? "none",
      description: g.description,
    });
    setEditTarget(g);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (editTarget) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editTarget.id
            ? {
                ...g,
                name: form.name,
                groupType: form.groupType,
                parentId: form.parentId === "none" ? null : form.parentId,
                description: form.description,
              }
            : g,
        ),
      );
      toast.success("Group updated");
    } else {
      setGroups((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: form.name,
          groupType: form.groupType,
          parentId: form.parentId === "none" ? null : form.parentId,
          description: form.description,
          members: 0,
          status: "active",
        },
      ]);
      toast.success("Group created");
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    toast.success("Group deleted");
    setDeleteTarget(null);
  }

  function handleBulkDelete() {
    setGroups((prev) => prev.filter((g) => !selected.has(g.id)));
    toast.success(`${selected.size} groups deleted`);
    setSelected(new Set());
    setDeleteBulk(false);
  }

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        data-ocid="import-groups-btn"
      >
        <Upload className="size-4 mr-1.5" /> Import
      </Button>
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportCSV(filtered)}
        data-ocid="export-groups-btn"
      >
        <Download className="size-4 mr-1.5" /> Export
      </Button>
      <Button size="sm" onClick={openAdd} data-ocid="groups-add-btn">
        <Plus className="size-4 mr-1.5" /> Add Group
      </Button>
    </>
  );

  const typeColors: Record<GroupType, string> = {
    Customer: "bg-blue-500/10 text-blue-600",
    Supplier: "bg-orange-500/10 text-orange-600",
    Product: "bg-green-500/10 text-green-600",
    Employee: "bg-purple-500/10 text-purple-600",
    General: "bg-muted text-muted-foreground",
  };

  return (
    <ModulePageLayout
      title="Groups"
      moduleName="groups"
      actions={headerActions}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Groups",
            value: groups.length,
            color: "text-foreground",
          },
          {
            label: "Active",
            value: groups.filter((g) => g.status === "active").length,
            color: "text-primary",
          },
          {
            label: "Inactive",
            value: groups.filter((g) => g.status === "inactive").length,
            color: "text-muted-foreground",
          },
          {
            label: "Total Members",
            value: groups.reduce((sum, g) => sum + g.members, 0),
            color: "text-foreground",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
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
            placeholder="Search name, type, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="groups-search"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            className="w-36 h-9 text-sm"
            data-ocid="group-type-filter"
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {GROUP_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
                exportCSV(filtered.filter((g) => selected.has(g.id)))
              }
            >
              <FileDown className="size-3.5 mr-1" /> Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteBulk(true)}
              data-ocid="bulk-delete-groups-btn"
            >
              <Trash2 className="size-3.5 mr-1" /> Delete ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Group Name</TableHead>
                <TableHead>Group Type</TableHead>
                <TableHead>Parent Group</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-20 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-16"
                    data-ocid="groups-empty"
                  >
                    <Layers className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium text-sm text-foreground">
                      No groups found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search
                        ? "Try adjusting search or filters"
                        : "Create your first group to get started"}
                    </p>
                    {!search && (
                      <Button size="sm" className="mt-4" onClick={openAdd}>
                        <Plus className="size-4 mr-1.5" />
                        Add Group
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((grp) => (
                  <TableRow
                    key={grp.id}
                    className="group"
                    data-ocid={`group-row-${grp.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(grp.id)}
                        onCheckedChange={() => toggleSelect(grp.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{grp.name}</p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[grp.groupType]}`}
                      >
                        {grp.groupType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getParentName(grp.parentId) ?? (
                        <span className="text-xs text-muted-foreground/50">
                          Top-level
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {grp.description}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="text-sm tabular-nums">
                          {grp.members}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={grp.status === "active"}
                        onCheckedChange={(v) => {
                          setGroups((prev) =>
                            prev.map((x) =>
                              x.id === grp.id
                                ? { ...x, status: v ? "active" : "inactive" }
                                : x,
                            ),
                          );
                        }}
                        data-ocid={`group-status-${grp.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(grp)}
                          data-ocid={`group-edit-${grp.id}`}
                          aria-label="Edit group"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(grp)}
                          data-ocid={`group-delete-${grp.id}`}
                          aria-label="Delete group"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Group" : "Add Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Group Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Premium Customers"
                data-ocid="group-form-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Group Type</Label>
              <Select
                value={form.groupType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, groupType: v as GroupType }))
                }
              >
                <SelectTrigger data-ocid="group-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Parent Group (optional)</Label>
              <Select
                value={form.parentId}
                onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
              >
                <SelectTrigger data-ocid="group-form-parent">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {groups
                    .filter((g) => g.id !== editTarget?.id)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of this group"
                rows={2}
                data-ocid="group-form-desc"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="group-form-save">
                {editTarget ? "Save Changes" : "Add Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
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
              data-ocid="confirm-delete-group-btn"
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
            <AlertDialogTitle>Delete {selected.size} Groups?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {selected.size} selected groups. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="confirm-bulk-delete-groups-btn"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePageLayout>
  );
}
