import Common "common";

module {
  public type OrgId     = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // ── GSTR-2A: inward supplies from suppliers ───────────────────────────────

  public type Gstr2aEntry = {
    gstin        : Text;
    supplierName : Text;
    invoiceNo    : Text;
    invoiceDate  : Text;
    taxableValue : Float;
    igst         : Float;
    cgst         : Float;
    sgst         : Float;
    itcAvailable : Bool;
  };

  // ── GSTR-9: annual return summary ─────────────────────────────────────────

  public type Gstr9Entry = {
    period           : Text;
    outwardSupplies  : Float;
    inwardSupplies   : Float;
    itcClaimed       : Float;
    taxPaid          : Float;
    taxPayable       : Float;
  };

  // ── GST Refund ────────────────────────────────────────────────────────────

  public type GstRefundRequest = {
    id             : Nat;
    orgId          : OrgId;
    refundType     : Text;
    period         : Text;
    amount         : Float;
    reason         : Text;
    status         : Text;
    filedAt        : ?Int;
    acknowledgedAt : ?Int;
    createdAt      : Int;
  };

  public type CreateRefundRequestInput = {
    orgId      : OrgId;
    refundType : Text;
    period     : Text;
    amount     : Float;
    reason     : Text;
  };

  // ── E-way Bill Audit ──────────────────────────────────────────────────────

  public type EwayAuditEntry = {
    ewayBillNo : Text;
    docId      : Nat;
    generatedAt : Int;
    expiresAt  : Int;
    status     : Text;
    vehicleNo  : ?Text;
  };

  public type EwayAuditReport = {
    id           : Nat;
    orgId        : OrgId;
    period       : Text;
    totalEwayBills : Nat;
    pendingBills : Nat;
    expiredBills : Nat;
    ewayBills    : [EwayAuditEntry];
  };
};
