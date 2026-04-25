import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import type { SidebarPanel, Theme } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Calculator,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Factory,
  FileText,
  LayoutDashboard,
  Moon,
  NotebookPen,
  Package,
  Palette,
  PenLine,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Terminal,
  Truck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BackgroundPanel } from "./panels/BackgroundPanel";
import { CalculatorPanel } from "./panels/CalculatorPanel";
import { NotebooksPanel } from "./panels/NotebooksPanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  activePanel: SidebarPanel;
  togglePanel: (p: SidebarPanel) => void;
  closePanel: () => void;
}

interface NavChild {
  label: string;
  href: string;
  badge?: string;
}

interface NavItemDef {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavChild[];
  visibilityKey?: string;
}

const navItems: NavItemDef[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    label: "Console",
    href: "/console",
    icon: <Terminal className="size-4" />,
  },
  {
    label: "CRM",
    icon: <Users className="size-4" />,
    children: [
      { label: "Contacts", href: "/crm/contacts" },
      { label: "Leads", href: "/crm/leads" },
      { label: "Deals", href: "/crm/deals" },
    ],
  },
  {
    label: "Finance",
    icon: <DollarSign className="size-4" />,
    children: [
      { label: "Overview", href: "/finance" },
      { label: "Budgets", href: "/finance/budgets" },
      { label: "Categories", href: "/finance/categories" },
    ],
  },
  {
    label: "Sales",
    icon: <ShoppingCart className="size-4" />,
    visibilityKey: "sales-orders",
    children: [
      { label: "Sales Orders", href: "/sales/orders" },
      { label: "Quotations", href: "/sales/quotations" },
      { label: "Invoices", href: "/invoicing" },
      { label: "Sale Debit Note", href: "/sales/debit-notes" },
      { label: "Sale Credit Note", href: "/sales/credit-notes" },
      { label: "Sale Returns", href: "/sales/returns" },
      { label: "Receipts", href: "/sales/receipts" },
      { label: "Advance Receipts", href: "/sales/advance-receipts" },
      { label: "POS", href: "/sales/pos" },
    ],
  },
  {
    label: "Purchases",
    icon: <Receipt className="size-4" />,
    visibilityKey: "purchases",
    children: [
      { label: "Purchase Orders", href: "/purchases/orders" },
      { label: "Bills", href: "/purchases/bills" },
      { label: "Purchase Credit Note", href: "/purchases/credit-notes" },
      { label: "Purchase Debit Note", href: "/purchases/debit-notes" },
      { label: "Purchase Returns", href: "/purchases/returns" },
      { label: "Payments", href: "/purchases/payments" },
      { label: "Advance Payments", href: "/purchases/advance-payments" },
    ],
  },
  {
    label: "Accounting",
    icon: <BookOpen className="size-4" />,
    visibilityKey: "accounting",
    children: [
      { label: "Transactions", href: "/accounting/transactions" },
      { label: "Monthly Summary", href: "/accounting/summary" },
      { label: "Chart of Accounts", href: "/accounting/chart-of-accounts" },
      { label: "Ledgers", href: "/accounting/ledgers" },
      { label: "Journal Vouchers", href: "/accounting/journal-vouchers" },
      { label: "Ledger Postings", href: "/accounting/ledger-postings" },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 className="size-4" />,
    children: [
      { label: "General Ledger", href: "/accounting/reports/general-ledger" },
      { label: "Trial Balance", href: "/accounting/reports/trial-balance" },
      { label: "Profit & Loss", href: "/accounting/reports/profit-loss" },
      { label: "Balance Sheet", href: "/accounting/reports/balance-sheet" },
      {
        label: "Outstanding Debtors",
        href: "/accounting/reports/outstanding-debtors",
      },
      {
        label: "Outstanding Creditors",
        href: "/accounting/reports/outstanding-creditors",
      },
      { label: "Inventory Report", href: "/reports/inventory" },
      { label: "MIS Report", href: "/reports/mis" },
    ],
  },
  {
    label: "Inventory",
    icon: <Package className="size-4" />,
    visibilityKey: "inventory",
    children: [
      { label: "Products", href: "/inventory" },
      { label: "Item Master", href: "/inventory/item-master" },
      { label: "Unit of Measure", href: "/inventory/uom" },
      { label: "Org Stock Levels", href: "/inventory/stock-levels/org" },
      {
        label: "Location Stock Levels",
        href: "/inventory/stock-levels/location",
      },
      { label: "Categories", href: "/inventory/categories" },
      { label: "Attributes", href: "/inventory/attributes" },
      { label: "HSN/SAC Codes", href: "/inventory/hsn-sac" },
      { label: "HSN Search", href: "/inventory/hsn" },
      { label: "Bulk Import", href: "/inventory/import" },
    ],
  },
  {
    label: "GST Filing",
    icon: <FileText className="size-4" />,
    children: [
      { label: "Returns", href: "/gst" },
      { label: "GSTR-2A", href: "/gst/gstr2a" },
      { label: "GSTR-9", href: "/gst/gstr9" },
      { label: "Refunds", href: "/gst/refunds" },
      { label: "E-way Audit", href: "/gst/eway-audit" },
    ],
  },
  {
    label: "Logistics",
    icon: <Truck className="size-4" />,
    children: [
      { label: "Shipments", href: "/logistics" },
      { label: "New Shipment", href: "/logistics/new" },
    ],
  },
  {
    label: "Admin",
    icon: <ShieldCheck className="size-4" />,
    children: [
      { label: "Roles", href: "/admin/roles" },
      { label: "Permissions", href: "/admin/permissions" },
      { label: "Configuration", href: "/admin/configuration" },
      { label: "Locations", href: "/admin/locations" },
      { label: "Groups", href: "/admin/groups" },
      { label: "Import & Export", href: "/admin/import-export" },
      { label: "Incentives", href: "/admin/incentives" },
    ],
  },
  {
    label: "ERP Manufacturing",
    icon: <Factory className="size-4" />,
    visibilityKey: "erp-manufacturing",
    children: [
      { label: "Bill of Materials", href: "/erp/bom" },
      { label: "Work Orders", href: "/erp/work-orders" },
      { label: "Production Planning", href: "/erp/production-plans" },
      { label: "Manufacturing Orders", href: "/erp/manufacturing-orders" },
      { label: "Raw Material Requisition", href: "/erp/rmr" },
      { label: "Shop Floor Control", href: "/erp/shop-floor" },
      { label: "Quality Control", href: "/erp/quality-control" },
      { label: "Finished Goods", href: "/erp/finished-goods" },
      { label: "Scrap Management", href: "/erp/scrap" },
      { label: "Machine Master", href: "/erp/machines" },
      { label: "Routing & Operations", href: "/erp/routing" },
      { label: "Cost of Production", href: "/erp/cost-of-production" },
    ],
  },
  {
    label: "HR Portal",
    icon: <UserCog className="size-4" />,
    visibilityKey: "hr-portal",
    children: [
      { label: "Employees", href: "/hr/employees" },
      { label: "Attendance", href: "/hr/attendance" },
      { label: "Salary Slips", href: "/hr/salary-slips" },
      { label: "Payroll", href: "/hr/payroll" },
      { label: "PF / ESI / Insurance", href: "/hr/pf-esi" },
      { label: "Overtime & Vouchers", href: "/hr/overtime-voucher" },
      { label: "Advance Management", href: "/hr/advances" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="size-4" />,
  },
];

const MODULE_VISIBILITY_KEYS = [
  "inventory",
  "accounting",
  "sales-orders",
  "purchases",
  "inventory-report",
  "mis-report",
  "roles",
  "permissions",
  "locations",
  "groups",
  "incentives",
  "finance-categories",
  "hsn-sac-codes",
  "item-master",
  "uom",
  "chart-of-accounts",
  "ledgers",
  "journal-vouchers",
  "general-ledger",
  "trial-balance",
  "profit-loss",
  "balance-sheet",
  "erp-manufacturing",
  "hr-portal",
];

function loadVisibilityMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const key of MODULE_VISIBILITY_KEYS) {
    const stored = localStorage.getItem(`module_visibility_${key}`);
    map[key] = stored !== "false";
  }
  return map;
}

