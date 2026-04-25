import type {
  BillingEntry,
  OrgId,
  OrgRole,
  OrgSubscription,
  PlanTier,
} from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CreditCard,
  ExternalLink,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface BillingTabProps {
  orgId: OrgId;
  myRole: OrgRole;
}

interface PlanDef {
  tier: PlanTier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  highlight: boolean;
  memberLimit: string;
}

const PLANS: PlanDef[] = [
  {
    tier: "free" as PlanTier,
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "For individuals and small teams getting started",
    features: [
      "Contacts & CRM",
      "Basic dashboard",
      "Up to 3 org members",
      "Invoice management",
      "1 year data retention",
    ],
    icon: Star,
    highlight: false,
    memberLimit: "3 members",
  },
  {
    tier: "pro" as PlanTier,
    name: "Pro",
    price: "₹2,499",
    period: "per month",
    description: "For growing businesses with full feature needs",
    features: [
      "Everything in Free",
      "Inventory management",
      "GST portal & filing",
      "Leads management",
      "Bulk import/export",
      "Up to 20 members",
      "Priority support",
    ],
    icon: Zap,
    highlight: true,
    memberLimit: "20 members",
  },
  {
    tier: "enterprise" as PlanTier,
    name: "Enterprise",
    price: "₹9,999",
    period: "per month",
    description: "For large organizations at full scale",
    features: [
      "Everything in Pro",
      "B2B portal integrations",
      "IndiaMART, TradeIndia & more",
      "Live data sync",
      "Unlimited members",
      "Dedicated support",
      "Custom SLA guarantee",
    ],
    icon: Building2,
    highlight: false,
    memberLimit: "Unlimited",
  },
];

const PLAN_RANK: Record<PlanTier, number> = { free: 0, pro: 1, enterprise: 2 };

function formatDate(ts: bigint | undefined): string {
  if (!ts) return "—";
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(cents: bigint, currency: string): string {
  const curr = currency || "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 0,
  }).format(Number(cents) / 100);
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active" || status === "trialing") return "default";
  if (status === "canceled" || status === "pastDue") return "destructive";
  return "secondary";
}

