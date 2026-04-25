import TrafficLib  "../lib/traffic";
import TrafficTypes "../types/traffic";
import AuthOrgTypes "../types/auth-org";
import AuthOrg      "../lib/auth-org";
import Time         "mo:core/Time";

mixin (
  trafficEvents : TrafficLib.EventMap,
  members       : AuthOrg.MemberMap,
  nextTrafficId : { var value : Nat },
) {

  // ── Log a traffic event (no auth required — called by the frontend page load)
  public shared ({ caller }) func logTraffic(
    orgId      : Text,
    page       : Text,
    referrer   : Text,
    sourceType : TrafficTypes.TrafficSource,
    sessionId  : Text,
  ) : async { #ok : Text; #err : Text } {
    let id = "tev-" # nextTrafficId.value.toText();
    nextTrafficId.value += 1;
    let event : TrafficTypes.TrafficEvent = {
      id         = id;
      orgId      = orgId;
      page       = page;
      referrer   = referrer;
      sourceType = sourceType;
      sessionId  = sessionId;
      timestamp  = Time.now();
      userId     = caller.toText();
    };
    TrafficLib.logEvent(trafficEvents, event);
    #ok(id)
  };

  // ── Query traffic events (org members only) ──────────────────────────────
  public query ({ caller }) func queryTrafficReport(
    q : TrafficTypes.TrafficQuery,
  ) : async { #ok : [TrafficTypes.TrafficEvent]; #err : Text } {
    // orgId in TrafficQuery is Text; we need to convert for membership check
    let orgIdNat = switch (parseOrgId(q.orgId)) {
      case (?n) n;
      case null { return #err("") };
    };
    switch (AuthOrg.getCallerRole(members, caller, orgIdNat)) {
      case null #err("");
      case _    #ok(TrafficLib.queryEvents(trafficEvents, q));
    }
  };

  // ── Traffic summary for today ────────────────────────────────────────────
  public query ({ caller }) func getTrafficSummary(
    orgId : Text,
  ) : async { #ok : TrafficTypes.TrafficSummary; #err : Text } {
    let orgIdNat = switch (parseOrgId(orgId)) {
      case (?n) n;
      case null { return #err("") };
    };
    switch (AuthOrg.getCallerRole(members, caller, orgIdNat)) {
      case null #err("");
      case _ {
        // Compute start of today in nanoseconds (truncate to day boundary)
        let ns      = Time.now();
        let dayNs   = 86_400_000_000_000; // 24h in nanoseconds
        let todayStart : Int = ns - (ns % dayNs);
        #ok(TrafficLib.getSummary(trafficEvents, orgId, todayStart))
      };
    }
  };

  // ── Bulk delete events (org admin/owner only) ────────────────────────────
  public shared ({ caller }) func deleteTrafficEvents(
    orgId : Text,
    ids   : [Text],
  ) : async { #ok : Nat; #err : Text } {
    let orgIdNat = switch (parseOrgId(orgId)) {
      case (?n) n;
      case null { return #err("") };
    };
    switch (AuthOrg.getCallerRole(members, caller, orgIdNat)) {
      case (?(#owner)) { /* ok */ };
      case (?(#admin)) { /* ok */ };
      case _ { return #err("") };
    };
    #ok(TrafficLib.deleteEvents(trafficEvents, ids, orgId))
  };

  // ── Purge old events (org admin/owner only) ──────────────────────────────
  public shared ({ caller }) func purgeTrafficEvents(
    orgId   : Text,
    cutoff  : Int,
  ) : async { #ok : (); #err : Text } {
    let orgIdNat = switch (parseOrgId(orgId)) {
      case (?n) n;
      case null { return #err("") };
    };
    switch (AuthOrg.getCallerRole(members, caller, orgIdNat)) {
      case (?(#owner)) { /* ok */ };
      case (?(#admin)) { /* ok */ };
      case _ { return #err("") };
    };
    TrafficLib.purgeOld(trafficEvents, orgId, cutoff);
    #ok(())
  };

  // ── Private helper: parse Nat orgId from Text ────────────────────────────
  private func parseOrgId(orgId : Text) : ?AuthOrgTypes.OrgId {
    switch (orgId.size()) {
      case 0 null;
      case _ {
        var n : Nat = 0;
        var valid = true;
        for (c in orgId.toIter()) {
          let d = switch c {
            case '0' 0; case '1' 1; case '2' 2; case '3' 3; case '4' 4;
            case '5' 5; case '6' 6; case '7' 7; case '8' 8; case '9' 9;
            case _ { valid := false; 0 };
          };
          n := n * 10 + d;
        };
        if valid ?n else null
      };
    }
  };
};
