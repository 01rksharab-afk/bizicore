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

type ReceiptStatus =
  | "pending"
  | "received"
  | "partially_received"
  | "cancelled";
type ReceiptMode = "cash" | "card" | "upi" | "neft" | "rtgs" | "bank_transfer";

interface CustomerReceipt extends Record<string, unknown> {
  id: string;
  receiptNumber: string;
  customer: string;
  date: string;
  invoiceNumber: string;
  mode: ReceiptMode;
  amount: number;
  status: ReceiptStatus;
}

const STATUS_COLORS: Record<ReceiptStatus, string> = {
  pending: "bg-primary/10 text-primary",
  received: "bg-accent/10 text-accent",
  partially_received: "bg-muted text-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const DEMO_DATA: CustomerReceipt[] = [
  {
    id: "cr1",
    receiptNumber: "RCP-2024-001",
    customer: "Reliance Industries",
    date: "2024-04-11",
    invoiceNumber: "INV-2024-001",
    mode: "neft",
    amount: 125000,
    status: "received",
  },
  {
    id: "cr2",
    receiptNumber: "RCP-2024-002",
    customer: "Tata Steel",
    date: "2024-04-15",
    invoiceNumber: "INV-2024-002",
    mode: "rtgs",
    amount: 84000,
    status: "received",
  },
  {
    id: "cr3",
    receiptNumber: "RCP-2024-003",
    customer: "Infosys Limited",
    date: "2024-04-18",
    invoiceNumber: "INV-2024-003",
    mode: "upi",
    amount: 22500,
    status: "partially_received",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "receiptNumber", label: "Receipt #" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "mode", label: "Mode" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];
const FILTERS: FilterConfig[] = [
  {
    label: "Status",
    key: "status",
    options: [
      { value: "pending", label: "Pending" },
      { value: "received", label: "Received" },
      { value: "partially_received", label: "Partial" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    label: "Mode",
    key: "mode",
    options: [
      { value: "cash", label: "Cash" },
      { value: "card", label: "Card" },
      { value: "upi", label: "UPI" },
      { value: "neft", label: "NEFT" },
      { value: "rtgs", label: "RTGS" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

interface RcpForm {
  customer: string;
  date: string;
  invoiceNumber: string;
  mode: string;
  amount: string;
}

export default function CustomerReceiptsPage() {
  const [data, setData] = useState<CustomerReceipt[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CustomerReceipt | null>(null);
  const [form, setForm] = useState<RcpForm>({
    customer: "",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    mode: "neft",
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
          !r.receiptNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.mode && r.mode !== filters.mode) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [data, search, filters],
  );

  const tableColumns: TableColumn<CustomerReceipt>[] = [
    {
      key: "receiptNumber",
      label: "Receipt #",
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
      key: "invoiceNumber",
      label: "Invoice #",
      render: (v) => <span className="font-mono text-xs">{String(v)}</span>,
    },
    {
      key: "mode",
      label: "Mode",
      render: (v) => (
        <span className="uppercase text-xs font-medium">
          {String(v).replace("_", " ")}
        </span>
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
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge
          className={`${STATUS_COLORS[v as ReceiptStatus]} border-0 text-xs`}
        >
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
      invoiceNumber: "",
      mode: "neft",
      amount: "",
    });
    setDialogOpen(true);
  }
  function openEdit(row: CustomerReceipt) {
    setEditItem(row);
    setForm({
      customer: row.customer,
      date: row.date,
      invoiceNumber: row.invoiceNumber,
      mode: row.mode,
      amount: String(row.amount),
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.customer.trim()) {
      toast.error("Customer is required");
      return;
    }
    if (editItem) {
      setData((p) =>
        p.map((n) =>
          n.id === editItem.id
            ? {
                ...n,
                customer: form.customer,
                date: form.date,
                invoiceNumber: form.invoiceNumber,
                mode: form.mode as ReceiptMode,
                amount: Number(form.amount),
              }
            : n,
        ),
      );
      toast.success("Receipt updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
          customer: form.customer,
          date: form.date,
          invoiceNumber: form.invoiceNumber,
          mode: form.mode as ReceiptMode,
          amount: Number(form.amount),
          status: "pending",
        },
        ...p,
      ]);
      toast.success("Receipt recorded");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: CustomerReceipt) {
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
      "customer-receipts",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "customer-receipts",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Customer Receipts"
      moduleName="customer-receipts"
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
            <PlusCircle className="size-3.5 mr-1.5" /> New Receipt
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "Receipts" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search customer or receipt #…"
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
        emptyMessage="No customer receipts yet."
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Receipt" : "New Receipt"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer *</Label>
                <Input
                  value={form.customer}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customer: e.target.value }))
                  }
                />
              </div>
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
                <Label>Linked Invoice #</Label>
                <Input
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, invoiceNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <select
                  value={form.mode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, mode: e.target.value }))
                  }
                  className="h-9 w-full px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
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
              {editItem ? "Update" : "Record Receipt"}
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
        title="Import Receipts"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
