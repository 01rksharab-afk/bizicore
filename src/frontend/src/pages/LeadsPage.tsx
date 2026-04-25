import {
  type Contact,
  type CsvLeadRow,
  type ExtendedLead,
  type ExtendedLeadInput,
  LeadSource,
  LeadStatus,
} from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useContacts, useCreateContact } from "@/hooks/useCRM";
import {
  useBulkImportLeads,
  useCreateLead,
  useLeads,
  useUpdateLeadStatus,
} from "@/hooks/useLeads";
import { useActiveOrg } from "@/hooks/useOrg";
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronDown,
  Edit2,
  FileSpreadsheet,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.new_]: "New",
  [LeadStatus.qualified]: "Qualified",
  [LeadStatus.converted]: "Converted",
  [LeadStatus.lost]: "Lost",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.new_]: "bg-accent/10 text-accent border-accent/30",
  [LeadStatus.qualified]: "bg-primary/10 text-primary border-primary/30",
  [LeadStatus.converted]:
    "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700",
  [LeadStatus.lost]: "bg-destructive/10 text-destructive border-destructive/30",
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.manual]: "Manual",
  [LeadSource.csv]: "CSV",
  [LeadSource.indiamart]: "IndiaMart",
  [LeadSource.tradeindia]: "TradeIndia",
  [LeadSource.exportindia]: "Export India",
  [LeadSource.justdial]: "JustDial",
  [LeadSource.globallinker]: "GlobalLinker",
  [LeadSource.google]: "Google Business",
  [LeadSource.facebookPage]: "Facebook Page",
  [LeadSource.metaAds]: "Meta Ads",
  [LeadSource.websiteWebhook]: "Website Webhook",
};

const SOURCE_COLORS: Record<LeadSource, string> = {
  [LeadSource.manual]: "bg-muted/60 text-muted-foreground border-border",
  [LeadSource.csv]:
    "bg-blue-500/10 text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700",
  [LeadSource.indiamart]:
    "bg-orange-500/10 text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700",
  [LeadSource.tradeindia]:
    "bg-teal-500/10 text-teal-600 border-teal-300 dark:text-teal-400 dark:border-teal-700",
  [LeadSource.exportindia]:
    "bg-green-500/10 text-green-600 border-green-300 dark:text-green-400 dark:border-green-700",
  [LeadSource.justdial]:
    "bg-purple-500/10 text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-700",
  [LeadSource.globallinker]:
    "bg-indigo-500/10 text-indigo-600 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700",
  [LeadSource.google]:
    "bg-red-500/10 text-red-600 border-red-300 dark:text-red-400 dark:border-red-700",
  [LeadSource.facebookPage]:
    "bg-blue-600/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700",
  [LeadSource.metaAds]:
    "bg-violet-500/10 text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700",
  [LeadSource.websiteWebhook]:
    "bg-cyan-500/10 text-cyan-600 border-cyan-300 dark:text-cyan-400 dark:border-cyan-700",
};

// ─── Status Tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: LeadStatus.new_, label: "New" },
  { value: LeadStatus.qualified, label: "Qualified" },
  { value: LeadStatus.converted, label: "Won" },
  { value: LeadStatus.lost, label: "Lost" },
];

// ─── Sort types ───────────────────────────────────────────────────────────────

type SortKey = "createdAt" | "name" | "status";
type SortDir = "asc" | "desc";

// ─── Add / Edit Lead Dialog ───────────────────────────────────────────────────

interface LeadForm {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  notes: string;
}

const DEFAULT_FORM: LeadForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  source: LeadSource.manual,
  status: LeadStatus.new_,
  notes: "",
};

