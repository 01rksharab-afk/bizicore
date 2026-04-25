import type { backendInterface } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getOrgId(): bigint {
  return BigInt(sessionStorage.getItem("activeOrgId") ?? "0");
}

export function useIncentiveSchemes() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["incentiveSchemes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listIncentiveSchemes(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateIncentiveScheme() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createIncentiveScheme"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createIncentiveScheme(
        getOrgId(),
        input,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incentiveSchemes"] });
      toast.success("Incentive scheme created");
    },
    onError: () => toast.error("Failed to create incentive scheme"),
  });
}

export function useUpdateIncentiveScheme() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateIncentiveScheme"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateIncentiveScheme(
        getOrgId(),
        input,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incentiveSchemes"] });
      toast.success("Incentive scheme updated");
    },
    onError: () => toast.error("Failed to update incentive scheme"),
  });
}

export function useDeleteIncentiveScheme() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteIncentiveScheme(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incentiveSchemes"] });
      toast.success("Incentive scheme deleted");
    },
    onError: () => toast.error("Failed to delete incentive scheme"),
  });
}
