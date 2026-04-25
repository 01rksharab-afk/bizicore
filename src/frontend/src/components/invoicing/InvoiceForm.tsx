import type { Contact, CreateInvoiceInput, LineItem__2 } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LineItemRow {
  uid: string;
  description: string;
  quantity: string;
  rateInCents: string;
}

let lineCounter = 0;
function emptyLine(): LineItemRow {
  lineCounter += 1;
  return {
    uid: `line-${lineCounter}`,
    description: "",
    quantity: "1",
    rateInCents: "",
  };
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function InvoiceForm() {
  const { activeOrg } = useActiveOrg();
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [billToName, setBillToName] = useState("");
  const [billToEmail, setBillToEmail] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToTaxId, setBillToTaxId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [taxPercent, setTaxPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItemRow[]>([emptyLine()]);

  const contactsQuery = useQuery<Contact[]>({
    queryKey: ["contacts", activeOrg?.id],
    queryFn: async () => {
      if (!actor || !activeOrg) return [];
      return actor.listContacts(activeOrg.id, null, null, null, true);
    },
    enabled: !!actor && !!activeOrg,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      if (!actor || !activeOrg) throw new Error("No actor");
      return actor.createInvoice(activeOrg.id, input);
    },
    onSuccess: (inv) => {
      toast.success(`Invoice ${inv.invoiceNumber} created`);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate({
        to: "/invoicing/$invoiceId",
        params: { invoiceId: inv.id.toString() },
      });
    },
    onError: () => toast.error("Failed to create invoice"),
  });

  const handleContactChange = (id: string) => {
    setSelectedContactId(id);
    if (id === "manual") {
      setBillToName("");
      setBillToEmail("");
      return;
    }
    const contact = contactsQuery.data?.find((c) => c.id.toString() === id);
    if (contact) {
      setBillToName(contact.name);
      setBillToEmail(contact.email ?? "");
    }
  };

  const updateLine = (idx: number, field: keyof LineItemRow, value: string) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = lines.reduce((sum, l) => {
    const qty = Number.parseFloat(l.quantity) || 0;
    const rate = Math.round(Number.parseFloat(l.rateInCents) * 100) || 0;
    return sum + qty * rate;
  }, 0);
  const tax = Number.parseFloat(taxPercent) || 0;
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: LineItem__2[] = lines
      .filter((l) => l.description.trim() && l.rateInCents)
      .map((l) => ({
        description: l.description,
        quantity: Number.parseFloat(l.quantity) || 1,
        rateInCents: BigInt(Math.round(Number.parseFloat(l.rateInCents) * 100)),
      }));
    if (lineItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    const dueDateTs = BigInt(new Date(dueDate).getTime()) * 1_000_000n;
    createMutation.mutate({
      billTo: {
        name: billToName,
        email: billToEmail,
        address: billToAddress || undefined,
        taxId: billToTaxId || undefined,
        contactId:
          selectedContactId && selectedContactId !== "manual"
            ? BigInt(selectedContactId)
            : undefined,
      },
      lineItems,
      dueDate: dueDateTs,
      taxPercent: tax,
      currency: "USD",
      notes: notes || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      data-ocid="invoice-form"
    >
      {/* Bill To */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-medium text-foreground">Bill To</h2>

        <div className="space-y-1.5">
          <Label htmlFor="contact-select">Contact (optional)</Label>
          <Select value={selectedContactId} onValueChange={handleContactChange}>
            <SelectTrigger id="contact-select" data-ocid="contact-select">
              <SelectValue placeholder="Select existing contact or enter manually…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Enter manually</SelectItem>
              {(contactsQuery.data ?? []).map((c) => (
                <SelectItem key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                  {c.email ? ` — ${c.email}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bill-name">Name *</Label>
            <Input
              id="bill-name"
              value={billToName}
              onChange={(e) => setBillToName(e.target.value)}
              required
              placeholder="Acme Corp"
              data-ocid="bill-to-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bill-email">Email *</Label>
            <Input
              id="bill-email"
              type="email"
              value={billToEmail}
              onChange={(e) => setBillToEmail(e.target.value)}
              required
              placeholder="billing@example.com"
              data-ocid="bill-to-email-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bill-address">Address</Label>
            <Input
              id="bill-address"
              value={billToAddress}
              onChange={(e) => setBillToAddress(e.target.value)}
              placeholder="123 Main St, City"
              data-ocid="bill-to-address-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bill-taxid">Tax ID</Label>
            <Input
              id="bill-taxid"
              value={billToTaxId}
              onChange={(e) => setBillToTaxId(e.target.value)}
              placeholder="Optional"
              data-ocid="bill-to-taxid-input"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Line Items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            data-ocid="add-line-btn"
          >
            <Plus className="size-3.5 mr-1.5" />
            Add Line
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">
                  Qty
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">
                  Rate ($)
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                  Amount
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const qty = Number.parseFloat(line.quantity) || 0;
                const rate =
                  Math.round(Number.parseFloat(line.rateInCents) * 100) || 0;
                return (
                  <tr
                    key={line.uid}
                    className="border-b border-border/40"
                    data-ocid="line-item-row"
                  >
                    <td className="px-4 py-2">
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          updateLine(idx, "description", e.target.value)
                        }
                        placeholder="Service or product description"
                        className="h-8 text-sm"
                        data-ocid="line-desc-input"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", e.target.value)
                        }
                        className="h-8 text-sm text-right"
                        data-ocid="line-qty-input"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.rateInCents}
                        onChange={(e) =>
                          updateLine(idx, "rateInCents", e.target.value)
                        }
                        placeholder="0.00"
                        className="h-8 text-sm text-right"
                        data-ocid="line-rate-input"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-muted-foreground">
                      {formatCents(qty * rate)}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                        aria-label="Remove line"
                        data-ocid="remove-line-btn"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td
                  colSpan={3}
                  className="px-4 py-2.5 text-right text-xs text-muted-foreground"
                >
                  Subtotal
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-foreground">
                  {formatCents(subtotal)}
                </td>
                <td />
              </tr>
              <tr>
                <td colSpan={2} className="px-4 py-2.5" />
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs text-muted-foreground">Tax %</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="h-7 w-20 text-xs text-right"
                      data-ocid="tax-percent-input"
                    />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-muted-foreground">
                  {formatCents(taxAmount)}
                </td>
                <td />
              </tr>
              <tr className="border-t border-border bg-muted/20">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right font-medium text-foreground"
                >
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground text-base">
                  {formatCents(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-medium text-foreground">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="due-date">Due Date *</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              data-ocid="due-date-input"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invoice-notes">Notes</Label>
          <Textarea
            id="invoice-notes"
            placeholder="Payment terms, thank-you notes, or any additional information…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            data-ocid="notes-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/invoicing" })}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending}
          data-ocid="save-invoice-btn"
        >
          <Save className="size-4 mr-2" />
          {createMutation.isPending ? "Creating…" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
