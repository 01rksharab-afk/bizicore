import type { backendInterface } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getOrgId(): bigint {
  return BigInt(sessionStorage.getItem("activeOrgId") ?? "0");
}

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export function useListSalesOrders() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["salesOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listSalesOrders(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSalesOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createSalesOrder"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createSalesOrder(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesOrders"] });
      toast.success("Sales order created");
    },
    onError: () => toast.error("Failed to create sales order"),
  });
}

export function useUpdateSalesOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateSalesOrder"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateSalesOrder(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesOrders"] });
      toast.success("Sales order updated");
    },
    onError: () => toast.error("Failed to update sales order"),
  });
}

export function useConfirmSalesOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).confirmSalesOrder(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesOrders"] });
      toast.success("Sales order confirmed");
    },
    onError: () => toast.error("Failed to confirm sales order"),
  });
}

// ─── Quotations ───────────────────────────────────────────────────────────────

export function useListQuotations() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listQuotations(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateQuotation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createQuotation"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createQuotation(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation created");
    },
    onError: () => toast.error("Failed to create quotation"),
  });
}

export function useUpdateQuotation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateQuotation"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateQuotation(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation updated");
    },
    onError: () => toast.error("Failed to update quotation"),
  });
}

export function useConvertQuotationToSalesOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).convertQuotationToSalesOrder(
        getOrgId(),
        quoteId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesOrders"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation converted to sales order");
    },
    onError: () => toast.error("Failed to convert quotation"),
  });
}

// ─── Sale Debit Notes ─────────────────────────────────────────────────────────

export function useListSaleDebitNotes() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["saleDebitNotes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listSaleDebitNotes(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleDebitNote() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createSaleDebitNote"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createSaleDebitNote(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saleDebitNotes"] });
      toast.success("Debit note created");
    },
    onError: () => toast.error("Failed to create debit note"),
  });
}

// ─── Sale Credit Notes ────────────────────────────────────────────────────────

export function useListSaleCreditNotes() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["saleCreditNotes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listSaleCreditNotes(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleCreditNote() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createSaleCreditNote"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createSaleCreditNote(
        getOrgId(),
        input,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saleCreditNotes"] });
      toast.success("Credit note created");
    },
    onError: () => toast.error("Failed to create credit note"),
  });
}

// ─── Sale Returns ─────────────────────────────────────────────────────────────

export function useListSaleReturns() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["saleReturns"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listSaleReturns(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleReturn() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createSaleReturn"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createSaleReturn(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saleReturns"] });
      toast.success("Sale return created");
    },
    onError: () => toast.error("Failed to create sale return"),
  });
}

// ─── Customer Receipts ────────────────────────────────────────────────────────

export function useListCustomerReceipts() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["customerReceipts"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listCustomerReceipts(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomerReceipt() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createCustomerReceipt"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createCustomerReceipt(
        getOrgId(),
        input,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customerReceipts"] });
      toast.success("Receipt recorded");
    },
    onError: () => toast.error("Failed to record receipt"),
  });
}

// ─── POS Transactions ─────────────────────────────────────────────────────────

export function useListPosTransactions() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["posTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listPosTransactions(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePosTransaction() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createPosTransaction"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createPosTransaction(
        getOrgId(),
        input,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posTransactions"] });
      toast.success("POS transaction created");
    },
    onError: () => toast.error("Failed to create POS transaction"),
  });
}
