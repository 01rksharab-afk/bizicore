import Common "common";

module {
  public type OrgId    = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  public type LeadId    = Nat;
  public type ContactId = Nat;

  // ─── Portal Types ──────────────────────────────────────────────────────────

  public type PortalType = {
    #indiamart;
    #tradeindia;
    #exportindia;
    #justdial;
    #globallinker;
    // Expanded integrations
    #google;
    #facebookPage;
    #metaAds;
    #websiteWebhook;
  };

  // Configuration for website webhook integration
  public type WebhookConfig = {
    webhookUrl : Text;
    secretKey  : Text;
    lastPing   : ?Int;
  };

  public type SyncStatus = {
    #idle;
    #syncing;
    #success;
    #failed;
  };

  // Stored portal API key record (key is kept encrypted/masked for API responses)
  public type PortalApiKey = {
    orgId       : OrgId;
    portal      : PortalType;
    apiKey      : Text;        // stored plaintext; masked on read
    lastSynced  : ?Timestamp;
    syncStatus  : SyncStatus;
  };

  // Public-facing key info (key is masked)
  public type PortalApiKeyInfo = {
    portal      : PortalType;
    maskedKey   : Text;
    lastSynced  : ?Timestamp;
    syncStatus  : SyncStatus;
  };

  // ─── Sync ──────────────────────────────────────────────────────────────────

  public type SyncResult = {
    newLeads   : Nat;
    duplicates : Nat;
    errors     : [Text];
    timestamp  : Timestamp;
  };

  public type SyncRecord = {
    portal    : PortalType;
    timestamp : Timestamp;
    newLeads  : Nat;
    duplicates : Nat;
    status    : { #success; #failed };
    errorMsg  : ?Text;
  };

  // ─── Lead Source ───────────────────────────────────────────────────────────

  public type LeadSource = {
    #manual;
    #csv;
    #indiamart;
    #tradeindia;
    #exportindia;
    #justdial;
    #globallinker;
    #google;
    #facebookPage;
    #metaAds;
    #websiteWebhook;
  };

  // ─── Extended Lead (overlays crm.Lead with source/notes) ──────────────────

  public type ExtendedLead = {
    id        : LeadId;
    orgId     : OrgId;
    contactId : ContactId;
    status    : LeadStatus;
    score     : Nat;
    source    : LeadSource;
    notes     : Text;
    createdAt : Timestamp;
    createdBy : Principal;
    updatedAt : Timestamp;
  };

  public type LeadStatus = {
    #new_;
    #qualified;
    #converted;
    #lost;
  };

  // Input for creating a single extended lead
  public type ExtendedLeadInput = {
    contactId : ContactId;
    status    : LeadStatus;
    source    : LeadSource;
    notes     : Text;
  };

  // ─── CSV Bulk Import ───────────────────────────────────────────────────────

  public type CsvLeadRow = {
    name    : Text;
    company : ?Text;
    phone   : ?Text;
    email   : ?Text;
    source  : Text;   // raw string mapped to LeadSource
    notes   : Text;
  };

  public type RowError = {
    row : Nat;
    msg : Text;
  };

  public type ImportResult = {
    success : Nat;
    errors  : [RowError];
  };
};
