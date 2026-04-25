import { TransactionCategory, type TransactionInput } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: TransactionCategory.revenue, label: "Revenue" },
  { value: TransactionCategory.equipment, label: "Equipment" },
  { value: TransactionCategory.travel, label: "Travel" },
  { value: TransactionCategory.software, label: "Software" },
  { value: TransactionCategory.contractorFees, label: "Contractor Fees" },
  { value: TransactionCategory.other, label: "Other" },
];

interface TransactionFormProps {
  onSubmit: (data: TransactionInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function TransactionForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: TransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>(
    TransactionCategory.other,
  );
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amountType, setAmountType] = useState<"income" | "expense">("expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(cents) || cents <= 0) return;
    const finalAmount =
      amountType === "expense" ? -BigInt(cents) : BigInt(cents);
    const dateTs = BigInt(new Date(date).getTime()) * 1_000_000n;
    onSubmit({ amount: finalAmount, category, date: dateTs, description });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-ocid="transaction-form"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tx-amount">Amount ($)</Label>
          <Input
            id="tx-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            data-ocid="tx-amount-input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tx-type">Type</Label>
          <Select
            value={amountType}
            onValueChange={(v) => setAmountType(v as "income" | "expense")}
          >
            <SelectTrigger id="tx-type" data-ocid="tx-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-category">Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as TransactionCategory)}
        >
          <SelectTrigger id="tx-category" data-ocid="tx-category-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-date">Date</Label>
        <Input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          data-ocid="tx-date-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-desc">Description</Label>
        <Textarea
          id="tx-desc"
          placeholder="Brief description…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
          data-ocid="tx-description-input"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          data-ocid="tx-submit-btn"
        >
          {isSubmitting ? "Saving…" : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
