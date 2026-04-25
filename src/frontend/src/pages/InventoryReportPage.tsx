import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  AlertTriangle,
  Download,
  Package,
  PackageX,
  Plus,
  TrendingUp,
  Upload,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface StockRow extends Record<string, unknown> {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  location: string;
  opening: number;
  added: number;
  sales: number;
  closing: number;
  unitValue: number;
  reorderLevel: number;
  status: StockStatus;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SEED: StockRow[] = [
  {
    id: "1",
    itemCode: "ELE-001",
    name: 'Samsung 55" QLED TV',
    category: "Electronics",
    location: "Mumbai Warehouse",
    opening: 40,
    added: 20,
    sales: 15,
    closing: 45,
    unitValue: 68000,
    reorderLevel: 10,
    status: "In Stock",
  },
  {
    id: "2",
    itemCode: "ELE-002",
    name: "Sony Bluetooth Speaker",
    category: "Electronics",
    location: "Delhi Distribution Centre",
    opening: 25,
    added: 5,
    sales: 22,
    closing: 8,
    unitValue: 3500,
    reorderLevel: 20,
    status: "Low Stock",
  },
  {
    id: "3",
    itemCode: "APP-001",
    name: "Men's Cotton Shirt (XL)",
    category: "Apparel",
    location: "Bangalore Showroom",
    opening: 30,
    added: 0,
    sales: 30,
    closing: 0,
    unitValue: 850,
    reorderLevel: 50,
    status: "Out of Stock",
  },
  {
    id: "4",
    itemCode: "FRN-001",
    name: "Office Ergonomic Chair",
    category: "Furniture",
    location: "Mumbai Warehouse",
    opening: 20,
    added: 10,
    sales: 8,
    closing: 22,
    unitValue: 12000,
    reorderLevel: 5,
    status: "In Stock",
  },
  {
    id: "5",
    itemCode: "FMCG-001",
    name: "Coconut Oil 1L",
    category: "FMCG",
    location: "Chennai Depot",
    opening: 100,
    added: 200,
    sales: 150,
    closing: 150,
    unitValue: 180,
    reorderLevel: 100,
    status: "In Stock",
  },
  {
    id: "6",
    itemCode: "MAC-001",
    name: "Industrial Drill Press",
    category: "Machinery",
    location: "Mumbai Warehouse",
    opening: 5,
    added: 0,
    sales: 2,
    closing: 3,
    unitValue: 45000,
    reorderLevel: 5,
    status: "Low Stock",
  },
  {
    id: "7",
    itemCode: "ELE-003",
    name: 'Lenovo Laptop 15"',
    category: "Electronics",
    location: "Delhi Distribution Centre",
    opening: 12,
    added: 0,
    sales: 12,
    closing: 0,
    unitValue: 72000,
    reorderLevel: 8,
    status: "Out of Stock",
  },
  {
    id: "8",
    itemCode: "APP-002",
    name: "Women's Kurta Set",
    category: "Apparel",
    location: "Bangalore Showroom",
    opening: 50,
    added: 80,
    sales: 52,
    closing: 78,
    unitValue: 1200,
    reorderLevel: 25,
    status: "In Stock",
  },
];

const LOCATIONS = [
  "Mumbai Warehouse",
  "Delhi Distribution Centre",
  "Bangalore Showroom",
  "Chennai Depot",
].map((l) => ({ value: l, label: l }));
const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Furniture",
  "FMCG",
  "Machinery",
].map((c) => ({ value: c, label: c }));
const STATUS_OPTIONS = ["In Stock", "Low Stock", "Out of Stock"].map((s) => ({
  value: s,
  label: s,
}));

const STATUS_STYLE: Record<StockStatus, string> = {
  "In Stock": "bg-accent/10 text-accent border-accent/30",
  "Low Stock":
    "bg-yellow-500/10 text-yellow-600 border-yellow-300 dark:text-yellow-400",
  "Out of Stock": "bg-destructive/10 text-destructive border-destructive/30",
};

