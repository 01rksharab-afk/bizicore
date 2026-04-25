import { useModuleVisibility } from "@/components/ModulePageLayout";
import { TrafficAnalyticsWidget } from "@/components/TrafficAnalyticsWidget";
import { ControlGroup } from "@/components/ui/ControlGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrafficCapture } from "@/hooks/useTraffic";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Clock,
  Columns3,
  DollarSign,
  Download,
  Factory,
  FileText,
  Gift,
  Globe,
  LayoutGrid,
  MapPin,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Terminal,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleCard {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  count: string;
  lastActivity: string;
  href: string;
  color: string;
}

interface ActivityItem {
  id: string;
  moduleIcon: React.ReactNode;
  moduleName: string;
  action: string;
  reference: string;
  timestamp: string;
  moduleColor: string;
}

interface QuickStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  href: string;
}

// ─── Module Data ──────────────────────────────────────────────────────────────

const MODULE_CARDS: ModuleCard[] = [
  {
    key: "crm",
    label: "CRM",
    icon: <Users className="size-5" />,
    description: "Contacts, leads, and deal pipeline management",
    count: "34 records",
    lastActivity: "Today",
    href: "/crm/contacts",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    key: "finance",
    label: "Finance",
    icon: <DollarSign className="size-5" />,
    description: "Revenue metrics, budgets, and cash flow",
    count: "12 records",
    lastActivity: "Today",
    href: "/finance",
    color: "text-emerald-400 bg-emerald-500/10",
  },
  {
    key: "accounting",
    label: "Accounting",
    icon: <BookOpen className="size-5" />,
    description: "Ledgers, journal vouchers, and chart of accounts",
    count: "87 records",
    lastActivity: "Yesterday",
    href: "/accounting/transactions",
    color: "text-violet-400 bg-violet-500/10",
  },
  {
    key: "sales-orders",
    label: "Sales Orders",
    icon: <ShoppingCart className="size-5" />,
    description: "Invoices, quotations, POS, and sales returns",
    count: "56 records",
    lastActivity: "Today",
    href: "/sales/orders",
    color: "text-orange-400 bg-orange-500/10",
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: <Receipt className="size-5" />,
    description: "Purchase orders, bills, payments, and returns",
    count: "29 records",
    lastActivity: "Today",
    href: "/purchases/orders",
    color: "text-pink-400 bg-pink-500/10",
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: <Package className="size-5" />,
    description: "Items, stock levels, categories, and HSN codes",
    count: "142 records",
    lastActivity: "2 hours ago",
    href: "/inventory",
    color: "text-cyan-400 bg-cyan-500/10",
  },
  {
    key: "gst",
    label: "GST Filing",
    icon: <FileText className="size-5" />,
    description: "GST returns, GSTR-2A, GSTR-9, and refunds",
    count: "8 records",
    lastActivity: "3 days ago",
    href: "/gst",
    color: "text-yellow-400 bg-yellow-500/10",
  },
  {
    key: "logistics",
    label: "Logistics",
    icon: <Truck className="size-5" />,
    description: "Shipments, couriers, and delivery tracking",
    count: "11 records",
    lastActivity: "Today",
    href: "/logistics",
    color: "text-rose-400 bg-rose-500/10",
  },
  {
    key: "b2b",
    label: "B2B Portals",
    icon: <Globe className="size-5" />,
    description: "IndiaMART, TradeIndia, and marketplace integrations",
    count: "5 channels",
    lastActivity: "1 hour ago",
    href: "/b2b",
    color: "text-sky-400 bg-sky-500/10",
  },
  {
    key: "reports",
    label: "Reports",
    icon: <BarChart3 className="size-5" />,
    description: "Inventory, MIS, and financial statement reports",
    count: "8 reports",
    lastActivity: "Yesterday",
    href: "/reports/inventory",
    color: "text-amber-400 bg-amber-500/10",
  },
  {
    key: "erp-manufacturing",
    label: "ERP Manufacturing",
    icon: <Factory className="size-5" />,
    description: "BOM, work orders, production planning, and QC",
    count: "24 records",
    lastActivity: "Today",
    href: "/erp/work-orders",
    color: "text-orange-400 bg-orange-500/10",
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    icon: <ShieldCheck className="size-5" />,
    description: "User roles, screen access, and custom permissions",
    count: "6 roles",
    lastActivity: "1 week ago",
    href: "/admin/roles",
    color: "text-red-400 bg-red-500/10",
  },
  {
    key: "configuration",
    label: "Configuration",
    icon: <Settings className="size-5" />,
    description: "Currency, date format, integrations, and toggles",
    count: "42 settings",
    lastActivity: "3 days ago",
    href: "/admin/configuration",
    color: "text-slate-400 bg-slate-500/10",
  },
  {
    key: "locations",
    label: "Location & Groups",
    icon: <MapPin className="size-5" />,
    description: "Locations, stock branches, and user groups",
    count: "9 records",
    lastActivity: "1 week ago",
    href: "/admin/locations",
    color: "text-green-400 bg-green-500/10",
  },
  {
    key: "import-export",
    label: "Import & Export",
    icon: <Download className="size-5" />,
    description: "Bulk data upload and download for all modules",
    count: "0 records",
    lastActivity: "Never",
    href: "/admin/import-export",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: <CheckSquare className="size-5" />,
    description: "Team tasks, broadcasts, rewards, and reviews",
    count: "18 tasks",
    lastActivity: "Today",
    href: "/settings",
    color: "text-fuchsia-400 bg-fuchsia-500/10",
  },
  {
    key: "incentives",
    label: "Incentive Management",
    icon: <Gift className="size-5" />,
    description: "Category-level incentive rules and tracking",
    count: "4 schemes",
    lastActivity: "5 days ago",
    href: "/admin/incentives",
    color: "text-yellow-400 bg-yellow-500/10",
  },
];

