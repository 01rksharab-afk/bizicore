import type { GstReturn, GstReturnId, GstReturnType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcknowledgeGstReturn,
  useGstReturn,
  useSubmitGstReturn,
} from "@/hooks/useGst";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  IndianRupee,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  {
    label: string;
    badgeClass: string;
    icon: React.ReactNode;
    step: number;
  }
> = {
  draft: {
    label: "Draft",
    badgeClass:
      "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <Clock className="size-4" />,
    step: 0,
  },
  submitted: {
    label: "Submitted",
    badgeClass: "border-primary/60 bg-primary/10 text-primary",
    icon: <FileText className="size-4" />,
    step: 1,
  },
  acknowledged: {
    label: "Acknowledged",
    badgeClass: "border-accent/60 bg-accent/10 text-accent",
    icon: <CheckCircle className="size-4" />,
    step: 2,
  },
};

const RETURN_TYPE_LABELS: Record<GstReturnType, string> = {
  gstr1: "GSTR-1",
  gstr3b: "GSTR-3B",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTimestamp(ts: bigint | string | undefined): string {
  if (ts === undefined || ts === null) return "—";
  const ms = Number(ts) / 1_000_000; // nanoseconds → ms
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getPeriod(ret: GstReturn) {
  return `${ret.period.year}-${String(ret.period.month).padStart(2, "0")}`;
}

function exportGstr1Csv(gstReturn: GstReturn) {
  const headers = [
    "Invoice No.",
    "Customer GSTIN",
    "HSN Code",
    "Invoice Date",
    "Taxable Value",
    "IGST",
    "CGST",
    "SGST",
  ];
  const rows = gstReturn.gstr1Entries.map((e) => [
    e.invoiceNumber,
    e.customerGstin ?? "",
    e.hsnCode,
    formatTimestamp(e.invoiceDate),
    e.taxableValue.toString(),
    e.igst.toString(),
    e.cgst.toString(),
    e.sgst.toString(),
  ]);
  const totals = gstReturn.gstr1Entries.reduce(
    (acc, e) => ({
      taxableValue: acc.taxableValue + Number(e.taxableValue),
      igst: acc.igst + Number(e.igst),
      cgst: acc.cgst + Number(e.cgst),
      sgst: acc.sgst + Number(e.sgst),
    }),
    { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
  );
  rows.push([
    "TOTAL",
    "",
    "",
    "",
    totals.taxableValue.toString(),
    totals.igst.toString(),
    totals.cgst.toString(),
    totals.sgst.toString(),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  downloadFile(csv, `GSTR1-${getPeriod(gstReturn)}.csv`, "text/csv");
  toast.success("GSTR-1 CSV downloaded");
}

function exportGstr3bCsv(gstReturn: GstReturn) {
  const { gstr3bEntry } = gstReturn;
  const headers = ["Description", "Amount (₹)"];
  const rows = [
    ["IGST Payable", gstr3bEntry.igstPayable.toString()],
    ["CGST Payable", gstr3bEntry.cgstPayable.toString()],
    ["SGST Payable", gstr3bEntry.sgstPayable.toString()],
    ["Input Tax Credit", gstr3bEntry.inputTaxCredit.toString()],
    ["Net Tax Payable", gstr3bEntry.netTax.toString()],
  ];
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  downloadFile(csv, `GSTR3B-${getPeriod(gstReturn)}.csv`, "text/csv");
  toast.success("GSTR-3B CSV downloaded");
}

function exportJson(gstReturn: GstReturn) {
  const serializable = JSON.parse(
    JSON.stringify(gstReturn, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    ),
  );
  downloadFile(
    JSON.stringify(serializable, null, 2),
    `GST-Return-${getPeriod(gstReturn)}.json`,
    "application/json",
  );
  toast.success("GST Return JSON downloaded");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTimeline({
  status,
  gstReturnId,
  orgId,
}: {
  status: StatusKey;
  gstReturnId: GstReturnId;
  orgId: bigint;
}) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  const submitReturn = useSubmitGstReturn(orgId);
  const acknowledgeReturn = useAcknowledgeGstReturn(orgId);
  const [confirmDialog, setConfirmDialog] = useState<
    "submit" | "acknowledge" | null
  >(null);

  const handleConfirm = async () => {
    if (confirmDialog === "submit") {
      await submitReturn.mutateAsync(gstReturnId);
    } else if (confirmDialog === "acknowledge") {
      await acknowledgeReturn.mutateAsync(gstReturnId);
    }
    setConfirmDialog(null);
  };

  const steps: { key: StatusKey; label: string; desc: string }[] = [
    { key: "draft", label: "Draft", desc: "Generated from invoices" },
    { key: "submitted", label: "Submitted", desc: "Filed with GST portal" },
    { key: "acknowledged", label: "Acknowledged", desc: "Confirmed by GSTN" },
  ];

  return (
    <>
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Filing Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start">
            {steps.map((step, i) => {
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div
                  key={step.key}
                  className="flex-1 flex flex-col items-center relative"
                >
                  {i < steps.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 z-0 transition-colors ${i < currentStep ? "bg-accent" : "bg-border"}`}
                    />
                  )}
                  <div
                    className={`relative z-10 size-8 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent
                        ? "bg-accent text-accent-foreground ring-2 ring-accent/30"
                        : isDone
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="size-4" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                  </div>
                  <div className="mt-2 text-center px-1">
                    <p
                      className={`text-xs font-medium ${isCurrent ? "text-foreground" : isDone ? "text-accent" : "text-muted-foreground"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 hidden sm:block">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2 justify-end">
            {status === "draft" && (
              <Button
                onClick={() => setConfirmDialog("submit")}
                disabled={submitReturn.isPending}
                data-ocid="submit-return-btn"
              >
                {submitReturn.isPending ? "Submitting…" : "Submit Return"}
              </Button>
            )}
            {status === "submitted" && (
              <Button
                variant="outline"
                onClick={() => setConfirmDialog("acknowledge")}
                disabled={acknowledgeReturn.isPending}
                data-ocid="ack-return-btn"
              >
                {acknowledgeReturn.isPending
                  ? "Processing…"
                  : "Acknowledge Return"}
              </Button>
            )}
            {status === "acknowledged" && (
              <Badge
                variant="outline"
                className="border-accent/60 bg-accent/10 text-accent px-3 py-1.5 text-xs"
              >
                <CheckCircle className="size-3.5 mr-1.5" />
                Return Acknowledged
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={confirmDialog !== null}
        onOpenChange={(o) => !o && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmDialog === "submit"
                ? "Submit GST Return?"
                : "Acknowledge GST Return?"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog === "submit"
                ? "This will mark the return as submitted to the GST portal. This action cannot be undone."
                : "This will confirm the return has been acknowledged by GSTN. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitReturn.isPending || acknowledgeReturn.isPending}
              data-ocid="confirm-action-btn"
            >
              {submitReturn.isPending || acknowledgeReturn.isPending
                ? "Processing…"
                : confirmDialog === "submit"
                  ? "Yes, Submit"
                  : "Yes, Acknowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SummaryCards({ gstReturn }: { gstReturn: GstReturn }) {
  const totalTaxable = gstReturn.gstr1Entries.reduce(
    (s, e) => s + Number(e.taxableValue),
    0,
  );
  const { gstr3bEntry } = gstReturn;

  const items = [
    {
      label: "Total Taxable Value",
      value: totalTaxable,
      icon: <IndianRupee className="size-4" />,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "IGST Liability",
      value: Number(gstr3bEntry.igstPayable),
      icon: <IndianRupee className="size-4" />,
      accent: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "ITC Available",
      value: Number(gstr3bEntry.inputTaxCredit),
      icon: <IndianRupee className="size-4" />,
      accent: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Net Tax Payable",
      value: Number(gstr3bEntry.netTax),
      icon: <IndianRupee className="size-4" />,
      accent: "text-foreground",
      bg: "bg-muted",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      data-ocid="summary-cards"
    >
      {items.map((item) => (
        <Card key={item.label} className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`size-7 rounded-md flex items-center justify-center ${item.bg} ${item.accent}`}
              >
                {item.icon}
              </span>
              <span className="text-xs text-muted-foreground font-medium leading-tight">
                {item.label}
              </span>
            </div>
            <p className={`text-lg font-display font-semibold ${item.accent}`}>
              ₹{item.value.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Gstr1Table({ gstReturn }: { gstReturn: GstReturn }) {
  const entries = gstReturn.gstr1Entries;
  const totals = entries.reduce(
    (acc, e) => ({
      taxableValue: acc.taxableValue + Number(e.taxableValue),
      igst: acc.igst + Number(e.igst),
      cgst: acc.cgst + Number(e.cgst),
      sgst: acc.sgst + Number(e.sgst),
    }),
    { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
  );

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display text-base">
            GSTR-1 — Outward Supplies
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              onClick={() => exportGstr1Csv(gstReturn)}
              data-ocid="export-gstr1-csv"
            >
              <FileSpreadsheet className="size-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              onClick={() => exportJson(gstReturn)}
              data-ocid="export-gstr1-json"
            >
              <FileJson className="size-3.5" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium whitespace-nowrap">
                  Invoice No.
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium whitespace-nowrap">
                  Customer GSTIN
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium whitespace-nowrap">
                  HSN Code
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium whitespace-nowrap">
                  Invoice Date
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium whitespace-nowrap">
                  Taxable Value
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
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground text-sm"
                  >
                    No invoice entries found in this return.
                  </td>
                </tr>
              ) : (
                <>
                  {entries.map((entry, i) => (
                    <tr
                      key={`${entry.invoiceNumber}-${i}`}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {entry.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {entry.customerGstin ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {entry.hsnCode}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatTimestamp(entry.invoiceDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ₹{Number(entry.taxableValue).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ₹{Number(entry.igst).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ₹{Number(entry.cgst).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ₹{Number(entry.sgst).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-semibold border-t border-border">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-xs text-muted-foreground"
                    >
                      TOTAL ({entries.length} invoice
                      {entries.length !== 1 ? "s" : ""})
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                      ₹{totals.taxableValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                      ₹{totals.igst.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                      ₹{totals.cgst.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                      ₹{totals.sgst.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Gstr3bSection({ gstReturn }: { gstReturn: GstReturn }) {
  const { gstr3bEntry } = gstReturn;

  const itcRows = [
    {
      label: "CGST Credit Available",
      value: Number(gstr3bEntry.cgstPayable),
      desc: "Offsetted against CGST liability",
    },
    {
      label: "SGST Credit Available",
      value: Number(gstr3bEntry.sgstPayable),
      desc: "Offsetted against SGST liability",
    },
    {
      label: "IGST Credit Available",
      value: Number(gstr3bEntry.igstPayable),
      desc: "Offsetted against IGST liability",
    },
    {
      label: "Total ITC Available",
      value: Number(gstr3bEntry.inputTaxCredit),
      desc: "Net input tax credit claimable",
      highlight: true,
    },
  ];

  const liabilityRows = [
    { label: "CGST Payable", value: Number(gstr3bEntry.cgstPayable) },
    { label: "SGST Payable", value: Number(gstr3bEntry.sgstPayable) },
    { label: "IGST Payable", value: Number(gstr3bEntry.igstPayable) },
    {
      label: "Total Tax Payable",
      value: Number(gstr3bEntry.netTax),
      highlight: true,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* ITC Section */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">
              ITC Available
            </CardTitle>
            <Badge
              variant="outline"
              className="text-xs border-accent/40 text-accent bg-accent/5"
            >
              Input Tax Credit
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">
                  Description
                </th>
                <th className="px-4 py-2.5 text-right text-xs text-muted-foreground font-medium">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {itcRows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-border last:border-0 ${row.highlight ? "bg-accent/5 font-semibold" : "hover:bg-muted/20"} transition-colors`}
                >
                  <td
                    className={`px-4 py-3 text-sm ${row.highlight ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-sm ${row.highlight ? "text-accent font-bold" : "text-foreground"}`}
                  >
                    ₹{row.value.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tax Liability Section */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">
              Tax Liability
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              onClick={() => exportGstr3bCsv(gstReturn)}
              data-ocid="export-gstr3b-csv"
            >
              <FileSpreadsheet className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">
                  Description
                </th>
                <th className="px-4 py-2.5 text-right text-xs text-muted-foreground font-medium">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {liabilityRows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-border last:border-0 ${row.highlight ? "bg-primary/5 font-semibold" : "hover:bg-muted/20"} transition-colors`}
                >
                  <td
                    className={`px-4 py-3 text-sm ${row.highlight ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-sm ${row.highlight ? "text-primary font-bold" : "text-foreground"}`}
                  >
                    ₹{row.value.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GstReturnDetailPage() {
  const { returnId } = useParams({ from: "/layout/gst/$returnId" });
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const parsedReturnId = returnId ? (BigInt(returnId) as GstReturnId) : null;
  const { data: gstReturn, isLoading } = useGstReturn(orgId, parsedReturnId);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!gstReturn) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">GST Return not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/gst">Back to GST Filing</Link>
        </Button>
      </div>
    );
  }

  const statusKey = gstReturn.status as StatusKey;
  const statusInfo = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.draft;
  const periodLabel = `${MONTHS[Number(gstReturn.period.month) - 1]} ${gstReturn.period.year}`;
  const returnTypeLabel =
    RETURN_TYPE_LABELS[gstReturn.returnType] ?? gstReturn.returnType;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link to="/gst" data-ocid="back-to-gst">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-semibold text-foreground">
              {returnTypeLabel} — {periodLabel}
            </h1>
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 ${statusInfo.badgeClass}`}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs border-primary/40 text-primary bg-primary/5"
            >
              {returnTypeLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Return ID: {gstReturn.id.toString()} &nbsp;·&nbsp;{" "}
            {gstReturn.gstr1Entries.length} invoice
            {gstReturn.gstr1Entries.length !== 1 ? "s" : ""}
            {gstReturn.filedAt
              ? ` · Filed ${formatTimestamp(gstReturn.filedAt)}`
              : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10 shrink-0"
          onClick={() => exportJson(gstReturn)}
          data-ocid="export-full-json"
        >
          <Download className="size-3.5" />
          Full Export
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards gstReturn={gstReturn} />

      {/* Status Timeline */}
      {orgId && parsedReturnId && (
        <StatusTimeline
          status={statusKey}
          gstReturnId={parsedReturnId}
          orgId={orgId}
        />
      )}

      {/* GSTR-1 Table */}
      <Gstr1Table gstReturn={gstReturn} />

      {/* GSTR-3B Section */}
      <Gstr3bSection gstReturn={gstReturn} />

      {/* Back link */}
      <div className="pt-2 pb-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground gap-1.5"
        >
          <Link to="/gst">
            <ArrowLeft className="size-3.5" />
            Back to GST Filing
          </Link>
        </Button>
      </div>
    </div>
  );
}
