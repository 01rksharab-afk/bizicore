import type { GstReturn, GstReturnId, GstReturnType, OrgId } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGstReturns(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<GstReturn[]>({
    queryKey: ["gstReturns", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listGstReturns(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useGstReturn(
  orgId: OrgId | null,
  returnId: GstReturnId | null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<GstReturn | null>({
    queryKey: ["gstReturn", orgId?.toString(), returnId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !returnId) return null;
      return actor.getGstReturn(returnId, orgId);
    },
    enabled: !!actor && !isFetching && !!orgId && !!returnId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

interface GenerateGstInput {
  year: bigint;
  month: bigint;
  returnType: GstReturnType;
}

export function useGenerateGstReturn(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month, returnType }: GenerateGstInput) => {
      if (!actor || !orgId) throw new Error("No actor or org");
      return actor.generateGstReturn(orgId, year, month, returnType);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["gstReturns", orgId?.toString()] });
      const typeLabel = vars.returnType === "gstr1" ? "GSTR-1" : "GSTR-3B";
      toast.success(`${typeLabel} generated for ${vars.month}/${vars.year}`);
    },
    onError: () => {
      toast.error("Failed to generate GST return");
    },
  });
}

export function useSubmitGstReturn(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (returnId: GstReturnId) => {
      if (!actor || !orgId) throw new Error("No actor or org");
      const result = await actor.submitGstReturn(returnId, orgId);
      if (!result) throw new Error("Return not found");
      return result;
    },
    onSuccess: (_data, returnId) => {
      qc.invalidateQueries({ queryKey: ["gstReturns", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["gstReturn", orgId?.toString(), returnId.toString()],
      });
      toast.success("Return submitted successfully");
    },
    onError: () => {
      toast.error("Failed to submit return");
    },
  });
}

export function useAcknowledgeGstReturn(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (returnId: GstReturnId) => {
      if (!actor || !orgId) throw new Error("No actor or org");
      const result = await actor.acknowledgeGstReturn(returnId, orgId);
      if (!result) throw new Error("Return not found");
      return result;
    },
    onSuccess: (_data, returnId) => {
      qc.invalidateQueries({ queryKey: ["gstReturns", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["gstReturn", orgId?.toString(), returnId.toString()],
      });
      toast.success("Return acknowledged");
    },
    onError: () => {
      toast.error("Failed to acknowledge return");
    },
  });
}
