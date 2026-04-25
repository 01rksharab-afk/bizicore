import type { CategoryExpense } from "@/backend";
import { TransactionCategory } from "@/backend";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: CategoryExpense[];
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  [TransactionCategory.revenue]: "Revenue",
  [TransactionCategory.travel]: "Travel",
  [TransactionCategory.software]: "Software",
  [TransactionCategory.equipment]: "Equipment",
  [TransactionCategory.contractorFees]: "Contractor Fees",
  [TransactionCategory.other]: "Other",
};

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  [TransactionCategory.revenue]: "oklch(0.65 0.18 170)",
  [TransactionCategory.travel]: "oklch(0.68 0.14 85)",
  [TransactionCategory.software]: "oklch(0.60 0.16 240)",
  [TransactionCategory.equipment]: "oklch(0.65 0.18 30)",
  [TransactionCategory.contractorFees]: "oklch(0.60 0.16 145)",
  [TransactionCategory.other]: "oklch(0.52 0.015 235)",
};

interface ChartEntry {
  name: string;
  value: number;
  color: string;
  category: TransactionCategory;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: ChartEntry;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: item.payload.color }}
        />
        <span className="text-foreground font-medium">{item.name}</span>
      </div>
      <p className="text-muted-foreground mt-1">
        $
        {(item.value / 100).toLocaleString("en-US", {
          minimumFractionDigits: 0,
        })}
      </p>
    </div>
  );
}

export function ExpensePieChart({ data }: Props) {
  const filtered = data.filter(
    (d) => d.category !== TransactionCategory.revenue && Number(d.amount) > 0,
  );

  const chartData: ChartEntry[] = filtered.map((d) => ({
    name: CATEGORY_LABELS[d.category] ?? String(d.category),
    value: Number(d.amount),
    color: CATEGORY_COLORS[d.category] ?? "oklch(0.52 0.015 235)",
    category: d.category,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No expense data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={82}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {chartData.map((entry) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div
              key={entry.category}
              className="flex items-center gap-2 min-w-0"
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {entry.name}
              </span>
              <span className="text-xs font-medium text-foreground ml-auto shrink-0">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
