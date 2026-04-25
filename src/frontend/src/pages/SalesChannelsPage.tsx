import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ColumnPickerModal } from "@/components/ColumnPickerModal";
import { ImportDialog } from "@/components/ImportDialog";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import {
  type FilterConfig,
  SearchFilterBar,
} from "@/components/SearchFilterBar";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { ControlGroup } from "@/components/ui/ControlGroup";
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
import { Switch } from "@/components/ui/switch";
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
  Plus,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ChannelType = "marketplace" | "website" | "retail" | "B2B";
type ChannelStatus = "active" | "inactive";

interface SalesChannel {
  id: string;
  name: string;
  type: ChannelType;
  url: string;
  commissionRate: number;
  currency: string;
  description: string;
  status: ChannelStatus;
}

const SEED_CHANNELS: SalesChannel[] = [
  {
    id: "1",
    name: "Amazon India",
    type: "marketplace",
    url: "https://amazon.in",
    commissionRate: 8,
    currency: "INR",
    description: "India's largest marketplace",
    status: "active",
  },
  {
    id: "2",
    name: "Flipkart",
    type: "marketplace",
    url: "https://flipkart.com",
    commissionRate: 7,
    currency: "INR",
    description: "Leading e-commerce platform",
    status: "active",
  },
  {
    id: "3",
    name: "Company Website",
    type: "website",
    url: "https://bizcore.in",
    commissionRate: 0,
    currency: "INR",
    description: "Official direct sales channel",
    status: "active",
  },
  {
    id: "4",
    name: "Delhi Showroom",
    type: "retail",
    url: "",
    commissionRate: 0,
    currency: "INR",
    description: "Physical retail outlet — Connaught Place",
    status: "active",
  },
  {
    id: "5",
    name: "Wholesale Partners",
    type: "B2B",
    url: "",
    commissionRate: 3,
    currency: "INR",
    description: "Bulk orders for registered B2B clients",
    status: "inactive",
  },
];

const CSV_COLUMNS = [
  { key: "name", label: "Channel Name" },
  { key: "type", label: "Type" },
  { key: "url", label: "URL" },
  { key: "commissionRate", label: "Commission %" },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  {
    key: "type",
    label: "Channel Type",
    options: [
      { value: "marketplace", label: "Marketplace" },
      { value: "website", label: "Website" },
      { value: "retail", label: "Retail" },
      { value: "B2B", label: "B2B" },
    ],
  },
];

const TYPE_COLORS: Record<ChannelType, string> = {
  marketplace: "bg-accent/15 text-accent-foreground border-accent/30",
  website: "bg-primary/10 text-primary border-primary/30",
  retail: "bg-secondary text-secondary-foreground border-border",
  B2B: "bg-muted text-muted-foreground border-border",
};

