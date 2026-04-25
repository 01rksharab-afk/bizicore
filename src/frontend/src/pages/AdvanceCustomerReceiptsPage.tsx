import { Breadcrumb } from "@/components/Breadcrumb";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import {
  type ColumnConfig,
  ColumnPickerModal,
} from "@/components/ColumnPickerModal";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToCsv } from "@/utils/exportToCsv";
import { Download, PlusCircle, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type AdvStatus = "open" | "partially_adjusted" | "fully_adjusted" | "cancelled";

interface AdvanceReceipt extends Record<string, unknown> {
  id: string;
  advanceNumber: string;
  customer: string;
  date: string;
  amount: number;
  adjustedAmount: number;
  balance: number;
  status: AdvStatus;
}

const STATUS_COLORS: Record<AdvStatus, string> = {
  open: "bg-primary/10 text-primary",
  partially_adjusted: "bg-accent/10 text-accent",
  fully_adjusted: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const DEMO_DATA: AdvanceReceipt[] = [
  {
    id: "adv1",
    advanceNumber: "ADV-RCP-001",
    customer: "Reliance Industries",
    date: "2024-04-02",
    amount: 100000,
    adjustedAmount: 40000,
    balance: 60000,
    status: "partially_adjusted",
  },
  {
    id: "adv2",
    advanceNumber: "ADV-RCP-002",
    customer: "Bajaj Auto",
    date: "2024-04-06",
    amount: 250000,
    adjustedAmount: 0,
    balance: 250000,
    status: "open",
  },
  {
    id: "adv3",
    advanceNumber: "ADV-RCP-003",
    customer: "Hero MotoCorp",
    date: "2024-03-22",
    amount: 75000,
    adjustedAmount: 75000,
    balance: 0,
    status: "fully_adjusted",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "advanceNumber", label: "Advance #" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "adjustedAmount", label: "Adjusted Amount" },
  { key: "balance", label: "Balance" },
  { key: "status", label: "Status" },
];
const FILTERS: FilterConfig[] = [
  {
    label: "Status",
    key: "status",
    options: [
      { value: "open", label: "Open" },
      { value: "partially_adjusted", label: "Partially Adjusted" },
      { value: "fully_adjusted", label: "Fully Adjusted" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

interface AdvForm {
  customer: string;
  date: string;
  amount: string;
}

export default function AdvanceCustomerReceiptsPage() {
  const [data, setData] = useState<AdvanceReceipt[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdvanceReceipt | null>(null);
  const [form, setForm] = useState<AdvForm>({
    customer: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
  });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedCols, setSelectedCols] = useState(
    ALL_COLUMNS.map((c) => c.key),
  );

  const filtered = useMemo(
    () =>
      data.filter((r) => {
        const q = search.toLowerCase();
        if (
          q &&
          !r.customer.toLowerCase().includes(q) &&
          !r.advanceNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [data, search, filters],
  );

  const tableColumns: TableColumn<AdvanceReceipt>[] = [
    {
      key: "advanceNumber",
      label: "Advance #",
      render: (v) => (
        <span className="font-mono text-xs text-primary">{String(v)}</span>
      ),
    },
    { key: "customer", label: "Customer" },
    {
      key: "date",
      label: "Date",
      render: (v) => (
        <span className="text-xs text-muted-foreground">{String(v)}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => (
        <span className="font-mono font-semibold">{fmt(Number(v))}</span>
      ),
    },
    {
      key: "adjustedAmount",
      label: "Adjusted",
      render: (v) => <span className="font-mono">{fmt(Number(v))}</span>,
    },
    {
      key: "balance",
      label: "Balance",
      render: (v) => (
        <span
          className={`font-mono font-semibold ${Number(v) > 0 ? "text-primary" : "text-muted-foreground"}`}
        >
          {fmt(Number(v))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge className={`${STATUS_COLORS[v as AdvStatus]} border-0 text-xs`}>
          {String(v).replace("_", " ")}
        </Badge>
      ),
    },
  ].filter((c) => selectedCols.includes(c.key));

  function openNew() {
    setEditItem(null);
    setForm({
      customer: "",
      date: new Date().toISOString().slice(0, 10),
      amount: "",
    });
    setDialogOpen(true);
  }
  function openEdit(row: AdvanceReceipt) {
    setEditItem(row);
    setForm({
      customer: row.customer,
      date: row.date,
      amount: String(row.amount),
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.customer.trim()) {
      toast.error("Customer is required");
      return;
    }
    const amt = Number(form.amount);
    if (editItem) {
      setData((p) =>
        p.map((n) =>
          n.id === editItem.id
            ? {
                ...n,
                customer: form.customer,
                date: form.date,
                amount: amt,
                balance: amt - n.adjustedAmount,
              }
            : n,
        ),
      );
      toast.success("Advance receipt updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          advanceNumber: `ADV-RCP-${String(p.length + 1).padStart(3, "0")}`,
          customer: form.customer,
          date: form.date,
          amount: amt,
          adjustedAmount: 0,
          balance: amt,
          status: "open",
        },
        ...p,
      ]);
      toast.success("Advance receipt recorded");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: AdvanceReceipt) {
    setData((p) => p.filter((n) => n.id !== row.id));
    toast.success("Deleted");
  }
  function handleBulkDelete() {
    setData((p) => p.filter((n) => !selectedIds.includes(n.id)));
    toast.success(`Deleted ${selectedIds.length} record(s)`);
    setSelectedIds([]);
  }
  function handleExport() {
    exportToCsv(
      "advance-customer-receipts",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "advance-customer-receipts",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Advance Customer Receipts"
      moduleName="advance-customer-receipts"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setColPickerOpen(true)}
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={openNew}>
            <PlusCircle className="size-3.5 mr-1.5" /> New Advance
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "Advance Receipts" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search customer or advance #…"
      />
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
      />
      <DataTable
        columns={tableColumns}
        data={filtered}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        idKey="id"
        emptyMessage="No advance receipts yet."
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditItem(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Advance Receipt" : "New Advance Receipt"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Input
                value={form.customer}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customer: e.target.value }))
                }
                placeholder="Customer name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Advance Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editItem ? "Update" : "Record Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ColumnPickerModal
        isOpen={colPickerOpen}
        onClose={() => setColPickerOpen(false)}
        columns={ALL_COLUMNS}
        selectedColumns={selectedCols}
        onSelectionChange={setSelectedCols}
        onExport={handleExport}
      />
      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Advance Receipts"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
