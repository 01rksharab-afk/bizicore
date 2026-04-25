import type { Notification } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupNotifications, useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react";
import { useState } from "react";

type NotifGroup = "System" | "B2BSyncNotif" | "Invoice" | "GSTFiling";

const GROUP_LABELS: Record<NotifGroup, string> = {
  System: "System",
  B2BSyncNotif: "B2B Sync",
  Invoice: "Invoice",
  GSTFiling: "GST Filing",
};

// Inline OKLCH colors for type badges — System=blue, B2B=purple, Invoice=amber, GST=red
const GROUP_BADGE_STYLE: Record<
  NotifGroup,
  { bg: string; text: string; dot: string }
> = {
  System: {
    bg: "bg-[oklch(0.55_0.18_240)]",
    text: "text-[oklch(0.95_0.01_240)]",
    dot: "bg-[oklch(0.55_0.18_240)]",
  },
  B2BSyncNotif: {
    bg: "bg-[oklch(0.5_0.2_290)]",
    text: "text-[oklch(0.95_0.01_290)]",
    dot: "bg-[oklch(0.5_0.2_290)]",
  },
  Invoice: {
    bg: "bg-[oklch(0.62_0.19_65)]",
    text: "text-[oklch(0.14_0.02_65)]",
    dot: "bg-[oklch(0.62_0.19_65)]",
  },
  GSTFiling: {
    bg: "bg-[oklch(0.55_0.22_25)]",
    text: "text-[oklch(0.95_0.01_25)]",
    dot: "bg-[oklch(0.55_0.22_25)]",
  },
};

const GROUP_UNREAD_DOT: Record<NotifGroup, string> = {
  System: "bg-[oklch(0.55_0.18_240)]",
  B2BSyncNotif: "bg-[oklch(0.5_0.2_290)]",
  Invoice: "bg-[oklch(0.62_0.19_65)]",
  GSTFiling: "bg-[oklch(0.55_0.22_25)]",
};

function formatAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function NotifCard({
  notif,
  onMarkRead,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
}) {
  const group = notif.notifType as unknown as NotifGroup;
  const style = GROUP_BADGE_STYLE[group];
  const ago = formatAgo(Number(notif.createdAt) / 1_000_000);

  return (
    <li
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted/30 cursor-default",
        !notif.isRead && "bg-muted/20",
      )}
      data-ocid="notification-card"
    >
      {/* Left unread accent dot */}

      <div className="flex flex-col items-center pt-1.5 shrink-0 w-2">
        {!notif.isRead && (
          <span
            className={cn(
              "size-2 rounded-full shrink-0",
              GROUP_UNREAD_DOT[group] ?? "bg-accent",
            )}
            aria-label="Unread"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide leading-none",
              style?.bg ?? "bg-muted",
              style?.text ?? "text-foreground",
            )}
          >
            {GROUP_LABELS[group] ?? group}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {ago}
          </span>
        </div>
        <p
          className={cn(
            "text-xs leading-tight",
            notif.isRead
              ? "font-normal text-muted-foreground"
              : "font-semibold text-foreground",
          )}
        >
          {notif.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>
      </div>

      {/* Mark read action */}
      {!notif.isRead && (
        <button
          type="button"
          onClick={() => onMarkRead(notif.id)}
          aria-label="Mark as read"
          data-ocid="notification-mark-read"
          className="shrink-0 mt-1 p-1 rounded text-muted-foreground hover:text-accent transition-colors"
        >
          <CheckCheck className="size-3.5" />
        </button>
      )}
    </li>
  );
}

function NotifSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-border/50 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
      <Skeleton className="h-3.5 w-3/4 rounded" />
      <Skeleton className="h-3 w-full rounded" />
    </div>
  );
}

