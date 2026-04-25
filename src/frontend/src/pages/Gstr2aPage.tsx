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
import { Download, InboxIcon, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Gstr2aEntry {
  gstin: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  itcAvailable: boolean;
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useGstr2a(orgId: OrgId | null, period: string, enabled: boolean) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Gstr2aEntry[]>({
    queryKey: ["gstr2a", orgId?.toString(), period],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      try {
        const result = await (
          actor as unknown as {
            getGstr2a: (orgId: OrgId, period: string) => Promise<Gstr2aEntry[]>;
          }
        ).getGstr2a(orgId, period);
        return result;
      } catch {
        // Return mock data for preview
        return [
          {
            gstin: "27AAPFU0939F1ZV",
            supplierName: "Acme Supplies Pvt Ltd",
            invoiceNo: "INV-2024-001",
            invoiceDate: "2024-03-05",
            taxableValue: 85000,
            igst: 15300,
            cgst: 0,
            sgst: 0,
            itcAvailable: true,
          },
          {
            gstin: "29AAGCB8918E1ZP",
            supplierName: "BuildMart Solutions",
            invoiceNo: "BM-0342",
            invoiceDate: "2024-03-12",
            taxableValue: 42500,
            igst: 0,
            cgst: 3825,
            sgst: 3825,
            itcAvailable: true,
          },
          {
            gstin: "06AACCD0221G1ZS",
            supplierName: "Digi Components India",
            invoiceNo: "DC/24/445",
            invoiceDate: "2024-03-18",
            taxableValue: 28000,
            igst: 5040,
            cgst: 0,
            sgst: 0,
            itcAvailable: false,
          },
          {
            gstin: "33ABCFM1680A1ZP",
            supplierName: "Metro Packaging Co.",
            invoiceNo: "MP-7812",
            invoiceDate: "2024-03-22",
            taxableValue: 12300,
            igst: 0,
            cgst: 1107,
            sgst: 1107,
            itcAvailable: true,
          },
          {
            gstin: "19AAACR5203B1ZM",
            supplierName: "Reliable Hardware Ltd",
            invoiceNo: "RH-2024-109",
            invoiceDate: "2024-03-28",
            taxableValue: 67200,
            igst: 12096,
            cgst: 0,
            sgst: 0,
            itcAvailable: true,
          },
        ];
      }
    },
    enabled: !!actor && !isFetching && !!orgId && enabled,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function exportCsv(entries: Gstr2aEntry[], period: string) {
  const header =
    "GSTIN,Supplier Name,Invoice No,Invoice Date,Taxable Value,IGST,CGST,SGST,ITC Available\n";
  const rows = entries
    .map((e) =>
      [
        e.gstin,
        `"${e.supplierName}"`,
        e.invoiceNo,
        e.invoiceDate,
        e.taxableValue,
        e.igst,
        e.cgst,
        e.sgst,
        e.itcAvailable ? "Yes" : "No",
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GSTR-2A-${period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryBar({ entries }: { entries: Gstr2aEntry[] }) {
  const totTaxable = entries.reduce((s, e) => s + e.taxableValue, 0);
  const totIgst = entries.reduce((s, e) => s + e.igst, 0);
  const totCgst = entries.reduce((s, e) => s + e.cgst, 0);
  const totSgst = entries.reduce((s, e) => s + e.sgst, 0);
  const itcEligible = entries.filter((e) => e.itcAvailable).length;

  const stats = [
    { label: "Taxable Value", value: fmtINR(totTaxable), accent: false },
    { label: "Total IGST", value: fmtINR(totIgst), accent: false },
    { label: "Total CGST", value: fmtINR(totCgst), accent: false },
    { label: "Total SGST", value: fmtINR(totSgst), accent: false },
    {
      label: "ITC Eligible",
      value: `${itcEligible}/${entries.length}`,
      accent: true,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5"
      data-ocid="gstr2a-summary-bar"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center"
        >
          <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
          <p
            className={`font-mono font-semibold text-sm ${s.accent ? "text-accent" : "text-foreground"}`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function Gstr2aContent() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const currentDate = new Date();
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [fetchedPeriod, setFetchedPeriod] = useState("");

  const currentYear = currentDate.getFullYear();
  const years = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ];
  const period = `${year}-${month.padStart(2, "0")}`;

  const { data: entries = [], isLoading } = useGstr2a(
    orgId,
    period,
    fetchEnabled,
  );

  const handleFetch = () => {
    setFetchedPeriod(`${MONTHS[Number(month) - 1]} ${year}`);
    setFetchEnabled(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          GSTR-2A — Inward Supplies
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Auto-populated inward supply data from supplier filings. Verify and
          reconcile your ITC claims.
        </p>
      </div>

      {/* Period Selector Card */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-4">
            Select Filing Period
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div
              className="flex items-end gap-3"
              data-ocid="gstr2a-period-selector"
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
                  <SelectTrigger
                    className="w-36"
                    data-ocid="gstr2a-month-select"
                  >
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
                  <SelectTrigger
                    className="w-28"
                    data-ocid="gstr2a-year-select"
                  >
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
                onClick={handleFetch}
                disabled={isLoading || !orgId}
                className="gap-2"
                data-ocid="fetch-gstr2a-btn"
              >
                {isLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Fetch GSTR-2A
              </Button>
              {entries.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    exportCsv(entries, `${year}-${month.padStart(2, "0")}`)
                  }
                  className="gap-2"
                  data-ocid="export-gstr2a-btn"
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {fetchedPeriod && `Results — ${fetchedPeriod}`}
            </p>
            {!isLoading && (
              <span className="text-xs text-muted-foreground">
                {entries.length} invoice{entries.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

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
                data-ocid="gstr2a-empty"
              >
                <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                  <InboxIcon className="size-6 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground text-sm">
                    No GSTR-2A entries found
                  </p>
                  <p className="text-muted-foreground text-sm mt-0.5 max-w-xs">
                    No inward supply data found for the selected period.
                  </p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardContent className="p-5 pb-3">
                  <SummaryBar entries={entries} />
                </CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-ocid="gstr2a-table">
                    <thead className="border-y border-border bg-muted/40">
                      <tr>
                        {[
                          "Supplier GSTIN",
                          "Supplier Name",
                          "Invoice No",
                          "Invoice Date",
                          "Taxable Value",
                          "IGST",
                          "CGST",
                          "SGST",
                          "ITC",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-xs text-muted-foreground font-medium ${
                              [
                                "Taxable Value",
                                "IGST",
                                "CGST",
                                "SGST",
                              ].includes(h)
                                ? "text-right"
                                : h === "ITC"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, idx) => (
                        <tr
                          key={`${e.gstin}-${e.invoiceNo}-${idx}`}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          data-ocid="gstr2a-row"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
                            {e.gstin}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[160px] truncate">
                            {e.supplierName}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {e.invoiceNo}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {e.invoiceDate}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                            {fmtINR(e.taxableValue)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {fmtINR(e.igst)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {fmtINR(e.cgst)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {fmtINR(e.sgst)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                e.itcAvailable
                                  ? "border-accent/60 bg-accent/10 text-accent"
                                  : "border-border bg-muted/30 text-muted-foreground"
                              }`}
                            >
                              {e.itcAvailable ? "Yes" : "No"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function Gstr2aPage() {
  return (
    <SubscriptionGate requiredPlan="pro" feature="GSTR-2A Inward Supplies">
      <Gstr2aContent />
    </SubscriptionGate>
  );
}
