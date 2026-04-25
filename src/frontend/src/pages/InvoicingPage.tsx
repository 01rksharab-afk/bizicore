import { InvoiceStatus, type InvoiceView } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AgingReport } from "@/components/invoicing/AgingReport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  PlusCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function statusConfig(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.paid:
      return {
        label: "Paid",
        icon: CheckCircle,
        color: "text-accent bg-accent/10",
      };
    case InvoiceStatus.sent:
      return { label: "Sent", icon: Send, color: "text-primary bg-primary/10" };
    case InvoiceStatus.overdue:
      return {
        label: "Overdue",
        icon: AlertTriangle,
        color: "text-destructive bg-destructive/10",
      };
    case InvoiceStatus.draft:
      return {
        label: "Draft",
        icon: FileText,
        color: "text-muted-foreground bg-muted",
      };
    case InvoiceStatus.voided:
      return {
        label: "Voided",
        icon: Clock,
        color: "text-muted-foreground bg-muted/50 line-through",
      };
    default:
      return {
        label: status,
        icon: FileText,
        color: "text-muted-foreground bg-muted",
      };
  }
}

function invoiceTotal(inv: InvoiceView): number {
  const subtotal = inv.lineItems.reduce(
    (sum, li) => sum + Number(li.rateInCents) * li.quantity,
    0,
  );
  return subtotal * (1 + inv.taxPercent / 100);
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicingPage() {
  const { activeOrg } = useActiveOrg();
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState<bigint | null>(null);

  const invoicesQuery = useQuery<InvoiceView[]>({
    queryKey: ["invoices", activeOrg?.id],
    queryFn: async () => {
      if (!actor || !activeOrg) return [];
      return actor.listInvoices(activeOrg.id);
    },
    enabled: !!actor && !!activeOrg,
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !activeOrg) throw new Error("No actor");
      return actor.markInvoicePaid(activeOrg.id, id);
    },
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toast.error("Failed to update invoice"),
  });

  const sendMutation = useMutation({
    mutationFn: async (id: bigint) => {
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
      toast.success("Invoice sent! Payment link created.");
      if (url) window.open(url, "_blank", "noopener");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setSendingId(null);
    },
    onError: () => {
      toast.error("Failed to send invoice");
      setSendingId(null);
    },
  });

  const invoices = invoicesQuery.data ?? [];
  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === InvoiceStatus.draft).length,
    sent: invoices.filter((i) => i.status === InvoiceStatus.sent).length,
    overdue: invoices.filter((i) => i.status === InvoiceStatus.overdue).length,
    paid: invoices.filter((i) => i.status === InvoiceStatus.paid).length,
  };

  return (
    <div className="space-y-6" data-ocid="invoicing-page">
      <Breadcrumb items={[{ label: "Invoicing" }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.total} total · {stats.overdue} overdue · {stats.sent} pending
            payment
          </p>
        </div>
        <Link to="/invoicing/new">
          <Button size="sm" data-ocid="create-invoice-btn">
            <PlusCircle className="size-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Status summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Draft",
            count: stats.draft,
            color: "text-muted-foreground",
          },
          { label: "Sent", count: stats.sent, color: "text-primary" },
          { label: "Overdue", count: stats.overdue, color: "text-destructive" },
          { label: "Paid", count: stats.paid, color: "text-accent" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-lg p-4 text-center"
          >
            <p className={`text-2xl font-display font-semibold ${s.color}`}>
              {s.count}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div
        className="bg-card border border-border rounded-lg overflow-hidden"
        data-ocid="invoice-list"
      >
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">All Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Invoice #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                  Due Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                  Amount
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoicesQuery.isLoading ? (
                ["s0", "s1", "s2", "s3"].map((rk) => (
                  <tr key={rk} className="border-b border-border/50">
                    {["c0", "c1", "c2", "c3", "c4", "c5"].map((ck) => (
                      <td key={`${rk}-${ck}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center"
                    data-ocid="invoices-empty-state"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        No invoices yet.
                      </p>
                      <Link to="/invoicing/new">
                        <Button size="sm" variant="outline">
                          Create your first invoice
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const cfg = statusConfig(inv.status);
                  const StatusIcon = cfg.icon;
                  const total = invoiceTotal(inv);
                  const canSend = inv.status === InvoiceStatus.draft;
                  const canPay =
                    inv.status === InvoiceStatus.sent ||
                    inv.status === InvoiceStatus.overdue;
                  return (
                    <tr
                      key={inv.id.toString()}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors duration-100"
                      data-ocid="invoice-row"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/invoicing/$invoiceId"
                          params={{ invoiceId: inv.id.toString() }}
                          className="font-mono text-xs text-primary hover:underline"
                          data-ocid="invoice-number-link"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground max-w-xs truncate">
                        {inv.billTo.name}
                        {inv.billTo.email && (
                          <span className="text-muted-foreground text-xs ml-1.5">
                            {inv.billTo.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-foreground">
                        {formatCents(total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}
                        >
                          <StatusIcon className="size-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canSend && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={
                                sendMutation.isPending && sendingId === inv.id
                              }
                              onClick={() => {
                                setSendingId(inv.id);
                                sendMutation.mutate(inv.id);
                              }}
                              data-ocid="send-invoice-btn"
                            >
                              <Send className="size-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {canPay && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={markPaidMutation.isPending}
                              onClick={() => markPaidMutation.mutate(inv.id)}
                              data-ocid="mark-paid-btn"
                            >
                              <CheckCircle className="size-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          <Link
                            to="/invoicing/$invoiceId"
                            params={{ invoiceId: inv.id.toString() }}
                            data-ocid="view-invoice-btn"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging Report */}
      <AgingReport orgId={activeOrg?.id ?? null} />
    </div>
  );
}
