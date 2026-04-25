import type {
  CsvLeadRow,
  ExtendedLead,
  ExtendedLeadInput,
  ImportResult,
  LeadId,
  LeadStatus,
  OrgId,
} from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── List Leads ────────────────────────────────────────────────────────────────

export function useLeads(
  orgId: OrgId | null,
  statusFilter: LeadStatus | null = null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ExtendedLead[]>({
    queryKey: ["leads", orgId?.toString(), statusFilter],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listLeads(orgId, statusFilter);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

// ── Create Single Lead ────────────────────────────────────────────────────────

export function useCreateLead(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExtendedLeadInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.createExtendedLead(orgId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", orgId?.toString()] });
    },
    onError: () => {
      toast.error("Failed to create lead");
    },
  });
}

// ── Bulk Import from CSV ──────────────────────────────────────────────────────

export function useBulkImportLeads(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, CsvLeadRow[]>({
    mutationFn: async (csvRows: CsvLeadRow[]) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.importLeadsFromCsv(orgId, csvRows);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["leads", orgId?.toString()] });
      const n = Number(result.success);
      if (n > 0) toast.success(`${n} lead${n !== 1 ? "s" : ""} imported`);
      if (result.errors.length > 0)
        toast.warning(
          `${result.errors.length} row${result.errors.length !== 1 ? "s" : ""} had errors`,
        );
    },
    onError: () => {
      toast.error("Bulk import failed");
    },
  });
}

// ── Update Lead Status ────────────────────────────────────────────────────────

export function useUpdateLeadStatus(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      newStatus,
    }: { leadId: LeadId; newStatus: LeadStatus }) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.updateExtendedLeadStatus(orgId, leadId, newStatus);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", orgId?.toString()] });
      toast.success("Lead status updated");
    },
    onError: () => {
      toast.error("Failed to update lead status");
    },
  });
}
