import type { ContactId, ContactInput, OrgId } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContact, useCreateContact, useUpdateContact } from "@/hooks/useCRM";
import { useActiveOrg } from "@/hooks/useOrg";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ContactFormProps {
  orgId: OrgId | null;
  contactId?: ContactId;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({
  orgId,
  contactId,
  onSuccess,
  onCancel,
}: ContactFormProps) {
  const navigate = useNavigate();
  const isEdit = !!contactId;

  const { data: existing } = useContact(orgId, contactId ?? null);
  const createContact = useCreateContact(orgId);
  const updateContact = useUpdateContact(orgId);

  const [form, setForm] = useState<ContactInput>({
    name: "",
    email: "",
    phone: "",
    company: "",
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        email: existing.email ?? "",
        phone: existing.phone ?? "",
        company: existing.company ?? "",
        tags: existing.tags,
      });
      setTagsInput(existing.tags.join(", "));
    }
  }, [existing]);

  function handleChange(field: keyof ContactInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: ContactInput = {
      ...form,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
    };

    if (isEdit && contactId) {
      updateContact.mutate(
        { id: contactId, input },
        {
          onSuccess: () => {
            toast.success("Contact updated");
            onSuccess
              ? onSuccess()
              : navigate({ to: `/crm/contacts/${contactId}` });
          },
          onError: () => toast.error("Failed to update contact"),
        },
      );
    } else {
      createContact.mutate(input, {
        onSuccess: (newId) => {
          toast.success("Contact created");
          onSuccess ? onSuccess() : navigate({ to: `/crm/contacts/${newId}` });
        },
        onError: () => toast.error("Failed to create contact"),
      });
    }
  }

  const isPending = createContact.isPending || updateContact.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-ocid="contact-form"
    >
      <div className="space-y-1.5">
        <Label htmlFor="cf-name">Full Name *</Label>
        <Input
          id="cf-name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Jane Smith"
          required
          data-ocid="contact-name-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-email">Email</Label>
        <Input
          id="cf-email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="jane@company.com"
          data-ocid="contact-email-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-phone">Phone</Label>
        <Input
          id="cf-phone"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="+1 555 000 0000"
          data-ocid="contact-phone-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-company">Company</Label>
        <Input
          id="cf-company"
          value={form.company}
          onChange={(e) => handleChange("company", e.target.value)}
          placeholder="Acme Corp"
          data-ocid="contact-company-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-tags">Tags</Label>
        <Input
          id="cf-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="customer, vip, partner (comma-separated)"
          data-ocid="contact-tags-input"
        />
        <p className="text-xs text-muted-foreground">
          Separate tags with commas
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || !form.name.trim()}
          data-ocid="contact-form-submit"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Contact"}
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

// Page wrappers for routing
export function NewContactPage() {
  const { activeOrg } = useActiveOrg();
  const navigate = useNavigate();
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-display font-semibold text-foreground">
        Add Contact
      </h1>
      <div className="bg-card border border-border rounded-lg p-6">
        <ContactForm
          orgId={activeOrg?.id ?? null}
          onSuccess={() => navigate({ to: "/crm/contacts" })}
          onCancel={() => navigate({ to: "/crm/contacts" })}
        />
      </div>
    </div>
  );
}

export function EditContactPage() {
  const { contactId } = useParams({ strict: false }) as { contactId: string };
  const { activeOrg } = useActiveOrg();
  const navigate = useNavigate();
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-display font-semibold text-foreground">
        Edit Contact
      </h1>
      <div className="bg-card border border-border rounded-lg p-6">
        <ContactForm
          orgId={activeOrg?.id ?? null}
          contactId={BigInt(contactId ?? "0") as ContactId}
          onSuccess={() => navigate({ to: `/crm/contacts/${contactId}` })}
          onCancel={() => navigate({ to: `/crm/contacts/${contactId}` })}
        />
      </div>
    </div>
  );
}
