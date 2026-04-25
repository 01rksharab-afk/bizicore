import type { UpdateProductInput } from "@/backend";
import { ProductForm } from "@/components/inventory/ProductForm";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useDeductStock,
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
} from "@/hooks/useInventory";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Edit,
  Hash,
  Layers,
  Minus,
  Package,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { productId } = useParams({ from: "/layout/inventory/$productId" });
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const navigate = useNavigate();
  const pid = productId ? BigInt(productId) : null;

  const { data: product, isLoading } = useProduct(orgId, pid);
  const { data: categories = [] } = useCategories(orgId);
  const updateProduct = useUpdateProduct(orgId);
  const deleteProduct = useDeleteProduct(orgId);
  const deductStock = useDeductStock(orgId);

  const [editMode, setEditMode] = useState(false);
  const [deductQty, setDeductQty] = useState("1");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleUpdate = async (input: UpdateProductInput) => {
    try {
      await updateProduct.mutateAsync(input);
      toast.success("Product updated successfully");
      setEditMode(false);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDeduct = async () => {
    if (!pid || !orgId) return;
    try {
      await deductStock.mutateAsync({
        productId: pid,
        qty: BigInt(deductQty || "1"),
      });
      toast.success(`Deducted ${deductQty} units`);
      setDeductQty("1");
    } catch {
      toast.error("Failed to deduct stock");
    }
  };

  const handleDelete = async () => {
    if (!pid) return;
    try {
      await deleteProduct.mutateAsync(pid);
      toast.success("Product deleted");
      navigate({ to: "/inventory" });
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="size-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="font-medium text-foreground">Product not found</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          This product may have been deleted or doesn't exist.
        </p>
        <Button variant="outline" asChild>
          <Link to="/inventory">
            <ArrowLeft className="size-4 mr-2" />
            Back to Inventory
          </Link>
        </Button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const isLowStock = product.stockQty < 10n;

  return (
    <div className="space-y-6 max-w-2xl fade-in">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/inventory">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-semibold text-foreground truncate">
              {product.name}
            </h1>
            {category && (
              <Badge variant="outline" className="text-xs shrink-0">
                <Layers className="size-3 mr-1" />
                {category.name}
              </Badge>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {editMode ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(false)}
              className="text-muted-foreground"
            >
              <X className="size-4 mr-1.5" /> Cancel
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                data-ocid="edit-product-btn"
              >
                <Edit className="size-4 mr-1.5" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
                data-ocid="delete-product-btn"
              >
                <Trash2 className="size-4 mr-1.5" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {editMode ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-foreground">
              Edit Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgId && pid && (
              <ProductForm
                orgId={orgId}
                productId={pid}
                initialValues={{
                  name: product.name,
                  description: product.description,
                  hsnCode: product.hsnCode,
                  partNumber: product.partNumber,
                  unit: product.unit,
                  rate: product.rate.toString(),
                  taxPercent: product.taxPercent.toString(),
                  stockQty: product.stockQty.toString(),
                  categoryId: product.categoryId?.toString() ?? "",
                }}
                onSubmit={(input) => handleUpdate(input as UpdateProductInput)}
                onCancel={() => setEditMode(false)}
                isPending={updateProduct.isPending}
                submitLabel="Save Changes"
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Rate",
                value: `₹${product.rate.toLocaleString("en-IN")}`,
                mono: false,
              },
              {
                label: "Tax Rate",
                value: `${product.taxPercent.toString()}% GST`,
                mono: false,
              },
              {
                label: "Stock",
                value: `${product.stockQty.toString()} ${product.unit}`,
                low: isLowStock,
                mono: false,
              },
              {
                label: "HSN Code",
                value: product.hsnCode || "—",
                mono: true,
              },
            ].map((m) => (
              <Card key={m.label}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    {m.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p
                    className={`text-lg font-display font-semibold ${m.mono ? "font-mono text-base" : ""} ${m.low ? "text-destructive" : "text-foreground"}`}
                  >
                    {m.value}
                  </p>
                  {m.low && (
                    <p className="text-xs text-destructive/70 mt-0.5">
                      Low stock
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm text-foreground">
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                {
                  icon: <Tag className="size-3.5" />,
                  label: "Part Number",
                  value: product.partNumber || "—",
                  mono: true,
                },
                {
                  icon: <Hash className="size-3.5" />,
                  label: "HSN Code",
                  value: product.hsnCode || "—",
                  mono: true,
                },
                {
                  icon: <Package className="size-3.5" />,
                  label: "Unit",
                  value: product.unit,
                  mono: false,
                },
                {
                  icon: <Layers className="size-3.5" />,
                  label: "Category",
                  value: category?.name || "Uncategorized",
                  mono: false,
                },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-center gap-3 py-3">
                    <span className="text-muted-foreground/50">
                      {item.icon}
                    </span>
                    <span className="text-xs text-muted-foreground w-28 shrink-0">
                      {item.label}
                    </span>
                    <span
                      className={`text-sm text-foreground ${item.mono ? "font-mono" : ""}`}
                    >
                      {item.value}
                    </span>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
              {product.description && (
                <>
                  <Separator />
                  <div className="py-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Deduct Stock */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm text-foreground flex items-center gap-2">
                <Minus className="size-4 text-accent" />
                Deduct Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="deduct-qty">Quantity</Label>
                  <Input
                    id="deduct-qty"
                    type="number"
                    min="1"
                    value={deductQty}
                    onChange={(e) => setDeductQty(e.target.value)}
                    className="w-28"
                    data-ocid="deduct-qty-input"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleDeduct}
                  disabled={deductStock.isPending}
                  data-ocid="deduct-stock-btn"
                >
                  {deductStock.isPending ? "Deducting…" : "Deduct"}
                </Button>
                <p className="text-xs text-muted-foreground pb-2">
                  Current: {product.stockQty.toString()} {product.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{product.name}</strong>?
              This will permanently remove the product and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="confirm-delete-product-btn"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
