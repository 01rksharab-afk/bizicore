import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

export type POStatus = "draft" | "sent" | "approved" | "billed";
export type BillStatus =
  | "draft"
  | "approved"
  | "paid"
  | "partially_paid"
  | "overdue";
export type NoteStatus = "open" | "applied" | "cancelled";
export type ReturnStatus = "pending" | "processed" | "cancelled";
export type PaymentMode = "cash" | "bank" | "upi" | "cheque";

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  taxPercent: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  date: string;
  lineItems: LineItem[];
  notes: string;
  status: POStatus;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  supplier: string;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
  amountPaid: number;
  status: BillStatus;
}

export interface PurchaseCreditNote {
  id: string;
  creditNumber: string;
  supplier: string;
  referenceBillId: string;
  referenceBillNumber: string;
  amount: number;
  date: string;
  reason: string;
  lineItems: LineItem[];
  status: NoteStatus;
}

export interface PurchaseDebitNote {
  id: string;
  debitNumber: string;
  supplier: string;
  referenceBillId: string;
  referenceBillNumber: string;
  amount: number;
  date: string;
  reason: string;
  lineItems: LineItem[];
  status: NoteStatus;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  supplier: string;
  referenceBillId: string;
  referenceBillNumber: string;
  lineItems: LineItem[];
  reason: string;
  date: string;
  status: ReturnStatus;
}

export interface SupplierPayment {
  id: string;
  paymentRef: string;
  supplier: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  billReference: string;
  isAdvance: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calcLineItemTotal(li: LineItem): number {
  return li.qty * li.rate * (1 + li.taxPercent / 100);
}

export function calcTotal(items: LineItem[]): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = items.reduce((s, li) => s + li.qty * li.rate, 0);
  const tax = items.reduce(
    (s, li) => s + li.qty * li.rate * (li.taxPercent / 100),
    0,
  );
  return { subtotal, tax, total: subtotal + tax };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function newLineItem(): LineItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: "",
    qty: 1,
    rate: 0,
    taxPercent: 18,
  };
}

let _poSeq = 1;
let _billSeq = 1;
let _cnSeq = 1;
let _dnSeq = 1;
let _retSeq = 1;
let _paySeq = 1;

// ── In-memory store (replaces backend until bindgen wires real methods) ────────

const store = {
  orders: [] as PurchaseOrder[],
  bills: [] as PurchaseBill[],
  creditNotes: [] as PurchaseCreditNote[],
  debitNotes: [] as PurchaseDebitNote[],
  returns: [] as PurchaseReturn[],
  payments: [] as SupplierPayment[],
};

// ── Purchase Orders ────────────────────────────────────────────────────────────

export function useListPurchaseOrders(orgId: string | null | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return store.orders;
      try {
        // @ts-expect-error — method added in future bindgen
        const res = await actor.listPurchaseOrders(orgId);
        if (Array.isArray(res)) return res as unknown as PurchaseOrder[];
      } catch {
        /* fall through to in-memory */
      }
      return store.orders;
    },
    enabled: !isFetching,
    staleTime: 10_000,
  });
}

export function useCreatePurchaseOrder(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PurchaseOrder, "id" | "poNumber" | "status">,
    ) => {
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.createPurchaseOrder(orgId, input);
      } catch {
        /* in-memory fallback */
      }
      const order: PurchaseOrder = {
        ...input,
        id: Math.random().toString(36).slice(2),
        poNumber: `PO-${String(_poSeq++).padStart(4, "0")}`,
        status: "draft",
      };
      store.orders.unshift(order);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", orgId] });
      toast.success("Purchase Order created");
    },
    onError: () => toast.error("Failed to create Purchase Order"),
  });
}

export function useUpdatePurchaseOrder(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PurchaseOrder> & { id: string }) => {
      const idx = store.orders.findIndex((o) => o.id === input.id);
      if (idx !== -1) store.orders[idx] = { ...store.orders[idx], ...input };
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.updatePurchaseOrder(orgId, input);
      } catch {
        /* in-memory only */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", orgId] });
      toast.success("Purchase Order updated");
    },
    onError: () => toast.error("Failed to update Purchase Order"),
  });
}

export function useDeletePurchaseOrder(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      store.orders = store.orders.filter((o) => o.id !== id);
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.deletePurchaseOrder(orgId, id);
      } catch {
        /* in-memory only */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", orgId] });
      toast.success("Purchase Order deleted");
    },
    onError: () => toast.error("Failed to delete Purchase Order"),
  });
}

