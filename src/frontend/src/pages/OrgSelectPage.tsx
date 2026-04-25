import type { OrgSummary } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg, useOrgs } from "@/hooks/useOrg";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Crown,
  Loader2,
  Plus,
  RefreshCw,
  Star,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const PLAN_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  free: {
    label: "Free",
    className: "border-border text-muted-foreground bg-muted/40",
    icon: null,
  },
  pro: {
    label: "Pro",
    className: "border-accent/40 text-accent bg-accent/10",
    icon: <Star className="w-3 h-3" />,
  },
  enterprise: {
    label: "Enterprise",
    className: "border-primary/40 text-primary bg-primary/10",
    icon: <Crown className="w-3 h-3" />,
  },
};

// ─── OrgCard ──────────────────────────────────────────────────────────────────

function OrgCard({ org, onSelect }: { org: OrgSummary; onSelect: () => void }) {
  const planKey = "free"; // default until subscription loaded per org
  const plan = PLAN_CONFIG[planKey];
  const roleLabel = ROLE_LABELS[org.myRole] ?? org.myRole;
  const isOwner = org.myRole === "owner";

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className="w-full bg-card border border-border hover:border-accent/50 rounded-xl p-4 flex items-center gap-4 text-left transition-smooth group"
      data-ocid="org-card"
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-smooth">
        <Building2 className="w-5 h-5 text-accent" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-foreground truncate">{org.name}</p>
          {isOwner && (
            <Crown className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {org.slug} · {roleLabel}
        </p>
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          variant="outline"
          className={`text-[10px] font-medium gap-1 ${plan.className}`}
        >
          {plan.icon}
          {plan.label}
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
      </div>
    </motion.button>
  );
}

// ─── OrgSelectPage ────────────────────────────────────────────────────────────

export function OrgSelectPage() {
  const { isAuthenticated, isInitializing, profile, logout } = useAuth();
  const {
    data: orgs = [],
    isLoading,
    isError,
    isTimedOut,
    refetch,
  } = useOrgs();
  const { setActiveOrg } = useActiveOrg();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  // Show full-screen loader while II is initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSelect = (org: OrgSummary) => {
    setActiveOrg(org);
    navigate({ to: "/" });
  };

  return (
    <div
      className="min-h-screen bg-background flex items-start justify-center p-6 pt-16"
      data-ocid="org-select-page"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-display font-bold text-sm">
              B
            </span>
          </div>
          <span className="font-display font-semibold text-foreground text-lg">
            BizCore
          </span>
        </div>

        {/* Header */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Choose a workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile?.name ? `Welcome back, ${profile.name}. ` : ""}
            Select an organization to continue.
          </p>
        </div>

        {/* Org list */}
        <div className="space-y-2 mb-4" data-ocid="org-list">
          {isLoading &&
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}

          {/* Timed-out state */}
          {isLoading && isTimedOut && (
            <div
              className="bg-card border border-amber-500/30 rounded-xl p-8 text-center space-y-3"
              data-ocid="org-timeout-state"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="font-semibold text-foreground">
                Taking longer than expected
              </p>
              <p className="text-sm text-muted-foreground">
                Unable to load your organizations. Please check your connection
                and try again.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => refetch()}
                data-ocid="org-timeout-retry-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Error state with retry */}
          {!isLoading && isError && (
            <div
              className="bg-card border border-destructive/30 rounded-xl p-8 text-center space-y-3"
              data-ocid="org-error-state"
            >
              <div className="w-12 h-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <p className="font-semibold text-foreground">
                Failed to load organizations
              </p>
              <p className="text-sm text-muted-foreground">
                Unable to load your organizations. Please check your connection
                and try again.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => refetch()}
                data-ocid="org-retry-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !isError && orgs.length === 0 && (
            <div
              className="bg-card border border-border rounded-xl p-10 text-center"
              data-ocid="org-empty-state"
            >
              <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                No organizations yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first workspace to get started with BizCore.
              </p>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => navigate({ to: "/orgs/new" })}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create organization
              </Button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            orgs.map((org, i) => (
              <motion.div
                key={String(org.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <OrgCard org={org} onSelect={() => handleSelect(org)} />
              </motion.div>
            ))}
        </div>

        {/* Create new */}
        {!isError && orgs.length > 0 && (
          <Button
            variant="outline"
            className="w-full h-11 gap-2 rounded-xl border-dashed border-border/80 hover:border-accent/50 hover:bg-accent/5 text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => navigate({ to: "/orgs/new" })}
            data-ocid="create-org-btn"
          >
            <Plus className="w-4 h-4" />
            Create new organization
          </Button>
        )}

        {/* User footer */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate max-w-[180px]">
              {profile?.name ?? "Signed in"}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            data-ocid="sign-out-btn"
          >
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
