import Map     "mo:core/Map";
import Nat     "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Types   "../types/inventory-gst";
import AuthOrgTypes "../types/auth-org";
import Lib     "../lib/inventory-gst";

/// Mixin: Inventory & GST domain public API.
///
/// Injected state slices:
///   categories     — CategoryMap
///   products       — ProductMap
///   gstReturns     — GstReturnMap
///   subs           — OrgSubscription map (for plan-gating)
///   nextCategoryId / nextProductId / nextGstReturnId — counters
///   getRoleFor     — caller-role resolver from auth-org domain
mixin (
  categories      : Lib.CategoryMap,
  products        : Lib.ProductMap,
  gstReturns      : Lib.GstReturnMap,
  subs            : Map.Map<AuthOrgTypes.OrgId, AuthOrgTypes.OrgSubscription>,
  nextCategoryId  : { var value : Nat },
  nextProductId   : { var value : Nat },
  nextGstReturnId : { var value : Nat },
  getRoleFor      : (caller : Principal, orgId : AuthOrgTypes.OrgId) -> ?AuthOrgTypes.OrgRole,
) {

  // ── Authorization helpers ─────────────────────────────────────────────────

  func requireInvMember(caller : Principal, orgId : AuthOrgTypes.OrgId) {
    switch (getRoleFor(caller, orgId)) {
      case null Runtime.trap("Inventory: caller is not a member of org " # orgId.toText());
      case (?_) {};
    };
  };

  func requirePaidPlan(orgId : AuthOrgTypes.OrgId) {
    if (not Lib.isPaidPlan(subs, orgId)) {
      Runtime.trap("Inventory: this feature requires a paid plan for org " # orgId.toText());
    };
  };

  func requireMemberAndPro(caller : Principal, orgId : AuthOrgTypes.OrgId) {
    requireInvMember(caller, orgId);
    requirePaidPlan(orgId);
  };

  // ── Category endpoints ────────────────────────────────────────────────────

  public shared ({ caller }) func createCategory(
    input : Types.CreateCategoryInput,
  ) : async { #ok : Types.Category; #notAuthorized } {
    requireMemberAndPro(caller, input.orgId);
    #ok(Lib.createCategory(categories, nextCategoryId, input, caller));
  };

  public shared query ({ caller }) func listCategories(
    orgId : Types.OrgId,
  ) : async { #ok : [Types.Category]; #notAuthorized } {
    requireMemberAndPro(caller, orgId);
    #ok(Lib.listCategories(categories, orgId));
  };

  public shared ({ caller }) func updateCategory(
    input : Types.UpdateCategoryInput,
  ) : async { #ok : Types.Category; #notFound; #notAuthorized } {
    requireMemberAndPro(caller, input.orgId);
    switch (Lib.updateCategory(categories, input)) {
      case null #notFound;
      case (?cat) #ok(cat);
    };
  };

  public shared ({ caller }) func deleteCategory(
    orgId      : Types.OrgId,
    categoryId : Types.CategoryId,
  ) : async { #ok; #notFound; #notAuthorized } {
    requireMemberAndPro(caller, orgId);
    if (Lib.deleteCategory(categories, categoryId, orgId)) #ok
    else #notFound;
  };

  // ── Product endpoints ─────────────────────────────────────────────────────

  public shared ({ caller }) func createProduct(
    input : Types.CreateProductInput,
  ) : async { #ok : Types.Product; #notAuthorized } {
    requireMemberAndPro(caller, input.orgId);
    #ok(Lib.createProduct(products, nextProductId, input, caller));
  };

  public shared query ({ caller }) func listProducts(
    orgId : Types.OrgId,
  ) : async { #ok : [Types.Product]; #notAuthorized } {
    requireMemberAndPro(caller, orgId);
    #ok(Lib.listProducts(products, orgId));
  };

  public shared query ({ caller }) func getProduct(
    orgId     : Types.OrgId,
    productId : Types.ProductId,
  ) : async { #ok : Types.Product; #notFound; #notAuthorized } {
    requireMemberAndPro(caller, orgId);
    switch (Lib.getProduct(products, productId, orgId)) {
      case null #notFound;
      case (?p) #ok(p);
    };
  };

  public shared ({ caller }) func updateProduct(
    input : Types.UpdateProductInput,
  ) : async { #ok : Types.Product; #notFound; #notAuthorized } {
    requireMemberAndPro(caller, input.orgId);
    switch (Lib.updateProduct(products, input)) {
      case null #notFound;
      case (?p) #ok(p);
    };
  };

  public shared ({ caller }) func deleteProduct(
    orgId     : Types.OrgId,
    productId : Types.ProductId,
  ) : async { #ok; #notFound; #notAuthorized } {
    requireMemberAndPro(caller, orgId);
    if (Lib.deleteProduct(products, productId, orgId)) #ok
    else #notFound;
  };

  /// Bulk import: accepts an array of product inputs; returns success count
  /// and a per-row error list for any rows that failed validation.
  public shared ({ caller }) func bulkImportProducts(
    inputs : [Types.CreateProductInput],
  ) : async { #ok : Types.BulkImportResult; #notAuthorized } {
    // Use the orgId from the first input for auth check; all inputs must match same org
    if (inputs.size() == 0) {
      return #ok({ successCount = 0; errors = [] });
    };
    let orgId = inputs[0].orgId;
    requireMemberAndPro(caller, orgId);
    #ok(Lib.bulkImportProducts(products, nextProductId, inputs, caller));
  };

  // ── Search endpoints ──────────────────────────────────────────────────────

  public shared query ({ caller }) func searchByHsn(
    orgId  : Types.OrgId,
    prefix : Text,
  ) : async [Types.Product] {
    requireMemberAndPro(caller, orgId);
    Lib.searchByHsn(products, orgId, prefix);
  };

  public shared query ({ caller }) func searchByPartNumber(
    orgId  : Types.OrgId,
    prefix : Text,
  ) : async [Types.Product] {
    requireMemberAndPro(caller, orgId);
    Lib.searchByPartNumber(products, orgId, prefix);
  };

  // ── Stock reconciliation ──────────────────────────────────────────────────

  /// Deduct stock for a product when an invoice is sent.
  public shared ({ caller }) func deductProductStock(
    productId : Types.ProductId,
    orgId     : Types.OrgId,
    qty       : Nat,
  ) : async Bool {
    requireMemberAndPro(caller, orgId);
    Lib.deductStock(products, productId, orgId, qty);
  };

  // ── GST Return endpoints ──────────────────────────────────────────────────

  /// Build a GSTR-1 + GSTR-3B draft return for the given period and return type.
  /// returnType: #gstr1 fills only gstr1Entries; #gstr3b computes the 3B summary.
  public shared ({ caller }) func generateGstReturn(
    orgId      : AuthOrgTypes.OrgId,
    year       : Nat,
    month      : Nat,
    returnType : Types.GstReturnType,
  ) : async Types.GstReturn {
    requireMemberAndPro(caller, orgId);
    let period : Types.FilingPeriod = { year; month };
    // In production this would aggregate from paid invoices; here we seed empty entries
    let gstr1Entries : [Types.Gstr1Entry] = [];
    let gstr3bEntry = Lib.computeGstr3b(gstr1Entries);
    Lib.createGstReturn(gstReturns, nextGstReturnId, orgId, period, returnType, gstr1Entries, gstr3bEntry, caller);
  };

  public shared query ({ caller }) func listGstReturns(
    orgId : Types.OrgId,
  ) : async [Types.GstReturn] {
    requireMemberAndPro(caller, orgId);
    Lib.listGstReturns(gstReturns, orgId);
  };

  public shared query ({ caller }) func getGstReturn(
    gstReturnId : Types.GstReturnId,
    orgId       : Types.OrgId,
  ) : async ?Types.GstReturn {
    requireMemberAndPro(caller, orgId);
    Lib.getGstReturn(gstReturns, gstReturnId, orgId);
  };

  public shared ({ caller }) func submitGstReturn(
    gstReturnId : Types.GstReturnId,
    orgId       : Types.OrgId,
  ) : async ?Types.GstReturn {
    requireMemberAndPro(caller, orgId);
    Lib.submitGstReturn(gstReturns, gstReturnId, orgId);
  };

  public shared ({ caller }) func acknowledgeGstReturn(
    gstReturnId : Types.GstReturnId,
    orgId       : Types.OrgId,
  ) : async ?Types.GstReturn {
    requireMemberAndPro(caller, orgId);
    Lib.acknowledgeGstReturn(gstReturns, gstReturnId, orgId);
  };
};
