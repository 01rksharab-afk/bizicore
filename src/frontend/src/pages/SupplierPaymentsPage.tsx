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

type PayStatus = "pending" | "processed" | "failed" | "cancelled";
type PayMode = "bank_transfer" | "cheque" | "upi" | "neft" | "rtgs";

interface SupplierPayment extends Record<string, unknown> {
  id: string;
  paymentNumber: string;
  supplier: string;
  date: string;
  billNumber: string;
  mode: PayMode;
  amount: number;
  status: PayStatus;
}

const STATUS_COLORS: Record<PayStatus, string> = {
  pending: "bg-primary/10 text-primary",
  processed: "bg-accent/10 text-accent",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const DEMO_DATA: SupplierPayment[] = [
  {
    id: "sp1",
    paymentNumber: "PAY-2024-001",
    supplier: "Tata Steel Ltd",
    date: "2024-04-10",
    billNumber: "BILL-2024-001",
    mode: "neft",
    amount: 100300,
    status: "processed",
  },
  {
    id: "sp2",
    paymentNumber: "PAY-2024-002",
    supplier: "Reliance Industries",
    date: "2024-04-15",
    billNumber: "BILL-2024-002",
    mode: "rtgs",
    amount: 49560,
    status: "pending",
  },
  {
    id: "sp3",
    paymentNumber: "PAY-2024-003",
    supplier: "Infosys Supplies",
    date: "2024-04-18",
    billNumber: "BILL-2024-003",
    mode: "bank_transfer",
    amount: 21830,
    status: "pending",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "paymentNumber", label: "Payment #" },
  { key: "supplier", label: "Supplier" },
  { key: "date", label: "Date" },
  { key: "billNumber", label: "Bill #" },
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
      { value: "processed", label: "Processed" },
      { value: "failed", label: "Failed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    label: "Mode",
    key: "mode",
    options: [
      { value: "neft", label: "NEFT" },
      { value: "rtgs", label: "RTGS" },
      { value: "bank_transfer", label: "Bank Transfer" },
      { value: "cheque", label: "Cheque" },
      { value: "upi", label: "UPI" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

interface PayForm {
  supplier: string;
  date: string;
  billNumber: string;
  mode: string;
  amount: string;
}

export default function SupplierPaymentsPage() {
  const [data, setData] = useState<SupplierPayment[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SupplierPayment | null>(null);
  const [form, setForm] = useState<PayForm>({
    supplier: "",
    date: new Date().toISOString().slice(0, 10),
    billNumber: "",
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
          !r.supplier.toLowerCase().includes(q) &&
          !r.paymentNumber.toLowerCase().includes(q)
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

  const tableColumns: TableColumn<SupplierPayment>[] = [
    {
      key: "paymentNumber",
      label: "Payment #",
      render: (v) => (
        <span className="font-mono text-xs text-primary">{String(v)}</span>
      ),
    },
    { key: "supplier", label: "Supplier" },
    {
      key: "date",
      label: "Date",
      render: (v) => (
        <span className="text-xs text-muted-foreground">{String(v)}</span>
      ),
    },
    {
      key: "billNumber",
      label: "Bill #",
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
          className={`${STATUS_COLORS[v as PayStatus]} border-0 text-xs capitalize`}
        >
          {String(v)}
        </Badge>
      ),
    },
  ].filter((c) => selectedCols.includes(c.key));

  function openNew() {
    setEditItem(null);
    setForm({
      supplier: "",
      date: new Date().toISOString().slice(0, 10),
      billNumber: "",
      mode: "neft",
      amount: "",
    });
    setDialogOpen(true);
  }
  function openEdit(row: SupplierPayment) {
    setEditItem(row);
    setForm({
      supplier: row.supplier,
      date: row.date,
      billNumber: row.billNumber,
      mode: row.mode,
      amount: String(row.amount),
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.supplier.trim()) {
      toast.error("Supplier is required");
      return;
    }
    if (editItem) {
      setData((p) =>
        p.map((n) =>
          n.id === editItem.id
            ? {
                ...n,
                supplier: form.supplier,
                date: form.date,
                billNumber: form.billNumber,
                mode: form.mode as PayMode,
                amount: Number(form.amount),
              }
            : n,
        ),
      );
      toast.success("Payment updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
          supplier: form.supplier,
          date: form.date,
          billNumber: form.billNumber,
          mode: form.mode as PayMode,
          amount: Number(form.amount),
          status: "pending",
        },
        ...p,
      ]);
      toast.success("Payment recorded");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: SupplierPayment) {
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
      "supplier-payments",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "supplier-payments",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Supplier Payments"
      moduleName="supplier-payments"
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
            <PlusCircle className="size-3.5 mr-1.5" /> New Payment
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Purchases" }, { label: "Payments" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search supplier or payment #…"
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
        emptyMessage="No supplier payments yet."
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
              {editItem ? "Edit Payment" : "New Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier *</Label>
                <Input
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, supplier: e.target.value }))
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
                <Label>Linked Bill #</Label>
                <Input
                  value={form.billNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, billNumber: e.target.value }))
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
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
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
              {editItem ? "Update" : "Record Payment"}
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
        title="Import Payments"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
