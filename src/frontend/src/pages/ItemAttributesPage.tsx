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
import { exportToCsv } from "@/utils/exportToCsv";
import { Download, Plus, Settings2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type AttributeType = "text" | "number" | "list";

interface ItemAttribute extends Record<string, unknown> {
  id: string;
  name: string;
  type: AttributeType;
  values: string[];
  required: boolean;
  itemsUsing: number;
  status: "active" | "inactive";
}

const TYPE_COLORS: Record<AttributeType, string> = {
  text: "text-blue-600 border-blue-400/40",
  number: "text-purple-600 border-purple-400/40",
  list: "text-accent border-accent/40",
};

const SAMPLE_ATTRIBUTES: ItemAttribute[] = [
  {
    id: "1",
    name: "Color",
    type: "list",
    values: ["Red", "Blue", "Green", "Black", "White"],
    required: false,
    itemsUsing: 24,
    status: "active",
  },
  {
    id: "2",
    name: "Size",
    type: "list",
    values: ["XS", "S", "M", "L", "XL", "XXL"],
    required: false,
    itemsUsing: 18,
    status: "active",
  },
  {
    id: "3",
    name: "Wattage",
    type: "number",
    values: [],
    required: true,
    itemsUsing: 9,
    status: "active",
  },
  {
    id: "4",
    name: "Brand",
    type: "text",
    values: [],
    required: false,
    itemsUsing: 32,
    status: "active",
  },
  {
    id: "5",
    name: "Material",
    type: "list",
    values: ["Plastic", "Metal", "Wood", "Fabric", "Glass"],
    required: false,
    itemsUsing: 15,
    status: "active",
  },
  {
    id: "6",
    name: "Weight (kg)",
    type: "number",
    values: [],
    required: false,
    itemsUsing: 21,
    status: "inactive",
  },
  {
    id: "7",
    name: "Grade",
    type: "list",
    values: ["Grade A", "Grade B", "Grade C", "Industrial"],
    required: true,
    itemsUsing: 7,
    status: "active",
  },
  {
    id: "8",
    name: "Voltage",
    type: "list",
    values: ["5V", "12V", "24V", "110V", "220V", "440V"],
    required: false,
    itemsUsing: 12,
    status: "active",
  },
];

const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "values", label: "Values" },
  { key: "required", label: "Required" },
  { key: "itemsUsing", label: "Items Using" },
  { key: "status", label: "Status" },
];

const FILTERS: FilterConfig[] = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "text", label: "Text" },
      { value: "number", label: "Number" },
      { value: "list", label: "List" },
    ],
  },
  {
    key: "required",
    label: "Required",
    options: [
      { value: "yes", label: "Required" },
      { value: "no", label: "Optional" },
    ],
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
  name: "",
  type: "list" as AttributeType,
  values: "",
  required: false,
  status: "active" as "active" | "inactive",
};

