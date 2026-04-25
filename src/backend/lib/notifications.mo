import Map       "mo:core/Map";
import Time      "mo:core/Time";
import Principal "mo:core/Principal";
import Types     "../types/notifications";

module {
  public type NotificationId  = Types.NotificationId;
  public type Notification    = Types.Notification;
  public type OrgId           = Types.OrgId;
  public type NotifType       = Types.NotifType;

  // ── Opaque state types ───────────────────────────────────────────────────

  // Key: orgId # "#" # notificationId (Text)
  public type NotificationMap = Map.Map<Text, Types.Notification>;
  public type NextIdRef       = { var value : Nat };

  // ── Helpers ──────────────────────────────────────────────────────────────

  func makeKey(orgId : OrgId, id : NotificationId) : Text {
    orgId # "#" # id
  };

  func makeId(counter : Nat) : NotificationId {
    "n" # counter.toText()
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────

  public func create(
    store     : NotificationMap,
    nextId    : NextIdRef,
    caller    : Principal,
    orgId     : OrgId,
    notifType : NotifType,
    title     : Text,
    message   : Text,
  ) : NotificationId {
    let id  = makeId(nextId.value);
    nextId.value += 1;
    let notif : Types.Notification = {
      id        = id;
      userId    = caller;
      orgId     = orgId;
      notifType = notifType;
      title     = title;
      message   = message;
      createdAt = Time.now();
      isRead    = false;
    };
    store.add(makeKey(orgId, id), notif);
    id
  };

  public func listForUser(
    store  : NotificationMap,
    caller : Principal,
    orgId  : OrgId,
  ) : [Types.Notification] {
    store.values()
      .filter(func(n) { n.orgId == orgId and Principal.equal(n.userId, caller) })
      .toArray()
  };

  public func markRead(
    store  : NotificationMap,
    caller : Principal,
    id     : NotificationId,
  ) : Bool {
    let found = store.entries().find(func(kv : (Text, Types.Notification)) : Bool {
      kv.1.id == id and Principal.equal(kv.1.userId, caller)
    });
    switch (found) {
      case (?(key, notif)) {
        store.add(key, { notif with isRead = true });
        true
      };
      case null false;
    }
  };

  public func markAllRead(
    store  : NotificationMap,
    caller : Principal,
    orgId  : OrgId,
  ) : Nat {
    var count = 0;
    let pairs = store.entries().toArray();
    for ((key, notif) in pairs.values()) {
      if (notif.orgId == orgId and Principal.equal(notif.userId, caller) and not notif.isRead) {
        store.add(key, { notif with isRead = true });
        count += 1;
      };
    };
    count
  };

  public func remove(
    store  : NotificationMap,
    caller : Principal,
    id     : NotificationId,
  ) : Bool {
    let found = store.entries().find(func(kv : (Text, Types.Notification)) : Bool {
      kv.1.id == id and Principal.equal(kv.1.userId, caller)
    });
    switch (found) {
      case (?(key, _)) {
        store.remove(key);
        true
      };
      case null false;
    }
  };

  public func unreadCount(
    store  : NotificationMap,
    caller : Principal,
    orgId  : OrgId,
  ) : Nat {
    store.values()
      .filter(func(n) {
        n.orgId == orgId and Principal.equal(n.userId, caller) and not n.isRead
      })
      .size()
  };

  // ── Utility: seed a system notification if user has none ─────────────────

  public func seedWelcomeIfEmpty(
    store  : NotificationMap,
    nextId : NextIdRef,
    caller : Principal,
    orgId  : OrgId,
  ) {
    let hasAny = store.values().any(func(n) {
      n.orgId == orgId and Principal.equal(n.userId, caller)
    });
    if (not hasAny) {
      ignore create(store, nextId, caller, orgId, #System, "Welcome", "");
    };
  };
};
