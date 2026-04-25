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

type AgeBucket =
  | "Current"
  | "1–30 days"
  | "31–60 days"
  | "61–90 days"
  | "90+ days";

interface CreditorRow extends Record<string, unknown> {
  id: string;
  supplier: string;
  gst: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  outstanding: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  ageBucket: AgeBucket;
  email: string;
  status: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SEED: CreditorRow[] = [
  {
    id: "1",
    supplier: "Steel Authority of India",
    gst: "07AABCS1429B1ZS",
    billNo: "BILL-0018",
    billDate: "2026-03-20",
    dueDate: "2026-04-19",
    outstanding: 184000,
    current: 184000,
    days30: 0,
    days60: 0,
    days90: 0,
    ageBucket: "1–30 days",
    email: "accounts@sail.co.in",
    status: "Unpaid",
  },
  {
    id: "2",
    supplier: "Hindustan Zinc Ltd.",
    gst: "08AAACH5762J1ZC",
    billNo: "BILL-0015",
    billDate: "2026-02-15",
    dueDate: "2026-03-17",
    outstanding: 125000,
    current: 0,
    days30: 0,
    days60: 125000,
    days90: 0,
    ageBucket: "31–60 days",
    email: "payable@hzl.co.in",
    status: "Overdue",
  },
  {
    id: "3",
    supplier: "Vedanta Resources",
    gst: "27AAACV3697M1ZD",
    billNo: "BILL-0020",
    billDate: "2026-04-01",
    dueDate: "2026-04-30",
    outstanding: 82000,
    current: 82000,
    days30: 0,
    days60: 0,
    days90: 0,
    ageBucket: "Current",
    email: "finance@vedanta.com",
    status: "Unpaid",
  },
  {
    id: "4",
    supplier: "National Aluminium Co.",
    gst: "21AAACN0083J1ZK",
    billNo: "BILL-0012",
    billDate: "2026-01-05",
    dueDate: "2026-02-04",
    outstanding: 98000,
    current: 0,
    days30: 0,
    days60: 0,
    days90: 98000,
    ageBucket: "90+ days",
    email: "bills@nalco.co.in",
    status: "Overdue",
  },
  {
    id: "5",
    supplier: "ONGC Petro additives",
    gst: "06AAACO0140Q1ZA",
    billNo: "BILL-0019",
    billDate: "2026-03-28",
    dueDate: "2026-04-27",
    outstanding: 68000,
    current: 68000,
    days30: 0,
    days60: 0,
    days90: 0,
    ageBucket: "Current",
    email: "procurement@ongc.co.in",
    status: "Unpaid",
  },
  {
    id: "6",
    supplier: "GAIL Gas Limited",
    gst: "07AABCG0410N1ZW",
    billNo: "BILL-0016",
    billDate: "2026-03-05",
    dueDate: "2026-04-04",
    outstanding: 48000,
    current: 0,
    days30: 48000,
    days60: 0,
    days90: 0,
    ageBucket: "1–30 days",
    email: "accounts@gail.co.in",
    status: "Overdue",
  },
];

const BUCKET_COLOR: Record<AgeBucket, string> = {
  Current: "bg-accent/10 text-accent border-accent/20",
  "1–30 days": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  "31–60 days": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "61–90 days": "bg-destructive/10 text-destructive border-destructive/20",
  "90+ days": "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_OPTIONS = ["Unpaid", "Overdue", "Partial"].map((s) => ({
  value: s,
  label: s,
}));
const AGING_OPTIONS = (
  [
    "Current",
    "1–30 days",
    "31–60 days",
    "61–90 days",
    "90+ days",
  ] as AgeBucket[]
).map((b) => ({ value: b, label: b }));

const ALL_COLUMNS = [
  { key: "supplier", label: "Supplier" },
  { key: "gst", label: "GST No." },
  { key: "billNo", label: "Bill #" },
  { key: "billDate", label: "Bill Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "outstanding", label: "Outstanding" },
  { key: "current", label: "Current" },
  { key: "days30", label: "1–30 Days" },
  { key: "days60", label: "31–60 Days" },
  { key: "days90", label: "61–90 Days" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutstandingCreditorsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [data, setData] = useState<CreditorRow[]>(SEED);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.supplier.toLowerCase().includes(q) ||
        row.billNo.toLowerCase().includes(q) ||
        row.gst.toLowerCase().includes(q);
      const matchStatus = !filters.status || row.status === filters.status;
      const matchAging = !filters.aging || row.ageBucket === filters.aging;
      const matchFrom = !filters.dateFrom || row.billDate >= filters.dateFrom;
      return matchSearch && matchStatus && matchAging && matchFrom;
    });
  }, [data, search, filters]);

  const grandTotal = filtered.reduce((s, r) => s + r.outstanding, 0);
  const buckets: AgeBucket[] = [
    "Current",
    "1–30 days",
    "31–60 days",
    "61–90 days",
    "90+ days",
  ];
  const agingSummary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of buckets) map[b] = 0;
    for (const row of filtered) map[row.ageBucket] += row.outstanding;
    return map;
  }, [filtered]);

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id));

  function handleExport() {
    const cols = ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    exportToCsv(
      "outstanding-creditors",
      cols,
      filtered as unknown as Record<string, unknown>[],
    );
    toast.success("Outstanding Creditors exported");
  }

  function handleBulkExport() {
    exportToCsv(
      "outstanding-creditors-selected",
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
      title="Outstanding Creditors"
      moduleName="outstanding-creditors"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImport(true)}
            data-ocid="oc-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColumnPicker(true)}
            data-ocid="oc-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info("New creditor entry")}
            data-ocid="oc-new-btn"
          >
            <Plus className="size-3.5 mr-1.5" /> New Entry
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Unpaid supplier bills with aging analysis
      </p>

      {/* Aging buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {buckets.map((b) => (
          <div
            key={b}
            className="bg-card border border-border rounded-lg p-3 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{b}</p>
            <p className="text-sm font-semibold font-mono text-foreground">
              {fmt(agingSummary[b])}
            </p>
          </div>
        ))}
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search by supplier name, bill #, or GST…"
        filters={[
          { key: "status", label: "Status", options: STATUS_OPTIONS },
          { key: "aging", label: "Aging", options: AGING_OPTIONS },
          { key: "dateFrom", label: "From Date", options: [] },
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
                "Supplier",
                "Bill #",
                "Due Date",
                "Outstanding",
                "Aging",
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
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      No outstanding creditors
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All supplier bills are fully paid.
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
                    data-ocid={`oc-row-${row.id}`}
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
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {row.supplier}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {row.gst}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.billNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {row.dueDate}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-destructive">
                      {fmt(row.outstanding)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${BUCKET_COLOR[row.ageBucket]}`}
                      >
                        {row.ageBucket}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.status === "Overdue" ? "destructive" : "secondary"
                        }
                        className="text-xs"
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Edit: ${row.billNo}`)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit"
                          data-ocid={`oc-edit-${row.id}`}
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
                          data-ocid={`oc-delete-${row.id}`}
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
              <tr className="border-t-2 border-border bg-destructive/5 font-semibold">
                <td
                  colSpan={4}
                  className="px-4 py-3 text-right text-sm text-muted-foreground"
                >
                  Total Outstanding ({filtered.length} bills)
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-destructive">
                  {fmt(grandTotal)}
                </td>
                <td colSpan={3} />
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
        title="Import Creditors Data"
        onImport={async () => {
          toast.success("Creditor data imported");
        }}
      />
    </ModulePageLayout>
  );
}
