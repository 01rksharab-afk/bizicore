import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Types "../types/auth-org";

module {
  // ── State aliases ──────────────────────────────────────────────────────────

  public type OrgMap       = Map.Map<Types.OrgId, Types.Org>;
  public type MemberMap    = Map.Map<Types.OrgId, List.List<Types.OrgMember>>;
  public type InviteList   = List.List<Types.PendingInvite>;
  public type ProfileMap   = Map.Map<Principal, Types.UserProfile>;
  public type SubMap       = Map.Map<Types.OrgId, Types.OrgSubscription>;
  public type BillingList  = List.List<Types.BillingEntry>;
  public type UserOrgsMap  = Map.Map<Principal, List.List<Types.OrgId>>;

  // ── Internal helpers ───────────────────────────────────────────────────────

  func getMemberList(members : MemberMap, orgId : Types.OrgId) : List.List<Types.OrgMember> {
    switch (members.get(orgId)) {
      case (?list) list;
      case null {
        let list = List.empty<Types.OrgMember>();
        members.add(orgId, list);
        list;
      };
    };
  };

  func getUserOrgList(userOrgs : UserOrgsMap, user : Principal) : List.List<Types.OrgId> {
    switch (userOrgs.get(user)) {
      case (?list) list;
      case null {
        let list = List.empty<Types.OrgId>();
        userOrgs.add(user, list);
        list;
      };
    };
  };

  // ── Role helpers ───────────────────────────────────────────────────────────

  /// Return the caller's role in an org, or null if not a member.
  public func getCallerRole(
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
  ) : ?Types.OrgRole {
    let memberList = switch (members.get(orgId)) {
      case (?list) list;
      case null return null;
    };
    switch (memberList.find(func(m : Types.OrgMember) : Bool { m.principal == caller })) {
      case (?m) ?m.role;
      case null null;
    };
  };

  func requireRole(
    members  : MemberMap,
    caller   : Principal,
    orgId    : Types.OrgId,
    minRole  : Types.OrgRole,
  ) : () {
    let role = switch (getCallerRole(members, caller, orgId)) {
      case (?r) r;
      case null Runtime.trap("Auth: caller is not a member of org " # orgId.toText());
    };
    let ok = switch (minRole) {
      case (#member) true;
      case (#admin)  role == #admin or role == #owner;
      case (#owner)  role == #owner;
    };
    if (not ok) Runtime.trap("Auth: caller lacks required role in org " # orgId.toText());
  };

  // ── Slug uniqueness helper ─────────────────────────────────────────────────

  /// Check if a slug is already taken.
  public func isSlugTaken(
    orgs : OrgMap,
    slug : Text,
  ) : Bool {
    orgs.any(func(_id : Types.OrgId, org : Types.Org) : Bool { org.slug == slug });
  };

  // ── Org CRUD ───────────────────────────────────────────────────────────────

  /// Create a new organization; caller becomes Owner.
  public func createOrg(
    orgs          : OrgMap,
    members       : MemberMap,
    userOrgs      : UserOrgsMap,
    subs          : SubMap,
    nextId        : Nat,
    caller        : Principal,
    name          : Text,
    slug          : Text,
    timezone      : Text,
    now           : Types.Timestamp,
    orgType       : Types.OrgType,
    gstin         : ?Text,
    pan           : ?Text,
    address       : ?Types.OrgAddress,
    contactPerson : ?Types.OrgContactPerson,
  ) : Types.OrgId {
    if (isSlugTaken(orgs, slug)) Runtime.trap("Org: slug '" # slug # "' is already taken");
    let orgId = nextId;
    let org : Types.Org = {
      id = orgId; name; slug; timezone;
      orgType; gstin; pan; address; contactPerson;
      createdAt = now; createdBy = caller;
    };
    orgs.add(orgId, org);

    // Add caller as Owner
    let memberList = getMemberList(members, orgId);
    memberList.add({
      principal = caller;
      role      = #owner;
      joinedAt  = now;
      invitedBy = null;
    });

    // Track which orgs this user belongs to
    let userOrgList = getUserOrgList(userOrgs, caller);
    userOrgList.add(orgId);

    // Create free subscription by default
    let sub : Types.OrgSubscription = {
      orgId;
      plan                 = #free;
      status               = #active;
      stripeCustomerId     = null;
      stripeSubscriptionId = null;
      currentPeriodStart   = ?now;
      currentPeriodEnd     = null;
      trialEnd             = null;
      cancelAtPeriodEnd    = false;
    };
    subs.add(orgId, sub);

    orgId;
  };

  /// Return all orgs the caller is a member of.
  public func listMyOrgs(
    orgs     : OrgMap,
    members  : MemberMap,
    userOrgs : UserOrgsMap,
    caller   : Principal,
  ) : [Types.OrgSummary] {
    let orgIdList = switch (userOrgs.get(caller)) {
      case (?list) list;
      case null return [];
    };
    orgIdList.filterMap<Types.OrgId, Types.OrgSummary>(func(orgId : Types.OrgId) : ?Types.OrgSummary {
      switch (orgs.get(orgId)) {
        case (?org) {
          switch (getCallerRole(members, caller, orgId)) {
            case (?role) ?{ id = org.id; name = org.name; slug = org.slug; timezone = org.timezone; myRole = role };
            case null null;
          };
        };
        case null null;
      };
    }).toArray();
  };

  /// Get a single org by id; traps if caller is not a member.
  public func getOrg(
    orgs    : OrgMap,
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
  ) : Types.Org {
    requireRole(members, caller, orgId, #member);
    switch (orgs.get(orgId)) {
      case (?org) org;
      case null Runtime.trap("Org: org not found with id " # orgId.toText());
    };
  };

  public func updateOrg(
    orgs          : OrgMap,
    members       : MemberMap,
    caller        : Principal,
    orgId         : Types.OrgId,
    name          : Text,
    slug          : Text,
    timezone      : Text,
    orgType       : Types.OrgType,
    gstin         : ?Text,
    pan           : ?Text,
    address       : ?Types.OrgAddress,
    contactPerson : ?Types.OrgContactPerson,
  ) : () {
    requireRole(members, caller, orgId, #admin);
    let existing = switch (orgs.get(orgId)) {
      case (?o) o;
      case null Runtime.trap("Org: org not found with id " # orgId.toText());
    };
    if (existing.slug != slug and isSlugTaken(orgs, slug)) {
      Runtime.trap("Org: slug '" # slug # "' is already taken");
    };
    orgs.add(orgId, { existing with name; slug; timezone; orgType; gstin; pan; address; contactPerson });
  };

  /// Delete org and all related data; caller must be Owner.
  public func deleteOrg(
    orgs     : OrgMap,
    members  : MemberMap,
    userOrgs : UserOrgsMap,
    subs     : SubMap,
    caller   : Principal,
    orgId    : Types.OrgId,
  ) : () {
    requireRole(members, caller, orgId, #owner);
    // Remove orgId from each member's userOrgs list
    let memberList = switch (members.get(orgId)) {
      case (?list) list;
      case null List.empty<Types.OrgMember>();
    };
    memberList.forEach(func(m : Types.OrgMember) {
      switch (userOrgs.get(m.principal)) {
        case (?list) {
          let filtered = list.filter(func(id : Types.OrgId) : Bool { id != orgId });
          list.clear();
          list.append(filtered);
        };
        case null {};
      };
    });
    orgs.remove(orgId);
    members.remove(orgId);
    subs.remove(orgId);
  };

  // ── Membership ─────────────────────────────────────────────────────────────

  /// Return all members of an org; caller must be a member.
  public func listMembers(
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
  ) : [Types.OrgMember] {
    requireRole(members, caller, orgId, #member);
    switch (members.get(orgId)) {
      case (?list) list.toArray();
      case null [];
    };
  };

  /// Update a member's role; caller must be Owner (or Admin for non-owner targets).
  public func updateMemberRole(
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
    target  : Principal,
    newRole : Types.OrgRole,
  ) : () {
    let callerRole = switch (getCallerRole(members, caller, orgId)) {
      case (?r) r;
      case null Runtime.trap("Auth: caller is not a member of org " # orgId.toText());
    };
    let memberList = switch (members.get(orgId)) {
      case (?list) list;
      case null Runtime.trap("Auth: org " # orgId.toText() # " has no member list");
    };
    let targetMember = switch (memberList.find(func(m : Types.OrgMember) : Bool { m.principal == target })) {
      case (?m) m;
      case null Runtime.trap("Auth: target principal is not a member of org " # orgId.toText());
    };
    let requiresOwner = targetMember.role == #owner or newRole == #owner;
    if (requiresOwner and callerRole != #owner) {
      Runtime.trap("Auth: only owner can assign or change owner role in org " # orgId.toText());
    };
    if (callerRole != #owner and callerRole != #admin) {
      Runtime.trap("Auth: caller must be admin or owner to update roles in org " # orgId.toText());
    };
    memberList.mapInPlace(func(m : Types.OrgMember) : Types.OrgMember {
      if (m.principal == target) { { m with role = newRole } } else m;
    });
  };

  /// Remove a member from an org; caller must be Owner or Admin (or self-remove).
  public func removeMember(
    members  : MemberMap,
    userOrgs : UserOrgsMap,
    caller   : Principal,
    orgId    : Types.OrgId,
    target   : Principal,
  ) : () {
    let callerRole = switch (getCallerRole(members, caller, orgId)) {
      case (?r) r;
      case null Runtime.trap("Auth: caller is not a member of org " # orgId.toText());
    };
    if (caller != target) {
      if (callerRole != #owner and callerRole != #admin) {
        Runtime.trap("Auth: only admin or owner can remove other members from org " # orgId.toText());
      };
      let targetRole = switch (getCallerRole(members, target, orgId)) {
        case (?r) r;
        case null Runtime.trap("Auth: target is not a member of org " # orgId.toText());
      };
      if (targetRole == #owner and callerRole != #owner) {
        Runtime.trap("Auth: only owner can remove another owner from org " # orgId.toText());
      };
    };
    let memberList = switch (members.get(orgId)) {
      case (?list) list;
      case null Runtime.trap("Auth: org " # orgId.toText() # " has no member list");
    };
    let filtered = memberList.filter(func(m : Types.OrgMember) : Bool { m.principal != target });
    memberList.clear();
    memberList.append(filtered);
    // Remove orgId from the removed member's userOrgs
    switch (userOrgs.get(target)) {
      case (?list) {
        let newList = list.filter(func(id : Types.OrgId) : Bool { id != orgId });
        list.clear();
        list.append(newList);
      };
      case null {};
    };
  };

  // ── Invites ────────────────────────────────────────────────────────────────

  /// Create a pending invite for an email address; caller must be Owner or Admin.
  public func inviteMember(
    invites : InviteList,
    members : MemberMap,
    nextId  : Nat,
    caller  : Principal,
    orgId   : Types.OrgId,
    email   : Text,
    role    : Types.OrgRole,
    now     : Types.Timestamp,
  ) : Types.PendingInvite {
    requireRole(members, caller, orgId, #admin);
    let callerRole = switch (getCallerRole(members, caller, orgId)) {
      case (?r) r;
      case null Runtime.trap("Auth: caller is not a member of org " # orgId.toText());
    };
    if (role == #owner and callerRole != #owner) {
      Runtime.trap("Auth: only owner can invite with owner role in org " # orgId.toText());
    };
    let invite : Types.PendingInvite = {
      id        = nextId;
      orgId;
      email;
      role;
      invitedBy = caller;
      createdAt = now;
    };
    invites.add(invite);
    invite;
  };

  /// Accept an invite by invite id; associates caller principal with the org.
  public func acceptInvite(
    invites  : InviteList,
    members  : MemberMap,
    userOrgs : UserOrgsMap,
    caller   : Principal,
    inviteId : Nat,
    now      : Types.Timestamp,
  ) : () {
    let invite = switch (invites.find(func(i : Types.PendingInvite) : Bool { i.id == inviteId })) {
      case (?i) i;
      case null Runtime.trap("Invite: invite not found with id " # inviteId.toText());
    };
    switch (getCallerRole(members, caller, invite.orgId)) {
      case (?_) Runtime.trap("Auth: caller is already a member of org " # invite.orgId.toText());
      case null {};
    };
    let memberList = getMemberList(members, invite.orgId);
    memberList.add({
      principal = caller;
      role      = invite.role;
      joinedAt  = now;
      invitedBy = ?invite.invitedBy;
    });
    // Track org in user's list
    let userOrgList = getUserOrgList(userOrgs, caller);
    userOrgList.add(invite.orgId);
    // Remove the consumed invite
    let remaining = invites.filter(func(i : Types.PendingInvite) : Bool { i.id != inviteId });
    invites.clear();
    invites.append(remaining);
  };

  /// Cancel a pending invite; caller must be Owner or Admin.
  public func cancelInvite(
    invites  : InviteList,
    members  : MemberMap,
    caller   : Principal,
    inviteId : Nat,
  ) : () {
    let invite = switch (invites.find(func(i : Types.PendingInvite) : Bool { i.id == inviteId })) {
      case (?i) i;
      case null Runtime.trap("Invite: invite not found with id " # inviteId.toText());
    };
    requireRole(members, caller, invite.orgId, #admin);
    let remaining = invites.filter(func(i : Types.PendingInvite) : Bool { i.id != inviteId });
    invites.clear();
    invites.append(remaining);
  };

  /// List pending invites for an org; caller must be Owner or Admin.
  public func listPendingInvites(
    invites : InviteList,
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
  ) : [Types.PendingInvite] {
    requireRole(members, caller, orgId, #admin);
    invites.filter(func(i : Types.PendingInvite) : Bool { i.orgId == orgId }).toArray();
  };

  // ── User Profiles ──────────────────────────────────────────────────────────

  /// Get the caller's own profile.
  public func getMyProfile(
    profiles : ProfileMap,
    caller   : Principal,
  ) : ?Types.UserProfile {
    profiles.get(caller);
  };

  /// Save the caller's own profile.
  public func saveMyProfile(
    profiles : ProfileMap,
    caller   : Principal,
    profile  : Types.UserProfile,
  ) : () {
    profiles.add(caller, profile);
  };

  // ── Subscriptions ──────────────────────────────────────────────────────────

  /// Get the subscription for an org; caller must be a member.
  public func getSubscription(
    subs    : SubMap,
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
  ) : ?Types.OrgSubscription {
    requireRole(members, caller, orgId, #member);
    subs.get(orgId);
  };

  /// Upsert subscription after Stripe webhook or checkout confirmation.
  public func upsertSubscription(
    subs : SubMap,
    sub  : Types.OrgSubscription,
  ) : () {
    subs.add(sub.orgId, sub);
  };

  /// Upgrade or downgrade plan; caller must be Owner.
  public func changePlan(
    subs    : SubMap,
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
    newPlan : Types.PlanTier,
  ) : () {
    requireRole(members, caller, orgId, #owner);
    let existing = switch (subs.get(orgId)) {
      case (?s) s;
      case null Runtime.trap("Subscription: no subscription found for org " # orgId.toText());
    };
    subs.add(orgId, { existing with plan = newPlan });
  };

  // ── Billing History ────────────────────────────────────────────────────────

  /// Record a billing entry (called after successful Stripe payment).
   /// List billing history for an org; caller must be Owner.
  public func listBillingHistory(
    billing : BillingList,
    members : MemberMap,
    caller  : Principal,
    orgId   : Types.OrgId,
  ) : [Types.BillingEntry] {
    requireRole(members, caller, orgId, #owner);
    billing.filter(func(e : Types.BillingEntry) : Bool { e.orgId == orgId }).toArray();
  };
};
