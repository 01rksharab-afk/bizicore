import { InvoiceStatus, type InvoiceView } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Hash,
  Send,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StatusPill({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { label: string; classes: string }> = {
    [InvoiceStatus.draft]: {
      label: "Draft",
      classes: "bg-muted text-muted-foreground",
    },
    [InvoiceStatus.sent]: {
      label: "Sent",
      classes: "bg-primary/15 text-primary",
    },
    [InvoiceStatus.paid]: {
      label: "Paid",
      classes: "bg-accent/15 text-accent",
    },
    [InvoiceStatus.overdue]: {
      label: "Overdue",
      classes: "bg-destructive/15 text-destructive",
    },
    [InvoiceStatus.voided]: {
      label: "Voided",
      classes: "bg-muted text-muted-foreground opacity-60",
    },
  };
  const cfg = map[status] ?? map[InvoiceStatus.draft];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-medium mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams({ strict: false }) as { invoiceId: string };
  const { activeOrg } = useActiveOrg();
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const id = BigInt(invoiceId ?? "0");

  const invoiceQuery = useQuery<InvoiceView | null>({
    queryKey: ["invoice", activeOrg?.id, id],
    queryFn: async () => {
      if (!actor || !activeOrg) return null;
      return actor.getInvoice(activeOrg.id, id);
    },
    enabled: !!actor && !!activeOrg && !!invoiceId,
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !activeOrg) throw new Error("No actor");
      return actor.markInvoicePaid(activeOrg.id, id);
    },
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      queryClient.invalidateQueries({
        queryKey: ["invoice", activeOrg?.id, id],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toast.error("Failed to update invoice"),
  });

  const voidMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !activeOrg) throw new Error("No actor");
      return actor.voidInvoice(activeOrg.id, id);
    },
    onSuccess: () => {
      toast.success("Invoice voided");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate({ to: "/invoicing" });
    },
    onError: () => toast.error("Failed to void invoice"),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !activeOrg) throw new Error("No actor");
      const origin = window.location.origin;
      return actor.sendInvoice(
        activeOrg.id,
        id,
        `${origin}/invoicing`,
        `${origin}/invoicing`,
      );
    },
    onSuccess: (url) => {
      toast.success("Invoice sent with payment link");
      if (url) window.open(url, "_blank", "noopener");
      queryClient.invalidateQueries({
        queryKey: ["invoice", activeOrg?.id, id],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toast.error("Failed to send invoice"),
  });

  const inv = invoiceQuery.data;

  if (invoiceQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {["sk0", "sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
            <Skeleton key={k} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!inv) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-4"
        data-ocid="invoice-not-found"
      >
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link to="/invoicing">
          <Button variant="outline" size="sm">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = inv.lineItems.reduce(
    (sum, li) => sum + Number(li.rateInCents) * li.quantity,
    0,
  );
  const taxAmount = subtotal * (inv.taxPercent / 100);
  const total = subtotal + taxAmount;

  const canSend = inv.status === InvoiceStatus.draft;
  const canPay =
    inv.status === InvoiceStatus.sent || inv.status === InvoiceStatus.overdue;
  const canVoid =
    inv.status !== InvoiceStatus.voided && inv.status !== InvoiceStatus.paid;

  return (
    <div className="space-y-6 max-w-4xl" data-ocid="invoice-detail-page">
      <Breadcrumb
        items={[
          { label: "Invoicing", href: "/invoicing" },
          { label: inv.invoiceNumber },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/invoicing">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-semibold text-foreground">
                {inv.invoiceNumber}
              </h1>
              <StatusPill status={inv.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {formatDate(inv.createdAt)} · Due{" "}
              {formatDate(inv.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" data-ocid="invoice-actions">
          {canSend && (
            <Button
              size="sm"
              disabled={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
              data-ocid="send-invoice-btn"
            >
              <Send className="size-4 mr-2" />
              {sendMutation.isPending ? "Sending…" : "Send Invoice"}
            </Button>
          )}
          {canPay && (
            <Button
              variant="outline"
              size="sm"
              disabled={markPaidMutation.isPending}
              onClick={() => markPaidMutation.mutate()}
              data-ocid="mark-paid-btn"
            >
              <CheckCircle className="size-4 mr-2" />
              {markPaidMutation.isPending ? "Saving…" : "Mark Paid"}
            </Button>
          )}
          {canVoid && (
            <Button
              variant="outline"
              size="sm"
              disabled={voidMutation.isPending}
              onClick={() => voidMutation.mutate()}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              data-ocid="void-invoice-btn"
            >
              <XCircle className="size-4 mr-2" />
              {voidMutation.isPending ? "Voiding…" : "Void"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main invoice content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">
                Line Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-16">
                      Qty
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                      Rate
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lineItems.map((li, idx) => (
                    <tr
                      key={`li-${li.description}-${idx}`}
                      className="border-b border-border/40"
                    >
                      <td className="px-5 py-3 text-foreground">
                        {li.description}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {li.quantity}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                        {formatCents(Number(li.rateInCents))}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-medium text-foreground">
                        {formatCents(Number(li.rateInCents) * li.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td
                      colSpan={3}
                      className="px-5 py-2.5 text-right text-xs text-muted-foreground"
                    >
                      Subtotal
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-sm text-foreground">
                      {formatCents(subtotal)}
                    </td>
                  </tr>
                  {inv.taxPercent > 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-2.5 text-right text-xs text-muted-foreground"
                      >
                        Tax ({inv.taxPercent}%)
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-sm text-foreground">
                        {formatCents(taxAmount)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-border bg-muted/20">
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-right font-medium text-foreground"
                    >
                      Total
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-foreground text-base">
                      {formatCents(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {inv.notes && (
              <div className="px-5 py-4 border-t border-border bg-muted/10">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{inv.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Bill To</h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={inv.billTo.name} />
              <InfoRow icon={Hash} label="Email" value={inv.billTo.email} />
              {inv.billTo.address && (
                <InfoRow
                  icon={Building2}
                  label="Address"
                  value={inv.billTo.address}
                />
              )}
              {inv.billTo.taxId && (
                <InfoRow icon={Hash} label="Tax ID" value={inv.billTo.taxId} />
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Invoice Details
            </h3>
            <div className="space-y-3">
              <InfoRow
                icon={Hash}
                label="Invoice Number"
                value={inv.invoiceNumber}
              />
              <InfoRow
                icon={Calendar}
                label="Created"
                value={formatDate(inv.createdAt)}
              />
              <InfoRow
                icon={Calendar}
                label="Due Date"
                value={formatDate(inv.dueDate)}
              />
              {inv.sentAt && (
                <InfoRow
                  icon={Send}
                  label="Sent"
                  value={formatDate(inv.sentAt)}
                />
              )}
              {inv.paidAt && (
                <InfoRow
                  icon={CheckCircle}
                  label="Paid"
                  value={formatDate(inv.paidAt)}
                />
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground">From</h3>
            <p className="text-sm text-foreground font-medium">
              {inv.orgInfo.name}
            </p>
            {inv.orgInfo.address && (
              <p className="text-xs text-muted-foreground">
                {inv.orgInfo.address}
              </p>
            )}
            {inv.orgInfo.taxId && (
              <p className="text-xs text-muted-foreground">
                Tax ID: {inv.orgInfo.taxId}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />
    </div>
  );
}
