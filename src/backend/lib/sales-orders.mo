import Types "../types/sales-orders";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  // ── State aliases ──────────────────────────────────────────────────────────
  public type SoMap          = Map.Map<Nat, Types.SalesOrder>;
  public type QuoteMap       = Map.Map<Nat, Types.Quotation>;
  public type DebitNoteMap   = Map.Map<Nat, Types.SaleDebitNote>;
  public type CreditNoteMap  = Map.Map<Nat, Types.SaleCreditNote>;
  public type ReturnMap      = Map.Map<Nat, Types.SaleReturn>;
  public type ReceiptMap     = Map.Map<Nat, Types.CustomerReceipt>;
  public type PosMap         = Map.Map<Nat, Types.PosTransaction>;

  // ── Helpers ────────────────────────────────────────────────────────────────

  func calcLineItems(items : [Types.LineItem]) : (Float, Float, Float) {
    var sub : Float = 0.0;
    var tax : Float = 0.0;
    for (item in items.values()) {
      sub += item.total;
      tax += item.total * item.taxPct / 100.0;
    };
    (sub, tax, sub + tax)
  };

  func calcPosItems(items : [Types.PosItem]) : (Float, Float, Float) {
    var sub : Float = 0.0;
    var tax : Float = 0.0;
    for (item in items.values()) {
      sub += item.total;
      tax += item.total * item.taxPct / 100.0;
    };
    (sub, tax, sub + tax)
  };

  func padNum(n : Nat) : Text {
    let s = n.toText();
    if (s.size() >= 4) s
    else if (s.size() == 3) "0" # s
    else if (s.size() == 2) "00" # s
    else "000" # s
  };

  // ── Sales Orders ───────────────────────────────────────────────────────────

  public func listSalesOrders(sos : SoMap, orgId : Nat) : [Types.SalesOrder] {
    sos.values().filter(func(s) { s.orgId == orgId }).toArray()
  };

  public func createSalesOrder(
    sos    : SoMap,
    orgId  : Nat,
    input  : Types.CreateSalesOrderInput,
    nextId : Nat,
  ) : Types.SalesOrder {
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let so : Types.SalesOrder = {
      id           = nextId;
      orgId        = orgId;
      customerId   = input.customerId;
      customerName = input.customerName;
      soNumber     = "S" # padNum(nextId);
      status       = #draft;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      notes        = input.notes;
      createdAt    = Time.now();
    };
    sos.add(nextId, so);
    so
  };

  public func updateSalesOrder(
    sos   : SoMap,
    orgId : Nat,
    input : Types.UpdateSalesOrderInput,
  ) : Types.SalesOrder {
    let existing = switch (sos.get(input.id)) {
      case (?s) s;
      case null { Runtime.trap("Sales: SalesOrder not found with id " # input.id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Sales: SalesOrder " # input.id.toText() # " does not belong to org " # orgId.toText());
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let updated : Types.SalesOrder = {
      existing with
      customerId   = input.customerId;
      customerName = input.customerName;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      notes        = input.notes;
    };
    sos.add(input.id, updated);
    updated
  };

  public func confirmSalesOrder(sos : SoMap, orgId : Nat, id : Nat) : Types.SalesOrder {
    let existing = switch (sos.get(id)) {
      case (?s) s;
      case null { Runtime.trap("Sales: SalesOrder not found with id " # id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Sales: SalesOrder " # id.toText() # " does not belong to org " # orgId.toText());
    let updated : Types.SalesOrder = { existing with status = #confirmed };
    sos.add(id, updated);
    updated
  };

  // ── Quotations ─────────────────────────────────────────────────────────────

  public func listQuotations(quotes : QuoteMap, orgId : Nat) : [Types.Quotation] {
    quotes.values().filter(func(q) { q.orgId == orgId }).toArray()
  };

  public func createQuotation(
    quotes : QuoteMap,
    orgId  : Nat,
    input  : Types.CreateQuotationInput,
    nextId : Nat,
  ) : Types.Quotation {
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let q : Types.Quotation = {
      id           = nextId;
      orgId        = orgId;
      customerId   = input.customerId;
      customerName = input.customerName;
      quoteNumber  = "Q" # padNum(nextId);
      status       = #draft;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      validUntil   = input.validUntil;
      notes        = input.notes;
      createdAt    = Time.now();
    };
    quotes.add(nextId, q);
    q
  };

  public func updateQuotation(
    quotes : QuoteMap,
    orgId  : Nat,
    input  : Types.UpdateQuotationInput,
  ) : Types.Quotation {
    let existing = switch (quotes.get(input.id)) {
      case (?q) q;
      case null { Runtime.trap("Sales: Quotation not found with id " # input.id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Sales: Quotation " # input.id.toText() # " does not belong to org " # orgId.toText());
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let updated : Types.Quotation = {
      existing with
      customerId   = input.customerId;
      customerName = input.customerName;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      validUntil   = input.validUntil;
      notes        = input.notes;
    };
    quotes.add(input.id, updated);
    updated
  };

  public func convertQuotationToSO(
    quotes : QuoteMap,
    sos    : SoMap,
    orgId  : Nat,
    quoteId : Nat,
    nextSoId : Nat,
  ) : Types.SalesOrder {
    let q = switch (quotes.get(quoteId)) {
      case (?q) q;
      case null { Runtime.trap("Sales: Quotation not found with id " # quoteId.toText()) };
    };
    if (q.orgId != orgId) Runtime.trap("Sales: Quotation " # quoteId.toText() # " does not belong to org " # orgId.toText());
    let updated : Types.Quotation = { q with status = #accepted };
    quotes.add(quoteId, updated);
    let so : Types.SalesOrder = {
      id           = nextSoId;
      orgId        = orgId;
      customerId   = q.customerId;
      customerName = q.customerName;
      soNumber     = "SO-" # padNum(nextSoId);
      status       = #confirmed;
      lineItems    = q.lineItems;
      subtotal     = q.subtotal;
      taxTotal     = q.taxTotal;
      total        = q.total;
      notes        = q.notes;
      createdAt    = Time.now();
    };
    sos.add(nextSoId, so);
    so
  };

  // ── Sale Debit Notes ───────────────────────────────────────────────────────

  public func listSaleDebitNotes(debits : DebitNoteMap, orgId : Nat) : [Types.SaleDebitNote] {
    debits.values().filter(func(d) { d.orgId == orgId }).toArray()
  };

  public func createSaleDebitNote(
    debits : DebitNoteMap,
    orgId  : Nat,
    input  : Types.CreateDebitNoteInput,
    nextId : Nat,
  ) : Types.SaleDebitNote {
    let dn : Types.SaleDebitNote = {
      id          = nextId;
      orgId       = orgId;
      invoiceId   = input.invoiceId;
      customer    = input.customer;
      debitNumber = "D" # padNum(nextId);
      amount      = input.amount;
      reason      = input.reason;
      status      = #draft;
      createdAt   = Time.now();
    };
    debits.add(nextId, dn);
    dn
  };

  // ── Sale Credit Notes ──────────────────────────────────────────────────────

  public func listSaleCreditNotes(credits : CreditNoteMap, orgId : Nat) : [Types.SaleCreditNote] {
    credits.values().filter(func(c) { c.orgId == orgId }).toArray()
  };

  public func createSaleCreditNote(
    credits : CreditNoteMap,
    orgId   : Nat,
    input   : Types.CreateCreditNoteInput,
    nextId  : Nat,
  ) : Types.SaleCreditNote {
    let cn : Types.SaleCreditNote = {
      id           = nextId;
      orgId        = orgId;
      invoiceId    = input.invoiceId;
      customer     = input.customer;
      creditNumber = "C" # padNum(nextId);
      amount       = input.amount;
      reason       = input.reason;
      status       = #draft;
      createdAt    = Time.now();
    };
    credits.add(nextId, cn);
    cn
  };

  // ── Sale Returns ───────────────────────────────────────────────────────────

  public func listSaleReturns(returns : ReturnMap, orgId : Nat) : [Types.SaleReturn] {
    returns.values().filter(func(r) { r.orgId == orgId }).toArray()
  };

  public func createSaleReturn(
    returns : ReturnMap,
    orgId   : Nat,
    input   : Types.CreateSaleReturnInput,
    nextId  : Nat,
  ) : Types.SaleReturn {
    var total : Float = 0.0;
    for (item in input.items.values()) {
      total += item.qty * item.rate;
    };
    let ret : Types.SaleReturn = {
      id           = nextId;
      orgId        = orgId;
      invoiceId    = input.invoiceId;
      customer     = input.customer;
      returnNumber = "R" # padNum(nextId);
      items        = input.items;
      totalAmount  = total;
      reason       = input.reason;
      status       = #draft;
      createdAt    = Time.now();
    };
    returns.add(nextId, ret);
    ret
  };

  // ── Customer Receipts ──────────────────────────────────────────────────────

  public func listCustomerReceipts(receipts : ReceiptMap, orgId : Nat) : [Types.CustomerReceipt] {
    receipts.values().filter(func(r) { r.orgId == orgId }).toArray()
  };

  public func createCustomerReceipt(
    receipts : ReceiptMap,
    orgId    : Nat,
    input    : Types.CreateReceiptInput,
    nextId   : Nat,
  ) : Types.CustomerReceipt {
    let receipt : Types.CustomerReceipt = {
      id          = nextId;
      orgId       = orgId;
      invoiceId   = input.invoiceId;
      customerId  = input.customerId;
      amount      = input.amount;
      receiptDate = input.receiptDate;
      paymentMode = input.paymentMode;
      reference   = input.reference;
      isAdvance   = input.isAdvance;
      createdAt   = Time.now();
    };
    receipts.add(nextId, receipt);
    receipt
  };

  // ── POS Transactions ───────────────────────────────────────────────────────

  public func listPosTransactions(pos : PosMap, orgId : Nat) : [Types.PosTransaction] {
    pos.values().filter(func(p) { p.orgId == orgId }).toArray()
  };

  public func createPosTransaction(
    pos    : PosMap,
    orgId  : Nat,
    input  : Types.CreatePosTransactionInput,
    nextId : Nat,
  ) : Types.PosTransaction {
    let (sub, tax, tot) = calcPosItems(input.items);
    let txn : Types.PosTransaction = {
      id           = nextId;
      orgId        = orgId;
      customerId   = input.customerId;
      customerName = input.customerName;
      items        = input.items;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      paymentMode  = input.paymentMode;
      createdAt    = Time.now();
    };
    pos.add(nextId, txn);
    txn
  };
};
