import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import RolesLib "../lib/roles-permissions";
import RolesTypes "../types/roles-permissions";

mixin (
  roles_              : RolesLib.RoleMap,
  permissions_        : RolesLib.PermissionMap,
  userRoleAssignments : RolesLib.AssignmentMap,
  nextRoleId          : RolesLib.NextIdRef,
  nextPermId          : RolesLib.NextIdRef,
  nextAssignmentId    : RolesLib.NextIdRef,
) {

  // ── Roles ──────────────────────────────────────────────────────────────────

  public shared ({ caller }) func createRole(
    orgId : RolesTypes.OrgId,
    input : RolesTypes.CreateRoleInput,
  ) : async RolesTypes.Role {
    RolesLib.createRole(roles_, nextRoleId, orgId, input)
  };

  public shared ({ caller }) func updateRole(
    orgId : RolesTypes.OrgId,
    input : RolesTypes.UpdateRoleInput,
  ) : async ?RolesTypes.Role {
    RolesLib.updateRole(roles_, orgId, input)
  };

  public shared ({ caller }) func deleteRole(orgId : RolesTypes.OrgId, id : Nat) : async Bool {
    RolesLib.deleteRole(roles_, orgId, id)
  };

  public query func listRoles(orgId : RolesTypes.OrgId) : async [RolesTypes.Role] {
    RolesLib.listRoles(roles_, orgId)
  };

  // ── Permissions ────────────────────────────────────────────────────────────

  public shared ({ caller }) func setPermission(
    orgId : RolesTypes.OrgId,
    input : RolesTypes.SetPermissionsInput,
  ) : async RolesTypes.Permission {
    RolesLib.setPermission(permissions_, nextPermId, orgId, input)
  };

  public query func listPermissions(
    orgId  : RolesTypes.OrgId,
    roleId : ?Nat,
  ) : async [RolesTypes.Permission] {
    RolesLib.listPermissions(permissions_, orgId, roleId)
  };

  // ── User Role Assignments ──────────────────────────────────────────────────

  public shared ({ caller }) func assignUserRole(
    orgId : RolesTypes.OrgId,
    input : RolesTypes.AssignRoleInput,
  ) : async RolesTypes.UserRoleAssignment {
    let roleName = switch (roles_.get(input.roleId)) {
      case (?r) r.roleName;
      case null { Runtime.trap("Roles: role not found with id " # input.roleId.toText()) };
    };
    RolesLib.assignRole(userRoleAssignments, nextAssignmentId, orgId, input, roleName)
  };

  public shared ({ caller }) func revokeUserRole(orgId : RolesTypes.OrgId, assignmentId : Nat) : async Bool {
    RolesLib.revokeRole(userRoleAssignments, orgId, assignmentId)
  };

  public query func listUserRoleAssignments(
    orgId  : RolesTypes.OrgId,
    userId : ?Principal,
  ) : async [RolesTypes.UserRoleAssignment] {
    RolesLib.listAssignments(userRoleAssignments, orgId, userId)
  };
};
