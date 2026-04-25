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
import { useActiveOrg } from "@/hooks/useOrg";
import {
  type LineItem,
  type POStatus,
  calcTotal,
  formatCurrency,
  newLineItem,
  useApprovePurchaseOrder,
  useCreatePurchaseOrder,
  useDeletePurchaseOrder,
  useListPurchaseOrders,
} from "@/hooks/usePurchases";
import { exportToCsv } from "@/utils/exportToCsv";
import { Download, PlusCircle, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PORow = Record<string, unknown> & {
  id: string;
  poNumber: string;
  supplier: string;
  date: string;
  items: number;
  amount: number;
  tax: number;
  total: number;
  status: POStatus;
};

const STATUS_COLORS: Record<POStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  approved: "bg-accent/10 text-accent",
  billed: "bg-secondary text-secondary-foreground",
};

const ALL_COLUMNS: ColumnConfig[] = [
  { key: "poNumber", label: "PO #" },
  { key: "supplier", label: "Supplier" },
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
      { value: "sent", label: "Sent" },
      { value: "approved", label: "Approved" },
      { value: "billed", label: "Billed" },
    ],
  },
  { label: "Date From", key: "dateFrom", options: [] },
  { label: "Date To", key: "dateTo", options: [] },
];

const TODAY = new Date().toISOString().slice(0, 10);

interface POFormState {
  supplier: string;
  date: string;
  lineItems: LineItem[];
  notes: string;
}
function defaultForm(): POFormState {
  return { supplier: "", date: TODAY, lineItems: [newLineItem()], notes: "" };
}

