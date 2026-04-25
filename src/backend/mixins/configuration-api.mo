import Runtime "mo:core/Runtime";
import ConfigLib "../lib/configuration";
import ConfigTypes "../types/configuration";

mixin (
  orgConfigurations : ConfigLib.ConfigMap,
  nextConfigId      : { var value : Nat },
) {

  public shared ({ caller }) func getOrgConfiguration(orgId : ConfigTypes.OrgId) : async ConfigTypes.OrgConfiguration {
    ConfigLib.getOrCreate(orgConfigurations, nextConfigId, orgId)
  };

  public shared ({ caller }) func updateOrgConfiguration(
    orgId : ConfigTypes.OrgId,
    input : ConfigTypes.UpdateOrgConfigurationInput,
  ) : async ConfigTypes.OrgConfiguration {
    ConfigLib.update(orgConfigurations, nextConfigId, orgId, input)
  };
};
