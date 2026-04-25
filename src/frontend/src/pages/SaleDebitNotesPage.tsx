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

type DNStatus = "draft" | "approved" | "applied" | "cancelled";
interface SaleDebitNote extends Record<string, unknown> {
  id: string;
  dnNumber: string;
  customer: string;
  date: string;
  invoiceNumber: string;
  amount: number;
  reason: string;
  status: DNStatus;
}

const STATUS_COLORS: Record<DNStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  applied: "bg-accent/10 text-accent",
  cancelled: "bg-destructive/10 text-destructive",
};

const DEMO_DATA: SaleDebitNote[] = [
  {
    id: "sdn1",
    dnNumber: "SDN-2024-001",
    customer: "Bajaj Auto",
    date: "2024-04-07",
    invoiceNumber: "INV-2024-002",
    amount: 6000,
    reason: "Additional charges — expedited shipping",
    status: "approved",
  },
  {
    id: "sdn2",
    dnNumber: "SDN-2024-002",
    customer: "Hero MotoCorp",
    date: "2024-04-14",
    invoiceNumber: "INV-2024-005",
    amount: 4200,
    reason: "Price revision — material cost increase",
    status: "draft",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "dnNumber", label: "DN #" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "invoiceNumber", label: "Invoice #" },
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
      { value: "applied", label: "Applied" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

interface DNForm {
  customer: string;
  date: string;
  invoiceNumber: string;
  amount: string;
  reason: string;
}

export default function SaleDebitNotesPage() {
  const [data, setData] = useState<SaleDebitNote[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SaleDebitNote | null>(null);
  const [form, setForm] = useState<DNForm>({
    customer: "",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
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
          !r.dnNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [data, search, filters],
  );

  const tableColumns: TableColumn<SaleDebitNote>[] = [
    {
      key: "dnNumber",
      label: "DN #",
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
      key: "amount",
      label: "Amount",
      render: (v) => <span className="font-mono">{fmt(Number(v))}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (v) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
          {String(v)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge
          className={`${STATUS_COLORS[v as DNStatus]} border-0 text-xs capitalize`}
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
      amount: "",
      reason: "",
    });
    setDialogOpen(true);
  }
  function openEdit(row: SaleDebitNote) {
    setEditItem(row);
    setForm({
      customer: row.customer,
      date: row.date,
      invoiceNumber: row.invoiceNumber,
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
            ? { ...n, ...form, amount: Number(form.amount) }
            : n,
        ),
      );
      toast.success("Debit note updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          dnNumber: `SDN-${Date.now().toString().slice(-6)}`,
          customer: form.customer,
          date: form.date,
          invoiceNumber: form.invoiceNumber,
          amount: Number(form.amount),
          reason: form.reason,
          status: "draft",
        },
        ...p,
      ]);
      toast.success("Debit note created");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: SaleDebitNote) {
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
      "sale-debit-notes",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "sale-debit-notes",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Sale Debit Notes"
      moduleName="sale-debit-notes"
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
            <PlusCircle className="size-3.5 mr-1.5" /> New Debit Note
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "Debit Notes" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search customer or DN #…"
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
        emptyMessage="No sale debit notes yet."
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
              {editItem ? "Edit Debit Note" : "New Debit Note"}
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
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input
                value={form.reason}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="Reason for debit note"
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
        title="Import Debit Notes"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
