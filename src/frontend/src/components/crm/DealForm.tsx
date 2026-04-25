import type { Deal, DealId, DealInput, DealStage, OrgId } from "@/backend";
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
import { useContacts } from "@/hooks/useCRM";
import { useCreateDeal, useUpdateDeal } from "@/hooks/useCRM";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STAGES: { value: DealStage; label: string }[] = [
  { value: "prospect" as DealStage, label: "Prospect" },
  { value: "qualified" as DealStage, label: "Qualified" },
  { value: "negotiation" as DealStage, label: "Negotiation" },
  { value: "closedWon" as DealStage, label: "Closed Won" },
  { value: "closedLost" as DealStage, label: "Closed Lost" },
];

interface DealFormProps {
  orgId: OrgId | null;
  deal?: Deal;
  initialStage?: DealStage;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DealForm({
  orgId,
  deal,
  initialStage,
  onSuccess,
  onCancel,
}: DealFormProps) {
  const isEdit = !!deal;
  const { identity } = useInternetIdentity();
  const { data: contacts = [] } = useContacts(orgId);
  const createDeal = useCreateDeal(orgId);
  const updateDeal = useUpdateDeal(orgId);

  const [form, setForm] = useState({
    name: "",
    value: "",
    stage: (initialStage ?? "prospect") as DealStage,
    contactId: "" as string,
    closeDate: "",
  });

  useEffect(() => {
    if (deal) {
      setForm({
        name: deal.name,
        value: (Number(deal.value) / 100).toFixed(2),
        stage: deal.stage,
        contactId: deal.contactId ? deal.contactId.toString() : "",
        closeDate: deal.closeDate
          ? new Date(Number(deal.closeDate / 1_000_000n))
              .toISOString()
              .split("T")[0]
          : "",
      });
    }
  }, [deal]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity) return;

    const valueInCents = BigInt(
      Math.round(Number.parseFloat(form.value || "0") * 100),
    );
    const contactIdBig = form.contactId ? BigInt(form.contactId) : undefined;
    const closeDateTs = form.closeDate
      ? BigInt(new Date(form.closeDate).getTime()) * 1_000_000n
      : undefined;

    const input: DealInput = {
      name: form.name,
      value: valueInCents,
      stage: form.stage,
      owner: identity.getPrincipal(),
      contactId: contactIdBig,
      closeDate: closeDateTs,
    };

    if (isEdit && deal) {
      updateDeal.mutate(
        { id: deal.id, input: { ...input, owner: deal.owner } },
        {
          onSuccess: () => {
            toast.success("Deal updated");
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update deal"),
        },
      );
    } else {
      createDeal.mutate(input, {
        onSuccess: () => {
          toast.success("Deal created");
          onSuccess?.();
        },
        onError: () => toast.error("Failed to create deal"),
      });
    }
  }

  const isPending = createDeal.isPending || updateDeal.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-ocid="deal-form">
      <div className="space-y-1.5">
        <Label htmlFor="df-name">Deal Name *</Label>
        <Input
          id="df-name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Acme Corp — Enterprise Plan"
          required
          data-ocid="deal-name-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="df-value">Value ($)</Label>
        <Input
          id="df-value"
          type="number"
          min="0"
          step="0.01"
          value={form.value}
          onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
          placeholder="5000.00"
          data-ocid="deal-value-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Stage</Label>
        <Select
          value={form.stage}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, stage: v as DealStage }))
          }
        >
          <SelectTrigger data-ocid="deal-stage-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Linked Contact</Label>
        <Select
          value={form.contactId || "none"}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, contactId: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger data-ocid="deal-contact-select">
            <SelectValue placeholder="No contact linked" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No contact</SelectItem>
            {contacts.map((c) => (
              <SelectItem key={c.id.toString()} value={c.id.toString()}>
                {c.name} {c.company ? `· ${c.company}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="df-closedate">Expected Close Date</Label>
        <Input
          id="df-closedate"
          type="date"
          value={form.closeDate}
          onChange={(e) =>
            setForm((p) => ({ ...p, closeDate: e.target.value }))
          }
          data-ocid="deal-closedate-input"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || !form.name.trim()}
          data-ocid="deal-form-submit"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Deal"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
