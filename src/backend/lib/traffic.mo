import Map   "mo:core/Map";
import Time  "mo:core/Time";
import Types "../types/traffic";

module {
  // ── Opaque state type ────────────────────────────────────────────────────
  // Key: orgId # "#" # eventId   (Text composite)
  public type EventMap = Map.Map<Text, Types.TrafficEvent>;

  // ── Helpers ──────────────────────────────────────────────────────────────

  func makeKey(orgId : Text, id : Text) : Text { orgId # "#" # id };

  func sourceEq(a : Types.TrafficSource, b : Types.TrafficSource) : Bool {
    switch (a, b) {
      case (#internal, #internal) true;
      case (#external, #external) true;
      case (#direct,   #direct)   true;
      case _                      false;
    }
  };

  // ── Core operations ──────────────────────────────────────────────────────

  /// Store a single traffic event. The event id must be pre-assigned by the mixin.
  public func logEvent(store : EventMap, event : Types.TrafficEvent) {
    store.add(makeKey(event.orgId, event.id), event);
  };

  /// Return events matching the supplied filter criteria.
  public func queryEvents(
    store : EventMap,
    q     : Types.TrafficQuery,
  ) : [Types.TrafficEvent] {
    store.values()
      .filter(func(e : Types.TrafficEvent) : Bool {
        if (e.orgId != q.orgId) return false;
        switch (q.dateFrom) {
          case (?from) { if (e.timestamp < from) return false };
          case null    {};
        };
        switch (q.dateTo) {
          case (?to) { if (e.timestamp > to) return false };
          case null  {};
        };
        switch (q.sourceType) {
          case (?src) { if (not sourceEq(e.sourceType, src)) return false };
          case null   {};
        };
        switch (q.page) {
          case (?pg) { if (e.page != pg) return false };
          case null  {};
        };
        true
      })
      .toArray()
  };

  /// Compute a summary of traffic for today (events with timestamp >= todayStart).
  public func getSummary(
    store     : EventMap,
    orgId     : Text,
    todayStart : Int,
  ) : Types.TrafficSummary {
    // Collect today's events for this org
    let todayEvents = store.values()
      .filter(func(e : Types.TrafficEvent) : Bool {
        e.orgId == orgId and e.timestamp >= todayStart
      })
      .toArray();

    var total    : Nat = 0;
    var internal : Nat = 0;
    var external : Nat = 0;
    var direct   : Nat = 0;

    // Page and referrer frequency maps (Text → Nat, stored as arrays for simplicity)
    var pageCounts     : [(Text, Nat)] = [];
    var referrerCounts : [(Text, Nat)] = [];

    for (ev in todayEvents.values()) {
      total += 1;
      switch (ev.sourceType) {
        case (#internal) internal += 1;
        case (#external) external += 1;
        case (#direct)   direct   += 1;
      };

      // Accumulate page count
      pageCounts := incrementCount(pageCounts, ev.page);
      if (ev.referrer != "") {
        referrerCounts := incrementCount(referrerCounts, ev.referrer);
      };
    };

    {
      totalToday    = total;
      internalToday = internal;
      externalToday = external;
      directToday   = direct;
      topPages      = topN(pageCounts, 10);
      topReferrers  = topN(referrerCounts, 10);
    }
  };

  /// Remove all events for an org older than the supplied cutoff timestamp.
  public func purgeOld(store : EventMap, orgId : Text, cutoff : Int) {
    let toRemove = store.entries()
      .filter(func(kv : (Text, Types.TrafficEvent)) : Bool {
        kv.1.orgId == orgId and kv.1.timestamp < cutoff
      })
      .toArray();
    for ((key, _) in toRemove.values()) {
      store.remove(key);
    };
  };

  /// Bulk-delete events by id within an org. Returns the count deleted.
  public func deleteEvents(
    store : EventMap,
    ids   : [Text],
    orgId : Text,
  ) : Nat {
    var count : Nat = 0;
    for (id in ids.values()) {
      let key = makeKey(orgId, id);
      switch (store.get(key)) {
        case (?ev) {
          if (ev.orgId == orgId) {
            store.remove(key);
            count += 1;
          };
        };
        case null {};
      };
    };
    count
  };

  // ── Private helpers ──────────────────────────────────────────────────────

  func pairInc(key : Text, p : (Text, Nat)) : (Text, Nat) {
    if (p.0 == key) (p.0, p.1 + 1) else p
  };

  func pairCmp(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
    if      (a.1 > b.1) #less
    else if (a.1 < b.1) #greater
    else                #equal
  };

  /// Increment a count for a key in a (text, count) association list.
  func incrementCount(pairs : [(Text, Nat)], key : Text) : [(Text, Nat)] {
    var found = false;
    for (p in pairs.values()) {
      if (p.0 == key) { found := true };
    };
    let updated = pairs.map(func(p) = pairInc(key, p));
    if (found) updated else updated.concat([(key, 1)])
  };

  /// Return at most n entries sorted descending by count.
  func topN(pairs : [(Text, Nat)], n : Nat) : [(Text, Nat)] {
    let sorted = pairs.sort(pairCmp);
    if (sorted.size() <= n) sorted
    else sorted.sliceToArray(0, n.toInt())
  };
};
