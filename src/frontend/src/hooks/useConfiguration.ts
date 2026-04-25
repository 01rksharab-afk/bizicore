import type { backendInterface } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getOrgId(): bigint {
  return BigInt(sessionStorage.getItem("activeOrgId") ?? "0");
}

export function useOrgConfig() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["orgConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as backendInterface).getOrgConfiguration(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOrgConfig() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateOrgConfiguration"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateOrgConfiguration(
        getOrgId(),
        input,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgConfig"] });
      toast.success("Configuration saved");
    },
    onError: () => toast.error("Failed to save configuration"),
  });
}
