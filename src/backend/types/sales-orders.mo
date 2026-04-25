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

  public type SoStatus = { #draft; #confirmed; #invoiced; #cancelled };

  public type SalesOrder = {
    id           : Nat;
    orgId        : OrgId;
    customerId   : Nat;
    customerName : Text;
    soNumber     : Text;
    status       : SoStatus;
    lineItems    : [LineItem];
    subtotal     : Float;
    taxTotal     : Float;
    total        : Float;
    notes        : Text;
    createdAt    : Timestamp;
  };

  public type QuoteStatus = { #draft; #sent; #accepted; #rejected; #expired };

  public type Quotation = {
    id           : Nat;
    orgId        : OrgId;
    customerId   : Nat;
    customerName : Text;
    quoteNumber  : Text;
    status       : QuoteStatus;
    lineItems    : [LineItem];
    subtotal     : Float;
    taxTotal     : Float;
    total        : Float;
    validUntil   : Timestamp;
    notes        : Text;
    createdAt    : Timestamp;
  };

  public type NoteStatus = { #draft; #approved; #applied; #cancelled };

  public type SaleDebitNote = {
    id          : Nat;
    orgId       : OrgId;
    invoiceId   : Nat;
    customer    : Text;
    debitNumber : Text;
    amount      : Float;
    reason      : Text;
    status      : NoteStatus;
    createdAt   : Timestamp;
  };

  public type SaleCreditNote = {
    id           : Nat;
    orgId        : OrgId;
    invoiceId    : Nat;
    customer     : Text;
    creditNumber : Text;
    amount       : Float;
    reason       : Text;
    status       : NoteStatus;
    createdAt    : Timestamp;
  };

  public type ReturnItem = {
    productId : Text;
    name      : Text;
    qty       : Float;
    rate      : Float;
  };

  public type ReturnStatus = { #draft; #approved; #completed; #cancelled };

  public type SaleReturn = {
    id           : Nat;
    orgId        : OrgId;
    invoiceId    : Nat;
    customer     : Text;
    returnNumber : Text;
    items        : [ReturnItem];
    totalAmount  : Float;
    reason       : Text;
    status       : ReturnStatus;
    createdAt    : Timestamp;
  };

  public type PaymentMode = { #cash; #bank; #upi; #cheque; #card; #online };

  public type CustomerReceipt = {
    id          : Nat;
    orgId       : OrgId;
    invoiceId   : ?Nat;
    customerId  : Nat;
    amount      : Float;
    receiptDate : Timestamp;
    paymentMode : PaymentMode;
    reference   : Text;
    isAdvance   : Bool;
    createdAt   : Timestamp;
  };

  public type PosItem = {
    productId : Text;
    name      : Text;
    qty       : Float;
    rate      : Float;
    taxPct    : Float;
    total     : Float;
  };

  public type PosTransaction = {
    id           : Nat;
    orgId        : OrgId;
    customerId   : ?Nat;
    customerName : ?Text;
    items        : [PosItem];
    subtotal     : Float;
    taxTotal     : Float;
    total        : Float;
    paymentMode  : PaymentMode;
    createdAt    : Timestamp;
  };

  // ── Input types ─────────────────────────────────────────────────────────────

  public type CreateSalesOrderInput = {
    customerId   : Nat;
    customerName : Text;
    lineItems    : [LineItem];
    notes        : Text;
  };

  public type UpdateSalesOrderInput = {
    id           : Nat;
    customerId   : Nat;
    customerName : Text;
    lineItems    : [LineItem];
    notes        : Text;
  };

  public type CreateQuotationInput = {
    customerId   : Nat;
    customerName : Text;
    lineItems    : [LineItem];
    validUntil   : Timestamp;
    notes        : Text;
  };

  public type UpdateQuotationInput = {
    id           : Nat;
    customerId   : Nat;
    customerName : Text;
    lineItems    : [LineItem];
    validUntil   : Timestamp;
    notes        : Text;
  };

  public type CreateDebitNoteInput = {
    invoiceId : Nat;
    customer  : Text;
    amount    : Float;
    reason    : Text;
  };

  public type CreateCreditNoteInput = {
    invoiceId : Nat;
    customer  : Text;
    amount    : Float;
    reason    : Text;
  };

  public type CreateSaleReturnInput = {
    invoiceId : Nat;
    customer  : Text;
    items     : [ReturnItem];
    reason    : Text;
  };

  public type CreateReceiptInput = {
    invoiceId   : ?Nat;
    customerId  : Nat;
    amount      : Float;
    receiptDate : Timestamp;
    paymentMode : PaymentMode;
    reference   : Text;
    isAdvance   : Bool;
  };

  public type CreatePosTransactionInput = {
    customerId   : ?Nat;
    customerName : ?Text;
    items        : [PosItem];
    paymentMode  : PaymentMode;
  };
};