function statusLabel(status: string): string {
  if (status === "pastDue") return "Past Due";
  if (status === "trialing") return "Trial";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function BillingTab({ orgId, myRole }: BillingTabProps) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  const canManageBilling = myRole === ("owner" as OrgRole);

  const subscriptionQuery = useQuery<OrgSubscription | null>({
    queryKey: ["subscription", orgId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubscription(orgId);
    },
    enabled: !!actor,
  });

  const billingHistoryQuery = useQuery<BillingEntry[]>({
    queryKey: ["billingHistory", orgId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBillingHistory(orgId);
    },
    enabled: !!actor,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: PlanTier) => {
      if (!actor) throw new Error("No actor");
      const url = window.location.href;
      const checkoutUrl = await actor.createSubscriptionCheckout(
        orgId,
        plan,
        url,
        url,
      );
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    },
    onError: () => toast.error("Failed to start checkout. Please try again."),
  });

  const changePlanMutation = useMutation({
    mutationFn: async (plan: PlanTier) => {
      if (!actor) throw new Error("No actor");
      await actor.changePlan(orgId, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscription", orgId.toString()],
      });
      toast.success("Plan changed successfully");
    },
    onError: () => toast.error("Failed to change plan"),
  });

  const sub = subscriptionQuery.data;
  const currentPlan = sub?.plan ?? ("free" as PlanTier);

  if (!canManageBilling) {
    return (
      <div className="bg-card border border-border rounded-lg p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <CreditCard className="size-5 text-muted-foreground" />
        </div>
        <p className="font-display font-semibold text-foreground">
          Billing restricted
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Only the organization Owner can manage billing and subscriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Summary */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <h2 className="text-base font-display font-semibold text-foreground">
              Current Subscription
            </h2>
            {subscriptionQuery.isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-52" />
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-display font-bold text-foreground capitalize">
                  {currentPlan}
                </span>
                {sub && (
                  <Badge
                    variant={statusVariant(sub.status)}
                    className="capitalize text-xs"
                  >
                    {statusLabel(sub.status)}
                  </Badge>
                )}
                {sub?.currentPeriodEnd && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Renews {formatDate(sub.currentPeriodEnd)}
                    {sub.cancelAtPeriodEnd && (
                      <span className="text-destructive ml-1">
                        (Cancels at period end)
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
          {sub?.cancelAtPeriodEnd === false && currentPlan !== "free" && (
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
                onClick={() => changePlanMutation.mutate("free" as PlanTier)}
                disabled={changePlanMutation.isPending}
                data-ocid="cancel-plan-btn"
              >
                <AlertTriangle className="size-3.5" />
                {changePlanMutation.isPending ? "Cancelling…" : "Cancel Plan"}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Plan Comparison */}
      <section className="space-y-3">
        <h2 className="text-base font-display font-semibold text-foreground px-0.5">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.tier;
            const isHigher = PLAN_RANK[plan.tier] > PLAN_RANK[currentPlan];

            return (
              <div
                key={plan.tier}
                className={[
                  "bg-card border rounded-xl p-5 flex flex-col gap-4 transition-smooth",
                  isCurrent
                    ? "border-accent shadow-md ring-2 ring-accent/30"
                    : plan.highlight
                      ? "border-accent/40 shadow-md"
                      : "border-border",
                ].join(" ")}
                data-ocid={`plan-card-${plan.tier}`}
              >
                <div className="flex items-start justify-between">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  {isCurrent ? (
                    <Badge className="bg-accent text-accent-foreground text-xs">
                      Current Plan
                    </Badge>
                  ) : plan.highlight && !isCurrent ? (
                    <Badge
                      variant="outline"
                      className="text-xs border-accent/50 text-accent"
                    >
                      Most Popular
                    </Badge>
                  ) : null}
                </div>

                <div>
                  <p className="font-display font-semibold text-foreground">
                    {plan.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-display font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {plan.memberLimit}
                  </p>
                </div>

                <Separator className="bg-border" />

                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-3.5 text-accent mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="size-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : isHigher ? (
                    <Button
                      className="w-full gap-2"
                      variant={plan.highlight ? "default" : "outline"}
                      onClick={() => upgradeMutation.mutate(plan.tier)}
                      disabled={upgradeMutation.isPending}
                      data-ocid={`upgrade-to-${plan.tier}-btn`}
                    >
                      <ExternalLink className="size-4" />
                      {upgradeMutation.isPending
                        ? "Opening checkout…"
                        : `Upgrade to ${plan.name}`}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => changePlanMutation.mutate(plan.tier)}
                      disabled={changePlanMutation.isPending}
                      data-ocid={`downgrade-to-${plan.tier}-btn`}
                    >
                      {changePlanMutation.isPending
                        ? "Changing…"
                        : `Downgrade to ${plan.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing History */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-foreground">
            Billing History
          </h2>
        </div>
        {billingHistoryQuery.isLoading ? (
          <div className="divide-y divide-border">
            {["b1", "b2", "b3"].map((sk) => (
              <div
                key={sk}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !billingHistoryQuery.data?.length ? (
          <div
            className="px-6 py-10 text-center"
            data-ocid="billing-history-empty"
          >
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <CreditCard className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No billing history yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Your invoices will appear here once you upgrade
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {billingHistoryQuery.data.map((entry) => (
              <div
                key={entry.id.toString()}
                className="px-6 py-4 flex items-center justify-between gap-4"
                data-ocid="billing-history-row"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(entry.paidAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatAmount(entry.amount, entry.currency)}
                  </span>
                  <Badge
                    variant="default"
                    className="text-xs bg-accent/15 text-accent border-accent/30 border"
                  >
                    Paid
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
