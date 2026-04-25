import Types "../types/crm";
import AuthOrgTypes "../types/auth-org";
import CrmLib "../lib/crm";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";

mixin (
  contacts : List.List<Types.Contact>,
  interactionNotes : List.List<Types.InteractionNote>,
  leads : List.List<Types.Lead>,
  deals : List.List<Types.Deal>,
  dealStageHistory : List.List<Types.DealStageEvent>,
  dealNotes : List.List<Types.DealNote>,
  nextContactId : { var value : Nat },
  nextLeadId : { var value : Nat },
  nextDealId : { var value : Nat },
  nextNoteId : { var value : Nat },
  getCallerOrgRole : (caller : Principal, orgId : Types.OrgId) -> ?AuthOrgTypes.OrgRole,
) {

  // ─── Contacts ──────────────────────────────────────────────────────────────

  public shared query ({ caller }) func listContacts(
    orgId : Types.OrgId,
    search : ?Text,
    tag : ?Text,
    sortField : ?Types.ContactSortField,
    sortAsc : Bool,
  ) : async [Types.Contact] {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.listContacts(contacts, orgId, search, tag, sortField, sortAsc);
    }
  };

  public shared query ({ caller }) func getContact(
    orgId : Types.OrgId,
    id : Types.ContactId,
  ) : async ?Types.Contact {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.getContact(contacts, orgId, id);
    }
  };

  public shared ({ caller }) func createContact(
    orgId : Types.OrgId,
    input : Types.ContactInput,
  ) : async Types.ContactId {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ {
        let contact = CrmLib.createContact(contacts, nextContactId.value, orgId, caller, input);
        nextContactId.value += 1;
        contact.id
      };
    }
  };

  public shared ({ caller }) func updateContact(
    orgId : Types.OrgId,
    id : Types.ContactId,
    input : Types.ContactInput,
  ) : async Bool {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.updateContact(contacts, orgId, id, input);
    }
  };

  public shared ({ caller }) func deleteContact(
    orgId : Types.OrgId,
    id : Types.ContactId,
  ) : async Bool {
    switch (getCallerOrgRole(caller, orgId)) {
      case (? #member) Runtime.trap("CRM: members cannot delete contacts in org " # orgId.toText());
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.deleteContact(contacts, orgId, id);
    }
  };

  public shared query ({ caller }) func exportContactsCsv(
    orgId : Types.OrgId,
  ) : async Text {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.exportContactsCsv(contacts, orgId);
    }
  };

  public shared query ({ caller }) func listInteractionNotes(
    orgId : Types.OrgId,
    contactId : Types.ContactId,
  ) : async [Types.InteractionNote] {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.listInteractionNotes(interactionNotes, orgId, contactId);
    }
  };

  public shared ({ caller }) func addInteractionNote(
    orgId : Types.OrgId,
    input : Types.InteractionNoteInput,
  ) : async Types.NoteId {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ {
        let note = CrmLib.addInteractionNote(interactionNotes, nextNoteId.value, orgId, caller, input);
        nextNoteId.value += 1;
        let newScore = CrmLib.computeLeadScore(interactionNotes, deals, orgId, input.contactId);
        CrmLib.updateLeadScore(leads, orgId, input.contactId, newScore);
        note.id
      };
    }
  };

  public shared query ({ caller }) func getLeadByContact(
    orgId : Types.OrgId,
    contactId : Types.ContactId,
  ) : async ?Types.Lead {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.getLeadByContact(leads, orgId, contactId);
    }
  };

  public shared ({ caller }) func createLead(
    orgId : Types.OrgId,
    input : Types.LeadInput,
  ) : async Types.LeadId {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ {
        let lead = CrmLib.createLead(leads, nextLeadId.value, orgId, caller, input);
        nextLeadId.value += 1;
        lead.id
      };
    }
  };

  public shared query ({ caller }) func listDeals(
    orgId : Types.OrgId,
  ) : async [Types.Deal] {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.listDeals(deals, orgId);
    }
  };

  public shared query ({ caller }) func getDeal(
    orgId : Types.OrgId,
    id : Types.DealId,
  ) : async ?Types.Deal {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.getDeal(deals, orgId, id);
    }
  };

  public shared ({ caller }) func createDeal(
    orgId : Types.OrgId,
    input : Types.DealInput,
  ) : async Types.DealId {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ {
        let deal = CrmLib.createDeal(deals, dealStageHistory, nextDealId.value, orgId, caller, input);
        nextDealId.value += 1;
        deal.id
      };
    }
  };

  public shared ({ caller }) func updateDeal(
    orgId : Types.OrgId,
    id : Types.DealId,
    input : Types.DealInput,
  ) : async Bool {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.updateDeal(deals, dealStageHistory, orgId, id, caller, input);
    }
  };

  public shared ({ caller }) func deleteDeal(
    orgId : Types.OrgId,
    id : Types.DealId,
  ) : async Bool {
    switch (getCallerOrgRole(caller, orgId)) {
      case (? #member) Runtime.trap("CRM: members cannot delete deals in org " # orgId.toText());
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.deleteDeal(deals, orgId, id);
    }
  };

  public shared query ({ caller }) func listDealStageHistory(
    orgId : Types.OrgId,
    dealId : Types.DealId,
  ) : async [Types.DealStageEvent] {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.listDealStageHistory(dealStageHistory, orgId, dealId);
    }
  };

  public shared query ({ caller }) func listDealNotes(
    orgId : Types.OrgId,
    dealId : Types.DealId,
  ) : async [Types.DealNote] {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.listDealNotes(dealNotes, orgId, dealId);
    }
  };

  public shared ({ caller }) func addDealNote(
    orgId : Types.OrgId,
    input : Types.DealNoteInput,
  ) : async Types.NoteId {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ {
        let note = CrmLib.addDealNote(dealNotes, nextNoteId.value, orgId, caller, input);
        nextNoteId.value += 1;
        note.id
      };
    }
  };

  public shared query ({ caller }) func getPipelineSummary(
    orgId : Types.OrgId,
  ) : async Types.PipelineSummary {
    switch (getCallerOrgRole(caller, orgId)) {
      case null Runtime.trap("CRM: caller is not a member of org " # orgId.toText());
      case _ CrmLib.getPipelineSummary(deals, orgId);
    }
  };
};
