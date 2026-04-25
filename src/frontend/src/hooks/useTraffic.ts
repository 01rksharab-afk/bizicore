import type { TrafficEvent, TrafficQuery, TrafficSummary } from "@/backend";
import { TrafficSource } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useActiveOrg } from "./useOrg";

export type { TrafficEvent, TrafficQuery, TrafficSummary, TrafficSource };

// ─── Session ID ───────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  const KEY = "biz-session-id";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return "session-unknown";
  }
}

// ─── Source Type Detection ────────────────────────────────────────────────────

function detectSourceType(): TrafficSource {
  try {
    const ref = document.referrer;
    if (!ref) return TrafficSource.direct;
    if (ref.includes(window.location.hostname)) return TrafficSource.internal;
    return TrafficSource.external;
  } catch {
    return TrafficSource.direct;
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTrafficSummary() {
  const { actor, isFetching } = useBackendActor();
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id?.toString() ?? "";
  const enabled = !!actor && !isFetching && !!orgId;

  return useQuery<TrafficSummary>({
    queryKey: ["traffic-summary", orgId],
    queryFn: async () => {
      if (!actor || !orgId) {
        return {
          totalToday: BigInt(0),
          internalToday: BigInt(0),
          externalToday: BigInt(0),
          directToday: BigInt(0),
          topPages: [],
          topReferrers: [],
        };
      }
      const res = await actor.getTrafficSummary(orgId);
      if (res.__kind__ === "ok") return res.ok;
      return {
        totalToday: BigInt(0),
        internalToday: BigInt(0),
        externalToday: BigInt(0),
        directToday: BigInt(0),
        topPages: [],
        topReferrers: [],
      };
    },
    enabled,
    refetchInterval: 60_000,
    staleTime: 45_000,
  });
}

export function useTrafficReport(query: Omit<TrafficQuery, "orgId">) {
  const { actor, isFetching } = useBackendActor();
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id?.toString() ?? "";
  const enabled = !!actor && !isFetching && !!orgId;

  return useQuery<TrafficEvent[]>({
    queryKey: ["traffic-report", orgId, query],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      const res = await actor.queryTrafficReport({ ...query, orgId });
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useLogTraffic() {
  const { actor } = useBackendActor();
  const { activeOrg } = useActiveOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      page,
      referrer,
      sourceType,
      sessionId,
    }: {
      page: string;
      referrer: string;
      sourceType: TrafficSource;
      sessionId: string;
    }) => {
      if (!actor || !activeOrg) return;
      const orgId = activeOrg.id.toString();
      await actor.logTraffic(orgId, page, referrer, sourceType, sessionId);
    },
    onSuccess: () => {
      const orgId = activeOrg?.id?.toString() ?? "";
      queryClient.invalidateQueries({ queryKey: ["traffic-summary", orgId] });
      queryClient.invalidateQueries({ queryKey: ["traffic-report", orgId] });
    },
  });
}

export function useDeleteTraffic() {
  const { actor } = useBackendActor();
  const { activeOrg } = useActiveOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!actor || !activeOrg) throw new Error("Not connected");
      const orgId = activeOrg.id.toString();
      await actor.deleteTrafficEvents(orgId, ids);
    },
    onSuccess: () => {
      const orgId = activeOrg?.id?.toString() ?? "";
      queryClient.invalidateQueries({ queryKey: ["traffic-summary", orgId] });
      queryClient.invalidateQueries({ queryKey: ["traffic-report", orgId] });
      toast.success("Traffic events deleted");
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to delete traffic events");
    },
  });
}

// ─── Auto-capture hook ────────────────────────────────────────────────────────

export function useTrafficCapture() {
  const logTraffic = useLogTraffic();
  const mutate = logTraffic.mutate;
  const pathname = window.location.pathname;

  useEffect(() => {
    const page = pathname + window.location.search;
    const referrer = document.referrer;
    const sourceType = detectSourceType();
    const sessionId = getOrCreateSessionId();

    mutate({ page, referrer, sourceType, sessionId });
  }, [pathname, mutate]);
}
