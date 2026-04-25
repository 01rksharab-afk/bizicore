import type { CreateShipmentInput } from "@/backend";
import { CourierProvider } from "@/backend";
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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export interface ShipmentFormValues {
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
  courierProvider: CourierProvider;
  trackingNo: string;
  transporterName: string;
  transporterPhone: string;
  weight: string;
  dimensions: string;
  docId: string;
}

interface ShipmentFormProps {
  initialData?: Partial<ShipmentFormValues>;
  onSubmit: (input: CreateShipmentInput) => void;
  isLoading: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

const COURIER_LABELS: Record<CourierProvider, string> = {
  [CourierProvider.delhivery]: "Delhivery",
  [CourierProvider.bluedart]: "Bluedart",
  [CourierProvider.fedex]: "FedEx",
  [CourierProvider.manual]: "Manual",
};

const DEFAULT_VALUES: ShipmentFormValues = {
  consigneeName: "",
  consigneePhone: "",
  consigneeAddress: "",
  courierProvider: CourierProvider.manual,
  trackingNo: "",
  transporterName: "",
  transporterPhone: "",
  weight: "",
  dimensions: "",
  docId: "",
};

export function ShipmentForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel,
  submitLabel = "Create Shipment",
}: ShipmentFormProps) {
  const [form, setForm] = useState<ShipmentFormValues>({
    ...DEFAULT_VALUES,
    ...initialData,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ShipmentFormValues, string>>
  >({});

  const set = (field: keyof ShipmentFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShipmentFormValues, string>> = {};
    if (!form.consigneeName.trim()) newErrors.consigneeName = "Required";
    if (!form.consigneePhone.trim()) newErrors.consigneePhone = "Required";
    if (!form.consigneeAddress.trim()) newErrors.consigneeAddress = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const input: CreateShipmentInput = {
      consigneeName: form.consigneeName.trim(),
      consigneePhone: form.consigneePhone.trim(),
      consigneeAddress: form.consigneeAddress.trim(),
      courierProvider: form.courierProvider,
      trackingNo: form.trackingNo.trim() || undefined,
      transporterName: form.transporterName.trim() || undefined,
      transporterPhone: form.transporterPhone.trim() || undefined,
      weight: form.weight ? Number.parseFloat(form.weight) : undefined,
      dimensions: form.dimensions.trim() || undefined,
      docId: form.docId ? BigInt(form.docId) : undefined,
    };
    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Consignee Details */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            1
          </span>
          Consignee Details
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sf-name">Full Name *</Label>
            <Input
              id="sf-name"
              value={form.consigneeName}
              onChange={(e) => set("consigneeName", e.target.value)}
              placeholder="Rajesh Kumar"
              data-ocid="shipment-consignee-name"
              aria-invalid={!!errors.consigneeName}
            />
            {errors.consigneeName && (
              <p className="text-xs text-destructive">{errors.consigneeName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-phone">Phone *</Label>
            <Input
              id="sf-phone"
              value={form.consigneePhone}
              onChange={(e) => set("consigneePhone", e.target.value)}
              placeholder="+91 98765 43210"
              data-ocid="shipment-consignee-phone"
              aria-invalid={!!errors.consigneePhone}
            />
            {errors.consigneePhone && (
              <p className="text-xs text-destructive">
                {errors.consigneePhone}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-address">Delivery Address *</Label>
          <Textarea
            id="sf-address"
            value={form.consigneeAddress}
            onChange={(e) => set("consigneeAddress", e.target.value)}
            placeholder="123, MG Road, Bangalore, Karnataka 560001"
            rows={3}
            data-ocid="shipment-address"
            aria-invalid={!!errors.consigneeAddress}
          />
          {errors.consigneeAddress && (
            <p className="text-xs text-destructive">
              {errors.consigneeAddress}
            </p>
          )}
        </div>
      </fieldset>

      {/* Courier & Tracking */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            2
          </span>
          Courier & Tracking
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sf-courier">Courier Provider *</Label>
            <Select
              value={form.courierProvider}
              onValueChange={(v) => set("courierProvider", v)}
            >
              <SelectTrigger
                id="sf-courier"
                data-ocid="shipment-courier-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CourierProvider).map((p) => (
                  <SelectItem key={p} value={p}>
                    {COURIER_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-tracking">Tracking Number</Label>
            <Input
              id="sf-tracking"
              value={form.trackingNo}
              onChange={(e) => set("trackingNo", e.target.value)}
              placeholder="D123456789"
              data-ocid="shipment-tracking-no"
            />
          </div>
        </div>
      </fieldset>

      {/* Transporter */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            3
          </span>
          Transporter (Optional)
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sf-transporter-name">Transporter Name</Label>
            <Input
              id="sf-transporter-name"
              value={form.transporterName}
              onChange={(e) => set("transporterName", e.target.value)}
              placeholder="ABC Logistics Pvt. Ltd."
              data-ocid="shipment-transporter-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-transporter-phone">Transporter Phone</Label>
            <Input
              id="sf-transporter-phone"
              value={form.transporterPhone}
              onChange={(e) => set("transporterPhone", e.target.value)}
              placeholder="+91 98765 43210"
              data-ocid="shipment-transporter-phone"
            />
          </div>
        </div>
      </fieldset>

      {/* Package Details */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            4
          </span>
          Package Details (Optional)
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sf-weight">Weight (kg)</Label>
            <Input
              id="sf-weight"
              type="number"
              step="0.01"
              min="0"
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              placeholder="2.5"
              data-ocid="shipment-weight"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sf-dimensions">Dimensions (LxWxH cm)</Label>
            <Input
              id="sf-dimensions"
              value={form.dimensions}
              onChange={(e) => set("dimensions", e.target.value)}
              placeholder="30x20x15"
              data-ocid="shipment-dimensions"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-docid">Linked Document ID</Label>
          <Input
            id="sf-docid"
            type="number"
            min="0"
            value={form.docId}
            onChange={(e) => set("docId", e.target.value)}
            placeholder="Invoice / Challan ID"
            data-ocid="shipment-doc-id"
          />
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          data-ocid="shipment-submit-btn"
        >
          {isLoading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
