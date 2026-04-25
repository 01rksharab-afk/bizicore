import InvTypes "../types/inventory-master";
import AuthOrgTypes "../types/auth-org";
import InvLib "../lib/inventory-master";
import Runtime "mo:core/Runtime";

mixin (
  itemMasters    : InvLib.ItemMasterMap,
  unitsOfMeasure : InvLib.UomMap,
  stockLevels    : InvLib.StockLevelMap,
  itemAttributes : InvLib.ItemAttributeMap,
  nextItemId     : InvLib.NextIdRef,
  nextUomId      : InvLib.NextIdRef,
  nextStockId    : InvLib.NextIdRef,
  nextAttrId     : InvLib.NextIdRef,
) {

  // ── Units of Measure ───────────────────────────────────────────────────────

  public shared ({ caller }) func createUom(
    orgId : InvTypes.OrgId,
    input : InvTypes.CreateUomInput,
  ) : async InvTypes.UnitOfMeasure {
    InvLib.createUom(unitsOfMeasure, nextUomId, orgId, input)
  };

  public shared ({ caller }) func deleteUom(orgId : InvTypes.OrgId, id : Nat) : async Bool {
    InvLib.deleteUom(unitsOfMeasure, orgId, id)
  };

  public query func listUoms(orgId : InvTypes.OrgId) : async [InvTypes.UnitOfMeasure] {
    InvLib.listUoms(unitsOfMeasure, orgId)
  };

  // ── Item Master ────────────────────────────────────────────────────────────

  public shared ({ caller }) func createItemMaster(
    orgId : InvTypes.OrgId,
    input : InvTypes.CreateItemMasterInput,
  ) : async InvTypes.ItemMaster {
    InvLib.createItem(itemMasters, nextItemId, orgId, input)
  };

  public shared ({ caller }) func updateItemMaster(
    orgId : InvTypes.OrgId,
    input : InvTypes.UpdateItemMasterInput,
  ) : async ?InvTypes.ItemMaster {
    InvLib.updateItem(itemMasters, orgId, input)
  };

  public shared ({ caller }) func deleteItemMaster(orgId : InvTypes.OrgId, id : Nat) : async Bool {
    InvLib.deleteItem(itemMasters, orgId, id)
  };

  public query func listItemMasters(
    orgId      : InvTypes.OrgId,
    searchText : ?Text,
  ) : async [InvTypes.ItemMaster] {
    InvLib.listItems(itemMasters, orgId, searchText)
  };

  public query func getItemMaster(orgId : InvTypes.OrgId, id : Nat) : async ?InvTypes.ItemMaster {
    InvLib.getItem(itemMasters, orgId, id)
  };

  // ── Stock Levels ───────────────────────────────────────────────────────────

  public shared ({ caller }) func upsertStockLevel(
    orgId : InvTypes.OrgId,
    input : InvTypes.UpdateStockLevelInput,
  ) : async InvTypes.StockLevel {
    InvLib.upsertStock(stockLevels, nextStockId, orgId, input)
  };

  public query func listStockLevels(
    orgId      : InvTypes.OrgId,
    locationId : ?Nat,
  ) : async [InvTypes.StockLevel] {
    InvLib.listStock(stockLevels, orgId, locationId)
  };

  // ── Item Attributes ────────────────────────────────────────────────────────

  public shared ({ caller }) func createItemAttribute(
    orgId : InvTypes.OrgId,
    input : InvTypes.CreateItemAttributeInput,
  ) : async InvTypes.ItemAttributeDef {
    InvLib.createAttribute(itemAttributes, nextAttrId, orgId, input)
  };

  public shared ({ caller }) func deleteItemAttribute(orgId : InvTypes.OrgId, id : Nat) : async Bool {
    InvLib.deleteAttribute(itemAttributes, orgId, id)
  };

  public query func listItemAttributes(orgId : InvTypes.OrgId) : async [InvTypes.ItemAttributeDef] {
    InvLib.listAttributes(itemAttributes, orgId)
  };
};
