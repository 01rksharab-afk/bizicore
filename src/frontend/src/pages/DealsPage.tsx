import type { Deal, DealId, DealStage } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DealDetailPanel } from "@/components/crm/DealDetailPanel";
import { DealForm } from "@/components/crm/DealForm";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { PipelineSummary } from "@/components/crm/PipelineSummary";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeals,
  useMyRole,
  usePipelineSummary,
  useUpdateDeal,
} from "@/hooks/useCRM";
import { useActiveOrg } from "@/hooks/useOrg";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function DealsPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;

  const { data: deals = [], isLoading } = useDeals(orgId);
  const { data: pipeline } = usePipelineSummary(orgId);
  const { data: role } = useMyRole(orgId);
  const updateDeal = useUpdateDeal(orgId);

  const canWrite = role === "owner" || role === "admin" || role === "member";
  const canDelete = role === "owner" || role === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<DealId | null>(null);

  function handleMoveStage(dealId: DealId, toStage: DealStage) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    updateDeal.mutate({
      id: dealId,
      input: {
        name: deal.name,
        value: deal.value,
        stage: toStage,
        owner: deal.owner,
        contactId: deal.contactId,
        closeDate: deal.closeDate,
      },
    });
  }

  return (
    <div className="space-y-5 h-full flex flex-col">
      <Breadcrumb items={[{ label: "CRM" }, { label: "Deals" }]} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Deal Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading…"
              : `${deals.length} deal${deals.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            data-ocid="add-deal-btn"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Deal
          </Button>
        )}
      </div>

      {/* Pipeline summary bar */}
      {pipeline && <PipelineSummary summary={pipeline} />}

      {/* Kanban board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[
            "prospect",
            "qualified",
            "negotiation",
            "closedWon",
            "closedLost",
          ].map((stage) => (
            <div key={stage} className="w-64 shrink-0 space-y-3">
              <Skeleton className="h-8 w-32" />
              {["a", "b", "c"].map((s) => (
                <Skeleton
                  key={`${stage}-${s}`}
                  className="h-28 w-full rounded-lg"
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          deals={deals}
          onMoveStage={canWrite ? handleMoveStage : undefined}
          onSelectDeal={(id) => setSelectedDealId(id)}
          onEditDeal={(deal) => setEditingDeal(deal)}
          canDelete={canDelete}
          orgId={orgId}
        />
      )}

      {/* Create deal sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">New Deal</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <DealForm
              orgId={orgId}
              onSuccess={() => setCreateOpen(false)}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit deal sheet */}
      <Sheet
        open={!!editingDeal}
        onOpenChange={(open) => {
          if (!open) setEditingDeal(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Deal</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingDeal && (
              <DealForm
                orgId={orgId}
                deal={editingDeal}
                onSuccess={() => setEditingDeal(null)}
                onCancel={() => setEditingDeal(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Deal detail panel */}
      <Sheet
        open={!!selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedDealId && (
            <DealDetailPanel
              orgId={orgId}
              dealId={selectedDealId}
              onEdit={(deal) => {
                setSelectedDealId(null);
                setEditingDeal(deal);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
