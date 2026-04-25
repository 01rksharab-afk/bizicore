import NotificationsLib "../lib/notifications";
import NotifTypes      "../types/notifications";

mixin (
  notifStore  : NotificationsLib.NotificationMap,
  nextNotifId : NotificationsLib.NextIdRef,
) {

  // ── List all notifications for the calling principal in an org ────────────

  public query ({ caller }) func listNotifications(
    orgId : NotifTypes.OrgId,
  ) : async [NotifTypes.Notification] {
    NotificationsLib.listForUser(notifStore, caller, orgId)
  };

  // ── Mark a single notification as read ────────────────────────────────────

  public shared ({ caller }) func markNotificationRead(
    id : NotifTypes.NotificationId,
  ) : async Bool {
    NotificationsLib.markRead(notifStore, caller, id)
  };

  // ── Mark all notifications in an org as read, returns count updated ───────

  public shared ({ caller }) func markAllNotificationsRead(
    orgId : NotifTypes.OrgId,
  ) : async Nat {
    NotificationsLib.markAllRead(notifStore, caller, orgId)
  };

  // ── Delete a notification (caller must own it) ────────────────────────────

  public shared ({ caller }) func deleteNotification(
    id : NotifTypes.NotificationId,
  ) : async Bool {
    NotificationsLib.remove(notifStore, caller, id)
  };

  // ── Subscribe: seed a welcome notification if caller has none ────────────
  // Acts as a lightweight "subscribe" — initialises the notification feed
  // for a principal in a given org on first use.

  public shared ({ caller }) func subscribeToNotifications(
    orgId : NotifTypes.OrgId,
  ) : async () {
    NotificationsLib.seedWelcomeIfEmpty(notifStore, nextNotifId, caller, orgId)
  };

  // ── Publish a notification to the caller (internal/system use) ───────────
  // Any authenticated principal can publish; callers should gate this in
  // higher-level logic (e.g., only admins publish system-wide notices).

  public shared ({ caller }) func publishNotification(
    orgId     : NotifTypes.OrgId,
    notifType : NotifTypes.NotifType,
    title     : Text,
    message   : Text,
  ) : async NotifTypes.NotificationId {
    NotificationsLib.create(notifStore, nextNotifId, caller, orgId, notifType, title, message)
  };

  // ── Return count of unread notifications for caller in org ────────────────

  public query ({ caller }) func getUnreadCount(
    orgId : NotifTypes.OrgId,
  ) : async Nat {
    NotificationsLib.unreadCount(notifStore, caller, orgId)
  };
};
