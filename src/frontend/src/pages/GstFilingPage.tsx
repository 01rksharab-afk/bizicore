import { GstReturnType } from "@/backend";
import type { GstReturn, GstReturnId } from "@/backend";

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
import {
  useAcknowledgeGstReturn,
  useGenerateGstReturn,
  useGstReturns,
  useSubmitGstReturn,
} from "@/hooks/useGst";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

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

type StatusKey = "draft" | "submitted" | "acknowledged";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Draft",
    badgeClass:
      "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <Clock className="size-3.5" />,
  },
  submitted: {
    label: "Submitted",
    badgeClass: "border-primary/60 bg-primary/10 text-primary",
    icon: <FileText className="size-3.5" />,
  },
  acknowledged: {
    label: "Acknowledged",
    badgeClass: "border-accent/60 bg-accent/10 text-accent",
    icon: <CheckCircle className="size-3.5" />,
  },
};

const RETURN_TYPE_LABELS: Record<GstReturnType, string> = {
  gstr1: "GSTR-1",
  gstr3b: "GSTR-3B",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeriodSelector({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: string;
  year: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="flex items-end gap-3" data-ocid="period-selector">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Month</Label>
        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className="w-36" data-ocid="month-select">
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
        <Select value={year} onValueChange={onYearChange}>
          <SelectTrigger className="w-28" data-ocid="year-select">
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
  );
}

function ReturnStatusBadge({ status }: { status: string }) {
  const key = status as StatusKey;
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.draft;
  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1.5 text-xs ${config.badgeClass}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

function ReturnTableRow({
  ret,
  onSubmit,
  onAcknowledge,
  isSubmitting,
  isAcknowledging,
}: {
  ret: GstReturn;
  onSubmit: (id: GstReturnId) => void;
  onAcknowledge: (id: GstReturnId) => void;
  isSubmitting: boolean;
  isAcknowledging: boolean;
}) {
  const statusKey = ret.status as StatusKey;
  const periodLabel = `${MONTHS[Number(ret.period.month) - 1]} ${ret.period.year}`;
  const returnTypeLabel = RETURN_TYPE_LABELS[ret.returnType] ?? ret.returnType;

  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      data-ocid="gst-return-row"
    >
      <td className="px-4 py-3">
        <p className="font-display font-semibold text-foreground text-sm">
          {periodLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {ret.period.month.toString().padStart(2, "0")}/{ret.period.year}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={`text-xs font-mono ${
            ret.returnType === "gstr1"
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-accent/40 bg-accent/5 text-accent"
          }`}
        >
          {returnTypeLabel}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <ReturnStatusBadge status={ret.status} />
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs">
        ₹{Number(ret.gstr3bEntry.igstPayable).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs">
        ₹{Number(ret.gstr3bEntry.cgstPayable).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs">
        ₹{Number(ret.gstr3bEntry.sgstPayable).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">
        ₹{Number(ret.gstr3bEntry.netTax).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
        {ret.gstr1Entries.length}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/gst/$returnId"
              params={{ returnId: ret.id.toString() }}
              data-ocid="view-return-btn"
            >
              View
            </Link>
          </Button>
          {statusKey === "draft" && (
            <Button
              size="sm"
              onClick={() => onSubmit(ret.id)}
              disabled={isSubmitting}
              data-ocid="submit-return-btn"
            >
              Submit
            </Button>
          )}
          {statusKey === "submitted" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(ret.id)}
              disabled={isAcknowledging}
              data-ocid="ack-return-btn"
            >
              Acknowledge
            </Button>
          )}
          {statusKey === "acknowledged" && (
            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/5 text-accent text-xs px-2 py-1"
            >
              <CheckCircle className="size-3 mr-1" />
              Done
            </Badge>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function GstFilingContent() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const { data: returns = [], isLoading } = useGstReturns(orgId);
  const generate = useGenerateGstReturn(orgId);
  const submitReturn = useSubmitGstReturn(orgId);
  const acknowledgeReturn = useAcknowledgeGstReturn(orgId);

  const currentDate = new Date();
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [year, setYear] = useState(currentDate.getFullYear().toString());

  const handleGenerate = (returnType: GstReturnType) => {
    if (!orgId) return;
    generate.mutate({ year: BigInt(year), month: BigInt(month), returnType });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          GST Filing
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate and submit GSTR-1 and GSTR-3B returns for your organization
        </p>
      </div>

      {/* Period Selector + Generate Buttons */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-4">
            Select Filing Period
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <PeriodSelector
              month={month}
              year={year}
              onMonthChange={setMonth}
              onYearChange={setYear}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleGenerate(GstReturnType.gstr1)}
                disabled={generate.isPending || !orgId}
                className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                data-ocid="generate-gstr1-btn"
              >
                {generate.isPending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Generate GSTR-1
              </Button>
              <Button
                onClick={() => handleGenerate(GstReturnType.gstr3b)}
                disabled={generate.isPending || !orgId}
                className="gap-2"
                data-ocid="generate-gstr3b-btn"
              >
                {generate.isPending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Generate GSTR-3B
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Filing History
          </p>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              {returns.length} return{returns.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <Card className="border-border/60">
          {isLoading ? (
            <CardContent className="p-0">
              {(["sk-a", "sk-b", "sk-c"] as const).map((key) => (
                <div
                  key={key}
                  className="p-4 border-b border-border last:border-0"
                >
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          ) : returns.length === 0 ? (
            <CardContent
              className="py-16 flex flex-col items-center gap-3"
              data-ocid="gst-empty"
            >
              <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="size-6 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground text-sm">
                  No GST returns filed yet
                </p>
                <p className="text-muted-foreground text-sm mt-0.5 max-w-xs">
                  Select a period and generate your first return using GSTR-1 or
                  GSTR-3B above.
                </p>
              </div>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="returns-table">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                      IGST
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                      CGST
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                      SGST
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                      Net Tax
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                      Entries
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <ReturnTableRow
                      key={ret.id.toString()}
                      ret={ret}
                      onSubmit={(id) => submitReturn.mutate(id)}
                      onAcknowledge={(id) => acknowledgeReturn.mutate(id)}
                      isSubmitting={submitReturn.isPending}
                      isAcknowledging={acknowledgeReturn.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3.5">
        <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">GSTR-1</span> captures
          outward supplies (invoices issued to customers).{" "}
          <span className="font-medium text-foreground">GSTR-3B</span> is the
          monthly self-assessed tax summary with ITC claims. Both are generated
          from your inventory and invoicing data.
        </p>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function GstFilingPage() {
  return (
    <SubscriptionGate requiredPlan="pro" feature="GST Filing">
      <GstFilingContent />
    </SubscriptionGate>
  );
}