// ─── Quick Stats ──────────────────────────────────────────────────────────────

const QUICK_STATS: QuickStat[] = [
  {
    label: "Contacts",
    value: "34",
    icon: <Users className="size-4" />,
    href: "/crm/contacts",
  },
  {
    label: "Leads",
    value: "12",
    icon: <Activity className="size-4" />,
    href: "/crm/leads",
  },
  {
    label: "Invoices",
    value: "56",
    icon: <FileText className="size-4" />,
    href: "/invoicing",
  },
  {
    label: "Purchase Orders",
    value: "29",
    icon: <Receipt className="size-4" />,
    href: "/purchases/orders",
  },
  {
    label: "Inventory Items",
    value: "142",
    icon: <Package className="size-4" />,
    href: "/inventory",
  },
  {
    label: "Sales Orders",
    value: "38",
    icon: <ShoppingCart className="size-4" />,
    href: "/sales/orders",
  },
  {
    label: "Work Orders",
    value: "11",
    icon: <Factory className="size-4" />,
    href: "/erp/work-orders",
  },
];

// ─── Recent Activity ──────────────────────────────────────────────────────────

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    moduleIcon: <FileText className="size-3.5" />,
    moduleName: "Invoicing",
    action: "New Invoice created",
    reference: "INV-2024-0089",
    timestamp: "2 minutes ago",
    moduleColor: "text-orange-400 bg-orange-500/10",
  },
  {
    id: "2",
    moduleIcon: <Users className="size-3.5" />,
    moduleName: "CRM",
    action: "Contact added",
    reference: "Rajesh Kumar",
    timestamp: "15 minutes ago",
    moduleColor: "text-blue-400 bg-blue-500/10",
  },
  {
    id: "3",
    moduleIcon: <Receipt className="size-3.5" />,
    moduleName: "Purchases",
    action: "Purchase Order updated",
    reference: "PO-2024-0123",
    timestamp: "1 hour ago",
    moduleColor: "text-pink-400 bg-pink-500/10",
  },
  {
    id: "4",
    moduleIcon: <Package className="size-3.5" />,
    moduleName: "Inventory",
    action: "Stock level adjusted",
    reference: "SKU-BOLT-M10",
    timestamp: "2 hours ago",
    moduleColor: "text-cyan-400 bg-cyan-500/10",
  },
  {
    id: "5",
    moduleIcon: <Factory className="size-3.5" />,
    moduleName: "ERP",
    action: "Work Order started",
    reference: "WO-2024-0044",
    timestamp: "3 hours ago",
    moduleColor: "text-orange-400 bg-orange-500/10",
  },
  {
    id: "6",
    moduleIcon: <ShoppingCart className="size-3.5" />,
    moduleName: "Sales",
    action: "Quotation approved",
    reference: "QT-2024-0067",
    timestamp: "4 hours ago",
    moduleColor: "text-orange-400 bg-orange-500/10",
  },
  {
    id: "8",
    moduleIcon: <BookOpen className="size-3.5" />,
    moduleName: "Accounting",
    action: "Journal Voucher posted",
    reference: "JV-2024-0211",
    timestamp: "Yesterday",
    moduleColor: "text-violet-400 bg-violet-500/10",
  },
  {
    id: "9",
    moduleIcon: <Truck className="size-3.5" />,
    moduleName: "Logistics",
    action: "Shipment dispatched",
    reference: "SHP-2024-0031",
    timestamp: "Yesterday",
    moduleColor: "text-rose-400 bg-rose-500/10",
  },
  {
    id: "10",
    moduleIcon: <Globe className="size-3.5" />,
    moduleName: "B2B Portal",
    action: "Lead received from IndiaMART",
    reference: "LEAD-IM-7823",
    timestamp: "2 days ago",
    moduleColor: "text-sky-400 bg-sky-500/10",
  },
  {
    id: "11",
    moduleIcon: <DollarSign className="size-3.5" />,
    moduleName: "Finance",
    action: "Budget updated",
    reference: "Q4-2024 Budget",
    timestamp: "2 days ago",
    moduleColor: "text-emerald-400 bg-emerald-500/10",
  },
];

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "New Invoice",
    icon: <Plus className="size-3.5" />,
    href: "/invoicing/new",
    ocid: "console-qa-invoice",
  },
  {
    label: "New Contact",
    icon: <Plus className="size-3.5" />,
    href: "/crm/contacts/new",
    ocid: "console-qa-contact",
  },
  {
    label: "New Purchase Order",
    icon: <Plus className="size-3.5" />,
    href: "/purchases/orders",
    ocid: "console-qa-po",
  },
  {
    label: "New Sale Order",
    icon: <Plus className="size-3.5" />,
    href: "/sales/orders",
    ocid: "console-qa-so",
  },
  {
    label: "Add Inventory Item",
    icon: <Plus className="size-3.5" />,
    href: "/inventory/new",
    ocid: "console-qa-inventory",
  },
  {
    label: "New Work Order",
    icon: <Plus className="size-3.5" />,
    href: "/erp/work-orders",
    ocid: "console-qa-workorder",
  },
  {
    label: "Traffic Report",
    icon: <TrendingUp className="size-3.5" />,
    href: "/console/traffic",
    ocid: "console-qa-traffic",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-display font-semibold text-foreground leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function ModuleCardTile({ card }: { card: ModuleCard }) {
  const { enabled, setModuleVisibility } = useModuleVisibility(card.key);

  return (
    <div
      className={cn(
        "group bg-card border border-border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200",
        "hover:shadow-md hover:border-accent/30",
        !enabled && "opacity-60",
      )}
      data-ocid={`console-module-card-${card.key}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0",
            card.color,
          )}
        >
          {card.icon}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-4.5 px-1.5 font-medium leading-none",
              enabled
                ? "border-primary/25 text-primary bg-primary/5"
                : "border-border text-muted-foreground",
            )}
          >
            {enabled ? "ON" : "OFF"}
          </Badge>
          <button
            type="button"
            onClick={() => setModuleVisibility(!enabled)}
            aria-label={`Toggle ${card.label}`}
            data-ocid={`console-module-toggle-${card.key}`}
            className={cn(
              "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              enabled ? "bg-primary" : "bg-muted-foreground/30",
            )}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={cn(
                "pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                enabled ? "translate-x-3" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
          {card.label}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {card.description}
        </p>
      </div>

      {/* Card meta */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5">
        <span className="font-medium text-foreground">{card.count}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {card.lastActivity}
        </span>
      </div>

      {/* Go to Module */}
      <Link
        to={card.href}
        data-ocid={`console-module-goto-${card.key}`}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground",
          "hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors duration-150",
          !enabled && "pointer-events-none opacity-50",
        )}
      >
        Go to {card.label}
        <ChevronRight className="size-3" />
      </Link>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4"
      data-ocid="console-activity-feed"
    >
      <SectionHeader
        icon={<Activity className="size-4" />}
        title="Recent Activity"
        subtitle="Latest actions across all modules"
      />
      <div className="space-y-1">
        {RECENT_ACTIVITY.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
            data-ocid={`console-activity-${item.id}`}
          >
            <div
              className={cn(
                "size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                item.moduleColor,
              )}
            >
              {item.moduleIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-foreground">
                  {item.action}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                  {item.reference}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground/70">
                  {item.moduleName}
                </span>
                <span className="text-[10px] text-muted-foreground/50">·</span>
                <span className="text-[11px] text-muted-foreground/70">
                  {item.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisibilityManager() {
  const [localStates, setLocalStates] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      for (const m of MODULE_CARDS) {
        try {
          const stored = localStorage.getItem(`module_visibility_${m.key}`);
          map[m.key] = stored === null ? true : stored === "true";
        } catch {
          map[m.key] = true;
        }
      }
      return map;
    },
  );

  function toggle(key: string) {
    const next = !localStates[key];
    setLocalStates((prev) => ({ ...prev, [key]: next }));
    try {
      localStorage.setItem(`module_visibility_${key}`, String(next));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore
    }
  }

  function showAll() {
    const next: Record<string, boolean> = {};
    for (const m of MODULE_CARDS) {
      next[m.key] = true;
      try {
        localStorage.setItem(`module_visibility_${m.key}`, "true");
      } catch {
        // ignore
      }
    }
    setLocalStates(next);
    window.dispatchEvent(new Event("storage"));
  }

  function hideAll() {
    const next: Record<string, boolean> = {};
    for (const m of MODULE_CARDS) {
      next[m.key] = false;
      try {
        localStorage.setItem(`module_visibility_${m.key}`, "false");
      } catch {
        // ignore
      }
    }
    setLocalStates(next);
    window.dispatchEvent(new Event("storage"));
  }

  const visibleCount = Object.values(localStates).filter(Boolean).length;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4"
      data-ocid="console-visibility-manager"
    >
      <SectionHeader
        icon={<LayoutGrid className="size-4" />}
        title="Module Visibility"
        subtitle={`${visibleCount} of ${MODULE_CARDS.length} modules visible`}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs"
            onClick={showAll}
            data-ocid="console-visibility-show-all"
          >
            Show All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs"
            onClick={hideAll}
            data-ocid="console-visibility-hide-all"
          >
            Hide All
          </Button>
        </div>
      </SectionHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODULE_CARDS.map((m) => {
          const on = localStates[m.key] ?? true;
          return (
            <div
              key={m.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted/30 transition-colors"
              data-ocid={`console-vis-row-${m.key}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "size-6 rounded-md flex items-center justify-center shrink-0",
                    m.color,
                  )}
                >
                  <span className="[&_svg]:size-3">{m.icon}</span>
                </div>
                <span className="text-xs font-medium text-foreground truncate">
                  {m.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] h-4 px-1.5 font-medium leading-none",
                    on
                      ? "border-primary/25 text-primary bg-primary/5"
                      : "border-border text-muted-foreground bg-muted/30",
                  )}
                >
                  {on ? "Visible" : "Hidden"}
                </Badge>
                <button
                  type="button"
                  onClick={() => toggle(m.key)}
                  aria-label={`Toggle ${m.label} visibility`}
                  data-ocid={`console-vis-toggle-${m.key}`}
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                  role="switch"
                  aria-checked={on}
                >
                  <span
                    className={cn(
                      "pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                      on ? "translate-x-3" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Console Page ─────────────────────────────────────────────────────────────

export default function ConsolePage() {
  useTrafficCapture();
  const { enabled, setModuleVisibility } = useModuleVisibility("console");
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<"2col" | "3col">("3col");

  // Export summary as CSV
  function handleExportSummary() {
    const rows = [
      ["Module", "Records", "Last Activity", "Visible"],
      ...MODULE_CARDS.map((m) => {
        const vis = (() => {
          try {
            const s = localStorage.getItem(`module_visibility_${m.key}`);
            return s === null ? true : s === "true";
          } catch {
            return true;
          }
        })();
        return [m.label, m.count, m.lastActivity, vis ? "Yes" : "No"];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bizcore-console-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filter module cards based on search
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return MODULE_CARDS;
    const q = searchQuery.toLowerCase();
    return MODULE_CARDS.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Quick link search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MODULE_CARDS.filter((m) => m.label.toLowerCase().includes(q)).slice(
      0,
      5,
    );
  }, [searchQuery]);

  return (
    <div className="space-y-5" data-ocid="console-page">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Terminal className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Console
            </h1>
            <p className="text-sm text-muted-foreground">
              Mission Control — central hub for all BizCore modules
            </p>
          </div>
        </div>

        <ControlGroup
          enabled={enabled}
          onToggle={setModuleVisibility}
          toggleLabel="Console"
          showToggle
          swiftOptions={[
            { value: "3col", label: "3-Col" },
            { value: "2col", label: "2-Col" },
          ]}
          swiftValue={layout}
          onSwiftChange={(v) => setLayout(v as "2col" | "3col")}
          buttons={[
            {
              label: "Export Summary",
              icon: <Download className="size-3.5" />,
              onClick: handleExportSummary,
              variant: "outline",
              "data-ocid": "console-export-btn",
            },
          ]}
        />
      </div>

      {/* Disabled banner */}
      {!enabled && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <Terminal className="size-4 shrink-0 text-destructive" />
          <span>
            <span className="font-medium text-foreground">Console</span> is
            disabled. Enable it to interact with modules.
          </span>
        </div>
      )}

      <div
        className={cn(
          "space-y-5",
          !enabled && "pointer-events-none opacity-60 select-none",
        )}
      >
        {/* ── Global Search + Quick Actions ────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search modules, features, pages…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
              data-ocid="console-search-input"
            />
            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                {searchResults.map((m) => (
                  <Link
                    key={m.key}
                    to={m.href}
                    onClick={() => setSearchQuery("")}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                    data-ocid={`console-search-result-${m.key}`}
                  >
                    <div
                      className={cn(
                        "size-6 rounded-md flex items-center justify-center shrink-0",
                        m.color,
                      )}
                    >
                      <span className="[&_svg]:size-3">{m.icon}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {m.label}
                    </span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {m.href}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <Link key={qa.ocid} to={qa.href}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    data-ocid={qa.ocid}
                  >
                    {qa.icon}
                    {qa.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Stats ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="size-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">
              Quick Stats
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
            {QUICK_STATS.map((stat) => (
              <Link
                key={stat.label}
                to={stat.href}
                data-ocid={`console-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2 hover:border-accent/30 hover:shadow-sm transition-all duration-150 cursor-pointer h-full">
                  <div className="size-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-display font-bold text-foreground leading-tight">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Traffic Analytics ─────────────────────────────── */}
        <TrafficAnalyticsWidget />

        {/* ── Module Cards Grid ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Columns3 className="size-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">
                All Modules
              </h2>
              {searchQuery && (
                <Badge variant="outline" className="text-xs">
                  {filteredCards.length} results
                </Badge>
              )}
            </div>
          </div>
          {filteredCards.length === 0 ? (
            <div
              className="bg-card border border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3"
              data-ocid="console-modules-empty"
            >
              <Search className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No modules match "{searchQuery}"
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-3",
                layout === "3col"
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2",
              )}
              data-ocid="console-modules-grid"
            >
              {filteredCards.map((card) => (
                <ModuleCardTile key={card.key} card={card} />
              ))}
            </div>
          )}
        </div>

        {/* ── Activity Feed + Visibility Manager ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ActivityFeed />
          <VisibilityManager />
        </div>
      </div>
    </div>
  );
}
