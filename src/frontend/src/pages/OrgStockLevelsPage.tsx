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
import { Card, CardContent } from "@/components/ui/card";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Package,
  Upload,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface StockItem extends Record<string, unknown> {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  openingStock: number;
  currentStock: number;
  reorderLevel: number;
  uom: string;
}

type StockStatus = "normal" | "low" | "out";

function getStatus(qty: number, reorder: number): StockStatus {
  if (qty === 0) return "out";
  if (qty <= reorder) return "low";
  return "normal";
}

const SAMPLE_STOCK: StockItem[] = [
  {
    id: "1",
    itemCode: "ELC-001",
    name: "LED Bulb 9W",
    category: "Electronics",
    openingStock: 200,
    currentStock: 245,
    reorderLevel: 50,
    uom: "Nos",
  },
  {
    id: "2",
    itemCode: "ELC-002",
    name: "USB-C Cable 1m",
    category: "Electronics",
    openingStock: 50,
    currentStock: 18,
    reorderLevel: 25,
    uom: "Nos",
  },
  {
    id: "3",
    itemCode: "PKG-001",
    name: "Corrugated Box 12x10x8",
    category: "Packaging",
    openingStock: 150,
    currentStock: 0,
    reorderLevel: 100,
    uom: "Nos",
  },
  {
    id: "4",
    itemCode: "RM-001",
    name: "Aluminium Sheet 1mm",
    category: "Raw Materials",
    openingStock: 250,
    currentStock: 320,
    reorderLevel: 100,
    uom: "Kg",
  },
  {
    id: "5",
    itemCode: "CON-001",
    name: "Industrial Lubricant 5L",
    category: "Consumables",
    openingStock: 20,
    currentStock: 8,
    reorderLevel: 10,
    uom: "Ltr",
  },
  {
    id: "6",
    itemCode: "ELC-003",
    name: "Switch Board 6A",
    category: "Electronics",
    openingStock: 80,
    currentStock: 72,
    reorderLevel: 30,
    uom: "Nos",
  },
  {
    id: "7",
    itemCode: "PKG-002",
    name: "Bubble Wrap Roll",
    category: "Packaging",
    openingStock: 100,
    currentStock: 150,
    reorderLevel: 50,
    uom: "Mtr",
  },
  {
    id: "8",
    itemCode: "RM-002",
    name: "Copper Wire 1.5mm",
    category: "Raw Materials",
    openingStock: 40,
    currentStock: 0,
    reorderLevel: 20,
    uom: "Kg",
  },
];

const ALL_COLUMNS = [
  { key: "itemCode", label: "Item Code" },
  { key: "name", label: "Item" },
  { key: "category", label: "Category" },
  { key: "openingStock", label: "Opening Stock" },
  { key: "currentStock", label: "Current Stock" },
  { key: "reorderLevel", label: "Reorder Level" },
  { key: "uom", label: "UOM" },
];

const FILTERS: FilterConfig[] = [
  {
    key: "category",
    label: "Category",
    options: [
      "Electronics",
      "Raw Materials",
      "Packaging",
      "Consumables",
      "Spare Parts",
    ].map((c) => ({ value: c, label: c })),
  },
  {
    key: "status",
    label: "Stock Status",
    options: [
      { value: "normal", label: "Normal" },
      { value: "low", label: "Low Stock" },
      { value: "out", label: "Out of Stock" },
    ],
  },
];

