import type { OrgId } from "@/backend";
import { AlertTriangle } from "lucide-react";

interface Props {
  orgId: OrgId | null;
}

// AgingReport: backend aging API removed to reduce wasm size.
// Shows empty state — data can be derived client-side from invoice list.
export function AgingReport({ orgId: _orgId }: Props) {
  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden"
      data-ocid="aging-report"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="text-sm font-medium text-foreground">
            Aging Report — Overdue Invoices
          </h2>
        </div>
      </div>
      <div className="px-5 py-12 text-center" data-ocid="aging-empty-state">
        <p className="text-sm text-muted-foreground">
          No overdue invoices. Great work!
        </p>
      </div>
    </div>
  );
}
