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

type ReturnStatus = "draft" | "approved" | "processed" | "cancelled";
interface SaleReturn extends Record<string, unknown> {
  id: string;
  returnNumber: string;
  customer: string;
  date: string;
  invoiceNumber: string;
  items: number;
  amount: number;
  reason: string;
  status: ReturnStatus;
}

const STATUS_COLORS: Record<ReturnStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  processed: "bg-accent/10 text-accent",
  cancelled: "bg-destructive/10 text-destructive",
};

const DEMO_DATA: SaleReturn[] = [
  {
    id: "sr1",
    returnNumber: "SRN-2024-001",
    customer: "Reliance Industries",
    date: "2024-04-09",
    invoiceNumber: "INV-2024-001",
    items: 5,
    amount: 12500,
    reason: "Defective items in shipment",
    status: "processed",
  },
  {
    id: "sr2",
    returnNumber: "SRN-2024-002",
    customer: "Infosys Limited",
    date: "2024-04-14",
    invoiceNumber: "INV-2024-005",
    items: 2,
    amount: 4800,
    reason: "Incorrect product variant",
    status: "approved",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "returnNumber", label: "Return #" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount" },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
];
const FILTERS: FilterConfig[] = [
  {
    label: "Status",
    key: "status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "approved", label: "Approved" },
      { value: "processed", label: "Processed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

interface RetForm {
  customer: string;
  date: string;
  invoiceNumber: string;
  items: string;
  amount: string;
  reason: string;
}

export default function SaleReturnsPage() {
  const [data, setData] = useState<SaleReturn[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SaleReturn | null>(null);
  const [form, setForm] = useState<RetForm>({
    customer: "",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    items: "",
    amount: "",
    reason: "",
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
          !r.returnNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [data, search, filters],
  );

  const tableColumns: TableColumn<SaleReturn>[] = [
    {
      key: "returnNumber",
      label: "Return #",
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
    { key: "items", label: "Items" },
    {
      key: "amount",
      label: "Amount",
      render: (v) => <span className="font-mono">{fmt(Number(v))}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (v) => (
        <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
          {String(v)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge
          className={`${STATUS_COLORS[v as ReturnStatus]} border-0 text-xs capitalize`}
        >
          {String(v)}
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
      items: "",
      amount: "",
      reason: "",
    });
    setDialogOpen(true);
  }
  function openEdit(row: SaleReturn) {
    setEditItem(row);
    setForm({
      customer: row.customer,
      date: row.date,
      invoiceNumber: row.invoiceNumber,
      items: String(row.items),
      amount: String(row.amount),
      reason: row.reason,
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
                items: Number(form.items),
                amount: Number(form.amount),
                reason: form.reason,
              }
            : n,
        ),
      );
      toast.success("Return updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          returnNumber: `SRN-${Date.now().toString().slice(-6)}`,
          customer: form.customer,
          date: form.date,
          invoiceNumber: form.invoiceNumber,
          items: Number(form.items),
          amount: Number(form.amount),
          reason: form.reason,
          status: "draft",
        },
        ...p,
      ]);
      toast.success("Return created");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: SaleReturn) {
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
      "sale-returns",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "sale-returns",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Sale Returns"
      moduleName="sale-returns"
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
            <PlusCircle className="size-3.5 mr-1.5" /> New Return
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "Returns" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search customer or return #…"
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
        emptyMessage="No sale returns yet."
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
              {editItem ? "Edit Return" : "New Sale Return"}
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
                <Label>No. of Items</Label>
                <Input
                  type="number"
                  value={form.items}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, items: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Return Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input
                value={form.reason}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="Reason for return"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
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
        title="Import Sale Returns"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
