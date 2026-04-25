import CommonTypes "common";

module {
  public type OrgId = CommonTypes.OrgId;
  public type Timestamp = CommonTypes.Timestamp;

  // ── ID aliases ────────────────────────────────────────────────────────────
  public type BomId                  = Nat;
  public type WorkOrderId            = Nat;
  public type ProductionPlanId       = Nat;
  public type ManufacturingOrderId   = Nat;
  public type RequisitionId          = Nat;
  public type ShopFloorId            = Nat;
  public type QualityControlId       = Nat;
  public type FinishedGoodId         = Nat;
  public type ScrapRecordId          = Nat;
  public type MachineId              = Nat;
  public type RoutingOperationId     = Nat;
  public type CostOfProductionId     = Nat;

  // ── Shared enums ──────────────────────────────────────────────────────────
  public type WorkOrderStatus = {
    #planned;
    #inProgress;
    #completed;
    #cancelled;
  };

  public type MoStatus = {
    #draft;
    #released;
    #inProgress;
    #completed;
    #cancelled;
  };

  public type QcResult = { #pass; #fail };

  public type MachineStatus = { #active; #inactive; #maintenance };

  public type ReqItemStatus = { #pending; #issued; #partial };

  // ── Bill of Materials ─────────────────────────────────────────────────────
  public type BomComponent = {
    itemId   : Nat;
    quantity : Float;
    unit     : Text;
    cost     : Float;
  };

  public type BillOfMaterial = {
    id          : BomId;
    orgId       : OrgId;
    productName : Text;
    components  : [BomComponent];
    revision    : Text;
    status      : Text;
    enabled     : Bool;
    createdAt   : Timestamp;
  };

  public type CreateBomInput = {
    productName : Text;
    components  : [BomComponent];
    revision    : Text;
    status      : Text;
  };

  public type UpdateBomInput = {
    id          : BomId;
    productName : Text;
    components  : [BomComponent];
    revision    : Text;
    status      : Text;
    enabled     : Bool;
  };

  // ── Work Orders ───────────────────────────────────────────────────────────
  public type WorkOrder = {
    id           : WorkOrderId;
    orgId        : OrgId;
    bomId        : BomId;
    quantity     : Float;
    plannedStart : Timestamp;
    plannedEnd   : Timestamp;
    actualStart  : ?Timestamp;
    actualEnd    : ?Timestamp;
    status       : WorkOrderStatus;
    enabled      : Bool;
    notes        : Text;
    createdAt    : Timestamp;
  };

  public type CreateWorkOrderInput = {
    bomId        : BomId;
    quantity     : Float;
    plannedStart : Timestamp;
    plannedEnd   : Timestamp;
    notes        : Text;
  };

  public type UpdateWorkOrderInput = {
    id           : WorkOrderId;
    bomId        : BomId;
    quantity     : Float;
    plannedStart : Timestamp;
    plannedEnd   : Timestamp;
    actualStart  : ?Timestamp;
    actualEnd    : ?Timestamp;
    status       : WorkOrderStatus;
    enabled      : Bool;
    notes        : Text;
  };

  // ── Production Plans ──────────────────────────────────────────────────────
  public type ProductionPlan = {
    id           : ProductionPlanId;
    orgId        : OrgId;
    period       : Text;
    workOrderIds : [WorkOrderId];
    targetQty    : Float;
    actualQty    : Float;
    status       : Text;
    enabled      : Bool;
    createdAt    : Timestamp;
  };

  public type CreateProductionPlanInput = {
    period       : Text;
    workOrderIds : [WorkOrderId];
    targetQty    : Float;
    status       : Text;
  };

  public type UpdateProductionPlanInput = {
    id           : ProductionPlanId;
    period       : Text;
    workOrderIds : [WorkOrderId];
    targetQty    : Float;
    actualQty    : Float;
    status       : Text;
    enabled      : Bool;
  };

  // ── Manufacturing Orders ──────────────────────────────────────────────────
  public type ManufacturingOrder = {
    id           : ManufacturingOrderId;
    orgId        : OrgId;
    workOrderId  : WorkOrderId;
    startDate    : Timestamp;
    dueDate      : Timestamp;
    quantity     : Float;
    completedQty : Float;
    status       : MoStatus;
    enabled      : Bool;
    createdAt    : Timestamp;
  };

  public type CreateManufacturingOrderInput = {
    workOrderId : WorkOrderId;
    startDate   : Timestamp;
    dueDate     : Timestamp;
    quantity    : Float;
  };

  public type UpdateManufacturingOrderInput = {
    id           : ManufacturingOrderId;
    workOrderId  : WorkOrderId;
    startDate    : Timestamp;
    dueDate      : Timestamp;
    quantity     : Float;
    completedQty : Float;
    status       : MoStatus;
    enabled      : Bool;
  };

  // ── Raw Material Requisitions ─────────────────────────────────────────────
  public type RequisitionItem = {
    itemId      : Nat;
    requiredQty : Float;
    issuedQty   : Float;
    status      : ReqItemStatus;
  };

  public type RawMaterialRequisition = {
    id          : RequisitionId;
    orgId       : OrgId;
    moId        : ManufacturingOrderId;
    items       : [RequisitionItem];
    requestedBy : Text;
    approvedBy  : Text;
    status      : Text;
    enabled     : Bool;
    createdAt   : Timestamp;
  };

  public type CreateRequisitionInput = {
    moId        : ManufacturingOrderId;
    items       : [RequisitionItem];
    requestedBy : Text;
  };

  public type UpdateRequisitionInput = {
    id          : RequisitionId;
    moId        : ManufacturingOrderId;
    items       : [RequisitionItem];
    requestedBy : Text;
    approvedBy  : Text;
    status      : Text;
    enabled     : Bool;
  };

  // ── Shop Floor Control ────────────────────────────────────────────────────
  public type ShopFloorControl = {
    id           : ShopFloorId;
    orgId        : OrgId;
    workOrderId  : WorkOrderId;
    machineId    : MachineId;
    operationId  : RoutingOperationId;
    startTime    : Timestamp;
    endTime      : ?Timestamp;
    operatorName : Text;
    quantity     : Float;
    status       : Text;
    notes        : Text;
    enabled      : Bool;
    createdAt    : Timestamp;
  };

  public type CreateShopFloorInput = {
    workOrderId  : WorkOrderId;
    machineId    : MachineId;
    operationId  : RoutingOperationId;
    startTime    : Timestamp;
    operatorName : Text;
    quantity     : Float;
    notes        : Text;
  };

  public type UpdateShopFloorInput = {
    id           : ShopFloorId;
    workOrderId  : WorkOrderId;
    machineId    : MachineId;
    operationId  : RoutingOperationId;
    startTime    : Timestamp;
    endTime      : ?Timestamp;
    operatorName : Text;
    quantity     : Float;
    status       : Text;
    notes        : Text;
    enabled      : Bool;
  };

  // ── Quality Control ───────────────────────────────────────────────────────
  public type QualityControl = {
    id             : QualityControlId;
    orgId          : OrgId;
    moId           : ManufacturingOrderId;
    inspectionDate : Timestamp;
    inspector      : Text;
    passQty        : Float;
    failQty        : Float;
    defects        : [Text];
    result         : QcResult;
    notes          : Text;
    enabled        : Bool;
    createdAt      : Timestamp;
  };

  public type CreateQualityControlInput = {
    moId           : ManufacturingOrderId;
    inspectionDate : Timestamp;
    inspector      : Text;
    passQty        : Float;
    failQty        : Float;
    defects        : [Text];
    result         : QcResult;
    notes          : Text;
  };

  public type UpdateQualityControlInput = {
    id             : QualityControlId;
    moId           : ManufacturingOrderId;
    inspectionDate : Timestamp;
    inspector      : Text;
    passQty        : Float;
    failQty        : Float;
    defects        : [Text];
    result         : QcResult;
    notes          : Text;
    enabled        : Bool;
  };

  // ── Finished Goods ────────────────────────────────────────────────────────
  public type FinishedGood = {
    id                : FinishedGoodId;
    orgId             : OrgId;
    moId              : ManufacturingOrderId;
    productId         : Nat;
    quantity          : Float;
    batchNo           : Text;
    productionDate    : Timestamp;
    expiryDate        : ?Timestamp;
    warehouseLocation : Text;
    status            : Text;
    enabled           : Bool;
    createdAt         : Timestamp;
  };

  public type CreateFinishedGoodInput = {
    moId              : ManufacturingOrderId;
    productId         : Nat;
    quantity          : Float;
    batchNo           : Text;
    productionDate    : Timestamp;
    expiryDate        : ?Timestamp;
    warehouseLocation : Text;
    status            : Text;
  };

  public type UpdateFinishedGoodInput = {
    id                : FinishedGoodId;
    moId              : ManufacturingOrderId;
    productId         : Nat;
    quantity          : Float;
    batchNo           : Text;
    productionDate    : Timestamp;
    expiryDate        : ?Timestamp;
    warehouseLocation : Text;
    status            : Text;
    enabled           : Bool;
  };

  // ── Scrap Records ─────────────────────────────────────────────────────────
  public type ScrapRecord = {
    id          : ScrapRecordId;
    orgId       : OrgId;
    moId        : ManufacturingOrderId;
    machineId   : MachineId;
    scrapQty    : Float;
    scrapReason : Text;
    scrapValue  : Float;
    recordedBy  : Text;
    date        : Timestamp;
    enabled     : Bool;
    createdAt   : Timestamp;
  };

  public type CreateScrapRecordInput = {
    moId        : ManufacturingOrderId;
    machineId   : MachineId;
    scrapQty    : Float;
    scrapReason : Text;
    scrapValue  : Float;
    recordedBy  : Text;
    date        : Timestamp;
  };

  public type UpdateScrapRecordInput = {
    id          : ScrapRecordId;
    moId        : ManufacturingOrderId;
    machineId   : MachineId;
    scrapQty    : Float;
    scrapReason : Text;
    scrapValue  : Float;
    recordedBy  : Text;
    date        : Timestamp;
    enabled     : Bool;
  };

  // ── Machines / Workstations ───────────────────────────────────────────────
  public type Machine = {
    id              : MachineId;
    orgId           : OrgId;
    name            : Text;
    code            : Text;
    machineType     : Text;
    capacity        : Float;
    capacityUnit    : Text;
    status          : MachineStatus;
    location        : Text;
    lastMaintenance : ?Timestamp;
    enabled         : Bool;
    createdAt       : Timestamp;
  };

  public type CreateMachineInput = {
    name            : Text;
    code            : Text;
    machineType     : Text;
    capacity        : Float;
    capacityUnit    : Text;
    status          : MachineStatus;
    location        : Text;
    lastMaintenance : ?Timestamp;
  };

  public type UpdateMachineInput = {
    id              : MachineId;
    name            : Text;
    code            : Text;
    machineType     : Text;
    capacity        : Float;
    capacityUnit    : Text;
    status          : MachineStatus;
    location        : Text;
    lastMaintenance : ?Timestamp;
    enabled         : Bool;
  };

  // ── Routing / Operations ──────────────────────────────────────────────────
  public type RoutingOperation = {
    id           : RoutingOperationId;
    orgId        : OrgId;
    name         : Text;
    code         : Text;
    sequence     : Nat;
    machineId    : MachineId;
    standardTime : Float;
    costPerHour  : Float;
    description  : Text;
    enabled      : Bool;
    createdAt    : Timestamp;
  };

  public type CreateRoutingOperationInput = {
    name         : Text;
    code         : Text;
    sequence     : Nat;
    machineId    : MachineId;
    standardTime : Float;
    costPerHour  : Float;
    description  : Text;
  };

  public type UpdateRoutingOperationInput = {
    id           : RoutingOperationId;
    name         : Text;
    code         : Text;
    sequence     : Nat;
    machineId    : MachineId;
    standardTime : Float;
    costPerHour  : Float;
    description  : Text;
    enabled      : Bool;
  };

  // ── Cost of Production ────────────────────────────────────────────────────
  public type CostOfProduction = {
    id           : CostOfProductionId;
    orgId        : OrgId;
    moId         : ManufacturingOrderId;
    materialCost : Float;
    labourCost   : Float;
    overheadCost : Float;
    scrapCost    : Float;
    totalCost    : Float;
    period       : Text;
    notes        : Text;
    enabled      : Bool;
    createdAt    : Timestamp;
  };

  public type CreateCostOfProductionInput = {
    moId         : ManufacturingOrderId;
    materialCost : Float;
    labourCost   : Float;
    overheadCost : Float;
    scrapCost    : Float;
    period       : Text;
    notes        : Text;
  };

  public type UpdateCostOfProductionInput = {
    id           : CostOfProductionId;
    moId         : ManufacturingOrderId;
    materialCost : Float;
    labourCost   : Float;
    overheadCost : Float;
    scrapCost    : Float;
    period       : Text;
    notes        : Text;
    enabled      : Bool;
  };
};
