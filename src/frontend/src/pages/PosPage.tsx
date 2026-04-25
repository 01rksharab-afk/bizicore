import { Breadcrumb } from "@/components/Breadcrumb";
import { ModulePageLayout } from "@/components/ModulePageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { exportToCsv } from "@/utils/exportToCsv";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Download,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PaymentMode = "cash" | "card" | "upi" | "bank_transfer";

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  rate: number;
  tax: number;
  category: string;
}

interface CartItem extends ProductItem {
  qty: number;
}

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const DEMO_PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    name: "Laptop Stand Pro",
    sku: "LSP-001",
    rate: 2499,
    tax: 18,
    category: "Accessories",
  },
  {
    id: "p2",
    name: "Wireless Mouse",
    sku: "WM-002",
    rate: 899,
    tax: 18,
    category: "Accessories",
  },
  {
    id: "p3",
    name: "USB-C Hub 7-in-1",
    sku: "UCH-003",
    rate: 1799,
    tax: 18,
    category: "Accessories",
  },
  {
    id: "p4",
    name: "Mechanical Keyboard",
    sku: "MK-004",
    rate: 4599,
    tax: 18,
    category: "Peripherals",
  },
  {
    id: "p5",
    name: "Monitor 24-inch",
    sku: "MN-005",
    rate: 18999,
    tax: 28,
    category: "Displays",
  },
  {
    id: "p6",
    name: "Webcam 1080p",
    sku: "WC-006",
    rate: 3299,
    tax: 18,
    category: "Peripherals",
  },
  {
    id: "p7",
    name: "Desk Lamp LED",
    sku: "DL-007",
    rate: 1299,
    tax: 12,
    category: "Furniture",
  },
  {
    id: "p8",
    name: "Cable Management Kit",
    sku: "CM-008",
    rate: 449,
    tax: 18,
    category: "Accessories",
  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n);
}

type ViewState = "pos" | "receipt";

interface ReceiptData {
  receiptNumber: string;
  customer: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  mode: PaymentMode;
  date: string;
}

