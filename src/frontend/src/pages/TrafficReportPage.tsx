import type { TrafficEvent, TrafficQuery } from "@/backend";
import { TrafficSource } from "@/backend";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useDeleteTraffic, useTrafficReport } from "@/hooks/useTraffic";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowUpDown,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Home,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortCol = "timestamp" | "page" | "referrer" | "sourceType" | "sessionId";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [25, 50, 100] as const;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function toNs(dateStr: string, endOfDay = false): bigint {
  const d = new Date(dateStr);
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  }
  return BigInt(d.getTime()) * BigInt(1_000_000);
}

function formatDateTime(ns: bigint): { date: string; time: string } {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString("en-IN"),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: TrafficSource }) {
  if (source === TrafficSource.internal)
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/5"
      >
        <Home className="size-2.5 mr-1" />
        Internal
      </Badge>
    );
  if (source === TrafficSource.external)
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
      >
        <Globe className="size-2.5 mr-1" />
        External
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/5"
    >
      <ExternalLink className="size-2.5 mr-1" />
      Direct
    </Badge>
  );
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportCSV(rows: TrafficEvent[], cols: string[]) {
  const header = cols.join(",");
  const body = rows.map((r) => {
    const { date, time } = formatDateTime(r.timestamp);
    const map: Record<string, string> = {
      Date: date,
      Time: time,
      Page: r.page,
      Referrer: r.referrer,
      "Source Type": r.sourceType,
      "Session ID": r.sessionId,
    };
    return cols.map((c) => `"${(map[c] ?? "").replace(/"/g, '""')}"`).join(",");
  });
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "traffic-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: TrafficEvent[], cols: string[]) {
  // Tab-delimited, .xlsx filename
  const header = cols.join("\t");
  const body = rows.map((r) => {
    const { date, time } = formatDateTime(r.timestamp);
    const map: Record<string, string> = {
      Date: date,
      Time: time,
      Page: r.page,
      Referrer: r.referrer,
      "Source Type": r.sourceType,
      "Session ID": r.sessionId,
    };
    return cols.map((c) => map[c] ?? "").join("\t");
  });
  const content = [header, ...body].join("\n");
  const blob = new Blob([content], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "traffic-report.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Column picker dialog ─────────────────────────────────────────────────────

const ALL_COLS = [
  "Date",
  "Time",
  "Page",
  "Referrer",
  "Source Type",
  "Session ID",
];

function ExportDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: TrafficEvent[];
}) {
  const [selected, setSelected] = useState<string[]>(ALL_COLS);
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");

  function toggle(col: string) {
    setSelected((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  }

  function doExport() {
    const cols = ALL_COLS.filter((c) => selected.includes(c));
    if (format === "csv") exportCSV(data, cols);
    else if (format === "excel") exportExcel(data, cols);
    else {
      exportCSV(data, cols);
      window.print();
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Traffic Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium mb-2 block">Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as "csv" | "excel" | "pdf")}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF (print dialog)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium mb-2 block">
              Columns to export
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_COLS.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(col)}
                    onChange={() => toggle(col)}
                    className="rounded"
                  />
                  {col}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={doExport}
              disabled={selected.length === 0}
              className="flex-1"
              data-ocid="traffic-export-confirm"
            >
              Export {data.length} rows
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrafficReportPage() {
  // URL state
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, string>;

  const fromDate = (rawSearch.from as string) ?? daysAgo(30);
  const toDate = (rawSearch.to as string) ?? today();
  const sourceFilter = (rawSearch.sourceType as string) ?? "all";
  const pageFilter = (rawSearch.page as string) ?? "";
  const referrerFilter = (rawSearch.referrer as string) ?? "";

  function updateSearch(patch: Record<string, string>) {
    navigate({
      search: (prev) => ({ ...prev, ...patch }) as Record<string, string>,
      replace: true,
    } as Parameters<typeof navigate>[0]);
  }

  // Module ON/OFF
  const [moduleEnabled, setModuleEnabled] = useState(() => {
    try {
      const v = localStorage.getItem("module_traffic_enabled");
      return v === null ? true : v === "true";
    } catch {
      return true;
    }
  });

  function toggleModule(val: boolean) {
    setModuleEnabled(val);
    try {
      localStorage.setItem("module_traffic_enabled", String(val));
    } catch {
      // ignore
    }
  }

  // Build query
  const query: Omit<TrafficQuery, "orgId"> = {
    dateFrom: toNs(fromDate),
    dateTo: toNs(toDate, true),
    sourceType:
      sourceFilter === "all" ? undefined : (sourceFilter as TrafficSource),
    page: pageFilter || undefined,
  };

  const {
    data: rawData = [],
    isLoading,
    refetch,
    isFetching,
  } = useTrafficReport(query);
  const deleteTraffic = useDeleteTraffic();

  // Client-side referrer filter (backend doesn't filter by referrer)
  const filtered = useMemo(() => {
    if (!referrerFilter.trim()) return rawData;
    return rawData.filter((e) =>
      e.referrer.toLowerCase().includes(referrerFilter.toLowerCase()),
    );
  }, [rawData, referrerFilter]);

  // Sorting
  const [sortCol, setSortCol] = useState<SortCol>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "timestamp") {
        cmp =
          a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
      } else if (sortCol === "page") {
        cmp = a.page.localeCompare(b.page);
      } else if (sortCol === "referrer") {
        cmp = a.referrer.localeCompare(b.referrer);
      } else if (sortCol === "sourceType") {
        cmp = a.sourceType.localeCompare(b.sourceType);
      } else if (sortCol === "sessionId") {
        cmp = a.sessionId.localeCompare(b.sessionId);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  // Pagination
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((r) => r.id)));
    }
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkDeleteOpen(true);
  }

  function confirmBulkDelete() {
    const ids = Array.from(selected);
    deleteTraffic.mutate(ids, {
      onSuccess: () => setSelected(new Set()),
    });
    setBulkDeleteOpen(false);
  }

  // Export
  const [exportOpen, setExportOpen] = useState(false);
  // Bulk delete confirm
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Summary cards
  const uniqueSessions = new Set(filtered.map((e) => e.sessionId)).size;
  const internalCount = filtered.filter(
    (e) => e.sourceType === TrafficSource.internal,
  ).length;
  const externalCount = filtered.filter(
    (e) => e.sourceType === TrafficSource.external,
  ).length;
  const directCount = filtered.filter(
    (e) => e.sourceType === TrafficSource.direct,
  ).length;

  // Preset date ranges
  const presets = [
    { label: "Today", from: today(), to: today() },
    { label: "Last 7 days", from: daysAgo(7), to: today() },
    { label: "Last 30 days", from: daysAgo(30), to: today() },
    { label: "Last 90 days", from: daysAgo(90), to: today() },
  ];

  function SortHeader({
    col,
    children,
  }: {
    col: SortCol;
    children: React.ReactNode;
  }) {
    return (
      <button
        type="button"
        onClick={() => handleSort(col)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-ocid={`traffic-sort-${col}`}
      >
        {children}
        <ArrowUpDown
          className={cn(
            "size-3",
            sortCol === col ? "text-accent" : "text-muted-foreground/40",
          )}
        />
      </button>
    );
  }

  return (
    <div className="space-y-5" data-ocid="traffic-report-page">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Traffic Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Internal traffic, external referrals, and direct visits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 h-8"
              onClick={handleBulkDelete}
              disabled={deleteTraffic.isPending}
              data-ocid="traffic-bulk-delete-btn"
            >
              <Trash2 className="size-3.5" />
              Delete {selected.size} selected
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => refetch()}
            disabled={isFetching}
            data-ocid="traffic-refresh-btn"
          >
            <RefreshCw
              className={cn("size-3.5", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setExportOpen(true)}
            data-ocid="traffic-export-btn"
          >
            <Download className="size-3.5" />
            Export
          </Button>
          {/* Module ON/OFF */}
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Module</span>
            <Switch
              checked={moduleEnabled}
              onCheckedChange={toggleModule}
              aria-label="Toggle traffic module"
              data-ocid="traffic-module-toggle"
            />
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-4 px-1.5",
                moduleEnabled
                  ? "border-primary/25 text-primary bg-primary/5"
                  : "border-border text-muted-foreground",
              )}
            >
              {moduleEnabled ? "ON" : "OFF"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Module disabled banner */}
      {!moduleEnabled && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <TrendingUp className="size-4 shrink-0 text-destructive" />
          <span>
            Traffic tracking is disabled. Enable the module to view reports.
          </span>
        </div>
      )}

      {moduleEnabled && (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                label: "Total Records",
                value: filtered.length,
                color: "text-foreground",
              },
              {
                label: "Internal",
                value: internalCount,
                color: "text-blue-400",
              },
              {
                label: "External",
                value: externalCount,
                color: "text-emerald-400",
              },
              { label: "Direct", value: directCount, color: "text-violet-400" },
              {
                label: "Unique Sessions",
                value: uniqueSessions,
                color: "text-amber-400",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-card border border-border rounded-xl p-3 text-center"
                data-ocid={`traffic-summary-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <p className={cn("text-2xl font-display font-bold", color)}>
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {/* Date presets */}
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  variant={
                    fromDate === p.from && toDate === p.to
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateSearch({ from: p.from, to: p.to })}
                  data-ocid={`traffic-preset-${p.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Filter row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => updateSearch({ from: e.target.value })}
                  className="h-8 text-xs"
                  data-ocid="traffic-filter-from"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => updateSearch({ to: e.target.value })}
                  className="h-8 text-xs"
                  data-ocid="traffic-filter-to"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source Type</Label>
                <Select
                  value={sourceFilter}
                  onValueChange={(v) => updateSearch({ sourceType: v })}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-ocid="traffic-filter-source"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value={TrafficSource.internal}>
                      Internal
                    </SelectItem>
                    <SelectItem value={TrafficSource.external}>
                      External
                    </SelectItem>
                    <SelectItem value={TrafficSource.direct}>Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Page Path</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search page…"
                    value={pageFilter}
                    onChange={(e) => updateSearch({ page: e.target.value })}
                    className="h-8 text-xs pl-7"
                    data-ocid="traffic-filter-page"
                  />
                  {pageFilter && (
                    <button
                      type="button"
                      onClick={() => updateSearch({ page: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Referrer Domain</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search referrer…"
                    value={referrerFilter}
                    onChange={(e) => updateSearch({ referrer: e.target.value })}
                    className="h-8 text-xs pl-7"
                    data-ocid="traffic-filter-referrer"
                  />
                  {referrerFilter && (
                    <button
                      type="button"
                      onClick={() => updateSearch({ referrer: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 gap-3 text-center"
                data-ocid="traffic-empty-state"
              >
                <FileText className="size-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">
                  No traffic events found
                </p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting the date range or source type filter
                </p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 py-2.5 text-left w-8">
                          <input
                            type="checkbox"
                            checked={
                              paginated.length > 0 &&
                              selected.size === paginated.length
                            }
                            onChange={toggleAll}
                            className="rounded"
                            aria-label="Select all"
                            data-ocid="traffic-select-all"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <SortHeader col="timestamp">Date / Time</SortHeader>
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <SortHeader col="page">Page</SortHeader>
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <SortHeader col="referrer">Referrer</SortHeader>
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <SortHeader col="sourceType">Source</SortHeader>
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <SortHeader col="sessionId">Session ID</SortHeader>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((row) => {
                        const { date, time } = formatDateTime(row.timestamp);
                        const isSelected = selected.has(row.id);
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              "border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors",
                              isSelected && "bg-accent/5",
                            )}
                            data-ocid={`traffic-row-${row.id}`}
                          >
                            <td className="px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRow(row.id)}
                                className="rounded"
                                data-ocid={`traffic-row-check-${row.id}`}
                              />
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="text-foreground">{date}</span>
                              <span className="text-muted-foreground ml-1.5">
                                {time}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 max-w-[200px]">
                              <span
                                className="text-foreground font-mono truncate block"
                                title={row.page}
                              >
                                {row.page}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 max-w-[160px]">
                              <span
                                className="text-muted-foreground truncate block"
                                title={row.referrer}
                              >
                                {row.referrer || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <SourceBadge source={row.sourceType} />
                            </td>
                            <td className="px-3 py-2.5 max-w-[120px]">
                              <span
                                className="text-muted-foreground font-mono text-[11px] truncate block"
                                title={row.sessionId}
                              >
                                {row.sessionId.slice(0, 8)}…
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-muted/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, sorted.length)} of{" "}
                      {sorted.length}
                    </span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        setPageSize(Number(v) as (typeof PAGE_SIZES)[number]);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        className="h-6 w-16 text-xs"
                        data-ocid="traffic-page-size"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZES.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>per page</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      data-ocid="traffic-prev-page"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      data-ocid="traffic-next-page"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        data={sorted}
      />

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} event{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size} traffic event
              {selected.size !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="traffic-bulk-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
