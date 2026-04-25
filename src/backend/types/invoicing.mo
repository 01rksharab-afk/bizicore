import Common "common";

module {
  public type OrgId = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // Unique invoice identifier
  public type InvoiceId = Nat;

  // Invoice status lifecycle
  public type InvoiceStatus = {
    #draft;
    #sent;
    #paid;
    #overdue;
    #voided;
  };

  // A single line item on an invoice
  public type LineItem = {
    description : Text;
    quantity : Float;
    rateInCents : Nat; // unit price in cents
  };

  // Org branding / billing info auto-populated on invoice
  public type OrgBillingInfo = {
    name : Text;
    address : Text;
    taxId : ?Text;
    logoUrl : ?Text;
  };

  // Bill-to contact reference
  public type BillTo = {
    contactId : ?Nat;   // optional link to CRM contact
    dealId    : ?Nat;   // optional link to deal
    name      : Text;
    email     : Text;
    address   : ?Text;
    taxId     : ?Text;
  };

  // Internal invoice record
  public type Invoice = {
    id          : InvoiceId;
    orgId       : OrgId;
    invoiceNumber : Text;       // human-readable, e.g. "INV-0001"
    billTo      : BillTo;
    orgInfo     : OrgBillingInfo;
    lineItems   : [LineItem];
    currency    : Text;         // ISO 4217, e.g. "USD"
    taxPercent  : Float;        // 0–100
    notes       : ?Text;
    dueDate     : Timestamp;
    status      : InvoiceStatus;
    stripePaymentLinkId : ?Text;
    stripePaymentIntentId : ?Text;
    stripeSessionId : ?Text;
    sentAt      : ?Timestamp;
    paidAt      : ?Timestamp;
    createdAt   : Timestamp;
    createdBy   : Principal;
  };

  // Shared (API-boundary) invoice — same as Invoice (all fields are shared types)
  public type InvoiceView = Invoice;

  // Input for creating a new invoice
  public type CreateInvoiceInput = {
    billTo    : BillTo;
    lineItems : [LineItem];
    currency  : Text;
    taxPercent : Float;
    notes     : ?Text;
    dueDate   : Timestamp;
  };

  // Input for updating an existing draft invoice
  public type UpdateInvoiceInput = {
    id        : InvoiceId;
    billTo    : BillTo;
    lineItems : [LineItem];
    currency  : Text;
    taxPercent : Float;
    notes     : ?Text;
    dueDate   : Timestamp;
  };

  // Aging bucket for the report
  public type AgingBucket = {
    #current;
    #days1to30;
    #days31to60;
    #days61to90;
    #days91plus;
  };

  // A single row in the aging report
  public type AgingRow = {
    invoiceId     : InvoiceId;
    invoiceNumber : Text;
    billToName    : Text;
    billToEmail   : Text;
    totalCents    : Nat;
    dueDate       : Timestamp;
    bucket        : AgingBucket;
  };

  // Stripe configuration stored per org
  public type StripeConfig = {
    secretKey        : Text;
    allowedCountries : [Text];
  };
};
