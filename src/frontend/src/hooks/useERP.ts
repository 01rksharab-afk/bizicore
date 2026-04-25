/**
 * ERP Manufacturing hooks — wired to the real backend actor.
 * All 12 sub-modules use React Query with proper loading/error states.
 */
import { MachineStatus, MoStatus, QcResult, WorkOrderStatus } from "@/backend";
import type {
  BillOfMaterial,
  BomComponent,
  BomId,
  CostOfProduction,
  CreateBomInput,
  CreateCostOfProductionInput,
  CreateFinishedGoodInput,
  CreateMachineInput,
  CreateManufacturingOrderInput,
  CreateProductionPlanInput,
  CreateQualityControlInput,
  CreateRequisitionInput,
  CreateRoutingOperationInput,
  CreateScrapRecordInput,
  CreateShopFloorInput,
  CreateWorkOrderInput,
  FinishedGood,
  Machine,
  ManufacturingOrder,
  ProductionPlan,
  QualityControl,
  RawMaterialRequisition,
  RequisitionItem,
  RoutingOperation,
  ScrapRecord,
  ShopFloorControl,
  UpdateBomInput,
  UpdateCostOfProductionInput,
  UpdateFinishedGoodInput,
  UpdateMachineInput,
  UpdateManufacturingOrderInput,
  UpdateProductionPlanInput,
  UpdateQualityControlInput,
  UpdateRequisitionInput,
  UpdateRoutingOperationInput,
  UpdateScrapRecordInput,
  UpdateShopFloorInput,
  UpdateWorkOrderInput,
  WorkOrder,
} from "@/backend";
// Re-export enum values for consumers
export { QcResult, MoStatus, WorkOrderStatus, MachineStatus };
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Local display type aliases (backward-compatible for badges/forms) ────────

/** String alias used by ErpStatusBadge — backend status is plain string */
export type ErpStatus = string;
/** String alias used by PriorityBadge — not a backend concept */
export type ErpPriority = string;

// Re-export backend types for components to use
export type {
  BillOfMaterial,
  BomComponent,
  BomId,
  CostOfProduction,
  CreateBomInput,
  CreateCostOfProductionInput,
  CreateFinishedGoodInput,
  CreateManufacturingOrderInput,
  CreateMachineInput,
  CreateProductionPlanInput,
  CreateQualityControlInput,
  CreateRequisitionInput,
  CreateRoutingOperationInput,
  CreateScrapRecordInput,
  CreateShopFloorInput,
  CreateWorkOrderInput,
  FinishedGood,
  Machine,
  ManufacturingOrder,
  ProductionPlan,
  QualityControl,
  RawMaterialRequisition,
  RequisitionItem,
  RoutingOperation,
  ScrapRecord,
  ShopFloorControl,
  UpdateBomInput,
  UpdateCostOfProductionInput,
  UpdateFinishedGoodInput,
  UpdateManufacturingOrderInput,
  UpdateMachineInput,
  UpdateProductionPlanInput,
  UpdateQualityControlInput,
  UpdateRequisitionInput,
  UpdateRoutingOperationInput,
  UpdateScrapRecordInput,
  UpdateShopFloorInput,
  UpdateWorkOrderInput,
  WorkOrder,
};

// ─── orgId helper ─────────────────────────────────────────────────────────────

function getOrgId(): bigint {
  try {
    return BigInt(localStorage.getItem("bizcore_active_org") ?? "0");
  } catch {
    return BigInt(0);
  }
}

// ─── ERP module enable/disable ────────────────────────────────────────────────

export function useErpModuleEnabled() {
  const { actor, isFetching } = useBackendActor();
  const qc = useQueryClient();

  const query = useQuery<boolean>({
    queryKey: ["erpModuleEnabled"],
    queryFn: async () => {
      if (!actor) return true;
      return actor.getErpModuleEnabled(getOrgId());
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Not ready");
      return actor.setErpModuleEnabled(getOrgId(), enabled);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["erpModuleEnabled"] });
    },
    onError: () => toast.error("Failed to update ERP module setting"),
  });

  return {
    enabled: query.data ?? true,
    isLoading: query.isLoading,
    toggle: (v: boolean) => mutation.mutate(v),
  };
}

