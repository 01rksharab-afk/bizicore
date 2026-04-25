import { ModulePageLayout } from "@/components/ModulePageLayout";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Edit,
  FileDown,
  Filter,
  MapPin,
  Navigation,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli",
  "Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

interface Location {
  id: string;
  name: string;
  code: string;
  email: string;
  state: string;
  enableAutoAccess: boolean;
  status: "active" | "inactive";
}

const SEED: Location[] = [
  {
    id: "1",
    name: "Mumbai Warehouse",
    code: "MUM-WH-01",
    email: "mumbai@bizcore.io",
    state: "Maharashtra",
    enableAutoAccess: true,
    status: "active",
  },
  {
    id: "2",
    name: "Delhi Distribution Centre",
    code: "DEL-DC-01",
    email: "delhi@bizcore.io",
    state: "Delhi",
    enableAutoAccess: false,
    status: "active",
  },
  {
    id: "3",
    name: "Bangalore Showroom",
    code: "BLR-SR-01",
    email: "bangalore@bizcore.io",
    state: "Karnataka",
    enableAutoAccess: true,
    status: "active",
  },
  {
    id: "4",
    name: "Chennai Depot",
    code: "CHN-DP-01",
    email: "chennai@bizcore.io",
    state: "Tamil Nadu",
    enableAutoAccess: false,
    status: "inactive",
  },
  {
    id: "5",
    name: "Hyderabad Office",
    code: "HYD-OF-01",
    email: "hyderabad@bizcore.io",
    state: "Telangana",
    enableAutoAccess: false,
    status: "active",
  },
];

const EMPTY_FORM = {
  name: "",
  code: "",
  email: "",
  state: "",
  enableAutoAccess: false,
};

function exportCSV(data: Location[]) {
  const headers = [
    "Location Name",
    "Location Code",
    "Email",
    "State",
    "Auto Access",
    "Status",
  ];
  const rows = data.map((l) => [
    l.name,
    l.code,
    l.email,
    l.state,
    l.enableAutoAccess ? "Yes" : "No",
    l.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "locations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>(SEED);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleteBulk, setDeleteBulk] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = locations;
    if (stateFilter !== "all")
      list = list.filter((l) => l.state === stateFilter);
    if (statusFilter !== "all")
      list = list.filter((l) => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [locations, search, stateFilter, statusFilter]);

  const allSelected =
    filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((l) => l.id)));

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setDialogOpen(true);
  }
  function openEdit(l: Location) {
    setForm({
      name: l.name,
      code: l.code,
      email: l.email,
      state: l.state,
      enableAutoAccess: l.enableAutoAccess,
    });
    setEditTarget(l);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    if (!form.code.trim()) {
      toast.error("Location code is required");
      return;
    }
    if (editTarget) {
      setLocations((prev) =>
        prev.map((l) => (l.id === editTarget.id ? { ...l, ...form } : l)),
      );
      toast.success("Location updated");
    } else {
      setLocations((prev) => [
        ...prev,
        { id: Date.now().toString(), ...form, status: "active" },
      ]);
      toast.success("Location added");
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setLocations((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    toast.success("Location deleted");
    setDeleteTarget(null);
  }

  function handleBulkDelete() {
    setLocations((prev) => prev.filter((l) => !selected.has(l.id)));
    toast.success(`${selected.size} locations deleted`);
    setSelected(new Set());
    setDeleteBulk(false);
  }

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        data-ocid="import-locations-btn"
      >
        <Upload className="size-4 mr-1.5" /> Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) toast.success(`Importing ${f.name}…`);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportCSV(filtered)}
        data-ocid="export-locations-btn"
      >
        <Download className="size-4 mr-1.5" /> Export
      </Button>
      <Button size="sm" onClick={openAdd} data-ocid="locations-add-btn">
        <Plus className="size-4 mr-1.5" /> Add Location
      </Button>
    </>
  );

  return (
    <ModulePageLayout
      title="Locations"
      moduleName="locations"
      actions={headerActions}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search name, code, state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="locations-search"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All States</SelectItem>
            {INDIAN_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="ml-auto">
          {locations.length} locations
        </Badge>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportCSV(filtered.filter((l) => selected.has(l.id)))
              }
            >
              <FileDown className="size-3.5 mr-1" /> Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteBulk(true)}
              data-ocid="bulk-delete-locations-btn"
            >
              <Trash2 className="size-3.5 mr-1" /> Delete ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Location Name</TableHead>
                <TableHead>Location Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-center">Auto-Access</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-20 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-16"
                    data-ocid="locations-empty"
                  >
                    <MapPin className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium text-sm text-foreground">
                      No locations found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search
                        ? "Try adjusting search or filters"
                        : "Add your first location to get started"}
                    </p>
                    {!search && (
                      <Button size="sm" className="mt-4" onClick={openAdd}>
                        <Plus className="size-4 mr-1.5" />
                        Add Location
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((loc) => (
                  <TableRow
                    key={loc.id}
                    className="group"
                    data-ocid={`location-row-${loc.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(loc.id)}
                        onCheckedChange={() => toggleSelect(loc.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{loc.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {loc.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {loc.email || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {loc.state || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {loc.enableAutoAccess ? (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                          <Navigation className="size-3.5" /> Auto
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Manual
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={loc.status === "active"}
                        onCheckedChange={(v) => {
                          setLocations((prev) =>
                            prev.map((x) =>
                              x.id === loc.id
                                ? { ...x, status: v ? "active" : "inactive" }
                                : x,
                            ),
                          );
                        }}
                        data-ocid={`location-status-${loc.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(loc)}
                          data-ocid={`location-edit-${loc.id}`}
                          aria-label="Edit location"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(loc)}
                          data-ocid={`location-delete-${loc.id}`}
                          aria-label="Delete location"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Location" : "Add Location"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Location Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Mumbai Warehouse"
                data-ocid="location-form-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="e.g. MUM-WH-01"
                data-ocid="location-form-code"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="location@company.com"
                data-ocid="location-form-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select
                value={form.state}
                onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}
              >
                <SelectTrigger data-ocid="location-form-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Auto Location Access</p>
                  <p className="text-xs text-muted-foreground">
                    Grant access based on browser geolocation
                  </p>
                </div>
              </div>
              <Switch
                checked={form.enableAutoAccess}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, enableAutoAccess: v }))
                }
                data-ocid="location-form-auto-access"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="location-form-save">
                {editTarget ? "Save Changes" : "Add Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="confirm-delete-location-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog
        open={deleteBulk}
        onOpenChange={(v) => !v && setDeleteBulk(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} Locations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size} selected locations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="confirm-bulk-delete-locations-btn"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePageLayout>
  );
}
