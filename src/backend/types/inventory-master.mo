module {
  public type OrgId = Nat;
  public type Timestamp = Int;

  public type ItemAttribute_ = {
    attributeId : Text;
    name        : Text;
    value       : Text;
  };

  public type ItemMaster = {
    id               : Nat;
    orgId            : OrgId;
    itemCode         : Text;
    name             : Text;
    description      : Text;
    categoryId       : ?Nat;
    categoryName     : Text;
    uomId            : ?Nat;
    uomName          : Text;
    hsnCode          : Text;
    partNumber       : Text;
    rate             : Float;
    taxPct           : Float;
    barcode          : Text;
    enableBatch      : Bool;
    enableSerial     : Bool;
    enableShelfLife  : Bool;
    attributes       : [ItemAttribute_];
    createdAt        : Timestamp;
  };

  public type UnitOfMeasure = {
    id               : Nat;
    orgId            : OrgId;
    name             : Text;
    symbol           : Text;
    baseUnit         : Text;
    conversionFactor : Float;
    createdAt        : Timestamp;
  };

  public type StockLevel = {
    id             : Nat;
    orgId          : OrgId;
    itemId         : Nat;
    itemName       : Text;
    locationId     : ?Nat;
    locationName   : Text;
    quantityOnHand : Float;
    reorderLevel   : Float;
    createdAt      : Timestamp;
  };

  public type AttributeType = { #text_; #number_; #list_ };

  public type ItemAttributeDef = {
    id        : Nat;
    orgId     : OrgId;
    name      : Text;
    type_     : AttributeType;
    values    : [Text];
    createdAt : Timestamp;
  };

  // ── Input types ─────────────────────────────────────────────────────────────

  public type CreateItemMasterInput = {
    itemCode        : Text;
    name            : Text;
    description     : Text;
    categoryId      : ?Nat;
    categoryName    : Text;
    uomId           : ?Nat;
    uomName         : Text;
    hsnCode         : Text;
    partNumber      : Text;
    rate            : Float;
    taxPct          : Float;
    barcode         : Text;
    enableBatch     : Bool;
    enableSerial    : Bool;
    enableShelfLife : Bool;
    attributes      : [ItemAttribute_];
  };

  public type UpdateItemMasterInput = {
    id              : Nat;
    itemCode        : Text;
    name            : Text;
    description     : Text;
    categoryId      : ?Nat;
    categoryName    : Text;
    uomId           : ?Nat;
    uomName         : Text;
    hsnCode         : Text;
    partNumber      : Text;
    rate            : Float;
    taxPct          : Float;
    barcode         : Text;
    enableBatch     : Bool;
    enableSerial    : Bool;
    enableShelfLife : Bool;
    attributes      : [ItemAttribute_];
  };

  public type CreateUomInput = {
    name             : Text;
    symbol           : Text;
    baseUnit         : Text;
    conversionFactor : Float;
  };

  public type UpdateUomInput = {
    id               : Nat;
    name             : Text;
    symbol           : Text;
    baseUnit         : Text;
    conversionFactor : Float;
  };

  public type UpdateStockLevelInput = {
    itemId         : Nat;
    locationId     : ?Nat;
    locationName   : Text;
    quantityOnHand : Float;
    reorderLevel   : Float;
  };

  public type CreateItemAttributeInput = {
    name   : Text;
    type_  : AttributeType;
    values : [Text];
  };

  public type UpdateItemAttributeInput = {
    id     : Nat;
    name   : Text;
    type_  : AttributeType;
    values : [Text];
  };
};
