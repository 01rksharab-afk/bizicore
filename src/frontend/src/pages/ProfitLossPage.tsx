import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/utils/exportToCsv";
import { Download, Plus, TrendingDown, TrendingUp, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PLRow extends Record<string, unknown> {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: "Revenue" | "COGS" | "Expense";
  date: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SEED: PLRow[] = [
  {
    id: "1",
    category: "Product Sales",
    description: "Invoice INV-0042 — Tata Steel Ltd.",
    amount: 285000,
    type: "Revenue",
    date: "2026-04-02",
  },
  {
    id: "2",
    category: "Product Sales",
    description: "Invoice INV-0043 — L&T Construction",
    amount: 162000,
    type: "Revenue",
    date: "2026-04-10",
  },
  {
    id: "3",
    category: "Service Revenue",
    description: "Consulting — Reliance Industries",
    amount: 210000,
    type: "Revenue",
    date: "2026-04-06",
  },
  {
    id: "4",
    category: "Service Revenue",
    description: "Annual maintenance contract — BHEL",
    amount: 185000,
    type: "Revenue",
    date: "2026-04-08",
  },
  {
    id: "5",
    category: "Raw Materials",
    description: "Steel sheets 50MT — SAIL",
    amount: 184000,
    type: "COGS",
    date: "2026-04-04",
  },
  {
    id: "6",
    category: "Direct Labour",
    description: "Production wages — March 2026",
    amount: 65000,
    type: "COGS",
    date: "2026-04-07",
  },
  {
    id: "7",
    category: "Salaries",
    description: "Administrative staff payroll — March",
    amount: 125000,
    type: "Expense",
    date: "2026-04-07",
  },
  {
    id: "8",
    category: "Rent",
    description: "Mumbai warehouse rent — April",
    amount: 45000,
    type: "Expense",
    date: "2026-04-01",
  },
  {
    id: "9",
    category: "Utilities",
    description: "Electricity & internet — April",
    amount: 18500,
    type: "Expense",
    date: "2026-04-05",
  },
  {
    id: "10",
    category: "Office Expenses",
    description: "Stationery and supplies",
    amount: 8500,
    type: "Expense",
    date: "2026-04-09",
  },
];

const CATEGORY_OPTIONS = [...new Set(SEED.map((r) => r.category))].map((c) => ({
  value: c,
  label: c,
}));
const TYPE_OPTIONS = ["Revenue", "COGS", "Expense"].map((t) => ({
  value: t,
  label: t,
}));

const TYPE_COLOR: Record<string, string> = {
  Revenue: "bg-accent/10 text-accent border-accent/20",
  COGS: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Expense: "bg-destructive/10 text-destructive border-destructive/20",
};

const ALL_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "type", label: "Type" },
  { key: "amount", label: "Amount" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfitLossPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [data, setData] = useState<PLRow[]>(SEED);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.category.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q);
      const matchCategory =
        !filters.category || row.category === filters.category;
      const matchType = !filters.type || row.type === filters.type;
      const matchFrom = !filters.dateFrom || row.date >= filters.dateFrom;
      const matchTo = !filters.dateTo || row.date <= filters.dateTo;
      return matchSearch && matchCategory && matchType && matchFrom && matchTo;
    });
  }, [data, search, filters]);

  const totalRevenue = filtered
    .filter((r) => r.type === "Revenue")
    .reduce((s, r) => s + r.amount, 0);
  const totalCogs = filtered
    .filter((r) => r.type === "COGS")
    .reduce((s, r) => s + r.amount, 0);
  const totalExpenses = filtered
    .filter((r) => r.type === "Expense")
    .reduce((s, r) => s + r.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id));

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    exportToCsv(
      "profit-loss",
      cols,
      filtered as unknown as Record<string, unknown>[],
    );
    toast.success("P&L report exported");
  }

  function handleBulkExport() {
    exportToCsv(
      "profit-loss-selected",
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
      title="Profit & Loss"
      moduleName="profit-loss"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            data-ocid="pl-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColumnPicker(true)}
            data-ocid="pl-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info("New P&L entry")}
            data-ocid="pl-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Entry
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Revenue, expenses, and net profitability
      </p>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: fmt(totalRevenue),
            color: "text-accent",
            icon: TrendingUp,
          },
          {
            label: "Total COGS",
            value: fmt(totalCogs),
            color: "text-orange-600",
            icon: TrendingDown,
          },
          {
            label: "Gross Profit",
            value: fmt(grossProfit),
            color: grossProfit >= 0 ? "text-primary" : "text-destructive",
            icon: TrendingUp,
          },
          {
            label: "Net Profit",
            value: fmt(netProfit),
            color: netProfit >= 0 ? "text-accent" : "text-destructive",
            icon: netProfit >= 0 ? TrendingUp : TrendingDown,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3"
          >
            <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-base font-display font-semibold ${color}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search by category or description…"
        filters={[
          { key: "category", label: "Category", options: CATEGORY_OPTIONS },
          { key: "type", label: "Type", options: TYPE_OPTIONS },
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
                "Date",
                "Category",
                "Description",
                "Type",
                "Amount",
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
                  colSpan={7}
                  className="px-4 py-16 text-center text-muted-foreground"
                >
                  No entries match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    data-ocid={`pl-row-${row.id}`}
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">
                      {row.description}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${TYPE_COLOR[row.type]}`}
                      >
                        {row.type}
                      </Badge>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-semibold ${row.type === "Revenue" ? "text-accent" : "text-destructive"}`}
                    >
                      {fmt(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Edit: ${row.description}`)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit"
                          data-ocid={`pl-edit-${row.id}`}
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
                            toast.success("Entry deleted");
                          }}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Delete"
                          data-ocid={`pl-delete-${row.id}`}
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
                  colSpan={5}
                  className="px-4 py-3 text-right text-sm text-muted-foreground"
                >
                  Net Profit ({filtered.length} entries)
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-sm ${netProfit >= 0 ? "text-accent" : "text-destructive"}`}
                >
                  {fmt(netProfit)}
                </td>
                <td />
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
        title="Import P&L Data"
        onImport={async () => {
          toast.success("P&L data imported");
        }}
      />
    </ModulePageLayout>
  );
}
