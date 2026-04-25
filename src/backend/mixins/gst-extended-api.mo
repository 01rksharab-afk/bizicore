import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import GstExtLib "../lib/gst-extended";
import GstExtTypes "../types/gst-extended";
import AuthOrgTypes "../types/auth-org";

mixin (
  gstRefunds    : GstExtLib.RefundMap,
  nextRefundId  : GstExtLib.NextIdRef,
  getRoleOf     : GstExtLib.RoleChecker,
  getOrgPlan    : GstExtLib.PlanChecker,
) {

  // ── Refund requests (Pro+ required) ──────────────────────────────────────

  public shared ({ caller }) func createRefundRequest(
    input : GstExtTypes.CreateRefundRequestInput,
  ) : async GstExtTypes.GstRefundRequest {
    switch (getRoleOf(caller, input.orgId)) {
      case null { Runtime.trap("GST: caller is not a member of org " # input.orgId.toText()) };
      case _ {};
    };
    GstExtLib.createRefundRequest(gstRefunds, nextRefundId, caller, input, getOrgPlan)
  };

  public query func getRefundRequest(
    orgId : GstExtTypes.OrgId,
    id    : Nat,
  ) : async ?GstExtTypes.GstRefundRequest {
    GstExtLib.getRefundRequest(gstRefunds, orgId, id)
  };

  public query func listRefundRequests(
    orgId : GstExtTypes.OrgId,
  ) : async [GstExtTypes.GstRefundRequest] {
    GstExtLib.listRefundRequests(gstRefunds, orgId)
  };

  // ── Update refund request status ─────────────────────────────────────────

  public shared ({ caller }) func updateRefundRequest(
    orgId     : GstExtTypes.OrgId,
    id        : Nat,
    newStatus : Text,
  ) : async ?GstExtTypes.GstRefundRequest {
    switch (getRoleOf(caller, orgId)) {
      case null { Runtime.trap("GST: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
    GstExtLib.updateRefundRequest(gstRefunds, orgId, id, newStatus)
  };
};
