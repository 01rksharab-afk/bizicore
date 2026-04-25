import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { DataTable, type TableColumn } from "@/components/DataTable";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import {
  type FilterConfig,
  SearchFilterBar,
} from "@/components/SearchFilterBar";
import { ControlGroup } from "@/components/ui/ControlGroup";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { exportToCsv } from "@/utils/exportToCsv";
import { Box, Download, Plus, Search, Upload, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ItemMaster extends Record<string, unknown> {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  uom: string;
  hsn: string;
  partNumber: string;
  rate: number;
  taxPercent: number;
  barcode: string;
  enableBatch: boolean;
  enableSerial: boolean;
  enableShelfLife: boolean;
  status: "active" | "inactive";
}

const CATEGORIES = [
  "Electronics",
  "Raw Materials",
  "Finished Goods",
  "Consumables",
  "Packaging",
  "Spare Parts",
  "Tools & Equipment",
];
const SUB_CATEGORIES: Record<string, string[]> = {
  Electronics: [
    "LED Lighting",
    "Cables & Connectors",
    "Switches",
    "Processors",
  ],
  "Raw Materials": ["Metals", "Plastics", "Chemicals", "Textiles"],
  Packaging: ["Corrugated", "Bubble Wrap", "Strapping"],
  Consumables: ["Lubricants", "Adhesives", "Cleaning Agents"],
  "Finished Goods": ["Assembled Units", "Kits"],
  "Spare Parts": ["Mechanical", "Electrical"],
  "Tools & Equipment": ["Hand Tools", "Power Tools"],
};
const UOMS = [
  "Nos",
  "Kg",
  "Gm",
  "Ltr",
  "Mtr",
  "Box",
  "Pack",
  "Pcs",
  "Dozen",
  "Set",
];

// HSN lookup shortlist
const HSN_LOOKUP: Record<string, string> = {
  "85393190": "LED Lamps",
  "85444200": "Electrical Conductors",
  "48191000": "Cartons, Boxes of Corrugated Paper",
  "76061100": "Aluminium Plates/Sheets",
  "27101980": "Lubricating Oils",
};

const SAMPLE_ITEMS: ItemMaster[] = [
  {
    id: "1",
    itemCode: "ELC-001",
    name: "LED Bulb 9W",
    description: "Energy efficient LED bulb, 9W, warm white",
    category: "Electronics",
    subCategory: "LED Lighting",
    uom: "Nos",
    hsn: "85393190",
    partNumber: "LED-9W-WW",
    rate: 120,
    taxPercent: 12,
    barcode: "8901234567890",
    enableBatch: false,
    enableSerial: false,
    enableShelfLife: false,
    status: "active",
  },
  {
    id: "2",
    itemCode: "ELC-002",
    name: "USB-C Cable 1m",
    description: "Fast charging USB-C to USB-A cable",
    category: "Electronics",
    subCategory: "Cables & Connectors",
    uom: "Nos",
    hsn: "85444200",
    partNumber: "USB-C-1M",
    rate: 299,
    taxPercent: 18,
    barcode: "8901234567891",
    enableBatch: false,
    enableSerial: true,
    enableShelfLife: false,
    status: "active",
  },
  {
    id: "3",
    itemCode: "PKG-001",
    name: "Corrugated Box 12x10x8",
    description: "3-ply corrugated shipping box",
    category: "Packaging",
    subCategory: "Corrugated",
    uom: "Nos",
    hsn: "48191000",
    partNumber: "BOX-12X10",
    rate: 45,
    taxPercent: 12,
    barcode: "",
    enableBatch: true,
    enableSerial: false,
    enableShelfLife: false,
    status: "active",
  },
  {
    id: "4",
    itemCode: "RM-001",
    name: "Aluminium Sheet 1mm",
    description: "Grade 1100 aluminium sheet",
    category: "Raw Materials",
    subCategory: "Metals",
    uom: "Kg",
    hsn: "76061100",
    partNumber: "AL-SHT-1MM",
    rate: 180,
    taxPercent: 18,
    barcode: "",
    enableBatch: true,
    enableSerial: false,
    enableShelfLife: false,
    status: "active",
  },
  {
    id: "5",
    itemCode: "CON-001",
    name: "Industrial Lubricant 5L",
    description: "Multi-purpose industrial lubricant",
    category: "Consumables",
    subCategory: "Lubricants",
    uom: "Ltr",
    hsn: "27101980",
    partNumber: "LUB-IND-5L",
    rate: 850,
    taxPercent: 18,
    barcode: "8901234567895",
    enableBatch: true,
    enableSerial: false,
    enableShelfLife: true,
    status: "active",
  },
];

const ALL_COLUMNS = [
  { key: "itemCode", label: "Code" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "subCategory", label: "Sub-category" },
  { key: "hsn", label: "HSN/SAC Code" },
  { key: "rate", label: "Rate (₹)" },
  { key: "taxPercent", label: "Tax %" },
  { key: "uom", label: "UOM" },
  { key: "status", label: "Status" },
];

const FILTERS: FilterConfig[] = [
  {
    key: "category",
    label: "Category",
    options: CATEGORIES.map((c) => ({ value: c, label: c })),
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];

const EMPTY_FORM = {
  itemCode: "",
  name: "",
  description: "",
  category: "",
  subCategory: "",
  uom: "Nos",
  hsn: "",
  partNumber: "",
  rate: "",
  taxPercent: "18",
  barcode: "",
  enableBatch: false,
  enableSerial: false,
  enableShelfLife: false,
  status: "active" as "active" | "inactive",
};

export default function ItemMasterPage() {
  const [items, setItems] = useState<ItemMaster[]>(SAMPLE_ITEMS);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemMaster | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedExportCols, setSelectedExportCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [hsnSearch, setHsnSearch] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (filterValues.category)
      list = list.filter((i) => i.category === filterValues.category);
    if (filterValues.status)
      list = list.filter((i) => i.status === filterValues.status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.itemCode.toLowerCase().includes(q) ||
          i.hsn.includes(q) ||
          i.partNumber.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.subCategory.toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, search, filterValues]);

  const hsnResults = useMemo(() => {
    if (!hsnSearch) return [];
    const q = hsnSearch.toLowerCase();
    return Object.entries(HSN_LOOKUP)
      .filter(
        ([code, name]) => code.includes(q) || name.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [hsnSearch]);

  function openAdd() {
    setForm({ ...EMPTY_FORM, itemCode: `ITM-${String(Date.now()).slice(-5)}` });
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(item: ItemMaster) {
    setForm({
      itemCode: item.itemCode,
      name: item.name,
      description: item.description,
      category: item.category,
      subCategory: item.subCategory,
      uom: item.uom,
      hsn: item.hsn,
      partNumber: item.partNumber,
      rate: item.rate.toString(),
      taxPercent: item.taxPercent.toString(),
      barcode: item.barcode,
      enableBatch: item.enableBatch,
      enableSerial: item.enableSerial,
      enableShelfLife: item.enableShelfLife,
      status: item.status,
    });
    setEditTarget(item);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (editTarget) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editTarget.id
            ? {
                ...i,
                ...form,
                rate: Number(form.rate) || 0,
                taxPercent: Number(form.taxPercent) || 0,
              }
            : i,
        ),
      );
      toast.success("Item updated");
    } else {
      const newItem: ItemMaster = {
        id: Date.now().toString(),
        ...form,
        rate: Number(form.rate) || 0,
        taxPercent: Number(form.taxPercent) || 0,
      };
      setItems((prev) => [newItem, ...prev]);
      toast.success("Item added");
    }
    setDialogOpen(false);
    setHsnSearch("");
  }

  function handleDelete(item: ItemMaster) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Item deleted");
  }

  function handleBulkDelete() {
    setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
    toast.success(`${selectedIds.length} items deleted`);
    setSelectedIds([]);
  }

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedExportCols.includes(c.key));
    exportToCsv("item-master", cols, filtered as Record<string, unknown>[]);
    toast.success("Exported successfully");
  }

  const columns: TableColumn<ItemMaster>[] = [
    {
      key: "itemCode",
      label: "Code",
      render: (_v, row) => (
        <span className="font-mono text-xs text-accent font-semibold">
          {row.itemCode}
        </span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (_v, row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_v, row) => (
        <div className="space-y-0.5">
          <Badge variant="secondary" className="text-xs font-normal">
            {row.category}
          </Badge>
          {row.subCategory && (
            <p className="text-xs text-muted-foreground">{row.subCategory}</p>
          )}
        </div>
      ),
    },
    {
      key: "hsn",
      label: "HSN/SAC",
      render: (_v, row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.hsn || "—"}
        </span>
      ),
    },
    {
      key: "rate",
      label: "Rate (₹)",
      render: (_v, row) => (
        <span className="tabular-nums font-medium text-foreground">
          ₹{row.rate.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "taxPercent",
      label: "Tax %",
      render: (_v, row) => (
        <Badge variant="outline" className="text-xs">
          {row.taxPercent}%
        </Badge>
      ),
    },
    {
      key: "uom",
      label: "UOM",
      render: (_v, row) => <span className="text-sm">{row.uom}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (_v, row) => (
        <Badge
          variant={row.status === "active" ? "outline" : "secondary"}
          className={
            row.status === "active"
              ? "text-accent border-accent/30 text-xs"
              : "text-xs"
          }
        >
          {row.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const subCategoryOptions = form.category
    ? (SUB_CATEGORIES[form.category] ?? [])
    : [];

  return (
    <ModulePageLayout
      title="Item Master"
      moduleName="item-master"
      actions={
        <ControlGroup
          showToggle={false}
          buttons={[
            {
              label: "Add Item",
              icon: <Plus className="size-3.5" />,
              onClick: openAdd,
              variant: "default",
              "data-ocid": "add-item-btn",
            },
            {
              label: "Import",
              icon: <Upload className="size-3.5" />,
              onClick: () => setImportOpen(true),
              variant: "outline",
              "data-ocid": "import-items-btn",
            },
            {
              label: "Export",
              icon: <Download className="size-3.5" />,
              onClick: () => setExportOpen(true),
              variant: "outline",
              "data-ocid": "export-items-btn",
            },
          ]}
        />
      }
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filters={FILTERS}
          filterValues={filterValues}
          onFilterChange={(k, v) => setFilterValues((f) => ({ ...f, [k]: v }))}
          placeholder="Search name, code, HSN, sub-category…"
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkExport={() => {
            const sel = items.filter((i) => selectedIds.includes(i.id));
            exportToCsv(
              "items-export",
              ALL_COLUMNS,
              sel as Record<string, unknown>[],
            );
          }}
        />

        <DataTable
          columns={columns}
          data={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="No items found. Add your first item to the catalog."
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editTarget ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>Item Code</Label>
              <Input
                value={form.itemCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, itemCode: e.target.value }))
                }
                className="font-mono text-sm"
                data-ocid="item-code-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="item-name-input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v, subCategory: "" }))
                }
              >
                <SelectTrigger data-ocid="item-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sub-category</Label>
              <Select
                value={form.subCategory}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, subCategory: v }))
                }
              >
                <SelectTrigger data-ocid="item-subcategory-select">
                  <SelectValue
                    placeholder={
                      form.category
                        ? "Select sub-category"
                        : "Select category first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subCategoryOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit of Measure</Label>
              <Select
                value={form.uom}
                onValueChange={(v) => setForm((f) => ({ ...f, uom: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOMS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Part Number</Label>
              <Input
                value={form.partNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, partNumber: e.target.value }))
                }
                className="font-mono text-sm"
              />
            </div>
            {/* HSN Search */}
            <div className="col-span-2 space-y-1.5">
              <Label>HSN / SAC Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  className="pl-9 font-mono text-sm"
                  placeholder="Type to search HSN/SAC or enter manually"
                  value={hsnSearch || form.hsn}
                  onChange={(e) => {
                    setHsnSearch(e.target.value);
                    setForm((f) => ({ ...f, hsn: e.target.value }));
                  }}
                  data-ocid="hsn-search-input"
                />
              </div>
              {hsnResults.length > 0 && (
                <div className="border border-border rounded-md bg-card shadow-sm overflow-hidden">
                  {hsnResults.map(([code, name]) => (
                    <button
                      key={code}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                      onClick={() => {
                        setForm((f) => ({ ...f, hsn: code }));
                        setHsnSearch("");
                      }}
                      data-ocid={`hsn-result-${code}`}
                    >
                      <Zap className="size-3 text-accent shrink-0" />
                      <span className="font-mono text-xs font-semibold text-accent">
                        {code}
                      </span>
                      <span className="text-xs text-foreground">{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Rate (₹)</Label>
              <Input
                type="number"
                value={form.rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tax %</Label>
              <Input
                type="number"
                value={form.taxPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, taxPercent: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <Input
                value={form.barcode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, barcode: e.target.value }))
                }
                className="font-mono text-sm"
                placeholder="EAN / UPC"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as "active" | "inactive" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-4 bg-muted/30 rounded-lg p-3">
              {(
                ["enableBatch", "enableSerial", "enableShelfLife"] as const
              ).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Switch
                    id={key}
                    checked={Boolean(form[key])}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, [key]: v }))
                    }
                  />
                  <Label htmlFor={key} className="cursor-pointer text-sm">
                    {key === "enableBatch"
                      ? "Enable Batches"
                      : key === "enableSerial"
                        ? "Enable Serialization"
                        : "Enable Shelf Life"}
                  </Label>
                </div>
              ))}
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="save-item-btn">
                {editTarget ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ColumnPickerModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        columns={ALL_COLUMNS}
        selectedColumns={selectedExportCols}
        onSelectionChange={setSelectedExportCols}
        onExport={handleExport}
      />

      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Items"
        accept=".csv,.xlsx"
        onImport={async (_file) => {
          toast.success("Items imported");
        }}
      />

      {/* Empty state */}
      {filtered.length === 0 &&
        !search &&
        Object.values(filterValues).every((v) => !v) && (
          <div className="text-center py-16">
            <Box className="size-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-foreground">No items in catalog</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first item to get started
            </p>
            <Button size="sm" className="mt-4" onClick={openAdd}>
              <Plus className="size-4 mr-1.5" />
              Add Item
            </Button>
          </div>
        )}
    </ModulePageLayout>
  );
}
