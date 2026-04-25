module {
  // ── Shared value types ─────────────────────────────────────────────────────

  public type EmployeeStatus = { #active; #inactive };
  public type AttendanceType = { #present; #absent; #halfDay; #leave };
  public type SlipStatus     = { #draft; #generated; #paid };
  public type PayrollStatus  = { #pending; #processed; #paid };
  public type AdvanceStatus  = { #pending; #approved; #rejected; #deducted };
  public type VoucherStatus  = { #pending; #approved };
  public type VoucherType    = { #meal; #travel; #other };

  // ── Employee ───────────────────────────────────────────────────────────────

  public type Employee = {
    id           : Nat;
    orgId        : Nat;
    name         : Text;
    email        : Text;
    phone        : Text;
    department   : Text;
    designation  : Text;
    employeeCode : Text;
    joiningDate  : Text;
    status       : EmployeeStatus;
    salaryGrade  : Text;
    enabled      : Bool;
    createdAt    : Int;
  };

  public type CreateEmployeeInput = {
    name         : Text;
    email        : Text;
    phone        : Text;
    department   : Text;
    designation  : Text;
    employeeCode : Text;
    joiningDate  : Text;
    salaryGrade  : Text;
  };

  public type UpdateEmployeeInput = {
    id           : Nat;
    name         : Text;
    email        : Text;
    phone        : Text;
    department   : Text;
    designation  : Text;
    employeeCode : Text;
    joiningDate  : Text;
    status       : EmployeeStatus;
    salaryGrade  : Text;
    enabled      : Bool;
  };

  // ── Attendance ─────────────────────────────────────────────────────────────

  public type Attendance = {
    id             : Nat;
    orgId          : Nat;
    employeeId     : Nat;
    date           : Text;
    punchIn        : ?Text;
    punchOut       : ?Text;
    totalHours     : Float;
    attendanceType : AttendanceType;
    notes          : Text;
    createdAt      : Int;
  };

  public type CreateAttendanceInput = {
    employeeId     : Nat;
    date           : Text;
    punchIn        : ?Text;
    punchOut       : ?Text;
    totalHours     : Float;
    attendanceType : AttendanceType;
    notes          : Text;
  };

  public type UpdateAttendanceInput = {
    id             : Nat;
    employeeId     : Nat;
    date           : Text;
    punchIn        : ?Text;
    punchOut       : ?Text;
    totalHours     : Float;
    attendanceType : AttendanceType;
    notes          : Text;
  };

  // ── Salary Slip ────────────────────────────────────────────────────────────

  public type SalarySlip = {
    id               : Nat;
    orgId            : Nat;
    employeeId       : Nat;
    month            : Nat;
    year             : Nat;
    basicSalary      : Float;
    hra              : Float;
    da               : Float;
    otherAllowances  : Float;
    pfDeduction      : Float;
    esiDeduction     : Float;
    tdsDeduction     : Float;
    advanceDeduction : Float;
    netPay           : Float;
    status           : SlipStatus;
    createdAt        : Int;
  };

  public type CreateSlipInput = {
    employeeId       : Nat;
    month            : Nat;
    year             : Nat;
    basicSalary      : Float;
    hra              : Float;
    da               : Float;
    otherAllowances  : Float;
    pfDeduction      : Float;
    esiDeduction     : Float;
    tdsDeduction     : Float;
    advanceDeduction : Float;
  };

  public type UpdateSlipInput = {
    id               : Nat;
    basicSalary      : Float;
    hra              : Float;
    da               : Float;
    otherAllowances  : Float;
    pfDeduction      : Float;
    esiDeduction     : Float;
    tdsDeduction     : Float;
    advanceDeduction : Float;
    status           : SlipStatus;
  };

  // ── Payroll ────────────────────────────────────────────────────────────────

  public type Payroll = {
    id              : Nat;
    orgId           : Nat;
    month           : Nat;
    year            : Nat;
    totalEmployees  : Nat;
    totalGrossPay   : Float;
    totalDeductions : Float;
    totalNetPay     : Float;
    status          : PayrollStatus;
    processedAt     : Int;
    createdAt       : Int;
  };

  public type CreatePayrollInput = {
    month : Nat;
    year  : Nat;
  };

  // ── PF/ESI Config ──────────────────────────────────────────────────────────

  public type PfEsiConfig = {
    id                        : Nat;
    orgId                     : Nat;
    pfEmployerRate            : Float;
    pfEmployeeRate            : Float;
    esiRate                   : Float;
    insurancePremiumPerEmployee : Float;
    effectiveFrom             : Text;
    createdAt                 : Int;
  };

  public type UpsertPfEsiInput = {
    pfEmployerRate            : Float;
    pfEmployeeRate            : Float;
    esiRate                   : Float;
    insurancePremiumPerEmployee : Float;
    effectiveFrom             : Text;
  };

  // ── Overtime ───────────────────────────────────────────────────────────────

  public type Overtime = {
    id         : Nat;
    orgId      : Nat;
    employeeId : Nat;
    date       : Text;
    hours      : Float;
    rate       : Float;
    amount     : Float;
    notes      : Text;
    createdAt  : Int;
  };

  public type CreateOvertimeInput = {
    employeeId : Nat;
    date       : Text;
    hours      : Float;
    rate       : Float;
    notes      : Text;
  };

  // ── Voucher ────────────────────────────────────────────────────────────────

  public type Voucher = {
    id         : Nat;
    orgId      : Nat;
    employeeId : Nat;
    voucherType : VoucherType;
    date       : Text;
    amount     : Float;
    status     : VoucherStatus;
    notes      : Text;
    createdAt  : Int;
  };

  public type CreateVoucherInput = {
    employeeId  : Nat;
    voucherType : VoucherType;
    date        : Text;
    amount      : Float;
    notes       : Text;
  };

  // ── Advance ────────────────────────────────────────────────────────────────

  public type Advance = {
    id          : Nat;
    orgId       : Nat;
    employeeId  : Nat;
    amount      : Float;
    requestDate : Text;
    reason      : Text;
    status      : AdvanceStatus;
    approvedBy  : Text;
    createdAt   : Int;
  };

  public type CreateAdvanceInput = {
    employeeId  : Nat;
    amount      : Float;
    requestDate : Text;
    reason      : Text;
  };

  public type UpdateAdvanceInput = {
    id         : Nat;
    status     : AdvanceStatus;
    approvedBy : Text;
  };
};
