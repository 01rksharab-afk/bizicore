import type { CashFlowForecast, FinanceDashboard, OrgSummary } from "@/backend";
import { TransactionCategory } from "@/backend";
import { SectionErrorBoundary } from "@/components/Layout";
import { ExpensePieChart } from "@/components/charts/ExpensePieChart";
import { RevenueLineChart } from "@/components/charts/RevenueLineChart";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DashboardReportWidget,
  WidgetColor,
  WidgetSize,
} from "@/hooks/useAiChatbot";
import {
  useCreateDashboardReportWidget,
  useGetDashboardBackground,
  useListDashboardReportWidgets,
} from "@/hooks/useAiChatbot";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  GripHorizontal,
  LayoutGrid,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(cents: bigint, digits = 0): string {
  return `$${(Number(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function fmtNum(n: number, digits = 0): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

const CATEGORY_LABELS: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.travel]: "Travel",
  [TransactionCategory.software]: "Software",
  [TransactionCategory.equipment]: "Equipment",
  [TransactionCategory.contractorFees]: "Contractor Fees",
  [TransactionCategory.other]: "Other",
};

// ─── Section visibility (persisted in localStorage) ───────────────────────────

const SECTION_KEYS = {
  overview: "dash_sec_overview",
  finance: "dash_sec_finance",
  customReports: "dash_sec_customreports",
} as const;

function useSectionToggle(key: string, defaultValue = true) {
  const [visible, setVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? defaultValue : stored === "1";
    } catch {
      return defaultValue;
    }
  });
  const toggle = () => {
    setVisible((v) => {
      const next = !v;
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return [visible, toggle] as const;
}

// ─── Module overview data ─────────────────────────────────────────────────────

interface ModuleCard {
  id: string;
  label: string;
  icon: React.ReactNode;
  metrics: { label: string; value: string }[];
  href: string;
  color: string;
  badge?: string;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    id: "crm",
    label: "CRM / Contacts",
    icon: <Users className="size-4" />,
    metrics: [
      { label: "Total Contacts", value: "128" },
      { label: "Active Leads", value: "34" },
    ],
    href: "/crm/contacts",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badge: "3 new",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: <Package className="size-4" />,
    metrics: [
      { label: "Total Items", value: "482" },
      { label: "Low Stock Alerts", value: "7" },
    ],
    href: "/inventory",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badge: "7 alerts",
  },
  {
    id: "sales",
    label: "Sales / Invoices",
    icon: <Receipt className="size-4" />,
    metrics: [
      { label: "Invoices (MTD)", value: "56" },
      { label: "Revenue (MTD)", value: "₹4.2L" },
    ],
    href: "/sales/orders",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: <ShoppingCart className="size-4" />,
    metrics: [
      { label: "Purchase Orders", value: "29" },
      { label: "Pending Bills", value: "8" },
    ],
    href: "/purchases/orders",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: <BookOpen className="size-4" />,
    metrics: [
      { label: "Transactions", value: "312" },
      { label: "Balance", value: "₹12.6L" },
    ],
    href: "/accounting/transactions",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "gst",
    label: "GST / E-Invoice",
    icon: <FileText className="size-4" />,
    metrics: [
      { label: "Returns Filed", value: "3" },
      { label: "Pending", value: "1" },
    ],
    href: "/gst",
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    id: "erp",
    label: "ERP / Manufacturing",
    icon: <Zap className="size-4" />,
    metrics: [
      { label: "Active Work Orders", value: "12" },
      { label: "In Production", value: "4" },
    ],
    href: "/erp/work-orders",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: <ClipboardList className="size-4" />,
    metrics: [
      { label: "Pending Tasks", value: "18" },
      { label: "Completed Today", value: "6" },
    ],
    href: "/console",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    badge: "18 pending",
  },
  {
    id: "employees",
    label: "Employees",
    icon: <ShieldCheck className="size-4" />,
    metrics: [
      { label: "Total Staff", value: "43" },
      { label: "Present Today", value: "38" },
    ],
    href: "/hr/employees",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "finance",
    label: "Finance",
    icon: <Wallet className="size-4" />,
    metrics: [
      { label: "Budget Used", value: "64%" },
      { label: "Expenses (MTD)", value: "₹2.8L" },
    ],
    href: "/finance",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
];

// ─── Company Switcher ─────────────────────────────────────────────────────────

function CompanyHeader({
  activeOrg,
  orgs,
  setActiveOrg,
}: {
  activeOrg: OrgSummary;
  orgs: OrgSummary[];
  setActiveOrg: (org: OrgSummary) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      data-ocid="company-header"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
          <Building2 className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Active Company
          </p>
          <h1 className="text-xl font-display font-bold text-foreground truncate">
            {activeOrg.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {orgs.length} {orgs.length === 1 ? "organization" : "organizations"}{" "}
            accessible
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-xs font-medium">
          Home Dashboard
        </Badge>

        {orgs.length > 1 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-medium"
                data-ocid="company-swift-btn"
              >
                <Zap className="size-3.5 text-accent" />
                Swift Company
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2"
              align="end"
              data-ocid="company-switcher-popover"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1 mb-1">
                Switch Company
              </p>
              <div className="space-y-0.5">
                {orgs.map((org) => (
                  <button
                    key={String(org.id)}
                    type="button"
                    onClick={() => {
                      setActiveOrg(org);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
                      org.id === activeOrg.id
                        ? "bg-accent/10 text-accent font-semibold"
                        : "hover:bg-muted text-foreground",
                    )}
                    data-ocid={`switch-org-${String(org.id)}`}
                  >
                    <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="size-3.5 text-muted-foreground" />
                    </div>
                    <span className="truncate">{org.name}</span>
                    {org.id === activeOrg.id && (
                      <span className="ml-auto text-accent">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {orgs.length <= 1 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-medium opacity-60 cursor-default"
            data-ocid="company-swift-btn-single"
          >
            <Building2 className="size-3.5" />
            {activeOrg.name}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Quick stats bar ──────────────────────────────────────────────────────────

function QuickStatsBar() {
  const stats = [
    {
      label: "Total Contacts",
      value: "128",
      icon: <Users className="size-3.5" />,
    },
    {
      label: "Open Invoices",
      value: "56",
      icon: <Receipt className="size-3.5" />,
    },
    {
      label: "Inventory Items",
      value: "482",
      icon: <Box className="size-3.5" />,
    },
    {
      label: "Pending Tasks",
      value: "18",
      icon: <ClipboardList className="size-3.5" />,
    },
    { label: "Work Orders", value: "12", icon: <Zap className="size-3.5" /> },
    {
      label: "Active Staff",
      value: "38",
      icon: <ShieldCheck className="size-3.5" />,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
      data-ocid="quick-stats-bar"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5"
        >
          <div className="size-7 rounded-md bg-accent/10 flex items-center justify-center text-accent shrink-0">
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-display font-bold text-foreground leading-none">
              {s.value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Module Overview Card ─────────────────────────────────────────────────────

function ModuleOverviewCard({ card }: { card: ModuleCard }) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors group"
      data-ocid={`module-card-${card.id}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center",
            card.color,
          )}
        >
          {card.icon}
        </div>
        {card.badge && (
          <Badge
            variant="secondary"
            className="text-[10px] h-5 px-1.5 font-medium"
          >
            {card.badge}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{card.label}</p>
        <div className="mt-2 space-y-1">
          {card.metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{m.label}</span>
              <span className="font-semibold text-foreground">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
      <a
        href={card.href}
        className="flex items-center gap-1 text-xs font-medium text-accent hover:underline mt-auto"
        data-ocid={`module-card-view-${card.id}`}
      >
        View module
        <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </div>
  );
}

// ─── Section toggle header ────────────────────────────────────────────────────

function SectionHeader({
  title,
  visible,
  onToggle,
  children,
}: {
  title: string;
  visible: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground gap-1.5"
          onClick={onToggle}
          data-ocid={`section-toggle-${title.toLowerCase().replace(/\s/g, "-")}`}
        >
          {visible ? "Hide" : "Show"}
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              !visible && "-rotate-90",
            )}
          />
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground tracking-wide">
      {children}
    </h2>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend?: number;
  "data-ocid"?: string;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  trend,
  ...rest
}: MetricCardProps) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <div
      className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
      {...rest}
    >
      <div className="flex items-center justify-between">
        <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-destructive"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-display font-semibold text-foreground mt-0.5">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ─── Cash flow tooltip ────────────────────────────────────────────────────────

