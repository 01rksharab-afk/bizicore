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

type CNStatus = "draft" | "approved" | "applied" | "cancelled";
interface SaleCreditNote extends Record<string, unknown> {
  id: string;
  cnNumber: string;
  customer: string;
  date: string;
  invoiceNumber: string;
  amount: number;
  reason: string;
  status: CNStatus;
}

const STATUS_COLORS: Record<CNStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  applied: "bg-accent/10 text-accent",
  cancelled: "bg-destructive/10 text-destructive",
};

const DEMO_DATA: SaleCreditNote[] = [
  {
    id: "scn1",
    cnNumber: "SCN-2024-001",
    customer: "Reliance Industries",
    date: "2024-04-06",
    invoiceNumber: "INV-2024-001",
    amount: 15000,
    reason: "Overpayment by customer",
    status: "approved",
  },
  {
    id: "scn2",
    cnNumber: "SCN-2024-002",
    customer: "Tata Steel",
    date: "2024-04-12",
    invoiceNumber: "INV-2024-003",
    amount: 8500,
    reason: "Goods returned — wrong item sent",
    status: "draft",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "cnNumber", label: "CN #" },
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

interface CNForm {
  customer: string;
  date: string;
  invoiceNumber: string;
  amount: string;
  reason: string;
}

export default function SaleCreditNotesPage() {
  const [data, setData] = useState<SaleCreditNote[]>(DEMO_DATA);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SaleCreditNote | null>(null);
  const [form, setForm] = useState<CNForm>({
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
          !r.cnNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [data, search, filters],
  );

  const tableColumns: TableColumn<SaleCreditNote>[] = [
    {
      key: "cnNumber",
      label: "CN #",
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
          className={`${STATUS_COLORS[v as CNStatus]} border-0 text-xs capitalize`}
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
  function openEdit(row: SaleCreditNote) {
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
      toast.success("Credit note updated");
    } else {
      setData((p) => [
        {
          id: crypto.randomUUID(),
          cnNumber: `SCN-${Date.now().toString().slice(-6)}`,
          customer: form.customer,
          date: form.date,
          invoiceNumber: form.invoiceNumber,
          amount: Number(form.amount),
          reason: form.reason,
          status: "draft",
        },
        ...p,
      ]);
      toast.success("Credit note created");
    }
    setDialogOpen(false);
  }

  function handleDelete(row: SaleCreditNote) {
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
      "sale-credit-notes",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  function handleBulkExport() {
    exportToCsv(
      "sale-credit-notes",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered.filter((r) => selectedIds.includes(r.id)),
    );
  }

  return (
    <ModulePageLayout
      title="Sale Credit Notes"
      moduleName="sale-credit-notes"
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
            <PlusCircle className="size-3.5 mr-1.5" /> New Credit Note
          </Button>
        </div>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "Credit Notes" }]} />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search customer or CN #…"
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
        emptyMessage="No sale credit notes yet."
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
              {editItem ? "Edit Credit Note" : "New Credit Note"}
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
                placeholder="Reason for credit note"
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
        title="Import Credit Notes"
        onImport={async (f) => {
          toast.success(`Imported ${f.name}`);
        }}
      />
    </ModulePageLayout>
  );
}
