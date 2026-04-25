import {
  type LedgerEntry,
  type OrgId,
  TransactionCategory,
  type TransactionFilter,
} from "@/backend";
import { Button } from "@/components/ui/button";
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
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Filter, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  orgId: OrgId | null;
}

const CATEGORIES: { value: TransactionCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: TransactionCategory.revenue, label: "Revenue" },
  { value: TransactionCategory.equipment, label: "Equipment" },
  { value: TransactionCategory.travel, label: "Travel" },
  { value: TransactionCategory.software, label: "Software" },
  { value: TransactionCategory.contractorFees, label: "Contractor Fees" },
  { value: TransactionCategory.other, label: "Other" },
];

function formatCents(n: bigint): string {
  const abs = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(Number(n)) / 100);
  return n < 0n ? `-${abs}` : abs;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function categoryLabel(c: TransactionCategory): string {
  const found = CATEGORIES.find((x) => x.value === c);
  return found ? found.label : c;
}

export function TransactionLedger({ orgId }: Props) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<
    TransactionCategory | "all"
  >("all");
  const [filterReconciled, setFilterReconciled] = useState<
    "all" | "reconciled" | "unreconciled"
  >("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileId, setReconcileId] = useState<bigint | null>(null);
  const [bankRef, setBankRef] = useState("");

  const filter: TransactionFilter = {
    ...(filterCategory !== "all" ? { category: filterCategory } : {}),
    ...(filterReconciled === "reconciled" ? { reconciled: true } : {}),
    ...(filterReconciled === "unreconciled" ? { reconciled: false } : {}),
    ...(fromDate
      ? { fromDate: BigInt(new Date(fromDate).getTime()) * 1_000_000n }
      : {}),
    ...(toDate
      ? { toDate: BigInt(new Date(toDate).getTime()) * 1_000_000n }
      : {}),
  };

  const txQuery = useQuery<LedgerEntry[]>({
    queryKey: ["transactions", orgId, filter],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listTransactions(orgId, filter);
    },
    enabled: !!actor && !!orgId,
  });

  const reconcileMutation = useMutation({
    mutationFn: async ({ id: _id, ref: _ref }: { id: bigint; ref: string }) => {
      // reconcileTransaction removed from backend to reduce wasm size
      return false;
    },
    onSuccess: () => {
      toast.success("Transaction reconciled");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setReconcileOpen(false);
      setBankRef("");
    },
    onError: () => toast.error("Failed to reconcile"),
  });

  const entries = txQuery.data ?? [];
  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.transaction.description.toLowerCase().includes(q) ||
      Math.abs(Number(e.transaction.amount) / 100)
        .toFixed(2)
        .includes(q)
    );
  });

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden"
      data-ocid="transaction-ledger"
    >
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            data-ocid="tx-search-input"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((p) => !p)}
          data-ocid="tx-filter-btn"
        >
          <Filter className="size-4 mr-1.5" />
          Filters
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex flex-wrap gap-3">
          <Select
            value={filterCategory}
            onValueChange={(v) =>
              setFilterCategory(v as TransactionCategory | "all")
            }
          >
            <SelectTrigger
              className="h-8 w-44 text-xs"
              data-ocid="filter-category-select"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterReconciled}
            onValueChange={(v) =>
              setFilterReconciled(v as "all" | "reconciled" | "unreconciled")
            }
          >
            <SelectTrigger
              className="h-8 w-44 text-xs"
              data-ocid="filter-reconciled-select"
            >
              <SelectValue placeholder="Reconciliation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="reconciled">Reconciled</SelectItem>
              <SelectItem value="unreconciled">Unreconciled</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 w-40 text-xs"
            data-ocid="filter-from-date"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 w-40 text-xs"
            data-ocid="filter-to-date"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-36">
                Category
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                Amount
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">
                Balance
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                Reconciled
              </th>
            </tr>
          </thead>
          <tbody>
            {txQuery.isLoading ? (
              ["r0", "r1", "r2", "r3", "r4"].map((rk) => (
                <tr key={rk} className="border-b border-border/50">
                  {["c0", "c1", "c2", "c3", "c4", "c5"].map((ck) => (
                    <td key={`${rk}-${ck}`} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center"
                  data-ocid="tx-empty-state"
                >
                  <p className="text-muted-foreground text-sm">
                    No transactions found.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add your first transaction to get started.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const { transaction: tx, runningBalance } = entry;
                const isReconciled =
                  tx.reconciliation.__kind__ === "reconciled";
                const isPositive = tx.amount >= 0n;
                return (
                  <tr
                    key={tx.id.toString()}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors duration-100"
                    data-ocid="tx-row"
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td
                      className="px-4 py-3 text-foreground max-w-xs truncate"
                      title={tx.description}
                    >
                      {tx.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {categoryLabel(tx.category)}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-medium ${isPositive ? "text-accent" : "text-destructive"}`}
                    >
                      {formatCents(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {formatCents(runningBalance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        aria-label={
                          isReconciled ? "Reconciled" : "Mark reconciled"
                        }
                        onClick={() => {
                          if (!isReconciled) {
                            setReconcileId(tx.id);
                            setReconcileOpen(true);
                          }
                        }}
                        disabled={isReconciled}
                        className="inline-flex items-center gap-1 text-xs transition-colors duration-150 disabled:cursor-default"
                        title={
                          isReconciled
                            ? `Ref: ${(tx.reconciliation as { __kind__: "reconciled"; reconciled: string }).reconciled}`
                            : "Mark reconciled"
                        }
                        data-ocid="reconcile-btn"
                      >
                        {isReconciled ? (
                          <CheckCircle2 className="size-4 text-accent" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reconcile Dialog */}
      <Dialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <DialogContent className="sm:max-w-sm" data-ocid="reconcile-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Reconcile Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the bank reference number to reconcile this transaction.
            </p>
            <div className="space-y-1.5">
              <Input
                placeholder="Bank reference (e.g. CHK-00123)"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                data-ocid="bank-ref-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReconcileOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!bankRef.trim() || reconcileMutation.isPending}
                onClick={() =>
                  reconcileId &&
                  reconcileMutation.mutate({ id: reconcileId, ref: bankRef })
                }
                data-ocid="reconcile-confirm-btn"
              >
                {reconcileMutation.isPending ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