export default function PosPage() {
  const { activeOrg } = useActiveOrg();
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [view, setView] = useState<ViewState>("pos");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const [dailyTransactions] = useState([
    {
      id: "t1",
      customer: "Walk-in Customer",
      items: 3,
      total: 5697,
      mode: "cash",
      time: "09:15 AM",
    },
    {
      id: "t2",
      customer: "Rahul Sharma",
      items: 1,
      total: 18999,
      mode: "card",
      time: "10:42 AM",
    },
  ]);

  function handleExportDaily() {
    exportToCsv(
      "daily-pos-transactions",
      [
        { key: "id", label: "ID" },
        { key: "customer", label: "Customer" },
        { key: "items", label: "Items" },
        { key: "total", label: "Total" },
        { key: "mode", label: "Mode" },
        { key: "time", label: "Time" },
      ],
      dailyTransactions,
    );
    toast.success("Daily transactions exported");
  }

  const productsQuery = useQuery<ProductItem[]>({
    queryKey: ["posProducts", activeOrg?.id],
    queryFn: async () => {
      if (!actor || !activeOrg) return DEMO_PRODUCTS;
      try {
        const res = await (
          actor as unknown as Record<string, (...a: unknown[]) => unknown>
        ).listItemMasters(activeOrg.id);
        return (res as ProductItem[]) ?? DEMO_PRODUCTS;
      } catch {
        return DEMO_PRODUCTS;
      }
    },
    enabled: !!activeOrg,
  });

  const chargeMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !activeOrg) throw new Error("No actor");
      const result = await (
        actor as unknown as Record<string, (...a: unknown[]) => unknown>
      ).createPosTransaction(activeOrg.id, {
        customer: customer || "Walk-in Customer",
        items: cart.map((c) => ({
          productId: c.id,
          name: c.name,
          qty: c.qty,
          rate: c.rate,
          tax: c.tax,
        })),
        paymentMode,
        total: grandTotal,
      });
      return result;
    },
    onSuccess: () => {
      const receiptNum = `POS-${Date.now().toString().slice(-6)}`;
      setReceipt({
        receiptNumber: receiptNum,
        customer: customer || "Walk-in Customer",
        items: [...cart],
        subtotal,
        tax: taxAmount,
        total: grandTotal,
        mode: paymentMode,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["posTransactions"] });
      setView("receipt");
    },
    onError: () => toast.error("Transaction failed. Please retry."),
  });

  const products = productsQuery.data ?? [];
  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  function addToCart(product: ProductItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.id === product.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  const subtotal = cart.reduce((s, c) => s + c.qty * c.rate, 0);
  const taxAmount = cart.reduce(
    (s, c) => s + c.qty * c.rate * (c.tax / 100),
    0,
  );
  const grandTotal = subtotal + taxAmount;

  function handleCharge() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    chargeMutation.mutate();
  }

  function startNewSale() {
    setCart([]);
    setCustomer("");
    setPaymentMode("cash");
    setSearch("");
    setReceipt(null);
    setView("pos");
  }

  // Receipt view
  if (view === "receipt" && receipt) {
    return (
      <div className="space-y-6" data-ocid="pos-receipt-view">
        <Breadcrumb items={[{ label: "Sales" }, { label: "POS" }]} />
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-center flex-col gap-2 pb-2">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="size-6 text-accent" />
              </div>
              <h2 className="text-lg font-display font-semibold text-foreground">
                Payment Successful
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {receipt.receiptNumber}
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-foreground font-medium">
                  {receipt.customer}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{receipt.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Mode</span>
                <span className="text-foreground">
                  {PAYMENT_MODES.find((m) => m.value === receipt.mode)?.label}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              {receipt.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-mono text-foreground">
                    {fmt(item.qty * item.rate)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST</span>
                <span className="font-mono">{fmt(receipt.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-display font-semibold text-foreground mt-1">
                <span>Total</span>
                <span className="font-mono">{fmt(receipt.total)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-2"
              onClick={startNewSale}
              data-ocid="new-sale-btn"
            >
              New Sale
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // POS view
  return (
    <ModulePageLayout
      title="Point of Sale"
      moduleName="pos"
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportDaily}
          data-ocid="pos-export-btn"
        >
          <Download className="size-3.5 mr-1.5" /> Export Daily
        </Button>
      }
    >
      <Breadcrumb items={[{ label: "Sales" }, { label: "POS" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0 h-[calc(100%-5rem)]">
        {/* Left: Product Grid */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search items by name, SKU, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="pos-search"
            />
          </div>

          {/* Product grid */}
          <ScrollArea className="flex-1 h-[calc(100vh-18rem)]">
            {productsQuery.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
                {filtered.map((p) => {
                  const inCart = cart.find((c) => c.id === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/50 hover:bg-muted/30 transition-all duration-150 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-ocid="pos-product-item"
                    >
                      {inCart && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 min-w-[1.25rem] text-center border-0">
                          {inCart.qty}
                        </Badge>
                      )}
                      <div className="size-8 rounded bg-muted flex items-center justify-center mb-2">
                        <Package className="size-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.sku}
                      </p>
                      <p className="text-sm font-mono font-semibold text-primary mt-1">
                        {fmt(p.rate)}
                      </p>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-3 py-12 text-center text-sm text-muted-foreground">
                    No products match "{search}"
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Cart */}
        <div
          className="lg:col-span-2 flex flex-col bg-card border border-border rounded-xl overflow-hidden"
          data-ocid="pos-cart"
        >
          {/* Cart header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">Cart</span>
              {cart.length > 0 && (
                <Badge className="bg-primary text-primary-foreground border-0 text-xs">
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setCart([])}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Cart items */}
          <ScrollArea className="flex-1 max-h-[calc(100vh-26rem)]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <ShoppingCart className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground/60">
                  Click products to add them
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center gap-3"
                    data-ocid="cart-item"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {fmt(item.rate)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQty(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="text-sm font-mono w-6 text-center font-medium">
                        {item.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQty(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-mono font-semibold text-foreground">
                        {fmt(item.qty * item.rate)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove from cart"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart footer */}
          <div className="border-t border-border p-4 space-y-3 bg-card">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Customer (optional)
              </Label>
              <Input
                placeholder="Walk-in Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="h-8 text-sm"
                data-ocid="pos-customer-input"
              />
            </div>

            {/* Payment mode */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Payment Mode
              </Label>
              <Select
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as PaymentMode)}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="pos-payment-mode"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span>
                <span className="font-mono">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-display font-semibold text-foreground pt-1">
                <span>Total</span>
                <span className="font-mono">{fmt(grandTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || chargeMutation.isPending}
              onClick={handleCharge}
              data-ocid="pos-charge-btn"
            >
              {chargeMutation.isPending
                ? "Processing…"
                : `Charge ${fmt(grandTotal)}`}
            </Button>
          </div>
        </div>
      </div>
    </ModulePageLayout>
  );
}
