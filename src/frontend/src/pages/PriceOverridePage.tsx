import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import {
  type FilterConfig,
  SearchFilterBar,
} from "@/components/SearchFilterBar";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveOrg } from "@/hooks/useOrg";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  Download,
  Edit,
  IndianRupee,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const ITEMS = [
  { id: "1", code: "ITM-001", name: "Industrial Bolt Set M10", baseRate: 450 },
  {
    id: "2",
    code: "ITM-002",
    name: "Stainless Steel Sheet 2mm",
    baseRate: 3200,
  },
  { id: "4", code: "ITM-004", name: "Hydraulic Pump 50L", baseRate: 28500 },
  { id: "5", code: "ITM-005", name: "Bearing 6205-ZZ", baseRate: 320 },
  { id: "6", code: "ITM-006", name: "Electric Motor 1HP", baseRate: 7200 },
];

const CHANNELS = [
  "Amazon India",
  "Flipkart",
  "Delhi Showroom",
  "Mumbai Wholesale Hub",
  "Bangalore Retail Store",
];
const CUSTOMERS = [
  "Reliance Industries",
  "Tata Motors",
  "BHEL",
  "L&T Construction",
  "Bajaj Auto",
];

type ApplyToType = "Channel" | "Customer";

interface PriceOverride {
  id: string;
  itemId: string;
  applyTo: ApplyToType;
  applyToName: string;
  overridePrice: number;
  validFrom: string;
  validTo: string;
  status: "active" | "inactive" | "scheduled";
}

const SEED_OVERRIDES: PriceOverride[] = [
  {
    id: "1",
    itemId: "1",
    applyTo: "Channel",
    applyToName: "Amazon India",
    overridePrice: 420,
    validFrom: "2026-01-01",
    validTo: "2026-06-30",
    status: "active",
  },
  {
    id: "2",
    itemId: "2",
    applyTo: "Customer",
    applyToName: "BHEL",
    overridePrice: 2950,
    validFrom: "2026-02-01",
    validTo: "2026-12-31",
    status: "active",
  },
  {
    id: "3",
    itemId: "4",
    applyTo: "Channel",
    applyToName: "Mumbai Wholesale Hub",
    overridePrice: 26000,
    validFrom: "2026-01-15",
    validTo: "2026-12-31",
    status: "active",
  },
  {
    id: "4",
    itemId: "5",
    applyTo: "Customer",
    applyToName: "Bajaj Auto",
    overridePrice: 295,
    validFrom: "2026-05-01",
    validTo: "2026-09-30",
    status: "scheduled",
  },
];

const CSV_COLUMNS = [
  { key: "itemName", label: "Item" },
  { key: "originalPrice", label: "Original Price" },
  { key: "overridePrice", label: "Override Price" },
  { key: "applyTo", label: "Apply To" },
  { key: "applyToName", label: "Channel / Customer" },
  { key: "validFrom", label: "Valid From" },
  { key: "validTo", label: "Valid To" },
  { key: "status", label: "Status" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "applyTo",
    label: "Type",
    options: [
      { value: "Channel", label: "Channel" },
      { value: "Customer", label: "Customer" },
    ],
  },
  {
    key: "channel",
    label: "Channel",
    options: CHANNELS.map((c) => ({ value: c, label: c })),
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "scheduled", label: "Scheduled" },
    ],
  },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  scheduled: "outline",
};