export default function OrgStockLevelsPage() {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedExportCols, setSelectedExportCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );

  const filtered = useMemo(() => {
    let list = SAMPLE_STOCK;
    if (filterValues.category)
      list = list.filter((i) => i.category === filterValues.category);
    if (filterValues.status)
      list = list.filter(
        (i) =>
          getStatus(i.currentStock, i.reorderLevel) === filterValues.status,
      );
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.itemCode.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, filterValues]);

  const outCount = SAMPLE_STOCK.filter(
    (i) => getStatus(i.currentStock, i.reorderLevel) === "out",
  ).length;
  const lowCount = SAMPLE_STOCK.filter(
    (i) => getStatus(i.currentStock, i.reorderLevel) === "low",
  ).length;
  const normalCount = SAMPLE_STOCK.filter(
    (i) => getStatus(i.currentStock, i.reorderLevel) === "normal",
  ).length;

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedExportCols.includes(c.key));
    exportToCsv(
      "org-stock-levels",
      cols,
      filtered as Record<string, unknown>[],
    );
    toast.success("Stock levels exported");
  }

  const STATUS_CONFIG = {
    normal: {
      label: "Normal",
      icon: <CheckCircle2 className="size-3.5" />,
      className: "text-accent border-accent/30 bg-accent/5",
    },
    low: {
      label: "Low Stock",
      icon: <AlertTriangle className="size-3.5" />,
      className:
        "text-yellow-600 border-yellow-400/40 bg-yellow-50 dark:bg-yellow-950/20",
    },
    out: {
      label: "Out of Stock",
      icon: <XCircle className="size-3.5" />,
      className: "text-destructive border-destructive/30 bg-destructive/5",
    },
  };

  const columns: TableColumn<StockItem>[] = [
    {
      key: "itemCode",
      label: "Item Code",
      render: (_v, row) => (
        <span className="font-mono text-xs text-accent font-semibold">
          {row.itemCode}
        </span>
      ),
    },
    {
      key: "name",
      label: "Item",
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
      key: "openingStock",
      label: "Opening",
      render: (_v, row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.openingStock.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "currentStock",
      label: "Current Stock",
      render: (_v, row) => {
        const s = getStatus(row.currentStock, row.reorderLevel);
        return (
          <span
            className={`tabular-nums font-semibold ${s === "out" ? "text-destructive" : s === "low" ? "text-yellow-600" : "text-foreground"}`}
          >
            {row.currentStock.toLocaleString("en-IN")}
          </span>
        );
      },
    },
    {
      key: "reorderLevel",
      label: "Reorder Level",
      render: (_v, row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.reorderLevel.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "uom",
      label: "UOM",
      render: (_v, row) => (
        <span className="text-sm text-muted-foreground">{row.uom}</span>
      ),
    },
    {
      key: "_status",
      label: "Status",
      render: (_v, row) => {
        const s = getStatus(row.currentStock, row.reorderLevel);
        const sc = STATUS_CONFIG[s];
        return (
          <Badge variant="outline" className={`text-xs gap-1 ${sc.className}`}>
            {sc.icon}
            {sc.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <ModulePageLayout
      title="Organisation Stock Levels"
      moduleName="org-stock-levels"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="import-stock-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="export-stock-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "In Stock",
              count: normalCount,
              icon: <CheckCircle2 className="size-5 text-accent" />,
              cls: "border-accent/20 bg-accent/5",
            },
            {
              label: "Low Stock",
              count: lowCount,
              icon: <AlertTriangle className="size-5 text-yellow-600" />,
              cls: "border-yellow-400/30 bg-yellow-50/50 dark:bg-yellow-950/10",
            },
            {
              label: "Out of Stock",
              count: outCount,
              icon: <XCircle className="size-5 text-destructive" />,
              cls: "border-destructive/20 bg-destructive/5",
            },
          ].map((s) => (
            <Card key={s.label} className={s.cls}>
              <CardContent className="p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-display font-bold text-foreground">
                    {s.count}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filters={FILTERS}
          filterValues={filterValues}
          onFilterChange={(k, v) => setFilterValues((f) => ({ ...f, [k]: v }))}
          placeholder="Search item name or code…"
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={() => {
            toast.error("Stock records cannot be bulk deleted");
          }}
          onBulkExport={() => {
            const sel = SAMPLE_STOCK.filter((i) => selectedIds.includes(i.id));
            exportToCsv(
              "stock-export",
              ALL_COLUMNS,
              sel as Record<string, unknown>[],
            );
          }}
        />

        <DataTable
          columns={columns}
          data={filtered}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="No stock records found. Try adjusting your filters."
        />

        {filtered.length === 0 &&
          !search &&
          Object.values(filterValues).every((v) => !v) && (
            <div className="text-center py-16">
              <Package className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No stock records</p>
            </div>
          )}
      </div>

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
        title="Import Stock Levels"
        accept=".csv,.xlsx"
        onImport={async (_file) => {
          toast.success("Stock levels imported");
        }}
      />
    </ModulePageLayout>
  );
}
