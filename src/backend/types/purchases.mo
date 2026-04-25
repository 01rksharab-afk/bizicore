module {
  public type OrgId = Nat;
  public type Timestamp = Int;

  public type LineItem = {
    description : Text;
    qty         : Float;
    rate        : Float;
    taxPct      : Float;
    total       : Float;
  };

  public type PoStatus = { #draft; #sent; #approved; #billed };

  public type PurchaseOrder = {
    id           : Nat;
    orgId        : OrgId;
    supplierId   : Nat;
    supplierName : Text;
    poNumber     : Text;
    status       : PoStatus;
    lineItems    : [LineItem];
    subtotal     : Float;
    taxTotal     : Float;
    total        : Float;
    notes        : Text;
    createdAt    : Timestamp;
  };

  public type BillStatus = { #draft; #approved; #paid; #partially_paid; #overdue };

  public type PurchaseBill = {
    id           : Nat;
    orgId        : OrgId;
    poId         : ?Nat;
    supplierId   : Nat;
    supplierName : Text;
    billNumber   : Text;
    status       : BillStatus;
    lineItems    : [LineItem];
    subtotal     : Float;
    taxTotal     : Float;
    total        : Float;
    amountPaid   : Float;
    dueDate      : Timestamp;
    notes        : Text;
    createdAt    : Timestamp;
  };

  public type NoteStatus = { #draft; #approved; #applied; #cancelled };

  public type PurchaseCreditNote = {
    id           : Nat;
    orgId        : OrgId;
    billId       : Nat;
    supplier     : Text;
    creditNumber : Text;
    amount       : Float;
    reason       : Text;
    status       : NoteStatus;
    createdAt    : Timestamp;
  };

  public type PurchaseDebitNote = {
    id          : Nat;
    orgId       : OrgId;
    billId      : Nat;
    supplier    : Text;
    debitNumber : Text;
    amount      : Float;
    reason      : Text;
    status      : NoteStatus;
    createdAt   : Timestamp;
  };

  public type ReturnItem = {
    productId : Text;
    name      : Text;
    qty       : Float;
    rate      : Float;
  };

  public type ReturnStatus = { #draft; #approved; #completed; #cancelled };

  public type PurchaseReturn = {
    id           : Nat;
    orgId        : OrgId;
    billId       : Nat;
    supplier     : Text;
    returnNumber : Text;
    items        : [ReturnItem];
    totalAmount  : Float;
    reason       : Text;
    status       : ReturnStatus;
    createdAt    : Timestamp;
  };

  public type PaymentMode = { #cash; #bank; #upi; #cheque };

  public type SupplierPayment = {
    id          : Nat;
    orgId       : OrgId;
    billId      : ?Nat;
    supplierId  : Nat;
    amount      : Float;
    paymentDate : Timestamp;
    paymentMode : PaymentMode;
    reference   : Text;
    isAdvance   : Bool;
    createdAt   : Timestamp;
  };

  // ── Input types ─────────────────────────────────────────────────────────────

  public type CreatePurchaseOrderInput = {
    supplierId   : Nat;
    supplierName : Text;
    lineItems    : [LineItem];
    notes        : Text;
  };

  public type UpdatePurchaseOrderInput = {
    id           : Nat;
    supplierId   : Nat;
    supplierName : Text;
    lineItems    : [LineItem];
    notes        : Text;
  };

  public type CreatePurchaseBillInput = {
    poId         : ?Nat;
    supplierId   : Nat;
    supplierName : Text;
    lineItems    : [LineItem];
    amountPaid   : Float;
    dueDate      : Timestamp;
    notes        : Text;
  };

  public type UpdatePurchaseBillInput = {
    id           : Nat;
    supplierId   : Nat;
    supplierName : Text;
    lineItems    : [LineItem];
    amountPaid   : Float;
    dueDate      : Timestamp;
    notes        : Text;
  };

  public type CreateCreditNoteInput = {
    billId       : Nat;
    supplier     : Text;
    amount       : Float;
    reason       : Text;
  };

  public type CreateDebitNoteInput = {
    billId   : Nat;
    supplier : Text;
    amount   : Float;
    reason   : Text;
  };

  public type CreatePurchaseReturnInput = {
    billId    : Nat;
    supplier  : Text;
    items     : [ReturnItem];
    reason    : Text;
  };

  public type CreateSupplierPaymentInput = {
    billId      : ?Nat;
    supplierId  : Nat;
    amount      : Float;
    paymentDate : Timestamp;
    paymentMode : PaymentMode;
    reference   : Text;
    isAdvance   : Bool;
  };
};