interface CashTooltipPayload {
  name: string;
  value: number;
  color: string;
}
interface CashTooltipProps {
  active?: boolean;
  payload?: CashTooltipPayload[];
  label?: string;
}

function CashFlowTooltip({ active, payload, label }: CashTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">{fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-card border border-border rounded-xl animate-pulse ${className}`}
    />
  );
}

function EmptyOrg() {
  return (
    <div
      className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4"
      data-ocid="dashboard-empty-org"
    >
      <div className="size-14 rounded-full bg-accent/10 flex items-center justify-center">
        <TrendingUp className="size-7 text-accent" />
      </div>
      <div>
        <h2 className="font-display font-semibold text-foreground">
          No organization selected
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Create or join an organization to start tracking your business.
        </p>
      </div>
    </div>
  );
}

// ─── Widget color classes ─────────────────────────────────────────────────────

const WIDGET_COLOR_STYLES: Record<string, string> = {
  default: "border-border",
  accent: "border-accent/30 bg-accent/5",
  emerald:
    "border-[oklch(var(--manufacturing-completed)/0.4)] bg-[oklch(var(--manufacturing-completed)/0.05)]",
  orange:
    "border-[oklch(var(--manufacturing-in-progress)/0.4)] bg-[oklch(var(--manufacturing-in-progress)/0.05)]",
  purple: "border-purple-500/30 bg-purple-500/5",
};

