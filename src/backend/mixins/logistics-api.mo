import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import LogisticsLib "../lib/logistics";
import LogisticsTypes "../types/logistics";
import AuthOrgTypes "../types/auth-org";

mixin (
  shipments      : LogisticsLib.ShipmentMap,
  nextShipmentId : LogisticsLib.NextIdRef,
  getRoleOf      : LogisticsLib.RoleChecker,
  getOrgPlan     : LogisticsLib.PlanChecker,
) {

  // ── Create a new shipment (Pro+ required) ─────────────────────────────────

  public shared ({ caller }) func createShipment(
    orgId : LogisticsTypes.OrgId,
    input : LogisticsTypes.CreateShipmentInput,
  ) : async LogisticsTypes.Shipment {
    switch (getRoleOf(caller, orgId)) {
      case null { Runtime.trap("Logistics: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
    LogisticsLib.create(shipments, nextShipmentId, orgId, caller, input, getOrgPlan)
  };

  // ── Fetch a single shipment ───────────────────────────────────────────────

  public query func getShipment(
    orgId : LogisticsTypes.OrgId,
    id    : Nat,
  ) : async ?LogisticsTypes.Shipment {
    LogisticsLib.get(shipments, orgId, id)
  };

  // ── Update shipment details (Pro+ required) ───────────────────────────────

  public shared ({ caller }) func updateShipment(
    orgId : LogisticsTypes.OrgId,
    id    : Nat,
    input : LogisticsTypes.UpdateShipmentInput,
  ) : async ?LogisticsTypes.Shipment {
    switch (getRoleOf(caller, orgId)) {
      case null { Runtime.trap("Logistics: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
    LogisticsLib.update(shipments, orgId, id, input, getOrgPlan)
  };

  // ── Delete a shipment ─────────────────────────────────────────────────────

  public shared ({ caller }) func deleteShipment(
    orgId : LogisticsTypes.OrgId,
    id    : Nat,
  ) : async Bool {
    switch (getRoleOf(caller, orgId)) {
      case null { Runtime.trap("Logistics: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
    LogisticsLib.remove(shipments, orgId, id)
  };

  // ── List shipments with optional status and date filters ──────────────────

  public query func listShipments(
    orgId        : LogisticsTypes.OrgId,
    statusFilter : ?LogisticsTypes.ShipmentStatus,
    fromDate     : ?Int,
    toDate       : ?Int,
  ) : async [LogisticsTypes.Shipment] {
    LogisticsLib.list(shipments, orgId, statusFilter, fromDate, toDate)
  };

  // ── Transition shipment status (validated state machine, Pro+ required) ───

  public shared ({ caller }) func updateShipmentStatus(
    orgId  : LogisticsTypes.OrgId,
    id     : Nat,
    status : LogisticsTypes.ShipmentStatus,
  ) : async ?LogisticsTypes.Shipment {
    switch (getRoleOf(caller, orgId)) {
      case null { Runtime.trap("Logistics: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
    LogisticsLib.updateStatus(shipments, orgId, id, status, getOrgPlan)
  };

  // ── Retrieve tracking info with event timeline ────────────────────────────

  public query func trackShipment(
    orgId : LogisticsTypes.OrgId,
    id    : Nat,
  ) : async ?LogisticsTypes.TrackingInfo {
    LogisticsLib.track(shipments, orgId, id)
  };
};
