import type { TrackingEvent } from "@/backend";
import { ShipmentStatus } from "@/backend";
import { CheckCircle2, Circle, Clock, MapPin } from "lucide-react";

function formatTs(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  [ShipmentStatus.pending]: "Order Placed",
  [ShipmentStatus.picked]: "Picked Up",
  [ShipmentStatus.inTransit]: "In Transit",
  [ShipmentStatus.outForDelivery]: "Out for Delivery",
  [ShipmentStatus.delivered]: "Delivered",
  [ShipmentStatus.returned]: "Returned",
  [ShipmentStatus.cancelled]: "Cancelled",
};

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-10 gap-2"
        data-ocid="tracking-empty"
      >
        <Clock className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No tracking events yet</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <ol
      className="relative space-y-0"
      aria-label="Shipment tracking timeline"
      data-ocid="tracking-timeline"
    >
      {sorted.map((event, idx) => {
        const isCurrent = idx === 0;
        const isDelivered = event.status === ShipmentStatus.delivered;
        const isCancelled = event.status === ShipmentStatus.cancelled;
        const isLast = idx === sorted.length - 1;

        return (
          <li
            key={`${event.timestamp}-${idx}`}
            className="relative flex gap-4 pb-6 last:pb-0"
            data-ocid="tracking-event"
          >
            {/* Vertical line */}
            {!isLast && (
              <span
                className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-border"
                aria-hidden="true"
              />
            )}

            {/* Dot */}
            <span
              className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                isCurrent
                  ? isDelivered
                    ? "border-accent bg-accent/10 text-accent"
                    : isCancelled
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {isCurrent && isDelivered ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <Circle className="size-3" />
              )}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[event.status] ?? event.status}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Current
                  </span>
                )}
              </div>
              <p
                className={`text-sm mt-0.5 ${
                  isCurrent ? "text-foreground/80" : "text-muted-foreground"
                }`}
              >
                {event.description}
              </p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTs(event.timestamp)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
