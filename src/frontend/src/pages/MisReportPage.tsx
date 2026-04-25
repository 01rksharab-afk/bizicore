import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface TopCustomer {
  name: string;
  revenue: number;
  orders: number;
  lastOrder: string;
}

interface TopSupplier {
  name: string;
  purchases: number;
  bills: number;
  lastPurchase: string;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  pct: number;
}

const TOP_CUSTOMERS: TopCustomer[] = [
  {
    name: "Tata Steel Ltd.",
    revenue: 2850000,
    orders: 24,
    lastOrder: "2026-04-05",
  },
  {
    name: "Reliance Industries",
    revenue: 2100000,
    orders: 18,
    lastOrder: "2026-04-08",
  },
  {
    name: "BHEL Procurement",
    revenue: 1850000,
    orders: 15,
    lastOrder: "2026-04-02",
  },
  {
    name: "L&T Construction",
    revenue: 1620000,
    orders: 12,
    lastOrder: "2026-03-28",
  },
  {
    name: "Infosys Technologies",
    revenue: 980000,
    orders: 8,
    lastOrder: "2026-04-07",
  },
  { name: "HCL Systems", revenue: 875000, orders: 7, lastOrder: "2026-04-01" },
  {
    name: "Ashok Leyland",
    revenue: 760000,
    orders: 6,
    lastOrder: "2026-03-30",
  },
  {
    name: "Bajaj Auto Ltd.",
    revenue: 640000,
    orders: 5,
    lastOrder: "2026-04-06",
  },
  {
    name: "Godrej Properties",
    revenue: 590000,
    orders: 5,
    lastOrder: "2026-03-25",
  },
  {
    name: "Ultratech Cement",
    revenue: 510000,
    orders: 4,
    lastOrder: "2026-04-04",
  },
];

const TOP_SUPPLIERS: TopSupplier[] = [
  {
    name: "Steel Authority of India",
    purchases: 1840000,
    bills: 12,
    lastPurchase: "2026-04-05",
  },
  {
    name: "Hindustan Zinc Ltd.",
    purchases: 1250000,
    bills: 9,
    lastPurchase: "2026-04-08",
  },
  {
    name: "National Aluminium Co.",
    purchases: 980000,
    bills: 8,
    lastPurchase: "2026-04-02",
  },
  {
    name: "Vedanta Resources",
    purchases: 820000,
    bills: 7,
    lastPurchase: "2026-03-30",
  },
  {
    name: "Hindalco Industries",
    purchases: 750000,
    bills: 6,
    lastPurchase: "2026-04-06",
  },
  {
    name: "ONGC Petro addatives",
    purchases: 680000,
    bills: 5,
    lastPurchase: "2026-04-01",
  },
  {
    name: "IOCL Industrial",
    purchases: 590000,
    bills: 5,
    lastPurchase: "2026-03-28",
  },
  {
    name: "GAIL Gas Limited",
    purchases: 480000,
    bills: 4,
    lastPurchase: "2026-04-07",
  },
  {
    name: "Bharat Petroleum",
    purchases: 420000,
    bills: 4,
    lastPurchase: "2026-04-04",
  },
  {
    name: "Mangalore Refinery",
    purchases: 380000,
    bills: 3,
    lastPurchase: "2026-03-25",
  },
];

const CATEGORY_REVENUE: CategoryRevenue[] = [
  { category: "Electrical", revenue: 4200000, pct: 35 },
  { category: "Mechanical", revenue: 2640000, pct: 22 },
  { category: "Raw Material", revenue: 1980000, pct: 16.5 },
  { category: "Machinery", revenue: 1500000, pct: 12.5 },
  { category: "Plumbing", revenue: 840000, pct: 7 },
  { category: "Safety", revenue: 840000, pct: 7 },
];

const PERIODS = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "custom", label: "Custom Range" },
];

// ─── Summary Cards ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
}

function SummaryCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${positive ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}
          >
            {change}
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-display font-bold text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MisReportPage() {
  const [period, setPeriod] = useState("this-month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleExport = () => toast.success("MIS Report exported as CSV");

  const summaryData = [
    {
      label: "Total Revenue",
      value: "₹1.2L",
      change: "+12%",
      positive: true,
      icon: TrendingUp,
    },
    {
      label: "Total Expenses",
      value: "₹78K",
      change: "+4%",
      positive: false,
      icon: TrendingDown,
    },
    {
      label: "Net Profit",
      value: "₹42K",
      change: "+22%",
      positive: true,
      icon: Wallet,
    },
    {
      label: "Total Purchases",
      value: "₹65K",
      change: "+8%",
      positive: false,
      icon: ShoppingCart,
    },
    {
      label: "Total Sales",
      value: "₹1.2L",
      change: "+12%",
      positive: true,
      icon: TrendingUp,
    },
    {
      label: "New Customers",
      value: "18",
      change: "+6",
      positive: true,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6" data-ocid="mis-report-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              MIS Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Management Information Summary — key business KPIs
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          className="gap-2"
          data-ocid="export-mis-btn"
        >
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {/* Period selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-44" data-ocid="mis-period-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="mis-from">Date From</Label>
                  <Input
                    id="mis-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                    data-ocid="mis-date-from"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mis-to">Date To</Label>
                  <Input
                    id="mis-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                    data-ocid="mis-date-to"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryData.map((s) => (
          <SummaryCard key={s.label} {...s} />
        ))}
      </div>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORY_REVENUE.map((c) => (
            <div key={c.category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">
                  {c.category}
                </span>
                <span className="text-muted-foreground">
                  ₹{c.revenue.toLocaleString("en-IN")} ({c.pct}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Customers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              Top 10 Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP_CUSTOMERS.map((c, idx) => (
                  <TableRow
                    key={c.name}
                    data-ocid={`top-customer-${c.name.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ₹{(c.revenue / 100000).toFixed(1)}L
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {c.orders}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top 10 Suppliers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Top 10 Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-center">Bills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP_SUPPLIERS.map((s, idx) => (
                  <TableRow
                    key={s.name}
                    data-ocid={`top-supplier-${s.name.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ₹{(s.purchases / 100000).toFixed(1)}L
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {s.bills}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
