import Types "../types/hr";
import Map    "mo:core/Map";
import Nat    "mo:core/Nat";
import Time   "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  // ── Map type aliases ───────────────────────────────────────────────────────
  public type EmployeeMap   = Map.Map<Nat, Types.Employee>;
  public type AttendanceMap = Map.Map<Nat, Types.Attendance>;
  public type SlipMap       = Map.Map<Nat, Types.SalarySlip>;
  public type PayrollMap    = Map.Map<Nat, Types.Payroll>;
  public type PfEsiMap      = Map.Map<Nat, Types.PfEsiConfig>;
  public type OvertimeMap   = Map.Map<Nat, Types.Overtime>;
  public type VoucherMap    = Map.Map<Nat, Types.Voucher>;
  public type AdvanceMap    = Map.Map<Nat, Types.Advance>;

  // ── Helpers ────────────────────────────────────────────────────────────────

  func assertOrg(itemOrgId : Nat, orgId : Nat) {
    if (itemOrgId != orgId) Runtime.trap("HR: record belongs to a different org");
  };

  // ── Employee ───────────────────────────────────────────────────────────────

  public func listEmployees(store : EmployeeMap, orgId : Nat) : [Types.Employee] {
    store.values().filter(func(e) { e.orgId == orgId }).toArray()
  };

  public func getEmployee(store : EmployeeMap, orgId : Nat, id : Nat) : ?Types.Employee {
    switch (store.get(id)) {
      case (?e) { if (e.orgId == orgId) ?e else null };
      case null null;
    }
  };

  public func createEmployee(store : EmployeeMap, orgId : Nat, input : Types.CreateEmployeeInput, nextId : Nat) : Types.Employee {
    let emp : Types.Employee = {
      id           = nextId;
      orgId        = orgId;
      name         = input.name;
      email        = input.email;
      phone        = input.phone;
      department   = input.department;
      designation  = input.designation;
      employeeCode = input.employeeCode;
      joiningDate  = input.joiningDate;
      status       = #active;
      salaryGrade  = input.salaryGrade;
      enabled      = true;
      createdAt    = Time.now();
    };
    store.add(nextId, emp);
    emp
  };

  public func updateEmployee(store : EmployeeMap, orgId : Nat, input : Types.UpdateEmployeeInput) : Types.Employee {
    let existing = switch (store.get(input.id)) {
      case (?e) e;
      case null Runtime.trap("HR: Employee not found with id " # input.id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Employee = {
      existing with
      name         = input.name;
      email        = input.email;
      phone        = input.phone;
      department   = input.department;
      designation  = input.designation;
      employeeCode = input.employeeCode;
      joiningDate  = input.joiningDate;
      status       = input.status;
      salaryGrade  = input.salaryGrade;
      enabled      = input.enabled;
    };
    store.add(input.id, updated);
    updated
  };

  public func deleteEmployee(store : EmployeeMap, orgId : Nat, id : Nat) {
    switch (store.get(id)) {
      case (?e) { assertOrg(e.orgId, orgId); store.remove(id) };
      case null Runtime.trap("HR: Employee not found with id " # id.toText());
    }
  };

  public func toggleEmployee(store : EmployeeMap, orgId : Nat, id : Nat) : Types.Employee {
    let existing = switch (store.get(id)) {
      case (?e) e;
      case null Runtime.trap("HR: Employee not found with id " # id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Employee = { existing with enabled = not existing.enabled };
    store.add(id, updated);
    updated
  };

  // ── Attendance ─────────────────────────────────────────────────────────────

  public func listAttendance(store : AttendanceMap, orgId : Nat, employeeId : ?Nat) : [Types.Attendance] {
    store.values().filter(func(a) {
      if (a.orgId != orgId) return false;
      switch (employeeId) {
        case (?eid) a.employeeId == eid;
        case null   true;
      }
    }).toArray()
  };

  public func createAttendance(store : AttendanceMap, orgId : Nat, input : Types.CreateAttendanceInput, nextId : Nat) : Types.Attendance {
    let rec : Types.Attendance = {
      id             = nextId;
      orgId          = orgId;
      employeeId     = input.employeeId;
      date           = input.date;
      punchIn        = input.punchIn;
      punchOut       = input.punchOut;
      totalHours     = input.totalHours;
      attendanceType = input.attendanceType;
      notes          = input.notes;
      createdAt      = Time.now();
    };
    store.add(nextId, rec);
    rec
  };

  public func updateAttendance(store : AttendanceMap, orgId : Nat, input : Types.UpdateAttendanceInput) : Types.Attendance {
    let existing = switch (store.get(input.id)) {
      case (?a) a;
      case null Runtime.trap("HR: Attendance not found with id " # input.id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Attendance = {
      existing with
      employeeId     = input.employeeId;
      date           = input.date;
      punchIn        = input.punchIn;
      punchOut       = input.punchOut;
      totalHours     = input.totalHours;
      attendanceType = input.attendanceType;
      notes          = input.notes;
    };
    store.add(input.id, updated);
    updated
  };

  public func deleteAttendance(store : AttendanceMap, orgId : Nat, id : Nat) {
    switch (store.get(id)) {
      case (?a) { assertOrg(a.orgId, orgId); store.remove(id) };
      case null Runtime.trap("HR: Attendance not found with id " # id.toText());
    }
  };

  // ── Salary Slip ────────────────────────────────────────────────────────────

  func calcNetPay(input : Types.CreateSlipInput) : Float {
    let gross = input.basicSalary + input.hra + input.da + input.otherAllowances;
    let deductions = input.pfDeduction + input.esiDeduction + input.tdsDeduction + input.advanceDeduction;
    gross - deductions
  };

  public func listSlips(store : SlipMap, orgId : Nat, employeeId : ?Nat) : [Types.SalarySlip] {
    store.values().filter(func(s) {
      if (s.orgId != orgId) return false;
      switch (employeeId) {
        case (?eid) s.employeeId == eid;
        case null   true;
      }
    }).toArray()
  };

  public func createSlip(store : SlipMap, orgId : Nat, input : Types.CreateSlipInput, nextId : Nat) : Types.SalarySlip {
    let slip : Types.SalarySlip = {
      id               = nextId;
      orgId            = orgId;
      employeeId       = input.employeeId;
      month            = input.month;
      year             = input.year;
      basicSalary      = input.basicSalary;
      hra              = input.hra;
      da               = input.da;
      otherAllowances  = input.otherAllowances;
      pfDeduction      = input.pfDeduction;
      esiDeduction     = input.esiDeduction;
      tdsDeduction     = input.tdsDeduction;
      advanceDeduction = input.advanceDeduction;
      netPay           = calcNetPay(input);
      status           = #draft;
      createdAt        = Time.now();
    };
    store.add(nextId, slip);
    slip
  };

  public func updateSlip(store : SlipMap, orgId : Nat, input : Types.UpdateSlipInput) : Types.SalarySlip {
    let existing = switch (store.get(input.id)) {
      case (?s) s;
      case null Runtime.trap("HR: SalarySlip not found with id " # input.id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let gross = input.basicSalary + input.hra + input.da + input.otherAllowances;
    let deductions = input.pfDeduction + input.esiDeduction + input.tdsDeduction + input.advanceDeduction;
    let updated : Types.SalarySlip = {
      existing with
      basicSalary      = input.basicSalary;
      hra              = input.hra;
      da               = input.da;
      otherAllowances  = input.otherAllowances;
      pfDeduction      = input.pfDeduction;
      esiDeduction     = input.esiDeduction;
      tdsDeduction     = input.tdsDeduction;
      advanceDeduction = input.advanceDeduction;
      netPay           = gross - deductions;
      status           = input.status;
    };
    store.add(input.id, updated);
    updated
  };

  public func deleteSlip(store : SlipMap, orgId : Nat, id : Nat) {
    switch (store.get(id)) {
      case (?s) { assertOrg(s.orgId, orgId); store.remove(id) };
      case null Runtime.trap("HR: SalarySlip not found with id " # id.toText());
    }
  };

  // ── Payroll ────────────────────────────────────────────────────────────────

  public func listPayrolls(store : PayrollMap, orgId : Nat) : [Types.Payroll] {
    store.values().filter(func(p) { p.orgId == orgId }).toArray()
  };

  public func processPayroll(
    payrolls : PayrollMap,
    slips    : SlipMap,
    orgId    : Nat,
    input    : Types.CreatePayrollInput,
    nextId   : Nat,
  ) : Types.Payroll {
    // Aggregate from salary slips for this org / month / year
    let orgSlips = slips.values().filter(func(s) {
      s.orgId == orgId and s.month == input.month and s.year == input.year
    }).toArray();

    var totalGross   : Float = 0;
    var totalDed     : Float = 0;
    var totalNet     : Float = 0;

    for (s in orgSlips.values()) {
      let gross = s.basicSalary + s.hra + s.da + s.otherAllowances;
      let ded   = s.pfDeduction + s.esiDeduction + s.tdsDeduction + s.advanceDeduction;
      totalGross += gross;
      totalDed   += ded;
      totalNet   += s.netPay;
    };

    let payroll : Types.Payroll = {
      id              = nextId;
      orgId           = orgId;
      month           = input.month;
      year            = input.year;
      totalEmployees  = orgSlips.size();
      totalGrossPay   = totalGross;
      totalDeductions = totalDed;
      totalNetPay     = totalNet;
      status          = #processed;
      processedAt     = Time.now();
      createdAt       = Time.now();
    };
    payrolls.add(nextId, payroll);
    payroll
  };

  public func updatePayrollStatus(store : PayrollMap, orgId : Nat, id : Nat, status : Types.PayrollStatus) : Types.Payroll {
    let existing = switch (store.get(id)) {
      case (?p) p;
      case null Runtime.trap("HR: Payroll not found with id " # id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Payroll = { existing with status = status };
    store.add(id, updated);
    updated
  };

  // ── PF/ESI Config ──────────────────────────────────────────────────────────

  public func getPfEsiConfig(store : PfEsiMap, orgId : Nat) : ?Types.PfEsiConfig {
    store.get(orgId)
  };

  public func upsertPfEsiConfig(store : PfEsiMap, orgId : Nat, input : Types.UpsertPfEsiInput, nextId : Nat) : Types.PfEsiConfig {
    let existing = store.get(orgId);
    let id = switch (existing) { case (?e) e.id; case null nextId };
    let cfg : Types.PfEsiConfig = {
      id                          = id;
      orgId                       = orgId;
      pfEmployerRate              = input.pfEmployerRate;
      pfEmployeeRate              = input.pfEmployeeRate;
      esiRate                     = input.esiRate;
      insurancePremiumPerEmployee = input.insurancePremiumPerEmployee;
      effectiveFrom               = input.effectiveFrom;
      createdAt                   = Time.now();
    };
    store.add(orgId, cfg);
    cfg
  };

  // ── Overtime ───────────────────────────────────────────────────────────────

  public func listOvertime(store : OvertimeMap, orgId : Nat, employeeId : ?Nat) : [Types.Overtime] {
    store.values().filter(func(o) {
      if (o.orgId != orgId) return false;
      switch (employeeId) {
        case (?eid) o.employeeId == eid;
        case null   true;
      }
    }).toArray()
  };

  public func createOvertime(store : OvertimeMap, orgId : Nat, input : Types.CreateOvertimeInput, nextId : Nat) : Types.Overtime {
    let rec : Types.Overtime = {
      id         = nextId;
      orgId      = orgId;
      employeeId = input.employeeId;
      date       = input.date;
      hours      = input.hours;
      rate       = input.rate;
      amount     = input.hours * input.rate;
      notes      = input.notes;
      createdAt  = Time.now();
    };
    store.add(nextId, rec);
    rec
  };

  public func deleteOvertime(store : OvertimeMap, orgId : Nat, id : Nat) {
    switch (store.get(id)) {
      case (?o) { assertOrg(o.orgId, orgId); store.remove(id) };
      case null Runtime.trap("HR: Overtime not found with id " # id.toText());
    }
  };

  // ── Voucher ────────────────────────────────────────────────────────────────

  public func listVouchers(store : VoucherMap, orgId : Nat, employeeId : ?Nat) : [Types.Voucher] {
    store.values().filter(func(v) {
      if (v.orgId != orgId) return false;
      switch (employeeId) {
        case (?eid) v.employeeId == eid;
        case null   true;
      }
    }).toArray()
  };

  public func createVoucher(store : VoucherMap, orgId : Nat, input : Types.CreateVoucherInput, nextId : Nat) : Types.Voucher {
    let rec : Types.Voucher = {
      id          = nextId;
      orgId       = orgId;
      employeeId  = input.employeeId;
      voucherType = input.voucherType;
      date        = input.date;
      amount      = input.amount;
      status      = #pending;
      notes       = input.notes;
      createdAt   = Time.now();
    };
    store.add(nextId, rec);
    rec
  };

  public func approveVoucher(store : VoucherMap, orgId : Nat, id : Nat) : Types.Voucher {
    let existing = switch (store.get(id)) {
      case (?v) v;
      case null Runtime.trap("HR: Voucher not found with id " # id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Voucher = { existing with status = #approved };
    store.add(id, updated);
    updated
  };

  public func deleteVoucher(store : VoucherMap, orgId : Nat, id : Nat) {
    switch (store.get(id)) {
      case (?v) { assertOrg(v.orgId, orgId); store.remove(id) };
      case null Runtime.trap("HR: Voucher not found with id " # id.toText());
    }
  };

  // ── Advance ────────────────────────────────────────────────────────────────

  public func listAdvances(store : AdvanceMap, orgId : Nat, employeeId : ?Nat) : [Types.Advance] {
    store.values().filter(func(a) {
      if (a.orgId != orgId) return false;
      switch (employeeId) {
        case (?eid) a.employeeId == eid;
        case null   true;
      }
    }).toArray()
  };

  public func createAdvance(store : AdvanceMap, orgId : Nat, input : Types.CreateAdvanceInput, nextId : Nat) : Types.Advance {
    let rec : Types.Advance = {
      id          = nextId;
      orgId       = orgId;
      employeeId  = input.employeeId;
      amount      = input.amount;
      requestDate = input.requestDate;
      reason      = input.reason;
      status      = #pending;
      approvedBy  = "";
      createdAt   = Time.now();
    };
    store.add(nextId, rec);
    rec
  };

  public func updateAdvance(store : AdvanceMap, orgId : Nat, input : Types.UpdateAdvanceInput) : Types.Advance {
    let existing = switch (store.get(input.id)) {
      case (?a) a;
      case null Runtime.trap("HR: Advance not found with id " # input.id.toText());
    };
    assertOrg(existing.orgId, orgId);
    let updated : Types.Advance = {
      existing with
      status     = input.status;
      approvedBy = input.approvedBy;
    };
    store.add(input.id, updated);
    updated
  };

  public func deleteAdvance(store : AdvanceMap, orgId : Nat, id : Nat) {
    switch (store.get(id)) {
      case (?a) { assertOrg(a.orgId, orgId); store.remove(id) };
      case null Runtime.trap("HR: Advance not found with id " # id.toText());
    }
  };
};
