import Types "../types/crm";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";

module {
  // ─── Contacts ──────────────────────────────────────────────────────────────

  public func listContacts(
    contacts : List.List<Types.Contact>,
    orgId : Types.OrgId,
    search : ?Text,
    tag : ?Text,
    sortField : ?Types.ContactSortField,
    sortAsc : Bool,
  ) : [Types.Contact] {
    let filtered = contacts.filter(func(c) {
      if (c.orgId != orgId) return false;
      let matchesSearch = switch (search) {
        case null true;
        case (?s) {
          let q = s.toLower();
          c.name.toLower().contains(#text q) or
          (switch (c.email) { case (?e) e.toLower().contains(#text q); case null false }) or
          (switch (c.company) { case (?co) co.toLower().contains(#text q); case null false })
        };
      };
      let matchesTag = switch (tag) {
        case null true;
        case (?t) c.tags.find(func(tg) { tg == t }) != null;
      };
      matchesSearch and matchesTag
    });

    let sorted = filtered.sort(func(a, b) {
      let cmp = switch (sortField) {
        case (? #name) Text.compare(a.name, b.name);
        case (? #company) {
          let ca = switch (a.company) { case (?c) c; case null "" };
          let cb = switch (b.company) { case (?c) c; case null "" };
          Text.compare(ca, cb)
        };
        case (? #createdAt) {
          if (a.createdAt < b.createdAt) #less
          else if (a.createdAt > b.createdAt) #greater
          else #equal
        };
        case null Text.compare(a.name, b.name);
      };
      if (sortAsc) cmp
      else switch (cmp) {
        case (#less) #greater;
        case (#greater) #less;
        case (#equal) #equal;
      }
    });
    sorted.toArray()
  };

  public func getContact(
    contacts : List.List<Types.Contact>,
    orgId : Types.OrgId,
    id : Types.ContactId,
  ) : ?Types.Contact {
    contacts.find(func(c) { c.id == id and c.orgId == orgId })
  };

  public func createContact(
    contacts : List.List<Types.Contact>,
    nextId : Nat,
    orgId : Types.OrgId,
    caller : Principal,
    input : Types.ContactInput,
  ) : Types.Contact {
    let now = Time.now();
    let contact : Types.Contact = {
      id = nextId;
      orgId;
      name = input.name;
      email = input.email;
      phone = input.phone;
      company = input.company;
      tags = input.tags;
      createdAt = now;
      createdBy = caller;
      updatedAt = now;
    };
    contacts.add(contact);
    contact
  };

  public func updateContact(
    contacts : List.List<Types.Contact>,
    orgId : Types.OrgId,
    id : Types.ContactId,
    input : Types.ContactInput,
  ) : Bool {
    var found = false;
    contacts.mapInPlace(func(c) {
      if (c.id == id and c.orgId == orgId) {
        found := true;
        {
          c with
          name = input.name;
          email = input.email;
          phone = input.phone;
          company = input.company;
          tags = input.tags;
          updatedAt = Time.now();
        }
      } else c
    });
    found
  };

  public func deleteContact(
    contacts : List.List<Types.Contact>,
    orgId : Types.OrgId,
    id : Types.ContactId,
  ) : Bool {
    let before = contacts.size();
    let kept = contacts.filter(func(c) { not (c.id == id and c.orgId == orgId) });
    contacts.clear();
    contacts.append(kept);
    contacts.size() < before
  };

  public func exportContactsCsv(
    contacts : List.List<Types.Contact>,
    orgId : Types.OrgId,
  ) : Text {
    let buf = List.empty<Text>();
    buf.add("id,name,email,phone,company,tags,createdAt\n");
    for (c in contacts.values()) {
      if (c.orgId == orgId) {
        let email = switch (c.email) { case (?e) e; case null "" };
        let phone = switch (c.phone) { case (?p) p; case null "" };
        let company = switch (c.company) { case (?co) co; case null "" };
        let tagBuf = List.empty<Text>();
        for (t in c.tags.values()) { tagBuf.add(t) };
        buf.add(c.id.toText() # "," # c.name # "," # email # "," # phone # "," # company # "," # tagBuf.values().join(";") # "," # c.createdAt.toText() # "\n");
      };
    };
    buf.values().join("")
  };

  // ─── Interaction Notes ─────────────────────────────────────────────────────

  public func listInteractionNotes(
    notes : List.List<Types.InteractionNote>,
    orgId : Types.OrgId,
    contactId : Types.ContactId,
  ) : [Types.InteractionNote] {
    notes.filter(func(n) { n.orgId == orgId and n.contactId == contactId }).toArray()
  };

  public func addInteractionNote(
    notes : List.List<Types.InteractionNote>,
    nextId : Nat,
    orgId : Types.OrgId,
    caller : Principal,
    input : Types.InteractionNoteInput,
  ) : Types.InteractionNote {
    let now = Time.now();
    let note : Types.InteractionNote = {
      id = nextId;
      orgId;
      contactId = input.contactId;
      kind = input.kind;
      outcome = input.outcome;
      occurredAt = input.occurredAt;
      createdBy = caller;
      createdAt = now;
    };
    notes.add(note);
    note
  };

  // ─── Leads ─────────────────────────────────────────────────────────────────

  public func getLeadByContact(
    leads : List.List<Types.Lead>,
    orgId : Types.OrgId,
    contactId : Types.ContactId,
  ) : ?Types.Lead {
    leads.find(func(l) { l.orgId == orgId and l.contactId == contactId })
  };

  public func createLead(
    leads : List.List<Types.Lead>,
    nextId : Nat,
    orgId : Types.OrgId,
    caller : Principal,
    input : Types.LeadInput,
  ) : Types.Lead {
    let now = Time.now();
    let lead : Types.Lead = {
      id = nextId;
      orgId;
      contactId = input.contactId;
      status = input.status;
      score = 10; // default starting score
      createdAt = now;
      createdBy = caller;
      updatedAt = now;
    };
    leads.add(lead);
    lead
  };

  public func computeLeadScore(
    notes : List.List<Types.InteractionNote>,
    deals : List.List<Types.Deal>,
    orgId : Types.OrgId,
    contactId : Types.ContactId,
  ) : Nat {
    let noteCount = notes.filter(func(n) { n.orgId == orgId and n.contactId == contactId }).size();
    let hasDeals = deals.find(func(d) {
      d.orgId == orgId and
      (switch (d.contactId) { case (?cid) cid == contactId; case null false })
    }) != null;
    let base : Nat = 10;
    let noteBonus : Nat = if (noteCount > 10) 40 else noteCount * 4;
    let dealBonus : Nat = if (hasDeals) 30 else 0;
    let score = base + noteBonus + dealBonus;
    if (score > 100) 100 else score
  };

  public func updateLeadScore(
    leads : List.List<Types.Lead>,
    orgId : Types.OrgId,
    contactId : Types.ContactId,
    score : Nat,
  ) {
    leads.mapInPlace(func(l) {
      if (l.orgId == orgId and l.contactId == contactId) {
        { l with score; updatedAt = Time.now() }
      } else l
    })
  };

  // ─── Deals ─────────────────────────────────────────────────────────────────

  public func listDeals(
    deals : List.List<Types.Deal>,
    orgId : Types.OrgId,
  ) : [Types.Deal] {
    deals.filter(func(d) { d.orgId == orgId }).toArray()
  };

  public func getDeal(
    deals : List.List<Types.Deal>,
    orgId : Types.OrgId,
    id : Types.DealId,
  ) : ?Types.Deal {
    deals.find(func(d) { d.id == id and d.orgId == orgId })
  };

  public func createDeal(
    deals : List.List<Types.Deal>,
    stageHistory : List.List<Types.DealStageEvent>,
    nextId : Nat,
    orgId : Types.OrgId,
    caller : Principal,
    input : Types.DealInput,
  ) : Types.Deal {
    let now = Time.now();
    let deal : Types.Deal = {
      id = nextId;
      orgId;
      name = input.name;
      value = input.value;
      stage = input.stage;
      owner = input.owner;
      contactId = input.contactId;
      closeDate = input.closeDate;
      createdAt = now;
      createdBy = caller;
      updatedAt = now;
    };
    deals.add(deal);
    stageHistory.add({
      dealId = nextId;
      orgId;
      fromStage = null;
      toStage = input.stage;
      changedAt = now;
      changedBy = caller;
    });
    deal
  };

  public func updateDeal(
    deals : List.List<Types.Deal>,
    stageHistory : List.List<Types.DealStageEvent>,
    orgId : Types.OrgId,
    id : Types.DealId,
    caller : Principal,
    input : Types.DealInput,
  ) : Bool {
    var found = false;
    var prevStage : ?Types.DealStage = null;
    deals.mapInPlace(func(d) {
      if (d.id == id and d.orgId == orgId) {
        found := true;
        prevStage := ?d.stage;
        {
          d with
          name = input.name;
          value = input.value;
          stage = input.stage;
          owner = input.owner;
          contactId = input.contactId;
          closeDate = input.closeDate;
          updatedAt = Time.now();
        }
      } else d
    });
    if (found) {
      switch (prevStage) {
        case (?from) {
          stageHistory.add({
            dealId = id;
            orgId;
            fromStage = ?from;
            toStage = input.stage;
            changedAt = Time.now();
            changedBy = caller;
          })
        };
        case null {};
      }
    };
    found
  };

  public func deleteDeal(
    deals : List.List<Types.Deal>,
    orgId : Types.OrgId,
    id : Types.DealId,
  ) : Bool {
    let before = deals.size();
    let kept = deals.filter(func(d) { not (d.id == id and d.orgId == orgId) });
    deals.clear();
    deals.append(kept);
    deals.size() < before
  };

  public func listDealStageHistory(
    stageHistory : List.List<Types.DealStageEvent>,
    orgId : Types.OrgId,
    dealId : Types.DealId,
  ) : [Types.DealStageEvent] {
    stageHistory.filter(func(e) { e.orgId == orgId and e.dealId == dealId }).toArray()
  };

  // ─── Deal Notes ────────────────────────────────────────────────────────────

  public func listDealNotes(
    dealNotes : List.List<Types.DealNote>,
    orgId : Types.OrgId,
    dealId : Types.DealId,
  ) : [Types.DealNote] {
    dealNotes.filter(func(n) { n.orgId == orgId and n.dealId == dealId }).toArray()
  };

  public func addDealNote(
    dealNotes : List.List<Types.DealNote>,
    nextId : Nat,
    orgId : Types.OrgId,
    caller : Principal,
    input : Types.DealNoteInput,
  ) : Types.DealNote {
    let now = Time.now();
    let note : Types.DealNote = {
      id = nextId;
      orgId;
      dealId = input.dealId;
      text = input.text;
      createdBy = caller;
      createdAt = now;
    };
    dealNotes.add(note);
    note
  };

  // ─── Pipeline Summary ──────────────────────────────────────────────────────

  public func getPipelineSummary(
    deals : List.List<Types.Deal>,
    orgId : Types.OrgId,
  ) : Types.PipelineSummary {
    let orgDeals = deals.filter(func(d) { d.orgId == orgId }).toArray();
    let totalCount = orgDeals.size();

    let allStages : [Types.DealStage] = [#prospect, #qualified, #negotiation, #closedWon, #closedLost];

    let stages = allStages.map(func(stage : Types.DealStage) : Types.StageSummary {
      let stageDeals = orgDeals.filter(func(d) { d.stage == stage });
      let totalValue = stageDeals.foldLeft(0 : Nat, func(acc : Nat, d : Types.Deal) : Nat { acc + d.value });
      { stage; count = stageDeals.size(); totalValue }
    });

    let wonCount = orgDeals.filter(func(d) { d.stage == #closedWon }).size();
    let lostCount = orgDeals.filter(func(d) { d.stage == #closedLost }).size();
    let closedCount = wonCount + lostCount;
    let winRate : Nat = if (closedCount == 0) 0 else (wonCount * 100) / closedCount;

    let totalValue = orgDeals.foldLeft(0 : Nat, func(acc : Nat, d : Types.Deal) : Nat { acc + d.value });
    let averageDealSize : Nat = if (totalCount == 0) 0 else totalValue / totalCount;

    { stages; winRate; averageDealSize }
  };
};
