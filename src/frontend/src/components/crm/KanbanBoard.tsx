import {
  type Contact,
  type Deal,
  type DealId,
  DealStage,
  type OrgId,
} from "@/backend";
import { Button } from "@/components/ui/button";
import { useContacts, useDeleteDeal } from "@/hooks/useCRM";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  DollarSign,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAGE_CONFIG: Record<
  DealStage,
  { label: string; color: string; headerBg: string; dot: string }
> = {
  [DealStage.prospect]: {
    label: "Prospect",
    color: "text-primary",
    headerBg: "bg-primary/10 border-primary/20",
    dot: "bg-primary",
  },
  [DealStage.qualified]: {
    label: "Qualified",
    color: "text-accent",
    headerBg: "bg-accent/10 border-accent/20",
    dot: "bg-accent",
  },
  [DealStage.negotiation]: {
    label: "Negotiation",
    color: "text-chart-4",
    headerBg: "bg-chart-4/10 border-chart-4/20",
    dot: "bg-chart-4",
  },
  [DealStage.closedWon]: {
    label: "Closed Won",
    color: "text-chart-2",
    headerBg: "bg-chart-2/10 border-chart-2/20",
    dot: "bg-chart-2",
  },
  [DealStage.closedLost]: {
    label: "Closed Lost",
    color: "text-destructive",
    headerBg: "bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
  },
};

const STAGE_ORDER: DealStage[] = [
  DealStage.prospect,
  DealStage.qualified,
  DealStage.negotiation,
  DealStage.closedWon,
  DealStage.closedLost,
];

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
  });
}

interface DealCardProps {
  deal: Deal;
  contact?: Contact;
  onSelect: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

function DealCard({
  deal,
  contact,
  onSelect,
  onEdit,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: DealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className="bg-card border border-border rounded-lg p-3.5 space-y-2.5 hover:border-accent/40 hover:shadow-md transition-all duration-150 group"
      data-ocid="deal-card"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="font-medium text-sm text-foreground leading-snug line-clamp-2 flex-1 text-left hover:text-accent transition-colors"
          onClick={onSelect}
        >
          {deal.name}
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Deal actions"
          >
            <MoreHorizontal className="size-3.5 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[130px]">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted w-full text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit();
                }}
                data-ocid="deal-edit-btn"
              >
                <Pencil className="size-3" />
                Edit
              </button>
              {onMoveLeft && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted w-full text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onMoveLeft();
                  }}
                >
                  ← Move left
                </button>
              )}
              {onMoveRight && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted w-full text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onMoveRight();
                  }}
                >
                  Move right →
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  data-ocid="deal-delete-btn"
                >
                  <Trash2 className="size-3" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm font-semibold text-accent">
        <DollarSign className="size-3.5" />
        {formatCents(deal.value)}
      </div>

      <div className="space-y-1">
        {contact && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3" />
            <span className="truncate">{contact.name}</span>
          </div>
        )}
        {deal.closeDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            <span>{formatDate(deal.closeDate)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

interface KanbanColumnProps {
  stage: DealStage;
  deals: Deal[];
  contactsMap: Map<string, Contact>;
  onSelectDeal: (id: DealId) => void;
  onEditDeal: (deal: Deal) => void;
  onMoveStage?: (id: DealId, stage: DealStage) => void;
  canDelete: boolean;
  orgId: OrgId | null;
}

function KanbanColumn({
  stage,
  deals,
  contactsMap,
  onSelectDeal,
  onEditDeal,
  onMoveStage,
  canDelete,
  orgId,
}: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  const deleteDeal = useDeleteDeal(orgId);
  const stageIdx = STAGE_ORDER.indexOf(stage);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0n);

  function handleDelete(id: DealId) {
    if (!confirm("Delete this deal?")) return;
    deleteDeal.mutate(id, {
      onSuccess: () => toast.success("Deal deleted"),
      onError: () => toast.error("Failed to delete deal"),
    });
  }

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 ${config.headerBg}`}
      >
        <span className={`size-2 rounded-full ${config.dot}`} />
        <span className={`text-xs font-semibold ${config.color} flex-1`}>
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {deals.length}
        </span>
      </div>

      {/* Stage total */}
      <div className="px-3 py-1.5 bg-muted/30 border-x border-border">
        <span className="text-xs text-muted-foreground">
          {formatCents(totalValue)} total
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 bg-muted/20 border border-t-0 border-border rounded-b-lg p-2 space-y-2 min-h-[200px]">
        {deals.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50">
            No deals
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id.toString()}
              deal={deal}
              contact={
                deal.contactId
                  ? contactsMap.get(deal.contactId.toString())
                  : undefined
              }
              onSelect={() => onSelectDeal(deal.id)}
              onEdit={() => onEditDeal(deal)}
              onDelete={canDelete ? () => handleDelete(deal.id) : undefined}
              onMoveLeft={
                onMoveStage && stageIdx > 0
                  ? () => onMoveStage(deal.id, STAGE_ORDER[stageIdx - 1])
                  : undefined
              }
              onMoveRight={
                onMoveStage && stageIdx < STAGE_ORDER.length - 1
                  ? () => onMoveStage(deal.id, STAGE_ORDER[stageIdx + 1])
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  deals: Deal[];
  onMoveStage?: (id: DealId, stage: DealStage) => void;
  onSelectDeal: (id: DealId) => void;
  onEditDeal: (deal: Deal) => void;
  canDelete: boolean;
  orgId: OrgId | null;
}

export function KanbanBoard({
  deals,
  onMoveStage,
  onSelectDeal,
  onEditDeal,
  canDelete,
  orgId,
}: KanbanBoardProps) {
  const { data: contacts = [] } = useContacts(orgId);
  const contactsMap = new Map(contacts.map((c) => [c.id.toString(), c]));

  const dealsByStage = new Map<DealStage, Deal[]>();
  for (const stage of STAGE_ORDER) {
    dealsByStage.set(stage, []);
  }
  for (const deal of deals) {
    const list = dealsByStage.get(deal.stage) ?? [];
    list.push(deal);
    dealsByStage.set(deal.stage, list);
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1"
      data-ocid="kanban-board"
    >
      {STAGE_ORDER.map((stage) => (
        <KanbanColumn
          key={stage}
          stage={stage}
          deals={dealsByStage.get(stage) ?? []}
          contactsMap={contactsMap}
          onSelectDeal={onSelectDeal}
          onEditDeal={onEditDeal}
          onMoveStage={onMoveStage}
          canDelete={canDelete}
          orgId={orgId}
        />
      ))}
    </div>
  );
}
