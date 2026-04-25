module {
  public type OrgId = Nat;
  public type Timestamp = Int;

  public type Location = {
    id           : Nat;
    orgId        : OrgId;
    locationName : Text;
    locationCode : Text;
    email        : Text;
    state        : Text;
    createdAt    : Timestamp;
  };

  public type GroupStatus = { #Active; #Inactive };

  public type Group_ = {
    id          : Nat;
    orgId       : OrgId;
    groupName   : Text;
    parentGroup : ?Nat;
    description : Text;
    status      : GroupStatus;
    createdAt   : Timestamp;
  };

  // ── Input types ─────────────────────────────────────────────────────────────

  public type CreateLocationInput = {
    locationName : Text;
    locationCode : Text;
    email        : Text;
    state        : Text;
  };

  public type UpdateLocationInput = {
    id           : Nat;
    locationName : Text;
    locationCode : Text;
    email        : Text;
    state        : Text;
  };

  public type CreateGroupInput = {
    groupName   : Text;
    parentGroup : ?Nat;
    description : Text;
  };

  public type UpdateGroupInput = {
    id          : Nat;
    groupName   : Text;
    parentGroup : ?Nat;
    description : Text;
    status      : GroupStatus;
  };
};
