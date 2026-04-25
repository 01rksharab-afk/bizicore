import Runtime "mo:core/Runtime";
import PurchasesLib "../lib/purchases";
import PurchasesTypes "../types/purchases";

mixin (
  purchaseOrders    : PurchasesLib.PoMap,
  purchaseBills     : PurchasesLib.BillMap,
  purchaseCreditNotes : PurchasesLib.CreditMap,
  purchaseDebitNotes  : PurchasesLib.DebitMap,
  purchaseReturns   : PurchasesLib.ReturnMap,
  supplierPayments  : PurchasesLib.PaymentMap,
  nextPoId          : { var value : Nat },
  nextBillId        : { var value : Nat },
  nextCreditNoteId  : { var value : Nat },
  nextDebitNoteId   : { var value : Nat },
  nextReturnId      : { var value : Nat },
  nextPaymentId     : { var value : Nat },
) {

  // ── Purchase Orders ────────────────────────────────────────────────────────

  public shared ({ caller }) func createPurchaseOrder(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.CreatePurchaseOrderInput,
  ) : async PurchasesTypes.PurchaseOrder {
    let id = nextPoId.value;
    nextPoId.value += 1;
    PurchasesLib.createPurchaseOrder(purchaseOrders, orgId, input, id)
  };

  public shared ({ caller }) func updatePurchaseOrder(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.UpdatePurchaseOrderInput,
  ) : async PurchasesTypes.PurchaseOrder {
    PurchasesLib.updatePurchaseOrder(purchaseOrders, orgId, input)
  };

  public shared ({ caller }) func deletePurchaseOrder(orgId : PurchasesTypes.OrgId, id : Nat) : async () {
    PurchasesLib.deletePurchaseOrder(purchaseOrders, orgId, id)
  };

  public shared ({ caller }) func approvePurchaseOrder(orgId : PurchasesTypes.OrgId, id : Nat) : async PurchasesTypes.PurchaseOrder {
    PurchasesLib.approvePurchaseOrder(purchaseOrders, orgId, id)
  };

  public query func listPurchaseOrders(orgId : PurchasesTypes.OrgId) : async [PurchasesTypes.PurchaseOrder] {
    PurchasesLib.listPurchaseOrders(purchaseOrders, orgId)
  };

  // ── Purchase Bills ─────────────────────────────────────────────────────────

  public shared ({ caller }) func createPurchaseBill(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.CreatePurchaseBillInput,
  ) : async PurchasesTypes.PurchaseBill {
    let id = nextBillId.value;
    nextBillId.value += 1;
    PurchasesLib.createPurchaseBill(purchaseBills, orgId, input, id)
  };

  public shared ({ caller }) func updatePurchaseBill(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.UpdatePurchaseBillInput,
  ) : async PurchasesTypes.PurchaseBill {
    PurchasesLib.updatePurchaseBill(purchaseBills, orgId, input)
  };

  public shared ({ caller }) func deletePurchaseBill(orgId : PurchasesTypes.OrgId, id : Nat) : async () {
    PurchasesLib.deletePurchaseBill(purchaseBills, orgId, id)
  };

  public query func listPurchaseBills(orgId : PurchasesTypes.OrgId) : async [PurchasesTypes.PurchaseBill] {
    PurchasesLib.listPurchaseBills(purchaseBills, orgId)
  };

  // ── Purchase Credit Notes ──────────────────────────────────────────────────

  public shared ({ caller }) func createPurchaseCreditNote(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.CreateCreditNoteInput,
  ) : async PurchasesTypes.PurchaseCreditNote {
    let id = nextCreditNoteId.value;
    nextCreditNoteId.value += 1;
    PurchasesLib.createPurchaseCreditNote(purchaseCreditNotes, orgId, input, id)
  };

  public query func listPurchaseCreditNotes(orgId : PurchasesTypes.OrgId) : async [PurchasesTypes.PurchaseCreditNote] {
    PurchasesLib.listPurchaseCreditNotes(purchaseCreditNotes, orgId)
  };

  // ── Purchase Debit Notes ───────────────────────────────────────────────────

  public shared ({ caller }) func createPurchaseDebitNote(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.CreateDebitNoteInput,
  ) : async PurchasesTypes.PurchaseDebitNote {
    let id = nextDebitNoteId.value;
    nextDebitNoteId.value += 1;
    PurchasesLib.createPurchaseDebitNote(purchaseDebitNotes, orgId, input, id)
  };

  public query func listPurchaseDebitNotes(orgId : PurchasesTypes.OrgId) : async [PurchasesTypes.PurchaseDebitNote] {
    PurchasesLib.listPurchaseDebitNotes(purchaseDebitNotes, orgId)
  };

  // ── Purchase Returns ───────────────────────────────────────────────────────

  public shared ({ caller }) func createPurchaseReturn(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.CreatePurchaseReturnInput,
  ) : async PurchasesTypes.PurchaseReturn {
    let id = nextReturnId.value;
    nextReturnId.value += 1;
    PurchasesLib.createPurchaseReturn(purchaseReturns, orgId, input, id)
  };

  public query func listPurchaseReturns(orgId : PurchasesTypes.OrgId) : async [PurchasesTypes.PurchaseReturn] {
    PurchasesLib.listPurchaseReturns(purchaseReturns, orgId)
  };

  // ── Supplier Payments ──────────────────────────────────────────────────────

  public shared ({ caller }) func createSupplierPayment(
    orgId : PurchasesTypes.OrgId,
    input : PurchasesTypes.CreateSupplierPaymentInput,
  ) : async PurchasesTypes.SupplierPayment {
    let id = nextPaymentId.value;
    nextPaymentId.value += 1;
    PurchasesLib.createSupplierPayment(supplierPayments, orgId, input, id)
  };

  public query func listSupplierPayments(orgId : PurchasesTypes.OrgId) : async [PurchasesTypes.SupplierPayment] {
    PurchasesLib.listSupplierPayments(supplierPayments, orgId)
  };
};
