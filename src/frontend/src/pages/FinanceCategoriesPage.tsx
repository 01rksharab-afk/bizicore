import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
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
import { Textarea } from "@/components/ui/textarea";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  Download,
  Edit2,
  FolderTree,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryType = "income" | "expense";
type CategoryStatus = "active" | "inactive";

interface FinanceCategory {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  description: string;
  status: CategoryStatus;
}

const SEED: FinanceCategory[] = [
  {
    id: "1",
    name: "Revenue",
    type: "income",
    parentId: null,
    description: "All revenue streams",
    status: "active",
  },
  {
    id: "2",
    name: "Product Sales",
    type: "income",
    parentId: "1",
    description: "Income from product sales",
    status: "active",
  },
  {
    id: "3",
    name: "Service Income",
    type: "income",
    parentId: "1",
    description: "Income from services rendered",
    status: "active",
  },
  {
    id: "4",
    name: "Other Income",
    type: "income",
    parentId: null,
    description: "Miscellaneous income items",
    status: "active",
  },
  {
    id: "5",
    name: "Interest Income",
    type: "income",
    parentId: "4",
    description: "Interest from bank deposits",
    status: "active",
  },
  {
    id: "6",
    name: "Operating Expenses",
    type: "expense",
    parentId: null,
    description: "Day-to-day business expenses",
    status: "active",
  },
  {
    id: "7",
    name: "Salaries & Wages",
    type: "expense",
    parentId: "6",
    description: "Employee compensation costs",
    status: "active",
  },
  {
    id: "8",
    name: "Rent & Utilities",
    type: "expense",
    parentId: "6",
    description: "Office and utility expenses",
    status: "active",
  },
  {
    id: "9",
    name: "Marketing",
    type: "expense",
    parentId: null,
    description: "Marketing and advertising expenses",
    status: "active",
  },
  {
    id: "10",
    name: "Digital Advertising",
    type: "expense",
    parentId: "9",
    description: "Online ads, social media campaigns",
    status: "inactive",
  },
];

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormProps {
  open: boolean;
  onClose: () => void;
  initial?: FinanceCategory;
  parentPreset?: string | null;
  categories: FinanceCategory[];
  onSave: (data: Omit<FinanceCategory, "id">) => void;
}

