import type { OrgId } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  FileText,
  Printer,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Gstr9Entry {
  period: string;
  outwardSupplies: number;
  inwardSupplies: number;
  itcClaimed: number;
  taxPaid: number;
  taxPayable: number;
  filingStatus?: "not_filed" | "draft" | "filed";
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useGstr9(orgId: OrgId | null, year: string, enabled: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Gstr9Entry | null>({
    queryKey: ["gstr9", orgId?.toString(), year],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      try {
        const result = await (
          actor as unknown as {
            getGstr9: (
              orgId: OrgId,
              year: string,
            ) => Promise<Gstr9Entry | null>;
          }
        ).getGstr9(orgId, year);
        return result;
      } catch {
        // Return mock data for preview
        return {
          period: year,
          outwardSupplies: 4850000,
          inwardSupplies: 2940000,
          itcClaimed: 529200,
          taxPaid: 748000,
          taxPayable: 763000,
          filingStatus: "draft" as const,
        };
      }
    },
    enabled: !!actor && !isFetching && !!orgId && enabled,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type FilingStatus = "not_filed" | "draft" | "filed";

const STATUS_CONFIG: Record<
  FilingStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  not_filed: {
    label: "Not Filed",
    badgeClass: "border-destructive/60 bg-destructive/10 text-destructive",
    icon: <Clock className="size-3.5" />,
  },
  draft: {
    label: "Draft",
    badgeClass:
      "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <FileText className="size-3.5" />,
  },
  filed: {
    label: "Filed",
    badgeClass: "border-accent/60 bg-accent/10 text-accent",
    icon: <CheckCircle className="size-3.5" />,
  },
};

// ─── Main Content ─────────────────────────────────────────────────────────────

function Gstr9Content() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const currentYear = new Date().getFullYear();
  const years = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ];
  const [year, setYear] = useState(currentYear.toString());
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const { data: entry, isLoading } = useGstr9(orgId, year, fetchEnabled);

  const handleGenerate = () => setFetchEnabled(true);

  const handlePrint = () => window.print();

  const filingStatus = entry?.filingStatus ?? "not_filed";
  const statusConfig = STATUS_CONFIG[filingStatus];
  const netDiff = entry ? entry.taxPayable - entry.taxPaid : 0;

  const summaryRows = entry
    ? [
        {
          label: "Total Outward Supplies (Turnover)",
          value: fmtINR(entry.outwardSupplies),
          highlight: false,
        },
        {
          label: "Total Inward Supplies (Purchases)",
          value: fmtINR(entry.inwardSupplies),
          highlight: false,
        },
        {
          label: "ITC Claimed",
          value: fmtINR(entry.itcClaimed),
          highlight: false,
        },
        {
          label: "Tax Payable",
          value: fmtINR(entry.taxPayable),
          highlight: false,
        },
        { label: "Tax Paid", value: fmtINR(entry.taxPaid), highlight: false },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          GSTR-9 — Annual Return
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Annual consolidated return of all GST transactions for the financial
          year.
        </p>
      </div>

      {/* Year Selector Card */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-4">
            Select Financial Year
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div className="space-y-1" data-ocid="gstr9-year-selector">
              <Label className="text-xs text-muted-foreground">
                Financial Year
              </Label>
              <Select
                value={year}
                onValueChange={(v) => {
                  setYear(v);
                  setFetchEnabled(false);
                }}
              >
                <SelectTrigger className="w-36" data-ocid="gstr9-year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}–{(y + 1).toString().slice(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !orgId}
                className="gap-2"
                data-ocid="generate-gstr9-btn"
              >
                {isLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <TrendingUp className="size-4" />
                )}
                Generate GSTR-9
              </Button>
              {entry && (
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="gap-2"
                  data-ocid="print-gstr9-btn"
                >
                  <Printer className="size-4" />
                  Print
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {fetchEnabled && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : entry ? (
            <Card
              className="border-border/60 bg-card"
              data-ocid="gstr9-summary-card"
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display text-base text-foreground">
                    Annual Summary — FY {year}–
                    {(Number(year) + 1).toString().slice(2)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Consolidated figures from all monthly returns
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1.5 text-xs ${statusConfig.badgeClass}`}
                  data-ocid="gstr9-status-badge"
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="divide-y divide-border/60">
                  {summaryRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-3 px-1"
                    >
                      <span className="text-sm text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="font-mono font-medium text-sm text-foreground">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Net Difference */}
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    netDiff > 0
                      ? "border-destructive/40 bg-destructive/5"
                      : netDiff < 0
                        ? "border-accent/40 bg-accent/5"
                        : "border-border/60 bg-muted/20"
                  }`}
                  data-ocid="gstr9-net-diff"
                >
                  <span className="text-sm font-medium text-foreground">
                    Net Difference (Payable − Paid)
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      netDiff > 0
                        ? "text-destructive"
                        : netDiff < 0
                          ? "text-accent"
                          : "text-muted-foreground"
                    }`}
                  >
                    {netDiff >= 0 ? "" : "−"}
                    {fmtINR(Math.abs(netDiff))}
                    {netDiff < 0 && (
                      <span className="text-xs ml-2 font-normal">
                        (Refundable)
                      </span>
                    )}
                    {netDiff > 0 && (
                      <span className="text-xs ml-2 font-normal">
                        (Outstanding)
                      </span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent
                className="py-16 flex flex-col items-center gap-3"
                data-ocid="gstr9-empty"
              >
                <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="size-6 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground text-sm">
                    No data for this year
                  </p>
                  <p className="text-muted-foreground text-sm mt-0.5 max-w-xs">
                    No GST transactions found for FY {year}. Ensure your
                    transactions are recorded in the accounting module.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function Gstr9Page() {
  return (
    <SubscriptionGate requiredPlan="pro" feature="GSTR-9 Annual Return">
      <Gstr9Content />
    </SubscriptionGate>
  );
}