// ─── BOM hooks ────────────────────────────────────────────────────────────────

export function useListBoms(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<BillOfMaterial[]>({
    queryKey: ["boms", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listBoms(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (b) =>
          b.productName.toLowerCase().includes(q) ||
          b.revision.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateBom() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBomInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createBom(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boms"] });
      toast.success("BOM created");
    },
    onError: () => toast.error("Failed to create BOM"),
  });
}

export function useUpdateBom() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBomInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateBom(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boms"] });
      toast.success("BOM updated");
    },
    onError: () => toast.error("Failed to update BOM"),
  });
}

export function useDeleteBom() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteBom(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boms"] });
      toast.success("BOM deleted");
    },
    onError: () => toast.error("Failed to delete BOM"),
  });
}

export function useToggleBomEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Work Order hooks ─────────────────────────────────────────────────────────

export function useListWorkOrders(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<WorkOrder[]>({
    queryKey: ["workOrders", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listWorkOrders(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (wo) =>
          wo.status.toLowerCase().includes(q) ||
          wo.notes.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateWorkOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkOrderInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createWorkOrder(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workOrders"] });
      toast.success("Work Order created");
    },
    onError: () => toast.error("Failed to create Work Order"),
  });
}

export function useUpdateWorkOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateWorkOrderInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateWorkOrder(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workOrders"] });
      toast.success("Work Order updated");
    },
    onError: () => toast.error("Failed to update Work Order"),
  });
}

export function useDeleteWorkOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteWorkOrder(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workOrders"] });
      toast.success("Work Order deleted");
    },
    onError: () => toast.error("Failed to delete Work Order"),
  });
}

export function useToggleWorkOrderEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Production Plan hooks ────────────────────────────────────────────────────

export function useListProductionPlans(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ProductionPlan[]>({
    queryKey: ["productionPlans", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listProductionPlans(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (pp) =>
          pp.period.toLowerCase().includes(q) ||
          pp.status.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateProductionPlan() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductionPlanInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createProductionPlan(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productionPlans"] });
      toast.success("Production Plan created");
    },
    onError: () => toast.error("Failed to create Production Plan"),
  });
}

export function useUpdateProductionPlan() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProductionPlanInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateProductionPlan(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productionPlans"] });
      toast.success("Production Plan updated");
    },
    onError: () => toast.error("Failed to update Production Plan"),
  });
}

export function useDeleteProductionPlan() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteProductionPlan(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productionPlans"] });
      toast.success("Production Plan deleted");
    },
    onError: () => toast.error("Failed to delete Production Plan"),
  });
}

export function useToggleProductionPlanEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Manufacturing Order hooks ────────────────────────────────────────────────

export function useListManufacturingOrders(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ManufacturingOrder[]>({
    queryKey: ["manufacturingOrders", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listManufacturingOrders(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter((mo) => mo.status.toLowerCase().includes(q));
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateManufacturingOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateManufacturingOrderInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createManufacturingOrder(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manufacturingOrders"] });
      toast.success("Manufacturing Order created");
    },
    onError: () => toast.error("Failed to create Manufacturing Order"),
  });
}

export function useUpdateManufacturingOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateManufacturingOrderInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateManufacturingOrder(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manufacturingOrders"] });
      toast.success("Manufacturing Order updated");
    },
    onError: () => toast.error("Failed to update Manufacturing Order"),
  });
}

export function useDeleteManufacturingOrder() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteManufacturingOrder(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manufacturingOrders"] });
      toast.success("Manufacturing Order deleted");
    },
    onError: () => toast.error("Failed to delete Manufacturing Order"),
  });
}

export function useToggleManufacturingOrderEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Raw Material Requisition hooks ──────────────────────────────────────────