function CategoryForm({
  open,
  onClose,
  initial,
  parentPreset,
  categories,
  onSave,
}: FormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<CategoryType>(initial?.type ?? "income");
  const [parentId, setParentId] = useState<string>(
    initial?.parentId ?? parentPreset ?? "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<CategoryStatus>(
    initial?.status ?? "active",
  );

  const topLevel = categories.filter((c) => c.parentId === null);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    onSave({ name, type, parentId: parentId || null, description, status });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? "Edit Category"
              : parentPreset
                ? "Add Sub-category"
                : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              data-ocid="fc-form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Sales"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as CategoryType)}
              >
                <SelectTrigger data-ocid="fc-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category (optional)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger data-ocid="fc-form-parent">
                  <SelectValue placeholder="Top level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Top level —</SelectItem>
                  {topLevel.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              data-ocid="fc-form-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              data-ocid="fc-form-status"
              checked={status === "active"}
              onCheckedChange={(v) => setStatus(v ? "active" : "inactive")}
            />
            <Label>{status === "active" ? "Active" : "Inactive"}</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="fc-form-save">
              {initial ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceCategoriesPage() {
  const [categories, setCategories] = useState<FinanceCategory[]>(SEED);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FinanceCategory | undefined>();
  const [parentPreset, setParentPreset] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const filterDefs = [
    {
      label: "Type",
      key: "type",
      options: [
        { value: "income", label: "Income" },
        { value: "expense", label: "Expense" },
      ],
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      label: "Level",
      key: "level",
      options: [
        { value: "top", label: "Top Level Only" },
        { value: "sub", label: "With Sub-categories" },
      ],
    },
  ];

  const topLevelIds = new Set(
    categories.filter((c) => c.parentId === null).map((c) => c.id),
  );
  const parentIds = new Set(
    categories.filter((c) => c.parentId !== null).map((c) => c.parentId),
  );

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    if (
      q &&
      !c.name.toLowerCase().includes(q) &&
      !c.description.toLowerCase().includes(q)
    )
      return false;
    if (filters.type && c.type !== filters.type) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.level === "top" && c.parentId !== null) return false;
    if (filters.level === "sub" && !parentIds.has(c.id)) return false;
    return true;
  });

  function getParentName(parentId: string | null) {
    if (!parentId) return "—";
    return categories.find((c) => c.id === parentId)?.name ?? "—";
  }

  function handleSave(data: Omit<FinanceCategory, "id">) {
    if (editTarget) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...data, id: c.id } : c)),
      );
      toast.success("Category updated");
    } else {
      setCategories((prev) => [
        ...prev,
        { ...data, id: Date.now().toString() },
      ]);
      toast.success("Category created");
    }
    setEditTarget(undefined);
    setParentPreset(null);
  }

  function handleDelete(id: string) {
    // Also delete children
    const childIds = categories
      .filter((c) => c.parentId === id)
      .map((c) => c.id);
    setCategories((p) =>
      p.filter((c) => c.id !== id && !childIds.includes(c.id)),
    );
    setSelected((p) => {
      const n = new Set(p);
      n.delete(id);
      for (const cid of childIds) n.delete(cid);
      return n;
    });
    setDeleteConfirm(null);
    toast.success("Category deleted");
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    setCategories((p) => p.filter((c) => !selected.has(c.id)));
    toast.success(`${selected.size} categories deleted`);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handleExport() {
    const rows =
      selected.size > 0
        ? categories.filter((c) => selected.has(c.id))
        : filtered;
    exportToCsv(
      "finance-categories",
      [
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "parentName", label: "Parent Category" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" },
      ],
      rows.map((c) => ({ ...c, parentName: getParentName(c.parentId) })),
    );
    toast.success("Exported finance categories");
  }

  // Render top-level categories with their children indented
  const renderRows = () => {
    const topLevel = filtered.filter((c) => c.parentId === null);
    const subCats = filtered.filter((c) => c.parentId !== null);
    const rows: FinanceCategory[] = [];
    for (const top of topLevel) {
      rows.push(top);
      for (const sub of subCats.filter((s) => s.parentId === top.id)) {
        rows.push(sub);
      }
    }
    // Add orphan subcategories (parent filtered out)
    for (const sub of subCats.filter(
      (s) => !topLevelIds.has(s.parentId ?? ""),
    )) {
      if (!rows.find((r) => r.id === sub.id)) rows.push(sub);
    }
    return rows;
  };

  const rows = renderRows();

  return (
    <ModulePageLayout
      title="Finance Categories"
      moduleName="finance-categories"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
            data-ocid="fc-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-ocid="fc-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(undefined);
              setParentPreset(null);
              setDialogOpen(true);
            }}
            data-ocid="fc-add-btn"
          >
            <Plus className="size-4 mr-1.5" /> Add Category
          </Button>
        </div>
      }
    >
      <input
        ref={importRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={() => toast.info("CSV import coming soon")}
      />

      <p className="text-sm text-muted-foreground -mt-2">
        Manage income and expense category hierarchies for financial reporting.
      </p>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterDefs}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search by name or description…"
      />

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-lg text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            data-ocid="fc-bulk-delete"
          >
            <Trash2 className="size-3.5 mr-1.5" /> Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-3.5 mr-1.5" /> Export Selected
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-3"
              data-ocid="fc-empty-state"
            >
              <FolderTree className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No finance categories found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Create first category
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={
                          selected.size === rows.length && rows.length > 0
                        }
                        onCheckedChange={() =>
                          setSelected(
                            selected.size === rows.length
                              ? new Set()
                              : new Set(rows.map((r) => r.id)),
                          )
                        }
                        data-ocid="fc-select-all"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Parent Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((cat, idx) => {
                    const isSub = cat.parentId !== null;
                    return (
                      <tr
                        key={cat.id}
                        data-ocid={`fc-row-${cat.id}`}
                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(cat.id)}
                            onCheckedChange={() => toggleSelect(cat.id)}
                            data-ocid={`fc-check-${cat.id}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={
                              isSub
                                ? "ml-5 flex items-center gap-1"
                                : "flex items-center gap-1"
                            }
                          >
                            {isSub && (
                              <span className="text-muted-foreground text-xs">
                                ↳
                              </span>
                            )}
                            <span
                              className={`font-medium ${isSub ? "text-foreground/80" : "text-foreground"}`}
                            >
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${cat.type === "income" ? "border-accent/40 text-accent-foreground" : "border-destructive/40 text-destructive"}`}
                          >
                            {cat.type === "income" ? "Income" : "Expense"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {getParentName(cat.parentId)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {cat.description}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              cat.status === "active"
                                ? "bg-accent/10 text-accent-foreground border-accent/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {cat.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {!isSub && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setEditTarget(undefined);
                                  setParentPreset(cat.id);
                                  setDialogOpen(true);
                                }}
                                data-ocid={`fc-add-sub-${cat.id}`}
                              >
                                <Plus className="size-3 mr-1" /> Sub
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => {
                                setEditTarget(cat);
                                setParentPreset(null);
                                setDialogOpen(true);
                              }}
                              data-ocid={`fc-edit-${cat.id}`}
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(cat.id)}
                              data-ocid={`fc-delete-${cat.id}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Delete this category? Any sub-categories will also be removed.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                data-ocid="fc-confirm-delete"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CategoryForm
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(undefined);
          setParentPreset(null);
        }}
        initial={editTarget}
        parentPreset={parentPreset}
        categories={categories}
        onSave={handleSave}
      />
    </ModulePageLayout>
  );
}
