import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/inventory-finance-config";

module {
  public type OrgId = Types.OrgId;

  // ── Opaque state types ───────────────────────────────────────────────────────
  public type InvCategoryMap   = Map.Map<Nat,  Types.InventoryCategory>;
  public type HsnSacMap        = Map.Map<Text, Types.HsnSacCode>;
  public type FinCategoryMap   = Map.Map<Text, Types.FinanceCategory>;
  // Module visibility: orgId -> [(moduleName, enabled)]
  public type ModuleVisMap     = Map.Map<Nat, List.List<Types.ModuleVisibilityEntry>>;
  public type NextIdRef        = { var value : Nat };
  public type NextTextIdRef    = { var value : Nat };

  // ── Inventory Categories ─────────────────────────────────────────────────────

  public func createInvCategory(
    cats   : InvCategoryMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateInventoryCategoryInput,
  ) : Types.InventoryCategory {
    let id = nextId.value;
    nextId.value += 1;
    let cat : Types.InventoryCategory = {
      id; orgId;
      name        = input.name;
      description = input.description;
      parentId    = input.parentId;
      isActive    = input.isActive;
      createdAt   = Time.now();
    };
    cats.add(id, cat);
    cat
  };

  public func updateInvCategory(
    cats  : InvCategoryMap,
    orgId : OrgId,
    input : Types.UpdateInventoryCategoryInput,
  ) : ?Types.InventoryCategory {
    switch (cats.get(input.id)) {
      case (?existing) {
        if (existing.orgId != orgId) return null;
        let updated : Types.InventoryCategory = {
          existing with
          name        = input.name;
          description = input.description;
          parentId    = input.parentId;
          isActive    = input.isActive;
        };
        cats.add(input.id, updated);
        ?updated
      };
      case null null;
    }
  };

  public func deleteInvCategory(cats : InvCategoryMap, orgId : OrgId, id : Nat) : Bool {
    switch (cats.get(id)) {
      case (?c) {
        if (c.orgId != orgId) return false;
        cats.remove(id);
        true
      };
      case null false;
    }
  };

  public func listInvCategories(
    cats     : InvCategoryMap,
    orgId    : OrgId,
    parentId : ??Nat,
  ) : [Types.InventoryCategory] {
    cats.values().filter(func(c) {
      if (c.orgId != orgId) return false;
      switch (parentId) {
        case null true;
        case (?pid) {
          switch (pid, c.parentId) {
            case (null, null)   true;
            case (?a,  ?b)      a == b;
            case _              false;
          }
        };
      }
    }).toArray()
  };

  // ── HSN/SAC Code Master ──────────────────────────────────────────────────────

  public func createHsnSacCode(
    codes  : HsnSacMap,
    nextId : NextTextIdRef,
    orgId  : OrgId,
    input  : Types.CreateHsnSacCodeInput,
  ) : Types.HsnSacCode {
    let id = "h" # nextId.value.toText();
    nextId.value += 1;
    let now = Time.now();
    let code : Types.HsnSacCode = {
      id; orgId;
      hsnCode     = input.hsnCode;
      sacCode     = input.sacCode;
      name        = input.name;
      category    = input.category;
      description = input.description;
      codeType    = input.codeType;
      isActive    = input.isActive;
      createdAt   = now;
      updatedAt   = now;
    };
    codes.add(id, code);
    code
  };

  public func updateHsnSacCode(
    codes : HsnSacMap,
    orgId : OrgId,
    input : Types.UpdateHsnSacCodeInput,
  ) : ?Types.HsnSacCode {
    switch (codes.get(input.id)) {
      case (?existing) {
        if (existing.orgId != orgId) return null;
        let updated : Types.HsnSacCode = {
          existing with
          hsnCode     = input.hsnCode;
          sacCode     = input.sacCode;
          name        = input.name;
          category    = input.category;
          description = input.description;
          codeType    = input.codeType;
          isActive    = input.isActive;
          updatedAt   = Time.now();
        };
        codes.add(input.id, updated);
        ?updated
      };
      case null null;
    }
  };

  public func deleteHsnSacCode(codes : HsnSacMap, orgId : OrgId, id : Text) : Bool {
    switch (codes.get(id)) {
      case (?c) {
        if (c.orgId != orgId) return false;
        codes.remove(id);
        true
      };
      case null false;
    }
  };

  public func listHsnSacCodes(
    codes  : HsnSacMap,
    orgId  : OrgId,
    filter : Types.HsnSacFilter,
  ) : [Types.HsnSacCode] {
    codes.values().filter(func(c) {
      if (c.orgId != orgId) return false;
      switch (filter.codeType) {
        case (?ct) { if (c.codeType != ct) return false };
        case null  {};
      };
      switch (filter.category) {
        case (?cat) { if (c.category != cat) return false };
        case null   {};
      };
      switch (filter.isActive) {
        case (?a) { if (c.isActive != a) return false };
        case null {};
      };
      true
    }).toArray()
  };

  // ── Finance Categories ───────────────────────────────────────────────────────

  public func createFinanceCategory(
    cats   : FinCategoryMap,
    nextId : NextTextIdRef,
    orgId  : OrgId,
    input  : Types.CreateFinanceCategoryInput,
  ) : Types.FinanceCategory {
    let id = "f" # nextId.value.toText();
    nextId.value += 1;
    let cat : Types.FinanceCategory = {
      id; orgId;
      name         = input.name;
      description  = input.description;
      categoryType = input.categoryType;
      parentId     = input.parentId;
      isActive     = input.isActive;
      createdAt    = Time.now();
    };
    cats.add(id, cat);
    cat
  };

  public func updateFinanceCategory(
    cats  : FinCategoryMap,
    orgId : OrgId,
    input : Types.UpdateFinanceCategoryInput,
  ) : ?Types.FinanceCategory {
    switch (cats.get(input.id)) {
      case (?existing) {
        if (existing.orgId != orgId) return null;
        let updated : Types.FinanceCategory = {
          existing with
          name         = input.name;
          description  = input.description;
          categoryType = input.categoryType;
          parentId     = input.parentId;
          isActive     = input.isActive;
        };
        cats.add(input.id, updated);
        ?updated
      };
      case null null;
    }
  };

  public func deleteFinanceCategory(cats : FinCategoryMap, orgId : OrgId, id : Text) : Bool {
    switch (cats.get(id)) {
      case (?c) {
        if (c.orgId != orgId) return false;
        cats.remove(id);
        true
      };
      case null false;
    }
  };

  public func listFinanceCategories(
    cats   : FinCategoryMap,
    orgId  : OrgId,
    filter : Types.FinanceCategoryFilter,
  ) : [Types.FinanceCategory] {
    cats.values().filter(func(c) {
      if (c.orgId != orgId) return false;
      switch (filter.categoryType) {
        case (?ct) { if (c.categoryType != ct) return false };
        case null  {};
      };
      switch (filter.isActive) {
        case (?a) { if (c.isActive != a) return false };
        case null {};
      };
      switch (filter.parentId) {
        case null {};
        case (?pid) {
          if (c.parentId != ?pid) return false;
        };
      };
      true
    }).toArray()
  };

  // ── Module Visibility ────────────────────────────────────────────────────────

  public func setModuleVisibility(
    vis     : ModuleVisMap,
    orgId   : OrgId,
    module_ : Text,
    enabled : Bool,
  ) : () {
    let list = switch (vis.get(orgId)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.ModuleVisibilityEntry>();
        vis.add(orgId, l);
        l;
      };
    };
    // Remove existing entry for this module, then add updated
    let filtered = list.filter(func(e) { e.moduleName != module_ });
    list.clear();
    list.append(filtered);
    list.add({ moduleName = module_; enabled });
  };

  public func getModuleVisibility(
    vis   : ModuleVisMap,
    orgId : OrgId,
  ) : [(Text, Bool)] {
    switch (vis.get(orgId)) {
      case (?list) list.map<Types.ModuleVisibilityEntry, (Text, Bool)>(
        func(e) { (e.moduleName, e.enabled) }
      ).toArray();
      case null [];
    }
  };
};
