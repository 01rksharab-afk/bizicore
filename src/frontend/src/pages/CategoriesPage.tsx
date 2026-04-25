import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { DataTable, type TableColumn } from "@/components/DataTable";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import {
  type FilterConfig,
  SearchFilterBar,
} from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Plus,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
}

const SAMPLE_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Electronics",
    description: "Electronic components and devices",
    parentId: null,
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    name: "Consumer Electronics",
    description: "End-user electronic goods",
    parentId: "1",
    isActive: true,
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    name: "Industrial Electronics",
    description: "Electronics for industrial use",
    parentId: "1",
    isActive: true,
    createdAt: "2024-01-12",
  },
  {
    id: "4",
    name: "Raw Materials",
    description: "Primary production inputs",
    parentId: null,
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "5",
    name: "Metals",
    description: "Ferrous and non-ferrous metals",
    parentId: "4",
    isActive: true,
    createdAt: "2024-01-13",
  },
  {
    id: "6",
    name: "Polymers",
    description: "Plastics and synthetic materials",
    parentId: "4",
    isActive: true,
    createdAt: "2024-01-13",
  },
  {
    id: "7",
    name: "Packaging",
    description: "Packaging materials and containers",
    parentId: null,
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "8",
    name: "Primary Packaging",
    description: "Direct product packaging",
    parentId: "7",
    isActive: true,
    createdAt: "2024-01-14",
  },
  {
    id: "9",
    name: "Consumables",
    description: "Day-to-day consumable items",
    parentId: null,
    isActive: false,
    createdAt: "2024-01-10",
  },
  {
    id: "10",
    name: "Spare Parts",
    description: "Replacement and maintenance parts",
    parentId: null,
    isActive: true,
    createdAt: "2024-01-10",
  },
];

const EMPTY_FORM = { name: "", description: "", parentId: "", isActive: true };

const CSV_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "parent", label: "Parent Category" },
  { key: "isActive", label: "Status" },
];

