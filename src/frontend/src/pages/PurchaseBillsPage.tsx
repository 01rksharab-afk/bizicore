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

type BillStatus = "draft" | "pending" | "paid" | "overdue";
interface Bill extends Record<string, unknown> {
  id: string;
  billNumber: string;
  supplier: string;
  date: string;
  poNumber: string;
  amount: number;
  tax: number;
  total: number;
  status: BillStatus;
}

const STATUS_COLORS: Record<BillStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-primary/10 text-primary",
  paid: "bg-accent/10 text-accent",
  overdue: "bg-destructive/10 text-destructive",
};

const DEMO_BILLS: Bill[] = [
  {
    id: "b1",
    billNumber: "BILL-2024-001",
    supplier: "Tata Steel Ltd",
    date: "2024-04-02",
    poNumber: "PO-2024-001",
    amount: 85000,
    tax: 15300,
    total: 100300,
    status: "paid",
  },
  {
    id: "b2",
    billNumber: "BILL-2024-002",
    supplier: "Reliance Industries",
    date: "2024-04-10",
    poNumber: "PO-2024-003",
    amount: 42000,
    tax: 7560,
    total: 49560,
    status: "pending",
  },
  {
    id: "b3",
    billNumber: "BILL-2024-003",
    supplier: "Infosys Supplies",
    date: "2024-03-28",
    poNumber: "PO-2024-002",
    amount: 18500,
    tax: 3330,
    total: 21830,
    status: "overdue",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "billNumber", label: "Bill #" },
  { key: "supplier", label: "Supplier" },
  { key: "date", label: "Date" },
  { key: "poNumber", label: "PO #" },
  { key: "amount", label: "Amount" },
  { key: "tax", label: "Tax" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
];
const FILTERS: FilterConfig[] = [
  {
    label: "Status",
    key: "status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
      { value: "overdue", label: "Overdue" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

interface BillForm {
  supplier: string;
  date: string;
  poNumber: string;
  amount: string;
  tax: string;
}

export default function PurchaseBillsPage() {
  const [bills, setBills] = useState<Bill[]>(DEMO_BILLS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Bill | null>(null);
  const [form, setForm] = useState<BillForm>({
    supplier: "",
    date: new Date().toISOString().slice(0, 10),
    poNumber: "",
    amount: "",
    tax: "",
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
      bills.filter((r) => {
        const q = search.toLowerCase();
        if (
          q &&
          !r.supplier.toLowerCase().includes(q) &&
          !r.billNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [bills, search, filters],
  );

  const tableColumns: TableColumn<Bill>[] = [
    {
      key: "billNumber",
      label: "Bill #",
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
      key: "poNumber",
      label: "PO #",
      render: (v) => <span className="font-mono text-xs">{String(v)}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => <span className="font-mono">{fmt(Number(v))}</span>,
    },
    {
      key: "tax",
      label: "Tax",
      render: (v) => <span className="font-mono">{fmt(Number(v))}</span>,
    },
    {
      key: "total",
      label: "Total",
      render: (v) => (
        <span className="font-mono font-semibold">{fmt(Number(v))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge
          className={`${STATUS_COLORS[v as BillStatus]} border-0 text-xs capitalize`}
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
      poNumber: "",
      amount: "",
      tax: "",
    });
    setDialogOpen(true);
  }
  function openEdit(row: Bill) {
    setEditItem(row);
    setForm({
      supplier: row.supplier,
      date: row.date,
      poNumber: row.poNumber,
      amount: String(row.amount),
      tax: String(row.tax),
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.supplier.trim()) {
      toast.error("Supplier is required");
      return;
    }
    const amt = Number(form.amount);
    const tax = Number(form.tax);
    if (editItem) {
      setBills((p) =>
        p.map((b) =>
          b.id === editItem.id
            ? {
                ...b,
                supplier: form.supplier,
                date: form.date,
                poNumber: form.poNumber,
                amount: amt,
                tax,
                total: amt + tax,
              }
            : b,
        ),
      );
      toast.success("Bill updated");
    } else {
      const nb: Bill = {
        id: crypto.randomUUID(),
        billNumber: `BILL-${Date.now().toString().slice(-6)}`,
        supplier: form.supplier,
        date: form.date,
        poNumber: form.poNumber,
        amount: amt,
        tax,
        total: amt + tax,
        status: "draft",
      };
      setBills((p) => [nb, ...p]);
      toast.success("Bill created");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: Bill) {
    setBills((p) => p.filter((b) => b.id !== row.id));
    toast.success("Bill deleted");
  }
  function handleBulkDelete() {
    setBills((p) => p.filter((b) => !selectedIds.includes(b.id)));
    toast.success(`Deleted ${selectedIds.length} bill(s)`);
    setSelectedIds([]);
  }
  function handleExport() {
    exportToCsv(
      "purchase-bills",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "purchase-bills",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Purchase Bills"
      moduleName="purchase-bills"
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
          <Button size="sm" onClick={openNew} data-ocid="new-bill-btn">
            <PlusCircle className="size-3.5 mr-1.5" /> New Bill
          </Button>
        </div>
      }
    >
      <Breadcrumb
        items={[
          { label: "Purchases", href: "/purchases/bills" },
          { label: "Bills" },
        ]}
      />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search supplier or bill #…"
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
        emptyMessage="No bills yet."
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
            <DialogTitle>{editItem ? "Edit Bill" : "New Bill"}</DialogTitle>
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
                  placeholder="Supplier name"
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
                <Label>Linked PO #</Label>
                <Input
                  value={form.poNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, poNumber: e.target.value }))
                  }
                  placeholder="PO-2024-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tax (₹)</Label>
                <Input
                  type="number"
                  value={form.tax}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tax: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="bill-save-btn">
              {editItem ? "Update" : "Create"}
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
        title="Import Bills"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
