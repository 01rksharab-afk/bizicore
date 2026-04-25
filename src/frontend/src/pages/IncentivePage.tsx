import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import { exportToCsv } from "@/utils/exportToCsv";
import { Download, Edit2, Gift, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type IncentiveType = "percentage" | "fixed";
type SchemeStatus = "active" | "inactive";

interface IncentiveScheme {
  id: string;
  name: string;
  category: string;
  incentiveType: IncentiveType;
  value: number;
  minTarget: number;
  maxCap: number;
  validFrom: string;
  validTo: string;
  status: SchemeStatus;
}

const SEED: IncentiveScheme[] = [
  {
    id: "1",
    name: "Q1 Sales Sprint",
    category: "Sales",
    incentiveType: "percentage",
    value: 5,
    minTarget: 500000,
    maxCap: 50000,
    validFrom: "2026-01-01",
    validTo: "2026-03-31",
    status: "active",
  },
  {
    id: "2",
    name: "New Customer Drive",
    category: "CRM",
    incentiveType: "fixed",
    value: 5000,
    minTarget: 20,
    maxCap: 100000,
    validFrom: "2026-01-01",
    validTo: "2026-06-30",
    status: "active",
  },
  {
    id: "3",
    name: "Warehouse Efficiency Bonus",
    category: "Inventory",
    incentiveType: "fixed",
    value: 8000,
    minTarget: 10000,
    maxCap: 80000,
    validFrom: "2026-02-01",
    validTo: "2026-04-30",
    status: "inactive",
  },
  {
    id: "4",
    name: "Annual Target Achiever",
    category: "Finance",
    incentiveType: "percentage",
    value: 8,
    minTarget: 2000000,
    maxCap: 200000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "active",
  },
];

const CATEGORIES = [
  "Sales",
  "CRM",
  "Inventory",
  "Finance",
  "Procurement",
  "Operations",
  "HR",
];

// ─── Form Dialog ──────────────────────────────────────────────────────────────

interface SchemeFormProps {
  open: boolean;
  onClose: () => void;
  initial?: IncentiveScheme;
  onSave: (data: Omit<IncentiveScheme, "id">) => void;
}

function SchemeForm({ open, onClose, initial, onSave }: SchemeFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Sales");
  const [incentiveType, setIncentiveType] = useState<IncentiveType>(
    initial?.incentiveType ?? "percentage",
  );
  const [value, setValue] = useState(initial?.value ?? 0);
  const [minTarget, setMinTarget] = useState(initial?.minTarget ?? 0);
  const [maxCap, setMaxCap] = useState(initial?.maxCap ?? 0);
  const [validFrom, setValidFrom] = useState(initial?.validFrom ?? "");
  const [validTo, setValidTo] = useState(initial?.validTo ?? "");
  const [status, setStatus] = useState<SchemeStatus>(
    initial?.status ?? "active",
  );

  function handleSave() {
    if (!name.trim()) {
      toast.error("Incentive name is required");
      return;
    }
    if (!validFrom) {
      toast.error("Valid from date is required");
      return;
    }
    onSave({
      name,
      category,
      incentiveType,
      value,
      minTarget,
      maxCap,
      validFrom,
      validTo,
      status,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Incentive" : "Add Incentive"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Incentive Name</Label>
              <Input
                data-ocid="incentive-form-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 Sales Sprint"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-ocid="incentive-form-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={incentiveType}
                onValueChange={(v) => setIncentiveType(v as IncentiveType)}
              >
                <SelectTrigger data-ocid="incentive-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Value {incentiveType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                data-ocid="incentive-form-value"
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min Target</Label>
              <Input
                data-ocid="incentive-form-min-target"
                type="number"
                value={minTarget}
                onChange={(e) => setMinTarget(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Cap (₹)</Label>
              <Input
                data-ocid="incentive-form-max-cap"
                type="number"
                value={maxCap}
                onChange={(e) => setMaxCap(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid From</Label>
              <Input
                data-ocid="incentive-form-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid To</Label>
              <Input
                data-ocid="incentive-form-to"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              data-ocid="incentive-form-status"
              checked={status === "active"}
              onCheckedChange={(v) => setStatus(v ? "active" : "inactive")}
            />
            <Label>{status === "active" ? "Active" : "Inactive"}</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="incentive-form-save">
              {initial ? "Save Changes" : "Create Incentive"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IncentivePage() {
  const [schemes, setSchemes] = useState<IncentiveScheme[]>(SEED);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IncentiveScheme | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const filterDefs = [
    {
      label: "Category",
      key: "category",
      options: CATEGORIES.map((c) => ({ value: c, label: c })),
    },
    {
      label: "Type",
      key: "type",
      options: [
        { value: "percentage", label: "Percentage" },
        { value: "fixed", label: "Fixed" },
      ],
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    { label: "Valid From", key: "validFrom", options: [] },
    { label: "Valid To", key: "validTo", options: [] },
  ];

  const filtered = schemes.filter((s) => {
    const q = search.toLowerCase();
    if (
      q &&
      !s.name.toLowerCase().includes(q) &&
      !s.category.toLowerCase().includes(q)
    )
      return false;
    if (filters.category && s.category !== filters.category) return false;
    if (filters.type && s.incentiveType !== filters.type) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.validFrom && s.validFrom < filters.validFrom) return false;
    if (filters.validTo && s.validTo > filters.validTo) return false;
    return true;
  });

  function handleSave(data: Omit<IncentiveScheme, "id">) {
    if (editTarget) {
      setSchemes((prev) =>
        prev.map((s) => (s.id === editTarget.id ? { ...data, id: s.id } : s)),
      );
      toast.success("Incentive updated");
    } else {
      setSchemes((prev) => [...prev, { ...data, id: Date.now().toString() }]);
      toast.success("Incentive created");
    }
    setEditTarget(undefined);
  }

  function handleDelete(id: string) {
    setSchemes((p) => p.filter((s) => s.id !== id));
    setSelected((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
    setDeleteConfirm(null);
    toast.success("Incentive deleted");
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    setSchemes((p) => p.filter((s) => !selected.has(s.id)));
    toast.success(`${selected.size} incentive(s) deleted`);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((s) => s.id)),
    );
  }

  function handleExport() {
    const rows = (
      selected.size > 0 ? schemes.filter((s) => selected.has(s.id)) : filtered
    ).map((s) => ({
      ...s,
      value: s.incentiveType === "percentage" ? `${s.value}%` : `₹${s.value}`,
    }));
    exportToCsv(
      "incentives",
      [
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "incentiveType", label: "Type" },
        { key: "value", label: "Value" },
        { key: "minTarget", label: "Min Target" },
        { key: "maxCap", label: "Max Cap" },
        { key: "validFrom", label: "Valid From" },
        { key: "validTo", label: "Valid To" },
        { key: "status", label: "Status" },
      ],
      rows as unknown as Record<string, unknown>[],
    );
    toast.success("Exported incentives");
  }

  function formatValue(s: IncentiveScheme) {
    return s.incentiveType === "percentage"
      ? `${s.value}%`
      : `₹${s.value.toLocaleString("en-IN")}`;
  }

  return (
    <ModulePageLayout
      title="Incentive Management"
      moduleName="incentives"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
            data-ocid="incentive-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-ocid="incentive-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(undefined);
              setDialogOpen(true);
            }}
            data-ocid="incentive-add-btn"
          >
            <Plus className="size-4 mr-1.5" /> Add Incentive
          </Button>
        </div>
      }
    >
      <input
        ref={importRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={() => toast.info("CSV import coming soon")}
      />

      <p className="text-sm text-muted-foreground -mt-2">
        Create incentive schemes with targets, rewards, and effective date
        ranges.
      </p>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterDefs.filter((f) => f.options.length > 0)}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search by name or category…"
      />

      {/* Date range filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Valid From
          </Label>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={filters.validFrom ?? ""}
            onChange={(e) =>
              setFilters((p) => ({ ...p, validFrom: e.target.value }))
            }
            data-ocid="filter-validFrom"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Valid To
          </Label>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={filters.validTo ?? ""}
            onChange={(e) =>
              setFilters((p) => ({ ...p, validTo: e.target.value }))
            }
            data-ocid="filter-validTo"
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-lg text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            data-ocid="incentive-bulk-delete"
          >
            <Trash2 className="size-3.5 mr-1.5" /> Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-3.5 mr-1.5" /> Export Selected
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-3"
              data-ocid="incentive-empty-state"
            >
              <Gift className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No incentive schemes found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Create first scheme
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={
                          selected.size === filtered.length &&
                          filtered.length > 0
                        }
                        onCheckedChange={toggleAll}
                        data-ocid="incentive-select-all"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Value
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Min Target
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Max Cap
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Valid Period
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((scheme, idx) => (
                    <tr
                      key={scheme.id}
                      data-ocid={`incentive-row-${scheme.id}`}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(scheme.id)}
                          onCheckedChange={() => toggleSelect(scheme.id)}
                          data-ocid={`incentive-check-${scheme.id}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {scheme.name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {scheme.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {scheme.incentiveType}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-accent">
                        {formatValue(scheme)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        ₹{scheme.minTarget.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        ₹{scheme.maxCap.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {scheme.validFrom}{" "}
                        {scheme.validTo ? `→ ${scheme.validTo}` : "onwards"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            scheme.status === "active"
                              ? "bg-accent/10 text-accent-foreground border-accent/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {scheme.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setEditTarget(scheme);
                              setDialogOpen(true);
                            }}
                            data-ocid={`incentive-edit-${scheme.id}`}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(scheme.id)}
                            data-ocid={`incentive-delete-${scheme.id}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this incentive scheme? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                data-ocid="incentive-confirm-delete"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <SchemeForm
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(undefined);
        }}
        initial={editTarget}
        onSave={handleSave}
      />
    </ModulePageLayout>
  );
}