const FILTERS: FilterConfig[] = [
  {
    label: "Level",
    key: "level",
    options: [
      { value: "top", label: "Top-level only" },
      { value: "children", label: "With sub-categories" },
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
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(SAMPLE_CATEGORIES);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["1", "4", "7"]),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    CSV_COLUMNS.map((c) => c.key),
  );
  const [importOpen, setImportOpen] = useState(false);

  const parentMap = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const cat of categories) {
      const pid = cat.parentId ?? "root";
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(cat);
    }
    return map;
  }, [categories]);

  const topLevel = parentMap.get("root") ?? [];

  const filtered = useMemo(() => {
    let list = categories;
    if (filters.level === "top") list = list.filter((c) => !c.parentId);
    else if (filters.level === "children")
      list = list.filter((c) => parentMap.get(c.id)?.length);
    if (filters.status === "active") list = list.filter((c) => c.isActive);
    else if (filters.status === "inactive")
      list = list.filter((c) => !c.isActive);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [categories, filters, search, parentMap]);

  const tableData = useMemo(() => {
    // Build flat list respecting hierarchy when not searching/filtering
    const usingSearch = search || Object.values(filters).some(Boolean);
    if (usingSearch) return filtered.map((c) => toRow(c));

    const result: ReturnType<typeof toRow>[] = [];
    function addNode(cats: Category[], depth: number) {
      for (const cat of cats) {
        const children = parentMap.get(cat.id) ?? [];
        result.push({
          ...toRow(cat),
          _depth: depth,
          _hasChildren: children.length > 0,
          _expanded: expandedIds.has(cat.id),
        });
        if (expandedIds.has(cat.id)) addNode(children, depth + 1);
      }
    }
    addNode(topLevel, 0);
    return result;
  }, [filtered, search, filters, topLevel, parentMap, expandedIds]);

  function toRow(cat: Category) {
    const parent = cat.parentId
      ? categories.find((c) => c.id === cat.parentId)
      : null;
    const children = parentMap.get(cat.id) ?? [];
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      parent: parent?.name ?? "—",
      items: children.length,
      isActive: cat.isActive,
      _depth: 0,
      _hasChildren: children.length > 0,
      _expanded: expandedIds.has(cat.id),
    };
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openAdd(parentId?: string) {
    setForm({ ...EMPTY_FORM, parentId: parentId ?? "" });
    setEditTarget(null);
    setDialogOpen(true);
  }
  function openEdit(row: ReturnType<typeof toRow>) {
    const cat = categories.find((c) => c.id === row.id);
    if (!cat) return;
    setForm({
      name: cat.name,
      description: cat.description,
      parentId: cat.parentId ?? "",
      isActive: cat.isActive,
    });
    setEditTarget(cat);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editTarget) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                name: form.name,
                description: form.description,
                parentId: form.parentId || null,
                isActive: form.isActive,
              }
            : c,
        ),
      );
      toast.success("Category updated");
    } else {
      const cat: Category = {
        id: Date.now().toString(),
        name: form.name,
        description: form.description,
        parentId: form.parentId || null,
        isActive: form.isActive,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setCategories((prev) => [...prev, cat]);
      toast.success("Category created");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: ReturnType<typeof toRow>) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    setCategories((prev) =>
      prev.filter((c) => c.id !== row.id && c.parentId !== row.id),
    );
    toast.success("Category deleted");
  }

  function handleBulkDelete() {
    setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    toast.success(`Deleted ${selectedIds.length} categories`);
  }

  function handleExport() {
    const rows = filtered.map((c) => {
      const parent = c.parentId
        ? categories.find((p) => p.id === c.parentId)
        : null;
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        parent: parent?.name ?? "",
        isActive: c.isActive ? "Active" : "Inactive",
      };
    });
    exportToCsv(
      "categories",
      CSV_COLUMNS.filter((c) => selectedColumns.includes(c.key)),
      rows as unknown as Record<string, unknown>[],
    );
  }

  const columns: TableColumn<ReturnType<typeof toRow>>[] = [
    {
      key: "name",
      label: "Name",
      render: (_, row) => (
        <div
          className="flex items-center gap-1"
          style={{ paddingLeft: `${row._depth * 20}px` }}
        >
          {row._hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(row.id);
              }}
              className="p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Expand"
            >
              {row._expanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <Layers className="size-3.5 text-accent shrink-0" />
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (v) => (
        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
          {(v as string) || "—"}
        </span>
      ),
    },
    {
      key: "parent",
      label: "Parent",
      render: (v) =>
        v !== "—" ? (
          <Badge variant="outline" className="text-xs">
            {v as string}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "items",
      label: "Sub-categories",
      render: (v) => <span className="tabular-nums">{v as number}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (v) => (
        <Badge variant={v ? "default" : "secondary"} className="text-xs">
          {v ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setImportOpen(true)}
        data-ocid="import-btn"
      >
        <Upload className="size-3.5 mr-1.5" /> Import
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setColumnPickerOpen(true)}
        data-ocid="export-btn"
      >
        <Download className="size-3.5 mr-1.5" /> Export
      </Button>
      <Button size="sm" onClick={() => openAdd()} data-ocid="new-category-btn">
        <Plus className="size-4 mr-1.5" /> New Category
      </Button>
    </div>
  );

  return (
    <ModulePageLayout
      title="Product Categories"
      moduleName="inventory-categories"
      actions={actions}
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filters={FILTERS}
          filterValues={filters}
          onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
          placeholder="Search categories…"
        />
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleExport}
        />
        <DataTable
          columns={columns}
          data={tableData}
          onEdit={openEdit}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="No categories found. Create your first category."
        />
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editTarget ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Electronics"
                autoFocus
                data-ocid="cat-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, parentId: v === "__none" ? "" : v }))
                }
              >
                <SelectTrigger data-ocid="cat-parent-select">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None (top-level)</SelectItem>
                  {categories
                    .filter((c) => c.id !== editTarget?.id && !c.parentId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="cat-active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="save-cat-btn">
                {editTarget ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ColumnPickerModal
        isOpen={columnPickerOpen}
        onClose={() => setColumnPickerOpen(false)}
        columns={CSV_COLUMNS}
        selectedColumns={selectedColumns}
        onSelectionChange={setSelectedColumns}
        onExport={handleExport}
      />
      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Categories"
        onImport={(file) => {
          toast.success(`Imported ${file.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
