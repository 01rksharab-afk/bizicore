import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/auth-org";
import AuthOrg "../lib/auth-org";

mixin (
  accessControlState : AccessControl.AccessControlState,
  orgs               : AuthOrg.OrgMap,
  members            : AuthOrg.MemberMap,
  invites            : AuthOrg.InviteList,
  userOrgs           : AuthOrg.UserOrgsMap,
  profiles           : AuthOrg.ProfileMap,
  subs               : AuthOrg.SubMap,
  billing            : AuthOrg.BillingList,
  nextOrgId          : { var value : Nat },
  nextInviteId       : { var value : Nat },
  nextBillingId      : { var value : Nat },
  getStripeConfig    : () -> ?Stripe.StripeConfiguration,
  transformFn        : shared query OutCall.TransformationInput -> async OutCall.TransformationOutput,
) {

  // ── Auth guard ─────────────────────────────────────────────────────────────

  func requireAuth(caller : Principal) : () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Auth: caller is not authenticated — please log in");
    };
  };

  // ── Profile ────────────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfile {
    requireAuth(caller);
    AuthOrg.getMyProfile(profiles, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Types.UserProfile) : async () {
    requireAuth(caller);
    AuthOrg.saveMyProfile(profiles, caller, profile);
  };

  // ── Organization management ────────────────────────────────────────────────

  /// Create a new organization; caller becomes its Owner.
  public shared ({ caller }) func createOrg(
    name          : Text,
    slug          : Text,
    timezone      : Text,
    orgType       : Types.OrgType,
    gstin         : ?Text,
    pan           : ?Text,
    address       : ?Types.OrgAddress,
    contactPerson : ?Types.OrgContactPerson,
  ) : async Types.OrgId {
    requireAuth(caller);
    let now = Time.now();
    let id = nextOrgId.value;
    let result = AuthOrg.createOrg(
      orgs, members, userOrgs, subs, id, caller,
      name, slug, timezone, now,
      orgType, gstin, pan, address, contactPerson,
    );
    nextOrgId.value += 1;
    result;
  };

  /// List all organizations the caller belongs to.
  public query ({ caller }) func listMyOrgs() : async [Types.OrgSummary] {
    requireAuth(caller);
    AuthOrg.listMyOrgs(orgs, members, userOrgs, caller);
  };

  /// Get a single organization; caller must be a member.
  public query ({ caller }) func getOrg(orgId : Types.OrgId) : async Types.Org {
    requireAuth(caller);
    AuthOrg.getOrg(orgs, members, caller, orgId);
  };

  /// Update org settings; caller must be Owner or Admin.
  public shared ({ caller }) func updateOrg(
    orgId         : Types.OrgId,
    name          : Text,
    slug          : Text,
    timezone      : Text,
    orgType       : Types.OrgType,
    gstin         : ?Text,
    pan           : ?Text,
    address       : ?Types.OrgAddress,
    contactPerson : ?Types.OrgContactPerson,
  ) : async () {
    requireAuth(caller);
    AuthOrg.updateOrg(orgs, members, caller, orgId, name, slug, timezone, orgType, gstin, pan, address, contactPerson);
  };

  /// Delete an organization; caller must be Owner.
  public shared ({ caller }) func deleteOrg(orgId : Types.OrgId) : async () {
    requireAuth(caller);
    AuthOrg.deleteOrg(orgs, members, userOrgs, subs, caller, orgId);
  };

  /// Check if a slug is available.
  public query func isSlugAvailable(slug : Text) : async Bool {
    not AuthOrg.isSlugTaken(orgs, slug);
  };

  // ── Membership ─────────────────────────────────────────────────────────────

  /// List all members of an org; caller must be a member.
  public query ({ caller }) func listMembers(orgId : Types.OrgId) : async [Types.OrgMember] {
    requireAuth(caller);
    AuthOrg.listMembers(members, caller, orgId);
  };

  /// Change a member's role; caller must be Owner (or Admin for non-owner targets).
  public shared ({ caller }) func updateMemberRole(
    orgId   : Types.OrgId,
    target  : Principal,
    newRole : Types.OrgRole,
  ) : async () {
    requireAuth(caller);
    AuthOrg.updateMemberRole(members, caller, orgId, target, newRole);
  };

  /// Remove a member; caller must be Owner, Admin, or the member themselves.
  public shared ({ caller }) func removeMember(
    orgId  : Types.OrgId,
    target : Principal,
  ) : async () {
    requireAuth(caller);
    AuthOrg.removeMember(members, userOrgs, caller, orgId, target);
  };

  // ── Invites ────────────────────────────────────────────────────────────────

  /// Invite a user by email; caller must be Owner or Admin.
  public shared ({ caller }) func inviteMember(
    orgId : Types.OrgId,
    email : Text,
    role  : Types.OrgRole,
  ) : async Types.PendingInvite {
    requireAuth(caller);
    let now = Time.now();
    let id = nextInviteId.value;
    let invite = AuthOrg.inviteMember(invites, members, id, caller, orgId, email, role, now);
    nextInviteId.value += 1;
    invite;
  };

  /// Accept a pending invite (caller associates their principal).
  public shared ({ caller }) func acceptInvite(inviteId : Nat) : async () {
    requireAuth(caller);
    let now = Time.now();
    AuthOrg.acceptInvite(invites, members, userOrgs, caller, inviteId, now);
  };

  /// Cancel a pending invite; caller must be Owner or Admin.
  public shared ({ caller }) func cancelInvite(inviteId : Nat) : async () {
    requireAuth(caller);
    AuthOrg.cancelInvite(invites, members, caller, inviteId);
  };

  /// List pending invites for an org; caller must be Owner or Admin.
  public query ({ caller }) func listPendingInvites(orgId : Types.OrgId) : async [Types.PendingInvite] {
    requireAuth(caller);
    AuthOrg.listPendingInvites(invites, members, caller, orgId);
  };

  // ── Subscriptions ──────────────────────────────────────────────────────────

  /// Get the subscription for an org; caller must be a member.
  public query ({ caller }) func getSubscription(orgId : Types.OrgId) : async ?Types.OrgSubscription {
    requireAuth(caller);
    AuthOrg.getSubscription(subs, members, caller, orgId);
  };

  /// Alias for getSubscription — returns OrgSubscription for the org. Caller must be a member.
  public query ({ caller }) func getOrgSubscription(orgId : Types.OrgId) : async ?Types.OrgSubscription {
    requireAuth(caller);
    AuthOrg.getSubscription(subs, members, caller, orgId);
  };

  /// Set (upsert) a subscription record directly; caller must be Owner.
  /// Used after Stripe webhook confirmation or admin override.
  public shared ({ caller }) func setOrgSubscription(
    orgId : Types.OrgId,
    sub   : Types.OrgSubscription,
  ) : async () {
    requireAuth(caller);
    switch (AuthOrg.getCallerRole(members, caller, orgId)) {
      case (?#owner) {};
      case _ Runtime.trap("Auth: only owners can set subscriptions for org " # orgId.toText());
    };
    AuthOrg.upsertSubscription(subs, sub);
  };

  /// Initiate Stripe checkout for a plan upgrade; returns JSON session string.
  public shared ({ caller }) func createSubscriptionCheckout(
    orgId      : Types.OrgId,
    plan       : Types.PlanTier,
    successUrl : Text,
    cancelUrl  : Text,
  ) : async Text {
    requireAuth(caller);
    switch (AuthOrg.getCallerRole(members, caller, orgId)) {
      case (?#owner) {};
      case _ Runtime.trap("Auth: only owners can initiate checkout for org " # orgId.toText());
    };
    let cfg = switch (getStripeConfig()) {
      case (?c) c;
      case null Runtime.trap("Auth: Stripe is not configured — contact support");
    };
    let planName = switch (plan) {
      case (#free)       "Free";
      case (#pro)        "Pro";
      case (#enterprise) "Enterprise";
    };
    let priceInCents : Nat = switch (plan) {
      case (#free)       0;
      case (#pro)        2900;
      case (#enterprise) 9900;
    };
    let items : [Stripe.ShoppingItem] = [{
      currency           = "usd";
      productName        = planName;
      productDescription = planName;
      priceInCents;
      quantity           = 1;
    }];
    await Stripe.createCheckoutSession(cfg, caller, items, successUrl, cancelUrl, transformFn);
  };

  public shared ({ caller }) func confirmSubscription(
    orgId     : Types.OrgId,
    sessionId : Text,
  ) : async () {
    requireAuth(caller);
    switch (AuthOrg.getCallerRole(members, caller, orgId)) {
      case (?#owner) {};
      case _ Runtime.trap("Auth: only owners can confirm subscriptions for org " # orgId.toText());
    };
    let cfg = switch (getStripeConfig()) {
      case (?c) c;
      case null Runtime.trap("Auth: Stripe is not configured — contact support");
    };
    let status = await Stripe.getSessionStatus(cfg, sessionId, transformFn);
    switch (status) {
      case (#failed { error }) Runtime.trap(error);
      case (#completed _) {
        let existing = switch (subs.get(orgId)) {
          case (?s) s;
          case null Runtime.trap("Auth: subscription record not found for org " # orgId.toText());
        };
        subs.add(orgId, {
          existing with
          stripeSubscriptionId = ?sessionId;
          status               = #active;
        });
      };
    };
  };

  /// Change the plan (upgrade/downgrade); caller must be Owner.
  public shared ({ caller }) func changePlan(
    orgId   : Types.OrgId,
    newPlan : Types.PlanTier,
  ) : async () {
    requireAuth(caller);
    AuthOrg.changePlan(subs, members, caller, orgId, newPlan);
  };

  // ── Billing History ────────────────────────────────────────────────────────

  /// List billing history for an org; caller must be Owner.
  public query ({ caller }) func listBillingHistory(orgId : Types.OrgId) : async [Types.BillingEntry] {
    requireAuth(caller);
    AuthOrg.listBillingHistory(billing, members, caller, orgId);
  };

  // ── Role helper ────────────────────────────────────────────────────────────

  /// Get the caller's role in an org; returns null if not a member.
  public query ({ caller }) func getMyRole(orgId : Types.OrgId) : async ?Types.OrgRole {
    requireAuth(caller);
    AuthOrg.getCallerRole(members, caller, orgId);
  };
};
