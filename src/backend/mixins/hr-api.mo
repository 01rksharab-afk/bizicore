import HrLib "../lib/hr";
import Types  "../types/hr";

mixin (
  employees   : HrLib.EmployeeMap,
  attendance  : HrLib.AttendanceMap,
  slips       : HrLib.SlipMap,
  payrolls    : HrLib.PayrollMap,
  pfEsiCfgs   : HrLib.PfEsiMap,
  overtimes   : HrLib.OvertimeMap,
  vouchers    : HrLib.VoucherMap,
  advances    : HrLib.AdvanceMap,
  nextEmpId   : { var value : Nat },
  nextAttId   : { var value : Nat },
  nextSlipId  : { var value : Nat },
  nextPayId   : { var value : Nat },
  nextPfEsiId : { var value : Nat },
  nextOtId    : { var value : Nat },
  nextVchId   : { var value : Nat },
  nextAdvId   : { var value : Nat },
) {

  // ── Employees ──────────────────────────────────────────────────────────────

  public query func hrListEmployees(orgId : Nat) : async [Types.Employee] {
    HrLib.listEmployees(employees, orgId)
  };

  public query func hrGetEmployee(orgId : Nat, id : Nat) : async ?Types.Employee {
    HrLib.getEmployee(employees, orgId, id)
  };

  public shared ({ caller }) func hrCreateEmployee(orgId : Nat, input : Types.CreateEmployeeInput) : async Types.Employee {
    let id = nextEmpId.value;
    nextEmpId.value += 1;
    HrLib.createEmployee(employees, orgId, input, id)
  };

  public shared ({ caller }) func hrUpdateEmployee(orgId : Nat, input : Types.UpdateEmployeeInput) : async Types.Employee {
    HrLib.updateEmployee(employees, orgId, input)
  };

  public shared ({ caller }) func hrDeleteEmployee(orgId : Nat, id : Nat) : async () {
    HrLib.deleteEmployee(employees, orgId, id)
  };

  public shared ({ caller }) func hrToggleEmployee(orgId : Nat, id : Nat) : async Types.Employee {
    HrLib.toggleEmployee(employees, orgId, id)
  };

  // ── Attendance ─────────────────────────────────────────────────────────────

  public query func hrListAttendance(orgId : Nat, employeeId : ?Nat) : async [Types.Attendance] {
    HrLib.listAttendance(attendance, orgId, employeeId)
  };

  public shared ({ caller }) func hrCreateAttendance(orgId : Nat, input : Types.CreateAttendanceInput) : async Types.Attendance {
    let id = nextAttId.value;
    nextAttId.value += 1;
    HrLib.createAttendance(attendance, orgId, input, id)
  };

  public shared ({ caller }) func hrUpdateAttendance(orgId : Nat, input : Types.UpdateAttendanceInput) : async Types.Attendance {
    HrLib.updateAttendance(attendance, orgId, input)
  };

  public shared ({ caller }) func hrDeleteAttendance(orgId : Nat, id : Nat) : async () {
    HrLib.deleteAttendance(attendance, orgId, id)
  };

  // ── Salary Slips ───────────────────────────────────────────────────────────

  public query func hrListSlips(orgId : Nat, employeeId : ?Nat) : async [Types.SalarySlip] {
    HrLib.listSlips(slips, orgId, employeeId)
  };

  public shared ({ caller }) func hrCreateSlip(orgId : Nat, input : Types.CreateSlipInput) : async Types.SalarySlip {
    let id = nextSlipId.value;
    nextSlipId.value += 1;
    HrLib.createSlip(slips, orgId, input, id)
  };

  public shared ({ caller }) func hrUpdateSlip(orgId : Nat, input : Types.UpdateSlipInput) : async Types.SalarySlip {
    HrLib.updateSlip(slips, orgId, input)
  };

  public shared ({ caller }) func hrDeleteSlip(orgId : Nat, id : Nat) : async () {
    HrLib.deleteSlip(slips, orgId, id)
  };

  // ── Payroll ────────────────────────────────────────────────────────────────

  public query func hrListPayrolls(orgId : Nat) : async [Types.Payroll] {
    HrLib.listPayrolls(payrolls, orgId)
  };

  public shared ({ caller }) func hrProcessPayroll(orgId : Nat, input : Types.CreatePayrollInput) : async Types.Payroll {
    let id = nextPayId.value;
    nextPayId.value += 1;
    HrLib.processPayroll(payrolls, slips, orgId, input, id)
  };

  public shared ({ caller }) func hrUpdatePayrollStatus(orgId : Nat, id : Nat, status : Types.PayrollStatus) : async Types.Payroll {
    HrLib.updatePayrollStatus(payrolls, orgId, id, status)
  };

  // ── PF/ESI Config ──────────────────────────────────────────────────────────

  public query func hrGetPfEsiConfig(orgId : Nat) : async ?Types.PfEsiConfig {
    HrLib.getPfEsiConfig(pfEsiCfgs, orgId)
  };

  public shared ({ caller }) func hrUpsertPfEsiConfig(orgId : Nat, input : Types.UpsertPfEsiInput) : async Types.PfEsiConfig {
    let id = nextPfEsiId.value;
    nextPfEsiId.value += 1;
    HrLib.upsertPfEsiConfig(pfEsiCfgs, orgId, input, id)
  };

  // ── Overtime (internal only) ───────────────────────────────────────────────

  // ── Vouchers (internal only) ───────────────────────────────────────────────

  // ── Advances (internal only) ───────────────────────────────────────────────

};
