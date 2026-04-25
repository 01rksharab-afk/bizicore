import Common "common";

module {
  public type OrgId    = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // ── Category ─────────────────────────────────────────────────────────────

  public type CategoryId = Nat;

  public type Category = {
    id          : CategoryId;
    orgId       : OrgId;
    name        : Text;
    description : Text;
    createdAt   : Timestamp;
    createdBy   : Principal;
  };

  public type CreateCategoryInput = {
    orgId       : OrgId;
    name        : Text;
    description : Text;
  };

  public type UpdateCategoryInput = {
    id          : CategoryId;
    orgId       : OrgId;
    name        : Text;
    description : Text;
  };

  // ── Product ───────────────────────────────────────────────────────────────

  public type ProductId = Nat;

  // Tax slabs permitted in GST: 0, 5, 12, 18, 28
  public type GstSlab = { #gst0; #gst5; #gst12; #gst18; #gst28 };

  public type Product = {
    id          : ProductId;
    orgId       : OrgId;
    categoryId  : ?CategoryId;
    name        : Text;
    description : Text;
    hsnCode     : Text;   // HSN / SAC code
    partNumber  : Text;   // internal part / SKU number
    unit        : Text;   // e.g. "PCS", "KG", "MTR"
    rate        : Float;  // unit price (base currency)
    taxPercent  : Nat;    // 0 | 5 | 12 | 18 | 28
    stockQty    : Nat;
    createdAt   : Timestamp;
    createdBy   : Principal;
  };

  public type CreateProductInput = {
    orgId       : OrgId;
    categoryId  : ?CategoryId;
    name        : Text;
    description : Text;
    hsnCode     : Text;
    partNumber  : Text;
    unit        : Text;
    rate        : Float;
    taxPercent  : Nat;
    stockQty    : Nat;
  };

  public type UpdateProductInput = {
    id          : ProductId;
    orgId       : OrgId;
    categoryId  : ?CategoryId;
    name        : Text;
    description : Text;
    hsnCode     : Text;
    partNumber  : Text;
    unit        : Text;
    rate        : Float;
    taxPercent  : Nat;
    stockQty    : Nat;
  };

  // Result returned from bulk import
  public type BulkImportResult = {
    successCount : Nat;
    errors       : [BulkImportError];
  };

  public type BulkImportError = {
    index   : Nat;   // zero-based row index in the input array
    message : Text;
  };

  // ── GST Filing ────────────────────────────────────────────────────────────

  public type GstReturnId = Nat;

  public type FilingStatus = { #draft; #submitted; #acknowledged };

  // Period expressed as (month 1–12, year e.g. 2024)
  public type FilingPeriod = {
    month : Nat;
    year  : Nat;
  };

  // One row in GSTR-1 (outward supplies)
  public type Gstr1Entry = {
    invoiceNumber  : Text;
    invoiceDate    : Timestamp;
    customerGstin  : ?Text;   // null for unregistered buyers
    hsnCode        : Text;
    taxableValue   : Float;
    igst           : Float;
    cgst           : Float;
    sgst           : Float;
  };

  // Summary row for GSTR-3B
  public type Gstr3bEntry = {
    igstPayable    : Float;
    cgstPayable    : Float;
    sgstPayable    : Float;
    inputTaxCredit : Float;
    netTax         : Float;
  };

  // Return type selector for generateGstReturn
  public type GstReturnType = { #gstr1; #gstr3b };

  // A GST return filing record
  public type GstReturn = {
    id           : GstReturnId;
    orgId        : OrgId;
    period       : FilingPeriod;
    returnType   : GstReturnType;
    gstr1Entries : [Gstr1Entry];
    gstr3bEntry  : Gstr3bEntry;
    status       : FilingStatus;
    filedAt      : ?Timestamp;
    createdAt    : Timestamp;
    createdBy    : Principal;
  };
};