export function useApprovePurchaseOrder(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const order = store.orders.find((o) => o.id === id);
      if (order) {
        order.status = "approved";
        // Auto-create a Bill from this PO
        const bill: PurchaseBill = {
          id: Math.random().toString(36).slice(2),
          billNumber: `BILL-${String(_billSeq++).padStart(4, "0")}`,
          supplier: order.supplier,
          date: order.date,
          dueDate: order.date,
          lineItems: order.lineItems,
          amountPaid: 0,
          status: "approved",
        };
        store.bills.unshift(bill);
      }
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.approvePurchaseOrder(orgId, id);
      } catch {
        /* in-memory */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", orgId] });
      qc.invalidateQueries({ queryKey: ["purchase-bills", orgId] });
      toast.success("Purchase Order approved — Bill created");
    },
    onError: () => toast.error("Failed to approve Purchase Order"),
  });
}

// ── Purchase Bills ─────────────────────────────────────────────────────────────

export function useListPurchaseBills(orgId: string | null | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PurchaseBill[]>({
    queryKey: ["purchase-bills", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return store.bills;
      try {
        // @ts-expect-error — future method
        const res = await actor.listPurchaseBills(orgId);
        if (Array.isArray(res)) return res as unknown as PurchaseBill[];
      } catch {
        /* in-memory */
      }
      return store.bills;
    },
    enabled: !isFetching,
    staleTime: 10_000,
  });
}

export function useCreatePurchaseBill(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PurchaseBill, "id" | "billNumber" | "status" | "amountPaid">,
    ) => {
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.createPurchaseBill(orgId, input);
      } catch {
        /* in-memory */
      }
      const bill: PurchaseBill = {
        ...input,
        id: Math.random().toString(36).slice(2),
        billNumber: `BILL-${String(_billSeq++).padStart(4, "0")}`,
        amountPaid: 0,
        status: "draft",
      };
      store.bills.unshift(bill);
      return bill;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-bills", orgId] });
      toast.success("Bill created");
    },
    onError: () => toast.error("Failed to create Bill"),
  });
}

export function useUpdatePurchaseBill(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PurchaseBill> & { id: string }) => {
      const idx = store.bills.findIndex((b) => b.id === input.id);
      if (idx !== -1) store.bills[idx] = { ...store.bills[idx], ...input };
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.updatePurchaseBill(orgId, input);
      } catch {
        /* in-memory */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-bills", orgId] });
      toast.success("Bill updated");
    },
    onError: () => toast.error("Failed to update Bill"),
  });
}

export function useDeletePurchaseBill(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      store.bills = store.bills.filter((b) => b.id !== id);
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.deletePurchaseBill(orgId, id);
      } catch {
        /* in-memory */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-bills", orgId] });
      toast.success("Bill deleted");
    },
    onError: () => toast.error("Failed to delete Bill"),
  });
}

// ── Purchase Credit Notes ──────────────────────────────────────────────────────

export function useListPurchaseCreditNotes(orgId: string | null | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PurchaseCreditNote[]>({
    queryKey: ["purchase-credit-notes", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return store.creditNotes;
      try {
        // @ts-expect-error — future method
        const res = await actor.listPurchaseCreditNotes(orgId);
        if (Array.isArray(res)) return res as unknown as PurchaseCreditNote[];
      } catch {
        /* in-memory */
      }
      return store.creditNotes;
    },
    enabled: !isFetching,
    staleTime: 10_000,
  });
}

export function useCreatePurchaseCreditNote(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PurchaseCreditNote, "id" | "creditNumber" | "status">,
    ) => {
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.createPurchaseCreditNote(orgId, input);
      } catch {
        /* in-memory */
      }
      const note: PurchaseCreditNote = {
        ...input,
        id: Math.random().toString(36).slice(2),
        creditNumber: `CN-${String(_cnSeq++).padStart(4, "0")}`,
        status: "open",
      };
      store.creditNotes.unshift(note);
      return note;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-credit-notes", orgId] });
      toast.success("Credit Note created");
    },
    onError: () => toast.error("Failed to create Credit Note"),
  });
}

export function useDeletePurchaseCreditNote(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      store.creditNotes = store.creditNotes.filter((n) => n.id !== id);
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.deletePurchaseCreditNote(orgId, id);
      } catch {
        /* in-memory */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-credit-notes", orgId] });
      toast.success("Credit Note deleted");
    },
    onError: () => toast.error("Failed to delete Credit Note"),
  });
}

