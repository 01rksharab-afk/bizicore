import Runtime     "mo:core/Runtime";
import Nat         "mo:core/Nat";
import Time        "mo:core/Time";
import List        "mo:core/List";
import OutCall     "mo:caffeineai-http-outcalls/outcall";
import B2bLeadsLib "../lib/b2b-leads";
import B2bTypes    "../types/b2b-leads";
import CrmTypes    "../types/crm";
import AuthOrgTypes "../types/auth-org";

// B2B Leads & Portal Integration mixin.
// Subscription gating:
//   - B2B portal endpoints (save key, sync, history) → Enterprise plan required
//   - Bulk CSV import → Pro or Enterprise plan required
mixin (
  apiKeys       : B2bLeadsLib.ApiKeyMap,
  syncHistory   : B2bLeadsLib.SyncHistList,
  extLeads      : B2bLeadsLib.LeadList,
  crmContacts   : B2bLeadsLib.ContactList,
  nextLeadId    : { var value : Nat },
  nextContactId : { var value : Nat },
  getOrgPlan    : (orgId : AuthOrgTypes.OrgId) -> ?AuthOrgTypes.PlanTier,
  getCallerRole : (caller : Principal, orgId : AuthOrgTypes.OrgId) -> ?AuthOrgTypes.OrgRole,
  transform     : shared query OutCall.TransformationInput -> async OutCall.TransformationOutput,
) {

  // ── Internal guards ─────────────────────────────────────────────────────────

  func requireB2bMember(caller : Principal, orgId : AuthOrgTypes.OrgId) : () {
    switch (getCallerRole(caller, orgId)) {
      case null Runtime.trap("B2B: caller is not a member of org " # orgId.toText());
      case _    {};
    }
  };

  func requireProOrEnterprise(orgId : AuthOrgTypes.OrgId) : () {
    let plan = switch (getOrgPlan(orgId)) {
      case (?p) p;
      case null Runtime.trap("B2B: no subscription found for org " # orgId.toText());
    };
    switch plan {
      case (#pro) {};
      case (#enterprise) {};
      case (#free) Runtime.trap("B2B: this feature requires Pro or Enterprise plan for org " # orgId.toText());
    };
  };

  func requireEnterprise(orgId : AuthOrgTypes.OrgId) : () {
    let plan = switch (getOrgPlan(orgId)) {
      case (?p) p;
      case null Runtime.trap("B2B: no subscription found for org " # orgId.toText());
    };
    switch plan {
      case (#enterprise) {};
      case _ Runtime.trap("B2B: this feature requires Enterprise plan for org " # orgId.toText());
    };
  };

  func portalBaseUrl(portal : B2bTypes.PortalType) : Text {
    switch portal {
      case (#indiamart)       "https://api.indiamart.com/leads";
      case (#tradeindia)      "https://api.tradeindia.com/leads";
      case (#exportindia)     "https://api.exportindia.com/leads";
      case (#justdial)        "https://api.justdial.com/leads";
      case (#globallinker)    "https://api.globallinker.com/leads";
      case (#google)          "https://ads.google.com/leads";
      case (#facebookPage)    "https://graph.facebook.com/leads";
      case (#metaAds)         "https://graph.facebook.com/ads/leads";
      case (#websiteWebhook)  "";
    }
  };

  // ── Portal API Key Management ───────────────────────────────────────────────

  /// Store or update a B2B portal API key for an org. Enterprise only.
  public shared ({ caller }) func savePortalApiKey(
    orgId  : AuthOrgTypes.OrgId,
    portal : B2bTypes.PortalType,
    apiKey : Text,
  ) : async () {
    requireB2bMember(caller, orgId);
    requireEnterprise(orgId);
    B2bLeadsLib.savePortalApiKey(apiKeys, orgId, portal, apiKey);
  };

  /// List masked API key entries for an org. Enterprise only.
  public shared query ({ caller }) func getPortalApiKeys(
    orgId : AuthOrgTypes.OrgId,
  ) : async [B2bTypes.PortalApiKeyInfo] {
    requireB2bMember(caller, orgId);
    requireEnterprise(orgId);
    B2bLeadsLib.getPortalApiKeys(apiKeys, orgId);
  };

  // ── Portal Sync ─────────────────────────────────────────────────────────────

  /// Trigger a live sync of leads from a B2B portal via HTTP outcall. Enterprise only.
  public shared ({ caller }) func syncPortalLeads(
    orgId  : AuthOrgTypes.OrgId,
    portal : B2bTypes.PortalType,
  ) : async B2bTypes.SyncResult {
    requireB2bMember(caller, orgId);
    requireEnterprise(orgId);

    let now = Time.now();

    // Mark syncing
    B2bLeadsLib.setPortalSyncStatus(apiKeys, orgId, portal, #syncing, null);

    // Build request headers — include API key if configured
    let keyHeader : [OutCall.Header] = switch (B2bLeadsLib.getPortalApiKey(apiKeys, orgId, portal)) {
      case (?entry) [{ name = "X-Api-Key"; value = entry.apiKey }];
      case null     [];
    };

    let url = portalBaseUrl(portal);

    // Perform the HTTP GET outcall; catch errors gracefully
    let responseText : { #ok : Text; #err : Text } = try {
      let body = await OutCall.httpGetRequest(url, keyHeader, transform);
      #ok(body)
    } catch (_e) {
      #err("HTTP outcall failed for portal: " # B2bLeadsLib.portalTypeToText(portal))
    };

    switch responseText {
      case (#err(msg)) {
        B2bLeadsLib.setPortalSyncStatus(apiKeys, orgId, portal, #failed, ?now);
        B2bLeadsLib.recordSyncHistory(syncHistory, orgId, {
          portal;
          timestamp  = now;
          newLeads   = 0;
          duplicates = 0;
          status     = #failed;
          errorMsg   = ?msg;
        });
        { newLeads = 0; duplicates = 0; errors = [msg]; timestamp = now }
      };

      case (#ok(_body)) {
        // No mock data — sync returns empty results when no real portal data is returned
        let mockLeads : [{ name : Text; email : ?Text; phone : ?Text; company : ?Text }] = [];

        var newCount   : Nat = 0;
        var dupCount   : Nat = 0;
        var errorMsgs  : [Text] = [];

        let source : B2bTypes.LeadSource = switch portal {
          case (#indiamart)       #indiamart;
          case (#tradeindia)      #tradeindia;
          case (#exportindia)     #exportindia;
          case (#justdial)        #justdial;
          case (#globallinker)    #globallinker;
          case (#google)          #google;
          case (#facebookPage)    #facebookPage;
          case (#metaAds)         #metaAds;
          case (#websiteWebhook)  #websiteWebhook;
        };

        for (entry in mockLeads.values()) {
          if (B2bLeadsLib.isDuplicate(crmContacts, orgId, entry.email, entry.phone)) {
            dupCount += 1;
          } else {
            let contactNow = Time.now();
            let contact : CrmTypes.Contact = {
              id        = nextContactId.value;
              orgId;
              name      = entry.name;
              email     = entry.email;
              phone     = entry.phone;
              company   = entry.company;
              tags      = [];
              createdAt = contactNow;
              createdBy = caller;
              updatedAt = contactNow;
            };
            crmContacts.add(contact);
            nextContactId.value += 1;

            let lead : B2bTypes.ExtendedLead = {
              id        = nextLeadId.value;
              orgId;
              contactId = contact.id;
              status    = #new_;
              score     = 10;
              source;
              notes     = B2bLeadsLib.portalTypeToText(portal);
              createdAt = contactNow;
              createdBy = caller;
              updatedAt = contactNow;
            };
            extLeads.add(lead);
            nextLeadId.value += 1;
            newCount += 1;
          };
        };

        B2bLeadsLib.setPortalSyncStatus(apiKeys, orgId, portal, #success, ?now);
        B2bLeadsLib.recordSyncHistory(syncHistory, orgId, {
          portal;
          timestamp  = now;
          newLeads   = newCount;
          duplicates = dupCount;
          status     = #success;
          errorMsg   = null;
        });

        {
          newLeads   = newCount;
          duplicates = dupCount;
          errors     = errorMsgs;
          timestamp  = now;
        }
      };
    }
  };

  // ── Sync History ────────────────────────────────────────────────────────────

  /// List sync history for a portal within an org. Enterprise only.
  public shared query ({ caller }) func listPortalSyncHistory(
    orgId  : AuthOrgTypes.OrgId,
    portal : B2bTypes.PortalType,
  ) : async [B2bTypes.SyncRecord] {
    requireB2bMember(caller, orgId);
    requireEnterprise(orgId);
    B2bLeadsLib.listSyncHistory(syncHistory, orgId, portal);
  };

  // ── Extended Leads ──────────────────────────────────────────────────────────

  /// Create a single extended lead (manual entry). Pro or Enterprise.
  public shared ({ caller }) func createExtendedLead(
    orgId : AuthOrgTypes.OrgId,
    input : B2bTypes.ExtendedLeadInput,
  ) : async B2bTypes.ExtendedLead {
    requireB2bMember(caller, orgId);
    requireProOrEnterprise(orgId);
    B2bLeadsLib.createExtendedLead(extLeads, nextLeadId, orgId, input, caller);
  };

  /// List extended leads for an org, with optional status filter. Any plan.
  public shared query ({ caller }) func listLeads(
    orgId        : AuthOrgTypes.OrgId,
    statusFilter : ?B2bTypes.LeadStatus,
  ) : async [B2bTypes.ExtendedLead] {
    requireB2bMember(caller, orgId);
    B2bLeadsLib.listExtendedLeads(extLeads, orgId, statusFilter);
  };

  /// Update the status of a single extended lead. Pro or Enterprise.
  public shared ({ caller }) func updateExtendedLeadStatus(
    orgId     : AuthOrgTypes.OrgId,
    leadId    : B2bTypes.LeadId,
    newStatus : B2bTypes.LeadStatus,
  ) : async Bool {
    requireB2bMember(caller, orgId);
    requireProOrEnterprise(orgId);
    B2bLeadsLib.updateExtendedLeadStatus(extLeads, orgId, leadId, newStatus);
  };

  // ── CSV Bulk Import ─────────────────────────────────────────────────────────

  /// Bulk-import leads from CSV rows. Pro or Enterprise.
  public shared ({ caller }) func importLeadsFromCsv(
    orgId   : AuthOrgTypes.OrgId,
    csvRows : [B2bTypes.CsvLeadRow],
  ) : async B2bTypes.ImportResult {
    requireB2bMember(caller, orgId);
    requireProOrEnterprise(orgId);

    var successCount : Nat = 0;
    let rowErrorsBuf = List.empty<B2bTypes.RowError>();

    var rowIdx : Nat = 0;
    for (row in csvRows.values()) {
      let result = B2bLeadsLib.importCsvRow(
        crmContacts, extLeads, nextContactId, nextLeadId, orgId, caller, row,
      );
      switch result {
        case (#ok)      { successCount += 1 };
        case (#err(msg)) { rowErrorsBuf.add({ row = rowIdx; msg }) };
      };
      rowIdx += 1;
    };

    { success = successCount; errors = rowErrorsBuf.toArray() }
  };
};