function EmptyState({ group }: { group: NotifGroup | "all" }) {
  const label =
    group === "all"
      ? "You're all caught up!"
      : `No ${GROUP_LABELS[group as NotifGroup]} notifications yet.`;

  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6"
      data-ocid="notif-empty-state"
    >
      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
        <Bell className="size-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const {
    notifications,
    isLoading,
    unreadCount,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications();

  const [activeGroup, setActiveGroup] = useState<NotifGroup | "all">("all");
  const [error] = useState<string | null>(null);

  const groups = groupNotifications(notifications);

  const filtered =
    activeGroup === "all" ? notifications : (groups[activeGroup] ?? []);

  const sortedFiltered = [...filtered].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  // Unread counts per group for badge display
  const unreadPerGroup: Record<NotifGroup, number> = {
    System: (groups.System ?? []).filter((n) => !n.isRead).length,
    B2BSyncNotif: (groups.B2BSyncNotif ?? []).filter((n) => !n.isRead).length,
    Invoice: (groups.Invoice ?? []).filter((n) => !n.isRead).length,
    GSTFiling: (groups.GSTFiling ?? []).filter((n) => !n.isRead).length,
  };

  const tabs: Array<{
    key: NotifGroup | "all";
    label: string;
    count: number;
    unread: number;
  }> = [
    {
      key: "all",
      label: "All",
      count: notifications.length,
      unread: unreadCount,
    },
    {
      key: "System",
      label: "System",
      count: groups.System?.length ?? 0,
      unread: unreadPerGroup.System,
    },
    {
      key: "B2BSyncNotif",
      label: "B2B Sync",
      count: groups.B2BSyncNotif?.length ?? 0,
      unread: unreadPerGroup.B2BSyncNotif,
    },
    {
      key: "Invoice",
      label: "Invoice",
      count: groups.Invoice?.length ?? 0,
      unread: unreadPerGroup.Invoice,
    },
    {
      key: "GSTFiling",
      label: "GST Filing",
      count: groups.GSTFiling?.length ?? 0,
      unread: unreadPerGroup.GSTFiling,
    },
  ];

  return (
    <aside
      className="fixed top-0 left-60 z-50 h-full w-80 flex flex-col bg-card border-r border-border shadow-xl"
      data-ocid="panel-notifications"
      aria-label="Notifications panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-accent" />
          <span className="font-semibold text-sm text-foreground font-display">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full"
              data-ocid="notif-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
              onClick={() => markAllRead()}
              disabled={isMarkingAllRead}
              data-ocid="notif-mark-all-read"
            >
              <CheckCheck className="size-3.5" />
              {isMarkingAllRead ? "Marking…" : "Mark all read"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Group filter tabs */}
      <div
        className="flex gap-0.5 px-2 pt-2 pb-1.5 border-b border-border shrink-0 overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Filter by notification type"
      >
        {tabs.map(({ key, label, unread }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeGroup === key}
            onClick={() => setActiveGroup(key)}
            data-ocid={`notif-filter-${key}`}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeGroup === key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {label}
            {unread > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold leading-none",
                  activeGroup === key
                    ? "bg-accent-foreground/20 text-accent-foreground"
                    : "bg-destructive text-destructive-foreground",
                )}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <ul className="flex-1 overflow-y-auto" aria-label="Notifications">
        {/* Loading state */}
        {isLoading && (
          <>
            <NotifSkeleton />
            <NotifSkeleton />
            <NotifSkeleton />
            <NotifSkeleton />
          </>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6"
            data-ocid="notif-error-state"
          >
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <RefreshCw className="size-5 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => window.location.reload()}
              data-ocid="notif-error-retry"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && sortedFiltered.length === 0 && (
          <EmptyState group={activeGroup} />
        )}

        {/* Notification cards */}
        {!isLoading &&
          !error &&
          sortedFiltered.map((n) => (
            <NotifCard key={n.id} notif={n} onMarkRead={markRead} />
          ))}
      </ul>

      {/* Footer summary */}
      {!isLoading && notifications.length > 0 && (
        <div className="shrink-0 border-t border-border px-4 py-2 bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
      )}
    </aside>
  );
}