// ── Purchase Debit Notes ───────────────────────────────────────────────────────

export function useListPurchaseDebitNotes(orgId: string | null | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PurchaseDebitNote[]>({
    queryKey: ["purchase-debit-notes", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return store.debitNotes;
      try {
        // @ts-expect-error — future method
        const res = await actor.listPurchaseDebitNotes(orgId);
        if (Array.isArray(res)) return res as unknown as PurchaseDebitNote[];
      } catch {
        /* in-memory */
      }
      return store.debitNotes;
    },
    enabled: !isFetching,
    staleTime: 10_000,
  });
}

export function useCreatePurchaseDebitNote(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PurchaseDebitNote, "id" | "debitNumber" | "status">,
    ) => {
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.createPurchaseDebitNote(orgId, input);
      } catch {
        /* in-memory */
      }
      const note: PurchaseDebitNote = {
        ...input,
        id: Math.random().toString(36).slice(2),
        debitNumber: `DN-${String(_dnSeq++).padStart(4, "0")}`,
        status: "open",
      };
      store.debitNotes.unshift(note);
      return note;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-debit-notes", orgId] });
      toast.success("Debit Note created");
    },
    onError: () => toast.error("Failed to create Debit Note"),
  });
}

export function useDeletePurchaseDebitNote(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      store.debitNotes = store.debitNotes.filter((n) => n.id !== id);
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.deletePurchaseDebitNote(orgId, id);
      } catch {
        /* in-memory */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-debit-notes", orgId] });
      toast.success("Debit Note deleted");
    },
    onError: () => toast.error("Failed to delete Debit Note"),
  });
}

// ── Purchase Returns ───────────────────────────────────────────────────────────

export function useListPurchaseReturns(orgId: string | null | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PurchaseReturn[]>({
    queryKey: ["purchase-returns", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return store.returns;
      try {
        // @ts-expect-error — future method
        const res = await actor.listPurchaseReturns(orgId);
        if (Array.isArray(res)) return res as unknown as PurchaseReturn[];
      } catch {
        /* in-memory */
      }
      return store.returns;
    },
    enabled: !isFetching,
    staleTime: 10_000,
  });
}

export function useCreatePurchaseReturn(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PurchaseReturn, "id" | "returnNumber" | "status">,
    ) => {
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.createPurchaseReturn(orgId, input);
      } catch {
        /* in-memory */
      }
      const ret: PurchaseReturn = {
        ...input,
        id: Math.random().toString(36).slice(2),
        returnNumber: `RET-${String(_retSeq++).padStart(4, "0")}`,
        status: "pending",
      };
      store.returns.unshift(ret);
      return ret;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-returns", orgId] });
      toast.success("Purchase Return created");
    },
    onError: () => toast.error("Failed to create Purchase Return"),
  });
}

export function useDeletePurchaseReturn(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      store.returns = store.returns.filter((r) => r.id !== id);
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.deletePurchaseReturn(orgId, id);
      } catch {
        /* in-memory */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-returns", orgId] });
      toast.success("Return deleted");
    },
    onError: () => toast.error("Failed to delete Return"),
  });
}

// ── Supplier Payments ──────────────────────────────────────────────────────────

export function useListSupplierPayments(orgId: string | null | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<SupplierPayment[]>({
    queryKey: ["supplier-payments", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return store.payments;
      try {
        // @ts-expect-error — future method
        const res = await actor.listSupplierPayments(orgId);
        if (Array.isArray(res)) return res as unknown as SupplierPayment[];
      } catch {
        /* in-memory */
      }
      return store.payments;
    },
    enabled: !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateSupplierPayment(orgId: string | null | undefined) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<SupplierPayment, "id" | "paymentRef">) => {
      try {
        // @ts-expect-error — future method
        if (actor && orgId) await actor.createSupplierPayment(orgId, input);
      } catch {
        /* in-memory */
      }
      const payment: SupplierPayment = {
        ...input,
        id: Math.random().toString(36).slice(2),
        paymentRef: `PAY-${String(_paySeq++).padStart(4, "0")}`,
      };
      store.payments.unshift(payment);
      return payment;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["supplier-payments", orgId] });
      qc.invalidateQueries({ queryKey: ["purchase-bills", orgId] });
      toast.success(
        input.isAdvance ? "Advance Payment recorded" : "Payment recorded",
      );
    },
    onError: () => toast.error("Failed to record payment"),
  });
}
