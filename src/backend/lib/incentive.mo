import Types "../types/incentive";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  // ── State aliases ──────────────────────────────────────────────────────────
  public type IncentiveMap = Map.Map<Nat, Types.IncentiveScheme>;

  // ── Incentive Schemes ──────────────────────────────────────────────────────

  public func listIncentiveSchemes(schemes : IncentiveMap, orgId : Nat) : [Types.IncentiveScheme] {
    schemes.values().filter(func(s) { s.orgId == orgId }).toArray()
  };

  public func createIncentiveScheme(
    schemes : IncentiveMap,
    orgId   : Nat,
    input   : Types.CreateIncentiveSchemeInput,
    nextId  : Nat,
  ) : Types.IncentiveScheme {
    let scheme : Types.IncentiveScheme = {
      id            = nextId;
      orgId         = orgId;
      schemeName    = input.schemeName;
      category      = input.category;
      targetMetric  = input.targetMetric;
      targetValue   = input.targetValue;
      rewardType    = input.rewardType;
      rewardValue   = input.rewardValue;
      effectiveFrom = input.effectiveFrom;
      effectiveTo   = input.effectiveTo;
      status        = #Active;
      createdAt     = Time.now();
    };
    schemes.add(nextId, scheme);
    scheme
  };

  public func updateIncentiveScheme(
    schemes : IncentiveMap,
    orgId   : Nat,
    input   : Types.UpdateIncentiveSchemeInput,
  ) : Types.IncentiveScheme {
    let existing = switch (schemes.get(input.id)) {
      case (?s) s;
      case null { Runtime.trap("Incentive: IncentiveScheme not found with id " # input.id.toText()) };
    };
    if (existing.orgId != orgId) Runtime.trap("Incentive: IncentiveScheme " # input.id.toText() # " does not belong to org " # orgId.toText());
    let updated : Types.IncentiveScheme = {
      existing with
      schemeName    = input.schemeName;
      category      = input.category;
      targetMetric  = input.targetMetric;
      targetValue   = input.targetValue;
      rewardType    = input.rewardType;
      rewardValue   = input.rewardValue;
      effectiveFrom = input.effectiveFrom;
      effectiveTo   = input.effectiveTo;
      status        = input.status;
    };
    schemes.add(input.id, updated);
    updated
  };

  public func deleteIncentiveScheme(schemes : IncentiveMap, orgId : Nat, id : Nat) {
    switch (schemes.get(id)) {
      case (?s) {
        if (s.orgId != orgId) Runtime.trap("Incentive: IncentiveScheme " # id.toText() # " does not belong to org " # orgId.toText());
        schemes.remove(id);
      };
      case null { Runtime.trap("Incentive: IncentiveScheme not found with id " # id.toText()) };
    };
  };
};
