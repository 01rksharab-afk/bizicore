module {
  public type OrgId    = Nat;
  public type Timestamp = Int;

  // ── Inventory: Sub-categories ────────────────────────────────────────────────

  // Category with optional parentId — null means top-level
  public type InventoryCategory = {
    id          : Nat;
    orgId       : OrgId;
    name        : Text;
    description : Text;
    parentId    : ?Nat;   // null = top-level; ?id = sub-category under that parent
    isActive    : Bool;
    createdAt   : Timestamp;
  };

  public type CreateInventoryCategoryInput = {
    name        : Text;
    description : Text;
    parentId    : ?Nat;
    isActive    : Bool;
  };

  public type UpdateInventoryCategoryInput = {
    id          : Nat;
    name        : Text;
    description : Text;
    parentId    : ?Nat;
    isActive    : Bool;
  };

  // ── HSN/SAC Code Master ──────────────────────────────────────────────────────

  public type HsnSacCodeType = { #auto_; #manual_ };

  public type HsnSacCode = {
    id          : Text;
    orgId       : OrgId;
    hsnCode     : ?Text;   // null when only SAC is applicable
    sacCode     : ?Text;   // null when only HSN is applicable
    name        : Text;
    category    : Text;
    description : Text;
    codeType    : HsnSacCodeType;
    isActive    : Bool;
    createdAt   : Timestamp;
    updatedAt   : Timestamp;
  };

  public type CreateHsnSacCodeInput = {
    hsnCode     : ?Text;
    sacCode     : ?Text;
    name        : Text;
    category    : Text;
    description : Text;
    codeType    : HsnSacCodeType;
    isActive    : Bool;
  };

  public type UpdateHsnSacCodeInput = {
    id          : Text;
    hsnCode     : ?Text;
    sacCode     : ?Text;
    name        : Text;
    category    : Text;
    description : Text;
    codeType    : HsnSacCodeType;
    isActive    : Bool;
  };

  public type HsnSacFilter = {
    codeType : ?HsnSacCodeType;
    category : ?Text;
    isActive : ?Bool;
  };

  // ── Finance Categories ───────────────────────────────────────────────────────

  public type FinanceCategoryType = { #income_; #expense_ };

  public type FinanceCategory = {
    id           : Text;
    orgId        : OrgId;
    name         : Text;
    description  : Text;
    categoryType : FinanceCategoryType;
    parentId     : ?Text;  // null = top-level; ?id = sub-category
    isActive     : Bool;
    createdAt    : Timestamp;
  };

  public type CreateFinanceCategoryInput = {
    name         : Text;
    description  : Text;
    categoryType : FinanceCategoryType;
    parentId     : ?Text;
    isActive     : Bool;
  };

  public type UpdateFinanceCategoryInput = {
    id           : Text;
    name         : Text;
    description  : Text;
    categoryType : FinanceCategoryType;
    parentId     : ?Text;
    isActive     : Bool;
  };

  public type FinanceCategoryFilter = {
    categoryType : ?FinanceCategoryType;
    parentId     : ?Text;   // ?null means "top-level only"; omit for all
    isActive     : ?Bool;
  };

  // ── Module Visibility Config ─────────────────────────────────────────────────

  // Stored as [(moduleName, enabled)] — all modules default to true
  public type ModuleVisibilityEntry = {
    moduleName : Text;
    enabled    : Bool;
  };
};