const SPARKLINE_DATA = [12, 19, 8, 24, 18, 32, 27, 35, 22, 41, 38, 45];

function SparkLine({ color }: { color: string }) {
  const max = Math.max(...SPARKLINE_DATA);
  const min = Math.min(...SPARKLINE_DATA);
  const points = SPARKLINE_DATA.map((v, i) => {
    const x = (i / (SPARKLINE_DATA.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 80;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg
      className="w-full h-12"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WIDGET_MOCK_VALUES: Record<
  string,
  { value: string; label: string; change: string }
> = {
  "manufacturing-output": {
    value: "1,256 units",
    label: "This Month",
    change: "+12.4%",
  },
  "inventory-turnover": {
    value: "4.2x",
    label: "Avg Turnover Rate",
    change: "+0.3x",
  },
  "sales-purchase": {
    value: "₹8.4L / ₹6.1L",
    label: "Sales vs Purchase",
    change: "+8.2%",
  },
  "gst-summary": {
    value: "₹1.24L",
    label: "Tax Liability MTD",
    change: "-2.1%",
  },
};

function ReportWidgetTile({ widget }: { widget: DashboardReportWidget }) {
  const mock = WIDGET_MOCK_VALUES[widget.reportType] ?? {
    value: "N/A",
    label: "Metric",
    change: "0%",
  };
  const isPositive = !mock.change.startsWith("-");
  const colorClass =
    WIDGET_COLOR_STYLES[widget.color] ?? WIDGET_COLOR_STYLES.default;
  const isLarge = widget.size === "lg" || widget.size === "xl";

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 flex flex-col gap-3",
        colorClass,
        isLarge && "col-span-2",
        widget.size === "sm" && "min-h-[120px]",
        widget.size === "md" && "min-h-[160px]",
        (widget.size === "lg" || widget.size === "xl") && "min-h-[200px]",
      )}
      data-ocid={`report-widget-${widget.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <BarChart3 className="size-3.5" />
          </div>
          <p className="text-sm font-medium text-foreground">{widget.title}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="text-muted-foreground/50 hover:text-muted-foreground"
            data-ocid="widget-drag-handle"
          >
            <GripHorizontal className="size-3.5" />
          </button>
          <button
            type="button"
            className="text-muted-foreground/50 hover:text-muted-foreground"
            data-ocid="widget-menu-btn"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xl font-display font-semibold text-foreground">
            {mock.value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{mock.label}</p>
        </div>
        {isLarge && <SparkLine color="oklch(var(--accent))" />}
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium mt-2",
            isPositive
              ? "text-[oklch(var(--manufacturing-completed))]"
              : "text-[oklch(var(--manufacturing-defect))]",
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {mock.change} vs last month
        </div>
      </div>
    </div>
  );
}

// ─── Add Widget Dialog ────────────────────────────────────────────────────────

const REPORT_TYPE_OPTIONS = [
  { value: "sales-purchase", label: "Sales Summary" },
  { value: "inventory-turnover", label: "Inventory Overview" },
  { value: "manufacturing-output", label: "Purchase Analytics" },
  { value: "finance-overview", label: "Finance Overview" },
  { value: "gst-summary", label: "GST Summary" },
];

const DESIGN_OPTIONS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
  { value: "summary", label: "Summary Card" },
];

const SIZE_OPTIONS: { value: WidgetSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const COLOR_PRESETS: {
  value: WidgetColor;
  label: string;
  className: string;
}[] = [
  { value: "default", label: "Default", className: "bg-border" },
  { value: "accent", label: "Accent", className: "bg-accent" },
  { value: "emerald", label: "Green", className: "bg-emerald-500" },
  { value: "orange", label: "Orange", className: "bg-orange-500" },
  { value: "purple", label: "Purple", className: "bg-purple-500" },
];

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: Omit<DashboardReportWidget, "id" | "createdAt">) => void;
}

function AddWidgetDialog({ open, onOpenChange, onAdd }: AddWidgetDialogProps) {
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("sales-purchase");
  const [size, setSize] = useState<WidgetSize>("md");
  const [color, setColor] = useState<WidgetColor>("accent");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      title:
        (title.trim() ||
          REPORT_TYPE_OPTIONS.find((r) => r.value === reportType)?.label) ??
        "Custom Report",
      reportType,
      size,
      color,
      enabled: true,
    });
    setTitle("");
    setReportType("sales-purchase");
    setSize("md");
    setColor("accent");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="add-widget-dialog">
        <DialogHeader>
          <DialogTitle>Add Custom Report Widget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="widget-title">Widget Title</Label>
            <Input
              id="widget-title"
              placeholder="e.g. Monthly Sales Summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-ocid="widget-title-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger data-ocid="widget-report-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Design</Label>
            <Select defaultValue="chart">
              <SelectTrigger data-ocid="widget-design-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESIGN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Size</Label>
            <Select
              value={size}
              onValueChange={(v) => setSize(v as WidgetSize)}
            >
              <SelectTrigger data-ocid="widget-size-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Accent Colour</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setColor(preset.value)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    preset.className,
                    color === preset.value
                      ? "border-foreground ring-2 ring-foreground/30"
                      : "border-transparent",
                  )}
                  aria-label={preset.label}
                  data-ocid={`widget-color-${preset.value}`}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="add-widget-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" data-ocid="add-widget-submit">
              Add Widget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Background wrapper ───────────────────────────────────────────────────────

function DashboardBackground({ children }: { children: React.ReactNode }) {
  const { bg } = useGetDashboardBackground();
  if (!bg.bgColor && !bg.wallpaperUrl) return <>{children}</>;
  return (
    <div className="relative">
      {(bg.bgColor || bg.wallpaperUrl) && (
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: bg.bgColor || undefined,
            backgroundImage: bg.wallpaperUrl
              ? `url(${bg.wallpaperUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {bg.wallpaperUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: bg.bgColor || "oklch(var(--background))",
                opacity: bg.wallpaperOpacity,
              }}
            />
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeOrg, orgs, setActiveOrg } = useActiveOrg();
  const { actor, isFetching } = useBackendActor();
  const { widgets } = useListDashboardReportWidgets();
  const { mutate: createWidget } = useCreateDashboardReportWidget();
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const [overviewVisible, toggleOverview] = useSectionToggle(
    SECTION_KEYS.overview,
  );
  const [financeVisible, toggleFinance] = useSectionToggle(
    SECTION_KEYS.finance,
  );
  const [customReportsVisible, toggleCustomReports] = useSectionToggle(
    SECTION_KEYS.customReports,
  );

  const {
    data: dashboard,
    isLoading: dashLoading,
    isError: financeError,
  } = useQuery<FinanceDashboard>({
    queryKey: ["financeDashboard", activeOrg?.id?.toString()],
    queryFn: async () => {
      if (!actor || !activeOrg) throw new Error("No org");
      return actor.getFinanceDashboard(activeOrg.id);
    },
    enabled: !!actor && !isFetching && !!activeOrg,
    staleTime: 60_000,
  });

  const { data: cashFlow = [], isLoading: cashLoading } = useQuery<
    CashFlowForecast[]
  >({
    queryKey: ["cashFlow", activeOrg?.id?.toString()],
    queryFn: async () => {
      if (!actor || !activeOrg) return [];
      return actor.getCashFlowForecast(activeOrg.id);
    },
    enabled: !!actor && !isFetching && !!activeOrg,
    staleTime: 60_000,
  });

  const cashChartData = useMemo(
    () =>
      cashFlow.slice(0, 90).map((cf, i) => ({
        day: `Day ${i + 1}`,
        balance: Number(cf.projectedBalance) / 100,
      })),
    [cashFlow],
  );

  const topExpenses = useMemo(() => {
    if (!dashboard) return [];
    return [...dashboard.expensesByCategory]
      .filter((e) => e.category !== TransactionCategory.revenue)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [dashboard]);

  const totalExpenses = useMemo(
    () => topExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [topExpenses],
  );
  const enabledWidgets = widgets.filter((w) => w.enabled);
  // loading = true only when fetching AND no error — prevents infinite loading state
  const loading = dashLoading && !financeError;

  if (!activeOrg) return <EmptyOrg />;

  return (
    <SectionErrorBoundary label="Dashboard">
      <DashboardBackground>
        <div className="space-y-6" data-ocid="dashboard-root">
          {/* ─── 1. Company Header + Swift Switcher ──────────────── */}
          <CompanyHeader
            activeOrg={activeOrg}
            orgs={orgs}
            setActiveOrg={setActiveOrg}
          />

          {/* ─── 2. Quick Stats Bar ───────────────────────────────── */}
          <QuickStatsBar />

          {/* ─── 3. All Modules Overview ──────────────────────────── */}
          <div data-ocid="section-overview">
            <SectionHeader
              title="All Modules Overview"
              visible={overviewVisible}
              onToggle={toggleOverview}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground gap-1"
              >
                <LayoutGrid className="size-3" />
                {MODULE_CARDS.length} modules
              </Button>
            </SectionHeader>
            {overviewVisible && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
                {MODULE_CARDS.map((card) => (
                  <ModuleOverviewCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>

          {/* ─── 4. Finance Dashboard Section ─────────────────────── */}
          <div data-ocid="section-finance">
            <SectionHeader
              title="Finance Dashboard"
              visible={financeVisible}
              onToggle={toggleFinance}
            />
            {financeVisible && (
              <div className="space-y-4 mt-3">
                {/* Finance error fallback */}
                {financeError && (
                  <div
                    className="bg-card border border-destructive/30 rounded-xl p-5 text-center text-sm text-muted-foreground"
                    data-ocid="finance-error"
                  >
                    <span className="text-destructive font-medium">
                      Finance data unavailable.
                    </span>{" "}
                    Metric cards show "—" until connection is restored.
                  </div>
                )}
                {/* Finance metric cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {loading && !financeError ? (
                    ["mtd", "mrr", "spent", "remaining"].map((k) => (
                      <CardSkeleton key={k} className="h-[130px]" />
                    ))
                  ) : financeError ? (
                    [
                      "Revenue MTD",
                      "MRR",
                      "Budget Spent",
                      "Budget Remaining",
                    ].map((label) => (
                      <MetricCard
                        key={label}
                        icon={<DollarSign className="size-4" />}
                        label={label}
                        value="—"
                        sub="Data unavailable"
                      />
                    ))
                  ) : (
                    <>
                      <MetricCard
                        data-ocid="metric-revenue-mtd"
                        icon={<DollarSign className="size-4" />}
                        label="Revenue MTD"
                        value={fmt(dashboard!.revenueMTD)}
                        sub="Month to date"
                        trend={Number(dashboard!.revenueGrowthPct)}
                      />
                      <MetricCard
                        data-ocid="metric-mrr"
                        icon={<TrendingUp className="size-4" />}
                        label="MRR"
                        value={fmt(dashboard!.mrr)}
                        sub="Monthly recurring"
                        trend={Number(dashboard!.revenueGrowthPct)}
                      />
                      <MetricCard
                        data-ocid="metric-budget-spent"
                        icon={<Wallet className="size-4" />}
                        label="Budget Spent"
                        value={fmt(dashboard!.budgetSpent)}
                        sub={`of ${fmt(dashboard!.budgetAllocated)} allocated`}
                      />
                      <MetricCard
                        data-ocid="metric-budget-remaining"
                        icon={<Wallet className="size-4" />}
                        label="Budget Remaining"
                        value={fmt(dashboard!.budgetRemaining)}
                        sub={`${Number(dashboard!.budgetUtilizationPct)}% utilization`}
                        trend={-(Number(dashboard!.budgetUtilizationPct) - 100)}
                      />
                    </>
                  )}
                </div>

                {/* Revenue + Expense charts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div
                    className="xl:col-span-2 bg-card border border-border rounded-xl p-5"
                    data-ocid="chart-revenue-trend"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <SectionTitle>12-Month Revenue Trend</SectionTitle>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-4 h-0.5 bg-accent rounded" />
                          Revenue
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-4 h-0.5 bg-[oklch(0.65_0.18_30)] rounded" />
                          Expenses
                        </span>
                      </div>
                    </div>
                    {loading ? (
                      <div className="h-[260px] animate-pulse bg-muted/30 rounded-lg" />
                    ) : !dashboard ? (
                      <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                        No revenue data available
                      </div>
                    ) : (
                      <RevenueLineChart data={dashboard!.monthlyRevenueTrend} />
                    )}
                  </div>
                  <div
                    className="bg-card border border-border rounded-xl p-5"
                    data-ocid="chart-expense-pie"
                  >
                    <SectionTitle>Expenses by Category</SectionTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                      Current period breakdown
                    </p>
                    {loading ? (
                      <div className="h-[200px] animate-pulse bg-muted/30 rounded-lg" />
                    ) : !dashboard ? (
                      <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                        No expense data available
                      </div>
                    ) : (
                      <ExpensePieChart data={dashboard!.expensesByCategory} />
                    )}
                  </div>
                </div>

                {/* Cash Flow + Top Expenses */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div
                    className="xl:col-span-2 bg-card border border-border rounded-xl p-5"
                    data-ocid="chart-cash-flow"
                  >
                    <div className="mb-4">
                      <SectionTitle>Cash Flow Forecast</SectionTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Projected balance over the next 90 days
                      </p>
                    </div>
                    {cashLoading ? (
                      <div className="h-[200px] animate-pulse bg-muted/30 rounded-lg" />
                    ) : cashChartData.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                        No forecast data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart
                          data={cashChartData}
                          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="cashGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="oklch(0.68 0.16 240)"
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="95%"
                                stopColor="oklch(0.68 0.16 240)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.26 0.022 235 / 0.5)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tick={{
                              fill: "oklch(0.52 0.015 235)",
                              fontSize: 10,
                            }}
                            axisLine={false}
                            tickLine={false}
                            interval={14}
                            dy={6}
                          />
                          <YAxis
                            tick={{
                              fill: "oklch(0.52 0.015 235)",
                              fontSize: 10,
                            }}
                            axisLine={false}
                            tickLine={false}
                            width={52}
                            tickFormatter={(v: number) =>
                              v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                            }
                          />
                          <Tooltip
                            content={<CashFlowTooltip />}
                            cursor={{
                              stroke: "oklch(0.26 0.022 235)",
                              strokeWidth: 1,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="oklch(0.68 0.16 240)"
                            strokeWidth={2}
                            fill="url(#cashGrad)"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div
                    className="bg-card border border-border rounded-xl p-5"
                    data-ocid="table-top-expenses"
                  >
                    <div className="mb-4">
                      <SectionTitle>Top Expense Categories</SectionTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        By total spend
                      </p>
                    </div>
                    {loading ? (
                      <div className="space-y-3">
                        {(["a", "b", "c", "d", "e"] as const).map((k) => (
                          <div
                            key={k}
                            className="h-9 animate-pulse bg-muted/30 rounded"
                          />
                        ))}
                      </div>
                    ) : topExpenses.length === 0 ? (
                      <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                        No expense data yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topExpenses.map((entry, idx) => {
                          const amount = Number(entry.amount);
                          const pct =
                            totalExpenses > 0
                              ? (amount / totalExpenses) * 100
                              : 0;
                          const label =
                            CATEGORY_LABELS[entry.category] ??
                            String(entry.category);
                          return (
                            <div
                              key={entry.category}
                              className="space-y-1"
                              data-ocid={`expense-row-${idx}`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground font-medium truncate min-w-0 mr-2">
                                  {label}
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {fmt(entry.amount)}
                                </span>
                              </div>
                              <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── 5. Custom Reports ────────────────────────────────── */}
          <div data-ocid="section-custom-reports">
            <SectionHeader
              title="Custom Reports"
              visible={customReportsVisible}
              onToggle={toggleCustomReports}
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7 px-2.5"
                onClick={() => setAddWidgetOpen(true)}
                data-ocid="add-widget-btn"
              >
                <Plus className="size-3" />
                Add Widget
              </Button>
            </SectionHeader>
            {customReportsVisible && (
              <div className="mt-3">
                {enabledWidgets.length === 0 ? (
                  <div
                    className="bg-card border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3"
                    data-ocid="custom-reports-empty"
                  >
                    <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <BarChart3 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        No custom report widgets yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add a widget to track key metrics directly on your
                        dashboard.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => setAddWidgetOpen(true)}
                      data-ocid="add-first-widget-btn"
                    >
                      <Plus className="size-3" />
                      Add your first widget
                    </Button>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                    data-ocid="custom-reports-grid"
                  >
                    {enabledWidgets.map((widget) => (
                      <ReportWidgetTile key={widget.id} widget={widget} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <AddWidgetDialog
            open={addWidgetOpen}
            onOpenChange={setAddWidgetOpen}
            onAdd={createWidget}
          />
        </div>
      </DashboardBackground>
    </SectionErrorBoundary>
  );
}
