import Common "common";

module {
  public type OrgId     = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // ── Courier providers ─────────────────────────────────────────────────────

  public type CourierProvider = {
    #delhivery;
    #bluedart;
    #fedex;
    #manual;
  };

  // ── Shipment lifecycle ────────────────────────────────────────────────────

  public type ShipmentStatus = {
    #pending;
    #picked;
    #inTransit;
    #outForDelivery;
    #delivered;
    #returned;
    #cancelled;
  };

  // ── Core shipment record ──────────────────────────────────────────────────

  public type Shipment = {
    id                : Nat;
    orgId             : OrgId;
    orderId           : ?Nat;
    docId             : ?Nat;
    consigneeName     : Text;
    consigneePhone    : Text;
    consigneeAddress  : Text;
    courierProvider   : CourierProvider;
    trackingNo        : ?Text;
    transporterName   : ?Text;
    transporterPhone  : ?Text;
    weight            : ?Float;
    dimensions        : ?Text;
    status            : ShipmentStatus;
    dispatchedAt      : ?Int;
    deliveredAt       : ?Int;
    createdAt         : Int;
    updatedAt         : Int;
  };

  // ── Input types ───────────────────────────────────────────────────────────

  public type CreateShipmentInput = {
    orderId          : ?Nat;
    docId            : ?Nat;
    consigneeName    : Text;
    consigneePhone   : Text;
    consigneeAddress : Text;
    courierProvider  : CourierProvider;
    trackingNo       : ?Text;
    transporterName  : ?Text;
    transporterPhone : ?Text;
    weight           : ?Float;
    dimensions       : ?Text;
  };

  public type UpdateShipmentInput = {
    orderId          : ?Nat;
    docId            : ?Nat;
    consigneeName    : ?Text;
    consigneePhone   : ?Text;
    consigneeAddress : ?Text;
    courierProvider  : ?CourierProvider;
    trackingNo       : ?Text;
    transporterName  : ?Text;
    transporterPhone : ?Text;
    weight           : ?Float;
    dimensions       : ?Text;
    status           : ?ShipmentStatus;
  };

  // ── Tracking info (returned from courier API / manual) ────────────────────

  public type TrackingEvent = {
    timestamp   : Int;
    location    : ?Text;
    description : Text;
    status      : ShipmentStatus;
  };

  public type TrackingInfo = {
    shipmentId   : Nat;
    trackingNo   : ?Text;
    provider     : CourierProvider;
    currentStatus : ShipmentStatus;
    events       : [TrackingEvent];
  };
};
