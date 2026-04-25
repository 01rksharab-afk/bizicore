import IfcTypes "../types/inventory-finance-config";
import IfcLib "../lib/inventory-finance-config";

mixin (
  invCategories     : IfcLib.InvCategoryMap,
  hsnSacCodes       : IfcLib.HsnSacMap,
  finCategories     : IfcLib.FinCategoryMap,
  moduleVisibility  : IfcLib.ModuleVisMap,
  nextInvCatId      : IfcLib.NextIdRef,
  nextHsnSacTextId  : IfcLib.NextTextIdRef,
  nextFinCatTextId  : IfcLib.NextTextIdRef,
) {

  // ── Inventory Categories ─────────────────────────────────────────────────────

  public shared ({ caller = _ }) func createInventoryCategory(
    orgId : IfcTypes.OrgId,
    input : IfcTypes.CreateInventoryCategoryInput,
  ) : async IfcTypes.InventoryCategory {
    IfcLib.createInvCategory(invCategories, nextInvCatId, orgId, input)
  };

  public shared ({ caller = _ }) func updateInventoryCategory(
    orgId : IfcTypes.OrgId,
    input : IfcTypes.UpdateInventoryCategoryInput,
  ) : async ?IfcTypes.InventoryCategory {
    IfcLib.updateInvCategory(invCategories, orgId, input)
  };

  public shared ({ caller = _ }) func deleteInventoryCategory(
    orgId : IfcTypes.OrgId,
    id    : Nat,
  ) : async Bool {
    IfcLib.deleteInvCategory(invCategories, orgId, id)
  };

  /// parentId: null = list all; ?null = list top-level only; ?(id) = list sub-categories of id
  public query func listInventoryCategories(
    orgId    : IfcTypes.OrgId,
    parentId : ??Nat,
  ) : async [IfcTypes.InventoryCategory] {
    IfcLib.listInvCategories(invCategories, orgId, parentId)
  };

  // ── HSN/SAC Code Master ──────────────────────────────────────────────────────

  public shared ({ caller = _ }) func createHsnSacCode(
    orgId : IfcTypes.OrgId,
    input : IfcTypes.CreateHsnSacCodeInput,
  ) : async IfcTypes.HsnSacCode {
    IfcLib.createHsnSacCode(hsnSacCodes, nextHsnSacTextId, orgId, input)
  };

  public shared ({ caller = _ }) func updateHsnSacCode(
    orgId : IfcTypes.OrgId,
    input : IfcTypes.UpdateHsnSacCodeInput,
  ) : async ?IfcTypes.HsnSacCode {
    IfcLib.updateHsnSacCode(hsnSacCodes, orgId, input)
  };

  public shared ({ caller = _ }) func deleteHsnSacCode(
    orgId : IfcTypes.OrgId,
    id    : Text,
  ) : async Bool {
    IfcLib.deleteHsnSacCode(hsnSacCodes, orgId, id)
  };

  public query func listHsnSacCodes(
    orgId  : IfcTypes.OrgId,
    filter : IfcTypes.HsnSacFilter,
  ) : async [IfcTypes.HsnSacCode] {
    IfcLib.listHsnSacCodes(hsnSacCodes, orgId, filter)
  };

  // ── Finance Categories ───────────────────────────────────────────────────────

  public shared ({ caller = _ }) func createFinanceCategory(
    orgId : IfcTypes.OrgId,
    input : IfcTypes.CreateFinanceCategoryInput,
  ) : async IfcTypes.FinanceCategory {
    IfcLib.createFinanceCategory(finCategories, nextFinCatTextId, orgId, input)
  };

  public shared ({ caller = _ }) func updateFinanceCategory(
    orgId : IfcTypes.OrgId,
    input : IfcTypes.UpdateFinanceCategoryInput,
  ) : async ?IfcTypes.FinanceCategory {
    IfcLib.updateFinanceCategory(finCategories, orgId, input)
  };

  public shared ({ caller = _ }) func deleteFinanceCategory(
    orgId : IfcTypes.OrgId,
    id    : Text,
  ) : async Bool {
    IfcLib.deleteFinanceCategory(finCategories, orgId, id)
  };

  public query func listFinanceCategories(
    orgId  : IfcTypes.OrgId,
    filter : IfcTypes.FinanceCategoryFilter,
  ) : async [IfcTypes.FinanceCategory] {
    IfcLib.listFinanceCategories(finCategories, orgId, filter)
  };

  // ── Module Visibility ────────────────────────────────────────────────────────

  public shared ({ caller = _ }) func setModuleVisibility(
    orgId   : IfcTypes.OrgId,
    module_ : Text,
    enabled : Bool,
  ) : async () {
    IfcLib.setModuleVisibility(moduleVisibility, orgId, module_, enabled)
  };

  public query func getModuleVisibility(
    orgId : IfcTypes.OrgId,
  ) : async [(Text, Bool)] {
    IfcLib.getModuleVisibility(moduleVisibility, orgId)
  };
};
