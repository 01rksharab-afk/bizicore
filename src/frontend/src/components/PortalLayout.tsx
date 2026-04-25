import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BriefcaseBusiness,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

// ─── Nav Item ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const ADMIN_NAV: NavItem[] = [
  {
    label: "Dashboard",
    path: "/portal/admin/dashboard",
    icon: LayoutDashboard,
  },
  { label: "Team", path: "/portal/admin/team", icon: Users },
  { label: "Tasks", path: "/portal/admin/tasks", icon: CheckSquare },
  { label: "Settings", path: "/portal/admin/settings", icon: Settings },
];

const EMPLOYEE_NAV: NavItem[] = [
  { label: "My Tasks", path: "/portal/employee/dashboard", icon: CheckSquare },
  { label: "Profile", path: "/portal/employee/profile", icon: User },
  {
    label: "Notifications",
    path: "/portal/employee/notifications",
    icon: Bell,
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function PortalSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { portalSession, portalRole, logoutPortal } = usePortalAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = portalRole === "portalAdmin" ? ADMIN_NAV : EMPLOYEE_NAV;

  const companyName =
    portalRole === "portalAdmin"
      ? portalSession?.role === "portalAdmin"
        ? portalSession.company.name
        : ""
      : portalSession?.role === "portalEmployee"
        ? portalSession.companyName
        : "";

  const userName = portalSession?.name ?? "";

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
          "lg:static lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm flex-shrink-0">
              {companyName.charAt(0).toUpperCase() || "B"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-display font-semibold text-foreground truncate">
                {companyName || "Portal"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {portalRole === "portalAdmin"
                  ? "Admin Panel"
                  : "Employee Panel"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn("role-sidebar-item", isActive && "active")}
                data-ocid={`portal-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="size-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {portalRole === "portalAdmin" ? "Admin" : "Employee"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-muted-foreground"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
              data-ocid="portal-theme-toggle"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span className="text-xs">
                {resolvedTheme === "dark" ? "Light" : "Dark"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-destructive hover:text-destructive"
              onClick={logoutPortal}
              data-ocid="portal-logout"
            >
              <LogOut className="size-4" />
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function PortalHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { portalSession, portalRole } = usePortalAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const companyName =
    portalSession?.role === "portalAdmin"
      ? portalSession.company.name
      : portalSession?.role === "portalEmployee"
        ? portalSession.companyName
        : "Portal";

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
      <button
        type="button"
        className="lg:hidden text-muted-foreground hover:text-foreground"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Logo / company */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <BriefcaseBusiness className="size-5 text-primary flex-shrink-0" />
        <span className="font-display font-semibold text-foreground text-sm truncate">
          {companyName}
        </span>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary flex-shrink-0">
          {portalRole === "portalAdmin" ? "Admin" : "Employee"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          data-ocid="portal-header-theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}

// ─── Portal Layout ────────────────────────────────────────────────────────────

interface PortalLayoutProps {
  children: React.ReactNode;
  requiredRole?: "portalAdmin" | "portalEmployee";
}

export function PortalLayout({ children, requiredRole }: PortalLayoutProps) {
  const { portalSession, portalRole, isPortalInitializing } = usePortalAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading while hydrating
  if (isPortalInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">
          Loading portal...
        </div>
      </div>
    );
  }

  // Redirect if no session
  if (!portalSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Session expired. Please log in again.
          </p>
          <Link to="/portal/login">
            <Button variant="default">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Role check
  if (requiredRole && portalRole !== requiredRole) {
    const redirectPath =
      portalRole === "portalAdmin"
        ? "/portal/admin/dashboard"
        : "/portal/employee/dashboard";
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Access denied. Redirecting...</p>
          <Link to={redirectPath}>
            <Button variant="default">Go to your dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PortalSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PortalHeader onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
