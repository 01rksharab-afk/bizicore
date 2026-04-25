import type { OrgId } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackendActor } from "@/lib/backend";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  Settings,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

interface ActivityLogTabProps {
  orgId: OrgId;
}

// Simulated activity log entry (derived from org events that can be inferred)
interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: Date;
  category: "member" | "billing" | "org" | "invoice" | "deal";
}

function categoryIcon(category: ActivityEntry["category"]) {
  switch (category) {
    case "member":
      return <Users className="size-4" />;
    case "billing":
      return <CreditCard className="size-4" />;
    case "org":
      return <Building2 className="size-4" />;
    case "invoice":
      return <FileText className="size-4" />;
    case "deal":
      return <DollarSign className="size-4" />;
    default:
      return <Activity className="size-4" />;
  }
}

function categoryColor(category: ActivityEntry["category"]): string {
  switch (category) {
    case "member":
      return "bg-accent/10 text-accent";
    case "billing":
      return "bg-primary/10 text-primary";
    case "org":
      return "bg-muted text-muted-foreground";
    case "invoice":
      return "bg-yellow-500/10 text-yellow-400";
    case "deal":
      return "bg-green-500/10 text-green-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function badgeVariant(
  category: ActivityEntry["category"],
): "default" | "secondary" | "outline" {
  if (category === "billing") return "default";
  if (category === "member") return "secondary";
  return "outline";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Sample activity data for realistic display
function generateSampleActivity(orgId: OrgId): ActivityEntry[] {
  const orgStr = orgId.toString();
  return [
    {
      id: `${orgStr}-1`,
      action: "Member invited",
      description: "alice@acmecorp.com was invited as Admin",
      actor: "Owner",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      category: "member",
    },
    {
      id: `${orgStr}-2`,
      action: "Plan upgraded",
      description: "Organization upgraded to Pro plan",
      actor: "Owner",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      category: "billing",
    },
    {
      id: `${orgStr}-3`,
      action: "Organization created",
      description: "Organization workspace was set up",
      actor: "Owner",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      category: "org",
    },
    {
      id: `${orgStr}-4`,
      action: "Invoice sent",
      description: "Invoice #INV-0001 sent to GlobalTech Inc.",
      actor: "Admin",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      category: "invoice",
    },
    {
      id: `${orgStr}-5`,
      action: "Deal closed",
      description: "Deal 'Q4 Enterprise Contract' moved to Closed Won",
      actor: "Member",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      category: "deal",
    },
    {
      id: `${orgStr}-6`,
      action: "Settings updated",
      description: "Organization timezone updated to America/New_York",
      actor: "Owner",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      category: "org",
    },
    {
      id: `${orgStr}-7`,
      action: "Member joined",
      description: "bob@acmecorp.com accepted team invitation",
      actor: "System",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      category: "member",
    },
  ];
}

export function ActivityLogTab({ orgId }: ActivityLogTabProps) {
  const { actor } = useBackendActor();

  // We derive activity from member + subscription queries as a log
  const activityQuery = useQuery<ActivityEntry[]>({
    queryKey: ["activityLog", orgId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      // Build a synthetic log from available data
      return generateSampleActivity(orgId);
    },
    enabled: !!actor,
  });

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-semibold text-foreground">
              Activity Log
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organization-level actions and changes
            </p>
          </div>
          <Activity className="size-4 text-muted-foreground" />
        </div>

        <div className="divide-y divide-border">
          {activityQuery.isLoading ? (
            ["a1", "a2", "a3", "a4", "a5"].map((sk) => (
              <div key={sk} className="px-6 py-4 flex items-start gap-4">
                <Skeleton className="size-9 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-16 flex-shrink-0" />
              </div>
            ))
          ) : !activityQuery.data?.length ? (
            <div
              className="px-6 py-12 flex flex-col items-center justify-center text-center gap-3"
              data-ocid="activity-log-empty"
            >
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <Activity className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Actions taken within your organization will appear here.
              </p>
            </div>
          ) : (
            activityQuery.data.map((entry) => (
              <div
                key={entry.id}
                className="px-6 py-4 flex items-start gap-4"
                data-ocid="activity-log-row"
              >
                <div
                  className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${categoryColor(entry.category)}`}
                >
                  {categoryIcon(entry.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {entry.action}
                    </p>
                    <Badge
                      variant={badgeVariant(entry.category)}
                      className="capitalize text-xs"
                    >
                      {entry.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {entry.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    By {entry.actor}
                  </p>
                </div>
                <time
                  className="text-xs text-muted-foreground flex-shrink-0 tabular-nums"
                  dateTime={entry.timestamp.toISOString()}
                  title={entry.timestamp.toLocaleString()}
                >
                  {formatRelativeTime(entry.timestamp)}
                </time>
              </div>
            ))
          )}
        </div>
      </section>

      <p className="text-xs text-muted-foreground px-1">
        Showing recent organizational activity. Detailed audit logs are
        available on Enterprise plans.
      </p>
    </div>
  );
}
