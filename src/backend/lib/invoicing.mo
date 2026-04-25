import Types "../types/invoicing";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

module {
  // ── State aliases ──────────────────────────────────────────────────────────
  public type InvoiceMap  = Map.Map<Types.InvoiceId, Types.Invoice>;
  public type StripeMap   = Map.Map<Types.OrgId, Types.StripeConfig>;
  public type OrgInfoMap  = Map.Map<Types.OrgId, Types.OrgBillingInfo>;

  // ── Counter helper ─────────────────────────────────────────────────────────

  /// Generate the next sequential invoice number string, e.g. "INV-0042"
  public func formatInvoiceNumber(seq : Nat) : Text {
    let s = seq.toText();
    let padded = if (s.size() >= 4) { s }
    else if (s.size() == 3) { "0" # s }
    else if (s.size() == 2) { "00" # s }
    else { "000" # s };
    "I-" # padded
  };

  // ── Aggregate helpers ──────────────────────────────────────────────────────

  /// Sum line items + tax to get total amount in cents
  public func totalCents(invoice : Types.Invoice) : Nat {
    let subtotalFloat = invoice.lineItems.foldLeft(
      0.0,
      func(acc, item) { acc + item.quantity * item.rateInCents.toFloat() },
    );
    let subtotal : Nat = Int.abs(subtotalFloat.toInt());
    let taxAmount : Nat = Int.abs((subtotal.toFloat() * invoice.taxPercent / 100.0).toInt());
    subtotal + taxAmount;
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────

  /// Create a new draft invoice for an org; returns the created invoice
  public func createInvoice(
    invoices  : InvoiceMap,
    orgInfos  : OrgInfoMap,
    orgId     : Types.OrgId,
    caller    : Principal,
    input     : Types.CreateInvoiceInput,
    nextId    : Nat,
    now       : Types.Timestamp,
  ) : Types.Invoice {
    let orgInfo = switch (orgInfos.get(orgId)) {
      case (?info) { info };
      case (null)  { { name = ""; address = ""; taxId = null; logoUrl = null } };
    };
    let invoice : Types.Invoice = {
      id            = nextId;
      orgId         = orgId;
      invoiceNumber = formatInvoiceNumber(nextId);
      billTo        = input.billTo;
      orgInfo       = orgInfo;
      lineItems     = input.lineItems;
      currency      = input.currency;
      taxPercent    = input.taxPercent;
      notes         = input.notes;
      dueDate       = input.dueDate;
      status        = #draft;
      stripePaymentLinkId   = null;
      stripePaymentIntentId = null;
      stripeSessionId       = null;
      sentAt    = null;
      paidAt    = null;
      createdAt = now;
      createdBy = caller;
    };
    invoices.add(nextId, invoice);
    invoice;
  };

  /// Update a draft invoice in place; traps if not draft or wrong org
  public func updateInvoice(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
    _caller  : Principal,
    input    : Types.UpdateInvoiceInput,
  ) : Types.Invoice {
    let existing = switch (invoices.get(input.id)) {
      case (?inv) { inv };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # input.id.toText()) };
    };
    if (existing.orgId != orgId) { Runtime.trap("Invoicing: invoice " # input.id.toText() # " does not belong to org " # orgId.toText()) };
    switch (existing.status) {
      case (#draft) {};
      case (_)      { Runtime.trap("Invoicing: cannot update invoice " # input.id.toText() # " — not in draft status") };
    };
    let updated : Types.Invoice = {
      existing with
      billTo     = input.billTo;
      lineItems  = input.lineItems;
      currency   = input.currency;
      taxPercent = input.taxPercent;
      notes      = input.notes;
      dueDate    = input.dueDate;
    };
    invoices.add(input.id, updated);
    updated;
  };

  /// Soft-delete by voiding; traps if already paid
  public func voidInvoice(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
    id       : Types.InvoiceId,
  ) : () {
    let existing = switch (invoices.get(id)) {
      case (?inv) { inv };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # id.toText()) };
    };
    if (existing.orgId != orgId) { Runtime.trap("Invoicing: invoice " # id.toText() # " does not belong to org " # orgId.toText()) };
    switch (existing.status) {
      case (#paid) { Runtime.trap("Invoicing: cannot void invoice " # id.toText() # " — already paid") };
      case (#voided) { return };
      case (_) {};
    };
    invoices.add(id, { existing with status = #voided });
  };

  /// Get a single invoice by ID, scoped to an org
  public func getInvoice(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
    id       : Types.InvoiceId,
  ) : ?Types.Invoice {
    switch (invoices.get(id)) {
      case (?inv) { if (inv.orgId == orgId) ?inv else null };
      case (null) { null };
    };
  };

  /// List all invoices for an org, newest first
  public func listInvoices(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
  ) : [Types.Invoice] {
    let arr = invoices
      .values()
      .filter(func(inv) { inv.orgId == orgId })
      .toArray();
    arr.sort(func(a, b) { Nat.compare(b.id, a.id) });
  };

  // ── Status transitions ─────────────────────────────────────────────────────

  /// Transition draft → sent; records sentAt timestamp
  public func markSent(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
    id       : Types.InvoiceId,
    now      : Types.Timestamp,
  ) : Types.Invoice {
    let existing = switch (invoices.get(id)) {
      case (?inv) { inv };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # id.toText()) };
    };
    if (existing.orgId != orgId) { Runtime.trap("Invoicing: invoice " # id.toText() # " does not belong to org " # orgId.toText()) };
    switch (existing.status) {
      case (#draft) {};
      case (#sent)  { return existing };
      case (_)      { Runtime.trap("Invoicing: cannot mark invoice " # id.toText() # " as sent — invalid status transition") };
    };
    let updated : Types.Invoice = { existing with status = #sent; sentAt = ?now };
    invoices.add(id, updated);
    updated;
  };

  /// Transition sent/overdue → paid; records paidAt timestamp
  public func markPaid(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
    id       : Types.InvoiceId,
    now      : Types.Timestamp,
  ) : Types.Invoice {
    let existing = switch (invoices.get(id)) {
      case (?inv) { inv };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # id.toText()) };
    };
    if (existing.orgId != orgId) { Runtime.trap("Invoicing: invoice " # id.toText() # " does not belong to org " # orgId.toText()) };
    switch (existing.status) {
      case (#sent)    {};
      case (#overdue) {};
      case (#paid)    { return existing };
      case (_)        { Runtime.trap("Invoicing: cannot mark invoice " # id.toText() # " as paid — must be sent or overdue") };
    };
    let updated : Types.Invoice = { existing with status = #paid; paidAt = ?now };
    invoices.add(id, updated);
    updated;
  };

  /// Evaluate all sent invoices whose dueDate < now and flip them to overdue
  public func refreshOverdueStatuses(
    invoices : InvoiceMap,
    now      : Types.Timestamp,
  ) : () {
    // Collect candidates first to avoid mutating during iteration
    let toUpdate = invoices
      .values()
      .filter(func(inv) { inv.status == #sent and inv.dueDate < now })
      .toArray();
    for (inv in toUpdate.values()) {
      invoices.add(inv.id, { inv with status = #overdue });
    };
  };

  // ── Stripe helpers ─────────────────────────────────────────────────────────

  /// Store Stripe config for an org
  public func setStripeConfig(
    stripeMap : StripeMap,
    orgId     : Types.OrgId,
    config    : Types.StripeConfig,
  ) : () {
    stripeMap.add(orgId, config);
  };

  /// Retrieve Stripe config; traps if not configured
  public func requireStripeConfig(
    stripeMap : StripeMap,
    orgId     : Types.OrgId,
  ) : Types.StripeConfig {
    switch (stripeMap.get(orgId)) {
      case (?cfg) { cfg };
      case null { Runtime.trap("Invoicing: Stripe is not configured for org " # orgId.toText()) };
    };
  };

  /// Store Stripe session ID on an invoice after checkout created
  public func attachStripeSession(
    invoices  : InvoiceMap,
    orgId     : Types.OrgId,
    id        : Types.InvoiceId,
    sessionId : Text,
  ) : () {
    let existing = switch (invoices.get(id)) {
      case (?inv) { inv };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # id.toText()) };
    };
    if (existing.orgId != orgId) { Runtime.trap("Invoicing: invoice " # id.toText() # " does not belong to org " # orgId.toText()) };
    invoices.add(id, { existing with stripeSessionId = ?sessionId });
  };

  /// Look up invoice by Stripe session ID (for webhook-style auto-mark-paid)

  // ── Org billing info ───────────────────────────────────────────────────────

  /// Upsert org billing info (name, address, tax ID, logo)
  public func setOrgBillingInfo(
    orgInfos : OrgInfoMap,
    orgId    : Types.OrgId,
    info     : Types.OrgBillingInfo,
  ) : () {
    orgInfos.add(orgId, info);
  };

  /// Get org billing info; returns null if not yet configured
  public func getOrgBillingInfo(
    orgInfos : OrgInfoMap,
    orgId    : Types.OrgId,
  ) : ?Types.OrgBillingInfo {
    orgInfos.get(orgId);
  };

  // ── Reporting ──────────────────────────────────────────────────────────────

  /// Classify overdue bucket based on days past due
  func agingBucket(daysPastDue : Int) : Types.AgingBucket {
    if (daysPastDue <= 0)  { #current }
    else if (daysPastDue <= 30)  { #days1to30 }
    else if (daysPastDue <= 60)  { #days31to60 }
    else if (daysPastDue <= 90)  { #days61to90 }
    else                         { #days91plus };
  };

  // Nanoseconds per day
  let nsPerDay : Int = 86_400_000_000_000;

  /// Build aging report rows for an org, categorised by overdue bucket
  public func agingReport(
    invoices : InvoiceMap,
    orgId    : Types.OrgId,
    now      : Types.Timestamp,
  ) : [Types.AgingRow] {
    invoices
      .values()
      .filterMap<Types.Invoice, Types.AgingRow>(func(inv) {
        if (inv.orgId != orgId) return null;
        switch (inv.status) {
          case (#paid) { null };
          case (#voided) { null };
          case (_) {
            let daysPast = (now - inv.dueDate) / nsPerDay;
            ?{
              invoiceId     = inv.id;
              invoiceNumber = inv.invoiceNumber;
              billToName    = inv.billTo.name;
              billToEmail   = inv.billTo.email;
              totalCents    = totalCents(inv);
              dueDate       = inv.dueDate;
              bucket        = agingBucket(daysPast);
            };
          };
        };
      })
      .toArray();
  };
};
