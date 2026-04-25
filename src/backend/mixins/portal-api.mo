import Time    "mo:core/Time";
import PortalLib "../lib/portal";
import Types   "../types/portal";

mixin (
  portalCompanies   : PortalLib.CompanyMap,
  portalGroups      : PortalLib.GroupMap,
  portalIndividuals : PortalLib.IndividualMap,
  portalEmployees   : PortalLib.EmpMap,
  portalTasks       : PortalLib.TaskMap,
  portalLayouts     : PortalLib.LayoutMap,
  portalNotifs      : PortalLib.NotifMap,
  nextPortalCompId  : PortalLib.NextIdRef,
  nextPortalGrpId   : PortalLib.NextIdRef,
  nextPortalIndId   : PortalLib.NextIdRef,
  nextPortalEmpId   : PortalLib.NextIdRef,
  nextPortalTaskId  : PortalLib.NextIdRef,
  nextPortalNotifId : PortalLib.NextIdRef,
) {

  // ── Registration ──────────────────────────────────────────────────────────

  public func registerPortalCompany(
    input : Types.RegisterCompanyInput,
  ) : async { #ok : Types.PortalAdminSession; #err : Text } {
    PortalLib.registerCompany(portalCompanies, nextPortalCompId, input, Time.now())
  };

  public func registerPortalGroup(
    input : Types.RegisterGroupInput,
  ) : async { #ok : Text; #err : Text } {
    PortalLib.registerGroup(portalGroups, nextPortalGrpId, input, Time.now())
  };

  public func registerPortalIndividual(
    input : Types.RegisterIndividualInput,
  ) : async { #ok : Text; #err : Text } {
    PortalLib.registerIndividual(portalIndividuals, nextPortalIndId, input, Time.now())
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  public func loginPortalAdmin(
    email    : Text,
    password : Text,
  ) : async { #ok : Types.PortalAdminSession; #err : Text } {
    PortalLib.loginAdmin(portalCompanies, email, password)
  };

  public func loginPortalEmployee(
    employeeId : Text,
    password   : Text,
  ) : async { #ok : Types.PortalEmployeeSession; #err : Text } {
    PortalLib.loginEmployee(portalEmployees, employeeId, password)
  };

  // ── Employee management ───────────────────────────────────────────────────

  public func createPortalEmployee(
    input : Types.CreateEmployeeInput,
  ) : async { #ok : Types.PortalEmployee; #err : Text } {
    PortalLib.createEmployee(portalEmployees, nextPortalEmpId, input, Time.now())
  };

  public func updatePortalEmployee(
    employeeId        : Text,
    name              : ?Text,
    designation       : ?Text,
    department        : ?Text,
    modulePermissions : ?[(Text, Bool)],
  ) : async { #ok : Types.PortalEmployee; #err : Text } {
    PortalLib.updateEmployee(portalEmployees, employeeId, name, designation, department, modulePermissions, Time.now())
  };

  public func deactivatePortalEmployee(
    employeeId : Text,
  ) : async { #ok; #err : Text } {
    PortalLib.deactivateEmployee(portalEmployees, employeeId)
  };

  public query func listPortalEmployees(
    companyId : Text,
  ) : async [Types.PortalEmployee] {
    PortalLib.listEmployees(portalEmployees, companyId)
  };

  // ── Task management ───────────────────────────────────────────────────────

  public func createPortalTask(
    input : Types.CreateTaskInput,
  ) : async Types.PortalTask {
    PortalLib.createTask(portalTasks, nextPortalTaskId, input, Time.now())
  };

  public func updatePortalTask(
    id          : Text,
    title       : ?Text,
    description : ?Text,
    assignedTo  : ?Text,
    priority    : ?Types.TaskPriority,
    dueDate     : ?Int,
    fileUrl     : ?Text,
  ) : async { #ok : Types.PortalTask; #err : Text } {
    PortalLib.updateTask(portalTasks, id, title, description, assignedTo, priority, dueDate, fileUrl, Time.now())
  };

  public func updatePortalTaskStatus(
    id     : Text,
    status : Types.TaskStatus,
  ) : async { #ok : Types.PortalTask; #err : Text } {
    PortalLib.updateTaskStatus(portalTasks, id, status, Time.now())
  };

  public func deletePortalTask(
    id : Text,
  ) : async { #ok; #err : Text } {
    PortalLib.deleteTask(portalTasks, id)
  };

  /// Admin: returns all tasks for the company.
  /// Employee: pass employeeId to filter to own tasks.
  public query func listPortalTasks(
    companyId  : Text,
    employeeId : ?Text,
  ) : async [Types.PortalTask] {
    switch (employeeId) {
      case null     PortalLib.listTasksForAdmin(portalTasks, companyId);
      case (?empId) PortalLib.listTasksForEmployee(portalTasks, companyId, empId);
    }
  };

  // ── Dashboard layout ──────────────────────────────────────────────────────

  public query func getPortalDashboardLayout(
    adminEmail : Text,
  ) : async ?Types.DashboardLayout {
    PortalLib.getDashboardLayout(portalLayouts, adminEmail)
  };

  public func savePortalDashboardLayout(
    adminEmail   : Text,
    widgetConfig : Text,
  ) : async Types.DashboardLayout {
    PortalLib.saveDashboardLayout(portalLayouts, adminEmail, widgetConfig, Time.now())
  };

  // ── Admin notifications ───────────────────────────────────────────────────

  public func createAdminNotification(
    input : Types.CreateNotificationInput,
  ) : async Types.AdminNotification {
    PortalLib.createNotification(portalNotifs, nextPortalNotifId, input, Time.now())
  };

  public query func listAdminNotifications(
    companyId  : Text,
    employeeId : Text,
  ) : async [Types.AdminNotification] {
    PortalLib.listNotificationsForEmployee(portalNotifs, companyId, employeeId)
  };

  public func markPortalNotificationRead(
    id         : Text,
    employeeId : Text,
  ) : async { #ok; #err : Text } {
    PortalLib.markNotificationRead(portalNotifs, id, employeeId)
  };

};
