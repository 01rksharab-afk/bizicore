import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Download, Plus, Scale, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrialRow extends Record<string, unknown> {
  id: string;
  code: string;
  account: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SEED: TrialRow[] = [
  {
    id: "1",
    code: "1001",
    account: "Cash & Bank",
    accountType: "Asset",
    debit: 710000,
    credit: 0,
    balance: 710000,
  },
  {
    id: "2",
    code: "1002",
    account: "Accounts Receivable",
    accountType: "Asset",
    debit: 447000,
    credit: 0,
    balance: 447000,
  },
  {
    id: "3",
    code: "1003",
    account: "Raw Materials Inventory",
    accountType: "Asset",
    debit: 184000,
    credit: 0,
    balance: 184000,
  },
  {
    id: "4",
    code: "1004",
    account: "Office Equipment",
    accountType: "Asset",
    debit: 95000,
    credit: 0,
    balance: 95000,
  },
  {
    id: "5",
    code: "2001",
    account: "Accounts Payable",
    accountType: "Liability",
    debit: 0,
    credit: 184000,
    balance: -184000,
  },
  {
    id: "6",
    code: "2002",
    account: "GST Payable",
    accountType: "Liability",
    debit: 0,
    credit: 51300,
    balance: -51300,
  },
  {
    id: "7",
    code: "2003",
    account: "Salaries Payable",
    accountType: "Liability",
    debit: 0,
    credit: 125000,
    balance: -125000,
  },
  {
    id: "8",
    code: "3001",
    account: "Share Capital",
    accountType: "Equity",
    debit: 0,
    credit: 500000,
    balance: -500000,
  },
  {
    id: "9",
    code: "3002",
    account: "Retained Earnings",
    accountType: "Equity",
    debit: 0,
    credit: 286700,
    balance: -286700,
  },
  {
    id: "10",
    code: "4001",
    account: "Sales Revenue",
    accountType: "Revenue",
    debit: 0,
    credit: 447000,
    balance: -447000,
  },
  {
    id: "11",
    code: "5001",
    account: "Cost of Goods Sold",
    accountType: "Expense",
    debit: 125000,
    credit: 0,
    balance: 125000,
  },
  {
    id: "12",
    code: "5002",
    account: "Salaries & Wages",
    accountType: "Expense",
    debit: 125000,
    credit: 0,
    balance: 125000,
  },
  {
    id: "13",
    code: "5003",
    account: "Office Expenses",
    accountType: "Expense",
    debit: 8500,
    credit: 0,
    balance: 8500,
  },
];

const TYPE_OPTIONS = [...new Set(SEED.map((r) => r.accountType))].map((t) => ({
  value: t,
  label: t,
}));

const TYPE_COLOR: Record<string, string> = {
  Asset: "bg-accent/10 text-accent border-accent/20",
  Liability: "bg-destructive/10 text-destructive border-destructive/20",
  Equity: "bg-primary/10 text-primary border-primary/20",
  Revenue: "bg-green-500/10 text-green-600 border-green-500/20",
  Expense: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const ALL_COLUMNS = [
  { key: "code", label: "Account Code" },
  { key: "account", label: "Account Name" },
  { key: "accountType", label: "Account Type" },
  { key: "debit", label: "Debit" },
  { key: "credit", label: "Credit" },
  { key: "balance", label: "Balance" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

interface NewEntryForm {
  code: string;
  account: string;
  accountType: string;
  debit: string;
  credit: string;
}

const EMPTY_FORM: NewEntryForm = {
  code: "",
  account: "",
  accountType: "",
  debit: "",
  credit: "",
};

export default function TrialBalancePage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [data, setData] = useState<TrialRow[]>(SEED);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newForm, setNewForm] = useState<NewEntryForm>(EMPTY_FORM);

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

  const totalDebit = filtered.reduce((s, r) => s + r.debit, 0);
  const totalCredit = filtered.reduce((s, r) => s + r.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id));

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    exportToCsv(
      "trial-balance",
      cols,
      filtered as unknown as Record<string, unknown>[],
    );
    toast.success("Trial Balance exported");
  }

  function handleBulkExport() {
    exportToCsv(
      "trial-balance-selected",
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

  function handleNewEntrySubmit() {
    if (!newForm.code || !newForm.account || !newForm.accountType) {
      toast.error("Please fill in all required fields");
      return;
    }
    const debit = Number.parseFloat(newForm.debit) || 0;
    const credit = Number.parseFloat(newForm.credit) || 0;
    const balance = debit - credit;
    const newRow: TrialRow = {
      id: String(Date.now()),
      code: newForm.code,
      account: newForm.account,
      accountType: newForm.accountType,
      debit,
      credit,
      balance,
    };
    setData((prev) => [...prev, newRow]);
    setNewForm(EMPTY_FORM);
    setShowNewEntry(false);
    toast.success("Trial balance entry added");
  }

  return (
    <ModulePageLayout
      title="Trial Balance"
      moduleName="trial-balance"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            data-ocid="tb-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColumnPicker(true)}
            data-ocid="tb-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewForm(EMPTY_FORM);
              setShowNewEntry(true);
            }}
            data-ocid="tb-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Entry
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Debit and credit totals for all accounts
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Debit",
            value: fmt(totalDebit),
            color: "text-destructive",
          },
          {
            label: "Total Credit",
            value: fmt(totalCredit),
            color: "text-accent",
          },
          {
            label: "Difference",
            value: fmt(difference),
            color: difference < 0.01 ? "text-accent" : "text-destructive",
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
              className={`text-xl font-display font-semibold mt-1 ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search by account code or name…"
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
              {[
                "Code",
                "Account Name",
                "Type",
                "Debit",
                "Credit",
                "Balance",
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
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Scale className="size-8 text-muted-foreground" />
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
                    data-ocid={`tb-row-${row.id}`}
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
                        className={`text-xs ${TYPE_COLOR[row.accountType] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {row.accountType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {row.debit > 0 ? fmt(row.debit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {row.credit > 0 ? fmt(row.credit) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-semibold ${row.balance < 0 ? "text-destructive" : "text-foreground"}`}
                    >
                      {fmt(row.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Edit ${row.account}`)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit"
                          data-ocid={`tb-edit-${row.id}`}
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
                          data-ocid={`tb-delete-${row.id}`}
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
                  colSpan={4}
                  className="px-4 py-3 text-right text-sm text-muted-foreground"
                >
                  Total ({filtered.length} accounts)
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {fmt(totalDebit)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {fmt(totalCredit)}
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
        title="Import Trial Balance"
        onImport={async () => {
          toast.success("Trial balance data imported");
        }}
      />

      {/* New Trial Balance Entry Dialog */}
      <Dialog
        open={showNewEntry}
        onOpenChange={(v) => {
          setShowNewEntry(v);
          if (!v) setNewForm(EMPTY_FORM);
        }}
      >
        <DialogContent className="max-w-md" data-ocid="tb-new-entry-dialog">
          <DialogHeader>
            <DialogTitle>New Trial Balance Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tb-code">Account Code *</Label>
                <Input
                  id="tb-code"
                  placeholder="e.g. 1001"
                  value={newForm.code}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, code: e.target.value }))
                  }
                  data-ocid="tb-entry-code"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tb-account-type">Account Type *</Label>
                <Select
                  value={newForm.accountType}
                  onValueChange={(v) =>
                    setNewForm((f) => ({ ...f, accountType: v }))
                  }
                >
                  <SelectTrigger id="tb-account-type" data-ocid="tb-entry-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tb-account">Account Name *</Label>
              <Input
                id="tb-account"
                placeholder="e.g. Cash & Bank"
                value={newForm.account}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, account: e.target.value }))
                }
                data-ocid="tb-entry-account"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tb-debit">Debit (₹)</Label>
                <Input
                  id="tb-debit"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newForm.debit}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, debit: e.target.value }))
                  }
                  data-ocid="tb-entry-debit"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tb-credit">Credit (₹)</Label>
                <Input
                  id="tb-credit"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newForm.credit}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, credit: e.target.value }))
                  }
                  data-ocid="tb-entry-credit"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewEntry(false)}
              data-ocid="tb-entry-cancel"
            >
              Cancel
            </Button>
            <Button onClick={handleNewEntrySubmit} data-ocid="tb-entry-submit">
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePageLayout>
  );
}
