// Re-export core backend types
export type {
  OrgSummary,
  OrgRole,
  UserProfile,
  OrgId,
  Category,
  CategoryId,
  Product,
  ProductId,
  CreateProductInput,
  UpdateProductInput,
  BulkImportResult,
  BulkImportError,
  GstReturn,
  GstReturnId,
  Gstr1Entry,
  Gstr3bEntry,
  FilingPeriod,
  FilingStatus,
  PortalType,
  PortalApiKeyInfo,
  SyncResult,
  SyncRecord,
  SyncStatus,
  LeadSource,
  LeadStatus,
  ExtendedLead,
  ExtendedLeadInput,
  CsvLeadRow,
  ImportResult,
  RowError,
  OrgAddress,
  OrgContactPerson,
  OrgType,
  Org,
  OrgSubscription,
  PlanTier,
  SubscriptionStatus,
  CreateCategoryInput,
  UpdateCategoryInput,
  Contact,
  ContactId,
  // Shipment / Logistics types
  Shipment,
  CreateShipmentInput,
  UpdateShipmentInput,
  TrackingInfo,
  TrackingEvent,
  // GST extended types
  GstRefundRequest,
  CreateRefundRequestInput,
  // Notification types
  Notification,
  NotifType,
  NotificationId,
  // Purchase types
  PurchaseOrder,
  PurchaseBill,
  PurchaseCreditNote,
  PurchaseDebitNote,
  PurchaseReturn,
  SupplierPayment,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  CreatePurchaseBillInput,
  UpdatePurchaseBillInput,
  CreatePurchaseReturnInput,
  CreateSupplierPaymentInput,
  // Sales types
  SalesOrder,
  Quotation,
  SaleDebitNote,
  SaleCreditNote,
  SaleReturn,
  CustomerReceipt,
  PosTransaction,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  CreateQuotationInput,
  UpdateQuotationInput,
  CreateSaleReturnInput,
  CreateReceiptInput,
  CreatePosTransactionInput,
  // Inventory master
  ItemMaster,
  UnitOfMeasure,
  StockLevel,
  ItemAttributeDef,
  ItemAttribute_,
  CreateItemMasterInput,
  UpdateItemMasterInput,
  CreateUomInput,
  UpdateStockLevelInput,
  CreateItemAttributeInput,
  // Roles & permissions
  Role,
  Permission,
  UserRoleAssignment,
  CreateRoleInput,
  UpdateRoleInput,
  SetPermissionsInput,
  AssignRoleInput,
  // Configuration
  OrgConfiguration,
  UpdateOrgConfigurationInput,
  // Location & group
  Location,
  Group_,
  CreateLocationInput,
  UpdateLocationInput,
  CreateGroupInput,
  UpdateGroupInput,
  // Incentive
  IncentiveScheme,
  CreateIncentiveSchemeInput,
  UpdateIncentiveSchemeInput,
} from "@/backend";

// Re-export enums (values, not just types)
export {
  ShipmentStatus,
  CourierProvider,
  AttributeType,
  BillStatus,
  NoteStatus,
  PoStatus,
  QuoteStatus,
  ReturnStatus,
  RewardType,
  SoStatus,
  TargetMetric,
} from "@/backend";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type RequiredPlan = "pro" | "enterprise";

/** Shipment filters passed to useShipments */
export interface ShipmentFilters {
  status?: import("@/backend").ShipmentStatus;
  fromDate?: bigint;
  toDate?: bigint;
}

// ─── ERP Manufacturing local types ───────────────────────────────────────────
export type {
  ErpStatus,
  ErpPriority,
  BillOfMaterial,
  WorkOrder,
  ProductionPlan,
  ManufacturingOrder,
  RawMaterialRequisition,
  ShopFloorControl,
  QualityControl,
  FinishedGood,
  ScrapRecord,
  Machine,
  RoutingOperation,
  CostOfProduction,
} from "@/hooks/useERP";

// ─── Dashboard types ──────────────────────────────────────────────────────────
export type {
  DashboardBackground,
  DashboardReportWidget,
  WidgetSize,
  WidgetColor,
} from "@/hooks/useAiChatbot";

// ─── HR Portal types ──────────────────────────────────────────────────────────
export type {
  Employee,
  Attendance,
  SalarySlip,
  Payroll,
  PfEsiConfig,
  Overtime,
  Voucher,
  Advance,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateAttendanceInput,
  UpdateAttendanceInput,
  CreateSlipInput,
  UpdateSlipInput,
  CreatePayrollInput,
  UpsertPfEsiInput,
  CreateOvertimeInput,
  CreateVoucherInput,
  CreateAdvanceInput,
  UpdateAdvanceInput,
} from "@/hooks/useHR";

export {
  EmployeeStatus,
  AttendanceType,
  SlipStatus,
  PayrollStatus,
  VoucherType,
  VoucherStatus__1,
  AdvanceStatus,
} from "@/hooks/useHR";
