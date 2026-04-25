import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useTrafficSummary } from "@/hooks/useTraffic";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Home,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWidgetEnabled(): boolean {
  try {
    const v = localStorage.getItem("traffic-widget-enabled");
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

function setWidgetEnabled(val: boolean) {
  try {
    localStorage.setItem("traffic-widget-enabled", String(val));
  } catch {
    // ignore
  }
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
      <div
        className="h-full bg-accent rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TrafficAnalyticsWidget() {
  const [enabled, setEnabled] = useState(getWidgetEnabled);
  const { data, isLoading, refetch, isFetching } = useTrafficSummary();

  function toggle(val: boolean) {
    setEnabled(val);
    setWidgetEnabled(val);
  }

  // Widget ON/OFF toggle row
  const headerControls = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-muted-foreground">
        {enabled ? "Visible" : "Hidden"}
      </span>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        aria-label="Toggle traffic widget"
        data-ocid="traffic-widget-toggle"
      />
    </div>
  );

  const totalToday = Number(data?.totalToday ?? 0);
  const internal = Number(data?.internalToday ?? 0);
  const external = Number(data?.externalToday ?? 0);
  const direct = Number(data?.directToday ?? 0);
  const topPages = data?.topPages ?? [];
  const topReferrers = data?.topReferrers ?? [];
  const maxPageCount = topPages.length > 0 ? Number(topPages[0][1]) : 1;
  const maxRefCount = topReferrers.length > 0 ? Number(topReferrers[0][1]) : 1;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-4"
      data-ocid="traffic-analytics-widget"
    >
      {/* Header — always rendered so the toggle is always accessible */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-display font-semibold text-foreground leading-tight">
              Traffic Analytics
            </h2>
            <p className="text-xs text-muted-foreground">Today's overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh traffic data"
              data-ocid="traffic-widget-refresh"
            >
              <RefreshCw
                className={cn("size-3.5", isFetching && "animate-spin")}
              />
            </Button>
          )}
          {headerControls}
        </div>
      </div>

      {/* Body — hidden when widget is toggled off */}
      {!enabled ? (
        <p className="text-xs text-muted-foreground">
          Widget hidden. Toggle to show traffic data.
        </p>
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <>
          {/* Today totals */}
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "Total",
                value: totalToday,
                color: "text-foreground",
                ocid: "traffic-stat-total",
              },
              {
                label: "Internal",
                value: internal,
                color: "text-blue-400",
                ocid: "traffic-stat-internal",
              },
              {
                label: "External",
                value: external,
                color: "text-emerald-400",
                ocid: "traffic-stat-external",
              },
              {
                label: "Direct",
                value: direct,
                color: "text-violet-400",
                ocid: "traffic-stat-direct",
              },
            ].map(({ label, value, color, ocid }) => (
              <div
                key={label}
                className="rounded-lg bg-muted/40 p-2 text-center"
                data-ocid={ocid}
              >
                <p className={cn("text-lg font-bold font-display", color)}>
                  {value}
                </p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Source type badges */}
          {totalToday > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {internal > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/5"
                >
                  <Home className="size-2.5 mr-1" />
                  {Math.round((internal / totalToday) * 100)}% internal
                </Badge>
              )}
              {external > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                >
                  <Globe className="size-2.5 mr-1" />
                  {Math.round((external / totalToday) * 100)}% external
                </Badge>
              )}
              {direct > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/5"
                >
                  <ExternalLink className="size-2.5 mr-1" />
                  {Math.round((direct / totalToday) * 100)}% direct
                </Badge>
              )}
            </div>
          )}

          {/* Top pages */}
          {topPages.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
                Top Pages
              </p>
              <div className="space-y-2">
                {topPages.slice(0, 5).map(([page, count]) => (
                  <div key={page} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs text-foreground truncate font-mono min-w-0"
                        title={page}
                      >
                        {page}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {Number(count)}
                      </span>
                    </div>
                    <ProgressBar value={Number(count)} max={maxPageCount} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top referrers */}
          {topReferrers.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
                Top Referrers
              </p>
              <div className="space-y-1.5">
                {topReferrers.slice(0, 5).map(([ref, count]) => (
                  <div
                    key={ref}
                    className="flex items-center justify-between gap-2"
                  >
                    <span
                      className="text-xs text-muted-foreground truncate min-w-0"
                      title={ref}
                    >
                      {ref || "(direct)"}
                    </span>
                    <ProgressBar value={Number(count)} max={maxRefCount} />
                    <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                      {Number(count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalToday === 0 && (
            <div className="flex flex-col items-center justify-center py-4 text-center gap-1.5">
              <TrendingUp className="size-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                No traffic recorded today
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer link */}
      <Link
        to="/console/traffic"
        className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors pt-1 border-t border-border"
        data-ocid="traffic-widget-full-report-link"
      >
        View full Traffic Report
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
