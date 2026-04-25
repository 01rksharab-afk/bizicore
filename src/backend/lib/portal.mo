import Map     "mo:core/Map";
import Char    "mo:core/Char";
import Types   "../types/portal";

module {
  // ── Type aliases exposed to main.mo ─────────────────────────────────────
  public type CompanyMap      = Map.Map<Text, Types.PortalCompany>;
  public type GroupMap        = Map.Map<Text, Types.PortalGroup>;
  public type IndividualMap   = Map.Map<Text, Types.PortalIndividual>;
  public type EmpMap          = Map.Map<Text, Types.PortalEmployee>;
  public type TaskMap         = Map.Map<Text, Types.PortalTask>;
  public type LayoutMap       = Map.Map<Text, Types.DashboardLayout>;
  public type NotifMap        = Map.Map<Text, Types.AdminNotification>;
  public type NextIdRef       = { var value : Nat };

  // ── Simple deterministic hash (lean, no crypto dep) ─────────────────────
  // Combines char codes with a polynomial rolling hash, outputs as hex-like text.
  public func hashPassword(password : Text) : Text {
    let chars = password.toArray();
    var h : Nat = 5381;
    for (c in chars.values()) {
      let code = c.toNat32();
      // h = h * 33 + code (djb2 variant)
      h := (h * 33 + Nat32.toNat(code)) % 0xFFFFFFFF;
    };
    // convert to hex-like text using digit chars
    let hexDigits = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
    var result = "";
    var n = h;
    // produce 8 hex digits
    var i = 0;
    while (i < 8) {
      result := hexDigits[n % 16] # result;
      n := n / 16;
      i += 1;
    };
    result
  };

  // ── Auto-generate Employee ID ────────────────────────────────────────────
  public func genEmployeeId(counter : Nat) : Text {
    let s = counter.toText();
    let padded = if (s.size() >= 4) s
      else if (s.size() == 3) "0" # s
      else if (s.size() == 2) "00" # s
      else "000" # s;
    "EMP-" # padded
  };

  // ── Auto-generate generic ID ─────────────────────────────────────────────
  public func genId(prefix : Text, counter : Nat) : Text {
    prefix # "-" # counter.toText()
  };

  // ── Company registration ─────────────────────────────────────────────────
  public func registerCompany(
    companies : CompanyMap,
    nextId    : NextIdRef,
    input     : Types.RegisterCompanyInput,
    now       : Int,
  ) : { #ok : Types.PortalAdminSession; #err : Text } {
    // Check email uniqueness
    let emailLower = input.adminEmail.toLower();
    let exists = companies.any(func(_, c) { c.adminEmail.toLower() == emailLower });
    if (exists) return #err("Email already registered");

    let id = genId("COMP", nextId.value);
    nextId.value += 1;
    let company : Types.PortalCompany = {
      id;
      name             = input.name;
      companyType      = input.companyType;
      gst              = input.gst;
      industry         = input.industry;
      website          = input.website;
      street           = input.street;
      city             = input.city;
      state            = input.state;
      pin              = input.pin;
      logoUrl          = input.logoUrl;
      adminEmail       = input.adminEmail;
      adminName        = input.adminName;
      adminDesignation = input.adminDesignation;
      adminPhone       = input.adminPhone;
      passwordHash     = hashPassword(input.password);
      createdAt        = now;
    };
    companies.add(id, company);
    #ok {
      email     = input.adminEmail;
      companyId = id;
      adminName = input.adminName;
      logoUrl   = input.logoUrl;
      role      = #portalAdmin;
    }
  };

  // ── Group registration ───────────────────────────────────────────────────
  public func registerGroup(
    groups : GroupMap,
    nextId : NextIdRef,
    input  : Types.RegisterGroupInput,
    now    : Int,
  ) : { #ok : Text; #err : Text } {
    let emailLower = input.contactEmail.toLower();
    let exists = groups.any(func(_, g) { g.contactEmail.toLower() == emailLower });
    if (exists) return #err("Email already registered");

    let id = genId("GRP", nextId.value);
    nextId.value += 1;
    let group : Types.PortalGroup = {
      id;
      name         = input.name;
      groupType    = input.groupType;
      description  = input.description;
      headName     = input.headName;
      contactEmail = input.contactEmail;
      phone        = input.phone;
      passwordHash = hashPassword(input.password);
      createdAt    = now;
    };
    groups.add(id, group);
    #ok id
  };

  // ── Individual registration ──────────────────────────────────────────────
  public func registerIndividual(
    individuals : IndividualMap,
    nextId      : NextIdRef,
    input       : Types.RegisterIndividualInput,
    now         : Int,
  ) : { #ok : Text; #err : Text } {
    let emailLower = input.email.toLower();
    let exists = individuals.any(func(_, ind) { ind.email.toLower() == emailLower });
    if (exists) return #err("Email already registered");

    let id = genId("IND", nextId.value);
    nextId.value += 1;
    let individual : Types.PortalIndividual = {
      id;
      fullName        = input.fullName;
      email           = input.email;
      phone           = input.phone;
      passwordHash    = hashPassword(input.password);
      profilePhotoUrl = input.profilePhotoUrl;
      createdAt       = now;
    };
    individuals.add(id, individual);
    #ok id
  };

  // ── Admin login ──────────────────────────────────────────────────────────
  public func loginAdmin(
    companies : CompanyMap,
    email     : Text,
    password  : Text,
  ) : { #ok : Types.PortalAdminSession; #err : Text } {
    let emailLower = email.toLower();
    let hash = hashPassword(password);
    // Search by iterating values
    let found = companies.values().find(func(c) { c.adminEmail.toLower() == emailLower });
    switch (found) {
      case null { #err("Invalid email or password") };
      case (?company) {
        if (company.passwordHash != hash) return #err("Invalid email or password");
        #ok {
          email     = company.adminEmail;
          companyId = company.id;
          adminName = company.adminName;
          logoUrl   = company.logoUrl;
          role      = #portalAdmin;
        }
      };
    }
  };

  // ── Employee login ───────────────────────────────────────────────────────
  public func loginEmployee(
    employees  : EmpMap,
    employeeId : Text,
    password   : Text,
  ) : { #ok : Types.PortalEmployeeSession; #err : Text } {
    let hash = hashPassword(password);
    switch (employees.get(employeeId)) {
      case null { #err("Invalid employee ID or password") };
      case (?emp) {
        if (not emp.isActive) return #err("Account is deactivated");
        if (emp.passwordHash != hash) return #err("Invalid employee ID or password");
        #ok {
          employeeId = emp.employeeId;
          name       = emp.name;
          companyId  = emp.companyId;
          role       = #portalEmployee;
        }
      };
    }
  };

  // ── Employee CRUD ─────────────────────────────────────────────────────────
  public func createEmployee(
    employees : EmpMap,
    nextId    : NextIdRef,
    input     : Types.CreateEmployeeInput,
    now       : Int,
  ) : { #ok : Types.PortalEmployee; #err : Text } {
    if (input.designation.size() == 0) return #err("Designation is required");
    if (input.department.size() == 0)  return #err("Department is required");

    let empId = genEmployeeId(nextId.value);
    nextId.value += 1;
    let emp : Types.PortalEmployee = {
      employeeId        = empId;
      name              = input.name;
      designation       = input.designation;
      department        = input.department;
      email             = input.email;
      passwordHash      = hashPassword(input.password);
      companyId         = input.companyId;
      modulePermissions = input.modulePermissions;
      isActive          = true;
      createdAt         = now;
    };
    employees.add(empId, emp);
    #ok emp
  };

  public func updateEmployee(
    employees         : EmpMap,
    employeeId        : Text,
    name              : ?Text,
    designation       : ?Text,
    department        : ?Text,
    modulePermissions : ?[(Text, Bool)],
    now               : Int,
  ) : { #ok : Types.PortalEmployee; #err : Text } {
    switch (employees.get(employeeId)) {
      case null { #err("Employee not found") };
      case (?emp) {
        let updated : Types.PortalEmployee = {
          emp with
          name              = switch (name)              { case (?v) v; case null emp.name };
          designation       = switch (designation)       { case (?v) v; case null emp.designation };
          department        = switch (department)        { case (?v) v; case null emp.department };
          modulePermissions = switch (modulePermissions) { case (?v) v; case null emp.modulePermissions };
        };
        employees.add(employeeId, updated);
        #ok updated
      };
    }
  };

  public func deactivateEmployee(
    employees  : EmpMap,
    employeeId : Text,
  ) : { #ok; #err : Text } {
    switch (employees.get(employeeId)) {
      case null { #err("Employee not found") };
      case (?emp) {
        let updated : Types.PortalEmployee = { emp with isActive = false };
        employees.add(employeeId, updated);
        #ok
      };
    }
  };

  public func listEmployees(
    employees : EmpMap,
    companyId : Text,
  ) : [Types.PortalEmployee] {
    employees.values().filter(func(e) { e.companyId == companyId }).toArray()
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  public func createTask(
    tasks  : TaskMap,
    nextId : NextIdRef,
    input  : Types.CreateTaskInput,
    now    : Int,
  ) : Types.PortalTask {
    let id = genId("TASK", nextId.value);
    nextId.value += 1;
    let task : Types.PortalTask = {
      id;
      title       = input.title;
      description = input.description;
      assignedTo  = input.assignedTo;
      priority    = input.priority;
      status      = #pending;
      dueDate     = input.dueDate;
      fileUrl     = input.fileUrl;
      createdBy   = input.createdBy;
      companyId   = input.companyId;
      createdAt   = now;
      updatedAt   = now;
    };
    tasks.add(id, task);
    task
  };

  public func updateTask(
    tasks       : TaskMap,
    id          : Text,
    title       : ?Text,
    description : ?Text,
    assignedTo  : ?Text,
    priority    : ?Types.TaskPriority,
    dueDate     : ?Int,
    fileUrl     : ?Text,
    now         : Int,
  ) : { #ok : Types.PortalTask; #err : Text } {
    switch (tasks.get(id)) {
      case null { #err("Task not found") };
      case (?task) {
        let updated : Types.PortalTask = {
          task with
          title       = switch (title)       { case (?v) v; case null task.title };
          description = switch (description) { case (?v) v; case null task.description };
          assignedTo  = switch (assignedTo)  { case (?v) v; case null task.assignedTo };
          priority    = switch (priority)    { case (?v) v; case null task.priority };
          dueDate     = switch (dueDate)     { case (?v) v; case null task.dueDate };
          fileUrl     = switch (fileUrl)     { case (?v) ?v; case null task.fileUrl };
          updatedAt   = now;
        };
        tasks.add(id, updated);
        #ok updated
      };
    }
  };

  public func updateTaskStatus(
    tasks  : TaskMap,
    id     : Text,
    status : Types.TaskStatus,
    now    : Int,
  ) : { #ok : Types.PortalTask; #err : Text } {
    switch (tasks.get(id)) {
      case null { #err("Task not found") };
      case (?task) {
        let updated : Types.PortalTask = { task with status; updatedAt = now };
        tasks.add(id, updated);
        #ok updated
      };
    }
  };

  public func deleteTask(
    tasks : TaskMap,
    id    : Text,
  ) : { #ok; #err : Text } {
    switch (tasks.get(id)) {
      case null { #err("Task not found") };
      case (?_) {
        tasks.remove(id);
        #ok
      };
    }
  };

  public func listTasksForAdmin(
    tasks     : TaskMap,
    companyId : Text,
  ) : [Types.PortalTask] {
    let arr = tasks.values().filter(func(t) { t.companyId == companyId }).toArray();
    arr.sort(func(a : Types.PortalTask, b : Types.PortalTask) : { #less; #equal; #greater } {
      if (b.createdAt > a.createdAt) #less
      else if (b.createdAt < a.createdAt) #greater
      else #equal
    })
  };

  public func listTasksForEmployee(
    tasks      : TaskMap,
    companyId  : Text,
    employeeId : Text,
  ) : [Types.PortalTask] {
    let arr = tasks.values().filter(func(t) {
      t.companyId == companyId and t.assignedTo == employeeId
    }).toArray();
    arr.sort(func(a : Types.PortalTask, b : Types.PortalTask) : { #less; #equal; #greater } {
      if (a.dueDate < b.dueDate) #less
      else if (a.dueDate > b.dueDate) #greater
      else #equal
    })
  };

  // ── Dashboard layout ──────────────────────────────────────────────────────
  public func getDashboardLayout(
    layouts    : LayoutMap,
    adminEmail : Text,
  ) : ?Types.DashboardLayout {
    layouts.get(adminEmail)
  };

  public func saveDashboardLayout(
    layouts      : LayoutMap,
    adminEmail   : Text,
    widgetConfig : Text,
    now          : Int,
  ) : Types.DashboardLayout {
    let layout : Types.DashboardLayout = { adminEmail; widgetConfig; updatedAt = now };
    layouts.add(adminEmail, layout);
    layout
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  public func createNotification(
    notifs : NotifMap,
    nextId : NextIdRef,
    input  : Types.CreateNotificationInput,
    now    : Int,
  ) : Types.AdminNotification {
    let id = genId("NOTIF", nextId.value);
    nextId.value += 1;
    let notif : Types.AdminNotification = {
      id;
      companyId        = input.companyId;
      title            = input.title;
      message          = input.message;
      targetEmployeeId = input.targetEmployeeId;
      readBy           = [];
      createdAt        = now;
    };
    notifs.add(id, notif);
    notif
  };

  public func listNotificationsForEmployee(
    notifs     : NotifMap,
    companyId  : Text,
    employeeId : Text,
  ) : [Types.AdminNotification] {
    let arr = notifs.values().filter(func(n) {
      n.companyId == companyId and (
        switch (n.targetEmployeeId) {
          case null    true;
          case (?eid)  eid == employeeId;
        }
      )
    }).toArray();
    arr.sort(func(a : Types.AdminNotification, b : Types.AdminNotification) : { #less; #equal; #greater } {
      if (b.createdAt > a.createdAt) #less
      else if (b.createdAt < a.createdAt) #greater
      else #equal
    })
  };

  public func markNotificationRead(
    notifs     : NotifMap,
    id         : Text,
    employeeId : Text,
  ) : { #ok; #err : Text } {
    switch (notifs.get(id)) {
      case null { #err("Notification not found") };
      case (?notif) {
        // Only add if not already in readBy
        let alreadyRead = notif.readBy.any(func(eid) { eid == employeeId });
        if (alreadyRead) return #ok;
        let updated : Types.AdminNotification = {
          notif with readBy = notif.readBy.concat([employeeId]);
        };
        notifs.add(id, updated);
        #ok
      };
    }
  };
};
