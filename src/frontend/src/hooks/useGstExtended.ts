import type { CreateRefundRequestInput, GstRefundRequest } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Locally-defined stub types for removed backend functions
export type Gstr2aEntry = { period: string };
export type Gstr9Entry = {
  period: string;
  outwardSupplies: number;
  inwardSupplies: number;
  taxPayable: number;
  taxPaid: number;
  itcClaimed: number;
};
export type EwayAuditReport = {
  id: bigint;
  orgId: bigint;
  period: string;
  totalEwayBills: bigint;
  expiredBills: bigint;
  pendingBills: bigint;
  ewayBills: unknown[];
};

// ─── Query Keys ───────────────────────────────────────────────────────────────
const gstExtKeys = {
  gstr2a: (orgId: bigint, period: string) =>
    ["gst", "gstr2a", orgId.toString(), period] as const,
  gstr9: (orgId: bigint, year: bigint) =>
    ["gst", "gstr9", orgId.toString(), year.toString()] as const,
  refunds: (orgId: bigint) => ["gst", "refunds", orgId.toString()] as const,
  ewayAudit: (orgId: bigint, period: string) =>
    ["gst", "eway-audit", orgId.toString(), period] as const,
};

// ─── GSTR-2A (stub — removed from backend to reduce wasm size) ───────────────

export function useGstr2a(_orgId: bigint | undefined, _period: string) {
  return useQuery<Gstr2aEntry[]>({
    queryKey: ["gst-gstr2a-stub"],
    queryFn: async () => [],
  });
}

// ─── GSTR-9 (stub — removed from backend to reduce wasm size) ────────────────

export function useGstr9(
  _orgId: bigint | undefined,
  _year: bigint | undefined,
) {
  return useQuery<Gstr9Entry | null>({
    queryKey: ["gst-gstr9-stub"],
    queryFn: async () => null,
  });
}

// ─── Refund Requests ─────────────────────────────────────────────────────────

export function useRefundRequests(orgId: bigint | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<GstRefundRequest[]>({
    queryKey: gstExtKeys.refunds(orgId ?? 0n),
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listRefundRequests(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useCreateRefundRequest() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<GstRefundRequest, Error, CreateRefundRequestInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createRefundRequest(input);
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: gstExtKeys.refunds(input.orgId) });
    },
  });
}

export function useUpdateRefundRequest() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<
    GstRefundRequest | null,
    Error,
    { orgId: bigint; id: bigint; status: string }
  >({
    mutationFn: async ({ orgId, id, status }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateRefundRequest(orgId, id, status);
    },
    onSuccess: (_data, { orgId }) => {
      qc.invalidateQueries({ queryKey: gstExtKeys.refunds(orgId) });
    },
  });
}

// ─── E-way Audit Report (stub — removed from backend to reduce wasm size) ─────

export function useEwayAuditReport(
  _orgId: bigint | undefined,
  _period: string,
) {
  return useQuery<EwayAuditReport | null>({
    queryKey: ["gst-eway-audit-stub"],
    queryFn: async () => null,
  });
}
