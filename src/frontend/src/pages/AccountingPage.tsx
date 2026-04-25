import type { MonthlySummary, TransactionInput } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ErrorState } from "@/components/ErrorState";
import { TransactionForm } from "@/components/accounting/TransactionForm";
import { TransactionLedger } from "@/components/accounting/TransactionLedger";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveOrg } from "@/hooks/useOrg";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function cents(n: bigint): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) / 100);
}

function SummaryCard({
  label,
  value,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  positive?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
      <div
        className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
          positive === undefined
            ? "bg-muted text-muted-foreground"
            : positive
              ? "bg-accent/10 text-accent"
              : "bg-destructive/10 text-destructive"
        }`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-display font-semibold text-foreground mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AccountingPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const queryClient = useQueryClient();
  const { activeOrg } = useActiveOrg();
  const { actor } = useBackendActor();

  const now = new Date();
  const year = BigInt(now.getFullYear());
  const month = BigInt(now.getMonth() + 1);

  const summaryQuery = useQuery<MonthlySummary>({
    queryKey: ["monthlySummary", activeOrg?.id, year, month],
    queryFn: async () => {
      if (!actor || !activeOrg) throw new Error("No actor or org");
      return actor.getMonthlySummary(activeOrg.id, year, month);
    },
    enabled: !!actor && !!activeOrg,
  });

  const addMutation = useMutation({
    mutationFn: async (input: TransactionInput) => {
      if (!actor || !activeOrg) throw new Error("No actor");
      return actor.addTransaction(activeOrg.id, input);
    },
    onSuccess: () => {
      toast.success("Transaction added");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      setAddOpen(false);
    },
    onError: () => toast.error("Failed to add transaction"),
  });

  const summary = summaryQuery.data;

  if (summaryQuery.isError) {
    return (
      <div className="space-y-4">
        <Breadcrumb
          items={[{ label: "Accounting" }, { label: "Transactions" }]}
        />
        <ErrorState
          module="Accounting"
          onRetry={() => summaryQuery.refetch()}
          className="min-h-[200px]"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="accounting-page">
      <Breadcrumb
        items={[{ label: "Accounting" }, { label: "Transactions" }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {now.toLocaleString("default", { month: "long", year: "numeric" })}{" "}
            ledger
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCsvOpen(true)}
            data-ocid="bulk-import-btn"
          >
            <Upload className="size-4 mr-2" />
            Bulk Import
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            data-ocid="add-transaction-btn"
          >
            <PlusCircle className="size-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Income"
          value={summary ? cents(summary.income) : "$0.00"}
          positive={true}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Expenses"
          value={summary ? cents(summary.expenses) : "$0.00"}
          positive={false}
          icon={TrendingDown}
        />
        <SummaryCard
          label="Net"
          value={summary ? cents(summary.net) : "$0.00"}
          positive={summary ? summary.net >= 0n : undefined}
          icon={DollarSign}
        />
      </div>

      <TransactionLedger orgId={activeOrg?.id ?? null} />

      {/* Add Transaction Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="add-transaction-dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={(data) => addMutation.mutate(data)}
            isSubmitting={addMutation.isPending}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* CSV Import Instructions Dialog */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="csv-import-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Bulk Import via CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Prepare a CSV file with the following columns in this exact order:
            </p>
            <div className="bg-muted/40 rounded-lg p-4 font-mono text-xs text-foreground">
              <p className="font-semibold mb-1">
                date, description, category, amount
              </p>
              <p className="text-muted-foreground">
                2024-01-15, "Office supplies", software, -4500
              </p>
              <p className="text-muted-foreground">
                2024-01-20, "Client payment", revenue, 150000
              </p>
            </div>
            <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
              <li>
                Date format:{" "}
                <span className="text-foreground font-mono">YYYY-MM-DD</span>
              </li>
              <li>Amount in cents (negative = expense, positive = income)</li>
              <li>
                Categories:{" "}
                <span className="text-foreground font-mono">
                  revenue, equipment, travel, software, contractorFees, other
                </span>
              </li>
              <li>First row is assumed to be a header and will be skipped</li>
            </ul>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCsvOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
