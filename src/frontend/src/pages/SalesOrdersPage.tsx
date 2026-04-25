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
import { Textarea } from "@/components/ui/textarea";
import { exportToCsv } from "@/utils/exportToCsv";
import { Download, PlusCircle, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SOStatus = "draft" | "confirmed" | "invoiced" | "cancelled";

interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
}
interface SalesOrder extends Record<string, unknown> {
  id: string;
  soNumber: string;
  customer: string;
  date: string;
  items: number;
  amount: number;
  tax: number;
  total: number;
  status: SOStatus;
  notes: string;
}

const STATUS_COLORS: Record<SOStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary",
  invoiced: "bg-accent/10 text-accent",
  cancelled: "bg-destructive/10 text-destructive",
};

const DEMO_DATA: SalesOrder[] = [
  {
    id: "so1",
    soNumber: "SO-2024-001",
    customer: "Reliance Industries Ltd",
    date: "2024-04-01",
    items: 2,
    amount: 106000,
    tax: 19080,
    total: 125000,
    status: "confirmed",
    notes: "Urgent delivery",
  },
  {
    id: "so2",
    soNumber: "SO-2024-002",
    customer: "Tata Steel",
    date: "2024-04-05",
    items: 1,
    amount: 71186,
    tax: 12814,
    total: 84000,
    status: "invoiced",
    notes: "",
  },
  {
    id: "so3",
    soNumber: "SO-2024-003",
    customer: "Infosys Limited",
    date: "2024-04-08",
    items: 3,
    amount: 40179,
    tax: 4821,
    total: 45000,
    status: "draft",
    notes: "Awaiting approval",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "soNumber", label: "SO #" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "items", label: "Items" },
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
      { value: "confirmed", label: "Confirmed" },
      { value: "invoiced", label: "Invoiced" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

function emptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    qty: 1,
    rate: 0,
    taxPct: 18,
  };
}
function calcTotals(lines: LineItem[]) {
  const amount = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const tax = lines.reduce((s, l) => s + l.qty * l.rate * (l.taxPct / 100), 0);
  return { amount, tax, total: amount + tax };
}

interface SOForm {
  customer: string;
  date: string;
  notes: string;
}

export default function SalesOrdersPage() {
  const [data, setData] = useState<SalesOrder[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SalesOrder | null>(null);
  const [form, setForm] = useState<SOForm>({
    customer: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
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
          !r.soNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [data, search, filters],
  );

  const tableColumns: TableColumn<SalesOrder>[] = [
    {
      key: "soNumber",
      label: "SO #",
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
    { key: "items", label: "Items" },
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
          className={`${STATUS_COLORS[v as SOStatus]} border-0 text-xs capitalize`}
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
      notes: "",
    });
    setLines([emptyLine()]);
    setDialogOpen(true);
  }
  function openEdit(row: SalesOrder) {
    setEditItem(row);
    setForm({ customer: row.customer, date: row.date, notes: row.notes });
    setLines([emptyLine()]);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.customer.trim()) {
      toast.error("Customer is required");
      return;
    }
    const t = calcTotals(lines);
    if (editItem) {
      setData((p) =>
        p.map((n) =>
          n.id === editItem.id
            ? {
                ...n,
                customer: form.customer,
                date: form.date,
                notes: form.notes,
                items: lines.length,
                ...t,
              }
            : n,
        ),
      );
      toast.success("Sales order updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          soNumber: `SO-${Date.now().toString().slice(-6)}`,
          customer: form.customer,
          date: form.date,
          notes: form.notes,
          items: lines.length,
          ...t,
          status: "draft",
        },
        ...p,
      ]);
      toast.success("Sales order created");
    }
    setDialogOpen(false);
  }

  function updateLine(
    idx: number,
    field: keyof LineItem,
    value: string | number,
  ) {
    setLines((p) =>
      p.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  }

  function handleDelete(row: SalesOrder) {
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
      "sales-orders",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "sales-orders",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Sales Orders"
      moduleName="sales-orders"
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
          <Button size="sm" onClick={openNew} data-ocid="new-so-btn">
            <PlusCircle className="size-3.5 mr-1.5" /> New SO
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "Sales Orders" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search customer or SO #…"
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
        emptyMessage="No sales orders yet."
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Sales Order" : "New Sales Order"}
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
                  placeholder="Customer name"
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
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setLines((p) => [...p, emptyLine()])}
                >
                  <PlusCircle className="size-3 mr-1" /> Add Row
                </Button>
              </div>
              <div className="space-y-2">
                {lines.map((l, idx) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <Input
                      className="col-span-5 h-8 text-xs"
                      placeholder="Description"
                      value={l.description}
                      onChange={(e) =>
                        updateLine(idx, "description", e.target.value)
                      }
                    />
                    <Input
                      className="col-span-2 h-8 text-xs"
                      type="number"
                      placeholder="Qty"
                      value={l.qty}
                      onChange={(e) =>
                        updateLine(idx, "qty", Number(e.target.value))
                      }
                    />
                    <Input
                      className="col-span-2 h-8 text-xs"
                      type="number"
                      placeholder="Rate"
                      value={l.rate}
                      onChange={(e) =>
                        updateLine(idx, "rate", Number(e.target.value))
                      }
                    />
                    <Input
                      className="col-span-2 h-8 text-xs"
                      type="number"
                      placeholder="Tax%"
                      value={l.taxPct}
                      onChange={(e) =>
                        updateLine(idx, "taxPct", Number(e.target.value))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="col-span-1 h-8 px-1 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setLines((p) => p.filter((line) => line.id !== l.id))
                      }
                      disabled={lines.length === 1}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-right text-foreground">
                Total: {fmt(calcTotals(lines).total)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="so-save-btn">
              {editItem ? "Update" : "Create Sales Order"}
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
        title="Import Sales Orders"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
