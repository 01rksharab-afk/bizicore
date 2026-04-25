import {
  DealStage,
  type PipelineSummary as PipelineSummaryType,
} from "@/backend";

const STAGE_LABELS: Record<DealStage, string> = {
  [DealStage.prospect]: "Prospect",
  [DealStage.qualified]: "Qualified",
  [DealStage.negotiation]: "Negotiation",
  [DealStage.closedWon]: "Closed Won",
  [DealStage.closedLost]: "Closed Lost",
};

const STAGE_COLORS: Record<DealStage, string> = {
  [DealStage.prospect]: "bg-primary",
  [DealStage.qualified]: "bg-accent",
  [DealStage.negotiation]: "bg-chart-4",
  [DealStage.closedWon]: "bg-chart-2",
  [DealStage.closedLost]: "bg-destructive",
};

function formatCents(cents: bigint) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Number(cents) / 100);
}

interface PipelineSummaryProps {
  summary: PipelineSummaryType;
}

export function PipelineSummary({ summary }: PipelineSummaryProps) {
  const totalValue = summary.stages.reduce((sum, s) => sum + s.totalValue, 0n);

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 space-y-4"
      data-ocid="pipeline-summary"
    >
      {/* KPI row */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Total Pipeline
          </p>
          <p className="text-xl font-display font-semibold text-foreground mt-0.5">
            {formatCents(totalValue)}
          </p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Win Rate
          </p>
          <p className="text-xl font-display font-semibold text-accent mt-0.5">
            {summary.winRate.toString()}%
          </p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Avg Deal Size
          </p>
          <p className="text-xl font-display font-semibold text-foreground mt-0.5">
            {formatCents(summary.averageDealSize)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {summary.stages
            .filter((s) => s.count > 0n)
            .map((s) => (
              <div key={s.stage} className="text-center min-w-[64px]">
                <p className="text-xs text-muted-foreground">
                  {STAGE_LABELS[s.stage as DealStage]}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCents(s.totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.count.toString()} deals
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Progress bar */}
      {totalValue > 0n && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Value by stage</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-px bg-muted">
            {summary.stages.map((s) => {
              if (s.totalValue === 0n) return null;
              const pct = Number((s.totalValue * 10000n) / totalValue) / 100;
              return (
                <div
                  key={s.stage}
                  className={`${STAGE_COLORS[s.stage as DealStage]} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${STAGE_LABELS[s.stage as DealStage]}: ${formatCents(s.totalValue)}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {summary.stages
              .filter((s) => s.totalValue > 0n)
              .map((s) => (
                <div key={s.stage} className="flex items-center gap-1">
                  <span
                    className={`size-2 rounded-full ${STAGE_COLORS[s.stage as DealStage]}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {STAGE_LABELS[s.stage as DealStage]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
