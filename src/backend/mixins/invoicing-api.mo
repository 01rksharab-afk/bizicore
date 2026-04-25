import Types "../types/invoicing";
import AuthOrgTypes "../types/auth-org";
import InvoicingLib "../lib/invoicing";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

mixin (
  invoices      : InvoicingLib.InvoiceMap,
  stripeMap     : InvoicingLib.StripeMap,
  orgInfos      : InvoicingLib.OrgInfoMap,
  nextInvoiceId : { var value : Nat },
  getCallerOrgRole : (caller : Principal, orgId : Types.OrgId) -> ?AuthOrgTypes.OrgRole,
) {

  // ── Authorization helpers ──────────────────────────────────────────────────

  func invoicingRequireMember(caller : Principal, orgId : Types.OrgId) {
    switch (getCallerOrgRole(caller, orgId)) {
      case null { Runtime.trap("Invoicing: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
  };

  func invoicingRequireAdmin(caller : Principal, orgId : Types.OrgId) {
    switch (getCallerOrgRole(caller, orgId)) {
      case (?(#owner)) {};
      case (?(#admin)) {};
      case _ { Runtime.trap("Invoicing: caller must be admin or owner in org " # orgId.toText()) };
    };
  };

  // ── Org billing info ───────────────────────────────────────────────────────

  /// Set org billing info (name, address, tax ID, logo URL)
  public shared ({ caller }) func setOrgBillingInfo(
    orgId : Types.OrgId,
    info  : Types.OrgBillingInfo,
  ) : async () {
    invoicingRequireAdmin(caller, orgId);
    InvoicingLib.setOrgBillingInfo(orgInfos, orgId, info);
  };

  /// Get org billing info for the current org
  public query func getOrgBillingInfo(orgId : Types.OrgId) : async ?Types.OrgBillingInfo {
    InvoicingLib.getOrgBillingInfo(orgInfos, orgId);
  };

  // ── Invoice CRUD ───────────────────────────────────────────────────────────

  /// Create a draft invoice
  public shared ({ caller }) func createInvoice(
    orgId : Types.OrgId,
    input : Types.CreateInvoiceInput,
  ) : async Types.InvoiceView {
    invoicingRequireMember(caller, orgId);
    let id = nextInvoiceId.value;
    nextInvoiceId.value += 1;
    let now = Time.now();
    InvoicingLib.createInvoice(invoices, orgInfos, orgId, caller, input, id, now);
  };

  /// Update a draft invoice
  public shared ({ caller }) func updateInvoice(
    orgId : Types.OrgId,
    input : Types.UpdateInvoiceInput,
  ) : async Types.InvoiceView {
    invoicingRequireMember(caller, orgId);
    InvoicingLib.updateInvoice(invoices, orgId, caller, input);
  };

  /// Void an invoice (soft delete)
  public shared ({ caller }) func voidInvoice(
    orgId : Types.OrgId,
    id    : Types.InvoiceId,
  ) : async () {
    invoicingRequireAdmin(caller, orgId);
    InvoicingLib.voidInvoice(invoices, orgId, id);
  };

  /// Get a single invoice
  public query func getInvoice(
    orgId : Types.OrgId,
    id    : Types.InvoiceId,
  ) : async ?Types.InvoiceView {
    InvoicingLib.getInvoice(invoices, orgId, id);
  };

  /// List all invoices for an org
  public query func listInvoices(orgId : Types.OrgId) : async [Types.InvoiceView] {
    InvoicingLib.listInvoices(invoices, orgId);
  };

  // ── Status transitions ─────────────────────────────────────────────────────

  /// Manually mark an invoice as paid
  public shared ({ caller }) func markInvoicePaid(
    orgId : Types.OrgId,
    id    : Types.InvoiceId,
  ) : async Types.InvoiceView {
    invoicingRequireAdmin(caller, orgId);
    let now = Time.now();
    InvoicingLib.markPaid(invoices, orgId, id, now);
  };

  // ── Send invoice via Stripe payment link ───────────────────────────────────

  /// Create a Stripe Checkout session for an invoice and mark it as sent.
  /// Returns the Stripe session JSON (frontend parses the URL and emails it).
  public shared ({ caller }) func sendInvoice(
    orgId      : Types.OrgId,
    id         : Types.InvoiceId,
    successUrl : Text,
    cancelUrl  : Text,
  ) : async Text {
    invoicingRequireMember(caller, orgId);
    let inv = switch (InvoicingLib.getInvoice(invoices, orgId, id)) {
      case (?i) { i };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # id.toText() # " in org " # orgId.toText()) };
    };
    let cfg = InvoicingLib.requireStripeConfig(stripeMap, orgId);
    let stripeCfg : Stripe.StripeConfiguration = {
      secretKey        = cfg.secretKey;
      allowedCountries = cfg.allowedCountries;
    };
    let total = InvoicingLib.totalCents(inv);
    let items : [Stripe.ShoppingItem] = [{
      currency           = inv.currency;
      productName        = inv.invoiceNumber;
      productDescription = inv.billTo.name;
      priceInCents       = total;
      quantity           = 1;
    }];
    let sessionJson = await Stripe.createCheckoutSession(
      stripeCfg, caller, items, successUrl, cancelUrl, transformInvoice
    );
    // Parse session ID from JSON: find "id":"cs_..." pattern
    let sessionId = extractJsonField(sessionJson, "id");
    InvoicingLib.attachStripeSession(invoices, orgId, id, sessionId);
    let now = Time.now();
    ignore InvoicingLib.markSent(invoices, orgId, id, now);
    sessionJson;
  };

  /// Check Stripe session status and auto-mark invoice paid if completed.
  /// Returns the raw Stripe session JSON.
  public shared func checkInvoicePaymentStatus(
    orgId : Types.OrgId,
    id    : Types.InvoiceId,
  ) : async Text {
    let inv = switch (InvoicingLib.getInvoice(invoices, orgId, id)) {
      case (?i) { i };
      case (null) { Runtime.trap("Invoicing: invoice not found with id " # id.toText() # " in org " # orgId.toText()) };
    };
    let sessionId = switch (inv.stripeSessionId) {
      case (?sid) { sid };
      case (null) { Runtime.trap("Invoicing: invoice " # id.toText() # " has no Stripe session attached") };
    };
    let cfg = InvoicingLib.requireStripeConfig(stripeMap, orgId);
    let stripeCfg : Stripe.StripeConfiguration = {
      secretKey        = cfg.secretKey;
      allowedCountries = cfg.allowedCountries;
    };
    let status = await Stripe.getSessionStatus(stripeCfg, sessionId, transformInvoice);
    switch (status) {
      case (#completed(_)) {
        let now = Time.now();
        ignore InvoicingLib.markPaid(invoices, orgId, id, now);
        "completed";
      };
      case (#failed({ error })) {
        "failed: " # error;
      };
    };
  };

  // ── Stripe configuration ───────────────────────────────────────────────────

  /// Store Stripe keys for an org (owner/admin only)
  public shared ({ caller }) func setInvoiceStripeConfig(
    orgId  : Types.OrgId,
    config : Types.StripeConfig,
  ) : async () {
    invoicingRequireAdmin(caller, orgId);
    InvoicingLib.setStripeConfig(stripeMap, orgId, config);
  };

  /// Check whether Stripe is configured for an org
  public query func isInvoiceStripeConfigured(orgId : Types.OrgId) : async Bool {
    switch (stripeMap.get(orgId)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  // ── Stripe HTTP outcall transform ──────────────────────────────────────────
  public query func transformInvoice(
    input : { response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob }; context : Blob }
  ) : async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob } {
    OutCall.transform(input);
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Simple JSON field extractor for "key":"value" pairs
  func extractJsonField(json : Text, key : Text) : Text {
    let needle = "\"" # key # "\":\"";
    let parts = json.split(#text needle).toArray();
    if (parts.size() < 2) return "";
    let rest = parts[1];
    let valueParts = rest.split(#text "\"").toArray();
    if (valueParts.size() == 0) return "";
    valueParts[0];
  };
};