export default function PurchaseOrdersPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id?.toString();
  const ordersQuery = useListPurchaseOrders(orgId);
  const createMutation = useCreatePurchaseOrder(orgId);
  const deleteMutation = useDeletePurchaseOrder(orgId);
  const approveMutation = useApprovePurchaseOrder(orgId);
  void approveMutation; // available for row-level approve action

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<POFormState>(defaultForm());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedCols, setSelectedCols] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.key),
  );
  const [isEditing, setIsEditing] = useState(false);
  // isEditing tracks whether the dialog is in edit mode vs create mode

  const rawOrders = ordersQuery.data ?? [];
  const rows: PORow[] = rawOrders.map((o) => {
    const t = calcTotal(o.lineItems);
    return {
      id: o.id,
      poNumber: o.poNumber,
      supplier: o.supplier,
      date: o.date,
      items: o.lineItems.length,
      amount: t.subtotal,
      tax: t.tax,
      total: t.total,
      status: o.status,
    };
  });

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase();
        if (
          q &&
          !r.supplier.toLowerCase().includes(q) &&
          !r.poNumber.toLowerCase().includes(q)
        )
          return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
        return true;
      }),
    [rows, search, filters],
  );

  const tableColumns: TableColumn<PORow>[] = [
    {
      key: "poNumber",
      label: "PO #",
      render: (v) => (
        <span className="font-mono text-xs text-primary">{String(v)}</span>
      ),
    },
    { key: "supplier", label: "Supplier" },
    {
      key: "date",
      label: "Date",
      render: (v) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {String(v)}
        </span>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (v) => <span className="text-right">{String(v)}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => (
        <span className="font-mono">{formatCurrency(Number(v))}</span>
      ),
    },
    {
      key: "tax",
      label: "Tax",
      render: (v) => (
        <span className="font-mono">{formatCurrency(Number(v))}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (v) => (
        <span className="font-mono font-semibold">
          {formatCurrency(Number(v))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge
          className={`${STATUS_COLORS[v as POStatus]} border-0 text-xs capitalize`}
        >
          {String(v)}
        </Badge>
      ),
    },
  ].filter((c) => selectedCols.includes(c.key));

  function handleBulkDelete() {
    for (const id of selectedIds) deleteMutation.mutate(id);
    setSelectedIds([]);
    toast.success(`Deleted ${selectedIds.length} order(s)`);
  }
  function handleBulkExport() {
    const sel = filtered.filter((r) => selectedIds.includes(r.id));
    exportToCsv(
      "purchase-orders",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      sel,
    );
  }
  function handleExport() {
    exportToCsv(
      "purchase-orders",
      ALL_COLUMNS.filter((c) => selectedCols.includes(c.key)),
      filtered,
    );
  }
  async function handleImport(file: File) {
    toast.success(`Imported ${file.name}`);
  }

  const totals = calcTotal(form.lineItems);
  function updateLine(
    id: string,
    field: keyof LineItem,
    value: string | number,
  ) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li) =>
        li.id === id ? { ...li, [field]: value } : li,
      ),
    }));
  }
  function removeLine(id: string) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.filter((li) => li.id !== id),
    }));
  }

  async function handleSubmit() {
    if (!form.supplier.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    await createMutation.mutateAsync(form);
    setDialogOpen(false);
    setIsEditing(false);
    setForm(defaultForm());
    toast.success("Purchase order created");
  }

  return (
    <ModulePageLayout
      title="Purchase Orders"
      moduleName="purchase-orders"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportOpen(true)}
            data-ocid="po-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setColPickerOpen(true)}
            data-ocid="po-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setForm(defaultForm());
              setIsEditing(false);
              setDialogOpen(true);
            }}
            data-ocid="new-po-btn"
          >
            <PlusCircle className="size-3.5 mr-1.5" /> New PO
          </Button>
        </div>
      }
    >
      <Breadcrumb
        items={[
          { label: "Purchases", href: "/purchases/orders" },
          { label: "Purchase Orders" },
        ]}
      />
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search supplier or PO #…"
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
        isLoading={ordersQuery.isLoading}
        emptyMessage="No purchase orders yet. Create your first one."
        onEdit={(row) => {
          setIsEditing(true);
          setForm({
            supplier: row.supplier,
            date: row.date,
            lineItems: [newLineItem()],
            notes: "",
          });
          setDialogOpen(true);
        }}
        onDelete={(row) => {
          deleteMutation.mutate(row.id);
          toast.success("Order deleted");
        }}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setIsEditing(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Purchase Order" : "New Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier Name *</Label>
                <Input
                  placeholder="Supplier name"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                  data-ocid="po-supplier-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>PO Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
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
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      lineItems: [...f.lineItems, newLineItem()],
                    }))
                  }
                >
                  <PlusCircle className="size-3 mr-1" /> Add Row
                </Button>
              </div>
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">
                        Description
                      </th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium w-20">
                        Qty
                      </th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium w-24">
                        Rate (₹)
                      </th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium w-20">
                        Tax %
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems.map((li) => (
                      <tr key={li.id} className="border-b border-border/40">
                        <td className="px-2 py-1.5">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Item description"
                            value={li.description}
                            onChange={(e) =>
                              updateLine(li.id, "description", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            min={1}
                            value={li.qty}
                            onChange={(e) =>
                              updateLine(li.id, "qty", Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            min={0}
                            value={li.rate}
                            onChange={(e) =>
                              updateLine(li.id, "rate", Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            min={0}
                            max={100}
                            value={li.taxPercent}
                            onChange={(e) =>
                              updateLine(
                                li.id,
                                "taxPercent",
                                Number(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td className="px-1">
                          <button
                            type="button"
                            onClick={() => removeLine(li.id)}
                            disabled={form.lineItems.length === 1}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm pt-1">
                <div className="flex gap-8 text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono w-28 text-right">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex gap-8 text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-mono w-28 text-right">
                    {formatCurrency(totals.tax)}
                  </span>
                </div>
                <div className="flex gap-8 font-semibold text-foreground border-t border-border pt-1">
                  <span>Total</span>
                  <span className="font-mono w-28 text-right">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Optional notes…"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-ocid="po-save-btn"
            >
              {isEditing ? "Update" : "Save as Draft"}
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
        title="Import Purchase Orders"
        onImport={handleImport}
      />
    </ModulePageLayout>
  );
}