function LeadFormDialog({
  orgId,
  open,
  onClose,
  editLead,
  editContact,
}: {
  orgId: bigint;
  open: boolean;
  onClose: () => void;
  editLead?: ExtendedLead;
  editContact?: Contact;
}) {
  const createContact = useCreateContact(orgId);
  const createLead = useCreateLead(orgId);
  const updateStatus = useUpdateLeadStatus(orgId);

  const [form, setForm] = useState<LeadForm>(() =>
    editLead && editContact
      ? {
          name: editContact.name,
          company: editContact.company ?? "",
          phone: editContact.phone ?? "",
          email: editContact.email ?? "",
          source: editLead.source,
          status: editLead.status,
          notes: editLead.notes,
        }
      : DEFAULT_FORM,
  );

  const set = <K extends keyof LeadForm>(k: K, v: LeadForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isEdit = !!editLead;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (isEdit && editLead) {
        // For edit: only update status (contact editing not in scope)
        if (form.status !== editLead.status) {
          await updateStatus.mutateAsync({
            leadId: editLead.id,
            newStatus: form.status,
          });
        }
        toast.success("Lead updated");
        onClose();
      } else {
        // Create contact first, then lead
        const contactId = await createContact.mutateAsync({
          name: form.name.trim(),
          tags: [],
          email: form.email.trim() || undefined,
          company: form.company.trim() || undefined,
          phone: form.phone.trim() || undefined,
        });
        const input: ExtendedLeadInput = {
          contactId,
          status: form.status,
          source: form.source,
          notes: form.notes,
        };
        await createLead.mutateAsync(input);
        toast.success("Lead created");
        onClose();
        setForm(DEFAULT_FORM);
      }
    } catch {
      // error toasts handled in hook
    }
  };

  const isPending =
    createContact.isPending || createLead.isPending || updateStatus.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Name + Company (read-only when editing) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ravi Kumar"
                required
                disabled={isEdit}
                data-ocid="lead-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Industries"
                disabled={isEdit}
                data-ocid="lead-company-input"
              />
            </div>
          </div>

          {/* Phone + Email (read-only when editing) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                disabled={isEdit}
                data-ocid="lead-phone-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="ravi@acme.com"
                disabled={isEdit}
                data-ocid="lead-email-input"
              />
            </div>
          </div>

          {/* Source + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) => set("source", v as LeadSource)}
                disabled={isEdit}
              >
                <SelectTrigger data-ocid="lead-source-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.values(LeadSource) as LeadSource[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {SOURCE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as LeadStatus)}
              >
                <SelectTrigger data-ocid="lead-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.values(LeadStatus) as LeadStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Interested in bulk orders, referred via trade show..."
                rows={3}
                data-ocid="lead-notes-input"
              />
            </div>
          )}

          {isEdit && (
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 border border-border px-3 py-2">
              Editing contact details is not available — only status can be
              updated.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid={isEdit ? "edit-lead-submit" : "add-lead-submit"}
            >
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Update Popover (inline row action) ────────────────────────────────

function StatusDropdown({
  orgId,
  lead,
}: { orgId: bigint; lead: ExtendedLead }) {
  const updateStatus = useUpdateLeadStatus(orgId);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
        aria-label="Update status"
        data-ocid="lead-status-dropdown-trigger"
      >
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close"
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {(Object.values(LeadStatus) as LeadStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={lead.status === s || updateStatus.isPending}
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpen(false);
                  await updateStatus.mutateAsync({
                    leadId: lead.id,
                    newStatus: s,
                  });
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors
                  ${lead.status === s ? "text-muted-foreground cursor-default" : "hover:bg-muted/60 text-foreground"}`}
                data-ocid={`set-status-${s}`}
              >
                <span
                  className={`size-2 rounded-full ${
                    s === LeadStatus.new_
                      ? "bg-accent"
                      : s === LeadStatus.qualified
                        ? "bg-primary"
                        : s === LeadStatus.converted
                          ? "bg-emerald-500"
                          : "bg-destructive"
                  }`}
                />
                {STATUS_LABELS[s]}
                {lead.status === s && (
                  <span className="ml-auto text-muted-foreground">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .trim()
    .split("\n")
    .filter((l) => l.trim());
  const start = lines[0]?.toLowerCase().startsWith("name") ? 1 : 0;
  return lines.slice(start).map((line) => {
    const parts = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    return {
      name: parts[0] ?? "",
      company: parts[1] ?? "",
      phone: parts[2] ?? "",
      email: parts[3] ?? "",
      source: parts[4] ?? "manual",
      notes: parts[5] ?? "",
    };
  });
}

// ─── Bulk Import Dialog ───────────────────────────────────────────────────────

function BulkImportContent({
  orgId,
  onClose,
}: { orgId: bigint; onClose: () => void }) {
  const bulkImport = useBulkImportLeads(orgId);
  const [csvText, setCsvText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = csvText.trim() ? parseCsv(csvText).slice(0, 5) : [];

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setCsvText((e.target?.result as string) ?? "");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    const rows = parseCsv(csvText);
    if (!rows.length) {
      toast.error("No data to import");
      return;
    }
    const csvRows: CsvLeadRow[] = rows.map((r) => ({
      name: r.name,
      company: r.company || undefined,
      phone: r.phone || undefined,
      email: r.email || undefined,
      source: r.source || "manual",
      notes: r.notes,
    }));
    try {
      const result = await bulkImport.mutateAsync(csvRows);
      const successCount = Number(result.success);
      const errors = result.errors.map((e) => `Row ${e.row}: ${e.msg}`);
      setImportResult({ success: successCount, errors });
    } catch {
      // errors handled in hook
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csv =
      "name,company,phone,email,source,notes\nRavi Kumar,Acme Industries,+91 98765 43210,ravi@acme.com,indiamart,Interested in bulk orders";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (importResult) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="size-7 text-emerald-500" />
          </div>
          <h3 className="font-display font-semibold text-foreground">
            Import Complete
          </h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {importResult.success}
            </span>{" "}
            lead{importResult.success !== 1 ? "s" : ""} imported successfully
          </p>
        </div>
        {importResult.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
              <AlertTriangle className="size-3.5" />
              {importResult.errors.length} error
              {importResult.errors.length !== 1 ? "s" : ""}
            </div>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <li
                  key={`err-${i}-${err.slice(0, 10)}`}
                  className="text-xs text-destructive/80"
                >
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button
          className="w-full"
          onClick={onClose}
          data-ocid="import-done-btn"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Template hint */}
      <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-xs text-muted-foreground flex items-start justify-between gap-3">
        <div>
          <span className="font-medium text-foreground">
            Expected columns:{" "}
          </span>
          <code className="font-mono text-xs">
            name, company, phone, email, source, notes
          </code>
          <div className="mt-1 opacity-80">
            Source values: manual · csv · indiamart · tradeindia · exportindia ·
            justdial · globallinker
          </div>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="shrink-0 text-accent underline underline-offset-2 hover:no-underline text-xs whitespace-nowrap"
          data-ocid="download-template-btn"
        >
          Download template
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors ${
          isDragOver ? "border-accent bg-accent/5" : "border-border"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        data-ocid="csv-drop-zone"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
          id="csv-file-upload"
        />
        {csvText ? (
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileSpreadsheet className="size-4 text-accent" />
              <span>{parseCsv(csvText).length} rows loaded</span>
            </div>
            <button
              type="button"
              onClick={() => setCsvText("")}
              className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear CSV"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="csv-file-upload"
            className="py-8 flex flex-col items-center gap-2 text-center px-4 cursor-pointer hover:bg-muted/20 transition-colors rounded-xl"
          >
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop a CSV file here, or{" "}
              <span className="text-accent font-medium">click to browse</span>
            </p>
          </label>
        )}
      </div>

      {/* Paste CSV option */}
      {!csvText && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Or paste CSV data
          </Label>
          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Ravi Kumar,Acme Ltd,+91 98765 43210,ravi@acme.com,indiamart,Interested in bulk order"
            rows={4}
            className="font-mono text-xs"
            data-ocid="csv-textarea"
          />
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Preview — first {preview.length} row
            {preview.length !== 1 ? "s" : ""}
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Name", "Company", "Phone", "Email", "Source"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={`preview-${i}-${row.name}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-foreground truncate max-w-[100px]">
                      {row.name || (
                        <span className="text-destructive">missing</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[80px]">
                      {row.company || "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.phone || "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[100px]">
                      {row.email || "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.source || "manual"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={bulkImport.isPending || !csvText.trim()}
          data-ocid="confirm-import-btn"
        >
          {bulkImport.isPending
            ? "Importing..."
            : csvText.trim()
              ? `Import ${parseCsv(csvText).length} Lead${parseCsv(csvText).length !== 1 ? "s" : ""}`
              : "Import Leads"}
        </Button>
      </div>
    </div>
  );
}

function BulkImportDialog({
  orgId,
  open,
  onClose,
}: { orgId: bigint; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Bulk Import Leads
          </DialogTitle>
        </DialogHeader>
        <SubscriptionGate requiredPlan="pro" feature="Bulk CSV import">
          <BulkImportContent orgId={orgId} onClose={onClose} />
        </SubscriptionGate>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

interface LeadRowProps {
  lead: ExtendedLead;
  contact: Contact | undefined;
  orgId: bigint;
  onEdit: () => void;
}

function LeadRow({ lead, contact, orgId, onEdit }: LeadRowProps) {
  const dateStr = new Date(
    Number(lead.createdAt / 1_000_000n),
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const displayName = contact?.name ?? `Lead #${lead.id.toString()}`;

  return (
    <tr
      className="border-b border-border hover:bg-muted/20 transition-colors group"
      data-ocid="lead-row"
    >
      {/* Contact info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <UserCheck className="size-3.5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName}
            </p>
            {lead.notes && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {lead.notes}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="px-4 py-3">
        <span className="text-xs text-foreground flex items-center gap-1.5">
          <Building2 className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate max-w-[120px]">
            {contact?.company ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        </span>
      </td>

      {/* Phone */}
      <td className="px-4 py-3">
        <span className="text-xs flex items-center gap-1.5">
          <Phone className="size-3 shrink-0 text-muted-foreground" />
          {contact?.phone ? (
            <span className="text-foreground">{contact.phone}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </td>

      {/* Email */}
      <td className="px-4 py-3">
        <span className="text-xs flex items-center gap-1.5">
          <Mail className="size-3 shrink-0 text-muted-foreground" />
          {contact?.email ? (
            <span className="text-foreground truncate max-w-[140px]">
              {contact.email}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </td>

      {/* Source badge */}
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={`text-xs font-medium ${SOURCE_COLORS[lead.source]}`}
          data-ocid="lead-source-badge"
        >
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </Badge>
      </td>

      {/* Status badge + quick update */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={`text-xs font-medium ${STATUS_COLORS[lead.status]}`}
            data-ocid="lead-status-badge"
          >
            {STATUS_LABELS[lead.status] ?? lead.status}
          </Badge>
          <StatusDropdown orgId={orgId} lead={lead} />
        </div>
      </td>

      {/* Created date */}
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground">{dateStr}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Edit lead"
            data-ocid="lead-edit-btn"
          >
            <Edit2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              toast.info("Use the status dropdown to update this lead")
            }
            className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="More actions"
            data-ocid="lead-more-btn"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function sortLeads(
  leads: ExtendedLead[],
  contacts: Map<string, Contact>,
  key: SortKey,
  dir: SortDir,
): ExtendedLead[] {
  return [...leads].sort((a, b) => {
    let cmp = 0;
    if (key === "createdAt") {
      cmp = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    } else if (key === "name") {
      const na = contacts.get(a.contactId.toString())?.name ?? "";
      const nb = contacts.get(b.contactId.toString())?.name ?? "";
      cmp = na.localeCompare(nb);
    } else if (key === "status") {
      cmp = a.status.localeCompare(b.status);
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export default function LeadsPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;

  const { data: leads = [], isLoading: leadsLoading } = useLeads(orgId);
  const { data: contacts = [], isLoading: contactsLoading } =
    useContacts(orgId);

  const contactMap = new Map<string, Contact>(
    contacts.map((c) => [c.id.toString(), c]),
  );

  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ExtendedLead | null>(null);

  const isLoading = leadsLoading || contactsLoading;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = (() => {
    let list = leads.filter((l) => {
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const q = search.toLowerCase();
      const c = contactMap.get(l.contactId.toString());
      const matchSearch =
        !q ||
        (c?.name ?? "").toLowerCase().includes(q) ||
        (c?.company ?? "").toLowerCase().includes(q) ||
        (c?.email ?? "").toLowerCase().includes(q) ||
        (c?.phone ?? "").toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    list = sortLeads(list, contactMap, sortKey, sortDir);
    return list;
  })();

  const countByStatus = (s: "all" | LeadStatus) =>
    s === "all" ? leads.length : leads.filter((l) => l.status === s).length;

  const SORT_COLS: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created" },
  ];

  const TABLE_HEADERS = [
    "Name",
    "Company",
    "Phone",
    "Email",
    "Source",
    "Status",
    "Created",
    "",
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track, qualify, and convert your incoming leads
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            data-ocid="bulk-import-leads-btn"
          >
            <Upload className="size-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)} data-ocid="add-lead-btn">
            <Plus className="size-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Status tabs */}
        <div
          className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border overflow-x-auto shrink-0"
          role="tablist"
          data-ocid="status-filter-tabs"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.value}
              onClick={() => setStatusFilter(tab.value)}
              data-ocid={`filter-${tab.value}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                ${
                  statusFilter === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center
                  ${
                    statusFilter === tab.value
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {countByStatus(tab.value)}
              </span>
            </button>
          ))}
        </div>

        {/* Search + sort controls */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, email..."
              className="pl-8 h-9 text-sm"
              data-ocid="lead-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
            <Select
              value={`${sortKey}:${sortDir}`}
              onValueChange={(v) => {
                const [k, d] = v.split(":") as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
              }}
            >
              <SelectTrigger
                className="h-9 text-xs w-[150px]"
                data-ocid="lead-sort-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_COLS.map(({ key, label }) => [
                  <SelectItem key={`${key}:desc`} value={`${key}:desc`}>
                    {label} (newest)
                  </SelectItem>,
                  <SelectItem key={`${key}:asc`} value={`${key}:asc`}>
                    {label} (oldest)
                  </SelectItem>,
                ])}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="p-4 space-y-3">
            {(["sk1", "sk2", "sk3", "sk4", "sk5"] as const).map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-lg" />
            ))}
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent
            className="py-16 flex flex-col items-center gap-4 text-center"
            data-ocid="leads-empty"
          >
            <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center">
              <Users className="size-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                {search || statusFilter !== "all"
                  ? "No matching leads"
                  : "No leads yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "all"
                  ? "Try changing your search or filter criteria"
                  : "Add your first lead manually or import in bulk via CSV"}
              </p>
            </div>
            {!search && statusFilter === "all" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                  data-ocid="empty-import-btn"
                >
                  <Upload className="size-3.5 mr-1.5" />
                  Import CSV
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  data-ocid="empty-add-lead-btn"
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Add your first lead
                </Button>
              </div>
            )}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-ocid="leads-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {TABLE_HEADERS.map((h) => {
                    const col = SORT_COLS.find((c) => c.label === h);
                    return (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                          col
                            ? "cursor-pointer hover:text-foreground transition-colors select-none"
                            : ""
                        }`}
                        onClick={col ? () => toggleSort(col.key) : undefined}
                        onKeyDown={
                          col
                            ? (e) =>
                                (e.key === "Enter" || e.key === " ") &&
                                toggleSort(col.key)
                            : undefined
                        }
                        tabIndex={col ? 0 : undefined}
                        role={col ? "button" : undefined}
                      >
                        <span className="flex items-center gap-1">
                          {h}
                          {col && sortKey === col.key && (
                            <span className="text-accent">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <LeadRow
                    key={lead.id.toString()}
                    lead={lead}
                    contact={contactMap.get(lead.contactId.toString())}
                    orgId={orgId!}
                    onEdit={() => setEditingLead(lead)}
                  />
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filtered.length} of {leads.length} lead
                {leads.length !== 1 ? "s" : ""}
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-accent hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Add Lead dialog */}
      {orgId && (
        <LeadFormDialog
          orgId={orgId}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* Edit Lead dialog */}
      {orgId && editingLead && (
        <LeadFormDialog
          orgId={orgId}
          open={!!editingLead}
          onClose={() => setEditingLead(null)}
          editLead={editingLead}
          editContact={contactMap.get(editingLead.contactId.toString())}
        />
      )}

      {/* Bulk Import dialog */}
      {orgId && (
        <BulkImportDialog
          orgId={orgId}
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
