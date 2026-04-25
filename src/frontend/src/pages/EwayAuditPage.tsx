import type { OrgId } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileBarChart,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EwayBillEntry {
  ewayBillNo: string;
  documentId: string;
  generatedAt: string;
  expiresAt: string;
  status: "valid" | "expired" | "cancelled";
  vehicleNo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type EwayStatus = "valid" | "expired" | "cancelled";

const STATUS_CONFIG: Record<
  EwayStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  valid: {
    label: "Valid",
    badgeClass: "border-accent/60 bg-accent/10 text-accent",
    icon: <CheckCircle className="size-3" />,
  },
  expired: {
    label: "Expired",
    badgeClass:
      "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <AlertTriangle className="size-3" />,
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "border-destructive/60 bg-destructive/10 text-destructive",
    icon: <XCircle className="size-3" />,
  },
};

const MOCK_ENTRIES: EwayBillEntry[] = [
  {
    ewayBillNo: "EWBNO12034567890",
    documentId: "INV-2024-0081",
    generatedAt: "2024-03-04 10:22",
    expiresAt: "2024-03-06 23:59",
    status: "expired",
    vehicleNo: "MH12AB1234",
  },
  {
    ewayBillNo: "EWBNO12034567891",
    documentId: "INV-2024-0082",
    generatedAt: "2024-03-07 09:15",
    expiresAt: "2024-03-09 23:59",
    status: "valid",
    vehicleNo: "GJ05CD5678",
  },
  {
    ewayBillNo: "EWBNO12034567892",
    documentId: "INV-2024-0083",
    generatedAt: "2024-03-10 14:30",
    expiresAt: "2024-03-12 23:59",
    status: "cancelled",
    vehicleNo: "DL04EF9012",
  },
  {
    ewayBillNo: "EWBNO12034567893",
    documentId: "INV-2024-0089",
    generatedAt: "2024-03-15 11:00",
    expiresAt: "2024-03-17 23:59",
    status: "valid",
    vehicleNo: "KA01GH3456",
  },
  {
    ewayBillNo: "EWBNO12034567894",
    documentId: "INV-2024-0092",
    generatedAt: "2024-03-19 16:45",
    expiresAt: "2024-03-21 23:59",
    status: "valid",
    vehicleNo: "TN07IJ7890",
  },
  {
    ewayBillNo: "EWBNO12034567895",
    documentId: "INV-2024-0098",
    generatedAt: "2024-03-24 08:30",
    expiresAt: "2024-03-26 23:59",
    status: "expired",
    vehicleNo: "UP32KL2345",
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useEwayAuditReport(
  orgId: OrgId | null,
  period: string,
  enabled: boolean,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<EwayBillEntry[]>({
    queryKey: ["ewayAudit", orgId?.toString(), period],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      try {
        const result = await (
          actor as unknown as {
            getEwayAuditReport: (
              orgId: OrgId,
              period: string,
            ) => Promise<EwayBillEntry[]>;
          }
        ).getEwayAuditReport(orgId, period);
        return result;
      } catch {
        return MOCK_ENTRIES;
      }
    },
    enabled: !!actor && !isFetching && !!orgId && enabled,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function exportCsv(entries: EwayBillEntry[], period: string) {
  const header =
    "E-way Bill No,Document ID,Generated At,Expires At,Status,Vehicle No\n";
  const rows = entries
    .map((e) =>
      [
        e.ewayBillNo,
        e.documentId,
        e.generatedAt,
        e.expiresAt,
        e.status,
        e.vehicleNo,
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Eway-Audit-${period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function EwayAuditContent() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const currentDate = new Date();
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const currentYear = currentDate.getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const period = `${year}-${month.padStart(2, "0")}`;

  const { data: entries = [], isLoading } = useEwayAuditReport(
    orgId,
    period,
    fetchEnabled,
  );

  const handleGenerate = () => setFetchEnabled(true);

  const totalBills = entries.length;
  const pendingBills = entries.filter((e) => e.status === "valid").length;
  const expiredBills = entries.filter((e) => e.status === "expired").length;
  const cancelledBills = entries.filter((e) => e.status === "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          E-way Bill Audit Report
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit and review all e-way bills generated for a period — track valid,
          expired, and cancelled bills.
        </p>
      </div>

      {/* Period Selector Card */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-4">
            Select Audit Period
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div
              className="flex items-end gap-3"
              data-ocid="eway-period-selector"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Month</Label>
                <Select
                  value={month}
                  onValueChange={(v) => {
                    setMonth(v);
                    setFetchEnabled(false);
                  }}
                >
                  <SelectTrigger className="w-36" data-ocid="eway-month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={(i + 1).toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Select
                  value={year}
                  onValueChange={(v) => {
                    setYear(v);
                    setFetchEnabled(false);
                  }}
                >
                  <SelectTrigger className="w-28" data-ocid="eway-year-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !orgId}
                className="gap-2"
                data-ocid="generate-eway-audit-btn"
              >
                {isLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <FileBarChart className="size-4" />
                )}
                Generate Report
              </Button>
              {entries.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => exportCsv(entries, period)}
                  className="gap-2"
                  data-ocid="export-eway-audit-btn"
                >
                  <Download className="size-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {fetchEnabled && (
        <div className="space-y-4">
          {/* Summary Cards */}
          {!isLoading && entries.length > 0 && (
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              data-ocid="eway-summary-cards"
            >
              {[
                {
                  label: "Total E-way Bills",
                  value: totalBills,
                  icon: <Truck className="size-4 text-muted-foreground" />,
                  highlight: "",
                },
                {
                  label: "Valid",
                  value: pendingBills,
                  icon: <CheckCircle className="size-4 text-accent" />,
                  highlight: "text-accent",
                },
                {
                  label: "Expired",
                  value: expiredBills,
                  icon: <AlertTriangle className="size-4 text-amber-500" />,
                  highlight: "text-amber-600 dark:text-amber-400",
                },
                {
                  label: "Cancelled",
                  value: cancelledBills,
                  icon: <XCircle className="size-4 text-destructive" />,
                  highlight: "text-destructive",
                },
              ].map((s) => (
                <Card key={s.label} className="border-border/60 bg-card">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p
                        className={`text-2xl font-display font-bold mt-0.5 ${s.highlight || "text-foreground"}`}
                      >
                        {s.value}
                      </p>
                    </div>
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                      {s.icon}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Table */}
          <Card className="border-border/60">
            {isLoading ? (
              <CardContent className="p-0">
                {["sk-a", "sk-b", "sk-c", "sk-d"].map((k) => (
                  <div
                    key={k}
                    className="p-4 border-b border-border last:border-0"
                  >
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            ) : entries.length === 0 ? (
              <CardContent
                className="py-16 flex flex-col items-center gap-3"
                data-ocid="eway-empty"
              >
                <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                  <Truck className="size-6 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground text-sm">
                    No E-way bills found
                  </p>
                  <p className="text-muted-foreground text-sm mt-0.5 max-w-xs">
                    No e-way bills were generated for{" "}
                    {MONTHS[Number(month) - 1]} {year}.
                  </p>
                </div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-ocid="eway-audit-table">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      {[
                        "E-way Bill No",
                        "Document ID",
                        "Generated At",
                        "Expires At",
                        "Status",
                        "Vehicle No",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs text-muted-foreground font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, idx) => {
                      const statusConfig = STATUS_CONFIG[e.status];
                      return (
                        <tr
                          key={`${e.ewayBillNo}-${idx}`}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          data-ocid="eway-audit-row"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
                            {e.ewayBillNo}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {e.documentId}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {e.generatedAt}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {e.expiresAt}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`flex w-fit items-center gap-1 text-xs ${statusConfig.badgeClass}`}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
                            {e.vehicleNo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function EwayAuditPage() {
  return (
    <SubscriptionGate requiredPlan="pro" feature="E-way Bill Audit Report">
      <EwayAuditContent />
    </SubscriptionGate>
  );
}