const ALL_COLUMNS = [
  { key: "itemCode", label: "Item Code" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  { key: "opening", label: "Opening Stock" },
  { key: "added", label: "Added" },
  { key: "sales", label: "Sales" },
  { key: "closing", label: "Closing Stock" },
  { key: "unitValue", label: "Unit Value" },
  { key: "status", label: "Status" },
];

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  color = "text-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className={`text-xl font-display font-semibold ${color}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryReportPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [data, setData] = useState<StockRow[]>(SEED);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.itemCode.toLowerCase().includes(q);
      const matchCat = !filters.category || row.category === filters.category;
      const matchLoc = !filters.location || row.location === filters.location;
      const matchStatus = !filters.status || row.status === filters.status;
      return matchSearch && matchCat && matchLoc && matchStatus;
    });
  }, [data, search, filters]);

  const totalValue = filtered.reduce((s, i) => s + i.closing * i.unitValue, 0);
  const lowStock = filtered.filter((i) => i.status === "Low Stock").length;
  const outOfStock = filtered.filter((i) => i.status === "Out of Stock").length;

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id));

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    exportToCsv(
      "inventory-report",
      cols,
      filtered as unknown as Record<string, unknown>[],
    );
    toast.success("Inventory report exported");
  }

  function handleBulkExport() {
    exportToCsv(
      "inventory-report-selected",
      ALL_COLUMNS,
      selectedRows as unknown as Record<string, unknown>[],
    );
    toast.success(`${selectedRows.length} rows exported`);
  }

  function handleBulkDelete() {
    setData((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
    toast.success("Selected entries deleted");
  }

  return (
    <ModulePageLayout
      title="Inventory Report"
      moduleName="inventory-report"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            data-ocid="inv-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColumnPicker(true)}
            data-ocid="inv-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info("Add stock entry")}
            data-ocid="inv-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Entry
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Stock levels, movement, valuation, and reorder status
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Package} label="Total SKUs" value={SEED.length} />
        <SummaryCard
          icon={Warehouse}
          label="Total Closing Value"
          value={`₹${(SEED.reduce((s, i) => s + i.closing * i.unitValue, 0) / 100000).toFixed(1)}L`}
          color="text-primary"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStock}
          color="text-yellow-600 dark:text-yellow-400"
        />
        <SummaryCard
          icon={PackageX}
          label="Out of Stock"
          value={outOfStock}
          color="text-destructive"
        />
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search by name or item code…"
        filters={[
          { key: "category", label: "Category", options: CATEGORIES },
          { key: "location", label: "Location", options: LOCATIONS },
          { key: "status", label: "Status", options: STATUS_OPTIONS },
          { key: "dateFrom", label: "From Date", options: [] },
          { key: "dateTo", label: "To Date", options: [] },
        ]}
        filterValues={filters}
        onFilterChange={(key, value) =>
          setFilters((prev) => ({ ...prev, [key]: value }))
        }
      />

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
      />

      <div className="rounded-lg border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === filtered.length &&
                    filtered.length > 0
                  }
                  onChange={(e) =>
                    setSelectedIds(
                      e.target.checked ? filtered.map((r) => r.id) : [],
                    )
                  }
                  className="h-4 w-4 rounded border-border accent-primary"
                  aria-label="Select all"
                />
              </th>
              {[
                "Item Code",
                "Name",
                "Category",
                "Location",
                "Opening",
                "Added",
                "Sales",
                "Closing",
                "Value",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold text-foreground font-display text-xs uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-16 text-center text-muted-foreground"
                >
                  No items match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    data-ocid={`inv-row-${row.id}`}
                    className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : "bg-card"}`}
                  >
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== row.id)
                              : [...prev, row.id],
                          )
                        }
                        className="h-4 w-4 rounded border-border accent-primary"
                        aria-label="Select row"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {row.itemCode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {row.location}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.opening.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">
                      {row.added > 0 ? `+${row.added}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {row.sales > 0 ? `-${row.sales}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                      {row.closing.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      ₹{(row.closing * row.unitValue).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_STYLE[row.status]}`}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Edit: ${row.name}`)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit"
                          data-ocid={`inv-edit-${row.id}`}
                        >
                          <svg
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <title>Edit</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setData((prev) =>
                              prev.filter((r) => r.id !== row.id),
                            );
                            toast.success("Item deleted");
                          }}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Delete"
                          data-ocid={`inv-delete-${row.id}`}
                        >
                          <svg
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <title>Delete</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                <td
                  colSpan={9}
                  className="px-4 py-3 text-right text-sm text-muted-foreground"
                >
                  Total Value ({filtered.length} items)
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                  ₹{totalValue.toLocaleString("en-IN")}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <ColumnPickerModal
        isOpen={showColumnPicker}
        onClose={() => setShowColumnPicker(false)}
        columns={ALL_COLUMNS}
        selectedColumns={selectedColumns}
        onSelectionChange={setSelectedColumns}
        onExport={handleExport}
      />

      <ImportDialog
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import Inventory Data"
        onImport={async () => {
          toast.success("Inventory data imported");
        }}
      />
    </ModulePageLayout>
  );
}
