import type { CreateShipmentInput } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShipmentForm } from "@/components/logistics/ShipmentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateShipment } from "@/hooks/useLogistics";
import { useActiveOrg } from "@/hooks/useOrg";
import { useNavigate } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";

export default function NewShipmentPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const navigate = useNavigate();
  const createShipment = useCreateShipment(orgId);

  const handleSubmit = async (input: CreateShipmentInput) => {
    try {
      const shipment = await createShipment.mutateAsync(input);
      toast.success("Shipment created successfully");
      navigate({
        to: "/logistics/$shipmentId",
        params: { shipmentId: shipment.id.toString() },
      });
    } catch {
      toast.error("Failed to create shipment");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl fade-in">
      <Breadcrumb
        items={[
          { label: "Logistics", href: "/logistics" },
          { label: "New Shipment" },
        ]}
      />

      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <PackagePlus className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            New Shipment
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a shipment and assign it to a courier provider
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="font-display text-base font-semibold text-foreground">
            Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ShipmentForm
            onSubmit={handleSubmit}
            isLoading={createShipment.isPending}
            onCancel={() => navigate({ to: "/logistics" })}
            submitLabel="Create Shipment"
          />
        </CardContent>
      </Card>
    </div>
  );
}
