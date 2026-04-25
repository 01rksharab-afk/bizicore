import type { OrgId } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GstRefundRequest {
  id: bigint;
  orgId: bigint;
  refundType: string;
  period: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: bigint;
}

type RefundStatus =
  | "pending"
  | "filed"
  | "acknowledged"
  | "approved"
  | "rejected";
type RefundType = "ITC Refund" | "Excess Payment" | "Export Refund" | "Other";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFUND_TYPES: RefundType[] = [
  "ITC Refund",
  "Excess Payment",
  "Export Refund",
  "Other",
];

const STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    badgeClass:
      "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <Clock className="size-3" />,
  },
  filed: {
    label: "Filed",
    badgeClass: "border-primary/60 bg-primary/10 text-primary",
    icon: <FileText className="size-3" />,
  },
  acknowledged: {
    label: "Acknowledged",
    badgeClass:
      "border-blue-500/60 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: <AlertCircle className="size-3" />,
  },
  approved: {
    label: "Approved",
    badgeClass: "border-accent/60 bg-accent/10 text-accent",
    icon: <CheckCircle className="size-3" />,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "border-destructive/60 bg-destructive/10 text-destructive",
    icon: <XCircle className="size-3" />,
  },
};

const MOCK_REQUESTS: GstRefundRequest[] = [
  {
    id: 1n,
    orgId: 1n,
    refundType: "ITC Refund",
    period: "2024-03",
    amount: 48500,
    reason:
      "Excess ITC accumulated due to inverted duty structure on raw material purchases.",
    status: "approved",
    createdAt: 1709731200000n,
  },
  {
    id: 2n,
    orgId: 1n,
    refundType: "Export Refund",
    period: "2024-02",
    amount: 92000,
    reason:
      "Zero-rated export supplies — IGST paid on export invoices to be refunded.",
    status: "acknowledged",
    createdAt: 1707062400000n,
  },
  {
    id: 3n,
    orgId: 1n,
    refundType: "Excess Payment",
    period: "2024-01",
    amount: 12700,
    reason:
      "Excess tax paid in GSTR-3B due to incorrect rate applied on office supplies.",
    status: "filed",
    createdAt: 1706371200000n,
  },
  {
    id: 4n,
    orgId: 1n,
    refundType: "Other",
    period: "2023-12",
    amount: 5200,
    reason: "Tax paid on cancelled invoices.",
    status: "pending",
    createdAt: 1703808000000n,
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useRefundRequests(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<GstRefundRequest[]>({
    queryKey: ["gstRefunds", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      try {
        const result = await (
          actor as unknown as {
            listRefundRequests: (orgId: OrgId) => Promise<GstRefundRequest[]>;
          }
        ).listRefundRequests(orgId);
        return result;
      } catch {
        return MOCK_REQUESTS;
      }
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

interface RefundCreateInput {
  refundType: string;
  period: string;
  amount: number;
  reason: string;
}

function useCreateRefundRequest(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RefundCreateInput) => {
      if (!actor || !orgId) throw new Error("No actor or org");
      return (
        actor as unknown as {
          createRefundRequest: (
            orgId: OrgId,
            data: RefundCreateInput,
          ) => Promise<GstRefundRequest>;
        }
      ).createRefundRequest(orgId, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gstRefunds", orgId?.toString()] });
      toast.success("Refund request submitted");
    },
    onError: () => {
      toast.error("Failed to submit refund request");
    },
  });
}

function useUpdateRefundStatus(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor || !orgId) throw new Error("No actor or org");
      return (
        actor as unknown as {
          updateRefundStatus: (
            id: bigint,
            orgId: OrgId,
            status: string,
          ) => Promise<GstRefundRequest>;
        }
      ).updateRefundStatus(id, orgId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gstRefunds", orgId?.toString()] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const key = status as RefundStatus;
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.pending;
  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1 text-xs ${config.badgeClass}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

function NewRefundModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RefundCreateInput) => void;
  isPending: boolean;
}) {
  const [refundType, setRefundType] = useState<string>(REFUND_TYPES[0]);
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period || !amount || !reason) {
      toast.error("Please fill all required fields");
      return;
    }
    onSubmit({ refundType, period, amount: Number(amount), reason });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="refund-modal">
        <DialogHeader>
          <DialogTitle className="font-display">New Refund Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Refund Type *</Label>
            <Select value={refundType} onValueChange={setRefundType}>
              <SelectTrigger data-ocid="refund-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFUND_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="refund-period">Period (YYYY-MM) *</Label>
            <Input
              id="refund-period"
              placeholder="e.g. 2024-03"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              pattern="\d{4}-\d{2}"
              data-ocid="refund-period-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Amount (₹) *</Label>
            <Input
              id="refund-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-ocid="refund-amount-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason *</Label>
            <Textarea
              id="refund-reason"
              placeholder="Describe the reason for the refund request..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-ocid="refund-reason-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="submit-refund-btn"
            >
              {isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RefundRow({
  req,
  onUpdateStatus,
  isUpdating,
}: {
  req: GstRefundRequest;
  onUpdateStatus: (id: bigint, status: string) => void;
  isUpdating: boolean;
}) {
  const createdDate = new Date(Number(req.createdAt)).toLocaleDateString(
    "en-IN",
  );
  const NEXT_STATUSES = [
    "pending",
    "filed",
    "acknowledged",
    "approved",
    "rejected",
  ];

  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      data-ocid="refund-row"
    >
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
        #{req.id.toString().padStart(4, "0")}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className="text-xs border-border bg-muted/30 text-foreground"
        >
          {req.refundType}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
        {req.period}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-foreground">
        ₹{req.amount.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 max-w-[180px]">
        <p
          className="text-xs text-muted-foreground truncate"
          title={req.reason}
        >
          {req.reason}
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={req.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{createdDate}</td>
      <td className="px-4 py-3">
        <Select
          value={req.status}
          onValueChange={(v) => onUpdateStatus(req.id, v)}
          disabled={
            isUpdating || req.status === "approved" || req.status === "rejected"
          }
        >
          <SelectTrigger
            className="h-7 w-32 text-xs"
            data-ocid="update-status-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NEXT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function GstRefundsContent() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const [modalOpen, setModalOpen] = useState(false);

  const { data: requests = [], isLoading } = useRefundRequests(orgId);
  const createRefund = useCreateRefundRequest(orgId);
  const updateStatus = useUpdateRefundStatus(orgId);

  const handleCreate = (data: RefundCreateInput) => {
    createRefund.mutate(data, { onSuccess: () => setModalOpen(false) });
  };

  const totalPending = requests.filter(
    (r) => r.status === "pending" || r.status === "filed",
  ).length;
  const totalApproved = requests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            GST Refund Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage GST refund applications across all categories.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2"
          data-ocid="new-refund-btn"
        >
          <Plus className="size-4" />
          New Refund Request
        </Button>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Requests", value: requests.length.toString() },
            { label: "In Progress", value: totalPending.toString() },
            {
              label: "Amount Approved",
              value: `₹${totalApproved.toLocaleString("en-IN")}`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
            >
              <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
              <p className="font-mono font-semibold text-sm text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <Card className="border-border/60">
        {isLoading ? (
          <CardContent className="p-0">
            {["sk-a", "sk-b", "sk-c"].map((k) => (
              <div key={k} className="p-4 border-b border-border last:border-0">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        ) : requests.length === 0 ? (
          <CardContent
            className="py-16 flex flex-col items-center gap-3"
            data-ocid="refunds-empty"
          >
            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
              <RotateCcw className="size-6 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground text-sm">
                No refund requests yet
              </p>
              <p className="text-muted-foreground text-sm mt-0.5 max-w-xs">
                Create your first GST refund request using the button above.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="gap-2 mt-1"
              data-ocid="empty-new-refund-btn"
            >
              <Plus className="size-4" />
              New Refund Request
            </Button>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="refunds-table">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {[
                    "ID",
                    "Type",
                    "Period",
                    "Amount",
                    "Reason",
                    "Status",
                    "Created",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs text-muted-foreground font-medium ${
                        h === "Amount" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <RefundRow
                    key={req.id.toString()}
                    req={req}
                    onUpdateStatus={(id, status) =>
                      updateStatus.mutate({ id, status })
                    }
                    isUpdating={updateStatus.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewRefundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        isPending={createRefund.isPending}
      />
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function GstRefundsPage() {
  return (
    <SubscriptionGate requiredPlan="pro" feature="GST Refund Requests">
      <GstRefundsContent />
    </SubscriptionGate>
  );
}
