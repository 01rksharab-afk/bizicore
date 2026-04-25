import type {
  CategoryId,
  CreateProductInput,
  OrgId,
  ProductId,
  UpdateProductInput,
} from "@/backend";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useInventory";
import { useState } from "react";

const TAX_OPTIONS = ["0", "5", "12", "18", "28"] as const;
const UNIT_OPTIONS = [
  { value: "PCS", label: "PCS — Pieces" },
  { value: "KG", label: "KG — Kilograms" },
  { value: "LTR", label: "LTR — Litres" },
  { value: "MTR", label: "MTR — Metres" },
  { value: "BOX", label: "BOX — Boxes" },
  { value: "SET", label: "SET — Sets" },
  { value: "NOS", label: "NOS — Numbers" },
  { value: "PKT", label: "PKT — Packets" },
  { value: "HRS", label: "HRS — Hours" },
] as const;

export interface ProductFormValues {
  name: string;
  description: string;
  hsnCode: string;
  partNumber: string;
  unit: string;
  rate: string;
  taxPercent: string;
  stockQty: string;
  categoryId: string;
  isActive: boolean;
}

interface ProductFormErrors {
  name?: string;
  hsnCode?: string;
  rate?: string;
  stockQty?: string;
}

interface ProductFormProps {
  orgId: OrgId;
  productId?: ProductId;
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (input: CreateProductInput | UpdateProductInput) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  submitLabel?: string;
}

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  description: "",
  hsnCode: "",
  partNumber: "",
  unit: "PCS",
  rate: "",
  taxPercent: "18",
  stockQty: "0",
  categoryId: "",
  isActive: true,
};

function validate(form: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  if (!form.name.trim()) errors.name = "Product name is required";
  if (form.hsnCode && !/^\d{4,8}$/.test(form.hsnCode.trim())) {
    errors.hsnCode = "HSN code must be 4–8 digits";
  }
  if (!form.rate || Number.parseFloat(form.rate) < 0) {
    errors.rate = "Rate must be a positive number";
  }
  if (form.stockQty !== "" && Number.parseInt(form.stockQty) < 0) {
    errors.stockQty = "Stock quantity cannot be negative";
  }
  return errors;
}

