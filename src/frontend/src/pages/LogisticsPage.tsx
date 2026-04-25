import type { Shipment } from "@/backend";
import { CourierProvider, ShipmentStatus } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteShipment,
  useShipments,
  useUpdateShipmentStatus,
} from "@/hooks/useLogistics";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, Package, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_LABEL: Record<ShipmentStatus, string> = {
  [ShipmentStatus.pending]: "Pending",
  [ShipmentStatus.picked]: "Picked",
  [ShipmentStatus.inTransit]: "In Transit",
  [ShipmentStatus.outForDelivery]: "Out for Delivery",
  [ShipmentStatus.delivered]: "Delivered",
  [ShipmentStatus.returned]: "Returned",
  [ShipmentStatus.cancelled]: "Cancelled",
};

const STATUS_CLASSES: Record<ShipmentStatus, string> = {
  [ShipmentStatus.pending]:
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-400/30",
  [ShipmentStatus.picked]:
    "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-400/30",
  [ShipmentStatus.inTransit]:
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-400/30",
  [ShipmentStatus.outForDelivery]:
    "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-400/30",
  [ShipmentStatus.delivered]: "bg-accent/15 text-accent border-accent/30",
  [ShipmentStatus.returned]:
    "bg-destructive/15 text-destructive border-destructive/30",
  [ShipmentStatus.cancelled]: "bg-muted text-muted-foreground border-border",
};

const COURIER_LABEL: Record<CourierProvider, string> = {
  [CourierProvider.delhivery]: "Delhivery",
  [CourierProvider.bluedart]: "Bluedart",
  [CourierProvider.fedex]: "FedEx",
  [CourierProvider.manual]: "Manual",
};

function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Quick Status Update ─────────────────────────────────────────────────────
const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  [ShipmentStatus.pending]: ShipmentStatus.picked,
  [ShipmentStatus.picked]: ShipmentStatus.inTransit,
  [ShipmentStatus.inTransit]: ShipmentStatus.outForDelivery,
  [ShipmentStatus.outForDelivery]: ShipmentStatus.delivered,
};

const NEXT_LABEL: Partial<Record<ShipmentStatus, string>> = {
  [ShipmentStatus.pending]: "Mark Picked",
  [ShipmentStatus.picked]: "Mark In Transit",
  [ShipmentStatus.inTransit]: "Mark Out for Delivery",
  [ShipmentStatus.outForDelivery]: "Mark Delivered",
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  count,
  colorClass,
}: {
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span
        className={`text-2xl font-display font-bold tabular-nums ${colorClass}`}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LogisticsPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const navigate = useNavigate();

  const { data: shipments = [], isLoading } = useShipments(orgId);
  const updateStatus = useUpdateShipmentStatus(orgId);
  const deleteShipment = useDeleteShipment(orgId);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courierFilter, setCourierFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Shipment | null>(null);

  const filtered = useMemo(() => {
    let list = shipments;
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (courierFilter !== "all") {
      list = list.filter((s) => s.courierProvider === courierFilter);
    }
    return list;
  }, [shipments, statusFilter, courierFilter]);

  const summaryCount = (status: ShipmentStatus) =>
    shipments.filter((s) => s.status === status).length;

  const handleAdvanceStatus = async (shipment: Shipment) => {
    const next = NEXT_STATUS[shipment.status];
    if (!next) return;
    try {
      await updateStatus.mutateAsync({ id: shipment.id, status: next });
      toast.success(`Status updated to ${STATUS_LABEL[next]}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteShipment.mutateAsync(deleteTarget.id);
      toast.success("Shipment deleted");
    } catch {
      toast.error("Failed to delete shipment");
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (ts: bigint) =>
    new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <SubscriptionGate requiredPlan="pro" feature="Logistics & Shipments">
      <div className="space-y-5 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Logistics &amp; Shipments
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track and manage all your outbound shipments
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate({ to: "/logistics/new" })}
            data-ocid="new-shipment-btn"
          >
            <Plus className="size-4 mr-1.5" />
            New Shipment
          </Button>
        </div>

        {/* Summary cards */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          data-ocid="shipments-summary"
        >
          <SummaryCard
            label="Total Shipments"
            count={shipments.length}
            colorClass="text-foreground"
          />
          <SummaryCard
            label="In Transit"
            count={summaryCount(ShipmentStatus.inTransit)}
            colorClass="text-cyan-600 dark:text-cyan-400"
          />
          <SummaryCard
            label="Delivered"
            count={summaryCount(ShipmentStatus.delivered)}
            colorClass="text-accent"
          />
          <SummaryCard
            label="Pending"
            count={summaryCount(ShipmentStatus.pending)}
            colorClass="text-yellow-600 dark:text-yellow-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2" data-ocid="shipments-filters">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-44 h-9 text-sm"
              data-ocid="status-filter"
            >
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(ShipmentStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courierFilter} onValueChange={setCourierFilter}>
            <SelectTrigger
              className="w-40 h-9 text-sm"
              data-ocid="courier-filter"
            >
              <SelectValue placeholder="All Couriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Couriers</SelectItem>
              {Object.values(CourierProvider).map((p) => (
                <SelectItem key={p} value={p}>
                  {COURIER_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Consignee</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Tracking No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  ["r0", "r1", "r2", "r3", "r4"].map((k) => (
                    <TableRow key={k}>
                      {["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"].map(
                        (c) => (
                          <TableCell key={`${k}-${c}`}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-16"
                      data-ocid="shipments-empty"
                    >
                      <Package className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="font-medium text-foreground text-sm">
                        No shipments found
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {statusFilter !== "all" || courierFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first shipment to get started"}
                      </p>
                      {statusFilter === "all" && courierFilter === "all" && (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => navigate({ to: "/logistics/new" })}
                        >
                          <Plus className="size-4 mr-1.5" /> New Shipment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((shipment) => (
                    <TableRow
                      key={shipment.id.toString()}
                      className="group"
                      data-ocid="shipment-row"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #SHP-{shipment.id.toString().padStart(4, "0")}
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/logistics/$shipmentId"
                          params={{ shipmentId: shipment.id.toString() }}
                          className="font-medium text-foreground hover:text-accent transition-colors"
                        >
                          {shipment.consigneeName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shipment.consigneePhone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {COURIER_LABEL[shipment.courierProvider]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {shipment.trackingNo ?? (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={shipment.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(shipment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            asChild
                            aria-label="View shipment"
                            data-ocid="view-shipment-btn"
                          >
                            <Link
                              to="/logistics/$shipmentId"
                              params={{ shipmentId: shipment.id.toString() }}
                            >
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                          {NEXT_STATUS[shipment.status] && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-primary"
                              onClick={() => handleAdvanceStatus(shipment)}
                              disabled={updateStatus.isPending}
                              aria-label={NEXT_LABEL[shipment.status]}
                              title={NEXT_LABEL[shipment.status]}
                              data-ocid="advance-status-btn"
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(shipment)}
                            aria-label="Delete shipment"
                            data-ocid="delete-shipment-btn"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(v) => !v && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">
                Delete Shipment
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete shipment for{" "}
                <strong>{deleteTarget?.consigneeName}</strong>? This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="confirm-delete-shipment"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SubscriptionGate>
  );
}
