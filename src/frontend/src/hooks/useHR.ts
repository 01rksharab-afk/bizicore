import {
  type Attendance,
  AttendanceType,
  type CreateAttendanceInput,
  type CreateEmployeeInput,
  type CreatePayrollInput,
  type CreateSlipInput,
  type Employee,
  EmployeeStatus,
  type Payroll,
  PayrollStatus,
  type PfEsiConfig,
  type SalarySlip,
  SlipStatus,
  type UpdateAttendanceInput,
  type UpdateEmployeeInput,
  type UpdateSlipInput,
  type UpsertPfEsiInput,
} from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

// ─── Locally-defined stub types (no longer in backend bindings) ───────────────
export type Overtime = {
  id: bigint;
  orgId: bigint;
  employeeId: bigint;
  date: string;
  hours: number;
  rate: number;
  amount: number;
  notes: string;
  createdAt: bigint;
};
export type Voucher = {
  id: bigint;
  orgId: bigint;
  employeeId: bigint;
  date: string;
  voucherType: string;
  amount: number;
  notes: string;
  status: string;
  createdAt: bigint;
};
export type Advance = {
  id: bigint;
  orgId: bigint;
  employeeId: bigint;
  amount: number;
  requestDate: string;
  reason: string;
  approvedBy: string;
  status: string;
  createdAt: bigint;
};

export type CreateOvertimeInput = {
  employeeId: bigint;
  date: string;
  hours: number;
  rate: number;
  notes: string;
};
export type CreateVoucherInput = {
  employeeId: bigint;
  date: string;
  voucherType: string;
  amount: number;
  notes: string;
};
export type CreateAdvanceInput = {
  employeeId: bigint;
  amount: number;
  requestDate: string;
  reason: string;
};
export type UpdateAdvanceInput = {
  id: bigint;
  status: string;
  approvedBy: string;
};

export const AdvanceStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  paid: "paid",
} as const;
export type AdvanceStatus = (typeof AdvanceStatus)[keyof typeof AdvanceStatus];
export const VoucherStatus__1 = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;
export type VoucherStatus__1 =
  (typeof VoucherStatus__1)[keyof typeof VoucherStatus__1];
export const VoucherType = {
  meal: "meal",
  travel: "travel",
  medical: "medical",
  other: "other",
} as const;
export type VoucherType = (typeof VoucherType)[keyof typeof VoucherType];

// ─── Re-export enums for page use ─────────────────────────────────────────────
export { AttendanceType, EmployeeStatus, PayrollStatus, SlipStatus };

// ─── Re-export types for page use ─────────────────────────────────────────────
export type {
  Attendance,
  CreateAttendanceInput,
  CreateEmployeeInput,
  CreatePayrollInput,
  CreateSlipInput,
  Employee,
  Payroll,
  PfEsiConfig,
  SalarySlip,
  UpdateAttendanceInput,
  UpdateEmployeeInput,
  UpdateSlipInput,
  UpsertPfEsiInput,
};

// ─── Helper: get current orgId from localStorage ──────────────────────────────
function useOrgId(): bigint {
  try {
    const raw = localStorage.getItem("currentOrgId");
    if (raw) return BigInt(raw);
  } catch {
    // ignore
  }
  return BigInt(1);
}

