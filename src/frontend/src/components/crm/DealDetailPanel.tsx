import { type Deal, type DealId, DealStage, type OrgId } from "@/backend";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddDealNote,
  useContact,
  useDeal,
  useDealNotes,
  useDealStageHistory,
} from "@/hooks/useCRM";
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Pencil,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAGE_LABELS: Record<DealStage, string> = {
  [DealStage.prospect]: "Prospect",
  [DealStage.qualified]: "Qualified",
  [DealStage.negotiation]: "Negotiation",
  [DealStage.closedWon]: "Closed Won",
  [DealStage.closedLost]: "Closed Lost",
};

function formatCents(cents: bigint) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(Number(cents) / 100);
}

function formatDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface DealDetailPanelProps {
  orgId: OrgId | null;
  dealId: DealId;
  onEdit: (deal: Deal) => void;
}

export function DealDetailPanel({
  orgId,
  dealId,
  onEdit,
}: DealDetailPanelProps) {
  const { data: deal, isLoading } = useDeal(orgId, dealId);
  const { data: notes = [], isLoading: notesLoading } = useDealNotes(
    orgId,
    dealId,
  );
  const { data: stageHistory = [] } = useDealStageHistory(orgId, dealId);
  const { data: linkedContact } = useContact(orgId, deal?.contactId ?? null);
  const addNote = useAddDealNote(orgId);

  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  function handleAddNote() {
    if (!noteText.trim()) return;
    addNote.mutate(
      { dealId, text: noteText.trim() },
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
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Deal not found.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground leading-snug">
              {deal.name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-semibold text-accent flex items-center gap-1">
                <DollarSign className="size-3.5" />
                {formatCents(deal.value)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {STAGE_LABELS[deal.stage]}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(deal)}
            data-ocid="deal-detail-edit-btn"
          >
            <Pencil className="size-3.5 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {linkedContact && (
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-foreground truncate">
                {linkedContact.name}
              </span>
            </div>
          )}
          {deal.closeDate && (
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                {formatDate(deal.closeDate)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">
              Created {formatDate(deal.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Stage history */}
      {stageHistory.length > 0 && (
        <div className="py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Stage History
          </h3>
          <div className="space-y-2">
            {stageHistory.map((event, idx) => (
              <div
                key={`${event.dealId}-${idx}`}
                className="flex items-center gap-2 text-xs"
              >
                {event.fromStage && (
                  <>
                    <span className="text-muted-foreground">
                      {STAGE_LABELS[event.fromStage]}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                  </>
                )}
                <span className="text-foreground font-medium">
                  {STAGE_LABELS[event.toStage]}
                </span>
                <span className="text-muted-foreground ml-auto">
                  {formatDate(event.changedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Notes
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAddingNote((v) => !v)}
            data-ocid="add-deal-note-btn"
          >
            + Add Note
          </Button>
        </div>

        {addingNote && (
          <div className="mb-4 space-y-2">
            <Textarea
              placeholder="Add a note about this deal…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              data-ocid="deal-note-input"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddNote}
                disabled={addNote.isPending || !noteText.trim()}
                data-ocid="save-deal-note-btn"
              >
                Save Note
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
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
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center" data-ocid="deal-notes-empty">
            <MessageSquare className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...notes].reverse().map((note) => (
              <div
                key={note.id.toString()}
                className="bg-muted/30 rounded-lg p-3"
                data-ocid="deal-note-row"
              >
                <p className="text-sm text-foreground">{note.text}</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
