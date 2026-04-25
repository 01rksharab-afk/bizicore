import type {
  BulkImportResult,
  CreateProductInput,
  CsvLeadRow,
  ImportResult,
} from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkImportProducts, useCategories } from "@/hooks/useInventory";
import { useBulkImportLeads } from "@/hooks/useLeads";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Package,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type ImportMode = "products" | "leads";

// ── CSV Templates ─────────────────────────────────────────────────────────────

const PRODUCT_COLUMNS = [
  "product_name",
  "category",
  "hsn_code",
  "part_number",
  "rate",
  "tax_percent",
  "unit",
  "stock_qty",
  "description",
];

const LEADS_COLUMNS = ["name", "email", "phone", "company", "source", "notes"];

const SAMPLE_PRODUCT_CSV = `product_name,category,hsn_code,part_number,rate,tax_percent,unit,stock_qty,description
Steel Pipe 1 inch,,7306,PIPE-001,450,18,MTR,500,MS ERW Round Pipe 1 inch diameter
Angle Iron 25x3mm,Hardware,7216,ANG-025,85,18,MTR,200,Mild Steel Angle Iron 25x3mm
Hex Bolt M12,Fasteners,7318,BOLT-M12,12,18,PCS,1000,Grade 8.8 Zinc Plated Hex Bolt
Hydraulic Oil 68,Lubricants,2710,OIL-HYD68,280,5,LTR,50,Industrial Hydraulic Oil ISO 68
Bearing 6205,Bearings,8482,BRG-6205,180,18,PCS,120,Deep Groove Ball Bearing 6205 ZZ`;

const SAMPLE_LEADS_CSV = `name,email,phone,company,source,notes
Rajesh Kumar,rajesh@example.com,9876543210,ABC Industries,manual,Interested in bulk steel orders
Priya Sharma,priya@xyzltd.com,8765432109,XYZ Ltd,indiamart,Needs quote for hydraulic fittings
Suresh Patel,suresh@patel.co,7654321098,Patel Trading,justdial,Looking for bearing supplier`;

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const lines = text.trim().split("\n");
  return lines.map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
  );
}

// ── Result types ──────────────────────────────────────────────────────────────

type ImportResultUnion =
  | { kind: "products"; data: BulkImportResult }
  | { kind: "leads"; data: ImportResult };

interface PreviewProductRow {
  product_name: string;
  category: string;
  hsn_code: string;
  part_number: string;
  rate: string;
  tax_percent: string;
  unit: string;
  stock_qty: string;
}

interface PreviewLeadRow {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  notes: string;
}

type PreviewRow = PreviewProductRow | PreviewLeadRow;

function isLeadRow(row: PreviewRow, mode: ImportMode): row is PreviewLeadRow {
  return mode === "leads";
}

// ── Download template helpers ─────────────────────────────────────────────────