function PlanBadge({ plan }: { plan: "PRO" | "ENTERPRISE" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[9px] h-3.5 px-1 font-semibold leading-none tracking-wide border",
        plan === "PRO"
          ? "border-accent/50 text-accent"
          : "border-purple-500/50 text-purple-400",
      )}
    >
      {plan}
    </Badge>
  );
}

function NavItem({ item, onClose }: { item: NavItemDef; onClose: () => void }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isChildActive = item.children?.some((c) =>
    currentPath.startsWith(c.href),
  );
  const isActive = item.href
    ? currentPath === item.href ||
      (item.href !== "/" && currentPath.startsWith(item.href))
    : false;
  const [expanded, setExpanded] = useState(isChildActive ?? false);

  if (item.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          data-ocid="nav-group-toggle"
          className={cn(
            "w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
            isChildActive
              ? "text-accent bg-accent/10"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/30",
          )}
        >
          <span className="flex items-center gap-2.5">
            <span className={isChildActive ? "text-accent" : ""}>
              {item.icon}
            </span>
            {item.label}
          </span>
          {expanded ? (
            <ChevronDown className="size-3.5 shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0" />
          )}
        </button>
        {expanded && (
          <div className="mt-0.5 ml-4 pl-3 border-l border-sidebar-border/40 space-y-0.5">
            {item.children.map((child) => {
              const childActive =
                currentPath === child.href ||
                currentPath.startsWith(`${child.href}/`);
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  onClick={onClose}
                  data-ocid="nav-child-link"
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                    childActive
                      ? "text-accent font-medium bg-accent/10"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-border/20",
                  )}
                >
                  <span>{child.label}</span>
                  {child.badge && (
                    <PlanBadge plan={child.badge as "PRO" | "ENTERPRISE"} />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href!}
      onClick={onClose}
      data-ocid="nav-item-link"
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
        isActive
          ? "text-accent bg-accent/10"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/30",
      )}
    >
      <span className={isActive ? "text-accent" : ""}>{item.icon}</span>
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

const THEME_BUTTONS: Array<{
  theme: Theme;
  icon: React.ReactNode;
  label: string;
}> = [
  { theme: "dark", icon: <Moon className="size-3.5" />, label: "Dark mode" },
  { theme: "light", icon: <Sun className="size-3.5" />, label: "Light mode" },
  {
    theme: "draft",
    icon: <PenLine className="size-3.5" />,
    label: "Draft mode",
  },
];

const PANEL_BUTTONS: Array<{
  panel: SidebarPanel;
  icon: React.ReactNode;
  label: string;
}> = [
  {
    panel: "notebooks",
    icon: <NotebookPen className="size-4" />,
    label: "Notebooks",
  },
  {
    panel: "calculator",
    icon: <Calculator className="size-4" />,
    label: "Calculator",
  },
  {
    panel: "notifications",
    icon: <Bell className="size-4" />,
    label: "Notifications",
  },
  {
    panel: "background",
    icon: <Palette className="size-4" />,
    label: "Background",
  },
];

export function Sidebar({
  open,
  onClose,
  theme,
  setTheme,
  activePanel,
  togglePanel,
  closePanel,
}: SidebarProps) {
  const { unreadCount } = useNotifications();
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(
    () => loadVisibilityMap(),
  );

  useEffect(() => {
    const handleStorage = () => setVisibilityMap(loadVisibilityMap());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const visibleNavItems = navItems.filter((item) => {
    if (!item.visibilityKey) return true;
    return visibilityMap[item.visibilityKey] !== false;
  });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0 lg:z-auto lg:flex",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        data-ocid="sidebar"
      >
        {/* Logo + theme toggles */}
        <div className="flex flex-col border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-accent flex items-center justify-center">
                <Briefcase className="size-3.5 text-accent-foreground" />
              </div>
              <span className="font-display font-semibold text-sm text-sidebar-foreground tracking-tight">
                BizCore
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-7 text-sidebar-foreground/60"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Theme toggle row */}
          <div className="flex items-center gap-1 px-3 pb-3">
            {THEME_BUTTONS.map(({ theme: t, icon, label }) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                aria-label={label}
                data-ocid={`theme-toggle-${t}`}
                title={label}
                className={cn(
                  "flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                  theme === t
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-border/30",
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNavItems.map((item) => (
            <NavItem key={item.label} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* Bottom icon tray for panels */}
        <div className="px-2 py-2 border-t border-sidebar-border shrink-0">
          <div className="flex items-center justify-around">
            {PANEL_BUTTONS.map(({ panel, icon, label }) => {
              const isActive = activePanel === panel;
              const isNotif = panel === "notifications";
              return (
                <button
                  key={panel}
                  type="button"
                  onClick={() => togglePanel(panel)}
                  aria-label={label}
                  data-ocid={`panel-toggle-${panel}`}
                  title={label}
                  className={cn(
                    "relative flex items-center justify-center size-8 rounded-md transition-colors duration-150",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-border/30",
                  )}
                >
                  {icon}
                  {isNotif && unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 size-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none"
                      data-ocid="notification-badge"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Branding footer */}
        <div className="px-4 py-2 border-t border-sidebar-border text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-sidebar-foreground/70 transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </aside>

      {/* Side panels (rendered next to sidebar) */}
      {activePanel === "notebooks" && <NotebooksPanel onClose={closePanel} />}
      {activePanel === "calculator" && <CalculatorPanel onClose={closePanel} />}
      {activePanel === "notifications" && (
        <NotificationsPanel onClose={closePanel} />
      )}
      {activePanel === "background" && <BackgroundPanel onClose={closePanel} />}
    </>
  );
}
