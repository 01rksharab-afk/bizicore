import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/roles-permissions";
import AuthOrgTypes "../types/auth-org";

module {
  public type OrgId     = Types.OrgId;
  public type RoleChecker = (caller : Principal, orgId : OrgId) -> ?AuthOrgTypes.OrgRole;

  // ── Opaque state types ─────────────────────────────────────────────────────
  public type RoleMap           = Map.Map<Nat, Types.Role>;
  public type PermissionMap     = Map.Map<Nat, Types.Permission>;
  public type AssignmentMap     = Map.Map<Nat, Types.UserRoleAssignment>;
  public type NextIdRef         = { var value : Nat };

  // ── Roles ──────────────────────────────────────────────────────────────────
  public func createRole(
    roles  : RoleMap,
    nextId : NextIdRef,
    orgId  : OrgId,
    input  : Types.CreateRoleInput,
  ) : Types.Role {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let role : Types.Role = {
      id;
      orgId;
      roleName    = input.roleName;
      description = input.description;
      screens     = input.screens;
      status      = #Active;
      createdAt   = now;
    };
    roles.add(id, role);
    role
  };

  public func getRole(roles : RoleMap, orgId : OrgId, id : Nat) : ?Types.Role {
    switch (roles.get(id)) {
      case (?r) { if (r.orgId == orgId) ?r else null };
      case null null;
    }
  };

  public func updateRole(
    roles  : RoleMap,
    orgId  : OrgId,
    input  : Types.UpdateRoleInput,
  ) : ?Types.Role {
    let existing = switch (roles.get(input.id)) {
      case (?r) r;
      case null { return null };
    };
    if (existing.orgId != orgId) return null;
    let updated : Types.Role = {
      existing with
      roleName    = input.roleName;
      description = input.description;
      screens     = input.screens;
      status      = input.status;
    };
    roles.add(input.id, updated);
    ?updated
  };

  public func deleteRole(roles : RoleMap, orgId : OrgId, id : Nat) : Bool {
    switch (roles.get(id)) {
      case (?r) {
        if (r.orgId != orgId) return false;
        roles.remove(id);
        true
      };
      case null false;
    }
  };

  public func listRoles(roles : RoleMap, orgId : OrgId) : [Types.Role] {
    roles.values().filter(func(r) { r.orgId == orgId }).toArray()
  };

  // ── Permissions ────────────────────────────────────────────────────────────
  public func setPermission(
    permissions : PermissionMap,
    nextId      : NextIdRef,
    orgId       : OrgId,
    input       : Types.SetPermissionsInput,
  ) : Types.Permission {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let p : Types.Permission = {
      id;
      orgId;
      roleId    = input.roleId;
      roleName  = input.roleName;
      module_   = input.module_;
      screen    = input.screen;
      canView   = input.canView;
      canCreate = input.canCreate;
      canEdit   = input.canEdit;
      canDelete = input.canDelete;
      createdAt = now;
    };
    permissions.add(id, p);
    p
  };

  public func listPermissions(permissions : PermissionMap, orgId : OrgId, roleId : ?Nat) : [Types.Permission] {
    permissions.values().filter(func(p) {
      if (p.orgId != orgId) return false;
      switch (roleId) {
        case (?rid) { p.roleId == rid };
        case null   true;
      }
    }).toArray()
  };

  // ── User Role Assignments ──────────────────────────────────────────────────
  public func assignRole(
    assignments : AssignmentMap,
    nextId      : NextIdRef,
    orgId       : OrgId,
    input       : Types.AssignRoleInput,
    roleName    : Text,
  ) : Types.UserRoleAssignment {
    let id = nextId.value;
    nextId.value += 1;
    let now = Time.now();
    let a : Types.UserRoleAssignment = {
      id;
      orgId;
      userId     = input.userId;
      roleName;
      roleId     = input.roleId;
      assignedAt = now;
    };
    assignments.add(id, a);
    a
  };

  public func listAssignments(assignments : AssignmentMap, orgId : OrgId, userId : ?Principal) : [Types.UserRoleAssignment] {
    assignments.values().filter(func(a) {
      if (a.orgId != orgId) return false;
      switch (userId) {
        case (?uid) { a.userId == uid };
        case null   true;
      }
    }).toArray()
  };

  public func revokeRole(assignments : AssignmentMap, orgId : OrgId, id : Nat) : Bool {
    switch (assignments.get(id)) {
      case (?a) {
        if (a.orgId != orgId) return false;
        assignments.remove(id);
        true
      };
      case null false;
    }
  };

  // Expose AssignRoleInput alias needed by the mixin
  public type AssignRoleInput = Types.AssignRoleInput;
};
