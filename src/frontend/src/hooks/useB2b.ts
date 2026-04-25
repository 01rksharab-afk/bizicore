import type {
  OrgId,
  PortalApiKeyInfo,
  PortalType,
  SyncRecord,
  SyncResult,
} from "@/backend";
import { PortalType as PortalTypeEnum } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ALL_PORTAL_TYPES: PortalType[] = [
  PortalTypeEnum.indiamart,
  PortalTypeEnum.tradeindia,
  PortalTypeEnum.exportindia,
  PortalTypeEnum.justdial,
  PortalTypeEnum.globallinker,
];

export function usePortalKeys(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PortalApiKeyInfo[]>({
    queryKey: ["portalKeys", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.getPortalApiKeys(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useSavePortalKey(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      portal,
      apiKey,
    }: { portal: PortalType; apiKey: string }) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.savePortalApiKey(orgId, portal, apiKey);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portalKeys", orgId?.toString()] });
      toast.success("API key saved successfully");
    },
    onError: () => {
      toast.error("Failed to save API key");
    },
  });
}

export function useSyncPortal(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<SyncResult, Error, PortalType>({
    mutationFn: async (portal: PortalType) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      return actor.syncPortalLeads(orgId, portal);
    },
    onSuccess: (data, portal) => {
      qc.invalidateQueries({ queryKey: ["portalKeys", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["portalSyncHistory", orgId?.toString(), portal],
      });
      qc.invalidateQueries({
        queryKey: ["portalSyncHistoryAll", orgId?.toString()],
      });
      qc.invalidateQueries({ queryKey: ["leads", orgId?.toString()] });
      toast.success(
        `Synced ${data.newLeads.toString()} new lead${data.newLeads === BigInt(1) ? "" : "s"} from portal`,
      );
    },
    onError: () => {
      toast.error("Sync failed. Please check your API key and try again.");
    },
  });
}

export function usePortalSyncHistory(
  orgId: OrgId | null,
  portal: PortalType | null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<SyncRecord[]>({
    queryKey: ["portalSyncHistory", orgId?.toString(), portal],
    queryFn: async () => {
      if (!actor || !orgId || !portal) return [];
      return actor.listPortalSyncHistory(orgId, portal);
    },
    enabled: !!actor && !isFetching && !!orgId && !!portal,
  });
}

/**
 * Fetches sync history for ALL portals in parallel and merges the results.
 * Used for the "All" view in the Sync History section.
 */
export function useAllPortalSyncHistory(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<SyncRecord[]>({
    queryKey: ["portalSyncHistoryAll", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      const results = await Promise.allSettled(
        ALL_PORTAL_TYPES.map((p) => actor.listPortalSyncHistory(orgId, p)),
      );
      return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}
