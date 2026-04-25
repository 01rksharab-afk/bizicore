import { ControlGroup } from "@/components/ui/ControlGroup";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ErpStatus } from "@/hooks/useERP";
import { cn } from "@/lib/utils";
import { BarChart3, Download, PlusCircle, Search, Upload } from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function ErpStatusBadge({ status }: { status: ErpStatus }) {
  return (
    <span
      className={cn(
        "status-badge-manufacturing",
        status === "in-progress" && "status-in-progress",
        status === "completed" && "status-completed",
        status === "defect" && "status-defect",
        status === "pending" && "status-pending",
      )}
    >
      {status === "in-progress"
        ? "In Progress"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-muted", text: "text-muted-foreground" },
  medium: { bg: "bg-accent/10", text: "text-accent" },
  high: {
    bg: "bg-[oklch(var(--manufacturing-in-progress)/0.15)]",
    text: "text-[oklch(var(--manufacturing-in-progress))]",
  },
  urgent: { bg: "bg-destructive/10", text: "text-destructive" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const colors = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.low;
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-xs font-semibold",
        colors.bg,
        colors.text,
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// ─── ERP Module Header ────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "defect", label: "Defect" },
];

interface ErpModuleHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  moduleEnabled: boolean;
  onToggle: (v: boolean) => void;
  onNew: () => void;
  search: string;
  onSearch: (v: string) => void;
  statusFilter?: string;
  onStatusFilter?: (v: string) => void;
  onImport?: () => void;
  onExport?: () => void;
  onReport?: () => void;
}

export function ErpModuleHeader({
  title,
  description,
  icon,
  moduleEnabled,
  onToggle,
  onNew,
  search,
  onSearch,
  statusFilter = "all",
  onStatusFilter,
  onImport,
  onExport,
  onReport,
}: ErpModuleHeaderProps) {
  // Build action buttons for ControlGroup
  const actionButtons = [
    {
      label: "New",
      icon: <PlusCircle />,
      onClick: onNew,
      variant: "default" as const,
      "data-ocid": "erp-new-btn",
    },
    ...(onImport
      ? [
          {
            label: "Import",
            icon: <Upload />,
            onClick: onImport,
            variant: "outline" as const,
            "data-ocid": "erp-import-btn",
          },
        ]
      : []),
    ...(onExport
      ? [
          {
            label: "Export",
            icon: <Download />,
            onClick: onExport,
            variant: "outline" as const,
            "data-ocid": "erp-export-btn",
          },
        ]
      : []),
    ...(onReport
      ? [
          {
            label: "Report",
            icon: <BarChart3 />,
            onClick: onReport,
            variant: "outline" as const,
            "data-ocid": "erp-report-btn",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: icon + title + description */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Right: unified ControlGroup */}
        <ControlGroup
          enabled={moduleEnabled}
          onToggle={onToggle}
          toggleLabel="Module"
          buttons={moduleEnabled ? actionButtons : [actionButtons[0]]}
        />
      </div>

      {/* Search + filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search ${title}...`}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
            data-ocid="erp-search-input"
          />
        </div>
        {onStatusFilter && (
          <Select value={statusFilter} onValueChange={onStatusFilter}>
            <SelectTrigger
              className="h-8 w-36 text-xs"
              data-ocid="erp-status-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

// ─── Empty ERP state ──────────────────────────────────────────────────────────

export function ErpEmpty({ label }: { label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4">
      <div className="size-14 rounded-full bg-muted flex items-center justify-center text-2xl">
        🏭
      </div>
      <div>
        <p className="font-display font-semibold text-foreground">
          No {label} found
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first record to get started.
        </p>
      </div>
    </div>
  );
}

// ─── Table shell ──────────────────────────────────────────────────────────────

export function ErpTable({
  children,
  headers,
}: {
  children: React.ReactNode;
  headers: string[];
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// Re-export Badge for convenience (used in ERP pages)
export { Badge };
