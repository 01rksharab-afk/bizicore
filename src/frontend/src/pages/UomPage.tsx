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
import { Download, Plus, Ruler, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface UoM extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  symbol: string;
  baseUnit: string;
  conversionFactor: number;
  status: "active" | "inactive";
}

const SAMPLE_UOMS: UoM[] = [
  {
    id: "1",
    code: "NOS",
    name: "Numbers",
    symbol: "Nos",
    baseUnit: "Nos",
    conversionFactor: 1,
    status: "active",
  },
  {
    id: "2",
    code: "KG",
    name: "Kilogram",
    symbol: "Kg",
    baseUnit: "Gm",
    conversionFactor: 1000,
    status: "active",
  },
  {
    id: "3",
    code: "GM",
    name: "Gram",
    symbol: "Gm",
    baseUnit: "Gm",
    conversionFactor: 1,
    status: "active",
  },
  {
    id: "4",
    code: "LTR",
    name: "Litre",
    symbol: "Ltr",
    baseUnit: "Ml",
    conversionFactor: 1000,
    status: "active",
  },
  {
    id: "5",
    code: "ML",
    name: "Millilitre",
    symbol: "Ml",
    baseUnit: "Ml",
    conversionFactor: 1,
    status: "active",
  },
  {
    id: "6",
    code: "MTR",
    name: "Metre",
    symbol: "Mtr",
    baseUnit: "Cm",
    conversionFactor: 100,
    status: "active",
  },
  {
    id: "7",
    code: "CM",
    name: "Centimetre",
    symbol: "Cm",
    baseUnit: "Cm",
    conversionFactor: 1,
    status: "active",
  },
  {
    id: "8",
    code: "BOX",
    name: "Box",
    symbol: "Box",
    baseUnit: "Nos",
    conversionFactor: 12,
    status: "active",
  },
  {
    id: "9",
    code: "DOZ",
    name: "Dozen",
    symbol: "Doz",
    baseUnit: "Nos",
    conversionFactor: 12,
    status: "active",
  },
  {
    id: "10",
    code: "PCS",
    name: "Piece",
    symbol: "Pcs",
    baseUnit: "Nos",
    conversionFactor: 1,
    status: "inactive",
  },
];

const ALL_COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "symbol", label: "Symbol" },
  { key: "baseUnit", label: "Base Unit" },
  { key: "conversionFactor", label: "Conversion Factor" },
  { key: "status", label: "Status" },
];

const FILTERS: FilterConfig[] = [
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
  code: "",
  name: "",
  symbol: "",
  baseUnit: "",
  conversionFactor: "1",
  status: "active" as "active" | "inactive",
};

export default function UomPage() {
  const [uoms, setUoms] = useState<UoM[]>(SAMPLE_UOMS);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UoM | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedExportCols, setSelectedExportCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );

  const filtered = useMemo(() => {
    let list = uoms;
    if (filterValues.status)
      list = list.filter((u) => u.status === filterValues.status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.symbol.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q),
      );
    }
    return list;
  }, [uoms, search, filterValues]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(u: UoM) {
    setForm({
      code: u.code,
      name: u.name,
      symbol: u.symbol,
      baseUnit: u.baseUnit,
      conversionFactor: u.conversionFactor.toString(),
      status: u.status,
    });
    setEditTarget(u);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.symbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }
    if (editTarget) {
      setUoms((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? {
                ...u,
                ...form,
                conversionFactor: Number(form.conversionFactor) || 1,
              }
            : u,
        ),
      );
      toast.success("Unit of Measure updated");
    } else {
      const newUom: UoM = {
        id: Date.now().toString(),
        ...form,
        conversionFactor: Number(form.conversionFactor) || 1,
      };
      setUoms((prev) => [...prev, newUom]);
      toast.success("Unit of Measure added");
    }
    setDialogOpen(false);
  }

  function handleDelete(u: UoM) {
    setUoms((prev) => prev.filter((item) => item.id !== u.id));
    toast.success("Unit deleted");
  }

  function handleBulkDelete() {
    setUoms((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    toast.success(`${selectedIds.length} units deleted`);
    setSelectedIds([]);
  }

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedExportCols.includes(c.key));
    exportToCsv(
      "units-of-measure",
      cols,
      filtered as Record<string, unknown>[],
    );
    toast.success("Exported");
  }

  const columns: TableColumn<UoM>[] = [
    {
      key: "code",
      label: "Code",
      render: (_v, row) => (
        <span className="font-mono text-xs text-accent font-semibold">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (_v, row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      key: "symbol",
      label: "Symbol",
      render: (_v, row) => (
        <span className="font-mono text-sm font-semibold text-accent">
          {row.symbol}
        </span>
      ),
    },
    {
      key: "baseUnit",
      label: "Base Unit",
      render: (_v, row) => (
        <span className="text-sm text-muted-foreground">{row.baseUnit}</span>
      ),
    },
    {
      key: "conversionFactor",
      label: "Conversion Factor",
      render: (_v, row) => (
        <span className="tabular-nums font-medium">
          {row.conversionFactor.toLocaleString("en-IN")}
        </span>
      ),
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

  return (
    <ModulePageLayout
      title="Units of Measure"
      moduleName="uom"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="import-uom-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="export-uom-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={openAdd} data-ocid="add-uom-btn">
            <Plus className="size-3.5 mr-1.5" /> Add Unit
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
          placeholder="Search name, symbol, code…"
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkExport={() => {
            const sel = uoms.filter((u) => selectedIds.includes(u.id));
            exportToCsv(
              "uom-export",
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
          emptyMessage="No units of measure found."
        />
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Ruler className="size-4" />
              {editTarget ? "Edit Unit of Measure" : "Add Unit of Measure"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="e.g. KG"
                className="font-mono"
                data-ocid="uom-code-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Symbol *</Label>
              <Input
                value={form.symbol}
                onChange={(e) =>
                  setForm((f) => ({ ...f, symbol: e.target.value }))
                }
                placeholder="e.g. Kg"
                className="font-mono"
                data-ocid="uom-symbol-input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Kilogram"
                data-ocid="uom-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Base Unit</Label>
              <Input
                value={form.baseUnit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, baseUnit: e.target.value }))
                }
                placeholder="e.g. Gm"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Conversion Factor</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.conversionFactor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, conversionFactor: e.target.value }))
                }
                placeholder="1"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
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
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="save-uom-btn">
                {editTarget ? "Save Changes" : "Add Unit"}
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
        title="Import Units of Measure"
        accept=".csv,.xlsx"
        onImport={async (_file) => {
          toast.success("Units imported");
        }}
      />
    </ModulePageLayout>
  );
}
