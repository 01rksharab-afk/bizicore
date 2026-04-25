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
import { exportToCsv } from "@/utils/exportToCsv";
import {
  AlertTriangle,
  Download,
  MapPin,
  Package,
  Upload,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface LocationStock extends Record<string, unknown> {
  id: string;
  itemCode: string;
  name: string;
  location: string;
  minStock: number;
  maxStock: number;
  stockLevel: number;
  uom: string;
}

const SAMPLE_LOCATION_STOCK: LocationStock[] = [
  {
    id: "1",
    itemCode: "ELC-001",
    name: "LED Bulb 9W",
    location: "Warehouse A",
    minStock: 30,
    maxStock: 500,
    stockLevel: 120,
    uom: "Nos",
  },
  {
    id: "2",
    itemCode: "ELC-001",
    name: "LED Bulb 9W",
    location: "Warehouse B",
    minStock: 20,
    maxStock: 300,
    stockLevel: 125,
    uom: "Nos",
  },
  {
    id: "3",
    itemCode: "ELC-002",
    name: "USB-C Cable 1m",
    location: "Warehouse A",
    minStock: 15,
    maxStock: 200,
    stockLevel: 10,
    uom: "Nos",
  },
  {
    id: "4",
    itemCode: "ELC-002",
    name: "USB-C Cable 1m",
    location: "Store - Delhi",
    minStock: 10,
    maxStock: 80,
    stockLevel: 8,
    uom: "Nos",
  },
  {
    id: "5",
    itemCode: "PKG-001",
    name: "Corrugated Box 12x10x8",
    location: "Warehouse A",
    minStock: 60,
    maxStock: 1000,
    stockLevel: 0,
    uom: "Nos",
  },
  {
    id: "6",
    itemCode: "PKG-001",
    name: "Corrugated Box 12x10x8",
    location: "Warehouse B",
    minStock: 40,
    maxStock: 600,
    stockLevel: 0,
    uom: "Nos",
  },
  {
    id: "7",
    itemCode: "RM-001",
    name: "Aluminium Sheet 1mm",
    location: "Warehouse A",
    minStock: 60,
    maxStock: 500,
    stockLevel: 200,
    uom: "Kg",
  },
  {
    id: "8",
    itemCode: "RM-001",
    name: "Aluminium Sheet 1mm",
    location: "Warehouse B",
    minStock: 40,
    maxStock: 300,
    stockLevel: 120,
    uom: "Kg",
  },
  {
    id: "9",
    itemCode: "CON-001",
    name: "Industrial Lubricant 5L",
    location: "Store - Delhi",
    minStock: 5,
    maxStock: 50,
    stockLevel: 5,
    uom: "Ltr",
  },
  {
    id: "10",
    itemCode: "CON-001",
    name: "Industrial Lubricant 5L",
    location: "Warehouse A",
    minStock: 5,
    maxStock: 40,
    stockLevel: 3,
    uom: "Ltr",
  },
];

const LOCATIONS = [
  "Warehouse A",
  "Warehouse B",
  "Store - Delhi",
  "Store - Mumbai",
];

const ALL_COLUMNS = [
  { key: "location", label: "Location" },
  { key: "itemCode", label: "Item Code" },
  { key: "name", label: "Item" },
  { key: "stockLevel", label: "Stock Level" },
  { key: "minStock", label: "Min Stock" },
  { key: "maxStock", label: "Max Stock" },
  { key: "uom", label: "UOM" },
];

const FILTERS: FilterConfig[] = [
  {
    key: "location",
    label: "Location",
    options: LOCATIONS.map((l) => ({ value: l, label: l })),
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

function getStatus(level: number, min: number) {
  if (level === 0) return "out";
  if (level <= min) return "low";
  return "normal";
}

export default function LocationStockLevelsPage() {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedExportCols, setSelectedExportCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );

  const filtered = useMemo(() => {
    let list = SAMPLE_LOCATION_STOCK;
    if (filterValues.location)
      list = list.filter((i) => i.location === filterValues.location);
    if (filterValues.status)
      list = list.filter(
        (i) => getStatus(i.stockLevel, i.minStock) === filterValues.status,
      );
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.itemCode.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, filterValues]);

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedExportCols.includes(c.key));
    exportToCsv(
      "location-stock-levels",
      cols,
      filtered as Record<string, unknown>[],
    );
    toast.success("Stock levels exported");
  }

  const columns: TableColumn<LocationStock>[] = [
    {
      key: "location",
      label: "Location",
      render: (_v, row) => (
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="size-3 text-accent shrink-0" />
          {row.location}
        </span>
      ),
    },
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
      key: "stockLevel",
      label: "Stock Level",
      render: (_v, row) => {
        const s = getStatus(row.stockLevel, row.minStock);
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`tabular-nums font-semibold ${s === "out" ? "text-destructive" : s === "low" ? "text-yellow-600" : "text-foreground"}`}
            >
              {row.stockLevel.toLocaleString("en-IN")}
            </span>
            {s === "low" && (
              <AlertTriangle className="size-3 text-yellow-500" />
            )}
            {s === "out" && <XCircle className="size-3 text-destructive" />}
          </div>
        );
      },
    },
    {
      key: "minStock",
      label: "Min Stock",
      render: (_v, row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.minStock.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "maxStock",
      label: "Max Stock",
      render: (_v, row) => (
        <span className="tabular-nums text-muted-foreground">
          {row.maxStock.toLocaleString("en-IN")}
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
        const s = getStatus(row.stockLevel, row.minStock);
        return (
          <Badge
            variant={s === "out" ? "destructive" : "outline"}
            className={`text-xs ${s === "low" ? "text-yellow-600 border-yellow-400/40" : s === "normal" ? "text-accent border-accent/30" : ""}`}
          >
            {s === "normal" ? "Normal" : s === "low" ? "Low" : "Out"}
          </Badge>
        );
      },
    },
  ];

  // Location summary pills
  const locationSummary = LOCATIONS.map((loc) => {
    const locItems = SAMPLE_LOCATION_STOCK.filter((i) => i.location === loc);
    const outCount = locItems.filter(
      (i) => getStatus(i.stockLevel, i.minStock) === "out",
    ).length;
    return { loc, count: locItems.length, outCount };
  });

  return (
    <ModulePageLayout
      title="Location Stock Levels"
      moduleName="location-stock-levels"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="import-loc-stock-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="export-loc-stock-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Location pills */}
        <div className="flex flex-wrap gap-2">
          {locationSummary.map((s) => (
            <button
              key={s.loc}
              type="button"
              onClick={() =>
                setFilterValues((f) => ({
                  ...f,
                  location: filterValues.location === s.loc ? "" : s.loc,
                }))
              }
              data-ocid={`loc-pill-${s.loc.replace(/\s/g, "-").toLowerCase()}`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${filterValues.location === s.loc ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-accent/40 hover:bg-accent/5"}`}
            >
              <MapPin className="size-3 shrink-0" />
              <span className="font-medium">{s.loc}</span>
              <Badge variant="secondary" className="text-xs ml-1">
                {s.count}
              </Badge>
              {s.outCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {s.outCount} out
                </Badge>
              )}
            </button>
          ))}
        </div>

        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filters={FILTERS}
          filterValues={filterValues}
          onFilterChange={(k, v) => setFilterValues((f) => ({ ...f, [k]: v }))}
          placeholder="Search item name, code, or location…"
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkDelete={() =>
            toast.error("Stock records cannot be bulk deleted")
          }
          onBulkExport={() => {
            const sel = SAMPLE_LOCATION_STOCK.filter((i) =>
              selectedIds.includes(i.id),
            );
            exportToCsv(
              "loc-stock-export",
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
          emptyMessage="No stock records found. Try adjusting location or status filters."
        />

        {filtered.length === 0 &&
          !search &&
          Object.values(filterValues).every((v) => !v) && (
            <div className="text-center py-16">
              <Package className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-foreground">
                No location stock records
              </p>
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
        title="Import Location Stock"
        accept=".csv,.xlsx"
        onImport={async (_file) => {
          toast.success("Location stock imported");
        }}
      />
    </ModulePageLayout>
  );
}
