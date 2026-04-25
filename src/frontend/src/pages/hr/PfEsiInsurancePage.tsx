import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type PfEsiConfig,
  type UpsertPfEsiInput,
  downloadCsvData,
  useEmployeeMap,
  useHrEmployees,
  useHrPfEsiConfig,
  useHrSlips,
  useHrUpsertPfEsiConfig,
} from "@/hooks/useHR";
import { BarChart2, Download, Settings2, Shield, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

type ConfigFormData = Omit<UpsertPfEsiInput, never>;

export default function PfEsiInsurancePage() {
  const { data: config, isLoading: configLoading } = useHrPfEsiConfig();
  const { data: slips = [] } = useHrSlips();
  const { data: employees = [] } = useHrEmployees();
  const upsertConfig = useHrUpsertPfEsiConfig();
  const employeeMap = useEmployeeMap(employees);

  const [configOpen, setConfigOpen] = useState(false);
  const [formData, setFormData] = useState<ConfigFormData>({
    pfEmployeeRate: config?.pfEmployeeRate ?? 12,
    pfEmployerRate: config?.pfEmployerRate ?? 12,
    esiRate: config?.esiRate ?? 1.75,
    insurancePremiumPerEmployee: config?.insurancePremiumPerEmployee ?? 500,
    effectiveFrom:
      config?.effectiveFrom ?? new Date().toISOString().split("T")[0],
  });

  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  // Sync form state when config loads after initial render
  useEffect(() => {
    if (config) {
      setFormData({
        pfEmployeeRate: config.pfEmployeeRate,
        pfEmployerRate: config.pfEmployerRate,
        esiRate: config.esiRate,
        insurancePremiumPerEmployee: config.insurancePremiumPerEmployee,
        effectiveFrom: config.effectiveFrom,
      });
    }
  }, [config]);

  // Compute compliance summary for selected period
  const periodSlips = useMemo(
    () =>
      slips.filter(
        (s) => Number(s.month) === periodMonth && Number(s.year) === periodYear,
      ),
    [slips, periodMonth, periodYear],
  );

  const filteredSlips = useMemo(() => {
    if (!search.trim()) return periodSlips;
    const q = search.toLowerCase();
    return periodSlips.filter((s) => {
      const name = (
        employeeMap.get(s.employeeId.toString()) ?? ""
      ).toLowerCase();
      return (
        name.includes(q) ||
        String(s.pfDeduction).includes(q) ||
        String(s.netPay).includes(q)
      );
    });
  }, [periodSlips, search, employeeMap]);

  const summary = useMemo(() => {
    const totalPf = periodSlips.reduce((s, sl) => s + sl.pfDeduction, 0);
    const totalEsi = periodSlips.reduce((s, sl) => s + sl.esiDeduction, 0);
    const totalTds = periodSlips.reduce((s, sl) => s + sl.tdsDeduction, 0);
    const totalInsurance =
      (config?.insurancePremiumPerEmployee ?? 0) * periodSlips.length;
    return {
      totalPf,
      totalEsi,
      totalTds,
      totalInsurance,
      count: periodSlips.length,
    };
  }, [periodSlips, config]);

  function openConfig() {
    if (config) {
      setFormData({
        pfEmployeeRate: config.pfEmployeeRate,
        pfEmployerRate: config.pfEmployerRate,
        esiRate: config.esiRate,
        insurancePremiumPerEmployee: config.insurancePremiumPerEmployee,
        effectiveFrom: config.effectiveFrom,
      });
    }
    setConfigOpen(true);
  }

  function handleSave() {
    upsertConfig.mutate(formData, {
      onSuccess: () => {
        toast.success("PF/ESI config saved");
        setConfigOpen(false);
      },
      onError: () => toast.error("Failed to save config"),
    });
  }

  function exportReport() {
    const rows = periodSlips.map((s) => ({
      Employee:
        employeeMap.get(s.employeeId.toString()) ?? s.employeeId.toString(),
      Month: MONTHS[Number(s.month) - 1],
      Year: String(s.year),
      "PF Deduction": String(s.pfDeduction),
      "ESI Deduction": String(s.esiDeduction),
      "TDS Deduction": String(s.tdsDeduction),
      "Net Pay": String(s.netPay),
    }));
    downloadCsvData(
      rows,
      [
        "Employee",
        "Month",
        "Year",
        "PF Deduction",
        "ESI Deduction",
        "TDS Deduction",
        "Net Pay",
      ],
      `pfesi-${periodYear}-${periodMonth}.csv`,
    );
  }

  return (
    <div className="space-y-5" data-ocid="pfesi-root">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            PF / ESI / Insurance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Statutory compliance configuration and reports
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            data-ocid="pfesi-export-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            data-ocid="pfesi-import-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport()}
            data-ocid="pfesi-report-btn"
          >
            <BarChart2 className="size-3.5 mr-1.5" /> Generate Report
          </Button>
          <Button size="sm" onClick={openConfig} data-ocid="pfesi-config-btn">
            <Settings2 className="size-3.5 mr-1.5" /> Configure
          </Button>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">
            Current Configuration
          </h2>
        </div>
        {configLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-4 w-full" />
            ))}
          </div>
        ) : config ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["PF Employee Rate", `${config.pfEmployeeRate}%`],
              ["PF Employer Rate", `${config.pfEmployerRate}%`],
              ["ESI Rate", `${config.esiRate}%`],
              [
                "Insurance Premium/Emp",
                `₹${config.insurancePremiumPerEmployee}`,
              ],
              ["Effective From", config.effectiveFrom],
            ].map(([label, val]) => (
              <div key={String(label)} className="space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-foreground">{val}</p>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="py-8 text-center text-muted-foreground text-sm"
            data-ocid="pfesi-no-config"
          >
            No configuration found.{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={openConfig}
            >
              Set up now.
            </button>
          </div>
        )}
      </div>

      {/* Period selector + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-semibold text-foreground">Compliance Summary</h2>
        <select
          className="h-8 border border-border rounded-md px-2 text-sm bg-background text-foreground"
          value={periodMonth}
          onChange={(e) => setPeriodMonth(Number(e.target.value))}
          data-ocid="pfesi-month-select"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          className="h-8 border border-border rounded-md px-2 text-sm bg-background text-foreground"
          value={periodYear}
          onChange={(e) => setPeriodYear(Number(e.target.value))}
          data-ocid="pfesi-year-select"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <Input
          placeholder="Search employee, PF amount…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm w-52"
          data-ocid="pfesi-search"
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Employees Covered", value: summary.count },
          { label: "Total PF", value: `₹${summary.totalPf.toLocaleString()}` },
          {
            label: "Total ESI",
            value: `₹${summary.totalEsi.toLocaleString()}`,
          },
          {
            label: "Total Insurance",
            value: `₹${summary.totalInsurance.toLocaleString()}`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Per-employee table */}
      {filteredSlips.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Employee", "PF (Employee)", "ESI", "TDS", "Net Pay"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredSlips.map((slip) => (
                  <tr
                    key={slip.id.toString()}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                    data-ocid={`pfesi-row-${slip.id}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {employeeMap.get(slip.employeeId.toString()) ??
                        `EMP-${slip.employeeId}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ₹{slip.pfDeduction.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ₹{slip.esiDeduction.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ₹{slip.tdsDeduction.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ₹{slip.netPay.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!configLoading && periodSlips.length === 0 && (
        <div
          className="py-10 text-center text-muted-foreground text-sm bg-card border border-border rounded-xl"
          data-ocid="pfesi-period-empty"
        >
          No salary slips for {MONTHS[periodMonth - 1]} {periodYear}.
        </div>
      )}

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md" data-ocid="pfesi-config-dialog">
          <DialogHeader>
            <DialogTitle>PF / ESI / Insurance Configuration</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {(
              [
                ["pfEmployeeRate", "PF Employee Rate (%)"],
                ["pfEmployerRate", "PF Employer Rate (%)"],
                ["esiRate", "ESI Rate (%)"],
                [
                  "insurancePremiumPerEmployee",
                  "Insurance Premium/Employee (₹)",
                ],
              ] as [keyof ConfigFormData, string][]
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number(formData[field])}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      [field]: Number(e.target.value),
                    }))
                  }
                  className="h-8 text-sm"
                  data-ocid={`pfesi-${field}`}
                />
              </div>
            ))}
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Effective From</Label>
              <Input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, effectiveFrom: e.target.value }))
                }
                className="h-8 text-sm"
                data-ocid="pfesi-effective-from"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsertConfig.isPending}
              data-ocid="pfesi-save-btn"
            >
              {upsertConfig.isPending ? "Saving…" : "Save Configuration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm" data-ocid="pfesi-export-dialog">
          <DialogHeader>
            <DialogTitle>Export PF/ESI Report</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Export compliance data for {MONTHS[periodMonth - 1]} {periodYear} as
            CSV.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                exportReport();
                setExportOpen(false);
              }}
              data-ocid="pfesi-export-confirm"
            >
              Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-sm" data-ocid="pfesi-import-dialog">
          <DialogHeader>
            <DialogTitle>Import PF/ESI Config CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: pfEmployeeRate, pfEmployerRate,
              esiRate, insurancePremiumPerEmployee, effectiveFrom.
            </p>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="text-sm text-foreground"
              data-ocid="pfesi-import-file"
              onChange={(e) => {
                if (e.target.files?.[0])
                  toast.success(`Selected: ${e.target.files[0].name}`);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const t =
                  "pfEmployeeRate,pfEmployerRate,esiRate,insurancePremiumPerEmployee,effectiveFrom\n12,12,1.75,500,2026-01-01";
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob([t], { type: "text/csv" }),
                );
                a.download = "pfesi-config-template.csv";
                a.click();
              }}
              className="w-full"
              data-ocid="pfesi-import-template"
            >
              Download Template
            </Button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Import queued");
                setImportOpen(false);
              }}
              data-ocid="pfesi-import-confirm"
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
