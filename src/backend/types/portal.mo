module {
  // ── Roles ───────────────────────────────────────────────────────────────────
  public type PortalRole = { #portalAdmin; #portalEmployee };

  // ── Session types (returned from login — shared-safe) ────────────────────
  public type PortalAdminSession = {
    email      : Text;
    companyId  : Text;
    adminName  : Text;
    logoUrl    : ?Text;
    role       : PortalRole;
  };

  public type PortalEmployeeSession = {
    employeeId : Text;
    name       : Text;
    companyId  : Text;
    role       : PortalRole;
  };

  // ── Registration entities ─────────────────────────────────────────────────
  public type PortalCompany = {
    id          : Text;
    name        : Text;
    companyType : Text;          // pvtLtd | llp | partnership | soleProprietor | other
    gst         : ?Text;
    industry    : Text;
    website     : ?Text;
    street      : Text;
    city        : Text;
    state       : Text;
    pin         : Text;
    logoUrl     : ?Text;
    adminEmail  : Text;
    adminName   : Text;
    adminDesignation : Text;
    adminPhone  : Text;
    passwordHash : Text;
    createdAt   : Int;
  };

  public type PortalGroup = {
    id          : Text;
    name        : Text;
    groupType   : Text;          // society | ngo | club | department | other
    description : Text;
    headName    : Text;
    contactEmail : Text;
    phone       : Text;
    passwordHash : Text;
    createdAt   : Int;
  };

  public type PortalIndividual = {
    id           : Text;
    fullName     : Text;
    email        : Text;
    phone        : Text;
    passwordHash : Text;
    profilePhotoUrl : ?Text;
    createdAt    : Int;
  };

  // ── Portal Employee (managed by admin) ───────────────────────────────────
  public type PortalEmployee = {
    employeeId        : Text;    // EMP-XXXX
    name              : Text;
    designation       : Text;
    department        : Text;
    email             : Text;
    passwordHash      : Text;
    companyId         : Text;
    modulePermissions : [(Text, Bool)];
    isActive          : Bool;
    createdAt         : Int;
  };

  // ── Task ─────────────────────────────────────────────────────────────────
  public type TaskPriority = { #high; #medium; #low };
  public type TaskStatus   = { #pending; #inProgress; #completed };

  public type PortalTask = {
    id          : Text;
    title       : Text;
    description : Text;
    assignedTo  : Text;   // employeeId
    priority    : TaskPriority;
    status      : TaskStatus;
    dueDate     : Int;    // epoch ms
    fileUrl     : ?Text;
    createdBy   : Text;   // adminEmail
    companyId   : Text;
    createdAt   : Int;
    updatedAt   : Int;
  };

  // ── Dashboard layout ──────────────────────────────────────────────────────
  public type DashboardLayout = {
    adminEmail   : Text;
    widgetConfig : Text;  // JSON string
    updatedAt    : Int;
  };

  // ── Admin notification ────────────────────────────────────────────────────
  public type AdminNotification = {
    id               : Text;
    companyId        : Text;
    title            : Text;
    message          : Text;
    targetEmployeeId : ?Text;   // null = broadcast
    readBy           : [Text];  // employeeIds who have read it
    createdAt        : Int;
  };

  // ── Input record types (used in public API) ───────────────────────────────
  public type RegisterCompanyInput = {
    name             : Text;
    companyType      : Text;
    gst              : ?Text;
    industry         : Text;
    website          : ?Text;
    street           : Text;
    city             : Text;
    state            : Text;
    pin              : Text;
    logoUrl          : ?Text;
    adminName        : Text;
    adminDesignation : Text;
    adminEmail       : Text;
    adminPhone       : Text;
    password         : Text;
  };

  public type RegisterGroupInput = {
    name         : Text;
    groupType    : Text;
    description  : Text;
    headName     : Text;
    contactEmail : Text;
    phone        : Text;
    password     : Text;
  };

  public type RegisterIndividualInput = {
    fullName        : Text;
    email           : Text;
    phone           : Text;
    password        : Text;
    profilePhotoUrl : ?Text;
  };

  public type CreateEmployeeInput = {
    name              : Text;
    designation       : Text;
    department        : Text;
    email             : Text;
    password          : Text;
    companyId         : Text;
    modulePermissions : [(Text, Bool)];
  };

  public type CreateTaskInput = {
    title       : Text;
    description : Text;
    assignedTo  : Text;
    priority    : TaskPriority;
    dueDate     : Int;
    fileUrl     : ?Text;
    companyId   : Text;
    createdBy   : Text;
  };

  public type CreateNotificationInput = {
    companyId        : Text;
    title            : Text;
    message          : Text;
    targetEmployeeId : ?Text;
  };
};
