import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/utils/exportToCsv";
import { Building2, Download, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BSRow extends Record<string, unknown> {
  id: string;
  account: string;
  code: string;
  accountType: "Asset" | "Liability" | "Equity";
  amount: number;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SEED: BSRow[] = [
  {
    id: "1",
    code: "1001",
    account: "Cash & Bank",
    accountType: "Asset",
    amount: 710000,
  },
  {
    id: "2",
    code: "1002",
    account: "Accounts Receivable",
    accountType: "Asset",
    amount: 447000,
  },
  {
    id: "3",
    code: "1003",
    account: "Raw Materials Inventory",
    accountType: "Asset",
    amount: 184000,
  },
  {
    id: "4",
    code: "1004",
    account: "Finished Goods",
    accountType: "Asset",
    amount: 96000,
  },
  {
    id: "5",
    code: "1005",
    account: "Office Equipment",
    accountType: "Asset",
    amount: 95000,
  },
  {
    id: "6",
    code: "1006",
    account: "Prepaid Expenses",
    accountType: "Asset",
    amount: 24000,
  },
  {
    id: "7",
    code: "2001",
    account: "Accounts Payable",
    accountType: "Liability",
    amount: 184000,
  },
  {
    id: "8",
    code: "2002",
    account: "GST Payable",
    accountType: "Liability",
    amount: 51300,
  },
  {
    id: "9",
    code: "2003",
    account: "Salaries Payable",
    accountType: "Liability",
    amount: 125000,
  },
  {
    id: "10",
    code: "2004",
    account: "Short-term Loans",
    accountType: "Liability",
    amount: 200000,
  },
  {
    id: "11",
    code: "3001",
    account: "Share Capital",
    accountType: "Equity",
    amount: 500000,
  },
  {
    id: "12",
    code: "3002",
    account: "Retained Earnings",
    accountType: "Equity",
    amount: 495700,
  },
];

const TYPE_OPTIONS = ["Asset", "Liability", "Equity"].map((t) => ({
  value: t,
  label: t,
}));

const TYPE_COLOR: Record<string, string> = {
  Asset: "bg-accent/10 text-accent border-accent/20",
  Liability: "bg-destructive/10 text-destructive border-destructive/20",
  Equity: "bg-primary/10 text-primary border-primary/20",
};

const ALL_COLUMNS = [
  { key: "code", label: "Account Code" },
  { key: "account", label: "Account" },
  { key: "accountType", label: "Type" },
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

export default function BalanceSheetPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [data, setData] = useState<BSRow[]>(SEED);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.account.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q);
      const matchType =
        !filters.accountType || row.accountType === filters.accountType;
      return matchSearch && matchType;
    });
  }, [data, search, filters]);

  const totalAssets = filtered
    .filter((r) => r.accountType === "Asset")
    .reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = filtered
    .filter((r) => r.accountType === "Liability")
    .reduce((s, r) => s + r.amount, 0);
  const totalEquity = filtered
    .filter((r) => r.accountType === "Equity")
    .reduce((s, r) => s + r.amount, 0);
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id));

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    exportToCsv(
      "balance-sheet",
      cols,
      filtered as unknown as Record<string, unknown>[],
    );
    toast.success("Balance Sheet exported");
  }

  function handleBulkExport() {
    exportToCsv(
      "balance-sheet-selected",
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
      title="Balance Sheet"
      moduleName="balance-sheet"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            data-ocid="bs-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColumnPicker(true)}
            data-ocid="bs-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info("New account entry")}
            data-ocid="bs-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Entry
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Assets, liabilities, and equity as of today
      </p>

      {/* Balance summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Assets",
            value: fmt(totalAssets),
            color: "text-accent",
          },
          {
            label: "Total Liabilities",
            value: fmt(totalLiabilities),
            color: "text-destructive",
          },
          {
            label: "Total Equity",
            value: fmt(totalEquity),
            color: "text-primary",
          },
          {
            label: "Balance Check",
            value: balanced ? "Balanced ✓" : "Out of Balance ✗",
            color: balanced ? "text-accent" : "text-destructive",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-lg p-4"
          >
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {card.label}
            </p>
            <p
              className={`text-base font-display font-semibold mt-1 ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search by account name or code…"
        filters={[
          { key: "accountType", label: "Account Type", options: TYPE_OPTIONS },
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
              {["Code", "Account", "Type", "Amount", "Actions"].map((h) => (
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
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      No accounts found
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    data-ocid={`bs-row-${row.id}`}
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
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.account}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${TYPE_COLOR[row.accountType]}`}
                      >
                        {row.accountType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-foreground">
                      {fmt(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Edit: ${row.account}`)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit"
                          data-ocid={`bs-edit-${row.id}`}
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
                          data-ocid={`bs-delete-${row.id}`}
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
        title="Import Balance Sheet Data"
        onImport={async () => {
          toast.success("Balance sheet data imported");
        }}
      />
    </ModulePageLayout>
  );
}
