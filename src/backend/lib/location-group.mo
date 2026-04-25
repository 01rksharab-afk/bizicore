import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/location-group";
import AuthOrgTypes "../types/auth-org";

module {
  public type OrgId     = Types.OrgId;
  public type RoleChecker = (caller : Principal, orgId : OrgId) -> ?AuthOrgTypes.OrgRole;

  // ── Opaque state types ─────────────────────────────────────────────────────
  public type LocationMap = Map.Map<Nat, Types.Location>;
  public type GroupMap    = Map.Map<Nat, Types.Group_>;
  public type NextIdRef   = { var value : Nat };

  // ── Locations ──────────────────────────────────────────────────────────────
  public func createLocation(
    locs   : LocationMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateLocationInput,
  ) : Types.Location {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let loc : Types.Location = {
      id;
      orgId;
      locationName = input.locationName;
      locationCode = input.locationCode;
      email        = input.email;
      state        = input.state;
      createdAt    = now;
    };
    locs.add(id, loc);
    loc
  };

  public func updateLocation(
    locs   : LocationMap,
    orgId  : OrgId,
    input  : Types.UpdateLocationInput,
  ) : ?Types.Location {
    let existing = switch (locs.get(input.id)) {
      case (?l) l;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    let updated : Types.Location = {
      existing with
      locationName = input.locationName;
      locationCode = input.locationCode;
      email        = input.email;
      state        = input.state;
    };
    locs.add(input.id, updated);
    ?updated
  };

  public func deleteLocation(locs : LocationMap, orgId : OrgId, id : Nat) : Bool {
    switch (locs.get(id)) {
      case (?l) {
        if (l.orgId != orgId) return false;
        locs.remove(id);
        true
      };
      case null false;
    }
  };

  public func listLocations(locs : LocationMap, orgId : OrgId) : [Types.Location] {
    locs.values().filter(func(l) { l.orgId == orgId }).toArray()
  };

  // ── Groups ─────────────────────────────────────────────────────────────────
  public func createGroup(
    groups : GroupMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateGroupInput,
  ) : Types.Group_ {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let g : Types.Group_ = {
      id;
      orgId;
      groupName   = input.groupName;
      parentGroup = input.parentGroup;
      description = input.description;
      status      = #Active;
      createdAt   = now;
    };
    groups.add(id, g);
    g
  };

  public func updateGroup(
    groups : GroupMap,
    orgId  : OrgId,
    input  : Types.UpdateGroupInput,
  ) : ?Types.Group_ {
    let existing = switch (groups.get(input.id)) {
      case (?g) g;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    let updated : Types.Group_ = {
      existing with
      groupName   = input.groupName;
      parentGroup = input.parentGroup;
      description = input.description;
      status      = input.status;
    };
    groups.add(input.id, updated);
    ?updated
  };

  public func deleteGroup(groups : GroupMap, orgId : OrgId, id : Nat) : Bool {
    switch (groups.get(id)) {
      case (?g) {
        if (g.orgId != orgId) return false;
        groups.remove(id);
        true
      };
      case null false;
    }
  };

  public func listGroups(groups : GroupMap, orgId : OrgId) : [Types.Group_] {
    groups.values().filter(func(g) { g.orgId == orgId }).toArray()
  };
};
