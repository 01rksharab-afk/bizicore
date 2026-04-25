import type { ContactId, InteractionKind } from "@/backend";
import { LeadStatus } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddInteractionNote,
  useContact,
  useDeleteContact,
  useInteractionNotes,
  useLeadByContact,
  useMyRole,
} from "@/hooks/useCRM";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LEAD_STATUS_STYLES: Record<string, string> = {
  new: "bg-primary/15 text-primary border-primary/30",
  qualified: "bg-accent/15 text-accent border-accent/30",
  converted: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  lost: "bg-destructive/15 text-destructive border-destructive/30",
};

const INTERACTION_ICONS: Record<InteractionKind, React.ReactNode> = {
  call: <Phone className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  meeting: <Calendar className="size-3.5" />,
  other: <MessageSquare className="size-3.5" />,
};

function formatDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContactDetailPage() {
  const { contactId } = useParams({ strict: false }) as { contactId: string };
  const navigate = useNavigate();
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const id = BigInt(contactId ?? "0") as ContactId;

  const { data: contact, isLoading } = useContact(orgId, id);
  const { data: notes = [], isLoading: notesLoading } = useInteractionNotes(
    orgId,
    id,
  );
  const { data: lead } = useLeadByContact(orgId, id);
  const { data: role } = useMyRole(orgId);
  const deleteContact = useDeleteContact(orgId);
  const addNote = useAddInteractionNote(orgId);

  const canDelete = role === "owner" || role === "admin";
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  function handleDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    deleteContact.mutate(id, {
      onSuccess: () => {
        toast.success("Contact deleted");
        navigate({ to: "/crm/contacts" });
      },
      onError: () => toast.error("Failed to delete contact"),
    });
  }

  function handleAddNote() {
    if (!noteText.trim()) return;
    addNote.mutate(
      {
        contactId: id,
        kind: "other" as InteractionKind,
        outcome: noteText.trim(),
        occurredAt: BigInt(Date.now()) * 1_000_000n,
      },
      {
        onSuccess: () => {
          setNoteText("");
          setAddingNote(false);
          toast.success("Note added");
        },
        onError: () => toast.error("Failed to add note"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-5 w-48" />
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-muted-foreground">Contact not found.</p>
        <Link to="/crm/contacts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3.5 mr-1.5" />
            Back to Contacts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb
        items={[
          { label: "CRM" },
          { label: "Contacts", href: "/crm/contacts" },
          { label: contact.name },
        ]}
      />

      {/* Header card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                {contact.name}
              </h1>
              {contact.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="size-3.5" />
                  {contact.company}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {lead && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                      LEAD_STATUS_STYLES[
                        (lead.status as string) === "new_" ? "new" : lead.status
                      ] ?? LEAD_STATUS_STYLES.new
                    }`}
                  >
                    {(lead.status as string) === "new_" ? "New" : lead.status}
                  </span>
                )}
                {lead && (
                  <span className="text-xs flex items-center gap-1 text-muted-foreground border border-border rounded-full px-2 py-0.5">
                    <Star className="size-3" />
                    Score {lead.score.toString()}
                  </span>
                )}
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/crm/contacts/$contactId/edit"
              params={{ contactId: contact.id.toString() }}
            >
              <Button variant="outline" size="sm" data-ocid="edit-contact-btn">
                Edit
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteContact.isPending}
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                data-ocid="delete-contact-btn"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-foreground truncate">
              {contact.email ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-foreground">{contact.phone ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Added {formatDate(contact.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Interaction timeline */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">
            Interaction Timeline
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingNote((v) => !v)}
            data-ocid="add-note-btn"
          >
            <Plus className="size-3.5 mr-1" />
            Add Note
          </Button>
        </div>

        {addingNote && (
          <div className="px-5 py-4 border-b border-border bg-muted/20 space-y-3">
            <Textarea
              placeholder="Describe the interaction…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="text-sm resize-none"
              rows={3}
              data-ocid="note-text-input"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={addNote.isPending || !noteText.trim()}
                data-ocid="save-note-btn"
              >
                Save Note
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingNote(false);
                  setNoteText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notesLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="py-10 text-center" data-ocid="notes-empty">
            <p className="text-sm text-muted-foreground">
              No interactions recorded yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...notes].reverse().map((note) => (
              <div
                key={note.id.toString()}
                className="flex gap-3 px-5 py-3.5"
                data-ocid="note-row"
              >
                <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-accent mt-0.5">
                  {INTERACTION_ICONS[note.kind] ?? (
                    <MessageSquare className="size-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground capitalize">
                      {note.kind}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.occurredAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{note.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
