import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/logistics";
import AuthOrgTypes "../types/auth-org";

module {
  public type OrgId = Types.OrgId;

  // ── Opaque state types ────────────────────────────────────────────────────

  public type ShipmentMap = Map.Map<Nat, Types.Shipment>;
  public type NextIdRef   = { var value : Nat };
  public type RoleChecker = (caller : Principal, orgId : OrgId) -> ?AuthOrgTypes.OrgRole;
  public type PlanChecker = (orgId : OrgId) -> ?AuthOrgTypes.PlanTier;

  // Logistics requires Pro+ subscription
  public func requirePro(orgId : OrgId, getOrgPlan : PlanChecker) {
    let plan = switch (getOrgPlan(orgId)) {
      case (?p) p;
      case null Runtime.trap("Logistics: no subscription found for org " # orgId.toText());
    };
    switch (plan) {
      case (#free) Runtime.trap("Logistics: this feature requires Pro or Enterprise plan for org " # orgId.toText());
      case _ {};
    };
  };

  // Valid status transitions for shipments
  func isValidTransition(
    from : Types.ShipmentStatus,
    to   : Types.ShipmentStatus,
  ) : Bool {
    switch (from, to) {
      // Normal forward path
      case (#pending,        #picked)         true;
      case (#picked,         #inTransit)      true;
      case (#inTransit,      #outForDelivery) true;
      case (#outForDelivery, #delivered)      true;
      // Cancellation/return from any active state
      case (#pending,        #cancelled)      true;
      case (#picked,         #cancelled)      true;
      case (#inTransit,      #cancelled)      true;
      case (#outForDelivery, #cancelled)      true;
      case (#pending,        #returned)       true;
      case (#picked,         #returned)       true;
      case (#inTransit,      #returned)       true;
      case (#outForDelivery, #returned)       true;
      case _                                  false;
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  public func create(
    shipments  : ShipmentMap,
    nextId     : NextIdRef,
    orgId      : OrgId,
    _caller    : Principal,
    input      : Types.CreateShipmentInput,
    getOrgPlan : PlanChecker,
  ) : Types.Shipment {
    requirePro(orgId, getOrgPlan);
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let shipment : Types.Shipment = {
      id                = id;
      orgId             = orgId;
      orderId           = input.orderId;
      docId             = input.docId;
      consigneeName     = input.consigneeName;
      consigneePhone    = input.consigneePhone;
      consigneeAddress  = input.consigneeAddress;
      courierProvider   = input.courierProvider;
      trackingNo        = input.trackingNo;
      transporterName   = input.transporterName;
      transporterPhone  = input.transporterPhone;
      weight            = input.weight;
      dimensions        = input.dimensions;
      status            = #pending;
      dispatchedAt      = null;
      deliveredAt       = null;
      createdAt         = now;
      updatedAt         = now;
    };
    shipments.add(id, shipment);
    shipment
  };

  public func get(
    shipments : ShipmentMap,
    orgId     : OrgId,
    id        : Nat,
  ) : ?Types.Shipment {
    switch (shipments.get(id)) {
      case (?s) { if (s.orgId == orgId) ?s else null };
      case null null;
    }
  };

  public func update(
    shipments  : ShipmentMap,
    orgId      : OrgId,
    id         : Nat,
    input      : Types.UpdateShipmentInput,
    getOrgPlan : PlanChecker,
  ) : ?Types.Shipment {
    requirePro(orgId, getOrgPlan);
    let existing = switch (shipments.get(id)) {
      case (?s) s;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    let now = Time.now();
    let updated : Types.Shipment = {
      existing with
      orderId          = switch (input.orderId)          { case (?v) ?v; case null existing.orderId };
      docId            = switch (input.docId)            { case (?v) ?v; case null existing.docId };
      consigneeName    = switch (input.consigneeName)    { case (?v) v;  case null existing.consigneeName };
      consigneePhone   = switch (input.consigneePhone)   { case (?v) v;  case null existing.consigneePhone };
      consigneeAddress = switch (input.consigneeAddress) { case (?v) v;  case null existing.consigneeAddress };
      courierProvider  = switch (input.courierProvider)  { case (?v) v;  case null existing.courierProvider };
      trackingNo       = switch (input.trackingNo)       { case (?v) ?v; case null existing.trackingNo };
      transporterName  = switch (input.transporterName)  { case (?v) ?v; case null existing.transporterName };
      transporterPhone = switch (input.transporterPhone) { case (?v) ?v; case null existing.transporterPhone };
      weight           = switch (input.weight)           { case (?v) ?v; case null existing.weight };
      dimensions       = switch (input.dimensions)       { case (?v) ?v; case null existing.dimensions };
      // status update via updateStatus only; ignore here
      updatedAt        = now;
    };
    shipments.add(id, updated);
    ?updated
  };

  public func remove(
    shipments : ShipmentMap,
    orgId     : OrgId,
    id        : Nat,
  ) : Bool {
    switch (shipments.get(id)) {
      case (?s) {
        if (s.orgId != orgId) return false;
        shipments.remove(id);
        true
      };
      case null false;
    }
  };

  public func list(
    shipments    : ShipmentMap,
    orgId        : OrgId,
    statusFilter : ?Types.ShipmentStatus,
    fromDate     : ?Int,
    toDate       : ?Int,
  ) : [Types.Shipment] {
    shipments.values()
      .filter(func(s) {
        if (s.orgId != orgId) return false;
        switch (statusFilter) {
          case (?st) { if (s.status != st) return false };
          case null  {};
        };
        switch (fromDate) {
          case (?fd) { if (s.createdAt < fd) return false };
          case null  {};
        };
        switch (toDate) {
          case (?td) { if (s.createdAt > td) return false };
          case null  {};
        };
        true
      })
      .toArray()
  };

  public func updateStatus(
    shipments  : ShipmentMap,
    orgId      : OrgId,
    id         : Nat,
    status     : Types.ShipmentStatus,
    getOrgPlan : PlanChecker,
  ) : ?Types.Shipment {
    requirePro(orgId, getOrgPlan);
    let existing = switch (shipments.get(id)) {
      case (?s) s;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    // Validate state machine transition
    if (not isValidTransition(existing.status, status)) {
      Runtime.trap("Logistics: invalid status transition for shipment " # id.toText());
    };
    let now = Time.now();
    let dispatchedAt = switch (status) {
      case (#picked)    { ?now };
      case (#inTransit) { switch (existing.dispatchedAt) { case (?t) ?t; case null ?now } };
      case _            { existing.dispatchedAt };
    };
    let deliveredAt = switch (status) {
      case (#delivered) { ?now };
      case _            { existing.deliveredAt };
    };
    let updated : Types.Shipment = {
      existing with
      status       = status;
      dispatchedAt = dispatchedAt;
      deliveredAt  = deliveredAt;
      updatedAt    = now;
    };
    shipments.add(id, updated);
    ?updated
  };

  public func track(
    shipments : ShipmentMap,
    orgId     : OrgId,
    id        : Nat,
  ) : ?Types.TrackingInfo {
    let s = switch (shipments.get(id)) {
      case (?v) v;
      case null { return null };
    };
    if (s.orgId != orgId) return null;

    let bookedEvt : Types.TrackingEvent = {
      timestamp = s.createdAt; location = null;
      description = "Booked"; status = #pending;
    };
    let pickedTs = switch (s.dispatchedAt) { case (?t) t; case null s.updatedAt };
    let pickedEvt : Types.TrackingEvent = {
      timestamp = pickedTs; location = null;
      description = "Picked"; status = #picked;
    };

    let events : [Types.TrackingEvent] = switch (s.status) {
      case (#pending)        { [bookedEvt] };
      case (#picked)         { [bookedEvt, pickedEvt] };
      case (#inTransit)      { [bookedEvt, pickedEvt,
        { timestamp = s.updatedAt; location = null; description = "Transit"; status = #inTransit }] };
      case (#outForDelivery) { [bookedEvt, pickedEvt,
        { timestamp = s.updatedAt; location = null; description = "OFD"; status = #outForDelivery }] };
      case (#delivered)      { [bookedEvt, pickedEvt,
        { timestamp = switch (s.deliveredAt) { case (?t) t; case null s.updatedAt };
          location = null; description = "Delivered"; status = #delivered }] };
      case (#returned)       { [bookedEvt,
        { timestamp = s.updatedAt; location = null; description = "Returned"; status = #returned }] };
      case (#cancelled)      { [bookedEvt,
        { timestamp = s.updatedAt; location = null; description = "Cancelled"; status = #cancelled }] };
    };
    ?{
      shipmentId    = s.id;
      trackingNo    = s.trackingNo;
      provider      = s.courierProvider;
      currentStatus = s.status;
      events        = events;
    }
  };
};