export function useListRawMaterialRequisitions(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RawMaterialRequisition[]>({
    queryKey: ["rawMaterialRequisitions", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listRawMaterialRequisitions(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (r) =>
          r.status.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateRawMaterialRequisition() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRequisitionInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createRawMaterialRequisition(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rawMaterialRequisitions"] });
      toast.success("Raw Material Requisition created");
    },
    onError: () => toast.error("Failed to create Raw Material Requisition"),
  });
}

export function useUpdateRawMaterialRequisition() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateRequisitionInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateRawMaterialRequisition(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rawMaterialRequisitions"] });
      toast.success("Requisition updated");
    },
    onError: () => toast.error("Failed to update Requisition"),
  });
}

export function useDeleteRawMaterialRequisition() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteRawMaterialRequisition(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rawMaterialRequisitions"] });
      toast.success("Requisition deleted");
    },
    onError: () => toast.error("Failed to delete Requisition"),
  });
}

export function useToggleRawMaterialRequisitionEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Shop Floor Control hooks ─────────────────────────────────────────────────

export function useListShopFloorControls(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ShopFloorControl[]>({
    queryKey: ["shopFloorControls", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listShopFloorControls(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (sfc) =>
          sfc.status.toLowerCase().includes(q) ||
          sfc.operatorName.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateShopFloorControl() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateShopFloorInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createShopFloorControl(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopFloorControls"] });
      toast.success("Shop Floor Control created");
    },
    onError: () => toast.error("Failed to create Shop Floor Control"),
  });
}

export function useUpdateShopFloorControl() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateShopFloorInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateShopFloorControl(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopFloorControls"] });
      toast.success("Shop Floor Control updated");
    },
    onError: () => toast.error("Failed to update Shop Floor Control"),
  });
}

export function useDeleteShopFloorControl() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteShopFloorControl(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopFloorControls"] });
      toast.success("Shop Floor Control deleted");
    },
    onError: () => toast.error("Failed to delete Shop Floor Control"),
  });
}

export function useToggleShopFloorControlEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Quality Control hooks ────────────────────────────────────────────────────

export function useListQualityControls(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<QualityControl[]>({
    queryKey: ["qualityControls", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listQualityControls(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (qc_) =>
          qc_.inspector.toLowerCase().includes(q) ||
          qc_.result.toLowerCase().includes(q) ||
          qc_.notes.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateQualityControl() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateQualityControlInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createQualityControl(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qualityControls"] });
      toast.success("Quality Control record created");
    },
    onError: () => toast.error("Failed to create Quality Control"),
  });
}

export function useUpdateQualityControl() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateQualityControlInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateQualityControl(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qualityControls"] });
      toast.success("Quality Control updated");
    },
    onError: () => toast.error("Failed to update Quality Control"),
  });
}

export function useDeleteQualityControl() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteQualityControl(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qualityControls"] });
      toast.success("Quality Control deleted");
    },
    onError: () => toast.error("Failed to delete Quality Control"),
  });
}

export function useToggleQualityControlEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Finished Goods hooks ─────────────────────────────────────────────────────

export function useListFinishedGoods(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<FinishedGood[]>({
    queryKey: ["finishedGoods", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listFinishedGoods(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (fg) =>
          fg.batchNo.toLowerCase().includes(q) ||
          fg.warehouseLocation.toLowerCase().includes(q) ||
          fg.status.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateFinishedGood() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFinishedGoodInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createFinishedGood(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finishedGoods"] });
      toast.success("Finished Good recorded");
    },
    onError: () => toast.error("Failed to create Finished Good"),
  });
}

export function useUpdateFinishedGood() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateFinishedGoodInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateFinishedGood(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finishedGoods"] });
      toast.success("Finished Good updated");
    },
    onError: () => toast.error("Failed to update Finished Good"),
  });
}

export function useDeleteFinishedGood() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteFinishedGood(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finishedGoods"] });
      toast.success("Finished Good deleted");
    },
    onError: () => toast.error("Failed to delete Finished Good"),
  });
}

