module {
  public type OrgId = Nat;
  public type Timestamp = Int;

  public type RoleStatus = { #Active; #Inactive };

  public type Role = {
    id          : Nat;
    orgId       : OrgId;
    roleName    : Text;
    description : Text;
    screens     : [Text];
    status      : RoleStatus;
    createdAt   : Timestamp;
  };

  public type Permission = {
    id        : Nat;
    orgId     : OrgId;
    roleId    : Nat;
    roleName  : Text;
    module_   : Text;
    screen    : Text;
    canView   : Bool;
    canCreate : Bool;
    canEdit   : Bool;
    canDelete : Bool;
    createdAt : Timestamp;
  };

  public type UserRoleAssignment = {
    id         : Nat;
    orgId      : OrgId;
    userId     : Principal;
    roleName   : Text;
    roleId     : Nat;
    assignedAt : Timestamp;
  };

  // ── Input types ─────────────────────────────────────────────────────────────

  public type CreateRoleInput = {
    roleName    : Text;
    description : Text;
    screens     : [Text];
  };

  public type UpdateRoleInput = {
    id          : Nat;
    roleName    : Text;
    description : Text;
    screens     : [Text];
    status      : RoleStatus;
  };

  public type SetPermissionsInput = {
    roleId    : Nat;
    roleName  : Text;
    module_   : Text;
    screen    : Text;
    canView   : Bool;
    canCreate : Bool;
    canEdit   : Bool;
    canDelete : Bool;
  };

  public type AssignRoleInput = {
    userId : Principal;
    roleId : Nat;
  };
};
