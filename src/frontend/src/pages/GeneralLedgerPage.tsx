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
import { Download, FileText, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerRow extends Record<string, unknown> {
  id: string;
  date: string;
  account: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SEED: LedgerRow[] = [
  {
    id: "1",
    date: "2026-04-01",
    account: "Cash & Bank",
    description: "Opening balance",
    reference: "OB-2026-001",
    debit: 500000,
    credit: 0,
    balance: 500000,
  },
  {
    id: "2",
    date: "2026-04-02",
    account: "Accounts Receivable",
    description: "Invoice INV-0042 — Tata Steel",
    reference: "INV-0042",
    debit: 285000,
    credit: 0,
    balance: 785000,
  },
  {
    id: "3",
    date: "2026-04-03",
    account: "Sales Revenue",
    description: "Revenue from product sale",
    reference: "INV-0042",
    debit: 0,
    credit: 285000,
    balance: 500000,
  },
  {
    id: "4",
    date: "2026-04-04",
    account: "Accounts Payable",
    description: "Bill from Steel Authority of India",
    reference: "BILL-0018",
    debit: 0,
    credit: 184000,
    balance: 316000,
  },
  {
    id: "5",
    date: "2026-04-05",
    account: "Raw Materials",
    description: "Stock received — Steel sheets 50MT",
    reference: "PO-0054",
    debit: 184000,
    credit: 0,
    balance: 500000,
  },
  {
    id: "6",
    date: "2026-04-06",
    account: "Cash & Bank",
    description: "Payment received from Reliance Industries",
    reference: "RCP-0031",
    debit: 210000,
    credit: 0,
    balance: 710000,
  },
  {
    id: "7",
    date: "2026-04-07",
    account: "Salaries & Wages",
    description: "Payroll — March 2026",
    reference: "PAY-MAR26",
    debit: 0,
    credit: 125000,
    balance: 585000,
  },
  {
    id: "8",
    date: "2026-04-08",
    account: "GST Payable",
    description: "GST collected on invoices",
    reference: "GST-Q1",
    debit: 0,
    credit: 51300,
    balance: 533700,
  },
  {
    id: "9",
    date: "2026-04-08",
    account: "Office Expenses",
    description: "Stationery and office supplies",
    reference: "EXP-0012",
    debit: 8500,
    credit: 0,
    balance: 542200,
  },
  {
    id: "10",
    date: "2026-04-09",
    account: "Accounts Receivable",
    description: "Invoice INV-0043 — L&T Construction",
    reference: "INV-0043",
    debit: 162000,
    credit: 0,
    balance: 704200,
  },
];

const ACCOUNT_OPTIONS = [...new Set(SEED.map((r) => r.account))].map((a) => ({
  value: a,
  label: a,
}));

const ACCOUNT_NAMES = [...new Set(SEED.map((r) => r.account))];

const ALL_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "account", label: "Account" },
  { key: "description", label: "Description" },
  { key: "reference", label: "Reference" },
  { key: "debit", label: "Debit" },
  { key: "credit", label: "Credit" },
  { key: "balance", label: "Balance" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface NewEntryForm {
  date: string;
  account: string;
  description: string;
  debit: string;
  credit: string;
}

const EMPTY_FORM: NewEntryForm = {
  date: new Date().toISOString().slice(0, 10),
  account: "",
  description: "",
  debit: "",
  credit: "",
};

export default function GeneralLedgerPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [data, setData] = useState<LedgerRow[]>(SEED);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newForm, setNewForm] = useState<NewEntryForm>(EMPTY_FORM);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.account.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.reference.toLowerCase().includes(q);
      const matchAccount = !filters.account || row.account === filters.account;
      const matchFrom = !filters.dateFrom || row.date >= filters.dateFrom;
      const matchTo = !filters.dateTo || row.date <= filters.dateTo;
      return matchSearch && matchAccount && matchFrom && matchTo;
    });
  }, [data, search, filters]);

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id));

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    exportToCsv(
      "general-ledger",
      cols,
      filtered as unknown as Record<string, unknown>[],
    );
    toast.success("General Ledger exported");
  }

  function handleBulkExport() {
    exportToCsv(
      "general-ledger-selected",
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

  function handleDelete(row: LedgerRow) {
    setData((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("Entry deleted");
  }

  function handleEdit(row: LedgerRow) {
    toast.info(`Edit entry: ${row.reference}`);
  }

  function handleNewEntrySubmit() {
    const debit = Number.parseFloat(newForm.debit) || 0;
    const credit = Number.parseFloat(newForm.credit) || 0;
    if (!newForm.account || !newForm.description || !newForm.date) {
      toast.error("Please fill in all required fields");
      return;
    }
    const lastBalance = data.length > 0 ? data[data.length - 1].balance : 0;
    const balance = lastBalance + debit - credit;
    const nextId = String(Date.now());
    const reference = `JV-${nextId.slice(-6)}`;
    const newRow: LedgerRow = {
      id: nextId,
      date: newForm.date,
      account: newForm.account,
      description: newForm.description,
      reference,
      debit,
      credit,
      balance,
    };
    setData((prev) => [...prev, newRow]);
    setNewForm(EMPTY_FORM);
    setShowNewEntry(false);
    toast.success("Ledger entry added");
  }

  return (
    <ModulePageLayout
      title="General Ledger"
      moduleName="general-ledger"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            data-ocid="gl-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColumnPicker(true)}
            data-ocid="gl-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewForm(EMPTY_FORM);
              setShowNewEntry(true);
            }}
            data-ocid="gl-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Entry
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        All ledger postings with running balance
      </p>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search by account, description, reference…"
        filters={[
          { key: "account", label: "Account", options: ACCOUNT_OPTIONS },
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
                "Account",
                "Description",
                "Reference",
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
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">
                      No entries found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Adjust the filters or search to see postings.
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
                    data-ocid={`gl-row-${row.id}`}
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
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">
                      {row.account}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {row.description}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        {row.reference}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {row.debit > 0 ? fmt(row.debit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {row.credit > 0 ? fmt(row.credit) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-semibold ${row.balance < 0 ? "text-destructive" : "text-accent"}`}
                    >
                      {fmt(row.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit"
                          data-ocid={`gl-edit-${row.id}`}
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
                          onClick={() => handleDelete(row)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Delete"
                          data-ocid={`gl-delete-${row.id}`}
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
                  Totals ({filtered.length} entries)
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {fmt(filtered.reduce((s, r) => s + r.debit, 0))}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {fmt(filtered.reduce((s, r) => s + r.credit, 0))}
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
        title="Import General Ledger"
        onImport={async () => {
          toast.success("Ledger data imported");
        }}
      />

      {/* New Ledger Entry Dialog */}
      <Dialog
        open={showNewEntry}
        onOpenChange={(v) => {
          setShowNewEntry(v);
          if (!v) setNewForm(EMPTY_FORM);
        }}
      >
        <DialogContent className="max-w-md" data-ocid="gl-new-entry-dialog">
          <DialogHeader>
            <DialogTitle>New Ledger Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gl-date">Date *</Label>
                <Input
                  id="gl-date"
                  type="date"
                  value={newForm.date}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="gl-entry-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gl-account">Account *</Label>
                <Select
                  value={newForm.account}
                  onValueChange={(v) =>
                    setNewForm((f) => ({ ...f, account: v }))
                  }
                >
                  <SelectTrigger id="gl-account" data-ocid="gl-entry-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_NAMES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gl-description">Description *</Label>
              <Input
                id="gl-description"
                placeholder="Entry description"
                value={newForm.description}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, description: e.target.value }))
                }
                data-ocid="gl-entry-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gl-debit">Debit (₹)</Label>
                <Input
                  id="gl-debit"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newForm.debit}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, debit: e.target.value }))
                  }
                  data-ocid="gl-entry-debit"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gl-credit">Credit (₹)</Label>
                <Input
                  id="gl-credit"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newForm.credit}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, credit: e.target.value }))
                  }
                  data-ocid="gl-entry-credit"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewEntry(false)}
              data-ocid="gl-entry-cancel"
            >
              Cancel
            </Button>
            <Button onClick={handleNewEntrySubmit} data-ocid="gl-entry-submit">
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePageLayout>
  );
}
