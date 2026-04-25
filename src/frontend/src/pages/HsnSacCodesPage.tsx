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
import { Download, Hash, Plus, Search, Upload, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type CodeType = "HSN" | "SAC";
type EntryMode = "Auto" | "Manual";

interface HsnSacCode extends Record<string, unknown> {
  id: string;
  codeType: CodeType;
  code: string;
  name: string;
  category: string;
  description: string;
  entryMode: EntryMode;
  status: "active" | "inactive";
}

interface LookupEntry {
  codeType: CodeType;
  code: string;
  name: string;
  category: string;
  description: string;
}

// Sample HSN lookup table for auto-lookup
const HSN_LOOKUP: Record<string, LookupEntry> = {
  "85393190": {
    codeType: "HSN",
    code: "85393190",
    name: "LED Lamps",
    category: "Electronics",
    description: "LED lamps and other energy-saving light sources",
  },
  "85444200": {
    codeType: "HSN",
    code: "85444200",
    name: "Electrical Conductors",
    category: "Electronics",
    description: "Electrical conductors fitted with connectors",
  },
  "48191000": {
    codeType: "HSN",
    code: "48191000",
    name: "Cartons, Boxes of Corrugated Paper",
    category: "Packaging",
    description: "Cartons, boxes and cases of corrugated paper",
  },
  "76061100": {
    codeType: "HSN",
    code: "76061100",
    name: "Aluminium Plates/Sheets",
    category: "Raw Materials",
    description: "Aluminium plates, sheets and strip not alloyed",
  },
  "27101980": {
    codeType: "HSN",
    code: "27101980",
    name: "Lubricating Oils",
    category: "Consumables",
    description: "Other lubricating oils and preparations",
  },
  "73181500": {
    codeType: "HSN",
    code: "73181500",
    name: "Screws, Bolts and Nuts",
    category: "Hardware",
    description: "Screws, bolts, nuts and similar articles of iron/steel",
  },
  "39269099": {
    codeType: "HSN",
    code: "39269099",
    name: "Plastic Articles NES",
    category: "Plastics",
    description: "Other articles of plastics not elsewhere specified",
  },
  "84713010": {
    codeType: "HSN",
    code: "84713010",
    name: "Laptop Computers",
    category: "Electronics",
    description: "Portable automatic data-processing machines",
  },
  "998314": {
    codeType: "SAC",
    code: "998314",
    name: "Legal Documentation Services",
    category: "Professional Services",
    description: "Other legal documentation and certification services",
  },
  "996111": {
    codeType: "SAC",
    code: "996111",
    name: "Postal Delivery Services",
    category: "Logistics",
    description: "Postal services including letters and parcels",
  },
};

const SAMPLE_HSN: HsnSacCode[] = [
  {
    id: "1",
    codeType: "HSN",
    code: "85393190",
    name: "LED Lamps",
    category: "Electronics",
    description: "LED lamps and other energy-saving light sources",
    entryMode: "Auto",
    status: "active",
  },
  {
    id: "2",
    codeType: "HSN",
    code: "85444200",
    name: "Electrical Conductors",
    category: "Electronics",
    description: "Electrical conductors fitted with connectors",
    entryMode: "Auto",
    status: "active",
  },
  {
    id: "3",
    codeType: "HSN",
    code: "48191000",
    name: "Cartons, Boxes of Corrugated Paper",
    category: "Packaging",
    description: "Cartons, boxes and cases of corrugated paper",
    entryMode: "Manual",
    status: "active",
  },
  {
    id: "4",
    codeType: "HSN",
    code: "76061100",
    name: "Aluminium Plates/Sheets",
    category: "Raw Materials",
    description: "Aluminium plates, sheets and strip not alloyed",
    entryMode: "Auto",
    status: "active",
  },
  {
    id: "5",
    codeType: "SAC",
    code: "998314",
    name: "Legal Documentation Services",
    category: "Professional Services",
    description: "Other legal documentation and certification services",
    entryMode: "Manual",
    status: "active",
  },
  {
    id: "6",
    codeType: "SAC",
    code: "996111",
    name: "Postal Delivery Services",
    category: "Logistics",
    description: "Postal services including letters and parcels",
    entryMode: "Manual",
    status: "inactive",
  },
];

const ALL_COLUMNS = [
  { key: "codeType", label: "Code Type" },
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "entryMode", label: "Entry Mode" },
  { key: "status", label: "Status" },
];

