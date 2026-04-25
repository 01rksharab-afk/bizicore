import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/gst-extended";
import AuthOrgTypes "../types/auth-org";

module {
  public type OrgId = Types.OrgId;

  // ── Opaque state types ────────────────────────────────────────────────────

  public type RefundMap   = Map.Map<Nat, Types.GstRefundRequest>;
  public type NextIdRef   = { var value : Nat };
  public type RoleChecker = (caller : Principal, orgId : OrgId) -> ?AuthOrgTypes.OrgRole;
  public type PlanChecker = (orgId : OrgId) -> ?AuthOrgTypes.PlanTier;

  // ── GSTR-2A ───────────────────────────────────────────────────────────────
  public func generateGstr2a(
    _orgId  : OrgId,
    _period : Text,
  ) : [Types.Gstr2aEntry] { [] };

  // ── GSTR-9 ────────────────────────────────────────────────────────────────
  public func generateGstr9(
    orgId : OrgId,
    year  : Nat,
    getOrgPlan : PlanChecker,
  ) : Types.Gstr9Entry {
    let plan = switch (getOrgPlan(orgId)) {
      case (?p) p;
      case null { Runtime.trap("GST: no subscription found for org " # orgId.toText()) };
    };
    switch (plan) {
      case (#free) Runtime.trap("GST: GSTR-9 requires Pro or Enterprise plan for org " # orgId.toText());
      case _ {};
    };
    {
      period          = year.toText();
      outwardSupplies = 0.0;
      inwardSupplies  = 0.0;
      itcClaimed      = 0.0;
      taxPaid         = 0.0;
      taxPayable      = 0.0;
    }
  };

  // ── Refund requests ───────────────────────────────────────────────────────

  public func createRefundRequest(
    refunds    : RefundMap,
    nextId     : NextIdRef,
    _caller    : Principal,
    input      : Types.CreateRefundRequestInput,
    getOrgPlan : PlanChecker,
  ) : Types.GstRefundRequest {
    let plan = switch (getOrgPlan(input.orgId)) {
      case (?p) p;
      case null { Runtime.trap("GST: no subscription found for org " # input.orgId.toText()) };
    };
    switch (plan) {
      case (#free) Runtime.trap("GST: refund request requires Pro or Enterprise plan for org " # input.orgId.toText());
      case _ {};
    };
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let req : Types.GstRefundRequest = {
      id; orgId = input.orgId;
      refundType     = input.refundType;
      period         = input.period;
      amount         = input.amount;
      reason         = input.reason;
      status         = "pending";
      filedAt        = ?now;
      acknowledgedAt = null;
      createdAt      = now;
    };
    refunds.add(id, req);
    req
  };

  public func getRefundRequest(
    refunds : RefundMap,
    orgId   : OrgId,
    id      : Nat,
  ) : ?Types.GstRefundRequest {
    switch (refunds.get(id)) {
      case (?r) { if (r.orgId == orgId) ?r else null };
      case null null;
    }
  };

  public func listRefundRequests(
    refunds : RefundMap,
    orgId   : OrgId,
  ) : [Types.GstRefundRequest] {
    let all = refunds.values()
      .filter(func(r) { r.orgId == orgId })
      .toArray();
    all.sort(func(a : Types.GstRefundRequest, b : Types.GstRefundRequest) : { #less; #equal; #greater } {
      if (a.createdAt > b.createdAt) #less
      else if (a.createdAt < b.createdAt) #greater
      else #equal
    })
  };

  public func updateRefundRequest(
    refunds   : RefundMap,
    orgId     : OrgId,
    id        : Nat,
    newStatus : Text,
  ) : ?Types.GstRefundRequest {
    let existing = switch (refunds.get(id)) {
      case (?r) r;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    let validTransition = switch (existing.status, newStatus) {
      case ("pending",      "filed")        true;
      case ("filed",        "acknowledged") true;
      case ("acknowledged", "approved")     true;
      case ("acknowledged", "rejected")     true;
      case _                                false;
    };
    if (not validTransition) Runtime.trap("GST: invalid status transition for refund request " # id.toText() # " — from '" # existing.status # "' to '" # newStatus # "'");
    let now = Time.now();
    let updated : Types.GstRefundRequest = {
      existing with
      status         = newStatus;
      acknowledgedAt = if (newStatus == "acknowledged") ?now else existing.acknowledgedAt;
    };
    refunds.add(id, updated);
    ?updated
  };

  // ── E-way audit report ────────────────────────────────────────────────────
  public func generateEwayAuditReport(
    orgId  : OrgId,
    period : Text,
  ) : Types.EwayAuditReport {
    {
      id = 0; orgId; period;
      totalEwayBills = 0;
      pendingBills   = 0;
      expiredBills   = 0;
      ewayBills      = [];
    }
  };
};