function downloadTemplate(mode: ImportMode) {
  const content = mode === "products" ? SAMPLE_PRODUCT_CSV : SAMPLE_LEADS_CSV;
  const filename =
    mode === "products" ? "products_template.csv" : "leads_template.csv";
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BulkImportPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const { data: categories = [] } = useCategories(orgId);
  const bulkImportProducts = useBulkImportProducts(orgId);
  const bulkImportLeads = useBulkImportLeads(orgId);

  const [mode, setMode] = useState<ImportMode>("products");
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResultUnion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = bulkImportProducts.isPending || bulkImportLeads.isPending;

  const processCSV = (text: string, currentMode: ImportMode) => {
    setCsvText(text);
    setResult(null);
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setPreviewRows([]);
      setTotalRows(0);
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c));
    setTotalRows(dataRows.length);

    if (currentMode === "products") {
      const preview = dataRows.slice(0, 5).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? "";
        });
        return {
          product_name: obj.product_name ?? obj.name ?? "",
          category: obj.category ?? "",
          hsn_code: obj.hsn_code ?? obj.hsn ?? "",
          part_number: obj.part_number ?? obj.part_no ?? "",
          rate: obj.rate ?? "",
          tax_percent: obj.tax_percent ?? obj.tax ?? "18",
          unit: obj.unit ?? "PCS",
          stock_qty: obj.stock_qty ?? obj.stock ?? "0",
        } as PreviewProductRow;
      });
      setPreviewRows(preview);
    } else {
      const preview = dataRows.slice(0, 5).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? "";
        });
        return {
          name: obj.name ?? "",
          email: obj.email ?? "",
          phone: obj.phone ?? "",
          company: obj.company ?? "",
          source: obj.source ?? "manual",
          notes: obj.notes ?? "",
        } as PreviewLeadRow;
      });
      setPreviewRows(preview);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) processCSV(text, mode);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleModeSwitch = (newMode: ImportMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setCsvText("");
      setPreviewRows([]);
      setTotalRows(0);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!orgId || !csvText) return;
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      toast.error("No data rows found");
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c));

    if (mode === "products") {
      const inputs: CreateProductInput[] = dataRows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i]?.trim() ?? "";
        });
        const catName = obj.category ?? "";
        const cat = categories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase(),
        );
        return {
          orgId,
          name: obj.product_name ?? obj.name ?? "",
          description: obj.description ?? "",
          hsnCode: obj.hsn_code ?? obj.hsn ?? "",
          partNumber: obj.part_number ?? obj.part_no ?? "",
          unit: obj.unit || "PCS",
          rate: Number.parseFloat(obj.rate) || 0,
          taxPercent: BigInt(obj.tax_percent ?? obj.tax ?? "18"),
          stockQty: BigInt(obj.stock_qty ?? obj.stock ?? "0"),
          categoryId: cat?.id,
        };
      });

      try {
        const importResult = await bulkImportProducts.mutateAsync(inputs);
        setResult({ kind: "products", data: importResult });
      } catch {
        // toast handled in mutation onError
      }
    } else {
      const csvLeadRows: CsvLeadRow[] = dataRows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i]?.trim() ?? "";
        });
        return {
          name: obj.name ?? "",
          email: obj.email || undefined,
          phone: obj.phone || undefined,
          company: obj.company || undefined,
          source: obj.source || "manual",
          notes: obj.notes ?? "",
        };
      });

      try {
        const importResult = await bulkImportLeads.mutateAsync(csvLeadRows);
        setResult({ kind: "leads", data: importResult });
        const count = Number(importResult.success);
        if (count > 0) {
          toast.success(
            `${count} lead${count !== 1 ? "s" : ""} imported successfully`,
          );
        }
      } catch {
        toast.error("Lead import failed — please check your CSV format");
      }
    }
  };

  const downloadErrorReport = () => {
    if (!result) return;
    let lines: string[];
    if (result.kind === "products" && result.data.errors.length > 0) {
      lines = [
        "row,error_message",
        ...result.data.errors.map(
          (e) => `${Number(e.index) + 2},"${e.message}"`,
        ),
      ];
    } else if (result.kind === "leads" && result.data.errors.length > 0) {
      lines = [
        "row,error_message",
        ...result.data.errors.map((e) => `${Number(e.row) + 2},"${e.msg}"`),
      ];
    } else {
      return;
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setCsvText("");
    setPreviewRows([]);
    setTotalRows(0);
    setResult(null);
  };

  const successCount = result
    ? result.kind === "products"
      ? Number(result.data.successCount)
      : Number(result.data.success)
    : 0;
  const errorCount = result
    ? result.kind === "products"
      ? result.data.errors.length
      : result.data.errors.length
    : 0;

  return (
    <SubscriptionGate requiredPlan="pro" feature="Bulk Import">
      <div className="space-y-6 max-w-4xl fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Bulk Import
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Import multiple {mode === "products" ? "products" : "leads"} at
              once via CSV
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-muted rounded-lg w-fit gap-1">
          <button
            type="button"
            onClick={() => handleModeSwitch("products")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              mode === "products"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="import-mode-products"
          >
            <Package className="size-4" />
            Products
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("leads")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              mode === "leads"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="import-mode-leads"
          >
            <Users className="size-4" />
            Leads
          </button>
        </div>

        {/* Column guide + Download template */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <FileText className="size-4 text-accent" />
                Expected CSV Columns
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate(mode)}
                data-ocid="download-template-btn"
              >
                <Download className="size-3.5 mr-1.5" />
                Download Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {(mode === "products" ? PRODUCT_COLUMNS : LEADS_COLUMNS).map(
                (col) => (
                  <Badge
                    key={col}
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    {col}
                  </Badge>
                ),
              )}
            </div>
            {mode === "products" ? (
              <p className="text-xs text-muted-foreground mt-3">
                First row must be the header.{" "}
                <span className="font-medium text-foreground">
                  product_name
                </span>{" "}
                and <span className="font-medium text-foreground">rate</span>{" "}
                are required. Category must match an existing category name
                (case-insensitive). Tax % options: 0, 5, 12, 18, 28.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">
                First row must be the header.{" "}
                <span className="font-medium text-foreground">name</span> is
                required. Source options: manual, indiamart, tradeindia,
                exportindia, justdial, globallinker, csv.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upload area */}
        <Card>
          <CardContent className="p-0">
            {!csvText ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                  relative flex flex-col items-center justify-center gap-4 p-12 rounded-lg border-2 border-dashed transition-all
                  ${isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-muted/30"}
                `}
                data-ocid="csv-drop-zone"
              >
                <div
                  className={`size-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-accent/20" : "bg-muted"}`}
                >
                  <Upload
                    className={`size-6 ${isDragging ? "text-accent" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    {isDragging
                      ? "Drop your CSV here"
                      : "Drag & drop your CSV file"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-accent underline underline-offset-2 hover:no-underline"
                    >
                      click to browse
                    </button>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    processCSV(
                      mode === "products"
                        ? SAMPLE_PRODUCT_CSV
                        : SAMPLE_LEADS_CSV,
                      mode,
                    );
                  }}
                  data-ocid="load-sample-btn"
                >
                  Load sample CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-accent" />
                    <span className="font-medium text-sm text-foreground">
                      {totalRows} data row{totalRows !== 1 ? "s" : ""} loaded
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Ready to import
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={clearFile}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Preview table */}
                {previewRows.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Preview (first {previewRows.length} rows)
                    </p>
                    <div className="overflow-x-auto rounded-md border border-border">
                      {mode === "products" ? (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="text-xs">
                                Product Name
                              </TableHead>
                              <TableHead className="text-xs">
                                Category
                              </TableHead>
                              <TableHead className="text-xs">HSN</TableHead>
                              <TableHead className="text-xs">
                                Part No.
                              </TableHead>
                              <TableHead className="text-xs text-right">
                                Rate
                              </TableHead>
                              <TableHead className="text-xs text-center">
                                Tax %
                              </TableHead>
                              <TableHead className="text-xs">Unit</TableHead>
                              <TableHead className="text-xs text-right">
                                Stock
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewRows.map((row) => {
                              const r = row as PreviewProductRow;
                              return (
                                <TableRow
                                  key={`prev-product-${r.product_name}-${r.hsn_code}`}
                                  className="text-xs"
                                >
                                  <TableCell className="font-medium">
                                    {r.product_name || "—"}
                                  </TableCell>
                                  <TableCell>{r.category || "—"}</TableCell>
                                  <TableCell className="font-mono">
                                    {r.hsn_code || "—"}
                                  </TableCell>
                                  <TableCell className="font-mono">
                                    {r.part_number || "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ₹{r.rate || "0"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {r.tax_percent || "18"}%
                                  </TableCell>
                                  <TableCell>{r.unit || "PCS"}</TableCell>
                                  <TableCell className="text-right">
                                    {r.stock_qty || "0"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-xs">Email</TableHead>
                              <TableHead className="text-xs">Phone</TableHead>
                              <TableHead className="text-xs">Company</TableHead>
                              <TableHead className="text-xs">Source</TableHead>
                              <TableHead className="text-xs">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewRows.map((row) => {
                              if (!isLeadRow(row, mode)) return null;
                              return (
                                <TableRow
                                  key={`prev-lead-${row.name}-${row.email}`}
                                  className="text-xs"
                                >
                                  <TableCell className="font-medium">
                                    {row.name || "—"}
                                  </TableCell>
                                  <TableCell>{row.email || "—"}</TableCell>
                                  <TableCell>{row.phone || "—"}</TableCell>
                                  <TableCell>{row.company || "—"}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="text-xs capitalize"
                                    >
                                      {row.source || "manual"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate">
                                    {row.notes || "—"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                    {totalRows > 5 && (
                      <p className="text-xs text-muted-foreground mt-1.5 text-center">
                        +{totalRows - 5} more rows not shown
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <Button variant="outline" size="sm" onClick={clearFile}>
                    Clear &amp; re-upload
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isPending || !csvText.trim()}
                    data-ocid="import-submit-btn"
                  >
                    <Upload className="size-4 mr-2" />
                    {isPending
                      ? "Importing…"
                      : `Import ${totalRows} ${mode === "products" ? "Products" : "Leads"}`}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import result */}
        {result && (
          <Card
            className={
              successCount > 0
                ? "border-accent/30 bg-accent/5"
                : "border-destructive/30 bg-destructive/5"
            }
            data-ocid="import-result"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                {successCount > 0 ? (
                  <CheckCircle className="size-5 text-accent shrink-0" />
                ) : (
                  <AlertCircle className="size-5 text-destructive shrink-0" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {successCount} {mode === "products" ? "product" : "lead"}
                    {successCount !== 1 ? "s" : ""} imported
                    {errorCount > 0 &&
                      `, ${errorCount} error${errorCount !== 1 ? "s" : ""}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {errorCount === 0
                      ? "All records imported successfully"
                      : "Some rows had errors — see details below"}
                  </p>
                </div>
                <div className="ml-auto flex gap-2 shrink-0">
                  {errorCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadErrorReport}
                      data-ocid="download-errors-btn"
                    >
                      <Download className="size-4 mr-1.5" />
                      Error Report
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFile}
                    data-ocid="import-again-btn"
                  >
                    Import Again
                  </Button>
                </div>
              </div>

              {errorCount > 0 && (
                <div className="border border-destructive/20 rounded-md overflow-hidden">
                  <div className="bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                    Errors ({errorCount})
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border">
                    {result.kind === "products"
                      ? result.data.errors.map((err) => (
                          <div
                            key={err.index.toString()}
                            className="px-3 py-2 flex items-start gap-3 text-xs"
                          >
                            <Badge
                              variant="destructive"
                              className="text-xs shrink-0 mt-0.5"
                            >
                              Row {Number(err.index) + 2}
                            </Badge>
                            <span className="text-destructive">
                              {err.message}
                            </span>
                          </div>
                        ))
                      : result.data.errors.map((err) => (
                          <div
                            key={err.row.toString()}
                            className="px-3 py-2 flex items-start gap-3 text-xs"
                          >
                            <Badge
                              variant="destructive"
                              className="text-xs shrink-0 mt-0.5"
                            >
                              Row {Number(err.row) + 2}
                            </Badge>
                            <span className="text-destructive">{err.msg}</span>
                          </div>
                        ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SubscriptionGate>
  );
}
