import type { CreateProductInput, Product } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { ProductForm } from "@/components/inventory/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProduct } from "@/hooks/useInventory";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

export default function NewProductPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const createProduct = useCreateProduct(orgId);
  const navigate = useNavigate();

  const handleSubmit = async (input: CreateProductInput) => {
    try {
      const created = (await createProduct.mutateAsync(input)) as Product;
      toast.success("Product created successfully");
      navigate({
        to: "/inventory/$productId",
        params: { productId: created.id.toString() },
      });
    } catch {
      // toast is handled in the mutation's onError
    }
  };

  if (!orgId) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No active organization selected.
      </div>
    );
  }

  return (
    <SubscriptionGate requiredPlan="pro" feature="Inventory Management">
      <div className="space-y-6 max-w-2xl fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <Package className="size-5 text-accent" />
              New Product
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add a new product to your inventory catalog
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-foreground">
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              orgId={orgId}
              onSubmit={(input) => handleSubmit(input as CreateProductInput)}
              onCancel={() => navigate({ to: "/inventory" })}
              isPending={createProduct.isPending}
              submitLabel="Create Product"
            />
          </CardContent>
        </Card>
      </div>
    </SubscriptionGate>
  );
}
