import Types "../types/erp-manufacturing";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  public type BomMap        = Map.Map<Nat, Types.BillOfMaterial>;
  public type WorkOrderMap  = Map.Map<Nat, Types.WorkOrder>;
  public type PlanMap       = Map.Map<Nat, Types.ProductionPlan>;
  public type MoMap         = Map.Map<Nat, Types.ManufacturingOrder>;
  public type ReqMap        = Map.Map<Nat, Types.RawMaterialRequisition>;
  public type SfcMap        = Map.Map<Nat, Types.ShopFloorControl>;
  public type QcMap         = Map.Map<Nat, Types.QualityControl>;
  public type FgMap         = Map.Map<Nat, Types.FinishedGood>;
  public type ScrapMap      = Map.Map<Nat, Types.ScrapRecord>;
  public type MachineMap    = Map.Map<Nat, Types.Machine>;
  public type RoutingMap    = Map.Map<Nat, Types.RoutingOperation>;
  public type CopMap        = Map.Map<Nat, Types.CostOfProduction>;
  public type ModuleEnabled = Map.Map<Nat, Bool>;

  func assertOrg(a : Nat, b : Nat) { if (a != b) Runtime.trap("ERP: record belongs to a different org") };

  public func getErpModuleEnabled(moduleEnabled : ModuleEnabled, orgId : Nat) : Bool {
    switch (moduleEnabled.get(orgId)) { case (?v) v; case null true }
  };

  public func setErpModuleEnabled(moduleEnabled : ModuleEnabled, orgId : Nat, enabled : Bool) {
    moduleEnabled.add(orgId, enabled)
  };

  // ── BOM ─────────────────────────────────────────────────────────────────────

  public func listBoms(boms : BomMap, orgId : Nat) : [Types.BillOfMaterial] {
    boms.values().filter(func(b) { b.orgId == orgId }).toArray()
  };

  public func getBom(boms : BomMap, orgId : Nat, id : Nat) : ?Types.BillOfMaterial {
    switch (boms.get(id)) { case (?b) { if (b.orgId == orgId) ?b else null }; case null null }
  };

  public func createBom(boms : BomMap, orgId : Nat, input : Types.CreateBomInput, nextId : Nat) : Types.BillOfMaterial {
    let bom : Types.BillOfMaterial = {
      id = nextId; orgId;
      productName = input.productName; components = input.components;
      revision = input.revision; status = input.status; enabled = true; createdAt = Time.now();
    };
    boms.add(nextId, bom); bom
  };

  public func updateBom(boms : BomMap, orgId : Nat, input : Types.UpdateBomInput) : Types.BillOfMaterial {
    let existing = switch (boms.get(input.id)) { case (?b) b; case null { Runtime.trap("ERP: BOM not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.BillOfMaterial = { existing with productName = input.productName;
      components = input.components; revision = input.revision; status = input.status; enabled = input.enabled };
    boms.add(input.id, updated); updated
  };

  public func deleteBom(boms : BomMap, orgId : Nat, id : Nat) {
    switch (boms.get(id)) {
      case (?b) { assertOrg(b.orgId, orgId); boms.remove(id) };
      case null { Runtime.trap("ERP: BOM not found with id " # id.toText()) };
    }
  };

  public func toggleBom(boms : BomMap, orgId : Nat, id : Nat) : Types.BillOfMaterial {
    let existing = switch (boms.get(id)) { case (?b) b; case null { Runtime.trap("ERP: BOM not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.BillOfMaterial = { existing with enabled = not existing.enabled };
    boms.add(id, updated); updated
  };

  // ── Work Orders ──────────────────────────────────────────────────────────────

  public func listWorkOrders(wos : WorkOrderMap, orgId : Nat) : [Types.WorkOrder] {
    wos.values().filter(func(w) { w.orgId == orgId }).toArray()
  };

  public func getWorkOrder(wos : WorkOrderMap, orgId : Nat, id : Nat) : ?Types.WorkOrder {
    switch (wos.get(id)) { case (?w) { if (w.orgId == orgId) ?w else null }; case null null }
  };

  public func createWorkOrder(wos : WorkOrderMap, orgId : Nat, input : Types.CreateWorkOrderInput, nextId : Nat) : Types.WorkOrder {
    let wo : Types.WorkOrder = {
      id = nextId; orgId; bomId = input.bomId; quantity = input.quantity;
      plannedStart = input.plannedStart; plannedEnd = input.plannedEnd;
      actualStart = null; actualEnd = null; status = #planned; enabled = true;
      notes = input.notes; createdAt = Time.now();
    };
    wos.add(nextId, wo); wo
  };

  public func updateWorkOrder(wos : WorkOrderMap, orgId : Nat, input : Types.UpdateWorkOrderInput) : Types.WorkOrder {
    let existing = switch (wos.get(input.id)) { case (?w) w; case null { Runtime.trap("ERP: WorkOrder not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.WorkOrder = { existing with bomId = input.bomId; quantity = input.quantity;
      plannedStart = input.plannedStart; plannedEnd = input.plannedEnd;
      actualStart = input.actualStart; actualEnd = input.actualEnd;
      status = input.status; enabled = input.enabled; notes = input.notes };
    wos.add(input.id, updated); updated
  };

  public func deleteWorkOrder(wos : WorkOrderMap, orgId : Nat, id : Nat) {
    switch (wos.get(id)) {
      case (?w) { assertOrg(w.orgId, orgId); wos.remove(id) };
      case null { Runtime.trap("ERP: WorkOrder not found with id " # id.toText()) };
    }
  };

  public func toggleWorkOrder(wos : WorkOrderMap, orgId : Nat, id : Nat) : Types.WorkOrder {
    let existing = switch (wos.get(id)) { case (?w) w; case null { Runtime.trap("ERP: WorkOrder not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.WorkOrder = { existing with enabled = not existing.enabled };
    wos.add(id, updated); updated
  };

  // ── Production Plans ─────────────────────────────────────────────────────────

  public func listProductionPlans(plans : PlanMap, orgId : Nat) : [Types.ProductionPlan] {
    plans.values().filter(func(p) { p.orgId == orgId }).toArray()
  };

  public func createProductionPlan(plans : PlanMap, orgId : Nat, input : Types.CreateProductionPlanInput, nextId : Nat) : Types.ProductionPlan {
    let plan : Types.ProductionPlan = {
      id = nextId; orgId; period = input.period; workOrderIds = input.workOrderIds;
      targetQty = input.targetQty; actualQty = 0.0; status = input.status; enabled = true; createdAt = Time.now();
    };
    plans.add(nextId, plan); plan
  };

  public func updateProductionPlan(plans : PlanMap, orgId : Nat, input : Types.UpdateProductionPlanInput) : Types.ProductionPlan {
    let existing = switch (plans.get(input.id)) { case (?p) p; case null { Runtime.trap("ERP: ProductionPlan not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ProductionPlan = { existing with period = input.period;
      workOrderIds = input.workOrderIds; targetQty = input.targetQty;
      actualQty = input.actualQty; status = input.status; enabled = input.enabled };
    plans.add(input.id, updated); updated
  };

  public func deleteProductionPlan(plans : PlanMap, orgId : Nat, id : Nat) {
    switch (plans.get(id)) {
      case (?p) { assertOrg(p.orgId, orgId); plans.remove(id) };
      case null { Runtime.trap("ERP: ProductionPlan not found with id " # id.toText()) };
    }
  };

  public func toggleProductionPlan(plans : PlanMap, orgId : Nat, id : Nat) : Types.ProductionPlan {
    let existing = switch (plans.get(id)) { case (?p) p; case null { Runtime.trap("ERP: ProductionPlan not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ProductionPlan = { existing with enabled = not existing.enabled };
    plans.add(id, updated); updated
  };

  // ── Manufacturing Orders ─────────────────────────────────────────────────────

  public func listManufacturingOrders(mos : MoMap, orgId : Nat) : [Types.ManufacturingOrder] {
    mos.values().filter(func(m) { m.orgId == orgId }).toArray()
  };

  public func createManufacturingOrder(mos : MoMap, orgId : Nat, input : Types.CreateManufacturingOrderInput, nextId : Nat) : Types.ManufacturingOrder {
    let mo : Types.ManufacturingOrder = {
      id = nextId; orgId; workOrderId = input.workOrderId; startDate = input.startDate;
      dueDate = input.dueDate; quantity = input.quantity; completedQty = 0.0;
      status = #draft; enabled = true; createdAt = Time.now();
    };
    mos.add(nextId, mo); mo
  };

  public func updateManufacturingOrder(mos : MoMap, orgId : Nat, input : Types.UpdateManufacturingOrderInput) : Types.ManufacturingOrder {
    let existing = switch (mos.get(input.id)) { case (?m) m; case null { Runtime.trap("ERP: ManufacturingOrder not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ManufacturingOrder = { existing with workOrderId = input.workOrderId;
      startDate = input.startDate; dueDate = input.dueDate; quantity = input.quantity;
      completedQty = input.completedQty; status = input.status; enabled = input.enabled };
    mos.add(input.id, updated); updated
  };

  public func deleteManufacturingOrder(mos : MoMap, orgId : Nat, id : Nat) {
    switch (mos.get(id)) {
      case (?m) { assertOrg(m.orgId, orgId); mos.remove(id) };
      case null { Runtime.trap("ERP: ManufacturingOrder not found with id " # id.toText()) };
    }
  };

  public func toggleManufacturingOrder(mos : MoMap, orgId : Nat, id : Nat) : Types.ManufacturingOrder {
    let existing = switch (mos.get(id)) { case (?m) m; case null { Runtime.trap("ERP: ManufacturingOrder not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ManufacturingOrder = { existing with enabled = not existing.enabled };
    mos.add(id, updated); updated
  };

  // ── Raw Material Requisitions ────────────────────────────────────────────────

  public func listRawMaterialRequisitions(reqs : ReqMap, orgId : Nat) : [Types.RawMaterialRequisition] {
    reqs.values().filter(func(r) { r.orgId == orgId }).toArray()
  };

  public func createRawMaterialRequisition(reqs : ReqMap, orgId : Nat, input : Types.CreateRequisitionInput, nextId : Nat) : Types.RawMaterialRequisition {
    let req : Types.RawMaterialRequisition = {
      id = nextId; orgId; moId = input.moId; items = input.items;
      requestedBy = input.requestedBy; approvedBy = ""; status = "pending"; enabled = true; createdAt = Time.now();
    };
    reqs.add(nextId, req); req
  };

  public func updateRawMaterialRequisition(reqs : ReqMap, orgId : Nat, input : Types.UpdateRequisitionInput) : Types.RawMaterialRequisition {
    let existing = switch (reqs.get(input.id)) { case (?r) r; case null { Runtime.trap("ERP: Requisition not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.RawMaterialRequisition = { existing with moId = input.moId; items = input.items;
      requestedBy = input.requestedBy; approvedBy = input.approvedBy;
      status = input.status; enabled = input.enabled };
    reqs.add(input.id, updated); updated
  };

  public func deleteRawMaterialRequisition(reqs : ReqMap, orgId : Nat, id : Nat) {
    switch (reqs.get(id)) {
      case (?r) { assertOrg(r.orgId, orgId); reqs.remove(id) };
      case null { Runtime.trap("ERP: Requisition not found with id " # id.toText()) };
    }
  };

  public func toggleRawMaterialRequisition(reqs : ReqMap, orgId : Nat, id : Nat) : Types.RawMaterialRequisition {
    let existing = switch (reqs.get(id)) { case (?r) r; case null { Runtime.trap("ERP: Requisition not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.RawMaterialRequisition = { existing with enabled = not existing.enabled };
    reqs.add(id, updated); updated
  };

  // ── Shop Floor Control ───────────────────────────────────────────────────────

  public func listShopFloorControls(sfcs : SfcMap, orgId : Nat) : [Types.ShopFloorControl] {
    sfcs.values().filter(func(s) { s.orgId == orgId }).toArray()
  };

  public func createShopFloorControl(sfcs : SfcMap, orgId : Nat, input : Types.CreateShopFloorInput, nextId : Nat) : Types.ShopFloorControl {
    let sfc : Types.ShopFloorControl = {
      id = nextId; orgId; workOrderId = input.workOrderId; machineId = input.machineId;
      operationId = input.operationId; startTime = input.startTime; endTime = null;
      operatorName = input.operatorName; quantity = input.quantity; status = "active";
      notes = input.notes; enabled = true; createdAt = Time.now();
    };
    sfcs.add(nextId, sfc); sfc
  };

  public func updateShopFloorControl(sfcs : SfcMap, orgId : Nat, input : Types.UpdateShopFloorInput) : Types.ShopFloorControl {
    let existing = switch (sfcs.get(input.id)) { case (?s) s; case null { Runtime.trap("ERP: ShopFloorControl not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ShopFloorControl = { existing with workOrderId = input.workOrderId;
      machineId = input.machineId; operationId = input.operationId; startTime = input.startTime;
      endTime = input.endTime; operatorName = input.operatorName; quantity = input.quantity;
      status = input.status; notes = input.notes; enabled = input.enabled };
    sfcs.add(input.id, updated); updated
  };

  public func deleteShopFloorControl(sfcs : SfcMap, orgId : Nat, id : Nat) {
    switch (sfcs.get(id)) {
      case (?s) { assertOrg(s.orgId, orgId); sfcs.remove(id) };
      case null { Runtime.trap("ERP: ShopFloorControl not found with id " # id.toText()) };
    }
  };

  public func toggleShopFloorControl(sfcs : SfcMap, orgId : Nat, id : Nat) : Types.ShopFloorControl {
    let existing = switch (sfcs.get(id)) { case (?s) s; case null { Runtime.trap("ERP: ShopFloorControl not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ShopFloorControl = { existing with enabled = not existing.enabled };
    sfcs.add(id, updated); updated
  };

  // ── Quality Control ──────────────────────────────────────────────────────────

  public func listQualityControls(qcs : QcMap, orgId : Nat) : [Types.QualityControl] {
    qcs.values().filter(func(q) { q.orgId == orgId }).toArray()
  };

  public func createQualityControl(qcs : QcMap, orgId : Nat, input : Types.CreateQualityControlInput, nextId : Nat) : Types.QualityControl {
    let qc : Types.QualityControl = {
      id = nextId; orgId; moId = input.moId; inspectionDate = input.inspectionDate;
      inspector = input.inspector; passQty = input.passQty; failQty = input.failQty;
      defects = input.defects; result = input.result; notes = input.notes;
      enabled = true; createdAt = Time.now();
    };
    qcs.add(nextId, qc); qc
  };

  public func updateQualityControl(qcs : QcMap, orgId : Nat, input : Types.UpdateQualityControlInput) : Types.QualityControl {
    let existing = switch (qcs.get(input.id)) { case (?q) q; case null { Runtime.trap("ERP: QualityControl not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.QualityControl = { existing with moId = input.moId;
      inspectionDate = input.inspectionDate; inspector = input.inspector;
      passQty = input.passQty; failQty = input.failQty; defects = input.defects;
      result = input.result; notes = input.notes; enabled = input.enabled };
    qcs.add(input.id, updated); updated
  };

  public func deleteQualityControl(qcs : QcMap, orgId : Nat, id : Nat) {
    switch (qcs.get(id)) {
      case (?q) { assertOrg(q.orgId, orgId); qcs.remove(id) };
      case null { Runtime.trap("ERP: QualityControl not found with id " # id.toText()) };
    }
  };

  public func toggleQualityControl(qcs : QcMap, orgId : Nat, id : Nat) : Types.QualityControl {
    let existing = switch (qcs.get(id)) { case (?q) q; case null { Runtime.trap("ERP: QualityControl not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.QualityControl = { existing with enabled = not existing.enabled };
    qcs.add(id, updated); updated
  };

  // ── Finished Goods ───────────────────────────────────────────────────────────

  public func listFinishedGoods(fgs : FgMap, orgId : Nat) : [Types.FinishedGood] {
    fgs.values().filter(func(f) { f.orgId == orgId }).toArray()
  };

  public func createFinishedGood(fgs : FgMap, orgId : Nat, input : Types.CreateFinishedGoodInput, nextId : Nat) : Types.FinishedGood {
    let fg : Types.FinishedGood = {
      id = nextId; orgId; moId = input.moId; productId = input.productId;
      quantity = input.quantity; batchNo = input.batchNo; productionDate = input.productionDate;
      expiryDate = input.expiryDate; warehouseLocation = input.warehouseLocation;
      status = input.status; enabled = true; createdAt = Time.now();
    };
    fgs.add(nextId, fg); fg
  };

  public func updateFinishedGood(fgs : FgMap, orgId : Nat, input : Types.UpdateFinishedGoodInput) : Types.FinishedGood {
    let existing = switch (fgs.get(input.id)) { case (?f) f; case null { Runtime.trap("ERP: FinishedGood not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.FinishedGood = { existing with moId = input.moId; productId = input.productId;
      quantity = input.quantity; batchNo = input.batchNo; productionDate = input.productionDate;
      expiryDate = input.expiryDate; warehouseLocation = input.warehouseLocation;
      status = input.status; enabled = input.enabled };
    fgs.add(input.id, updated); updated
  };

  public func deleteFinishedGood(fgs : FgMap, orgId : Nat, id : Nat) {
    switch (fgs.get(id)) {
      case (?f) { assertOrg(f.orgId, orgId); fgs.remove(id) };
      case null { Runtime.trap("ERP: FinishedGood not found with id " # id.toText()) };
    }
  };

  public func toggleFinishedGood(fgs : FgMap, orgId : Nat, id : Nat) : Types.FinishedGood {
    let existing = switch (fgs.get(id)) { case (?f) f; case null { Runtime.trap("ERP: FinishedGood not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.FinishedGood = { existing with enabled = not existing.enabled };
    fgs.add(id, updated); updated
  };

  // ── Scrap Records ────────────────────────────────────────────────────────────

  public func listScrapRecords(scraps : ScrapMap, orgId : Nat) : [Types.ScrapRecord] {
    scraps.values().filter(func(s) { s.orgId == orgId }).toArray()
  };

  public func createScrapRecord(scraps : ScrapMap, orgId : Nat, input : Types.CreateScrapRecordInput, nextId : Nat) : Types.ScrapRecord {
    let scrap : Types.ScrapRecord = {
      id = nextId; orgId; moId = input.moId; machineId = input.machineId;
      scrapQty = input.scrapQty; scrapReason = input.scrapReason; scrapValue = input.scrapValue;
      recordedBy = input.recordedBy; date = input.date; enabled = true; createdAt = Time.now();
    };
    scraps.add(nextId, scrap); scrap
  };

  public func updateScrapRecord(scraps : ScrapMap, orgId : Nat, input : Types.UpdateScrapRecordInput) : Types.ScrapRecord {
    let existing = switch (scraps.get(input.id)) { case (?s) s; case null { Runtime.trap("ERP: ScrapRecord not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ScrapRecord = { existing with moId = input.moId; machineId = input.machineId;
      scrapQty = input.scrapQty; scrapReason = input.scrapReason; scrapValue = input.scrapValue;
      recordedBy = input.recordedBy; date = input.date; enabled = input.enabled };
    scraps.add(input.id, updated); updated
  };

  public func deleteScrapRecord(scraps : ScrapMap, orgId : Nat, id : Nat) {
    switch (scraps.get(id)) {
      case (?s) { assertOrg(s.orgId, orgId); scraps.remove(id) };
      case null { Runtime.trap("ERP: ScrapRecord not found with id " # id.toText()) };
    }
  };

  public func toggleScrapRecord(scraps : ScrapMap, orgId : Nat, id : Nat) : Types.ScrapRecord {
    let existing = switch (scraps.get(id)) { case (?s) s; case null { Runtime.trap("ERP: ScrapRecord not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.ScrapRecord = { existing with enabled = not existing.enabled };
    scraps.add(id, updated); updated
  };

  // ── Machines ─────────────────────────────────────────────────────────────────

  public func listMachines(machines : MachineMap, orgId : Nat) : [Types.Machine] {
    machines.values().filter(func(m) { m.orgId == orgId }).toArray()
  };

  public func getMachine(machines : MachineMap, orgId : Nat, id : Nat) : ?Types.Machine {
    switch (machines.get(id)) { case (?m) { if (m.orgId == orgId) ?m else null }; case null null }
  };

  public func createMachine(machines : MachineMap, orgId : Nat, input : Types.CreateMachineInput, nextId : Nat) : Types.Machine {
    let machine : Types.Machine = {
      id = nextId; orgId; name = input.name; code = input.code; machineType = input.machineType;
      capacity = input.capacity; capacityUnit = input.capacityUnit; status = input.status;
      location = input.location; lastMaintenance = input.lastMaintenance; enabled = true; createdAt = Time.now();
    };
    machines.add(nextId, machine); machine
  };

  public func updateMachine(machines : MachineMap, orgId : Nat, input : Types.UpdateMachineInput) : Types.Machine {
    let existing = switch (machines.get(input.id)) { case (?m) m; case null { Runtime.trap("ERP: Machine not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Machine = { existing with name = input.name; code = input.code;
      machineType = input.machineType; capacity = input.capacity; capacityUnit = input.capacityUnit;
      status = input.status; location = input.location; lastMaintenance = input.lastMaintenance; enabled = input.enabled };
    machines.add(input.id, updated); updated
  };

  public func deleteMachine(machines : MachineMap, orgId : Nat, id : Nat) {
    switch (machines.get(id)) {
      case (?m) { assertOrg(m.orgId, orgId); machines.remove(id) };
      case null { Runtime.trap("ERP: Machine not found with id " # id.toText()) };
    }
  };

  public func toggleMachine(machines : MachineMap, orgId : Nat, id : Nat) : Types.Machine {
    let existing = switch (machines.get(id)) { case (?m) m; case null { Runtime.trap("ERP: Machine not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Machine = { existing with enabled = not existing.enabled };
    machines.add(id, updated); updated
  };

  // ── Routing Operations ───────────────────────────────────────────────────────

  public func listRoutingOperations(routings : RoutingMap, orgId : Nat) : [Types.RoutingOperation] {
    routings.values().filter(func(r) { r.orgId == orgId }).toArray()
  };

  public func createRoutingOperation(routings : RoutingMap, orgId : Nat, input : Types.CreateRoutingOperationInput, nextId : Nat) : Types.RoutingOperation {
    let op : Types.RoutingOperation = {
      id = nextId; orgId; name = input.name; code = input.code; sequence = input.sequence;
      machineId = input.machineId; standardTime = input.standardTime; costPerHour = input.costPerHour;
      description = input.description; enabled = true; createdAt = Time.now();
    };
    routings.add(nextId, op); op
  };

  public func updateRoutingOperation(routings : RoutingMap, orgId : Nat, input : Types.UpdateRoutingOperationInput) : Types.RoutingOperation {
    let existing = switch (routings.get(input.id)) { case (?r) r; case null { Runtime.trap("ERP: RoutingOperation not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.RoutingOperation = { existing with name = input.name; code = input.code;
      sequence = input.sequence; machineId = input.machineId; standardTime = input.standardTime;
      costPerHour = input.costPerHour; description = input.description; enabled = input.enabled };
    routings.add(input.id, updated); updated
  };

  public func deleteRoutingOperation(routings : RoutingMap, orgId : Nat, id : Nat) {
    switch (routings.get(id)) {
      case (?r) { assertOrg(r.orgId, orgId); routings.remove(id) };
      case null { Runtime.trap("ERP: RoutingOperation not found with id " # id.toText()) };
    }
  };

  public func toggleRoutingOperation(routings : RoutingMap, orgId : Nat, id : Nat) : Types.RoutingOperation {
    let existing = switch (routings.get(id)) { case (?r) r; case null { Runtime.trap("ERP: RoutingOperation not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.RoutingOperation = { existing with enabled = not existing.enabled };
    routings.add(id, updated); updated
  };

  // ── Cost of Production ───────────────────────────────────────────────────────

  public func listCostsOfProduction(cops : CopMap, orgId : Nat) : [Types.CostOfProduction] {
    cops.values().filter(func(c) { c.orgId == orgId }).toArray()
  };

  public func createCostOfProduction(cops : CopMap, orgId : Nat, input : Types.CreateCostOfProductionInput, nextId : Nat) : Types.CostOfProduction {
    let total = input.materialCost + input.labourCost + input.overheadCost + input.scrapCost;
    let cop : Types.CostOfProduction = {
      id = nextId; orgId; moId = input.moId; materialCost = input.materialCost;
      labourCost = input.labourCost; overheadCost = input.overheadCost; scrapCost = input.scrapCost;
      totalCost = total; period = input.period; notes = input.notes; enabled = true; createdAt = Time.now();
    };
    cops.add(nextId, cop); cop
  };

  public func updateCostOfProduction(cops : CopMap, orgId : Nat, input : Types.UpdateCostOfProductionInput) : Types.CostOfProduction {
    let existing = switch (cops.get(input.id)) { case (?c) c; case null { Runtime.trap("ERP: CostOfProduction not found with id " # input.id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let total = input.materialCost + input.labourCost + input.overheadCost + input.scrapCost;
    let updated : Types.CostOfProduction = { existing with moId = input.moId;
      materialCost = input.materialCost; labourCost = input.labourCost; overheadCost = input.overheadCost;
      scrapCost = input.scrapCost; totalCost = total; period = input.period; notes = input.notes; enabled = input.enabled };
    cops.add(input.id, updated); updated
  };

  public func deleteCostOfProduction(cops : CopMap, orgId : Nat, id : Nat) {
    switch (cops.get(id)) {
      case (?c) { assertOrg(c.orgId, orgId); cops.remove(id) };
      case null { Runtime.trap("ERP: CostOfProduction not found with id " # id.toText()) };
    }
  };

  public func toggleCostOfProduction(cops : CopMap, orgId : Nat, id : Nat) : Types.CostOfProduction {
    let existing = switch (cops.get(id)) { case (?c) c; case null { Runtime.trap("ERP: CostOfProduction not found with id " # id.toText()) } };
    assertOrg(existing.orgId, orgId);
    let updated : Types.CostOfProduction = { existing with enabled = not existing.enabled };
    cops.add(id, updated); updated
  };
};
