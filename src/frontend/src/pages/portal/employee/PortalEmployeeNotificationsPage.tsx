import { PortalLayout } from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/context/PortalAuthContext";
import {
  type PortalNotification,
  usePortalMarkNotificationRead,
  usePortalNotifications,
} from "@/hooks/usePortal";
import { Bell, Check } from "lucide-react";

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  companyId,
}: {
  notification: PortalNotification;
  companyId: string;
}) {
  const markRead = usePortalMarkNotificationRead();

  const date = new Date(notification.createdAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? notification.createdAt
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 flex gap-4 transition-smooth hover:border-primary/20"
      data-ocid={`notification-card-${notification.id}`}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {notification.isRead ? (
          <div className="size-2.5 rounded-full bg-muted mt-1" />
        ) : (
          <div className="size-2.5 rounded-full bg-primary mt-1 animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <p
          className={
            notification.isRead
              ? "text-sm text-muted-foreground leading-relaxed"
              : "text-sm text-foreground font-medium leading-relaxed"
          }
        >
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Mark as read */}
      {!notification.isRead && (
        <Button
          size="sm"
          variant="ghost"
          className="flex-shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start"
          disabled={markRead.isPending}
          onClick={() => markRead.mutate({ id: notification.id, companyId })}
          data-ocid={`mark-read-${notification.id}`}
          aria-label="Mark as read"
        >
          <Check className="size-3.5" />
          Mark read
        </Button>
      )}
    </div>
  );
}

// ─── Inner content ────────────────────────────────────────────────────────────

function NotificationsContent({
  employeeId,
  companyId,
}: {
  employeeId: string;
  companyId: string;
}) {
  const { data: notifications = [], isLoading } = usePortalNotifications(
    companyId,
    employeeId,
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Messages from your admin
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary flex-shrink-0">
            <Bell className="size-3" />
            {unreadCount} unread
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-card border border-border rounded-xl p-5 animate-pulse space-y-2"
            >
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="notifications-empty"
        >
          <Bell className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-display font-semibold text-foreground">
            No notifications yet
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Your admin will send updates and announcements here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              companyId={companyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalEmployeeNotificationsPage() {
  const { portalSession } = usePortalAuth();
  const session =
    portalSession?.role === "portalEmployee" ? portalSession : null;

  return (
    <PortalLayout requiredRole="portalEmployee">
      {session ? (
        <NotificationsContent
          employeeId={session.employeeId}
          companyId={session.companyId}
        />
      ) : null}
    </PortalLayout>
  );
}
