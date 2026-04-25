import type { MonthlyRevenue } from "@/backend";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: MonthlyRevenue[];
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatCurrency(cents: bigint): string {
  return `$${(Number(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

interface ChartPoint {
  name: string;
  revenue: number;
  expenses: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground capitalize">
            {entry.name}:
          </span>
          <span className="font-medium text-foreground">
            ${entry.value.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueLineChart({ data }: Props) {
  const chartData: ChartPoint[] = data.map((d) => ({
    name: MONTH_NAMES[Number(d.month) - 1] ?? String(d.month),
    revenue: Number(d.revenue) / 100,
    expenses: Number(d.expenses) / 100,
  }));

  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.revenue, d.expenses)),
    1,
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="oklch(0.65 0.18 170)"
              stopOpacity={0.15}
            />
            <stop
              offset="95%"
              stopColor="oklch(0.65 0.18 170)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.26 0.022 235 / 0.5)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "oklch(0.52 0.015 235)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: "oklch(0.52 0.015 235)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
          }
          domain={[0, Math.ceil(maxVal * 1.15)]}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "oklch(0.26 0.022 235)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="oklch(0.65 0.18 170)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "oklch(0.65 0.18 170)", strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="oklch(0.65 0.18 30)"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4, fill: "oklch(0.65 0.18 30)", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export { formatCurrency };