function OverrideDialog({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: PriceOverride;
  onSave: (data: Omit<PriceOverride, "id">) => void;
}) {
  const [itemId, setItemId] = useState(initial?.itemId ?? "");
  const [applyTo, setApplyTo] = useState<ApplyToType>(
    initial?.applyTo ?? "Channel",
  );
  const [applyToName, setApplyToName] = useState(initial?.applyToName ?? "");
  const [overridePrice, setOverridePrice] = useState(
    String(initial?.overridePrice ?? ""),
  );
  const [validFrom, setValidFrom] = useState(initial?.validFrom ?? "");
  const [validTo, setValidTo] = useState(initial?.validTo ?? "");
  const [status, setStatus] = useState<"active" | "inactive" | "scheduled">(
    initial?.status ?? "active",
  );

  const selectedItem = ITEMS.find((i) => i.id === itemId);

  function handleSave() {
    if (!itemId || !applyToName || !overridePrice || !validFrom || !validTo) {
      toast.error("All fields are required");
      return;
    }
    const price = Number.parseFloat(overridePrice);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    onSave({
      itemId,
      applyTo,
      applyToName,
      overridePrice: price,
      validFrom,
      validTo,
      status,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Price Override" : "Add Price Override"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Item *</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger data-ocid="po-item-select">
                <SelectValue placeholder="Select item…" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}{" "}
                    <span className="text-muted-foreground">
                      (₹{item.baseRate})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Base rate: ₹{selectedItem.baseRate.toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Apply To</Label>
              <Select
                value={applyTo}
                onValueChange={(v) => {
                  setApplyTo(v as ApplyToType);
                  setApplyToName("");
                }}
              >
                <SelectTrigger data-ocid="po-apply-to-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Channel">Sales Channel</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{applyTo === "Channel" ? "Channel" : "Customer"} *</Label>
              <Select value={applyToName} onValueChange={setApplyToName}>
                <SelectTrigger data-ocid="po-target-select">
                  <SelectValue
                    placeholder={`Select ${applyTo === "Channel" ? "channel" : "customer"}…`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(applyTo === "Channel" ? CHANNELS : CUSTOMERS).map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Override Price (₹) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="pl-9"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  data-ocid="po-price-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "active" | "inactive" | "scheduled")
                }
              >
                <SelectTrigger data-ocid="po-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valid From *</Label>
              <Input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                data-ocid="po-valid-from-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid To *</Label>
              <Input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                data-ocid="po-valid-to-input"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="po-save-btn">
            {initial ? "Save Changes" : "Add Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PriceOverridePage() {
  const { activeOrg: org } = useActiveOrg();
  const [overrides, setOverrides] = useState<PriceOverride[]>(SEED_OVERRIDES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PriceOverride | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PriceOverride | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [exportOpen, setExportOpen] = useState(false);
  const [exportCols, setExportCols] = useState<string[]>(
    CSV_COLUMNS.map((c) => c.key),
  );
  const [importOpen, setImportOpen] = useState(false);
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    return overrides.filter((o) => {
      const item = ITEMS.find((i) => i.id === o.itemId);
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        (item?.name ?? "").toLowerCase().includes(s) ||
        o.applyToName.toLowerCase().includes(s);
      const matchApplyTo =
        !filterValues.applyTo || o.applyTo === filterValues.applyTo;
      const matchChannel =
        !filterValues.channel ||
        (o.applyTo === "Channel" && o.applyToName === filterValues.channel);
      const matchStatus =
        !filterValues.status || o.status === filterValues.status;
      return matchSearch && matchApplyTo && matchChannel && matchStatus;
    });
  }, [overrides, search, filterValues]);

  function handleSave(data: Omit<PriceOverride, "id">) {
    if (editTarget) {
      setOverrides((prev) =>
        prev.map((o) => (o.id === editTarget.id ? { ...o, ...data } : o)),
      );
      toast.success("Price override updated");
    } else {
      setOverrides((prev) => [...prev, { id: Date.now().toString(), ...data }]);
      toast.success("Price override added");
    }
    setEditTarget(undefined);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setOverrides((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setSelected((prev) => prev.filter((id) => id !== deleteTarget.id));
    toast.success("Price override deleted");
    setDeleteTarget(undefined);
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    setSelected(
      selected.length === filtered.length ? [] : filtered.map((o) => o.id),
    );
  }

  function handleBulkDelete() {
    setOverrides((prev) => prev.filter((o) => !selected.includes(o.id)));
    toast.success(`${selected.length} override(s) deleted`);
    setSelected([]);
  }

  function handleExport() {
    const rows = filtered
      .filter((o) => selected.length === 0 || selected.includes(o.id))
      .map((o) => {
        const item = ITEMS.find((i) => i.id === o.itemId);
        return {
          ...o,
          itemName: item?.name ?? "—",
          originalPrice: item?.baseRate ?? 0,
        };
      });
    exportToCsv(
      "price-overrides",
      CSV_COLUMNS.filter((col) => exportCols.includes(col.key)),
      rows as unknown as Record<string, unknown>[],
    );
    toast.success("Exported successfully");
  }

  function handleImport(file: File) {
    toast.success(`Imported ${file.name} — data will sync shortly`);
  }

  if (!org) return null;

  return (
    <SubscriptionGate requiredPlan="pro" feature="Catalogue Management">
      <ModulePageLayout
        title="Price Override"
        moduleName="price-override"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              data-ocid="po-import-btn"
            >
              <Upload className="size-3.5 mr-1.5" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              data-ocid="po-export-btn"
            >
              <Download className="size-3.5 mr-1.5" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(undefined);
                setDialogOpen(true);
              }}
              data-ocid="add-price-override-btn"
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Override
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IndianRupee className="size-4 text-primary" />
            <span>Catalogue / Price Override</span>
          </div>

          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            filters={FILTER_CONFIGS}
            filterValues={filterValues}
            onFilterChange={(key, val) =>
              setFilterValues((prev) => ({ ...prev, [key]: val }))
            }
            placeholder="Search by item name, channel, or customer…"
          />

          <BulkActionsBar
            selectedCount={selected.length}
            onBulkDelete={handleBulkDelete}
            onBulkExport={() => setExportOpen(true)}
          />

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center gap-3"
                  data-ocid="price-override-empty-state"
                >
                  <IndianRupee className="size-12 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">
                    No price overrides match your filters
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Add Override
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={
                            selected.length === filtered.length &&
                            filtered.length > 0
                          }
                          onChange={toggleSelectAll}
                          data-ocid="po-select-all"
                        />
                      </TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">
                        Original Price (₹)
                      </TableHead>
                      <TableHead className="text-right">
                        Override Price (₹)
                      </TableHead>
                      <TableHead>Channel / Customer</TableHead>
                      <TableHead>Valid From</TableHead>
                      <TableHead>Valid To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((override) => {
                      const item = ITEMS.find((i) => i.id === override.itemId);
                      const saving = item
                        ? (
                            ((item.baseRate - override.overridePrice) /
                              item.baseRate) *
                            100
                          ).toFixed(1)
                        : null;
                      return (
                        <TableRow
                          key={override.id}
                          data-ocid={`po-row-${override.id}`}
                          className={
                            selected.includes(override.id) ? "bg-primary/5" : ""
                          }
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={selected.includes(override.id)}
                              onChange={() => toggleSelect(override.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">
                              {item?.name ?? "—"}
                            </p>
                            {item && saving && Number(saving) !== 0 && (
                              <p
                                className={`text-xs ${Number(saving) > 0 ? "text-accent-foreground" : "text-destructive"}`}
                              >
                                {Number(saving) > 0
                                  ? `${saving}% below base`
                                  : `${Math.abs(Number(saving))}% above base`}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {item ? item.baseRate.toLocaleString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {override.overridePrice.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                override.applyTo === "Channel"
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-accent/15 text-accent-foreground border-accent/30"
                              }
                            >
                              {override.applyTo}: {override.applyToName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {override.validFrom}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {override.validTo}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                STATUS_VARIANT[override.status] ?? "default"
                              }
                            >
                              {override.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditTarget(override);
                                  setDialogOpen(true);
                                }}
                                data-ocid={`edit-po-${override.id}`}
                              >
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(override)}
                                data-ocid={`delete-po-${override.id}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </ModulePageLayout>

      <OverrideDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(undefined);
        }}
        initial={editTarget}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Price Override?</AlertDialogTitle>
            <AlertDialogDescription>
              This price override for{" "}
              <strong>
                {ITEMS.find((i) => i.id === deleteTarget?.itemId)?.name}
              </strong>{" "}
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="confirm-delete-po-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ColumnPickerModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        columns={CSV_COLUMNS}
        selectedColumns={exportCols}
        onSelectionChange={setExportCols}
        onExport={handleExport}
      />

      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Price Overrides"
        onImport={handleImport}
      />
    </SubscriptionGate>
  );
}
