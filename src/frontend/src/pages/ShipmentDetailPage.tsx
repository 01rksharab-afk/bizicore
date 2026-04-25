import { CourierProvider, ShipmentStatus } from "@/backend";
import type { Shipment } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TrackingTimeline } from "@/components/logistics/TrackingTimeline";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteShipment,
  useShipment,
  useTrackShipment,
  useUpdateShipmentStatus,
} from "@/hooks/useLogistics";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Box,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  User,
  Weight,
} from "lucide-react";
import { useState } from "react";
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

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-medium mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShipmentDetailPage() {
  const { shipmentId } = useParams({ strict: false }) as { shipmentId: string };
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const navigate = useNavigate();

  const id = BigInt(shipmentId ?? "0");

  const { data: shipment, isLoading } = useShipment(orgId, id);
  const { data: tracking, isLoading: isTrackingLoading } = useTrackShipment(
    orgId,
    id,
  );
  const updateStatus = useUpdateShipmentStatus(orgId);
  const deleteShipment = useDeleteShipment(orgId);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {["sk0", "sk1", "sk2", "sk3", "sk4"].map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-4"
        data-ocid="shipment-not-found"
      >
        <Package className="size-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">Shipment not found.</p>
        <Link to="/logistics">
          <Button variant="outline" size="sm">
            Back to Logistics
          </Button>
        </Link>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[shipment.status];
  const nextLabel = NEXT_LABEL[shipment.status];

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;
    try {
      await updateStatus.mutateAsync({ id: shipment.id, status: nextStatus });
      toast.success(`Status updated to ${STATUS_LABEL[nextStatus]}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteShipment.mutateAsync(shipment.id);
      toast.success("Shipment deleted");
      navigate({ to: "/logistics" });
    } catch {
      toast.error("Failed to delete shipment");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <div
      className="space-y-6 max-w-5xl fade-in"
      data-ocid="shipment-detail-page"
    >
      <Breadcrumb
        items={[
          { label: "Logistics", href: "/logistics" },
          { label: `#SHP-${shipment.id.toString().padStart(4, "0")}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/logistics">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Back to Logistics"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-semibold text-foreground">
                {shipment.consigneeName}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CLASSES[shipment.status]}`}
              >
                {STATUS_LABEL[shipment.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Shipment #SHP-{shipment.id.toString().padStart(4, "0")} · Created{" "}
              {formatDate(shipment.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2" data-ocid="shipment-actions">
          {nextLabel && nextStatus && (
            <Button
              size="sm"
              disabled={updateStatus.isPending}
              onClick={handleAdvanceStatus}
              data-ocid="advance-status-btn"
            >
              <RefreshCw className="size-4 mr-1.5" />
              {updateStatus.isPending ? "Updating…" : nextLabel}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
            data-ocid="delete-shipment-btn"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Consignee Info */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="text-sm font-semibold text-foreground">
                Consignee Details
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={User}
                label="Consignee Name"
                value={shipment.consigneeName}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={shipment.consigneePhone}
              />
              <div className="sm:col-span-2">
                <InfoRow
                  icon={MapPin}
                  label="Delivery Address"
                  value={shipment.consigneeAddress}
                />
              </div>
            </div>
          </section>

          {/* Courier & Package */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="text-sm font-semibold text-foreground">
                Courier &amp; Package
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={Truck}
                label="Courier Provider"
                value={COURIER_LABEL[shipment.courierProvider]}
              />
              {shipment.trackingNo && (
                <InfoRow
                  icon={Package}
                  label="Tracking Number"
                  value={shipment.trackingNo}
                />
              )}
              {shipment.transporterName && (
                <InfoRow
                  icon={Truck}
                  label="Transporter"
                  value={shipment.transporterName}
                />
              )}
              {shipment.transporterPhone && (
                <InfoRow
                  icon={Phone}
                  label="Transporter Phone"
                  value={shipment.transporterPhone}
                />
              )}
              {shipment.weight !== undefined && (
                <InfoRow
                  icon={Weight}
                  label="Weight"
                  value={`${shipment.weight} kg`}
                />
              )}
              {shipment.dimensions && (
                <InfoRow
                  icon={Box}
                  label="Dimensions"
                  value={`${shipment.dimensions} cm`}
                />
              )}
              {shipment.docId !== undefined && (
                <InfoRow
                  icon={Package}
                  label="Linked Document ID"
                  value={shipment.docId.toString()}
                />
              )}
            </div>
          </section>

          {/* Tracking Timeline */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Tracking Timeline
              </h2>
              {tracking?.trackingNo && (
                <Badge variant="outline" className="text-xs font-mono">
                  {tracking.trackingNo}
                </Badge>
              )}
            </div>
            <div className="p-5">
              {isTrackingLoading ? (
                <div className="space-y-4">
                  {["t0", "t1", "t2"].map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <TrackingTimeline events={tracking?.events ?? []} />
              )}
            </div>
          </section>
        </div>

        {/* Right: Status card */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Status Overview
            </h3>
            <div className="flex flex-col gap-2">
              {Object.values(ShipmentStatus).map((s) => {
                const isActive = s === shipment.status;
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        isActive ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                    {STATUS_LABEL[s]}
                    {isActive && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {shipment.deliveredAt && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Delivered on</p>
              <p className="text-sm font-semibold text-accent mt-0.5">
                {formatDate(shipment.deliveredAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Delete dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(v) => !v && setShowDeleteDialog(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Shipment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shipment for{" "}
              <strong>{shipment.consigneeName}</strong>? This cannot be undone.
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
  );
}
