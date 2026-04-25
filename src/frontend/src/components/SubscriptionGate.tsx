import type { OrgId, OrgSubscription, PlanTier } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type RequiredPlan = "pro" | "enterprise";

const PLAN_RANK: Record<PlanTier, number> = { free: 0, pro: 1, enterprise: 2 };
const REQUIRED_RANK: Record<RequiredPlan, number> = { pro: 1, enterprise: 2 };

const PLAN_LABEL: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

function useOrgSubscription(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<OrgSubscription | null>({
    queryKey: ["subscription", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return actor.getSubscription(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

interface SubscriptionGateProps {
  requiredPlan: RequiredPlan;
  children: ReactNode;
  feature?: string;
}

export function SubscriptionGate({
  requiredPlan,
  children,
  feature,
}: SubscriptionGateProps) {
  const { activeOrg } = useActiveOrg();
  const { data: subscription, isLoading } = useOrgSubscription(
    activeOrg?.id ?? null,
  );

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? ("free" as PlanTier);
  const isActive =
    !subscription ||
    subscription.status === "active" ||
    subscription.status === "trialing";
  const hasAccess =
    isActive && PLAN_RANK[currentPlan] >= REQUIRED_RANK[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  const planLabel = requiredPlan === "pro" ? "Pro" : "Enterprise";
  const currentPlanLabel = PLAN_LABEL[currentPlan];

  return (
    <div
      className="flex items-center justify-center min-h-[320px] p-6"
      data-ocid="subscription-gate"
    >
      <Card className="max-w-md w-full border-accent/40 bg-card shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 size-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Lock className="size-6 text-accent" />
          </div>
          <CardTitle className="font-display text-xl text-foreground">
            {planLabel} Plan Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature
              ? `"${feature}" requires the `
              : "This feature requires the "}
            <Badge
              variant="outline"
              className="border-accent/60 text-accent font-semibold mx-1 py-0.5"
            >
              <Sparkles className="size-3 mr-1" />
              {planLabel}
            </Badge>
            plan or above.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            <span>You're on</span>
            <Badge
              variant="secondary"
              className="text-xs capitalize font-medium"
            >
              {currentPlanLabel}
            </Badge>
          </div>

          <div className="pt-1">
            <Button asChild className="w-full gap-2" data-ocid="upgrade-cta">
              <Link to="/settings" search={{ tab: "billing" }}>
                <Sparkles className="size-4" />
                Upgrade to {planLabel}
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground/70 mt-3">
              Upgrade from Settings → Billing tab
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionGate;
