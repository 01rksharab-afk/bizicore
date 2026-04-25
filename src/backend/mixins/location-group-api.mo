import Runtime "mo:core/Runtime";
import LocGrpLib "../lib/location-group";
import LocGrpTypes "../types/location-group";

mixin (
  locations       : LocGrpLib.LocationMap,
  groups_         : LocGrpLib.GroupMap,
  nextLocationId  : LocGrpLib.NextIdRef,
  nextGroupId     : LocGrpLib.NextIdRef,
) {

  // ── Locations ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func createLocation(
    orgId : LocGrpTypes.OrgId,
    input : LocGrpTypes.CreateLocationInput,
  ) : async LocGrpTypes.Location {
    LocGrpLib.createLocation(locations, nextLocationId, orgId, input)
  };

  public shared ({ caller }) func updateLocation(
    orgId : LocGrpTypes.OrgId,
    input : LocGrpTypes.UpdateLocationInput,
  ) : async ?LocGrpTypes.Location {
    LocGrpLib.updateLocation(locations, orgId, input)
  };

  public shared ({ caller }) func deleteLocation(orgId : LocGrpTypes.OrgId, id : Nat) : async Bool {
    LocGrpLib.deleteLocation(locations, orgId, id)
  };

  public query func listLocations(orgId : LocGrpTypes.OrgId) : async [LocGrpTypes.Location] {
    LocGrpLib.listLocations(locations, orgId)
  };

  // ── Groups ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func createGroup(
    orgId : LocGrpTypes.OrgId,
    input : LocGrpTypes.CreateGroupInput,
  ) : async LocGrpTypes.Group_ {
    LocGrpLib.createGroup(groups_, nextGroupId, orgId, input)
  };

  public shared ({ caller }) func updateGroup(
    orgId : LocGrpTypes.OrgId,
    input : LocGrpTypes.UpdateGroupInput,
  ) : async ?LocGrpTypes.Group_ {
    LocGrpLib.updateGroup(groups_, orgId, input)
  };

  public shared ({ caller }) func deleteGroup(orgId : LocGrpTypes.OrgId, id : Nat) : async Bool {
    LocGrpLib.deleteGroup(groups_, orgId, id)
  };

  public query func listGroups(orgId : LocGrpTypes.OrgId) : async [LocGrpTypes.Group_] {
    LocGrpLib.listGroups(groups_, orgId)
  };
};
