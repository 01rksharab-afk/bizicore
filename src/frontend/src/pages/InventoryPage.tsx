import type { Product } from "@/backend";
import type { UpdateProductInput } from "@/backend";
import { ErrorState } from "@/components/ErrorState";
import { SubscriptionGate } from "@/components/SubscriptionGate";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  useCategories,
  useDeductStock,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/useInventory";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Edit,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SortKey = "name" | "rate" | "stockQty";
type SortDir = "asc" | "desc";

function DeductStockDialog({
  product,
  orgId,
  open,
  onClose,
}: {
  product: Product;
  orgId: bigint;
  open: boolean;
  onClose: () => void;
}) {
  const deductStock = useDeductStock(orgId);
  const [qty, setQty] = useState("1");

  const handleDeduct = async () => {
    try {
      await deductStock.mutateAsync({
        productId: product.id,
        qty: BigInt(qty || "1"),
      });
      toast.success(`Deducted ${qty} ${product.unit} from ${product.name}`);
      onClose();
    } catch {
      toast.error("Failed to deduct stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Deduct Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            Deduct stock from{" "}
            <span className="font-medium text-foreground">{product.name}</span>.
            Current stock:{" "}
            <span className="font-medium text-foreground">
              {product.stockQty.toString()} {product.unit}
            </span>
          </p>
          <div className="space-y-1.5">
            <label htmlFor="deduct-dialog-qty" className="text-sm font-medium">
              Quantity to deduct
            </label>
            <Input
              id="deduct-dialog-qty"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              data-ocid="deduct-qty-input"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleDeduct}
              disabled={deductStock.isPending}
              data-ocid="confirm-deduct-btn"
            >
              {deductStock.isPending ? "Deducting..." : "Deduct"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({
  product,
  orgId,
  open,
  onClose,
}: {
  product: Product;
  orgId: bigint;
  open: boolean;
  onClose: () => void;
}) {
  const updateProduct = useUpdateProduct(orgId);

  const handleSubmit = async (input: UpdateProductInput) => {
    try {
      await updateProduct.mutateAsync(input);
      toast.success("Product updated");
      onClose();
    } catch {
      toast.error("Failed to update product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Product</DialogTitle>
        </DialogHeader>
        <ProductForm
          orgId={orgId}
          productId={product.id}
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
          onSubmit={(input) => handleSubmit(input as UpdateProductInput)}
          onCancel={onClose}
          isPending={updateProduct.isPending}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const navigate = useNavigate();
  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useProducts(orgId);
  const { data: categories = [] } = useCategories(orgId);
  const deleteProduct = useDeleteProduct(orgId);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deductTarget, setDeductTarget] = useState<Product | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.hsnCode.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.categoryId?.toString() === categoryFilter);
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "rate") cmp = a.rate - b.rate;
      else cmp = Number(a.stockQty - b.stockQty);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [products, search, categoryFilter, sortKey, sortDir]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteTarget(null);
    }
  };

  const SortHeader = ({
    label,
    colKey,
  }: { label: string; colKey: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(colKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`size-3 ${sortKey === colKey ? "text-accent" : "text-muted-foreground/40"}`}
        />
      </span>
    </TableHead>
  );

  return (
    <SubscriptionGate requiredPlan="pro" feature="Inventory Management">
      {isError ? (
        <ErrorState
          module="Inventory"
          onRetry={() => refetch()}
          className="min-h-[300px]"
        />
      ) : (
        <div className="space-y-5 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                Inventory
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {products.length} product{products.length !== 1 ? "s" : ""} —
                manage catalog, stock &amp; HSN codes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/inventory/import" data-ocid="bulk-import-btn">
                  <Upload className="size-4 mr-1.5" />
                  Import CSV
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/inventory/new" })}
                data-ocid="new-product-btn"
              >
                <Plus className="size-4 mr-1.5" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="Search name, HSN, part no."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="product-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                className="w-44 h-9 text-sm"
                data-ocid="category-filter"
              >
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9" asChild>
              <Link to="/inventory/hsn">Search HSN / Part</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-9" asChild>
              <Link to="/inventory/categories">Manage Categories</Link>
            </Button>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <SortHeader label="Product Name" colKey="name" />
                    <TableHead>Category</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Part Number</TableHead>
                    <SortHeader label="Rate (₹)" colKey="rate" />
                    <TableHead className="text-center">Tax %</TableHead>
                    <TableHead>Unit</TableHead>
                    <SortHeader label="Stock" colKey="stockQty" />
                    <TableHead className="w-28 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    ["sk-r0", "sk-r1", "sk-r2", "sk-r3", "sk-r4", "sk-r5"].map(
                      (rowKey) => (
                        <TableRow key={rowKey}>
                          {[
                            "c0",
                            "c1",
                            "c2",
                            "c3",
                            "c4",
                            "c5",
                            "c6",
                            "c7",
                            "c8",
                          ].map((colKey) => (
                            <TableCell key={`${rowKey}-${colKey}`}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ),
                    )
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-16"
                        data-ocid="products-empty"
                      >
                        <Package className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="font-medium text-foreground text-sm">
                          No products found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {search || categoryFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Add your first product to get started"}
                        </p>
                        {!search && categoryFilter === "all" && (
                          <Button
                            size="sm"
                            className="mt-4"
                            onClick={() => navigate({ to: "/inventory/new" })}
                          >
                            <Plus className="size-4 mr-1.5" /> Add Product
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((product) => {
                      const cat = categories.find(
                        (c) => c.id === product.categoryId,
                      );
                      const isLowStock = product.stockQty < 10n;
                      return (
                        <TableRow
                          key={product.id.toString()}
                          data-ocid="product-row"
                          className="group"
                        >
                          <TableCell>
                            <Link
                              to="/inventory/$productId"
                              params={{ productId: product.id.toString() }}
                              className="font-medium text-foreground hover:text-accent transition-colors"
                            >
                              {product.name}
                            </Link>
                            {product.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {product.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {cat ? (
                              <Badge
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {cat.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {product.hsnCode || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {product.partNumber || "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            ₹{product.rate.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {product.taxPercent.toString()}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {product.unit}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span
                              className={
                                isLowStock
                                  ? "text-destructive font-semibold"
                                  : "font-medium"
                              }
                            >
                              {product.stockQty.toString()}
                            </span>
                            {isLowStock && (
                              <span className="ml-1 text-xs text-destructive/70">
                                low
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setDeductTarget(product)}
                                title="Deduct stock"
                                data-ocid="deduct-stock-btn"
                              >
                                <Minus className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditTarget(product)}
                                title="Edit product"
                                data-ocid="edit-product-btn"
                              >
                                <Edit className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteTarget(product)}
                                title="Delete product"
                                data-ocid="delete-product-btn"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delete confirm dialog */}
          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(v) => !v && setDeleteTarget(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">
                  Delete Product
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <strong>{deleteTarget?.name}</strong>? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="confirm-delete-btn"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit dialog */}
          {editTarget && orgId && (
            <EditProductDialog
              product={editTarget}
              orgId={orgId}
              open={!!editTarget}
              onClose={() => setEditTarget(null)}
            />
          )}

          {/* Deduct stock dialog */}
          {deductTarget && orgId && (
            <DeductStockDialog
              product={deductTarget}
              orgId={orgId}
              open={!!deductTarget}
              onClose={() => setDeductTarget(null)}
            />
          )}
        </div>
      )}
    </SubscriptionGate>
  );
}