const FILTERS: FilterConfig[] = [
  {
    key: "codeType",
    label: "Code Type",
    options: [
      { value: "HSN", label: "HSN" },
      { value: "SAC", label: "SAC" },
    ],
  },
  {
    key: "entryMode",
    label: "Entry Mode",
    options: [
      { value: "Auto", label: "Auto" },
      { value: "Manual", label: "Manual" },
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
  codeType: "HSN" as CodeType,
  code: "",
  name: "",
  category: "",
  description: "",
  entryMode: "Manual" as EntryMode,
  status: "active" as "active" | "inactive",
};

export default function HsnSacCodesPage() {
  const [codes, setCodes] = useState<HsnSacCode[]>(SAMPLE_HSN);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HsnSacCode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedExportCols, setSelectedExportCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");

  const filtered = useMemo(() => {
    let list = codes;
    if (filterValues.codeType)
      list = list.filter((c) => c.codeType === filterValues.codeType);
    if (filterValues.entryMode)
      list = list.filter((c) => c.entryMode === filterValues.entryMode);
    if (filterValues.status)
      list = list.filter((c) => c.status === filterValues.status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [codes, search, filterValues]);

  const lookupResults = useMemo(() => {
    if (!lookupQuery) return Object.values(HSN_LOOKUP);
    const q = lookupQuery.toLowerCase();
    return Object.values(HSN_LOOKUP).filter(
      (r) =>
        r.code.includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q),
    );
  }, [lookupQuery]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(row: HsnSacCode) {
    setForm({
      codeType: row.codeType,
      code: row.code,
      name: row.name,
      category: row.category,
      description: row.description,
      entryMode: row.entryMode,
      status: row.status,
    });
    setEditTarget(row);
    setDialogOpen(true);
  }

  function applyLookup(result: LookupEntry) {
    setForm((f) => ({
      ...f,
      codeType: result.codeType,
      code: result.code,
      name: result.name,
      category: result.category,
      description: result.description,
      entryMode: "Auto" as EntryMode,
    }));
    setLookupOpen(false);
    setDialogOpen(true);
    toast.success(`HSN/SAC details auto-filled for ${result.code}`);
  }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    if (editTarget) {
      setCodes((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...c, ...form } : c)),
      );
      toast.success("HSN/SAC code updated");
    } else {
      const newCode: HsnSacCode = { id: Date.now().toString(), ...form };
      setCodes((prev) => [newCode, ...prev]);
      toast.success("HSN/SAC code added");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: HsnSacCode) {
    setCodes((prev) => prev.filter((c) => c.id !== row.id));
    toast.success("Code deleted");
  }

  function handleBulkDelete() {
    setCodes((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    toast.success(`${selectedIds.length} codes deleted`);
    setSelectedIds([]);
  }

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedExportCols.includes(c.key));
    exportToCsv("hsn-sac-codes", cols, filtered as Record<string, unknown>[]);
    toast.success("Exported successfully");
  }

  const columns: TableColumn<HsnSacCode>[] = [
    {
      key: "codeType",
      label: "Type",
      render: (_v, row) => (
        <Badge
          variant="outline"
          className={
            row.codeType === "HSN"
              ? "text-blue-600 border-blue-400/40 text-xs"
              : "text-purple-600 border-purple-400/40 text-xs"
          }
        >
          {row.codeType}
        </Badge>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (_v, row) => (
        <span className="font-mono text-xs font-semibold text-accent">
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
      key: "category",
      label: "Category",
      render: (_v, row) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.category}
        </Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (_v, row) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "entryMode",
      label: "Entry Mode",
      render: (_v, row) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${row.entryMode === "Auto" ? "text-accent" : "text-muted-foreground"}`}
        >
          {row.entryMode === "Auto" && <Zap className="size-3" />}
          {row.entryMode}
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
      title="HSN / SAC Codes"
      moduleName="hsn-sac-codes"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLookupOpen(true)}
            data-ocid="auto-lookup-btn"
          >
            <Zap className="size-3.5 mr-1.5" /> Auto Lookup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="import-hsn-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="export-hsn-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={openAdd} data-ocid="add-hsn-btn">
            <Plus className="size-3.5 mr-1.5" /> Add Code
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
          placeholder="Search code, name, category…"
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkExport={() => {
            const sel = codes.filter((c) => selectedIds.includes(c.id));
            exportToCsv(
              "hsn-sac-export",
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
          emptyMessage="No HSN/SAC codes found. Add codes or use Auto Lookup."
        />
      </div>

      {/* Auto Lookup Dialog */}
      <Dialog
        open={lookupOpen}
        onOpenChange={(v) => !v && setLookupOpen(false)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Zap className="size-4 text-accent" /> Auto Lookup HSN / SAC Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by code or description…"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                autoFocus
                data-ocid="lookup-search"
              />
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {lookupResults.map((r) => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => applyLookup(r)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors"
                  data-ocid={`lookup-result-${r.code}`}
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className={
                        r.codeType === "HSN"
                          ? "text-blue-600 border-blue-400/40 text-xs shrink-0"
                          : "text-purple-600 border-purple-400/40 text-xs shrink-0"
                      }
                    >
                      {r.codeType}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-accent">
                          {r.code}
                        </span>
                        <span className="font-medium text-foreground text-sm">
                          {r.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {r.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {r.category}
                    </Badge>
                  </div>
                </button>
              ))}
              {lookupResults.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Hash className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                  No codes found matching "{lookupQuery}"
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editTarget ? "Edit HSN/SAC Code" : "Add HSN/SAC Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>Code Type</Label>
              <Select
                value={form.codeType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, codeType: v as CodeType }))
                }
              >
                <SelectTrigger data-ocid="code-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HSN">HSN — Goods</SelectItem>
                  <SelectItem value="SAC">SAC — Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="e.g. 85393190"
                className="font-mono"
                data-ocid="code-input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. LED Lamps"
                data-ocid="code-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g. Electronics"
                data-ocid="code-category-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Entry Mode</Label>
              <Select
                value={form.entryMode}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, entryMode: v as EntryMode }))
                }
              >
                <SelectTrigger data-ocid="entry-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Auto">Auto (from lookup)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Detailed description"
                rows={2}
                data-ocid="code-desc-input"
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
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="save-code-btn">
                {editTarget ? "Save Changes" : "Add Code"}
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
        title="Import HSN/SAC Codes"
        accept=".csv,.xlsx"
        onImport={async (_file) => {
          toast.success("Codes imported successfully");
        }}
      />
    </ModulePageLayout>
  );
}
