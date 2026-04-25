import Map      "mo:core/Map";
import List     "mo:core/List";
import Time     "mo:core/Time";
import Text     "mo:core/Text";
import Types    "../types/b2b-leads";
import CrmTypes "../types/crm";

module {

  // ── Type aliases for state containers ──────────────────────────────────────

  public type ApiKeyMap    = Map.Map<(Types.OrgId, Types.PortalType), Types.PortalApiKey>;
  // SyncHistList stores (OrgId, SyncRecord) tuples so records can be filtered by org
  public type SyncHistList = List.List<(Types.OrgId, Types.SyncRecord)>;
  public type LeadList     = List.List<Types.ExtendedLead>;
  public type ContactList  = List.List<CrmTypes.Contact>;

  // ── Comparison helper for (OrgId, PortalType) map key ─────────────────────

  func portalToOrd(p : Types.PortalType) : Nat {
    switch p {
      case (#indiamart)       0;
      case (#tradeindia)      1;
      case (#exportindia)     2;
      case (#justdial)        3;
      case (#globallinker)    4;
      case (#google)          5;
      case (#facebookPage)    6;
      case (#metaAds)         7;
      case (#websiteWebhook)  8;
    }
  };

  public func apiKeyCompare(
    a : (Types.OrgId, Types.PortalType),
    b : (Types.OrgId, Types.PortalType),
  ) : { #less; #equal; #greater } {
    if (a.0 < b.0) return #less;
    if (a.0 > b.0) return #greater;
    let pa = portalToOrd(a.1);
    let pb = portalToOrd(b.1);
    if (pa < pb) #less
    else if (pa > pb) #greater
    else #equal
  };

  // ── Portal Text helpers ────────────────────────────────────────────────────

  public func portalTypeToText(p : Types.PortalType) : Text {
    switch p {
      case (#indiamart)       "indiamart";
      case (#tradeindia)      "tradeindia";
      case (#exportindia)     "exportindia";
      case (#justdial)        "justdial";
      case (#globallinker)    "globallinker";
      case (#google)          "google";
      case (#facebookPage)    "facebookpage";
      case (#metaAds)         "metaads";
      case (#websiteWebhook)  "websitewebhook";
    }
  };

  public func maskKey(key : Text) : Text {
    let len = key.size();
    if (len <= 4) { "****" }
    else {
      let suffix = key.toArray();
      "****" # Text.fromArray([suffix[len - 4], suffix[len - 3], suffix[len - 2], suffix[len - 1]])
    }
  };

  // ── Portal API Key storage ─────────────────────────────────────────────────

  public func savePortalApiKey(
    apiKeys : ApiKeyMap,
    orgId   : Types.OrgId,
    portal  : Types.PortalType,
    apiKey  : Text,
  ) : () {
    let k : (Types.OrgId, Types.PortalType) = (orgId, portal);
    let existing = apiKeys.get(apiKeyCompare, k);
    let record : Types.PortalApiKey = switch existing {
      case (?e) { { e with apiKey; syncStatus = #idle } };
      case null  {
        { orgId; portal; apiKey; lastSynced = null; syncStatus = #idle }
      };
    };
    apiKeys.add(apiKeyCompare, k, record);
  };

  public func getPortalApiKeys(
    apiKeys : ApiKeyMap,
    orgId   : Types.OrgId,
  ) : [Types.PortalApiKeyInfo] {
    let buf = List.empty<Types.PortalApiKeyInfo>();
    for ((k, v) in apiKeys.entries()) {
      let (oid, _p) = k;
      if (oid == orgId) {
        buf.add({
          portal     = v.portal;
          maskedKey  = maskKey(v.apiKey);
          lastSynced = v.lastSynced;
          syncStatus = v.syncStatus;
        });
      };
    };
    buf.toArray()
  };

  public func getPortalApiKey(
    apiKeys : ApiKeyMap,
    orgId   : Types.OrgId,
    portal  : Types.PortalType,
  ) : ?Types.PortalApiKey {
    apiKeys.get(apiKeyCompare, (orgId, portal))
  };

  public func setPortalSyncStatus(
    apiKeys    : ApiKeyMap,
    orgId      : Types.OrgId,
    portal     : Types.PortalType,
    status     : Types.SyncStatus,
    lastSynced : ?Types.Timestamp,
  ) : () {
    let k : (Types.OrgId, Types.PortalType) = (orgId, portal);
    switch (apiKeys.get(apiKeyCompare, k)) {
      case (?existing) {
        apiKeys.add(apiKeyCompare, k, {
          existing with
          syncStatus = status;
          lastSynced = switch lastSynced {
            case (?ts) ?ts;
            case null  existing.lastSynced;
          };
        });
      };
      case null {};
    }
  };

  // ── Sync History ───────────────────────────────────────────────────────────

  public func recordSyncHistory(
    history : SyncHistList,
    orgId   : Types.OrgId,
    record  : Types.SyncRecord,
  ) : () {
    history.add((orgId, record));
  };

  public func listSyncHistory(
    history : SyncHistList,
    orgId   : Types.OrgId,
    portal  : Types.PortalType,
  ) : [Types.SyncRecord] {
    let buf = List.empty<Types.SyncRecord>();
    history.forEach(func(entry : (Types.OrgId, Types.SyncRecord)) {
      let (oid, r) = entry;
      if (oid == orgId and r.portal == portal) {
        buf.add(r);
      };
    });
    buf.toArray()
  };

  // ── Deduplication ──────────────────────────────────────────────────────────

  public func isDuplicate(
    contacts : ContactList,
    orgId    : Types.OrgId,
    email    : ?Text,
    phone    : ?Text,
  ) : Bool {
    contacts.find(func(c : CrmTypes.Contact) : Bool {
      if (c.orgId != orgId) return false;
      let matchEmail = switch (email) {
        case (?e) switch (c.email) { case (?ce) ce == e; case null false };
        case null false;
      };
      let matchPhone = switch (phone) {
        case (?p) switch (c.phone) { case (?cp) cp == p; case null false };
        case null false;
      };
      matchEmail or matchPhone
    }) != null
  };

  // ── Lead creation / listing ────────────────────────────────────────────────

  public func createExtendedLead(
    leads  : LeadList,
    nextId : { var value : Nat },
    orgId  : Types.OrgId,
    input  : Types.ExtendedLeadInput,
    caller : Principal,
  ) : Types.ExtendedLead {
    let now  = Time.now();
    let lead : Types.ExtendedLead = {
      id        = nextId.value;
      orgId;
      contactId = input.contactId;
      status    = input.status;
      score     = 10;
      source    = input.source;
      notes     = input.notes;
      createdAt = now;
      createdBy = caller;
      updatedAt = now;
    };
    leads.add(lead);
    nextId.value += 1;
    lead
  };

  public func listExtendedLeads(
    leads        : LeadList,
    orgId        : Types.OrgId,
    statusFilter : ?Types.LeadStatus,
  ) : [Types.ExtendedLead] {
    leads.filter(func(l : Types.ExtendedLead) : Bool {
      if (l.orgId != orgId) return false;
      switch statusFilter {
        case null true;
        case (?s) l.status == s;
      }
    }).toArray()
  };

  /// Update the status of an extended lead. Returns true if found and updated.
  public func updateExtendedLeadStatus(
    leads    : LeadList,
    orgId    : Types.OrgId,
    leadId   : Types.LeadId,
    newStatus : Types.LeadStatus,
  ) : Bool {
    var found = false;
    leads.mapInPlace(func(l : Types.ExtendedLead) : Types.ExtendedLead {
      if (l.id == leadId and l.orgId == orgId) {
        found := true;
        { l with status = newStatus; updatedAt = Time.now() }
      } else l
    });
    found
  };

  // ── CSV bulk import helpers ────────────────────────────────────────────────

  public func sourceFromText(s : Text) : Types.LeadSource {
    switch (s.toLower()) {
      case "indiamart"    #indiamart;
      case "tradeindia"   #tradeindia;
      case "exportindia"  #exportindia;
      case "justdial"     #justdial;
      case "globallinker" #globallinker;
      case "csv"          #csv;
      case _              #manual;
    }
  };

  /// Creates a Contact and an ExtendedLead from a CsvLeadRow.
  /// Returns #ok on success or #err with a message on failure.
  public func importCsvRow(
    contacts      : ContactList,
    leads         : LeadList,
    nextContactId : { var value : Nat },
    nextLeadId    : { var value : Nat },
    orgId         : Types.OrgId,
    caller        : Principal,
    row           : Types.CsvLeadRow,
  ) : { #ok; #err : Text } {
    if (row.name == "") return #err("");

    // Dedup check
    if (isDuplicate(contacts, orgId, row.email, row.phone)) {
      return #err("dup");
    };

    let now : Types.Timestamp = Time.now();
    let contact : CrmTypes.Contact = {
      id        = nextContactId.value;
      orgId;
      name      = row.name;
      email     = row.email;
      phone     = row.phone;
      company   = row.company;
      tags      = [];
      createdAt = now;
      createdBy = caller;
      updatedAt = now;
    };
    contacts.add(contact);
    nextContactId.value += 1;

    let lead : Types.ExtendedLead = {
      id        = nextLeadId.value;
      orgId;
      contactId = contact.id;
      status    = #new_;
      score     = 10;
      source    = sourceFromText(row.source);
      notes     = row.notes;
      createdAt = now;
      createdBy = caller;
      updatedAt = now;
    };
    leads.add(lead);
    nextLeadId.value += 1;

    #ok
  };
};