export function ProductForm({
  orgId,
  productId,
  initialValues,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = "Save",
}: ProductFormProps) {
  const { data: categories = [] } = useCategories(orgId);
  const [form, setForm] = useState<ProductFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ProductFormValues, boolean>>
  >({});

  const set = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key as keyof ProductFormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleBlur = (field: keyof ProductFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate({ ...form });
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Partial<Record<keyof ProductFormValues, boolean>> = {};
    for (const key of Object.keys(DEFAULT_VALUES)) {
      allTouched[key as keyof ProductFormValues] = true;
    }
    setTouched(allTouched);

    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const catId: CategoryId | undefined = form.categoryId
      ? BigInt(form.categoryId)
      : undefined;

    if (productId) {
      const input: UpdateProductInput = {
        id: productId,
        orgId,
        name: form.name.trim(),
        description: form.description,
        hsnCode: form.hsnCode.trim(),
        partNumber: form.partNumber.trim(),
        unit: form.unit,
        rate: Number.parseFloat(form.rate) || 0,
        taxPercent: BigInt(form.taxPercent || "0"),
        stockQty: BigInt(form.stockQty || "0"),
        categoryId: catId,
      };
      await onSubmit(input);
    } else {
      const input: CreateProductInput = {
        orgId,
        name: form.name.trim(),
        description: form.description,
        hsnCode: form.hsnCode.trim(),
        partNumber: form.partNumber.trim(),
        unit: form.unit,
        rate: Number.parseFloat(form.rate) || 0,
        taxPercent: BigInt(form.taxPercent || "0"),
        stockQty: BigInt(form.stockQty || "0"),
        categoryId: catId,
      };
      await onSubmit(input);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="pf-name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pf-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="e.g. Steel Pipe 1 inch"
            className={touched.name && errors.name ? "border-destructive" : ""}
            data-ocid="pf-name-input"
          />
          {touched.name && errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Category */}
        <div className="col-span-2 space-y-1.5">
          <Label>Category</Label>
          <Select
            value={form.categoryId}
            onValueChange={(v) => set("categoryId", v)}
          >
            <SelectTrigger data-ocid="pf-category-select">
              <SelectValue placeholder="Select category (optional)" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="pf-desc">Description</Label>
          <Textarea
            id="pf-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Product description, specifications, technical details..."
            rows={3}
            data-ocid="pf-desc-input"
          />
        </div>

        {/* HSN Code */}
        <div className="space-y-1.5">
          <Label htmlFor="pf-hsn">
            HSN Code
            <span className="ml-1 text-xs text-muted-foreground">
              (4–8 digits)
            </span>
          </Label>
          <Input
            id="pf-hsn"
            value={form.hsnCode}
            onChange={(e) =>
              set("hsnCode", e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            onBlur={() => handleBlur("hsnCode")}
            placeholder="e.g. 7306"
            inputMode="numeric"
            className={`font-mono ${touched.hsnCode && errors.hsnCode ? "border-destructive" : ""}`}
            data-ocid="pf-hsn-input"
          />
          {touched.hsnCode && errors.hsnCode && (
            <p className="text-xs text-destructive">{errors.hsnCode}</p>
          )}
        </div>

        {/* Part Number */}
        <div className="space-y-1.5">
          <Label htmlFor="pf-part">
            Part Number
            <span className="ml-1 text-xs text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id="pf-part"
            value={form.partNumber}
            onChange={(e) => set("partNumber", e.target.value)}
            placeholder="e.g. PIPE-001"
            className="font-mono"
            data-ocid="pf-part-input"
          />
        </div>

        {/* Rate */}
        <div className="space-y-1.5">
          <Label htmlFor="pf-rate">
            Rate (₹) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pf-rate"
            type="number"
            min="0"
            step="0.01"
            value={form.rate}
            onChange={(e) => set("rate", e.target.value)}
            onBlur={() => handleBlur("rate")}
            placeholder="0.00"
            className={touched.rate && errors.rate ? "border-destructive" : ""}
            data-ocid="pf-rate-input"
          />
          {touched.rate && errors.rate && (
            <p className="text-xs text-destructive">{errors.rate}</p>
          )}
        </div>

        {/* Tax % */}
        <div className="space-y-1.5">
          <Label>GST Tax Rate</Label>
          <Select
            value={form.taxPercent}
            onValueChange={(v) => set("taxPercent", v)}
          >
            <SelectTrigger data-ocid="pf-tax-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}% GST
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unit */}
        <div className="space-y-1.5">
          <Label>Unit of Measure</Label>
          <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
            <SelectTrigger data-ocid="pf-unit-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock Qty */}
        <div className="space-y-1.5">
          <Label htmlFor="pf-stock">
            Opening Stock Qty <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pf-stock"
            type="number"
            min="0"
            value={form.stockQty}
            onChange={(e) => set("stockQty", e.target.value)}
            onBlur={() => handleBlur("stockQty")}
            placeholder="0"
            className={
              touched.stockQty && errors.stockQty ? "border-destructive" : ""
            }
            data-ocid="pf-stock-input"
          />
          {touched.stockQty && errors.stockQty && (
            <p className="text-xs text-destructive">{errors.stockQty}</p>
          )}
        </div>

        {/* Active toggle */}
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
          <div className="space-y-0.5">
            <Label
              htmlFor="pf-active"
              className="text-sm font-medium cursor-pointer"
            >
              Active Product
            </Label>
            <p className="text-xs text-muted-foreground">
              Active products appear in inventory lists and searches
            </p>
          </div>
          <Switch
            id="pf-active"
            checked={form.isActive}
            onCheckedChange={(v) => set("isActive", v)}
            data-ocid="pf-active-toggle"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} data-ocid="pf-submit-btn">
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
