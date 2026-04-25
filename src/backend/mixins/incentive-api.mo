import Runtime "mo:core/Runtime";
import IncentiveLib "../lib/incentive";
import IncentiveTypes "../types/incentive";

mixin (
  incentiveSchemes : IncentiveLib.IncentiveMap,
  nextSchemeId     : { var value : Nat },
) {

  public shared ({ caller }) func createIncentiveScheme(
    orgId : IncentiveTypes.OrgId,
    input : IncentiveTypes.CreateIncentiveSchemeInput,
  ) : async IncentiveTypes.IncentiveScheme {
    let id = nextSchemeId.value;
    nextSchemeId.value += 1;
    IncentiveLib.createIncentiveScheme(incentiveSchemes, orgId, input, id)
  };

  public shared ({ caller }) func updateIncentiveScheme(
    orgId : IncentiveTypes.OrgId,
    input : IncentiveTypes.UpdateIncentiveSchemeInput,
  ) : async IncentiveTypes.IncentiveScheme {
    IncentiveLib.updateIncentiveScheme(incentiveSchemes, orgId, input)
  };

  public shared ({ caller }) func deleteIncentiveScheme(orgId : IncentiveTypes.OrgId, id : Nat) : async () {
    IncentiveLib.deleteIncentiveScheme(incentiveSchemes, orgId, id)
  };

  public query func listIncentiveSchemes(orgId : IncentiveTypes.OrgId) : async [IncentiveTypes.IncentiveScheme] {
    IncentiveLib.listIncentiveSchemes(incentiveSchemes, orgId)
  };
};
