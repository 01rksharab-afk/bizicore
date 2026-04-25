import type {
  Contact,
  ContactId,
  ContactInput,
  ContactSortField,
  Deal,
  DealId,
  DealInput,
  DealNote,
  DealNoteInput,
  DealStageEvent,
  InteractionNote,
  InteractionNoteInput,
  Lead,
  LeadInput,
  OrgId,
  PipelineSummary,
} from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Contacts ──────────────────────────────────────────────────────────────────

export function useContacts(
  orgId: OrgId | null,
  search = "",
  tag: string | null = null,
  sortField: ContactSortField | null = null,
  sortAsc = true,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Contact[]>({
    queryKey: ["contacts", orgId?.toString(), search, tag, sortField, sortAsc],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listContacts(orgId, search || null, tag, sortField, sortAsc);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useContact(orgId: OrgId | null, id: ContactId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Contact | null>({
    queryKey: ["contact", orgId?.toString(), id?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !id) return null;
      return actor.getContact(orgId, id);
    },
    enabled: !!actor && !isFetching && !!orgId && !!id,
  });
}

export function useCreateContact(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ContactInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.createContact(orgId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts", orgId?.toString()] });
    },
  });
}

export function useUpdateContact(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: ContactId; input: ContactInput }) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.updateContact(orgId, id, input);
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["contacts", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["contact", orgId?.toString(), id.toString()],
      });
    },
  });
}

export function useDeleteContact(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: ContactId) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.deleteContact(orgId, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts", orgId?.toString()] });
    },
  });
}

export function useExportContactsCsv(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.exportContactsCsv(orgId);
    },
  });
}

// ── Interaction Notes ─────────────────────────────────────────────────────────

export function useInteractionNotes(
  orgId: OrgId | null,
  contactId: ContactId | null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<InteractionNote[]>({
    queryKey: ["interactionNotes", orgId?.toString(), contactId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !contactId) return [];
      return actor.listInteractionNotes(orgId, contactId);
    },
    enabled: !!actor && !isFetching && !!orgId && !!contactId,
  });
}

export function useAddInteractionNote(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InteractionNoteInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.addInteractionNote(orgId, input);
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({
        queryKey: [
          "interactionNotes",
          orgId?.toString(),
          input.contactId.toString(),
        ],
      });
    },
  });
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export function useLeadByContact(
  orgId: OrgId | null,
  contactId: ContactId | null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Lead | null>({
    queryKey: ["lead", orgId?.toString(), contactId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !contactId) return null;
      return actor.getLeadByContact(orgId, contactId);
    },
    enabled: !!actor && !isFetching && !!orgId && !!contactId,
  });
}

export function useCreateLead(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeadInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.createLead(orgId, input);
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({
        queryKey: ["lead", orgId?.toString(), input.contactId.toString()],
      });
    },
  });
}

// ── Deals ─────────────────────────────────────────────────────────────────────

export function useDeals(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Deal[]>({
    queryKey: ["deals", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listDeals(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useDeal(orgId: OrgId | null, id: DealId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Deal | null>({
    queryKey: ["deal", orgId?.toString(), id?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !id) return null;
      return actor.getDeal(orgId, id);
    },
    enabled: !!actor && !isFetching && !!orgId && !!id,
  });
}

export function useCreateDeal(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DealInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.createDeal(orgId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["pipelineSummary", orgId?.toString()],
      });
    },
  });
}

export function useUpdateDeal(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: DealId; input: DealInput }) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.updateDeal(orgId, id, input);
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["deals", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["deal", orgId?.toString(), id.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["pipelineSummary", orgId?.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["dealStageHistory", orgId?.toString(), id.toString()],
      });
    },
  });
}

export function useDeleteDeal(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: DealId) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.deleteDeal(orgId, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["pipelineSummary", orgId?.toString()],
      });
    },
  });
}

export function useDealNotes(orgId: OrgId | null, dealId: DealId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DealNote[]>({
    queryKey: ["dealNotes", orgId?.toString(), dealId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !dealId) return [];
      return actor.listDealNotes(orgId, dealId);
    },
    enabled: !!actor && !isFetching && !!orgId && !!dealId,
  });
}

export function useAddDealNote(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DealNoteInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.addDealNote(orgId, input);
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({
        queryKey: ["dealNotes", orgId?.toString(), input.dealId.toString()],
      });
    },
  });
}

export function useDealStageHistory(
  orgId: OrgId | null,
  dealId: DealId | null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DealStageEvent[]>({
    queryKey: ["dealStageHistory", orgId?.toString(), dealId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !dealId) return [];
      return actor.listDealStageHistory(orgId, dealId);
    },
    enabled: !!actor && !isFetching && !!orgId && !!dealId,
  });
}

export function usePipelineSummary(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PipelineSummary | null>({
    queryKey: ["pipelineSummary", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return actor.getPipelineSummary(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useMyRole(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["myRole", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return actor.getMyRole(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}
