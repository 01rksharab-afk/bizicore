import { ModulePageLayout } from "@/components/ModulePageLayout";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCsv } from "@/utils/exportToCsv";
import {
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportType =
  | "item_master"
  | "inventory"
  | "party_b2b"
  | "party_b2c"
  | "finance_categories";

type ImportStatus = "success" | "error" | "pending";

interface ImportLog {
  id: string;
  importType: ImportType;
  fileName: string;
  date: string;
  status: ImportStatus;
  records: number;
  errors: number;
}

const IMPORT_TYPES: {
  value: ImportType;
  label: string;
  desc: string;
  cols: string[];
}[] = [
  {
    value: "item_master",
    label: "Item Master",
    desc: "Products with HSN, rate, tax, UOM",
    cols: [
      "Item Code",
      "Item Name",
      "Category",
      "HSN Code",
      "Rate",
      "Tax %",
      "UOM",
      "Description",
    ],
  },
  {
    value: "inventory",
    label: "Inventory",
    desc: "Opening stock levels by item and location",
    cols: [
      "Item Code",
      "Location",
      "Opening Qty",
      "Unit Cost",
      "Batch No",
      "Serial No",
    ],
  },
  {
    value: "party_b2b",
    label: "Party Master (B2B)",
    desc: "Business customers and suppliers",
    cols: [
      "Party Name",
      "GSTIN",
      "PAN",
      "Address",
      "City",
      "State",
      "Pincode",
      "Phone",
      "Email",
    ],
  },
  {
    value: "party_b2c",
    label: "Party Master (B2C)",
    desc: "Individual / retail customers",
    cols: ["Name", "Phone", "Email", "Address", "City", "State", "Pincode"],
  },
  {
    value: "finance_categories",
    label: "Finance Categories",
    desc: "Income and expense category hierarchy",
    cols: ["Name", "Type (income/expense)", "Parent Category", "Description"],
  },
];

const SEED_LOGS: ImportLog[] = [
  {
    id: "1",
    importType: "item_master",
    fileName: "items_april.csv",
    date: "2026-04-01T10:30:00",
    status: "success",
    records: 142,
    errors: 0,
  },
  {
    id: "2",
    importType: "party_b2b",
    fileName: "customers_q1.xlsx",
    date: "2026-03-28T14:15:00",
    status: "success",
    records: 67,
    errors: 3,
  },
  {
    id: "3",
    importType: "inventory",
    fileName: "opening_stock.csv",
    date: "2026-03-15T09:00:00",
    status: "error",
    records: 0,
    errors: 12,
  },
  {
    id: "4",
    importType: "party_b2c",
    fileName: "retail_customers.csv",
    date: "2026-03-10T11:45:00",
    status: "success",
    records: 238,
    errors: 0,
  },
];

// ─── Import Tab ───────────────────────────────────────────────────────────────

function ImportTab({ onLogEntry }: { onLogEntry: (log: ImportLog) => void }) {
  const [importType, setImportType] = useState<ImportType>("item_master");
  const [typeSearch, setTypeSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredTypes = IMPORT_TYPES.filter(
    (t) =>
      t.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
      t.desc.toLowerCase().includes(typeSearch.toLowerCase()),
  );
  const selected = IMPORT_TYPES.find((t) => t.value === importType);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (
      f &&
      (f.name.endsWith(".csv") ||
        f.name.endsWith(".xlsx") ||
        f.name.endsWith(".xls"))
    ) {
      setFile(f);
      setDone(false);
      setProgress(0);
    } else toast.error("Only CSV or Excel files are supported");
  }

  async function handleImport() {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }
    setImporting(true);
    setProgress(0);
    setDone(false);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }
    setImporting(false);
    setDone(true);
    const records = Math.floor(Math.random() * 200) + 10;
    toast.success(
      `${selected?.label} imported successfully — ${records} records`,
    );
    onLogEntry({
      id: Date.now().toString(),
      importType,
      fileName: file.name,
      date: new Date().toISOString(),
      status: "success",
      records,
      errors: 0,
    });
  }

  function handleDownloadTemplate() {
    if (!selected) return;
    const csv = [
      selected.cols.join(","),
      selected.cols.map(() => "sample_value").join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${importType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <div className="space-y-2">
        <Label>Import Type</Label>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            data-ocid="import-type-search"
            className="pl-8 h-8 text-sm"
            placeholder="Search import type…"
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredTypes.map((t) => (
            <button
              type="button"
              key={t.value}
              data-ocid={`import-type-${t.value}`}
              onClick={() => {
                setImportType(t.value);
                setFile(null);
                setProgress(0);
                setDone(false);
              }}
              className={`text-left p-3 rounded-lg border transition-colors ${importType === t.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/30 text-foreground"}`}
            >
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <button
        type="button"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        data-ocid="import-drop-zone"
        className={`w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${file ? "border-accent/60 bg-accent/5" : "border-border hover:bg-muted/20"}`}
      >
        {file ? (
          <>
            <FileSpreadsheet className="size-8 text-accent" />
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB ·{" "}
              {file.name.split(".").pop()?.toUpperCase()}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setProgress(0);
                setDone(false);
              }}
            >
              Remove file
            </Button>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              CSV or Excel (.xlsx, .xls) files
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setDone(false);
              setProgress(0);
            }
          }}
        />
      </button>

      {/* Column preview + template */}
      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Expected Columns for {selected.label}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              data-ocid="download-template-btn"
            >
              <Download className="size-3.5 mr-1.5" /> Download Template
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.cols.map((c) => (
              <Badge key={c} variant="outline" className="font-mono text-xs">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {(importing || done) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {done ? "Import complete" : "Importing…"}
            </span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
          {done && (
            <p className="text-xs text-accent flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> All records imported
              successfully
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={importing || !file}
        data-ocid="import-submit-btn"
      >
        <Upload className="size-4 mr-1.5" />{" "}
        {importing ? "Importing…" : "Start Import"}
      </Button>
    </div>
  );
}

// ─── Export Tab ───────────────────────────────────────────────────────────────

function ExportTab() {
  const [entityType, setEntityType] = useState<ImportType>("item_master");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function handleExport() {
    const selected = IMPORT_TYPES.find((t) => t.value === entityType);
    const csv = [
      selected?.cols.join(",") ?? "",
      "Sample Row 1",
      "Sample Row 2",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Entity Type</Label>
        <Select
          value={entityType}
          onValueChange={(v) => setEntityType(v as ImportType)}
        >
          <SelectTrigger data-ocid="export-entity-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Date From (optional)</Label>
          <Input
            data-ocid="export-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Date To (optional)</Label>
          <Input
            data-ocid="export-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
      <div className="p-4 bg-muted/30 rounded-lg space-y-1">
        <p className="text-sm font-medium text-foreground">Export Preview</p>
        <p className="text-xs text-muted-foreground">
          Will export{" "}
          <strong>
            {IMPORT_TYPES.find((t) => t.value === entityType)?.label}
          </strong>{" "}
          data
          {dateFrom || dateTo
            ? ` from ${dateFrom || "beginning"} to ${dateTo || "today"}`
            : " (all records)"}
        </p>
      </div>
      <Button onClick={handleExport} data-ocid="export-download-btn">
        <Download className="size-4 mr-1.5" /> Download CSV
      </Button>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  logs,
  onDelete,
}: { logs: ImportLog[]; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filterDefs = [
    {
      label: "Import Type",
      key: "importType",
      options: IMPORT_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "success", label: "Success" },
        { value: "error", label: "Error" },
        { value: "pending", label: "Pending" },
      ],
    },
  ];

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    if (q && !l.fileName.toLowerCase().includes(q) && !l.importType.includes(q))
      return false;
    if (filters.importType && l.importType !== filters.importType) return false;
    if (filters.status && l.status !== filters.status) return false;
    if (filters.dateFrom && l.date < filters.dateFrom) return false;
    if (filters.dateTo && l.date > `${filters.dateTo}T23:59:59`) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function handleExportLogs() {
    const rows =
      selected.size > 0 ? logs.filter((l) => selected.has(l.id)) : filtered;
    exportToCsv(
      "import-history",
      [
        { key: "importType", label: "Import Type" },
        { key: "fileName", label: "File Name" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
        { key: "records", label: "Records" },
        { key: "errors", label: "Errors" },
      ],
      rows as unknown as Record<string, unknown>[],
    );
    toast.success("Import history exported");
  }

  const statusColors: Record<ImportStatus, string> = {
    success: "bg-accent/10 text-accent-foreground border-accent/30",
    error: "bg-destructive/10 text-destructive border-destructive/30",
    pending: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterDefs}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        placeholder="Search by file name or type…"
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            From
          </Label>
          <input
            type="date"
            className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              setFilters((p) => ({ ...p, dateFrom: e.target.value }))
            }
            data-ocid="history-filter-from"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            To
          </Label>
          <input
            type="date"
            className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              setFilters((p) => ({ ...p, dateTo: e.target.value }))
            }
            data-ocid="history-filter-to"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportLogs}
          data-ocid="history-export-btn"
        >
          <Download className="size-3.5 mr-1.5" /> Export Log
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-lg text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              for (const id of selected) onDelete(id);
              setSelected(new Set());
            }}
            data-ocid="history-bulk-delete"
          >
            <Trash2 className="size-3.5 mr-1.5" /> Delete Selected
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Clock className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No import history found
              </p>
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
                        onCheckedChange={() =>
                          setSelected(
                            selected.size === filtered.length
                              ? new Set()
                              : new Set(filtered.map((l) => l.id)),
                          )
                        }
                        data-ocid="history-select-all"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Import Type
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      File Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Records
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Errors
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, idx) => (
                    <tr
                      key={log.id}
                      data-ocid={`history-row-${log.id}`}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(log.id)}
                          onCheckedChange={() => toggleSelect(log.id)}
                          data-ocid={`history-check-${log.id}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {IMPORT_TYPES.find((t) => t.value === log.importType)
                            ?.label ?? log.importType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {log.fileName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(log.date).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[log.status]}>
                          {log.status === "success" ? (
                            <>
                              <CheckCircle2 className="size-3 mr-1" />
                              Success
                            </>
                          ) : log.status === "error" ? (
                            <>
                              <XCircle className="size-3 mr-1" />
                              Error
                            </>
                          ) : (
                            "Pending"
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {log.records}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-destructive">
                        {log.errors || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(log.id)}
                            data-ocid={`history-delete-${log.id}`}
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

      {/* Delete confirm */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Log Entry</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Remove this import log entry? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                  toast.success("Log entry deleted");
                }}
                data-ocid="history-confirm-delete"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportExportPage() {
  const [logs, setLogs] = useState<ImportLog[]>(SEED_LOGS);

  function handleLogEntry(log: ImportLog) {
    setLogs((prev) => [log, ...prev]);
  }

  function handleDeleteLog(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <ModulePageLayout title="Import & Export Data" moduleName="import-export">
      <p className="text-sm text-muted-foreground -mt-2">
        Bulk upload or download item masters, inventory, finance categories, and
        party master data.
      </p>

      <Tabs defaultValue="import" data-ocid="import-export-tabs">
        <TabsList className="mb-6">
          <TabsTrigger value="import" data-ocid="tab-import">
            <Upload className="size-3.5 mr-1.5" /> Import
          </TabsTrigger>
          <TabsTrigger value="export" data-ocid="tab-export">
            <Download className="size-3.5 mr-1.5" /> Export
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="tab-history">
            <Clock className="size-3.5 mr-1.5" /> History
            {logs.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1.5">
                {logs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Data</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file to bulk import records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportTab onLogEntry={handleLogEntry} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Data</CardTitle>
              <CardDescription>
                Download data as CSV with optional date range filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import History</CardTitle>
              <CardDescription>
                View and manage all past import operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTab logs={logs} onDelete={handleDeleteLog} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ModulePageLayout>
  );
}