export function useToggleFinishedGoodEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Scrap Record hooks ───────────────────────────────────────────────────────

export function useListScrapRecords(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ScrapRecord[]>({
    queryKey: ["scrapRecords", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listScrapRecords(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (sr) =>
          sr.scrapReason.toLowerCase().includes(q) ||
          sr.recordedBy.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateScrapRecord() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScrapRecordInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createScrapRecord(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrapRecords"] });
      toast.success("Scrap Record created");
    },
    onError: () => toast.error("Failed to create Scrap Record"),
  });
}

export function useUpdateScrapRecord() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateScrapRecordInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateScrapRecord(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrapRecords"] });
      toast.success("Scrap Record updated");
    },
    onError: () => toast.error("Failed to update Scrap Record"),
  });
}

export function useDeleteScrapRecord() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteScrapRecord(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrapRecords"] });
      toast.success("Scrap Record deleted");
    },
    onError: () => toast.error("Failed to delete Scrap Record"),
  });
}

export function useToggleScrapRecordEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Machine hooks ────────────────────────────────────────────────────────────

export function useListMachines(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Machine[]>({
    queryKey: ["machines", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listMachines(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.machineType.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateMachine() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMachineInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createMachine(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Machine created");
    },
    onError: () => toast.error("Failed to create Machine"),
  });
}

export function useUpdateMachine() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateMachineInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateMachine(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Machine updated");
    },
    onError: () => toast.error("Failed to update Machine"),
  });
}

export function useDeleteMachine() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteMachine(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Machine deleted");
    },
    onError: () => toast.error("Failed to delete Machine"),
  });
}

export function useToggleMachineEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Routing Operation hooks ──────────────────────────────────────────────────

export function useListRoutingOperations(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RoutingOperation[]>({
    queryKey: ["routingOperations", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listRoutingOperations(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (ro) =>
          ro.name.toLowerCase().includes(q) ||
          ro.code.toLowerCase().includes(q) ||
          ro.description.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateRoutingOperation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoutingOperationInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createRoutingOperation(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routingOperations"] });
      toast.success("Routing Operation created");
    },
    onError: () => toast.error("Failed to create Routing Operation"),
  });
}

export function useUpdateRoutingOperation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateRoutingOperationInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateRoutingOperation(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routingOperations"] });
      toast.success("Routing Operation updated");
    },
    onError: () => toast.error("Failed to update Routing Operation"),
  });
}

export function useDeleteRoutingOperation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteRoutingOperation(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routingOperations"] });
      toast.success("Routing Operation deleted");
    },
    onError: () => toast.error("Failed to delete Routing Operation"),
  });
}

export function useToggleRoutingOperationEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}

// ─── Cost of Production hooks ─────────────────────────────────────────────────

export function useListCostsOfProduction(search?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<CostOfProduction[]>({
    queryKey: ["costsOfProduction", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listCostsOfProduction(getOrgId());
      if (!search) return all;
      const q = search.toLowerCase();
      return all.filter(
        (cop) =>
          cop.period.toLowerCase().includes(q) ||
          cop.notes.toLowerCase().includes(q),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useCreateCostOfProduction() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCostOfProductionInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.createCostOfProduction(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["costsOfProduction"] });
      toast.success("Cost of Production record created");
    },
    onError: () => toast.error("Failed to create Cost of Production"),
  });
}

export function useUpdateCostOfProduction() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCostOfProductionInput) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateCostOfProduction(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["costsOfProduction"] });
      toast.success("Cost of Production updated");
    },
    onError: () => toast.error("Failed to update Cost of Production"),
  });
}

export function useDeleteCostOfProduction() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteCostOfProduction(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["costsOfProduction"] });
      toast.success("Cost of Production deleted");
    },
    onError: () => toast.error("Failed to delete Cost of Production"),
  });
}

export function useToggleCostOfProductionEnabled() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error("Toggle not available");
    },
  });
}
