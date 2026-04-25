import Runtime "mo:core/Runtime";
import SalesOrdersLib "../lib/sales-orders";
import SalesOrdersTypes "../types/sales-orders";

mixin (
  salesOrders       : SalesOrdersLib.SoMap,
  quotations        : SalesOrdersLib.QuoteMap,
  saleDebitNotes    : SalesOrdersLib.DebitNoteMap,
  saleCreditNotes   : SalesOrdersLib.CreditNoteMap,
  saleReturns       : SalesOrdersLib.ReturnMap,
  customerReceipts  : SalesOrdersLib.ReceiptMap,
  posTransactions   : SalesOrdersLib.PosMap,
  nextSoId          : { var value : Nat },
  nextQuoteId       : { var value : Nat },
  nextSaleDebitId   : { var value : Nat },
  nextSaleCreditId  : { var value : Nat },
  nextSaleReturnId  : { var value : Nat },
  nextReceiptId     : { var value : Nat },
  nextPosId         : { var value : Nat },
) {

  // ── Sales Orders ───────────────────────────────────────────────────────────

  public shared ({ caller }) func createSalesOrder(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreateSalesOrderInput,
  ) : async SalesOrdersTypes.SalesOrder {
    let id = nextSoId.value;
    nextSoId.value += 1;
    SalesOrdersLib.createSalesOrder(salesOrders, orgId, input, id)
  };

  public shared ({ caller }) func updateSalesOrder(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.UpdateSalesOrderInput,
  ) : async SalesOrdersTypes.SalesOrder {
    SalesOrdersLib.updateSalesOrder(salesOrders, orgId, input)
  };

  public shared ({ caller }) func confirmSalesOrder(orgId : SalesOrdersTypes.OrgId, id : Nat) : async SalesOrdersTypes.SalesOrder {
    SalesOrdersLib.confirmSalesOrder(salesOrders, orgId, id)
  };

  public query func listSalesOrders(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.SalesOrder] {
    SalesOrdersLib.listSalesOrders(salesOrders, orgId)
  };

  // ── Quotations ─────────────────────────────────────────────────────────────

  public shared ({ caller }) func createQuotation(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreateQuotationInput,
  ) : async SalesOrdersTypes.Quotation {
    let id = nextQuoteId.value;
    nextQuoteId.value += 1;
    SalesOrdersLib.createQuotation(quotations, orgId, input, id)
  };

  public shared ({ caller }) func updateQuotation(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.UpdateQuotationInput,
  ) : async SalesOrdersTypes.Quotation {
    SalesOrdersLib.updateQuotation(quotations, orgId, input)
  };

  public shared ({ caller }) func convertQuotationToSalesOrder(
    orgId    : SalesOrdersTypes.OrgId,
    quoteId  : Nat,
  ) : async SalesOrdersTypes.SalesOrder {
    let soId = nextSoId.value;
    nextSoId.value += 1;
    SalesOrdersLib.convertQuotationToSO(quotations, salesOrders, orgId, quoteId, soId)
  };

  public query func listQuotations(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.Quotation] {
    SalesOrdersLib.listQuotations(quotations, orgId)
  };

  // ── Sale Debit Notes ───────────────────────────────────────────────────────

  public shared ({ caller }) func createSaleDebitNote(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreateDebitNoteInput,
  ) : async SalesOrdersTypes.SaleDebitNote {
    let id = nextSaleDebitId.value;
    nextSaleDebitId.value += 1;
    SalesOrdersLib.createSaleDebitNote(saleDebitNotes, orgId, input, id)
  };

  public query func listSaleDebitNotes(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.SaleDebitNote] {
    SalesOrdersLib.listSaleDebitNotes(saleDebitNotes, orgId)
  };

  // ── Sale Credit Notes ──────────────────────────────────────────────────────

  public shared ({ caller }) func createSaleCreditNote(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreateCreditNoteInput,
  ) : async SalesOrdersTypes.SaleCreditNote {
    let id = nextSaleCreditId.value;
    nextSaleCreditId.value += 1;
    SalesOrdersLib.createSaleCreditNote(saleCreditNotes, orgId, input, id)
  };

  public query func listSaleCreditNotes(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.SaleCreditNote] {
    SalesOrdersLib.listSaleCreditNotes(saleCreditNotes, orgId)
  };

  // ── Sale Returns ───────────────────────────────────────────────────────────

  public shared ({ caller }) func createSaleReturn(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreateSaleReturnInput,
  ) : async SalesOrdersTypes.SaleReturn {
    let id = nextSaleReturnId.value;
    nextSaleReturnId.value += 1;
    SalesOrdersLib.createSaleReturn(saleReturns, orgId, input, id)
  };

  public query func listSaleReturns(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.SaleReturn] {
    SalesOrdersLib.listSaleReturns(saleReturns, orgId)
  };

  // ── Customer Receipts ──────────────────────────────────────────────────────

  public shared ({ caller }) func createCustomerReceipt(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreateReceiptInput,
  ) : async SalesOrdersTypes.CustomerReceipt {
    let id = nextReceiptId.value;
    nextReceiptId.value += 1;
    SalesOrdersLib.createCustomerReceipt(customerReceipts, orgId, input, id)
  };

  public query func listCustomerReceipts(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.CustomerReceipt] {
    SalesOrdersLib.listCustomerReceipts(customerReceipts, orgId)
  };

  // ── POS Transactions ───────────────────────────────────────────────────────

  public shared ({ caller }) func createPosTransaction(
    orgId : SalesOrdersTypes.OrgId,
    input : SalesOrdersTypes.CreatePosTransactionInput,
  ) : async SalesOrdersTypes.PosTransaction {
    let id = nextPosId.value;
    nextPosId.value += 1;
    SalesOrdersLib.createPosTransaction(posTransactions, orgId, input, id)
  };

  public query func listPosTransactions(orgId : SalesOrdersTypes.OrgId) : async [SalesOrdersTypes.PosTransaction] {
    SalesOrdersLib.listPosTransactions(posTransactions, orgId)
  };
};
