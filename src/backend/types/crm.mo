import Common "common";

module {
  public type OrgId = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // Unique identifiers
  public type ContactId = Nat;
  public type DealId = Nat;
  public type NoteId = Nat;
  public type LeadId = Nat;

  // ─── Contact ───────────────────────────────────────────────────────────────

  public type Contact = {
    id : ContactId;
    orgId : OrgId;
    name : Text;
    email : ?Text;
    phone : ?Text;
    company : ?Text;
    tags : [Text];
    createdAt : Timestamp;
    createdBy : Principal;
    updatedAt : Timestamp;
  };

  public type ContactInput = {
    name : Text;
    email : ?Text;
    phone : ?Text;
    company : ?Text;
    tags : [Text];
  };

  public type ContactSortField = {
    #name;
    #company;
    #createdAt;
  };

  // ─── Interaction Note ──────────────────────────────────────────────────────

  public type InteractionKind = {
    #call;
    #email;
    #meeting;
    #other;
  };

  public type InteractionNote = {
    id : NoteId;
    orgId : OrgId;
    contactId : ContactId;
    kind : InteractionKind;
    outcome : Text;
    occurredAt : Timestamp;
    createdBy : Principal;
    createdAt : Timestamp;
  };

  public type InteractionNoteInput = {
    contactId : ContactId;
    kind : InteractionKind;
    outcome : Text;
    occurredAt : Timestamp;
  };

  // ─── Lead ──────────────────────────────────────────────────────────────────

  public type LeadStatus = {
    #new_;
    #qualified;
    #converted;
    #lost;
  };

  public type Lead = {
    id : LeadId;
    orgId : OrgId;
    contactId : ContactId;
    status : LeadStatus;
    score : Nat; // 1-100
    createdAt : Timestamp;
    createdBy : Principal;
    updatedAt : Timestamp;
  };

  public type LeadInput = {
    contactId : ContactId;
    status : LeadStatus;
  };

  // ─── Deal ──────────────────────────────────────────────────────────────────

  public type DealStage = {
    #prospect;
    #qualified;
    #negotiation;
    #closedWon;
    #closedLost;
  };

  public type Deal = {
    id : DealId;
    orgId : OrgId;
    name : Text;
    value : Nat; // in cents
    stage : DealStage;
    owner : Principal;
    contactId : ?ContactId;
    closeDate : ?Timestamp;
    createdAt : Timestamp;
    createdBy : Principal;
    updatedAt : Timestamp;
  };

  public type DealInput = {
    name : Text;
    value : Nat;
    stage : DealStage;
    owner : Principal;
    contactId : ?ContactId;
    closeDate : ?Timestamp;
  };

  // ─── Deal Stage History ────────────────────────────────────────────────────

  public type DealStageEvent = {
    dealId : DealId;
    orgId : OrgId;
    fromStage : ?DealStage;
    toStage : DealStage;
    changedAt : Timestamp;
    changedBy : Principal;
  };

  // ─── Deal Note ─────────────────────────────────────────────────────────────

  public type DealNote = {
    id : NoteId;
    orgId : OrgId;
    dealId : DealId;
    text : Text;
    createdBy : Principal;
    createdAt : Timestamp;
  };

  public type DealNoteInput = {
    dealId : DealId;
    text : Text;
  };

  // ─── Pipeline Summary ──────────────────────────────────────────────────────

  public type StageSummary = {
    stage : DealStage;
    count : Nat;
    totalValue : Nat; // in cents
  };

  public type PipelineSummary = {
    stages : [StageSummary];
    winRate : Nat; // percentage 0-100
    averageDealSize : Nat; // in cents
  };
};