// ─── Employees ────────────────────────────────────────────────────────────────
export function useHrEmployees() {
  const { actor, isFetching } = useBackendActor();
  const orgId = useOrgId();
  return useQuery<Employee[]>({
    queryKey: ["hr-employees", orgId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.hrListEmployees(orgId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHrEmployee(id: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  const orgId = useOrgId();
  return useQuery<Employee | null>({
    queryKey: ["hr-employee", orgId.toString(), id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.hrGetEmployee(orgId, id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useHrCreateEmployee() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrCreateEmployee(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });
}

export function useHrUpdateEmployee() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateEmployeeInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrUpdateEmployee(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });
}

export function useHrDeleteEmployee() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.hrDeleteEmployee(orgId, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });
}

export function useHrToggleEmployee() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.hrToggleEmployee(orgId, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export function useHrAttendance(employeeId?: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  const orgId = useOrgId();
  return useQuery<Attendance[]>({
    queryKey: ["hr-attendance", orgId.toString(), employeeId?.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.hrListAttendance(orgId, employeeId ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHrCreateAttendance() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAttendanceInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrCreateAttendance(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-attendance"] }),
  });
}

export function useHrUpdateAttendance() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAttendanceInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrUpdateAttendance(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-attendance"] }),
  });
}

export function useHrDeleteAttendance() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.hrDeleteAttendance(orgId, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-attendance"] }),
  });
}

// ─── Salary Slips ─────────────────────────────────────────────────────────────
export function useHrSlips(employeeId?: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  const orgId = useOrgId();
  return useQuery<SalarySlip[]>({
    queryKey: ["hr-slips", orgId.toString(), employeeId?.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.hrListSlips(orgId, employeeId ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHrCreateSlip() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSlipInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrCreateSlip(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-slips"] }),
  });
}

export function useHrUpdateSlip() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSlipInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrUpdateSlip(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-slips"] }),
  });
}

export function useHrDeleteSlip() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.hrDeleteSlip(orgId, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-slips"] }),
  });
}

// ─── Payroll ─────────────────────────────────────────────────────────────────
export function useHrPayrolls() {
  const { actor, isFetching } = useBackendActor();
  const orgId = useOrgId();
  return useQuery<Payroll[]>({
    queryKey: ["hr-payrolls", orgId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.hrListPayrolls(orgId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHrProcessPayroll() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePayrollInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrProcessPayroll(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payrolls"] }),
  });
}

export function useHrUpdatePayrollStatus() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: bigint;
      status: PayrollStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.hrUpdatePayrollStatus(orgId, id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payrolls"] }),
  });
}

// ─── PF/ESI Config ────────────────────────────────────────────────────────────
export function useHrPfEsiConfig() {
  const { actor, isFetching } = useBackendActor();
  const orgId = useOrgId();
  return useQuery<PfEsiConfig | null>({
    queryKey: ["hr-pfesi-config", orgId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.hrGetPfEsiConfig(orgId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHrUpsertPfEsiConfig() {
  const { actor } = useBackendActor();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertPfEsiInput) => {
      if (!actor) throw new Error("No actor");
      return actor.hrUpsertPfEsiConfig(orgId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-pfesi-config"] }),
  });
}

// ─── Overtime (client-side only — removed from backend API surface) ───────────
export function useHrOvertime(_employeeId?: bigint | null) {
  return useQuery<Overtime[]>({
    queryKey: ["hr-overtime-stub"],
    queryFn: async () => [],
  });
}

export function useHrCreateOvertime() {
  return useMutation({
    mutationFn: async (_input: CreateOvertimeInput): Promise<Overtime> => {
      throw new Error("Overtime management not available in this version");
    },
  });
}

export function useHrDeleteOvertime() {
  return useMutation({
    mutationFn: async (_id: bigint): Promise<void> => {
      throw new Error("Overtime management not available in this version");
    },
  });
}

// ─── Vouchers (client-side only — removed from backend API surface) ───────────
export function useHrVouchers(_employeeId?: bigint | null) {
  return useQuery<Voucher[]>({
    queryKey: ["hr-vouchers-stub"],
    queryFn: async () => [],
  });
}

export function useHrCreateVoucher() {
  return useMutation({
    mutationFn: async (_input: CreateVoucherInput): Promise<Voucher> => {
      throw new Error("Voucher management not available in this version");
    },
  });
}

export function useHrApproveVoucher() {
  return useMutation({
    mutationFn: async (_args: {
      id: bigint;
      approved: boolean;
    }): Promise<Voucher> => {
      throw new Error("Voucher management not available in this version");
    },
  });
}

export function useHrDeleteVoucher() {
  return useMutation({
    mutationFn: async (_id: bigint): Promise<void> => {
      throw new Error("Voucher management not available in this version");
    },
  });
}

// ─── Advances (client-side only — removed from backend API surface) ───────────
export function useHrAdvances(_employeeId?: bigint | null) {
  return useQuery<Advance[]>({
    queryKey: ["hr-advances-stub"],
    queryFn: async () => [],
  });
}

export function useHrCreateAdvance() {
  return useMutation({
    mutationFn: async (_input: CreateAdvanceInput): Promise<Advance> => {
      throw new Error("Advance management not available in this version");
    },
  });
}

export function useHrUpdateAdvance() {
  return useMutation({
    mutationFn: async (_input: UpdateAdvanceInput): Promise<Advance> => {
      throw new Error("Advance management not available in this version");
    },
  });
}

export function useHrDeleteAdvance() {
  return useMutation({
    mutationFn: async (_id: bigint): Promise<void> => {
      throw new Error("Advance management not available in this version");
    },
  });
}

// ─── Search/Filter helpers ────────────────────────────────────────────────────
export function useHrPageState(columns: string[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exportCols, setExportCols] = useState<Set<string>>(new Set(columns));
  const [importFile, setImportFile] = useState<File | null>(null);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const toggleExportCol = useCallback((col: string) => {
    setExportCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }, []);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    employeeFilter,
    setEmployeeFilter,
    page,
    setPage,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    exportOpen,
    setExportOpen,
    importOpen,
    setImportOpen,
    reportOpen,
    setReportOpen,
    exportCols,
    toggleExportCol,
    importFile,
    setImportFile,
  };
}

// ─── CSV export helper ────────────────────────────────────────────────────────
export function downloadCsvData(
  rows: Record<string, string>[],
  cols: string[],
  filename: string,
) {
  const header = cols.join(",");
  const lines = rows.map((r) =>
    cols.map((c) => `"${(r[c] ?? "").replace(/"/g, '""')}"`).join(","),
  );
  const csv = [header, ...lines].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

// ─── Employee name lookup helper ──────────────────────────────────────────────
export function useEmployeeMap(employees: Employee[]) {
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) {
      map.set(e.id.toString(), e.name);
    }
    return map;
  }, [employees]);
}
