import { QcResult } from "@/backend";
/**
 * ERP Form Components — dialogs for Create/Edit using real backend types.
 */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BillOfMaterial,
  BomComponent,
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
} from "@/hooks/useERP";
import { useState } from "react";

function Field({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

const WORK_ORDER_STATUS_OPTIONS = [
  "planned",
  "inProgress",
  "completed",
  "cancelled",
];
const MO_STATUS_OPTIONS = [
  "draft",
  "released",
  "inProgress",
  "completed",
  "cancelled",
];
const MACHINE_STATUS_OPTIONS = ["active", "inactive", "maintenance"];
const QC_RESULT_OPTIONS: QcResult[] = [QcResult.pass, QcResult.fail];
const GENERAL_STATUS_OPTIONS = [
  "pending",
  "in-progress",
  "completed",
  "cancelled",
];

const toTimestamp = (dateStr: string): bigint =>
  dateStr ? BigInt(new Date(dateStr).getTime() * 1_000_000) : BigInt(0);

const fromTimestamp = (ts: bigint): string =>
  ts > BigInt(0)
    ? new Date(Number(ts / BigInt(1_000_000))).toISOString().slice(0, 10)
    : "";

// ─── BOM Form ─────────────────────────────────────────────────────────────────

export function BomForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateBomInput | UpdateBomInput) => void;
  initial?: BillOfMaterial;
}) {
  const [form, setForm] = useState({
    productName: initial?.productName ?? "",
    revision: initial?.revision ?? "v1.0",
    status: initial?.status ?? "pending",
    enabled: initial?.enabled ?? true,
    components: initial?.components ?? ([] as BomComponent[]),
  });
  function handleSave() {
    if (!form.productName) return;
    if (initial) {
      onSave({
        id: initial.id,
        productName: form.productName,
        revision: form.revision,
        status: form.status,
        enabled: form.enabled,
        components: form.components,
      } as UpdateBomInput);
    } else {
      onSave({
        productName: form.productName,
        revision: form.revision,
        status: form.status,
        components: form.components,
      } as CreateBomInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="bom-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit BOM" : "New Bill of Materials"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Product Name">
            <Input
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
              placeholder="Assembly Unit A"
              data-ocid="bom-product-name"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Revision">
              <Input
                value={form.revision}
                onChange={(e) => setForm({ ...form, revision: e.target.value })}
                placeholder="v1.0"
                data-ocid="bom-revision"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger data-ocid="bom-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENERAL_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="bom-save-btn">
            {initial ? "Update" : "Create"} BOM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Work Order Form ──────────────────────────────────────────────────────────

export function WorkOrderForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateWorkOrderInput | UpdateWorkOrderInput) => void;
  initial?: WorkOrder;
}) {
  const [form, setForm] = useState({
    bomId: initial ? String(initial.bomId) : "",
    quantity: initial?.quantity ?? 1,
    plannedStart: initial ? fromTimestamp(initial.plannedStart) : "",
    plannedEnd: initial ? fromTimestamp(initial.plannedEnd) : "",
    status: initial?.status ?? "planned",
    notes: initial?.notes ?? "",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.bomId || !form.plannedStart || !form.plannedEnd) return;
    if (initial) {
      onSave({
        id: initial.id,
        bomId: BigInt(form.bomId),
        quantity: form.quantity,
        plannedStart: toTimestamp(form.plannedStart),
        plannedEnd: toTimestamp(form.plannedEnd),
        status: form.status as WorkOrder["status"],
        notes: form.notes,
        enabled: form.enabled,
      } as UpdateWorkOrderInput);
    } else {
      onSave({
        bomId: BigInt(form.bomId),
        quantity: form.quantity,
        plannedStart: toTimestamp(form.plannedStart),
        plannedEnd: toTimestamp(form.plannedEnd),
        notes: form.notes,
      } as CreateWorkOrderInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="wo-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Work Order" : "New Work Order"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="BOM ID">
              <Input
                value={form.bomId}
                onChange={(e) => setForm({ ...form, bomId: e.target.value })}
                placeholder="1"
                data-ocid="wo-bom-id"
              />
            </Field>
            <Field label="Quantity">
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                data-ocid="wo-quantity"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Planned Start">
              <Input
                type="date"
                value={form.plannedStart}
                onChange={(e) =>
                  setForm({ ...form, plannedStart: e.target.value })
                }
                data-ocid="wo-planned-start"
              />
            </Field>
            <Field label="Planned End">
              <Input
                type="date"
                value={form.plannedEnd}
                onChange={(e) =>
                  setForm({ ...form, plannedEnd: e.target.value })
                }
                data-ocid="wo-planned-end"
              />
            </Field>
          </div>
          {initial && (
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger data-ocid="wo-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ORDER_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              data-ocid="wo-notes"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="wo-save-btn">
            {initial ? "Update" : "Create"} Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Production Plan Form ─────────────────────────────────────────────────────

export function ProductionPlanForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProductionPlanInput | UpdateProductionPlanInput) => void;
  initial?: ProductionPlan;
}) {
  const [form, setForm] = useState({
    period: initial?.period ?? "",
    targetQty: initial?.targetQty ?? 100,
    actualQty: initial?.actualQty ?? 0,
    status: initial?.status ?? "pending",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.period) return;
    if (initial) {
      onSave({
        id: initial.id,
        period: form.period,
        targetQty: form.targetQty,
        actualQty: form.actualQty,
        status: form.status,
        enabled: form.enabled,
        workOrderIds: initial.workOrderIds,
      } as UpdateProductionPlanInput);
    } else {
      onSave({
        period: form.period,
        targetQty: form.targetQty,
        status: form.status,
        workOrderIds: [],
      } as CreateProductionPlanInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="pp-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Production Plan" : "New Production Plan"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Period">
            <Input
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              placeholder="Apr–Jun 2026"
              data-ocid="pp-period"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Qty">
              <Input
                type="number"
                min={1}
                value={form.targetQty}
                onChange={(e) =>
                  setForm({ ...form, targetQty: Number(e.target.value) })
                }
                data-ocid="pp-target-qty"
              />
            </Field>
            <Field label="Actual Qty">
              <Input
                type="number"
                min={0}
                value={form.actualQty}
                onChange={(e) =>
                  setForm({ ...form, actualQty: Number(e.target.value) })
                }
                data-ocid="pp-actual-qty"
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger data-ocid="pp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENERAL_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="pp-save-btn">
            {initial ? "Update" : "Create"} Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manufacturing Order Form ─────────────────────────────────────────────────

export function ManufacturingOrderForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: CreateManufacturingOrderInput | UpdateManufacturingOrderInput,
  ) => void;
  initial?: ManufacturingOrder;
}) {
  const [form, setForm] = useState({
    workOrderId: initial ? String(initial.workOrderId) : "",
    quantity: initial?.quantity ?? 1,
    completedQty: initial?.completedQty ?? 0,
    dueDate: initial ? fromTimestamp(initial.dueDate) : "",
    startDate: initial ? fromTimestamp(initial.startDate) : "",
    status: initial?.status ?? "draft",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.workOrderId || !form.dueDate) return;
    if (initial) {
      onSave({
        id: initial.id,
        workOrderId: BigInt(form.workOrderId),
        quantity: form.quantity,
        completedQty: form.completedQty,
        dueDate: toTimestamp(form.dueDate),
        startDate: toTimestamp(form.startDate),
        status: form.status as ManufacturingOrder["status"],
        enabled: form.enabled,
      } as UpdateManufacturingOrderInput);
    } else {
      onSave({
        workOrderId: BigInt(form.workOrderId),
        quantity: form.quantity,
        dueDate: toTimestamp(form.dueDate),
        startDate: toTimestamp(form.startDate),
      } as CreateManufacturingOrderInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="mo-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Manufacturing Order" : "New Manufacturing Order"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Work Order ID">
              <Input
                value={form.workOrderId}
                onChange={(e) =>
                  setForm({ ...form, workOrderId: e.target.value })
                }
                placeholder="1"
                data-ocid="mo-wo-id"
              />
            </Field>
            <Field label="Quantity">
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                data-ocid="mo-quantity"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                data-ocid="mo-start-date"
              />
            </Field>
            <Field label="Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                data-ocid="mo-due-date"
              />
            </Field>
          </div>
          {initial && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Completed Qty">
                <Input
                  type="number"
                  min={0}
                  value={form.completedQty}
                  onChange={(e) =>
                    setForm({ ...form, completedQty: Number(e.target.value) })
                  }
                  data-ocid="mo-completed-qty"
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger data-ocid="mo-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MO_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="mo-save-btn">
            {initial ? "Update" : "Create"} MO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Raw Material Requisition Form ────────────────────────────────────────────

export function RmrForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateRequisitionInput | UpdateRequisitionInput) => void;
  initial?: RawMaterialRequisition;
}) {
  const [form, setForm] = useState({
    moId: initial ? String(initial.moId) : "",
    requestedBy: initial?.requestedBy ?? "",
    approvedBy: initial?.approvedBy ?? "",
    status: initial?.status ?? "pending",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.moId || !form.requestedBy) return;
    if (initial) {
      onSave({
        id: initial.id,
        moId: BigInt(form.moId),
        requestedBy: form.requestedBy,
        approvedBy: form.approvedBy,
        status: form.status,
        enabled: form.enabled,
        items: initial.items,
      } as UpdateRequisitionInput);
    } else {
      onSave({
        moId: BigInt(form.moId),
        requestedBy: form.requestedBy,
        items: [],
      } as CreateRequisitionInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="rmr-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit RMR" : "New Raw Material Requisition"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Manufacturing Order ID">
            <Input
              value={form.moId}
              onChange={(e) => setForm({ ...form, moId: e.target.value })}
              placeholder="1"
              data-ocid="rmr-mo-id"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Requested By">
              <Input
                value={form.requestedBy}
                onChange={(e) =>
                  setForm({ ...form, requestedBy: e.target.value })
                }
                placeholder="Ravi Kumar"
                data-ocid="rmr-requested-by"
              />
            </Field>
            <Field label="Approved By">
              <Input
                value={form.approvedBy}
                onChange={(e) =>
                  setForm({ ...form, approvedBy: e.target.value })
                }
                placeholder="Manager name"
                data-ocid="rmr-approved-by"
              />
            </Field>
          </div>
          {initial && (
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger data-ocid="rmr-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENERAL_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="rmr-save-btn">
            {initial ? "Update" : "Create"} RMR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shop Floor Control Form ──────────────────────────────────────────────────

export function ShopFloorForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateShopFloorInput | UpdateShopFloorInput) => void;
  initial?: ShopFloorControl;
}) {
  const [form, setForm] = useState({
    workOrderId: initial ? String(initial.workOrderId) : "",
    operationId: initial ? String(initial.operationId) : "0",
    machineId: initial ? String(initial.machineId) : "0",
    operatorName: initial?.operatorName ?? "",
    quantity: initial?.quantity ?? 1,
    notes: initial?.notes ?? "",
    startTime: initial ? fromTimestamp(initial.startTime) : "",
    status: initial?.status ?? "pending",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.workOrderId || !form.operatorName) return;
    if (initial) {
      onSave({
        id: initial.id,
        workOrderId: BigInt(form.workOrderId),
        operationId: BigInt(form.operationId),
        machineId: BigInt(form.machineId),
        operatorName: form.operatorName,
        quantity: form.quantity,
        notes: form.notes,
        startTime: toTimestamp(form.startTime),
        status: form.status,
        enabled: form.enabled,
      } as UpdateShopFloorInput);
    } else {
      onSave({
        workOrderId: BigInt(form.workOrderId),
        operationId: BigInt(form.operationId),
        machineId: BigInt(form.machineId),
        operatorName: form.operatorName,
        quantity: form.quantity,
        notes: form.notes,
        startTime: toTimestamp(form.startTime),
      } as CreateShopFloorInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="sfc-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Shop Floor Control" : "New Shop Floor Control"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Work Order ID">
              <Input
                value={form.workOrderId}
                onChange={(e) =>
                  setForm({ ...form, workOrderId: e.target.value })
                }
                placeholder="1"
                data-ocid="sfc-wo-id"
              />
            </Field>
            <Field label="Operator Name">
              <Input
                value={form.operatorName}
                onChange={(e) =>
                  setForm({ ...form, operatorName: e.target.value })
                }
                placeholder="Ravi Kumar"
                data-ocid="sfc-operator"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Machine ID">
              <Input
                value={form.machineId}
                onChange={(e) =>
                  setForm({ ...form, machineId: e.target.value })
                }
                placeholder="1"
                data-ocid="sfc-machine-id"
              />
            </Field>
            <Field label="Quantity">
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                data-ocid="sfc-quantity"
              />
            </Field>
          </div>
          <Field label="Start Time">
            <Input
              type="date"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              data-ocid="sfc-start-time"
            />
          </Field>
          <Field label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              data-ocid="sfc-notes"
            />
          </Field>
          {initial && (
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger data-ocid="sfc-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENERAL_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="sfc-save-btn">
            {initial ? "Update" : "Create"} SFC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quality Control Form ─────────────────────────────────────────────────────

export function QualityControlForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateQualityControlInput | UpdateQualityControlInput) => void;
  initial?: QualityControl;
}) {
  const [form, setForm] = useState({
    moId: initial ? String(initial.moId) : "",
    inspector: initial?.inspector ?? "",
    inspectionDate: initial ? fromTimestamp(initial.inspectionDate) : "",
    passQty: initial?.passQty ?? 0,
    failQty: initial?.failQty ?? 0,
    result: initial?.result ?? QcResult.pass,
    notes: initial?.notes ?? "",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.moId || !form.inspector) return;
    if (initial) {
      onSave({
        id: initial.id,
        moId: BigInt(form.moId),
        inspector: form.inspector,
        inspectionDate: toTimestamp(form.inspectionDate),
        passQty: form.passQty,
        failQty: form.failQty,
        result: form.result,
        notes: form.notes,
        defects: initial.defects,
        enabled: form.enabled,
      } as UpdateQualityControlInput);
    } else {
      onSave({
        moId: BigInt(form.moId),
        inspector: form.inspector,
        inspectionDate: toTimestamp(form.inspectionDate),
        passQty: form.passQty,
        failQty: form.failQty,
        result: form.result,
        notes: form.notes,
        defects: [],
      } as CreateQualityControlInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="qc-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Quality Control" : "New Quality Control"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Manufacturing Order ID">
              <Input
                value={form.moId}
                onChange={(e) => setForm({ ...form, moId: e.target.value })}
                placeholder="1"
                data-ocid="qc-mo-id"
              />
            </Field>
            <Field label="Inspector">
              <Input
                value={form.inspector}
                onChange={(e) =>
                  setForm({ ...form, inspector: e.target.value })
                }
                placeholder="Priya Sharma"
                data-ocid="qc-inspector"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inspection Date">
              <Input
                type="date"
                value={form.inspectionDate}
                onChange={(e) =>
                  setForm({ ...form, inspectionDate: e.target.value })
                }
                data-ocid="qc-date"
              />
            </Field>
            <Field label="Result">
              <Select
                value={form.result}
                onValueChange={(v) =>
                  setForm({ ...form, result: v as QcResult })
                }
              >
                <SelectTrigger data-ocid="qc-result">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QC_RESULT_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pass Qty">
              <Input
                type="number"
                min={0}
                value={form.passQty}
                onChange={(e) =>
                  setForm({ ...form, passQty: Number(e.target.value) })
                }
                data-ocid="qc-pass-qty"
              />
            </Field>
            <Field label="Fail Qty">
              <Input
                type="number"
                min={0}
                value={form.failQty}
                onChange={(e) =>
                  setForm({ ...form, failQty: Number(e.target.value) })
                }
                data-ocid="qc-fail-qty"
              />
            </Field>
          </div>
          <Field label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Inspection notes"
              data-ocid="qc-notes"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="qc-save-btn">
            {initial ? "Update" : "Create"} QC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Finished Goods Form ──────────────────────────────────────────────────────

export function FinishedGoodsForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateFinishedGoodInput | UpdateFinishedGoodInput) => void;
  initial?: FinishedGood;
}) {
  const [form, setForm] = useState({
    moId: initial ? String(initial.moId) : "",
    productId: initial ? String(initial.productId) : "0",
    batchNo: initial?.batchNo ?? "",
    quantity: initial?.quantity ?? 0,
    warehouseLocation: initial?.warehouseLocation ?? "",
    productionDate: initial ? fromTimestamp(initial.productionDate) : "",
    status: initial?.status ?? "pending",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.batchNo || !form.moId) return;
    if (initial) {
      onSave({
        id: initial.id,
        moId: BigInt(form.moId),
        productId: BigInt(form.productId),
        batchNo: form.batchNo,
        quantity: form.quantity,
        warehouseLocation: form.warehouseLocation,
        productionDate: toTimestamp(form.productionDate),
        status: form.status,
        enabled: form.enabled,
      } as UpdateFinishedGoodInput);
    } else {
      onSave({
        moId: BigInt(form.moId),
        productId: BigInt(form.productId),
        batchNo: form.batchNo,
        quantity: form.quantity,
        warehouseLocation: form.warehouseLocation,
        productionDate: toTimestamp(form.productionDate),
        status: form.status,
      } as CreateFinishedGoodInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="fg-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Finished Goods" : "New Finished Goods"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="MO ID">
              <Input
                value={form.moId}
                onChange={(e) => setForm({ ...form, moId: e.target.value })}
                placeholder="1"
                data-ocid="fg-mo-id"
              />
            </Field>
            <Field label="Batch Number">
              <Input
                value={form.batchNo}
                onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                placeholder="BTH-2026-001"
                data-ocid="fg-batch"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                data-ocid="fg-quantity"
              />
            </Field>
            <Field label="Production Date">
              <Input
                type="date"
                value={form.productionDate}
                onChange={(e) =>
                  setForm({ ...form, productionDate: e.target.value })
                }
                data-ocid="fg-production-date"
              />
            </Field>
          </div>
          <Field label="Warehouse Location">
            <Input
              value={form.warehouseLocation}
              onChange={(e) =>
                setForm({ ...form, warehouseLocation: e.target.value })
              }
              placeholder="BIN-A12"
              data-ocid="fg-location"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger data-ocid="fg-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENERAL_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="fg-save-btn">
            {initial ? "Update" : "Create"} Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Scrap Management Form ────────────────────────────────────────────────────

export function ScrapManagementForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateScrapRecordInput | UpdateScrapRecordInput) => void;
  initial?: ScrapRecord;
}) {
  const [form, setForm] = useState({
    moId: initial ? String(initial.moId) : "",
    machineId: initial ? String(initial.machineId) : "0",
    scrapReason: initial?.scrapReason ?? "",
    recordedBy: initial?.recordedBy ?? "",
    scrapQty: initial?.scrapQty ?? 0,
    scrapValue: initial?.scrapValue ?? 0,
    date: initial ? fromTimestamp(initial.date) : "",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.moId || !form.scrapReason) return;
    if (initial) {
      onSave({
        id: initial.id,
        moId: BigInt(form.moId),
        machineId: BigInt(form.machineId),
        scrapReason: form.scrapReason,
        recordedBy: form.recordedBy,
        scrapQty: form.scrapQty,
        scrapValue: form.scrapValue,
        date: toTimestamp(form.date),
        enabled: form.enabled,
      } as UpdateScrapRecordInput);
    } else {
      onSave({
        moId: BigInt(form.moId),
        machineId: BigInt(form.machineId),
        scrapReason: form.scrapReason,
        recordedBy: form.recordedBy,
        scrapQty: form.scrapQty,
        scrapValue: form.scrapValue,
        date: toTimestamp(form.date),
      } as CreateScrapRecordInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="scrap-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Scrap Record" : "New Scrap Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="MO ID">
              <Input
                value={form.moId}
                onChange={(e) => setForm({ ...form, moId: e.target.value })}
                placeholder="1"
                data-ocid="scrap-mo-id"
              />
            </Field>
            <Field label="Scrap Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                data-ocid="scrap-date"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scrap Qty">
              <Input
                type="number"
                min={0}
                value={form.scrapQty}
                onChange={(e) =>
                  setForm({ ...form, scrapQty: Number(e.target.value) })
                }
                data-ocid="scrap-qty"
              />
            </Field>
            <Field label="Scrap Value">
              <Input
                type="number"
                min={0}
                value={form.scrapValue}
                onChange={(e) =>
                  setForm({ ...form, scrapValue: Number(e.target.value) })
                }
                data-ocid="scrap-value"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scrap Reason">
              <Input
                value={form.scrapReason}
                onChange={(e) =>
                  setForm({ ...form, scrapReason: e.target.value })
                }
                placeholder="Dimensional tolerance failure"
                data-ocid="scrap-reason"
              />
            </Field>
            <Field label="Recorded By">
              <Input
                value={form.recordedBy}
                onChange={(e) =>
                  setForm({ ...form, recordedBy: e.target.value })
                }
                placeholder="Ravi Kumar"
                data-ocid="scrap-recorded-by"
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="scrap-save-btn">
            {initial ? "Update" : "Create"} Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Machine Master Form ──────────────────────────────────────────────────────

export function MachineMasterForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateMachineInput | UpdateMachineInput) => void;
  initial?: Machine;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    machineType: initial?.machineType ?? "",
    location: initial?.location ?? "",
    capacity: initial?.capacity ?? 0,
    capacityUnit: initial?.capacityUnit ?? "hrs/day",
    status: initial?.status ?? "active",
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.code || !form.name) return;
    if (initial) {
      onSave({
        id: initial.id,
        code: form.code,
        name: form.name,
        machineType: form.machineType,
        location: form.location,
        capacity: form.capacity,
        capacityUnit: form.capacityUnit,
        status: form.status as Machine["status"],
        enabled: form.enabled,
      } as UpdateMachineInput);
    } else {
      onSave({
        code: form.code,
        name: form.name,
        machineType: form.machineType,
        location: form.location,
        capacity: form.capacity,
        capacityUnit: form.capacityUnit,
        status: form.status as Machine["status"],
      } as CreateMachineInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="machine-form-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Machine" : "New Machine"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Machine Code">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CNC-001"
                data-ocid="machine-code"
              />
            </Field>
            <Field label="Machine Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="CNC Lathe Machine"
                data-ocid="machine-name"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Machine Type">
              <Input
                value={form.machineType}
                onChange={(e) =>
                  setForm({ ...form, machineType: e.target.value })
                }
                placeholder="CNC / Welding / Press"
                data-ocid="machine-type"
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Shop Floor A"
                data-ocid="machine-location"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity">
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
                data-ocid="machine-capacity"
              />
            </Field>
            <Field label="Capacity Unit">
              <Input
                value={form.capacityUnit}
                onChange={(e) =>
                  setForm({ ...form, capacityUnit: e.target.value })
                }
                placeholder="hrs/day"
                data-ocid="machine-capacity-unit"
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger data-ocid="machine-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MACHINE_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="machine-save-btn">
            {initial ? "Update" : "Create"} Machine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Routing Operation Form ───────────────────────────────────────────────────

export function RoutingForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: CreateRoutingOperationInput | UpdateRoutingOperationInput,
  ) => void;
  initial?: RoutingOperation;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    machineId: initial ? String(initial.machineId) : "0",
    standardTime: initial?.standardTime ?? 0,
    costPerHour: initial?.costPerHour ?? 0,
    sequence: initial ? Number(initial.sequence) : 1,
    enabled: initial?.enabled ?? true,
  });
  function handleSave() {
    if (!form.code || !form.name) return;
    if (initial) {
      onSave({
        id: initial.id,
        code: form.code,
        name: form.name,
        description: form.description,
        machineId: BigInt(form.machineId),
        standardTime: form.standardTime,
        costPerHour: form.costPerHour,
        sequence: BigInt(form.sequence),
        enabled: form.enabled,
      } as UpdateRoutingOperationInput);
    } else {
      onSave({
        code: form.code,
        name: form.name,
        description: form.description,
        machineId: BigInt(form.machineId),
        standardTime: form.standardTime,
        costPerHour: form.costPerHour,
        sequence: BigInt(form.sequence),
      } as CreateRoutingOperationInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="routing-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Routing Operation" : "New Routing Operation"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Routing Code">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="OP-001"
                data-ocid="routing-code"
              />
            </Field>
            <Field label="Operation Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="CNC Turning"
                data-ocid="routing-op-name"
              />
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Operation description"
              data-ocid="routing-description"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Machine ID">
              <Input
                value={form.machineId}
                onChange={(e) =>
                  setForm({ ...form, machineId: e.target.value })
                }
                placeholder="1"
                data-ocid="routing-machine-id"
              />
            </Field>
            <Field label="Standard Time (min)">
              <Input
                type="number"
                min={0}
                value={form.standardTime}
                onChange={(e) =>
                  setForm({ ...form, standardTime: Number(e.target.value) })
                }
                data-ocid="routing-std-time"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost Per Hour">
              <Input
                type="number"
                min={0}
                value={form.costPerHour}
                onChange={(e) =>
                  setForm({ ...form, costPerHour: Number(e.target.value) })
                }
                data-ocid="routing-cost"
              />
            </Field>
            <Field label="Sequence">
              <Input
                type="number"
                min={1}
                value={form.sequence}
                onChange={(e) =>
                  setForm({ ...form, sequence: Number(e.target.value) })
                }
                data-ocid="routing-sequence"
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="routing-save-btn">
            {initial ? "Update" : "Create"} Operation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cost of Production Form ──────────────────────────────────────────────────

export function CostOfProductionForm({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: CreateCostOfProductionInput | UpdateCostOfProductionInput,
  ) => void;
  initial?: CostOfProduction;
}) {
  const [form, setForm] = useState({
    moId: initial ? String(initial.moId) : "",
    period: initial?.period ?? "",
    materialCost: initial?.materialCost ?? 0,
    labourCost: initial?.labourCost ?? 0,
    overheadCost: initial?.overheadCost ?? 0,
    scrapCost: initial?.scrapCost ?? 0,
    notes: initial?.notes ?? "",
    enabled: initial?.enabled ?? true,
  });
  const totalCost =
    form.materialCost + form.labourCost + form.overheadCost + form.scrapCost;
  function handleSave() {
    if (!form.moId || !form.period) return;
    if (initial) {
      onSave({
        id: initial.id,
        moId: BigInt(form.moId),
        period: form.period,
        materialCost: form.materialCost,
        labourCost: form.labourCost,
        overheadCost: form.overheadCost,
        scrapCost: form.scrapCost,
        notes: form.notes,
        enabled: form.enabled,
      } as UpdateCostOfProductionInput);
    } else {
      onSave({
        moId: BigInt(form.moId),
        period: form.period,
        materialCost: form.materialCost,
        labourCost: form.labourCost,
        overheadCost: form.overheadCost,
        scrapCost: form.scrapCost,
        notes: form.notes,
      } as CreateCostOfProductionInput);
    }
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="cop-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Cost Record" : "New Cost Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="MO ID">
              <Input
                value={form.moId}
                onChange={(e) => setForm({ ...form, moId: e.target.value })}
                placeholder="1"
                data-ocid="cop-mo-id"
              />
            </Field>
            <Field label="Period">
              <Input
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="Apr 2026"
                data-ocid="cop-period"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Material Cost">
              <Input
                type="number"
                min={0}
                value={form.materialCost}
                onChange={(e) =>
                  setForm({ ...form, materialCost: Number(e.target.value) })
                }
                data-ocid="cop-material"
              />
            </Field>
            <Field label="Labour Cost">
              <Input
                type="number"
                min={0}
                value={form.labourCost}
                onChange={(e) =>
                  setForm({ ...form, labourCost: Number(e.target.value) })
                }
                data-ocid="cop-labour"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Overhead Cost">
              <Input
                type="number"
                min={0}
                value={form.overheadCost}
                onChange={(e) =>
                  setForm({ ...form, overheadCost: Number(e.target.value) })
                }
                data-ocid="cop-overhead"
              />
            </Field>
            <Field label="Scrap Cost">
              <Input
                type="number"
                min={0}
                value={form.scrapCost}
                onChange={(e) =>
                  setForm({ ...form, scrapCost: Number(e.target.value) })
                }
                data-ocid="cop-scrap"
              />
            </Field>
          </div>
          <Field label="Total Cost (auto-calculated)">
            <Input
              type="number"
              value={totalCost}
              readOnly
              className="bg-muted/30 cursor-not-allowed"
              data-ocid="cop-total"
            />
          </Field>
          <Field label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes"
              data-ocid="cop-notes"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-ocid="cop-save-btn">
            {initial ? "Update" : "Create"} Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