export default function ItemAttributesPage() {
  const [attributes, setAttributes] =
    useState<ItemAttribute[]>(SAMPLE_ATTRIBUTES);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemAttribute | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedExportCols, setSelectedExportCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );

  const filtered = useMemo(() => {
    let list = attributes;
    if (filterValues.type)
      list = list.filter((a) => a.type === filterValues.type);
    if (filterValues.required === "yes") list = list.filter((a) => a.required);
    if (filterValues.required === "no") list = list.filter((a) => !a.required);
    if (filterValues.status)
      list = list.filter((a) => a.status === filterValues.status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.values.some((v) => v.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [attributes, search, filterValues]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setDialogOpen(true);
  }
  function openEdit(a: ItemAttribute) {
    setForm({
      name: a.name,
      type: a.type,
      values: a.values.join(", "),
      required: a.required,
      status: a.status,
    });
    setEditTarget(a);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Attribute name is required");
      return;
    }
    const values =
      form.type === "list"
        ? form.values
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
    if (editTarget) {
      setAttributes((prev) =>
        prev.map((a) =>
          a.id === editTarget.id
            ? {
                ...a,
                name: form.name,
                type: form.type,
                values,
                required: form.required,
                status: form.status,
              }
            : a,
        ),
      );
      toast.success("Attribute updated");
    } else {
      setAttributes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: form.name,
          type: form.type,
          values,
          required: form.required,
          itemsUsing: 0,
          status: form.status,
        },
      ]);
      toast.success("Attribute added");
    }
    setDialogOpen(false);
  }

  function handleDelete(a: ItemAttribute) {
    setAttributes((prev) => prev.filter((attr) => attr.id !== a.id));
    toast.success("Attribute deleted");
  }

  function handleBulkDelete() {
    setAttributes((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    toast.success(`${selectedIds.length} attributes deleted`);
    setSelectedIds([]);
  }

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedExportCols.includes(c.key));
    exportToCsv(
      "item-attributes",
      cols,
      filtered.map((a) => ({
        ...a,
        values: a.values.join(", "),
        required: a.required ? "Yes" : "No",
      })) as Record<string, unknown>[],
    );
    toast.success("Exported");
  }

  const columns: TableColumn<ItemAttribute>[] = [
    {
      key: "name",
      label: "Name",
      render: (_, row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (_, row) => (
        <Badge variant="outline" className={`text-xs ${TYPE_COLORS[row.type]}`}>
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </Badge>
      ),
    },
    {
      key: "values",
      label: "Values",
      render: (_, row) =>
        row.type === "list" && row.values.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {row.values.slice(0, 4).map((v) => (
              <Badge
                key={v}
                variant="secondary"
                className="text-xs font-normal"
              >
                {v}
              </Badge>
            ))}
            {row.values.length > 4 && (
              <Badge
                variant="secondary"
                className="text-xs font-normal text-muted-foreground"
              >
                +{row.values.length - 4}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {row.type === "list" ? "No values" : `Free-form ${row.type}`}
          </span>
        ),
    },
    {
      key: "required",
      label: "Required",
      render: (_, row) => (
        <Badge
          variant={row.required ? "default" : "secondary"}
          className="text-xs"
        >
          {row.required ? "Required" : "Optional"}
        </Badge>
      ),
    },
    {
      key: "itemsUsing",
      label: "Items Using",
      render: (_, row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.itemsUsing}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => (
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

  return (
    <ModulePageLayout
      title="Item Attributes"
      moduleName="item-attributes"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="import-attrs-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="export-attrs-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={openAdd} data-ocid="add-attribute-btn">
            <Plus className="size-4 mr-1.5" /> Add Attribute
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filters={FILTERS}
          filterValues={filterValues}
          onFilterChange={(k, v) => setFilterValues((f) => ({ ...f, [k]: v }))}
          placeholder="Search name or values…"
        />
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleExport}
        />
        <DataTable
          columns={columns}
          data={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="No attributes defined. Add attributes to classify your items."
        />
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Settings2 className="size-4" />
              {editTarget ? "Edit Attribute" : "Add Attribute"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Attribute Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Color, Size, Material"
                autoFocus
                data-ocid="attr-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as AttributeType }))
                }
              >
                <SelectTrigger data-ocid="attr-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text — free-form text</SelectItem>
                  <SelectItem value="number">Number — numeric value</SelectItem>
                  <SelectItem value="list">
                    List — predefined options
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "list" && (
              <div className="space-y-1.5">
                <Label>
                  Values{" "}
                  <span className="text-muted-foreground text-xs">
                    (comma-separated)
                  </span>
                </Label>
                <Input
                  value={form.values}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, values: e.target.value }))
                  }
                  placeholder="Red, Blue, Green"
                  data-ocid="attr-values-input"
                />
                {form.values && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {form.values
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">
                          {v}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            )}
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="attr-required"
                checked={form.required}
                onChange={(e) =>
                  setForm((f) => ({ ...f, required: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="attr-required" className="cursor-pointer">
                Required — must be filled for every item
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="save-attribute-btn">
                {editTarget ? "Save Changes" : "Add Attribute"}
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
        title="Import Attributes"
        onImport={(file) => {
          toast.success(`Imported ${file.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
