import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Types "../types/inventory-master";
import AuthOrgTypes "../types/auth-org";

module {
  public type OrgId     = Types.OrgId;
  public type RoleChecker = (caller : Principal, orgId : OrgId) -> ?AuthOrgTypes.OrgRole;

  // ── Opaque state types ─────────────────────────────────────────────────────
  public type ItemMasterMap      = Map.Map<Nat, Types.ItemMaster>;
  public type UomMap             = Map.Map<Nat, Types.UnitOfMeasure>;
  public type StockLevelMap      = Map.Map<Nat, Types.StockLevel>;
  public type ItemAttributeMap   = Map.Map<Nat, Types.ItemAttributeDef>;
  public type NextIdRef          = { var value : Nat };

  // ── UOM ────────────────────────────────────────────────────────────────────
  public func createUom(
    uoms   : UomMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateUomInput,
  ) : Types.UnitOfMeasure {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let uom : Types.UnitOfMeasure = {
      id;
      orgId;
      name             = input.name;
      symbol           = input.symbol;
      baseUnit         = input.baseUnit;
      conversionFactor = input.conversionFactor;
      createdAt        = now;
    };
    uoms.add(id, uom);
    uom
  };

  public func listUoms(uoms : UomMap, orgId : OrgId) : [Types.UnitOfMeasure] {
    uoms.values().filter(func(u) { u.orgId == orgId }).toArray()
  };

  public func deleteUom(uoms : UomMap, orgId : OrgId, id : Nat) : Bool {
    switch (uoms.get(id)) {
      case (?u) {
        if (u.orgId != orgId) return false;
        uoms.remove(id);
        true
      };
      case null false;
    }
  };

  // ── Item Master ────────────────────────────────────────────────────────────
  public func createItem(
    items  : ItemMasterMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateItemMasterInput,
  ) : Types.ItemMaster {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let item : Types.ItemMaster = {
      id;
      orgId;
      itemCode        = input.itemCode;
      name            = input.name;
      description     = input.description;
      categoryId      = input.categoryId;
      categoryName    = input.categoryName;
      uomId           = input.uomId;
      uomName         = input.uomName;
      hsnCode         = input.hsnCode;
      partNumber      = input.partNumber;
      rate            = input.rate;
      taxPct          = input.taxPct;
      barcode         = input.barcode;
      enableBatch     = input.enableBatch;
      enableSerial    = input.enableSerial;
      enableShelfLife = input.enableShelfLife;
      attributes      = input.attributes;
      createdAt       = now;
    };
    items.add(id, item);
    item
  };

  public func getItem(items : ItemMasterMap, orgId : OrgId, id : Nat) : ?Types.ItemMaster {
    switch (items.get(id)) {
      case (?i) { if (i.orgId == orgId) ?i else null };
      case null null;
    }
  };

  public func updateItem(
    items  : ItemMasterMap,
    orgId  : OrgId,
    input  : Types.UpdateItemMasterInput,
  ) : ?Types.ItemMaster {
    let existing = switch (items.get(input.id)) {
      case (?i) i;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    let updated : Types.ItemMaster = {
      existing with
      itemCode        = input.itemCode;
      name            = input.name;
      description     = input.description;
      categoryId      = input.categoryId;
      categoryName    = input.categoryName;
      uomId           = input.uomId;
      uomName         = input.uomName;
      hsnCode         = input.hsnCode;
      partNumber      = input.partNumber;
      rate            = input.rate;
      taxPct          = input.taxPct;
      barcode         = input.barcode;
      enableBatch     = input.enableBatch;
      enableSerial    = input.enableSerial;
      enableShelfLife = input.enableShelfLife;
      attributes      = input.attributes;
    };
    items.add(input.id, updated);
    ?updated
  };

  public func deleteItem(items : ItemMasterMap, orgId : OrgId, id : Nat) : Bool {
    switch (items.get(id)) {
      case (?i) {
        if (i.orgId != orgId) return false;
        items.remove(id);
        true
      };
      case null false;
    }
  };

  public func listItems(
    items      : ItemMasterMap,
    orgId      : OrgId,
    searchText : ?Text,
  ) : [Types.ItemMaster] {
    items.values().filter(func(i) {
      if (i.orgId != orgId) return false;
      switch (searchText) {
        case (?q) {
          let lower = q.toLower();
          if (not (i.name.toLower().contains(#text lower) or
                   i.itemCode.toLower().contains(#text lower) or
                   i.hsnCode.toLower().contains(#text lower) or
                   i.partNumber.toLower().contains(#text lower))) return false
        };
        case null {};
      };
      true
    }).toArray()
  };

  // ── Stock Levels ───────────────────────────────────────────────────────────
  public func upsertStock(
    stock  : StockLevelMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.UpdateStockLevelInput,
  ) : Types.StockLevel {
    let now = Time.now();
    // Find existing entry for this item+location
    let existing = stock.values().find(func(s) {
      s.orgId == orgId and s.itemId == input.itemId and s.locationId == input.locationId
    });
    switch (existing) {
      case (?s) {
        let updated : Types.StockLevel = {
          s with
          locationName   = input.locationName;
          quantityOnHand = input.quantityOnHand;
          reorderLevel   = input.reorderLevel;
          createdAt      = s.createdAt;
        };
        stock.add(s.id, updated);
        updated
      };
      case null {
        let id = nextId.value;
        nextId.value += 1;
        let sl : Types.StockLevel = {
          id;
          orgId;
          itemId         = input.itemId;
          itemName       = "";
          locationId     = input.locationId;
          locationName   = input.locationName;
          quantityOnHand = input.quantityOnHand;
          reorderLevel   = input.reorderLevel;
          createdAt      = now;
        };
        stock.add(id, sl);
        sl
      };
    }
  };

  public func listStock(stock : StockLevelMap, orgId : OrgId, locationId : ?Nat) : [Types.StockLevel] {
    stock.values().filter(func(s) {
      if (s.orgId != orgId) return false;
      switch (locationId) {
        case (?lid) { s.locationId == ?lid };
        case null   true;
      }
    }).toArray()
  };

  // ── Item Attributes ────────────────────────────────────────────────────────
  public func createAttribute(
    attrs  : ItemAttributeMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateItemAttributeInput,
  ) : Types.ItemAttributeDef {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let a : Types.ItemAttributeDef = {
      id;
      orgId;
      name      = input.name;
      type_     = input.type_;
      values    = input.values;
      createdAt = now;
    };
    attrs.add(id, a);
    a
  };

  public func listAttributes(attrs : ItemAttributeMap, orgId : OrgId) : [Types.ItemAttributeDef] {
    attrs.values().filter(func(a) { a.orgId == orgId }).toArray()
  };

  public func deleteAttribute(attrs : ItemAttributeMap, orgId : OrgId, id : Nat) : Bool {
    switch (attrs.get(id)) {
      case (?a) {
        if (a.orgId != orgId) return false;
        attrs.remove(id);
        true
      };
      case null false;
    }
  };
};