function ChannelDialog({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: SalesChannel;
  onSave: (c: Omit<SalesChannel, "id">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<ChannelType>(initial?.type ?? "marketplace");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [commissionRate, setCommissionRate] = useState(
    String(initial?.commissionRate ?? ""),
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "INR");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ChannelStatus>(
    initial?.status ?? "active",
  );

  function handleSave() {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }
    onSave({
      name: name.trim(),
      type,
      url: url.trim(),
      commissionRate: Number(commissionRate) || 0,
      currency,
      description: description.trim(),
      status,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Sales Channel" : "Add Sales Channel"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Channel Name *</Label>
              <Input
                placeholder="e.g. Amazon India"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="ch-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ChannelType)}
              >
                <SelectTrigger data-ocid="ch-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["marketplace", "website", "retail", "B2B"] as ChannelType[]
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-ocid="ch-currency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-ocid="ch-url-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Commission %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                data-ocid="ch-commission-input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-ocid="ch-description-input"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={status === "active"}
                onCheckedChange={(v) => setStatus(v ? "active" : "inactive")}
                data-ocid="ch-status-toggle"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="ch-save-btn">
            {initial ? "Save Changes" : "Add Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesChannelsPage() {
  const { activeOrg: org } = useActiveOrg();
  const [channels, setChannels] = useState<SalesChannel[]>(SEED_CHANNELS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalesChannel | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SalesChannel | undefined>();
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
    return channels.filter((ch) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        ch.name.toLowerCase().includes(s) ||
        ch.type.toLowerCase().includes(s) ||
        ch.url.toLowerCase().includes(s);
      const matchStatus =
        !filterValues.status || ch.status === filterValues.status;
      const matchType = !filterValues.type || ch.type === filterValues.type;
      return matchSearch && matchStatus && matchType;
    });
  }, [channels, search, filterValues]);

  function handleSave(data: Omit<SalesChannel, "id">) {
    if (editTarget) {
      setChannels((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...c, ...data } : c)),
      );
      toast.success("Channel updated");
    } else {
      setChannels((prev) => [...prev, { id: Date.now().toString(), ...data }]);
      toast.success("Channel added");
    }
    setEditTarget(undefined);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setChannels((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setSelected((prev) => prev.filter((id) => id !== deleteTarget.id));
    toast.success("Channel deleted");
    setDeleteTarget(undefined);
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    setSelected(
      selected.length === filtered.length ? [] : filtered.map((c) => c.id),
    );
  }

  function handleBulkDelete() {
    setChannels((prev) => prev.filter((c) => !selected.includes(c.id)));
    toast.success(`${selected.length} channel(s) deleted`);
    setSelected([]);
  }

  function handleExport() {
    const rows = filtered.filter(
      (c) => selected.length === 0 || selected.includes(c.id),
    );
    exportToCsv(
      "sales-channels",
      CSV_COLUMNS.filter((c) => exportCols.includes(c.key)),
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
        title="Sales Channels"
        moduleName="sales-channels"
        actions={
          <ControlGroup
            showToggle={false}
            buttons={[
              {
                label: "Add Channel",
                icon: <Plus className="size-3.5" />,
                onClick: () => {
                  setEditTarget(undefined);
                  setDialogOpen(true);
                },
                variant: "default",
                "data-ocid": "add-channel-btn",
              },
              {
                label: "Import",
                icon: <Upload className="size-3.5" />,
                onClick: () => setImportOpen(true),
                variant: "outline",
                "data-ocid": "sc-import-btn",
              },
              {
                label: "Export",
                icon: <Download className="size-3.5" />,
                onClick: () => setExportOpen(true),
                variant: "outline",
                "data-ocid": "sc-export-btn",
              },
            ]}
          />
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="size-4 text-primary" />
            <span>Catalogue / Sales Channels</span>
          </div>

          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            filters={FILTER_CONFIGS}
            filterValues={filterValues}
            onFilterChange={(key, val) =>
              setFilterValues((prev) => ({ ...prev, [key]: val }))
            }
            placeholder="Search channels by name, type, URL…"
          />

          <BulkActionsBar
            selectedCount={selected.length}
            onBulkDelete={handleBulkDelete}
            onBulkExport={() => {
              setExportOpen(true);
            }}
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
                  data-ocid="channels-empty-state"
                >
                  <ShoppingBag className="size-12 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">
                    No channels match your filters
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting filters or add a new channel.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Add Channel
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
                          data-ocid="sc-select-all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Commission %</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((ch) => (
                      <TableRow
                        key={ch.id}
                        data-ocid={`channel-row-${ch.id}`}
                        className={
                          selected.includes(ch.id) ? "bg-primary/5" : ""
                        }
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            className="accent-primary"
                            checked={selected.includes(ch.id)}
                            onChange={() => toggleSelect(ch.id)}
                            data-ocid={`sc-select-${ch.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{ch.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={TYPE_COLORS[ch.type]}
                          >
                            {ch.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                          {ch.url || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {ch.commissionRate}%
                        </TableCell>
                        <TableCell>{ch.currency}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ch.status === "active" ? "default" : "secondary"
                            }
                          >
                            {ch.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditTarget(ch);
                                setDialogOpen(true);
                              }}
                              data-ocid={`edit-ch-${ch.id}`}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(ch)}
                              data-ocid={`delete-ch-${ch.id}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </ModulePageLayout>

      <ChannelDialog
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
            <AlertDialogTitle>Delete Sales Channel?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="confirm-delete-ch-btn"
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
        title="Import Sales Channels"
        onImport={handleImport}
      />
    </SubscriptionGate>
  );
}
