import ErpLib "../lib/erp-manufacturing";
import ErpTypes "../types/erp-manufacturing";

mixin (
  erpBoms          : ErpLib.BomMap,
  erpWorkOrders    : ErpLib.WorkOrderMap,
  erpPlans         : ErpLib.PlanMap,
  erpMos           : ErpLib.MoMap,
  erpReqs          : ErpLib.ReqMap,
  erpSfcs          : ErpLib.SfcMap,
  erpQcs           : ErpLib.QcMap,
  erpFgs           : ErpLib.FgMap,
  erpScraps        : ErpLib.ScrapMap,
  erpMachines      : ErpLib.MachineMap,
  erpRoutings      : ErpLib.RoutingMap,
  erpCops          : ErpLib.CopMap,
  erpModuleEnabled : ErpLib.ModuleEnabled,
  nextBomId        : { var value : Nat },
  nextWoId         : { var value : Nat },
  nextPlanId       : { var value : Nat },
  nextMoId         : { var value : Nat },
  nextReqId        : { var value : Nat },
  nextSfcId        : { var value : Nat },
  nextQcId         : { var value : Nat },
  nextFgId         : { var value : Nat },
  nextScrapId      : { var value : Nat },
  nextMachineId    : { var value : Nat },
  nextRoutingId    : { var value : Nat },
  nextCopId        : { var value : Nat },
) {

  // ── Module ON/OFF ──────────────────────────────────────────────────────────

  public query func getErpModuleEnabled(orgId : ErpTypes.OrgId) : async Bool {
    ErpLib.getErpModuleEnabled(erpModuleEnabled, orgId)
  };

  public shared ({ caller }) func setErpModuleEnabled(orgId : ErpTypes.OrgId, enabled : Bool) : async () {
    ErpLib.setErpModuleEnabled(erpModuleEnabled, orgId, enabled)
  };

  // ── Bill of Materials ──────────────────────────────────────────────────────

  public query func listBoms(orgId : ErpTypes.OrgId) : async [ErpTypes.BillOfMaterial] {
    ErpLib.listBoms(erpBoms, orgId)
  };

  public shared ({ caller }) func createBom(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateBomInput,
  ) : async ErpTypes.BillOfMaterial {
    let id = nextBomId.value;
    nextBomId.value += 1;
    ErpLib.createBom(erpBoms, orgId, input, id)
  };

  public shared ({ caller }) func updateBom(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateBomInput,
  ) : async ErpTypes.BillOfMaterial {
    ErpLib.updateBom(erpBoms, orgId, input)
  };

  public shared ({ caller }) func deleteBom(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteBom(erpBoms, orgId, id)
  };

  // ── Work Orders ────────────────────────────────────────────────────────────

  public query func listWorkOrders(orgId : ErpTypes.OrgId) : async [ErpTypes.WorkOrder] {
    ErpLib.listWorkOrders(erpWorkOrders, orgId)
  };

  public query func getWorkOrder(orgId : ErpTypes.OrgId, id : Nat) : async ?ErpTypes.WorkOrder {
    ErpLib.getWorkOrder(erpWorkOrders, orgId, id)
  };

  public shared ({ caller }) func createWorkOrder(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateWorkOrderInput,
  ) : async ErpTypes.WorkOrder {
    let id = nextWoId.value;
    nextWoId.value += 1;
    ErpLib.createWorkOrder(erpWorkOrders, orgId, input, id)
  };

  public shared ({ caller }) func updateWorkOrder(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateWorkOrderInput,
  ) : async ErpTypes.WorkOrder {
    ErpLib.updateWorkOrder(erpWorkOrders, orgId, input)
  };

  public shared ({ caller }) func deleteWorkOrder(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteWorkOrder(erpWorkOrders, orgId, id)
  };

  // ── Production Plans ───────────────────────────────────────────────────────

  public query func listProductionPlans(orgId : ErpTypes.OrgId) : async [ErpTypes.ProductionPlan] {
    ErpLib.listProductionPlans(erpPlans, orgId)
  };

  public shared ({ caller }) func createProductionPlan(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateProductionPlanInput,
  ) : async ErpTypes.ProductionPlan {
    let id = nextPlanId.value;
    nextPlanId.value += 1;
    ErpLib.createProductionPlan(erpPlans, orgId, input, id)
  };

  public shared ({ caller }) func updateProductionPlan(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateProductionPlanInput,
  ) : async ErpTypes.ProductionPlan {
    ErpLib.updateProductionPlan(erpPlans, orgId, input)
  };

  public shared ({ caller }) func deleteProductionPlan(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteProductionPlan(erpPlans, orgId, id)
  };

  // ── Manufacturing Orders ───────────────────────────────────────────────────

  public query func listManufacturingOrders(orgId : ErpTypes.OrgId) : async [ErpTypes.ManufacturingOrder] {
    ErpLib.listManufacturingOrders(erpMos, orgId)
  };

  public shared ({ caller }) func createManufacturingOrder(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateManufacturingOrderInput,
  ) : async ErpTypes.ManufacturingOrder {
    let id = nextMoId.value;
    nextMoId.value += 1;
    ErpLib.createManufacturingOrder(erpMos, orgId, input, id)
  };

  public shared ({ caller }) func updateManufacturingOrder(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateManufacturingOrderInput,
  ) : async ErpTypes.ManufacturingOrder {
    ErpLib.updateManufacturingOrder(erpMos, orgId, input)
  };

  public shared ({ caller }) func deleteManufacturingOrder(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteManufacturingOrder(erpMos, orgId, id)
  };

  // ── Raw Material Requisitions ──────────────────────────────────────────────

  public query func listRawMaterialRequisitions(orgId : ErpTypes.OrgId) : async [ErpTypes.RawMaterialRequisition] {
    ErpLib.listRawMaterialRequisitions(erpReqs, orgId)
  };

  public shared ({ caller }) func createRawMaterialRequisition(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateRequisitionInput,
  ) : async ErpTypes.RawMaterialRequisition {
    let id = nextReqId.value;
    nextReqId.value += 1;
    ErpLib.createRawMaterialRequisition(erpReqs, orgId, input, id)
  };

  public shared ({ caller }) func updateRawMaterialRequisition(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateRequisitionInput,
  ) : async ErpTypes.RawMaterialRequisition {
    ErpLib.updateRawMaterialRequisition(erpReqs, orgId, input)
  };

  public shared ({ caller }) func deleteRawMaterialRequisition(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteRawMaterialRequisition(erpReqs, orgId, id)
  };

  // ── Shop Floor Control ─────────────────────────────────────────────────────

  public query func listShopFloorControls(orgId : ErpTypes.OrgId) : async [ErpTypes.ShopFloorControl] {
    ErpLib.listShopFloorControls(erpSfcs, orgId)
  };

  public shared ({ caller }) func createShopFloorControl(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateShopFloorInput,
  ) : async ErpTypes.ShopFloorControl {
    let id = nextSfcId.value;
    nextSfcId.value += 1;
    ErpLib.createShopFloorControl(erpSfcs, orgId, input, id)
  };

  public shared ({ caller }) func updateShopFloorControl(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateShopFloorInput,
  ) : async ErpTypes.ShopFloorControl {
    ErpLib.updateShopFloorControl(erpSfcs, orgId, input)
  };

  public shared ({ caller }) func deleteShopFloorControl(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteShopFloorControl(erpSfcs, orgId, id)
  };

  // ── Quality Control ────────────────────────────────────────────────────────

  public query func listQualityControls(orgId : ErpTypes.OrgId) : async [ErpTypes.QualityControl] {
    ErpLib.listQualityControls(erpQcs, orgId)
  };

  public shared ({ caller }) func createQualityControl(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateQualityControlInput,
  ) : async ErpTypes.QualityControl {
    let id = nextQcId.value;
    nextQcId.value += 1;
    ErpLib.createQualityControl(erpQcs, orgId, input, id)
  };

  public shared ({ caller }) func updateQualityControl(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateQualityControlInput,
  ) : async ErpTypes.QualityControl {
    ErpLib.updateQualityControl(erpQcs, orgId, input)
  };

  public shared ({ caller }) func deleteQualityControl(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteQualityControl(erpQcs, orgId, id)
  };

  // ── Finished Goods ─────────────────────────────────────────────────────────

  public query func listFinishedGoods(orgId : ErpTypes.OrgId) : async [ErpTypes.FinishedGood] {
    ErpLib.listFinishedGoods(erpFgs, orgId)
  };

  public shared ({ caller }) func createFinishedGood(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateFinishedGoodInput,
  ) : async ErpTypes.FinishedGood {
    let id = nextFgId.value;
    nextFgId.value += 1;
    ErpLib.createFinishedGood(erpFgs, orgId, input, id)
  };

  public shared ({ caller }) func updateFinishedGood(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateFinishedGoodInput,
  ) : async ErpTypes.FinishedGood {
    ErpLib.updateFinishedGood(erpFgs, orgId, input)
  };

  public shared ({ caller }) func deleteFinishedGood(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteFinishedGood(erpFgs, orgId, id)
  };

  // ── Scrap Records ──────────────────────────────────────────────────────────

  public query func listScrapRecords(orgId : ErpTypes.OrgId) : async [ErpTypes.ScrapRecord] {
    ErpLib.listScrapRecords(erpScraps, orgId)
  };

  public shared ({ caller }) func createScrapRecord(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateScrapRecordInput,
  ) : async ErpTypes.ScrapRecord {
    let id = nextScrapId.value;
    nextScrapId.value += 1;
    ErpLib.createScrapRecord(erpScraps, orgId, input, id)
  };

  public shared ({ caller }) func updateScrapRecord(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateScrapRecordInput,
  ) : async ErpTypes.ScrapRecord {
    ErpLib.updateScrapRecord(erpScraps, orgId, input)
  };

  public shared ({ caller }) func deleteScrapRecord(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteScrapRecord(erpScraps, orgId, id)
  };

  // ── Machines ───────────────────────────────────────────────────────────────

  public query func listMachines(orgId : ErpTypes.OrgId) : async [ErpTypes.Machine] {
    ErpLib.listMachines(erpMachines, orgId)
  };

  public shared ({ caller }) func createMachine(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateMachineInput,
  ) : async ErpTypes.Machine {
    let id = nextMachineId.value;
    nextMachineId.value += 1;
    ErpLib.createMachine(erpMachines, orgId, input, id)
  };

  public shared ({ caller }) func updateMachine(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateMachineInput,
  ) : async ErpTypes.Machine {
    ErpLib.updateMachine(erpMachines, orgId, input)
  };

  public shared ({ caller }) func deleteMachine(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteMachine(erpMachines, orgId, id)
  };

  // ── Routing Operations ─────────────────────────────────────────────────────

  public query func listRoutingOperations(orgId : ErpTypes.OrgId) : async [ErpTypes.RoutingOperation] {
    ErpLib.listRoutingOperations(erpRoutings, orgId)
  };

  public shared ({ caller }) func createRoutingOperation(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateRoutingOperationInput,
  ) : async ErpTypes.RoutingOperation {
    let id = nextRoutingId.value;
    nextRoutingId.value += 1;
    ErpLib.createRoutingOperation(erpRoutings, orgId, input, id)
  };

  public shared ({ caller }) func updateRoutingOperation(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateRoutingOperationInput,
  ) : async ErpTypes.RoutingOperation {
    ErpLib.updateRoutingOperation(erpRoutings, orgId, input)
  };

  public shared ({ caller }) func deleteRoutingOperation(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteRoutingOperation(erpRoutings, orgId, id)
  };

  // ── Cost of Production ─────────────────────────────────────────────────────

  public query func listCostsOfProduction(orgId : ErpTypes.OrgId) : async [ErpTypes.CostOfProduction] {
    ErpLib.listCostsOfProduction(erpCops, orgId)
  };

  public shared ({ caller }) func createCostOfProduction(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.CreateCostOfProductionInput,
  ) : async ErpTypes.CostOfProduction {
    let id = nextCopId.value;
    nextCopId.value += 1;
    ErpLib.createCostOfProduction(erpCops, orgId, input, id)
  };

  public shared ({ caller }) func updateCostOfProduction(
    orgId : ErpTypes.OrgId,
    input : ErpTypes.UpdateCostOfProductionInput,
  ) : async ErpTypes.CostOfProduction {
    ErpLib.updateCostOfProduction(erpCops, orgId, input)
  };

  public shared ({ caller }) func deleteCostOfProduction(orgId : ErpTypes.OrgId, id : Nat) : async () {
    ErpLib.deleteCostOfProduction(erpCops, orgId, id)
  };

};

