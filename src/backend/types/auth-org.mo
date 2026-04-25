import Common "common";

module {
  public type OrgId = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // Role within an organization
  public type OrgRole = {
    #owner;
    #admin;
    #member;
  };

  // Subscription plan tier
  public type PlanTier = {
    #free;
    #pro;
    #enterprise;
  };

  // Subscription status
  public type SubscriptionStatus = {
    #trialing;
    #active;
    #pastDue;
    #canceled;
    #incomplete;
  };

  // An organization member record
  public type OrgMember = {
    principal : Principal;
    role : OrgRole;
    joinedAt : Timestamp;
    invitedBy : ?Principal;
  };

  // A pending invite (by email, before the invitee logs in)
  public type PendingInvite = {
    id : Nat;
    orgId : OrgId;
    email : Text;
    role : OrgRole;
    invitedBy : Principal;
    createdAt : Timestamp;
  };

  // Extended address for org registration
  public type OrgAddress = {
    street  : Text;
    city    : Text;
    state   : Text;
    postal  : Text;
    country : Text;
  };

  // Contact person for org
  public type OrgContactPerson = {
    name  : Text;
    phone : Text;
    email : Text;
  };

  // Organisation type: company or individual
  public type OrgType = { #company; #individual };

  // An organization
  public type Org = {
    id            : OrgId;
    name          : Text;
    slug          : Text;
    timezone      : Text;
    orgType       : OrgType;
    gstin         : ?Text;
    pan           : ?Text;
    address       : ?OrgAddress;
    contactPerson : ?OrgContactPerson;
    createdAt     : Timestamp;
    createdBy     : Principal;
  };

  // Subscription record per org
  public type OrgSubscription = {
    orgId : OrgId;
    plan : PlanTier;
    status : SubscriptionStatus;
    stripeCustomerId : ?Text;
    stripeSubscriptionId : ?Text;
    currentPeriodStart : ?Timestamp;
    currentPeriodEnd : ?Timestamp;
    trialEnd : ?Timestamp;
    cancelAtPeriodEnd : Bool;
  };

  // Public-facing user profile
  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  // Lightweight org summary returned in lists
  public type OrgSummary = {
    id : OrgId;
    name : Text;
    slug : Text;
    timezone : Text;
    myRole : OrgRole;
  };

  // Billing history entry
  public type BillingEntry = {
    id : Nat;
    orgId : OrgId;
    amount : Nat; // in cents
    currency : Text;
    description : Text;
    paidAt : Timestamp;
    stripeInvoiceId : ?Text;
  };
};
