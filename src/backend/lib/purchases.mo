import Types "../types/purchases";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  // ── State aliases ──────────────────────────────────────────────────────────
  public type PoMap      = Map.Map<Nat, Types.PurchaseOrder>;
  public type BillMap    = Map.Map<Nat, Types.PurchaseBill>;
  public type CreditMap  = Map.Map<Nat, Types.PurchaseCreditNote>;
  public type DebitMap   = Map.Map<Nat, Types.PurchaseDebitNote>;
  public type ReturnMap  = Map.Map<Nat, Types.PurchaseReturn>;
  public type PaymentMap = Map.Map<Nat, Types.SupplierPayment>;

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

  func padNum(n : Nat) : Text {
    let s = n.toText();
    if (s.size() >= 4) s
    else if (s.size() == 3) "0" # s
    else if (s.size() == 2) "00" # s
    else "000" # s
  };

  // ── Purchase Orders ────────────────────────────────────────────────────────

  public func listPurchaseOrders(pos : PoMap, orgId : Nat) : [Types.PurchaseOrder] {
    pos.values().filter(func(p) { p.orgId == orgId }).toArray()
  };

  public func createPurchaseOrder(
    pos    : PoMap,
    orgId  : Nat,
    input  : Types.CreatePurchaseOrderInput,
    nextId : Nat,
  ) : Types.PurchaseOrder {
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let po : Types.PurchaseOrder = {
      id           = nextId;
      orgId        = orgId;
      supplierId   = input.supplierId;
      supplierName = input.supplierName;
      poNumber     = "P" # padNum(nextId);
      status       = #draft;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      notes        = input.notes;
      createdAt    = Time.now();
    };
    pos.add(nextId, po);
    po
  };

  public func updatePurchaseOrder(
    pos   : PoMap,
    orgId : Nat,
    input : Types.UpdatePurchaseOrderInput,
  ) : Types.PurchaseOrder {
    let existing = switch (pos.get(input.id)) {
      case (?p) p;
      case null { Runtime.trap("Purchases: PurchaseOrder not found with id " # input.id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Purchases: PurchaseOrder " # input.id.toText() # " does not belong to org " # orgId.toText());
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let updated : Types.PurchaseOrder = {
      existing with
      supplierId   = input.supplierId;
      supplierName = input.supplierName;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      notes        = input.notes;
    };
    pos.add(input.id, updated);
    updated
  };

  public func deletePurchaseOrder(pos : PoMap, orgId : Nat, id : Nat) {
    switch (pos.get(id)) {
      case (?p) {
        if (p.orgId != orgId) Runtime.trap("Purchases: PurchaseOrder " # id.toText() # " does not belong to org " # orgId.toText());
        pos.remove(id);
      };
      case null { Runtime.trap("Purchases: PurchaseOrder not found with id " # id.toText()) };
    };
  };

  public func approvePurchaseOrder(pos : PoMap, orgId : Nat, id : Nat) : Types.PurchaseOrder {
    let existing = switch (pos.get(id)) {
      case (?p) p;
      case null { Runtime.trap("Purchases: PurchaseOrder not found with id " # id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Purchases: PurchaseOrder " # id.toText() # " does not belong to org " # orgId.toText());
    let updated : Types.PurchaseOrder = { existing with status = #approved };
    pos.add(id, updated);
    updated
  };

  // ── Purchase Bills ─────────────────────────────────────────────────────────

  public func listPurchaseBills(bills : BillMap, orgId : Nat) : [Types.PurchaseBill] {
    bills.values().filter(func(b) { b.orgId == orgId }).toArray()
  };

  public func createPurchaseBill(
    bills  : BillMap,
    orgId  : Nat,
    input  : Types.CreatePurchaseBillInput,
    nextId : Nat,
  ) : Types.PurchaseBill {
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let bill : Types.PurchaseBill = {
      id           = nextId;
      orgId        = orgId;
      poId         = input.poId;
      supplierId   = input.supplierId;
      supplierName = input.supplierName;
      billNumber   = "B" # padNum(nextId);
      status       = #draft;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      amountPaid   = input.amountPaid;
      dueDate      = input.dueDate;
      notes        = input.notes;
      createdAt    = Time.now();
    };
    bills.add(nextId, bill);
    bill
  };

  public func updatePurchaseBill(
    bills : BillMap,
    orgId : Nat,
    input : Types.UpdatePurchaseBillInput,
  ) : Types.PurchaseBill {
    let existing = switch (bills.get(input.id)) {
      case (?b) b;
      case null { Runtime.trap("Purchases: PurchaseBill not found with id " # input.id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Purchases: PurchaseBill " # input.id.toText() # " does not belong to org " # orgId.toText());
    let (sub, tax, tot) = calcLineItems(input.lineItems);
    let updated : Types.PurchaseBill = {
      existing with
      supplierId   = input.supplierId;
      supplierName = input.supplierName;
      lineItems    = input.lineItems;
      subtotal     = sub;
      taxTotal     = tax;
      total        = tot;
      amountPaid   = input.amountPaid;
      dueDate      = input.dueDate;
      notes        = input.notes;
    };
    bills.add(input.id, updated);
    updated
  };

  public func deletePurchaseBill(bills : BillMap, orgId : Nat, id : Nat) {
    switch (bills.get(id)) {
      case (?b) {
        if (b.orgId != orgId) Runtime.trap("Purchases: PurchaseBill " # id.toText() # " does not belong to org " # orgId.toText());
        bills.remove(id);
      };
      case null { Runtime.trap("Purchases: PurchaseBill not found with id " # id.toText()) };
    };
  };

  // ── Purchase Credit Notes ──────────────────────────────────────────────────

  public func listPurchaseCreditNotes(credits : CreditMap, orgId : Nat) : [Types.PurchaseCreditNote] {
    credits.values().filter(func(c) { c.orgId == orgId }).toArray()
  };

  public func createPurchaseCreditNote(
    credits : CreditMap,
    orgId   : Nat,
    input   : Types.CreateCreditNoteInput,
    nextId  : Nat,
  ) : Types.PurchaseCreditNote {
    let cn : Types.PurchaseCreditNote = {
      id           = nextId;
      orgId        = orgId;
      billId       = input.billId;
      supplier     = input.supplier;
      creditNumber = "PC" # padNum(nextId);
      amount       = input.amount;
      reason       = input.reason;
      status       = #draft;
      createdAt    = Time.now();
    };
    credits.add(nextId, cn);
    cn
  };

  // ── Purchase Debit Notes ───────────────────────────────────────────────────

  public func listPurchaseDebitNotes(debits : DebitMap, orgId : Nat) : [Types.PurchaseDebitNote] {
    debits.values().filter(func(d) { d.orgId == orgId }).toArray()
  };

  public func createPurchaseDebitNote(
    debits : DebitMap,
    orgId  : Nat,
    input  : Types.CreateDebitNoteInput,
    nextId : Nat,
  ) : Types.PurchaseDebitNote {
    let dn : Types.PurchaseDebitNote = {
      id          = nextId;
      orgId       = orgId;
      billId      = input.billId;
      supplier    = input.supplier;
      debitNumber = "PD" # padNum(nextId);
      amount      = input.amount;
      reason      = input.reason;
      status      = #draft;
      createdAt   = Time.now();
    };
    debits.add(nextId, dn);
    dn
  };

  // ── Purchase Returns ───────────────────────────────────────────────────────

  public func listPurchaseReturns(returns : ReturnMap, orgId : Nat) : [Types.PurchaseReturn] {
    returns.values().filter(func(r) { r.orgId == orgId }).toArray()
  };

  public func createPurchaseReturn(
    returns : ReturnMap,
    orgId   : Nat,
    input   : Types.CreatePurchaseReturnInput,
    nextId  : Nat,
  ) : Types.PurchaseReturn {
    var total : Float = 0.0;
    for (item in input.items.values()) {
      total += item.qty * item.rate;
    };
    let ret : Types.PurchaseReturn = {
      id           = nextId;
      orgId        = orgId;
      billId       = input.billId;
      supplier     = input.supplier;
      returnNumber = "PR" # padNum(nextId);
      items        = input.items;
      totalAmount  = total;
      reason       = input.reason;
      status       = #draft;
      createdAt    = Time.now();
    };
    returns.add(nextId, ret);
    ret
  };

  // ── Supplier Payments ──────────────────────────────────────────────────────

  public func listSupplierPayments(payments : PaymentMap, orgId : Nat) : [Types.SupplierPayment] {
    payments.values().filter(func(p) { p.orgId == orgId }).toArray()
  };

  public func createSupplierPayment(
    payments : PaymentMap,
    orgId    : Nat,
    input    : Types.CreateSupplierPaymentInput,
    nextId   : Nat,
  ) : Types.SupplierPayment {
    let payment : Types.SupplierPayment = {
      id          = nextId;
      orgId       = orgId;
      billId      = input.billId;
      supplierId  = input.supplierId;
      amount      = input.amount;
      paymentDate = input.paymentDate;
      paymentMode = input.paymentMode;
      reference   = input.reference;
      isAdvance   = input.isAdvance;
      createdAt   = Time.now();
    };
    payments.add(nextId, payment);
    payment
  };
};
