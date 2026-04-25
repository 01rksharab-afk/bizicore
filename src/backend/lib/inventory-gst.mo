import Map    "mo:core/Map";
import List   "mo:core/List";
import Int    "mo:core/Int";
import Runtime "mo:core/Runtime";
import Time   "mo:core/Time";
import Types  "../types/inventory-gst";
import AuthOrgTypes "../types/auth-org";

module {

  // ── Opaque collection aliases ─────────────────────────────────────────────

  public type CategoryMap  = Map.Map<Types.CategoryId, Types.Category>;
  public type ProductMap   = Map.Map<Types.ProductId,  Types.Product>;
  public type GstReturnMap = Map.Map<Types.GstReturnId, Types.GstReturn>;

  // ── Subscription gate helper ──────────────────────────────────────────────

  /// Returns true when the org's plan is Pro or Enterprise.
  public func isPaidPlan(
    subs  : Map.Map<AuthOrgTypes.OrgId, AuthOrgTypes.OrgSubscription>,
    orgId : AuthOrgTypes.OrgId,
  ) : Bool {
    switch (subs.get(orgId)) {
      case null false;
      case (?sub) {
        switch (sub.plan) {
          case (#pro) true;
          case (#enterprise) true;
          case (#free) false;
        };
      };
    };
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────

  public func createCategory(
    categories : CategoryMap,
    nextId     : { var value : Nat },
    input      : Types.CreateCategoryInput,
    caller     : Principal,
  ) : Types.Category {
    let id = nextId.value;
    nextId.value += 1;
    let cat : Types.Category = {
      id;
      orgId       = input.orgId;
      name        = input.name;
      description = input.description;
      createdAt   = Time.now();
      createdBy   = caller;
    };
    categories.add(id, cat);
    cat;
  };

  public func listCategories(
    categories : CategoryMap,
    orgId      : Types.OrgId,
  ) : [Types.Category] {
    let buf = List.empty<Types.Category>();
    for ((_, cat) in categories.entries()) {
      if (cat.orgId == orgId) { buf.add(cat) };
    };
    buf.toArray();
  };

  public func updateCategory(
    categories : CategoryMap,
    input      : Types.UpdateCategoryInput,
  ) : ?Types.Category {
    switch (categories.get(input.id)) {
      case null null;
      case (?cat) {
        if (cat.orgId != input.orgId) return null;
        let updated : Types.Category = {
          cat with
          name        = input.name;
          description = input.description;
        };
        categories.add(input.id, updated);
        ?updated;
      };
    };
  };

  public func deleteCategory(
    categories : CategoryMap,
    categoryId : Types.CategoryId,
    orgId      : Types.OrgId,
  ) : Bool {
    switch (categories.get(categoryId)) {
      case null false;
      case (?cat) {
        if (cat.orgId != orgId) return false;
        categories.remove(categoryId);
        true;
      };
    };
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────

  public func createProduct(
    products : ProductMap,
    nextId   : { var value : Nat },
    input    : Types.CreateProductInput,
    caller   : Principal,
  ) : Types.Product {
    let id = nextId.value;
    nextId.value += 1;
    let prod : Types.Product = {
      id;
      orgId       = input.orgId;
      categoryId  = input.categoryId;
      name        = input.name;
      description = input.description;
      hsnCode     = input.hsnCode;
      partNumber  = input.partNumber;
      unit        = input.unit;
      rate        = input.rate;
      taxPercent  = input.taxPercent;
      stockQty    = input.stockQty;
      createdAt   = Time.now();
      createdBy   = caller;
    };
    products.add(id, prod);
    prod;
  };

  public func listProducts(
    products : ProductMap,
    orgId    : Types.OrgId,
  ) : [Types.Product] {
    let buf = List.empty<Types.Product>();
    for ((_, p) in products.entries()) {
      if (p.orgId == orgId) { buf.add(p) };
    };
    buf.toArray();
  };

  public func getProduct(
    products  : ProductMap,
    productId : Types.ProductId,
    orgId     : Types.OrgId,
  ) : ?Types.Product {
    switch (products.get(productId)) {
      case null null;
      case (?p) { if (p.orgId == orgId) ?p else null };
    };
  };

  public func updateProduct(
    products : ProductMap,
    input    : Types.UpdateProductInput,
  ) : ?Types.Product {
    switch (products.get(input.id)) {
      case null null;
      case (?p) {
        if (p.orgId != input.orgId) return null;
        let updated : Types.Product = {
          p with
          categoryId  = input.categoryId;
          name        = input.name;
          description = input.description;
          hsnCode     = input.hsnCode;
          partNumber  = input.partNumber;
          unit        = input.unit;
          rate        = input.rate;
          taxPercent  = input.taxPercent;
          stockQty    = input.stockQty;
        };
        products.add(input.id, updated);
        ?updated;
      };
    };
  };

  public func deleteProduct(
    products  : ProductMap,
    productId : Types.ProductId,
    orgId     : Types.OrgId,
  ) : Bool {
    switch (products.get(productId)) {
      case null false;
      case (?p) {
        if (p.orgId != orgId) return false;
        products.remove(productId);
        true;
      };
    };
  };

  // ── Bulk import ───────────────────────────────────────────────────────────

  public func bulkImportProducts(
    products : ProductMap,
    nextId   : { var value : Nat },
    inputs   : [Types.CreateProductInput],
    caller   : Principal,
  ) : Types.BulkImportResult {
    let errors = List.empty<Types.BulkImportError>();
    var successCount : Nat = 0;
    var i : Nat = 0;
    for (input in inputs.values()) {
      if (input.name == "") {
        errors.add({ index = i; message = "" });
      } else {
        let _ = createProduct(products, nextId, input, caller);
        successCount += 1;
      };
      i += 1;
    };
    { successCount; errors = errors.toArray() };
  };

  // ── Search ────────────────────────────────────────────────────────────────

  public func searchByHsn(
    products : ProductMap,
    orgId    : Types.OrgId,
    prefix   : Text,
  ) : [Types.Product] {
    let buf = List.empty<Types.Product>();
    for ((_, p) in products.entries()) {
      if (p.orgId == orgId and p.hsnCode.startsWith(#text prefix)) {
        buf.add(p);
      };
    };
    buf.toArray();
  };

  public func searchByPartNumber(
    products : ProductMap,
    orgId    : Types.OrgId,
    prefix   : Text,
  ) : [Types.Product] {
    let buf = List.empty<Types.Product>();
    for ((_, p) in products.entries()) {
      if (p.orgId == orgId and p.partNumber.startsWith(#text prefix)) {
        buf.add(p);
      };
    };
    buf.toArray();
  };

  // ── Stock deduction ───────────────────────────────────────────────────────

  /// Deducts `qty` from the product's stockQty. Returns false if product not
  /// found or stock is insufficient.
  public func deductStock(
    products  : ProductMap,
    productId : Types.ProductId,
    orgId     : Types.OrgId,
    qty       : Nat,
  ) : Bool {
    switch (products.get(productId)) {
      case null false;
      case (?p) {
        if (p.orgId != orgId) return false;
        if (p.stockQty < qty) return false;
        let newQty : Nat = Int.abs(p.stockQty.toInt() - qty.toInt());
        products.add(productId, { p with stockQty = newQty });
        true;
      };
    };
  };

  // ── GST Returns ───────────────────────────────────────────────────────────

  public func computeGstr3b(entries : [Types.Gstr1Entry]) : Types.Gstr3bEntry {
    var igstTotal : Float = 0.0;
    var cgstTotal : Float = 0.0;
    var sgstTotal : Float = 0.0;
    for (e in entries.values()) {
      igstTotal += e.igst;
      cgstTotal += e.cgst;
      sgstTotal += e.sgst;
    };
    let totalTax = igstTotal + cgstTotal + sgstTotal;
    {
      igstPayable    = igstTotal;
      cgstPayable    = cgstTotal;
      sgstPayable    = sgstTotal;
      inputTaxCredit = 0.0;   // ITC to be set externally
      netTax         = totalTax;
    };
  };

  public func createGstReturn(
    gstReturns   : GstReturnMap,
    nextId       : { var value : Nat },
    orgId        : Types.OrgId,
    period       : Types.FilingPeriod,
    returnType   : Types.GstReturnType,
    gstr1Entries : [Types.Gstr1Entry],
    gstr3bEntry  : Types.Gstr3bEntry,
    caller       : Principal,
  ) : Types.GstReturn {
    let id = nextId.value;
    nextId.value += 1;
    let ret : Types.GstReturn = {
      id;
      orgId;
      period;
      returnType;
      gstr1Entries;
      gstr3bEntry;
      status    = #draft;
      filedAt   = null;
      createdAt = Time.now();
      createdBy = caller;
    };
    gstReturns.add(id, ret);
    ret;
  };

  public func listGstReturns(
    gstReturns : GstReturnMap,
    orgId      : Types.OrgId,
  ) : [Types.GstReturn] {
    let buf = List.empty<Types.GstReturn>();
    for ((_, r) in gstReturns.entries()) {
      if (r.orgId == orgId) { buf.add(r) };
    };
    buf.toArray();
  };

  public func getGstReturn(
    gstReturns  : GstReturnMap,
    gstReturnId : Types.GstReturnId,
    orgId       : Types.OrgId,
  ) : ?Types.GstReturn {
    switch (gstReturns.get(gstReturnId)) {
      case null null;
      case (?r) { if (r.orgId == orgId) ?r else null };
    };
  };

  public func submitGstReturn(
    gstReturns  : GstReturnMap,
    gstReturnId : Types.GstReturnId,
    orgId       : Types.OrgId,
  ) : ?Types.GstReturn {
    switch (gstReturns.get(gstReturnId)) {
      case null null;
      case (?r) {
        if (r.orgId != orgId) return null;
        if (r.status != #draft) return null;
        let updated = { r with status = #submitted; filedAt = ?Time.now() };
        gstReturns.add(gstReturnId, updated);
        ?updated;
      };
    };
  };

  public func acknowledgeGstReturn(
    gstReturns  : GstReturnMap,
    gstReturnId : Types.GstReturnId,
    orgId       : Types.OrgId,
  ) : ?Types.GstReturn {
    switch (gstReturns.get(gstReturnId)) {
      case null null;
      case (?r) {
        if (r.orgId != orgId) return null;
        if (r.status != #submitted) return null;
        let updated = { r with status = #acknowledged };
        gstReturns.add(gstReturnId, updated);
        ?updated;
      };
    };
  };
};
