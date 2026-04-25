import type { OrgId, OrgSummary } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ACTIVE_ORG_KEY = "bizcore_active_org";
const ORG_LOAD_TIMEOUT_MS = 15_000;

export function useOrgs() {
  const { actor, isFetching } = useBackendActor();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery<OrgSummary[]>({
    queryKey: ["orgs"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listMyOrgs();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load organizations";
        console.error("[BizCore] useOrgs error:", e);
        toast.error(msg);
        throw e instanceof Error ? e : new Error(msg);
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    retry: 3,
  });

  // Start a 15-second timeout whenever loading begins; surface as a real Error
  useEffect(() => {
    if (query.isLoading) {
      setIsTimedOut(false);
      timerRef.current = setTimeout(() => {
        if (!query.data) {
          setIsTimedOut(true);
          // Expose the timeout as a query error so callers can react
          console.error("[BizCore] useOrgs timed out after 15s");
        }
      }, ORG_LOAD_TIMEOUT_MS);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsTimedOut(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query.isLoading, query.data]);

  // Merge timeout into an error the UI can display
  const timeoutError = isTimedOut
    ? new Error("Loading timed out. Please refresh the page.")
    : null;
  const error = timeoutError ?? query.error;

  return { ...query, isTimedOut, error };
}

export function useInvalidateOrgs() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["orgs"] });
}

export function useActiveOrg() {
  const { data: orgs = [], isLoading, isError } = useOrgs();
  const [activeOrgId, setActiveOrgIdState] = useState<OrgId | null>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_ORG_KEY);
      return stored ? BigInt(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (orgs.length > 0 && !activeOrgId) {
      const first = orgs[0];
      setActiveOrgIdState(first.id);
      try {
        localStorage.setItem(ACTIVE_ORG_KEY, first.id.toString());
      } catch {
        // localStorage unavailable — ignore
      }
    }
  }, [orgs, activeOrgId]);

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0] ?? null;

  const setActiveOrg = (org: OrgSummary) => {
    setActiveOrgIdState(org.id);
    try {
      localStorage.setItem(ACTIVE_ORG_KEY, org.id.toString());
    } catch {
      // localStorage unavailable — ignore
    }
  };

  return { activeOrg, orgs, setActiveOrg, isLoading, isError };
}
