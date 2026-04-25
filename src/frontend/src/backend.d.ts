import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CategoryExpense {
    category: TransactionCategory;
    amount: bigint;
}
export interface CreateAttendanceInput {
    totalHours: number;
    date: string;
    punchOut?: string;
    attendanceType: AttendanceType;
    employeeId: bigint;
    punchIn?: string;
    notes: string;
}
export interface UpdateProductionPlanInput {
    id: ProductionPlanId;
    status: string;
    period: string;
    targetQty: number;
    enabled: boolean;
    actualQty: number;
    workOrderIds: Array<WorkOrderId>;
}
export interface UpdateRequisitionInput {
    id: RequisitionId;
    status: string;
    approvedBy: string;
    moId: ManufacturingOrderId;
    enabled: boolean;
    items: Array<RequisitionItem>;
    requestedBy: string;
}
export interface TrafficEvent {
    id: string;
    referrer: string;
    orgId: string;
    userId: string;
    page: string;
    sourceType: TrafficSource;
    timestamp: bigint;
    sessionId: string;
}
export type ShopFloorId = bigint;
export interface FinanceCategory {
    id: string;
    categoryType: FinanceCategoryType;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    description: string;
    isActive: boolean;
    parentId?: string;
}
export interface MonthlyRevenue {
    month: bigint;
    revenue: bigint;
    expenses: bigint;
    year: bigint;
}
export interface OrgMember {
    principal: Principal;
    joinedAt: Timestamp;
    role: OrgRole;
    invitedBy?: Principal;
}
export interface LeadInput {
    status: LeadStatus;
    contactId: ContactId;
}
export interface Lead {
    id: LeadId;
    status: LeadStatus;
    orgId: OrgId;
    createdAt: Timestamp;
    createdBy: Principal;
    score: bigint;
    updatedAt: Timestamp;
    contactId: ContactId;
}
export interface Quotation {
    id: bigint;
    customerName: string;
    status: QuoteStatus;
    lineItems: Array<LineItem>;
    total: number;
    orgId: OrgId;
    createdAt: Timestamp;
    taxTotal: number;
    quoteNumber: string;
    notes: string;
    customerId: bigint;
    validUntil: Timestamp;
    subtotal: number;
}
export interface PipelineSummary {
    stages: Array<StageSummary>;
    averageDealSize: bigint;
    winRate: bigint;
}
export interface SaleCreditNote {
    id: bigint;
    status: NoteStatus;
    customer: string;
    orgId: OrgId;
    creditNumber: string;
    createdAt: Timestamp;
    invoiceId: bigint;
    amount: number;
    reason: string;
}
export interface CreateRoutingOperationInput {
    costPerHour: number;
    code: string;
    name: string;
    description: string;
    machineId: MachineId;
    standardTime: number;
    sequence: bigint;
}
export interface SetPermissionsInput {
    roleName: string;
    screen: string;
    canEdit: boolean;
    canView: boolean;
    canDelete: boolean;
    module: string;
    roleId: bigint;
    canCreate: boolean;
}
export interface HsnSacFilter {
    isActive?: boolean;
    codeType?: HsnSacCodeType;
    category?: string;
}
export interface UnitOfMeasure {
    id: bigint;
    baseUnit: string;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    conversionFactor: number;
    symbol: string;
}
export type DealId = bigint;
export interface CreatePosTransactionInput {
    customerName?: string;
    paymentMode: PaymentMode__1;
    customerId?: bigint;
    items: Array<PosItem>;
}
export interface UpdateWorkOrderInput {
    id: WorkOrderId;
    status: WorkOrderStatus;
    plannedEnd: Timestamp;
    enabled: boolean;
    notes: string;
    quantity: number;
    plannedStart: Timestamp;
    bomId: BomId;
    actualEnd?: Timestamp;
    actualStart?: Timestamp;
}
export type RoutingOperationId = bigint;
export type MachineId = bigint;
export interface CreateTaskInput {
    title: string;
    assignedTo: string;
    createdBy: string;
    dueDate: bigint;
    description: string;
    priority: TaskPriority;
    fileUrl?: string;
    companyId: string;
}
export interface CreateEmployeeInput__1 {
    password: string;
    name: string;
    designation: string;
    email: string;
    modulePermissions: Array<[string, boolean]>;
    department: string;
    companyId: string;
}
export interface BillTo {
    taxId?: string;
    name: string;
    dealId?: bigint;
    email: string;
    address?: string;
    contactId?: bigint;
}
export interface ItemAttributeDef {
    id: bigint;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    type: AttributeType;
    values: Array<string>;
}
export interface GstReturn {
    id: GstReturnId;
    status: FilingStatus;
    orgId: OrgId;
    period: FilingPeriod;
    createdAt: Timestamp;
    createdBy: Principal;
    gstr1Entries: Array<Gstr1Entry>;
    gstr3bEntry: Gstr3bEntry;
    returnType: GstReturnType;
    filedAt?: Timestamp;
}
export interface CreateRequisitionInput {
    moId: ManufacturingOrderId;
    items: Array<RequisitionItem>;
    requestedBy: string;
}
export interface CreatePurchaseReturnInput {
    supplier: string;
    items: Array<ReturnItem>;
    billId: bigint;
    reason: string;
}
export interface OrgBillingInfo {
    taxId?: string;
    name: string;
    logoUrl?: string;
    address: string;
}
export interface OrgConfiguration {
    id: bigint;
    orgId: OrgId;
    enableSerialization: boolean;
    trackInventory: boolean;
    enableBatches: boolean;
    invoiceTemplate: string;
    enableShelfLife: boolean;
    updatedAt: Timestamp;
    logoUrl: string;
    dateFormat: string;
    paymentGatewayKey: string;
    paymentGatewayType: string;
    enableBarcoding: boolean;
    currency: string;
    numberSeriesInvoice: string;
    taxAdjustment: number;
    numberSeriesPO: string;
    numberSeriesSO: string;
}
export interface CostOfProduction {
    id: CostOfProductionId;
    orgId: OrgId;
    period: string;
    moId: ManufacturingOrderId;
    createdAt: Timestamp;
    totalCost: number;
    enabled: boolean;
    labourCost: number;
    notes: string;
    scrapCost: number;
    materialCost: number;
    overheadCost: number;
}
export interface ItemMaster {
    id: bigint;
    categoryId?: bigint;
    enableSerial: boolean;
    categoryName: string;
    partNumber: string;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    rate: number;
    uomName: string;
    description: string;
    hsnCode: string;
    enableShelfLife: boolean;
    enableBatch: boolean;
    taxPct: number;
    attributes: Array<ItemAttribute_>;
    barcode: string;
    itemCode: string;
    uomId?: bigint;
}
export interface DealNote {
    id: NoteId;
    orgId: OrgId;
    createdAt: Timestamp;
    createdBy: Principal;
    text: string;
    dealId: DealId;
}
export interface CustomerReceipt {
    id: bigint;
    receiptDate: Timestamp;
    orgId: OrgId;
    createdAt: Timestamp;
    reference: string;
    invoiceId?: bigint;
    paymentMode: PaymentMode__1;
    customerId: bigint;
    amount: number;
    isAdvance: boolean;
}
export interface SalarySlip {
    da: number;
    id: bigint;
    hra: number;
    status: SlipStatus;
    month: bigint;
    otherAllowances: number;
    orgId: bigint;
    createdAt: bigint;
    year: bigint;
    netPay: number;
    tdsDeduction: number;
    employeeId: bigint;
    esiDeduction: number;
    advanceDeduction: number;
    basicSalary: number;
    pfDeduction: number;
}
export type ProductionPlanId = bigint;
export interface TrackingEvent {
    status: ShipmentStatus;
    description: string;
    timestamp: bigint;
    location?: string;
}
export interface PosTransaction {
    id: bigint;
    customerName?: string;
    total: number;
    orgId: OrgId;
    createdAt: Timestamp;
    taxTotal: number;
    paymentMode: PaymentMode__1;
    customerId?: bigint;
    items: Array<PosItem>;
    subtotal: number;
}
export interface CreateManufacturingOrderInput {
    dueDate: Timestamp;
    workOrderId: WorkOrderId;
    quantity: number;
    startDate: Timestamp;
}
export interface CreateCategoryInput {
    orgId: OrgId;
    name: string;
    description: string;
}
export interface Role {
    id: bigint;
    status: RoleStatus;
    roleName: string;
    screens: Array<string>;
    orgId: OrgId;
    createdAt: Timestamp;
    description: string;
}
export interface UpdateInvoiceInput {
    id: InvoiceId;
    lineItems: Array<LineItem__2>;
    taxPercent: number;
    dueDate: Timestamp;
    currency: string;
    notes?: string;
    billTo: BillTo;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Deal {
    id: DealId;
    closeDate?: Timestamp;
    value: bigint;
    orgId: OrgId;
    owner: Principal;
    name: string;
    createdAt: Timestamp;
    createdBy: Principal;
    updatedAt: Timestamp;
    stage: DealStage;
    contactId?: ContactId;
}
export interface SupplierPayment {
    id: bigint;
    orgId: OrgId;
    createdAt: Timestamp;
    reference: string;
    paymentDate: Timestamp;
    paymentMode: PaymentMode;
    amount: number;
    supplierId: bigint;
    billId?: bigint;
    isAdvance: boolean;
}
export type GstReturnId = bigint;
export interface CreateDebitNoteInput {
    customer: string;
    invoiceId: bigint;
    amount: number;
    reason: string;
}
export interface Org {
    id: OrgId;
    pan?: string;
    timezone: string;
    orgType: OrgType;
    name: string;
    createdAt: Timestamp;
    createdBy: Principal;
    slug: string;
    contactPerson?: OrgContactPerson;
    gstin?: string;
    address?: OrgAddress;
}
export interface InteractionNoteInput {
    kind: InteractionKind;
    occurredAt: Timestamp;
    contactId: ContactId;
    outcome: string;
}
export interface CsvLeadRow {
    source: string;
    name: string;
    email?: string;
    company?: string;
    notes: string;
    phone?: string;
}
export interface ProductionPlan {
    id: ProductionPlanId;
    status: string;
    orgId: OrgId;
    period: string;
    createdAt: Timestamp;
    targetQty: number;
    enabled: boolean;
    actualQty: number;
    workOrderIds: Array<WorkOrderId>;
}
export interface UpdateRoutingOperationInput {
    id: RoutingOperationId;
    costPerHour: number;
    code: string;
    name: string;
    description: string;
    enabled: boolean;
    machineId: MachineId;
    standardTime: number;
    sequence: bigint;
}
export interface UpdateCostOfProductionInput {
    id: CostOfProductionId;
    period: string;
    moId: ManufacturingOrderId;
    enabled: boolean;
    labourCost: number;
    notes: string;
    scrapCost: number;
    materialCost: number;
    overheadCost: number;
}
export interface RequisitionItem {
    status: ReqItemStatus;
    itemId: bigint;
    issuedQty: number;
    requiredQty: number;
}
export type RequisitionId = bigint;
export interface CreateFinanceCategoryInput {
    categoryType: FinanceCategoryType;
    name: string;
    description: string;
    isActive: boolean;
    parentId?: string;
}
export interface CreateWorkOrderInput {
    plannedEnd: Timestamp;
    notes: string;
    quantity: number;
    plannedStart: Timestamp;
    bomId: BomId;
}
export interface UpdateInventoryCategoryInput {
    id: bigint;
    name: string;
    description: string;
    isActive: boolean;
    parentId?: bigint;
}
export type ProductId = bigint;
export interface Product {
    id: ProductId;
    categoryId?: CategoryId;
    taxPercent: bigint;
    stockQty: bigint;
    partNumber: string;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    createdBy: Principal;
    rate: number;
    unit: string;
    description: string;
    hsnCode: string;
}
export interface FinishedGood {
    id: FinishedGoodId;
    status: string;
    orgId: OrgId;
    expiryDate?: Timestamp;
    moId: ManufacturingOrderId;
    createdAt: Timestamp;
    productId: bigint;
    productionDate: Timestamp;
    enabled: boolean;
    warehouseLocation: string;
    quantity: number;
    batchNo: string;
}
export interface BulkImportError {
    message: string;
    index: bigint;
}
export type OrgId = bigint;
export interface UpdateItemMasterInput {
    id: bigint;
    categoryId?: bigint;
    enableSerial: boolean;
    categoryName: string;
    partNumber: string;
    name: string;
    rate: number;
    uomName: string;
    description: string;
    hsnCode: string;
    enableShelfLife: boolean;
    enableBatch: boolean;
    taxPct: number;
    attributes: Array<ItemAttribute_>;
    barcode: string;
    itemCode: string;
    uomId?: bigint;
}
export interface UpsertPfEsiInput {
    insurancePremiumPerEmployee: number;
    esiRate: number;
    pfEmployerRate: number;
    pfEmployeeRate: number;
    effectiveFrom: string;
}
export interface CreatePurchaseBillInput {
    lineItems: Array<LineItem>;
    supplierName: string;
    poId?: bigint;
    dueDate: Timestamp;
    amountPaid: number;
    notes: string;
    supplierId: bigint;
}
export interface UpdateOrgConfigurationInput {
    enableSerialization: boolean;
    trackInventory: boolean;
    enableBatches: boolean;
    invoiceTemplate: string;
    enableShelfLife: boolean;
    logoUrl: string;
    dateFormat: string;
    paymentGatewayKey: string;
    paymentGatewayType: string;
    enableBarcoding: boolean;
    currency: string;
    numberSeriesInvoice: string;
    taxAdjustment: number;
    numberSeriesPO: string;
    numberSeriesSO: string;
}
export interface CreateInventoryCategoryInput {
    name: string;
    description: string;
    isActive: boolean;
    parentId?: bigint;
}
export interface Permission {
    id: bigint;
    roleName: string;
    orgId: OrgId;
    screen: string;
    createdAt: Timestamp;
    canEdit: boolean;
    canView: boolean;
    canDelete: boolean;
    module: string;
    roleId: bigint;
    canCreate: boolean;
}
export interface CreateItemAttributeInput {
    name: string;
    type: AttributeType;
    values: Array<string>;
}
export interface TransactionInput {
    date: Timestamp;
    description: string;
    category: TransactionCategory;
    amount: bigint;
}
export interface TransactionFilter {
    reconciled?: boolean;
    toDate?: Timestamp;
    fromDate?: Timestamp;
    category?: TransactionCategory;
}
export interface ContactInput {
    name: string;
    tags: Array<string>;
    email?: string;
    company?: string;
    phone?: string;
}
export interface AssignRoleInput {
    userId: Principal;
    roleId: bigint;
}
export interface HsnSacCode {
    id: string;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    description: string;
    hsnCode?: string;
    isActive: boolean;
    codeType: HsnSacCodeType;
    updatedAt: Timestamp;
    sacCode?: string;
    category: string;
}
export interface InvoiceView {
    id: InvoiceId;
    status: InvoiceStatus;
    lineItems: Array<LineItem__2>;
    orgInfo: OrgBillingInfo;
    taxPercent: number;
    orgId: OrgId;
    createdAt: Timestamp;
    createdBy: Principal;
    dueDate: Timestamp;
    sentAt?: Timestamp;
    invoiceNumber: string;
    currency: string;
    notes?: string;
    stripePaymentIntentId?: string;
    stripeSessionId?: string;
    stripePaymentLinkId?: string;
    paidAt?: Timestamp;
    billTo: BillTo;
}
export interface RegisterGroupInput {
    headName: string;
    password: string;
    name: string;
    description: string;
    contactEmail: string;
    phone: string;
    groupType: string;
}
export interface UpdateMachineInput {
    id: MachineId;
    status: MachineStatus;
    code: string;
    lastMaintenance?: Timestamp;
    name: string;
    enabled: boolean;
    capacityUnit: string;
    capacity: number;
    location: string;
    machineType: string;
}
export type ScrapRecordId = bigint;
export interface PortalEmployee {
    name: string;
    designation: string;
    createdAt: bigint;
    isActive: boolean;
    email: string;
    employeeId: string;
    modulePermissions: Array<[string, boolean]>;
    passwordHash: string;
    department: string;
    companyId: string;
}
export interface PfEsiConfig {
    id: bigint;
    insurancePremiumPerEmployee: number;
    esiRate: number;
    orgId: bigint;
    createdAt: bigint;
    pfEmployerRate: number;
    pfEmployeeRate: number;
    effectiveFrom: string;
}
export interface Group_ {
    id: bigint;
    status: GroupStatus;
    parentGroup?: bigint;
    orgId: OrgId;
    createdAt: Timestamp;
    description: string;
    groupName: string;
}
export interface UserProfile {
    name: string;
    email?: string;
}
export interface FinanceCategoryFilter {
    categoryType?: FinanceCategoryType;
    isActive?: boolean;
    parentId?: string;
}
export interface CreateQualityControlInput {
    result: QcResult;
    inspectionDate: Timestamp;
    failQty: number;
    moId: ManufacturingOrderId;
    passQty: number;
    defects: Array<string>;
    notes: string;
    inspector: string;
}
export type Timestamp = bigint;
export interface UpdateQuotationInput {
    id: bigint;
    customerName: string;
    lineItems: Array<LineItem>;
    notes: string;
    customerId: bigint;
    validUntil: Timestamp;
}
export interface CreateIncentiveSchemeInput {
    rewardValue: number;
    effectiveTo?: Timestamp;
    schemeName: string;
    rewardType: RewardType;
    category: string;
    targetValue: number;
    targetMetric: TargetMetric;
    effectiveFrom: Timestamp;
}
export interface UpdateEmployeeInput {
    id: bigint;
    status: EmployeeStatus;
    employeeCode: string;
    name: string;
    designation: string;
    joiningDate: string;
    email: string;
    salaryGrade: string;
    enabled: boolean;
    phone: string;
    department: string;
}
export interface ShopFloorControl {
    id: ShopFloorId;
    startTime: Timestamp;
    status: string;
    endTime?: Timestamp;
    orgId: OrgId;
    createdAt: Timestamp;
    workOrderId: WorkOrderId;
    operatorName: string;
    enabled: boolean;
    operationId: RoutingOperationId;
    notes: string;
    quantity: number;
    machineId: MachineId;
}
export interface CreateItemMasterInput {
    categoryId?: bigint;
    enableSerial: boolean;
    categoryName: string;
    partNumber: string;
    name: string;
    rate: number;
    uomName: string;
    description: string;
    hsnCode: string;
    enableShelfLife: boolean;
    enableBatch: boolean;
    taxPct: number;
    attributes: Array<ItemAttribute_>;
    barcode: string;
    itemCode: string;
    uomId?: bigint;
}
export interface ImportResult {
    errors: Array<RowError>;
    success: bigint;
}
export interface MonthlySummary {
    net: bigint;
    month: bigint;
    expenses: bigint;
    year: bigint;
    income: bigint;
}
export interface BillOfMaterial {
    id: BomId;
    status: string;
    orgId: OrgId;
    createdAt: Timestamp;
    components: Array<BomComponent>;
    productName: string;
    enabled: boolean;
    revision: string;
}
export interface CreateUomInput {
    baseUnit: string;
    name: string;
    conversionFactor: number;
    symbol: string;
}
export interface ManufacturingOrder {
    id: ManufacturingOrderId;
    status: MoStatus;
    orgId: OrgId;
    createdAt: Timestamp;
    dueDate: Timestamp;
    workOrderId: WorkOrderId;
    enabled: boolean;
    quantity: number;
    completedQty: number;
    startDate: Timestamp;
}
export interface InventoryCategory {
    id: bigint;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    description: string;
    isActive: boolean;
    parentId?: bigint;
}
export interface UpdateLocationInput {
    id: bigint;
    email: string;
    state: string;
    locationCode: string;
    locationName: string;
}
export interface SyncRecord {
    status: Variant_success_failed;
    duplicates: bigint;
    newLeads: bigint;
    timestamp: Timestamp;
    errorMsg?: string;
    portal: PortalType;
}
export interface Category {
    id: CategoryId;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    createdBy: Principal;
    description: string;
}
export type NoteId = bigint;
export interface Attendance {
    id: bigint;
    totalHours: number;
    orgId: bigint;
    date: string;
    punchOut?: string;
    createdAt: bigint;
    attendanceType: AttendanceType;
    employeeId: bigint;
    punchIn?: string;
    notes: string;
}
export interface CreateCreditNoteInput__1 {
    supplier: string;
    amount: number;
    billId: bigint;
    reason: string;
}
export interface PurchaseDebitNote {
    id: bigint;
    status: NoteStatus;
    debitNumber: string;
    orgId: OrgId;
    supplier: string;
    createdAt: Timestamp;
    amount: number;
    billId: bigint;
    reason: string;
}
export interface CreateRoleInput {
    roleName: string;
    screens: Array<string>;
    description: string;
}
export interface BulkImportResult {
    errors: Array<BulkImportError>;
    successCount: bigint;
}
export interface LineItem__2 {
    rateInCents: bigint;
    description: string;
    quantity: number;
}
export interface InteractionNote {
    id: NoteId;
    orgId: OrgId;
    kind: InteractionKind;
    createdAt: Timestamp;
    createdBy: Principal;
    occurredAt: Timestamp;
    contactId: ContactId;
    outcome: string;
}
export interface PurchaseCreditNote {
    id: bigint;
    status: NoteStatus;
    orgId: OrgId;
    creditNumber: string;
    supplier: string;
    createdAt: Timestamp;
    amount: number;
    billId: bigint;
    reason: string;
}
export type ManufacturingOrderId = bigint;
export interface UpdateFinanceCategoryInput {
    id: string;
    categoryType: FinanceCategoryType;
    name: string;
    description: string;
    isActive: boolean;
    parentId?: string;
}
export interface CreateLocationInput {
    email: string;
    state: string;
    locationCode: string;
    locationName: string;
}
export interface BomComponent {
    itemId: bigint;
    cost: number;
    unit: string;
    quantity: number;
}
export interface AdminNotification {
    id: string;
    title: string;
    createdAt: bigint;
    targetEmployeeId?: string;
    message: string;
    readBy: Array<string>;
    companyId: string;
}
export interface ScrapRecord {
    id: ScrapRecordId;
    orgId: OrgId;
    scrapReason: string;
    date: Timestamp;
    moId: ManufacturingOrderId;
    createdAt: Timestamp;
    recordedBy: string;
    enabled: boolean;
    scrapQty: number;
    scrapValue: number;
    machineId: MachineId;
}
export type ContactId = bigint;
export interface ExtendedLeadInput {
    status: LeadStatus;
    source: LeadSource;
    notes: string;
    contactId: ContactId;
}
export type LeadId = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface LineItem {
    qty: number;
    total: number;
    rate: number;
    description: string;
    taxPct: number;
}
export interface SalesOrder {
    id: bigint;
    customerName: string;
    status: SoStatus;
    lineItems: Array<LineItem>;
    total: number;
    orgId: OrgId;
    createdAt: Timestamp;
    taxTotal: number;
    soNumber: string;
    notes: string;
    customerId: bigint;
    subtotal: number;
}
export interface ExtendedLead {
    id: LeadId;
    status: LeadStatus;
    source: LeadSource;
    orgId: OrgId;
    createdAt: Timestamp;
    createdBy: Principal;
    score: bigint;
    updatedAt: Timestamp;
    notes: string;
    contactId: ContactId;
}
export interface CreateInvoiceInput {
    lineItems: Array<LineItem__2>;
    taxPercent: number;
    dueDate: Timestamp;
    currency: string;
    notes?: string;
    billTo: BillTo;
}
export interface DealStageEvent {
    changedAt: Timestamp;
    changedBy: Principal;
    orgId: OrgId;
    fromStage?: DealStage;
    toStage: DealStage;
    dealId: DealId;
}
export interface LedgerEntry {
    transaction: Transaction;
    runningBalance: bigint;
}
export interface UpdateManufacturingOrderInput {
    id: ManufacturingOrderId;
    status: MoStatus;
    dueDate: Timestamp;
    workOrderId: WorkOrderId;
    enabled: boolean;
    quantity: number;
    completedQty: number;
    startDate: Timestamp;
}
export type ReconciliationStatus = {
    __kind__: "reconciled";
    reconciled: string;
} | {
    __kind__: "unreconciled";
    unreconciled: null;
};
export type BomId = bigint;
export interface UpdateGroupInput {
    id: bigint;
    status: GroupStatus;
    parentGroup?: bigint;
    description: string;
    groupName: string;
}
export interface SyncResult {
    errors: Array<string>;
    duplicates: bigint;
    newLeads: bigint;
    timestamp: Timestamp;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface FinanceDashboard {
    mrr: bigint;
    budgetRemaining: bigint;
    budgetUtilizationPct: bigint;
    expensesByCategory: Array<CategoryExpense>;
    revenueMTD: bigint;
    revenueGrowthPct: bigint;
    budgetSpent: bigint;
    budgetAllocated: bigint;
    monthlyRevenueTrend: Array<MonthlyRevenue>;
}
export interface UpdateFinishedGoodInput {
    id: FinishedGoodId;
    status: string;
    expiryDate?: Timestamp;
    moId: ManufacturingOrderId;
    productId: bigint;
    productionDate: Timestamp;
    enabled: boolean;
    warehouseLocation: string;
    quantity: number;
    batchNo: string;
}
export interface CreateSlipInput {
    da: number;
    hra: number;
    month: bigint;
    otherAllowances: number;
    year: bigint;
    tdsDeduction: number;
    employeeId: bigint;
    esiDeduction: number;
    advanceDeduction: number;
    basicSalary: number;
    pfDeduction: number;
}
export interface Gstr3bEntry {
    netTax: number;
    cgstPayable: number;
    igstPayable: number;
    sgstPayable: number;
    inputTaxCredit: number;
}
export interface CreateScrapRecordInput {
    scrapReason: string;
    date: Timestamp;
    moId: ManufacturingOrderId;
    recordedBy: string;
    scrapQty: number;
    scrapValue: number;
    machineId: MachineId;
}
export interface CreateGroupInput {
    parentGroup?: bigint;
    description: string;
    groupName: string;
}
export interface RawMaterialRequisition {
    id: RequisitionId;
    status: string;
    orgId: OrgId;
    approvedBy: string;
    moId: ManufacturingOrderId;
    createdAt: Timestamp;
    enabled: boolean;
    items: Array<RequisitionItem>;
    requestedBy: string;
}
export interface PosItem {
    qty: number;
    total: number;
    name: string;
    rate: number;
    productId: string;
    taxPct: number;
}
export interface PendingInvite {
    id: bigint;
    orgId: OrgId;
    createdAt: Timestamp;
    role: OrgRole;
    invitedBy: Principal;
    email: string;
}
export interface CreateHsnSacCodeInput {
    name: string;
    description: string;
    hsnCode?: string;
    isActive: boolean;
    codeType: HsnSacCodeType;
    sacCode?: string;
    category: string;
}
export interface CreateProductInput {
    categoryId?: CategoryId;
    taxPercent: bigint;
    stockQty: bigint;
    partNumber: string;
    orgId: OrgId;
    name: string;
    rate: number;
    unit: string;
    description: string;
    hsnCode: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UpdateIncentiveSchemeInput {
    id: bigint;
    status: SchemeStatus;
    rewardValue: number;
    effectiveTo?: Timestamp;
    schemeName: string;
    rewardType: RewardType;
    category: string;
    targetValue: number;
    targetMetric: TargetMetric;
    effectiveFrom: Timestamp;
}
export interface CashFlowForecast {
    projectedBalance: bigint;
    date: Timestamp;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type NotificationId = string;
export interface Notification {
    id: NotificationId;
    title: string;
    orgId: OrgId__15;
    notifType: NotifType;
    userId: Principal;
    createdAt: bigint;
    isRead: boolean;
    message: string;
}
export type InvoiceId = bigint;
export interface DealInput {
    closeDate?: Timestamp;
    value: bigint;
    owner: Principal;
    name: string;
    stage: DealStage;
    contactId?: ContactId;
}
export interface BillingEntry {
    id: bigint;
    orgId: OrgId;
    description: string;
    stripeInvoiceId?: string;
    currency: string;
    amount: bigint;
    paidAt: Timestamp;
}
export interface CreateCreditNoteInput {
    customer: string;
    invoiceId: bigint;
    amount: number;
    reason: string;
}
export interface RowError {
    msg: string;
    row: bigint;
}
export interface UpdateStockLevelInput {
    itemId: bigint;
    quantityOnHand: number;
    locationId?: bigint;
    reorderLevel: number;
    locationName: string;
}
export interface RoutingOperation {
    id: RoutingOperationId;
    costPerHour: number;
    orgId: OrgId;
    code: string;
    name: string;
    createdAt: Timestamp;
    description: string;
    enabled: boolean;
    machineId: MachineId;
    standardTime: number;
    sequence: bigint;
}
export interface UpdateCategoryInput {
    id: CategoryId;
    orgId: OrgId;
    name: string;
    description: string;
}
export interface StageSummary {
    totalValue: bigint;
    count: bigint;
    stage: DealStage;
}
export interface GstRefundRequest {
    id: bigint;
    status: string;
    acknowledgedAt?: bigint;
    orgId: OrgId;
    period: string;
    createdAt: bigint;
    refundType: string;
    amount: number;
    reason: string;
    filedAt?: bigint;
}
export interface CreateBomInput {
    status: string;
    components: Array<BomComponent>;
    productName: string;
    revision: string;
}
export interface StripeConfig {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CreateCostOfProductionInput {
    period: string;
    moId: ManufacturingOrderId;
    labourCost: number;
    notes: string;
    scrapCost: number;
    materialCost: number;
    overheadCost: number;
}
export interface UpdateAttendanceInput {
    id: bigint;
    totalHours: number;
    date: string;
    punchOut?: string;
    attendanceType: AttendanceType;
    employeeId: bigint;
    punchIn?: string;
    notes: string;
}
export interface CreateProductionPlanInput {
    status: string;
    period: string;
    targetQty: number;
    workOrderIds: Array<WorkOrderId>;
}
export interface RegisterIndividualInput {
    password: string;
    fullName: string;
    email: string;
    profilePhotoUrl?: string;
    phone: string;
}
export interface PortalTask {
    id: string;
    status: TaskStatus;
    title: string;
    assignedTo: string;
    createdAt: bigint;
    createdBy: string;
    dueDate: bigint;
    description: string;
    updatedAt: bigint;
    priority: TaskPriority;
    fileUrl?: string;
    companyId: string;
}
export interface QualityControl {
    id: QualityControlId;
    result: QcResult;
    inspectionDate: Timestamp;
    failQty: number;
    orgId: OrgId;
    moId: ManufacturingOrderId;
    createdAt: Timestamp;
    passQty: number;
    enabled: boolean;
    defects: Array<string>;
    notes: string;
    inspector: string;
}
export interface PurchaseOrder {
    id: bigint;
    status: PoStatus;
    lineItems: Array<LineItem>;
    total: number;
    orgId: OrgId;
    supplierName: string;
    createdAt: Timestamp;
    taxTotal: number;
    notes: string;
    poNumber: string;
    supplierId: bigint;
    subtotal: number;
}
export interface PurchaseReturn {
    id: bigint;
    status: ReturnStatus;
    orgId: OrgId;
    supplier: string;
    createdAt: Timestamp;
    totalAmount: number;
    items: Array<ReturnItem>;
    returnNumber: string;
    billId: bigint;
    reason: string;
}
export interface StockLevel {
    id: bigint;
    itemId: bigint;
    orgId: OrgId;
    createdAt: Timestamp;
    quantityOnHand: number;
    locationId?: bigint;
    itemName: string;
    reorderLevel: number;
    locationName: string;
}
export interface OrgSummary {
    id: OrgId;
    timezone: string;
    name: string;
    slug: string;
    myRole: OrgRole;
}
export interface UpdateQualityControlInput {
    id: QualityControlId;
    result: QcResult;
    inspectionDate: Timestamp;
    failQty: number;
    moId: ManufacturingOrderId;
    passQty: number;
    enabled: boolean;
    defects: Array<string>;
    notes: string;
    inspector: string;
}
export interface OrgSubscription {
    status: SubscriptionStatus;
    orgId: OrgId;
    currentPeriodStart?: Timestamp;
    stripeSubscriptionId?: string;
    plan: PlanTier;
    currentPeriodEnd?: Timestamp;
    trialEnd?: Timestamp;
    stripeCustomerId?: string;
    cancelAtPeriodEnd: boolean;
}
export interface CreateSalesOrderInput {
    customerName: string;
    lineItems: Array<LineItem>;
    notes: string;
    customerId: bigint;
}
export interface CreateReceiptInput {
    receiptDate: Timestamp;
    reference: string;
    invoiceId?: bigint;
    paymentMode: PaymentMode__1;
    customerId: bigint;
    amount: number;
    isAdvance: boolean;
}
export type CategoryId = bigint;
export interface CreateShipmentInput {
    weight?: number;
    consigneePhone: string;
    consigneeAddress: string;
    trackingNo?: string;
    consigneeName: string;
    orderId?: bigint;
    transporterPhone?: string;
    courierProvider: CourierProvider;
    dimensions?: string;
    docId?: bigint;
    transporterName?: string;
}
export interface CreateSaleReturnInput {
    customer: string;
    invoiceId: bigint;
    items: Array<ReturnItem>;
    reason: string;
}
export interface CreatePayrollInput {
    month: bigint;
    year: bigint;
}
export interface Payroll {
    id: bigint;
    totalEmployees: bigint;
    status: PayrollStatus;
    month: bigint;
    totalDeductions: number;
    orgId: bigint;
    totalNetPay: number;
    createdAt: bigint;
    year: bigint;
    processedAt: bigint;
    totalGrossPay: number;
}
export interface Shipment {
    id: bigint;
    weight?: number;
    status: ShipmentStatus;
    deliveredAt?: bigint;
    consigneePhone: string;
    orgId: OrgId;
    consigneeAddress: string;
    createdAt: bigint;
    trackingNo?: string;
    consigneeName: string;
    dispatchedAt?: bigint;
    orderId?: bigint;
    updatedAt: bigint;
    transporterPhone?: string;
    courierProvider: CourierProvider;
    dimensions?: string;
    docId?: bigint;
    transporterName?: string;
}
export interface TrafficSummary {
    topPages: Array<[string, bigint]>;
    totalToday: bigint;
    internalToday: bigint;
    externalToday: bigint;
    topReferrers: Array<[string, bigint]>;
    directToday: bigint;
}
export type OrgId__15 = string;
export interface CreateShopFloorInput {
    startTime: Timestamp;
    workOrderId: WorkOrderId;
    operatorName: string;
    operationId: RoutingOperationId;
    notes: string;
    quantity: number;
    machineId: MachineId;
}
export interface DealNoteInput {
    text: string;
    dealId: DealId;
}
export interface UpdateHsnSacCodeInput {
    id: string;
    name: string;
    description: string;
    hsnCode?: string;
    isActive: boolean;
    codeType: HsnSacCodeType;
    sacCode?: string;
    category: string;
}
export interface OrgAddress {
    street: string;
    country: string;
    city: string;
    state: string;
    postal: string;
}
export type FinishedGoodId = bigint;
export interface CreateFinishedGoodInput {
    status: string;
    expiryDate?: Timestamp;
    moId: ManufacturingOrderId;
    productId: bigint;
    productionDate: Timestamp;
    warehouseLocation: string;
    quantity: number;
    batchNo: string;
}
export interface UpdatePurchaseBillInput {
    id: bigint;
    lineItems: Array<LineItem>;
    supplierName: string;
    dueDate: Timestamp;
    amountPaid: number;
    notes: string;
    supplierId: bigint;
}
export interface PortalEmployeeSession {
    name: string;
    role: PortalRole;
    employeeId: string;
    companyId: string;
}
export interface Machine {
    id: MachineId;
    status: MachineStatus;
    orgId: OrgId;
    code: string;
    lastMaintenance?: Timestamp;
    name: string;
    createdAt: Timestamp;
    enabled: boolean;
    capacityUnit: string;
    capacity: number;
    location: string;
    machineType: string;
}
export interface WorkOrder {
    id: WorkOrderId;
    status: WorkOrderStatus;
    plannedEnd: Timestamp;
    orgId: OrgId;
    createdAt: Timestamp;
    enabled: boolean;
    notes: string;
    quantity: number;
    plannedStart: Timestamp;
    bomId: BomId;
    actualEnd?: Timestamp;
    actualStart?: Timestamp;
}
export interface CreateMachineInput {
    status: MachineStatus;
    code: string;
    lastMaintenance?: Timestamp;
    name: string;
    capacityUnit: string;
    capacity: number;
    location: string;
    machineType: string;
}
export interface SaleDebitNote {
    id: bigint;
    status: NoteStatus;
    debitNumber: string;
    customer: string;
    orgId: OrgId;
    createdAt: Timestamp;
    invoiceId: bigint;
    amount: number;
    reason: string;
}
export interface CreateNotificationInput {
    title: string;
    targetEmployeeId?: string;
    message: string;
    companyId: string;
}
export interface ItemAttribute_ {
    value: string;
    name: string;
    attributeId: string;
}
export interface PortalAdminSession {
    role: PortalRole;
    email: string;
    adminName: string;
    logoUrl?: string;
    companyId: string;
}
export interface UpdatePurchaseOrderInput {
    id: bigint;
    lineItems: Array<LineItem>;
    supplierName: string;
    notes: string;
    supplierId: bigint;
}
export interface TrackingInfo {
    provider: CourierProvider;
    trackingNo?: string;
    events: Array<TrackingEvent>;
    shipmentId: bigint;
    currentStatus: ShipmentStatus;
}
export interface Location {
    id: bigint;
    orgId: OrgId;
    createdAt: Timestamp;
    email: string;
    state: string;
    locationCode: string;
    locationName: string;
}
export interface UpdateSlipInput {
    da: number;
    id: bigint;
    hra: number;
    status: SlipStatus;
    otherAllowances: number;
    tdsDeduction: number;
    esiDeduction: number;
    advanceDeduction: number;
    basicSalary: number;
    pfDeduction: number;
}
export type QualityControlId = bigint;
export interface UpdateBomInput {
    id: BomId;
    status: string;
    components: Array<BomComponent>;
    productName: string;
    enabled: boolean;
    revision: string;
}
export interface PortalApiKeyInfo {
    maskedKey: string;
    lastSynced?: Timestamp;
    syncStatus: SyncStatus;
    portal: PortalType;
}
export type WorkOrderId = bigint;
export interface UpdateScrapRecordInput {
    id: ScrapRecordId;
    scrapReason: string;
    date: Timestamp;
    moId: ManufacturingOrderId;
    recordedBy: string;
    enabled: boolean;
    scrapQty: number;
    scrapValue: number;
    machineId: MachineId;
}
export interface CreateRefundRequestInput {
    orgId: OrgId;
    period: string;
    refundType: string;
    amount: number;
    reason: string;
}
export interface CreateEmployeeInput {
    employeeCode: string;
    name: string;
    designation: string;
    joiningDate: string;
    email: string;
    salaryGrade: string;
    phone: string;
    department: string;
}
export interface UpdateProductInput {
    id: ProductId;
    categoryId?: CategoryId;
    taxPercent: bigint;
    stockQty: bigint;
    partNumber: string;
    orgId: OrgId;
    name: string;
    rate: number;
    unit: string;
    description: string;
    hsnCode: string;
}
export interface Transaction {
    id: bigint;
    orgId: OrgId;
    date: Timestamp;
    createdAt: Timestamp;
    createdBy: Principal;
    description: string;
    category: TransactionCategory;
    amount: bigint;
    reconciliation: ReconciliationStatus;
}
export interface CreateQuotationInput {
    customerName: string;
    lineItems: Array<LineItem>;
    notes: string;
    customerId: bigint;
    validUntil: Timestamp;
}
export interface PurchaseBill {
    id: bigint;
    status: BillStatus;
    lineItems: Array<LineItem>;
    total: number;
    orgId: OrgId;
    supplierName: string;
    createdAt: Timestamp;
    poId?: bigint;
    taxTotal: number;
    dueDate: Timestamp;
    amountPaid: number;
    notes: string;
    billNumber: string;
    supplierId: bigint;
    subtotal: number;
}
export interface CreateSupplierPaymentInput {
    reference: string;
    paymentDate: Timestamp;
    paymentMode: PaymentMode;
    amount: number;
    supplierId: bigint;
    billId?: bigint;
    isAdvance: boolean;
}
export interface Employee {
    id: bigint;
    status: EmployeeStatus;
    employeeCode: string;
    orgId: bigint;
    name: string;
    designation: string;
    createdAt: bigint;
    joiningDate: string;
    email: string;
    salaryGrade: string;
    enabled: boolean;
    phone: string;
    department: string;
}
export interface UpdateShopFloorInput {
    id: ShopFloorId;
    startTime: Timestamp;
    status: string;
    endTime?: Timestamp;
    workOrderId: WorkOrderId;
    operatorName: string;
    enabled: boolean;
    operationId: RoutingOperationId;
    notes: string;
    quantity: number;
    machineId: MachineId;
}
export interface Contact {
    id: ContactId;
    orgId: OrgId;
    name: string;
    createdAt: Timestamp;
    createdBy: Principal;
    tags: Array<string>;
    email?: string;
    updatedAt: Timestamp;
    company?: string;
    phone?: string;
}
export interface SaleReturn {
    id: bigint;
    status: ReturnStatus;
    customer: string;
    orgId: OrgId;
    createdAt: Timestamp;
    invoiceId: bigint;
    totalAmount: number;
    items: Array<ReturnItem>;
    returnNumber: string;
    reason: string;
}
export interface UpdateRoleInput {
    id: bigint;
    status: RoleStatus;
    roleName: string;
    screens: Array<string>;
    description: string;
}
export interface ReturnItem {
    qty: number;
    name: string;
    rate: number;
    productId: string;
}
export interface DashboardLayout {
    updatedAt: bigint;
    adminEmail: string;
    widgetConfig: string;
}
export interface UserRoleAssignment {
    id: bigint;
    roleName: string;
    assignedAt: Timestamp;
    orgId: OrgId;
    userId: Principal;
    roleId: bigint;
}
export interface Gstr1Entry {
    customerGstin?: string;
    cgst: number;
    igst: number;
    taxableValue: number;
    sgst: number;
    hsnCode: string;
    invoiceDate: Timestamp;
    invoiceNumber: string;
}
export interface UpdateShipmentInput {
    weight?: number;
    status?: ShipmentStatus;
    consigneePhone?: string;
    consigneeAddress?: string;
    trackingNo?: string;
    consigneeName?: string;
    orderId?: bigint;
    transporterPhone?: string;
    courierProvider?: CourierProvider;
    dimensions?: string;
    docId?: bigint;
    transporterName?: string;
}
export type CostOfProductionId = bigint;
export interface CreateDebitNoteInput__1 {
    supplier: string;
    amount: number;
    billId: bigint;
    reason: string;
}
export interface RegisterCompanyInput {
    gst?: string;
    pin: string;
    street: string;
    city: string;
    password: string;
    name: string;
    website?: string;
    adminName: string;
    state: string;
    logoUrl?: string;
    adminDesignation: string;
    adminEmail: string;
    companyType: string;
    industry: string;
    adminPhone: string;
}
export interface OrgContactPerson {
    name: string;
    email: string;
    phone: string;
}
export interface FilingPeriod {
    month: bigint;
    year: bigint;
}
export interface TrafficQuery {
    dateTo?: bigint;
    orgId: string;
    page?: string;
    sourceType?: TrafficSource;
    dateFrom?: bigint;
}
export interface UpdateSalesOrderInput {
    id: bigint;
    customerName: string;
    lineItems: Array<LineItem>;
    notes: string;
    customerId: bigint;
}
export interface IncentiveScheme {
    id: bigint;
    status: SchemeStatus;
    orgId: OrgId;
    rewardValue: number;
    createdAt: Timestamp;
    effectiveTo?: Timestamp;
    schemeName: string;
    rewardType: RewardType;
    category: string;
    targetValue: number;
    targetMetric: TargetMetric;
    effectiveFrom: Timestamp;
}
export interface CreatePurchaseOrderInput {
    lineItems: Array<LineItem>;
    supplierName: string;
    notes: string;
    supplierId: bigint;
}
export enum AttendanceType {
    halfDay = "halfDay",
    present = "present",
    leave = "leave",
    absent = "absent"
}
export enum AttributeType {
    list = "list",
    text = "text",
    number_ = "number"
}
export enum BillStatus {
    partially_paid = "partially_paid",
    paid = "paid",
    approved = "approved",
    overdue = "overdue",
    draft = "draft"
}
export enum ContactSortField {
    name = "name",
    createdAt = "createdAt",
    company = "company"
}
export enum CourierProvider {
    bluedart = "bluedart",
    manual = "manual",
    delhivery = "delhivery",
    fedex = "fedex"
}
export enum DealStage {
    closedWon = "closedWon",
    prospect = "prospect",
    negotiation = "negotiation",
    qualified = "qualified",
    closedLost = "closedLost"
}
export enum EmployeeStatus {
    active = "active",
    inactive = "inactive"
}
export enum FilingStatus {
    submitted = "submitted",
    acknowledged = "acknowledged",
    draft = "draft"
}
export enum FinanceCategoryType {
    expense = "expense",
    income = "income"
}
export enum GroupStatus {
    Inactive = "Inactive",
    Active = "Active"
}
export enum GstReturnType {
    gstr1 = "gstr1",
    gstr3b = "gstr3b"
}
export enum HsnSacCodeType {
    auto = "auto",
    manual = "manual"
}
export enum InteractionKind {
    other = "other",
    call = "call",
    email = "email",
    meeting = "meeting"
}
export enum InvoiceStatus {
    paid = "paid",
    sent = "sent",
    voided = "voided",
    overdue = "overdue",
    draft = "draft"
}
export enum LeadSource {
    csv = "csv",
    globallinker = "globallinker",
    tradeindia = "tradeindia",
    metaAds = "metaAds",
    websiteWebhook = "websiteWebhook",
    google = "google",
    indiamart = "indiamart",
    exportindia = "exportindia",
    manual = "manual",
    justdial = "justdial",
    facebookPage = "facebookPage"
}
export enum LeadStatus {
    new_ = "new",
    lost = "lost",
    converted = "converted",
    qualified = "qualified"
}
export enum MachineStatus {
    active = "active",
    inactive = "inactive",
    maintenance = "maintenance"
}
export enum MoStatus {
    cancelled = "cancelled",
    completed = "completed",
    released = "released",
    draft = "draft",
    inProgress = "inProgress"
}
export enum NoteStatus {
    cancelled = "cancelled",
    applied = "applied",
    approved = "approved",
    draft = "draft"
}
export enum NotifType {
    Invoice = "Invoice",
    System = "System",
    GSTFiling = "GSTFiling",
    B2BSyncNotif = "B2BSyncNotif"
}
export enum OrgRole {
    member = "member",
    admin = "admin",
    owner = "owner"
}
export enum OrgType {
    company = "company",
    individual = "individual"
}
export enum PaymentMode {
    upi = "upi",
    bank = "bank",
    cash = "cash",
    cheque = "cheque"
}
export enum PaymentMode__1 {
    upi = "upi",
    bank = "bank",
    card = "card",
    cash = "cash",
    cheque = "cheque",
    online = "online"
}
export enum PayrollStatus {
    pending = "pending",
    paid = "paid",
    processed = "processed"
}
export enum PlanTier {
    pro = "pro",
    enterprise = "enterprise",
    free = "free"
}
export enum PoStatus {
    sent = "sent",
    approved = "approved",
    draft = "draft",
    billed = "billed"
}
export enum PortalRole {
    portalAdmin = "portalAdmin",
    portalEmployee = "portalEmployee"
}
export enum PortalType {
    globallinker = "globallinker",
    tradeindia = "tradeindia",
    metaAds = "metaAds",
    websiteWebhook = "websiteWebhook",
    google = "google",
    indiamart = "indiamart",
    exportindia = "exportindia",
    justdial = "justdial",
    facebookPage = "facebookPage"
}
export enum QcResult {
    fail = "fail",
    pass = "pass"
}
export enum QuoteStatus {
    expired = "expired",
    sent = "sent",
    rejected = "rejected",
    accepted = "accepted",
    draft = "draft"
}
export enum ReqItemStatus {
    pending = "pending",
    issued = "issued",
    partial = "partial"
}
export enum ReturnStatus {
    cancelled = "cancelled",
    completed = "completed",
    approved = "approved",
    draft = "draft"
}
export enum RewardType {
    FixedAmount = "FixedAmount",
    Percentage = "Percentage"
}
export enum ShipmentStatus {
    cancelled = "cancelled",
    pending = "pending",
    outForDelivery = "outForDelivery",
    inTransit = "inTransit",
    picked = "picked",
    delivered = "delivered",
    returned = "returned"
}
export enum SlipStatus {
    paid = "paid",
    generated = "generated",
    draft = "draft"
}
export enum SoStatus {
    cancelled = "cancelled",
    invoiced = "invoiced",
    confirmed = "confirmed",
    draft = "draft"
}
export enum SubscriptionStatus {
    incomplete = "incomplete",
    active = "active",
    canceled = "canceled",
    pastDue = "pastDue",
    trialing = "trialing"
}
export enum SyncStatus {
    idle = "idle",
    syncing = "syncing",
    success = "success",
    failed = "failed"
}
export enum TargetMetric {
    Units = "Units",
    NewCustomers = "NewCustomers",
    Revenue = "Revenue"
}
export enum TaskPriority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum TaskStatus {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export enum TrafficSource {
    internal = "internal",
    direct = "direct",
    external = "external"
}
export enum TransactionCategory {
    revenue = "revenue",
    other = "other",
    equipment = "equipment",
    travel = "travel",
    software = "software",
    contractorFees = "contractorFees"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_ok_notAuthorized_notFound {
    ok = "ok",
    notAuthorized = "notAuthorized",
    notFound = "notFound"
}
export enum Variant_success_failed {
    success = "success",
    failed = "failed"
}
export enum WorkOrderStatus {
    cancelled = "cancelled",
    completed = "completed",
    planned = "planned",
    inProgress = "inProgress"
}
export interface backendInterface {
    acceptInvite(inviteId: bigint): Promise<void>;
    acknowledgeGstReturn(gstReturnId: GstReturnId, orgId: OrgId): Promise<GstReturn | null>;
    addDealNote(orgId: OrgId, input: DealNoteInput): Promise<NoteId>;
    addInteractionNote(orgId: OrgId, input: InteractionNoteInput): Promise<NoteId>;
    addTransaction(orgId: OrgId, input: TransactionInput): Promise<Transaction>;
    approvePurchaseOrder(orgId: OrgId, id: bigint): Promise<PurchaseOrder>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserRole(orgId: OrgId, input: AssignRoleInput): Promise<UserRoleAssignment>;
    bulkImportProducts(inputs: Array<CreateProductInput>): Promise<{
        __kind__: "ok";
        ok: BulkImportResult;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    }>;
    cancelInvite(inviteId: bigint): Promise<void>;
    changePlan(orgId: OrgId, newPlan: PlanTier): Promise<void>;
    checkInvoicePaymentStatus(orgId: OrgId, id: InvoiceId): Promise<string>;
    confirmSalesOrder(orgId: OrgId, id: bigint): Promise<SalesOrder>;
    confirmSubscription(orgId: OrgId, sessionId: string): Promise<void>;
    convertQuotationToSalesOrder(orgId: OrgId, quoteId: bigint): Promise<SalesOrder>;
    createAdminNotification(input: CreateNotificationInput): Promise<AdminNotification>;
    createBom(orgId: OrgId, input: CreateBomInput): Promise<BillOfMaterial>;
    createCategory(input: CreateCategoryInput): Promise<{
        __kind__: "ok";
        ok: Category;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    }>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createContact(orgId: OrgId, input: ContactInput): Promise<ContactId>;
    createCostOfProduction(orgId: OrgId, input: CreateCostOfProductionInput): Promise<CostOfProduction>;
    createCustomerReceipt(orgId: OrgId, input: CreateReceiptInput): Promise<CustomerReceipt>;
    createDeal(orgId: OrgId, input: DealInput): Promise<DealId>;
    createExtendedLead(orgId: OrgId, input: ExtendedLeadInput): Promise<ExtendedLead>;
    createFinanceCategory(orgId: OrgId, input: CreateFinanceCategoryInput): Promise<FinanceCategory>;
    createFinishedGood(orgId: OrgId, input: CreateFinishedGoodInput): Promise<FinishedGood>;
    createGroup(orgId: OrgId, input: CreateGroupInput): Promise<Group_>;
    createHsnSacCode(orgId: OrgId, input: CreateHsnSacCodeInput): Promise<HsnSacCode>;
    createIncentiveScheme(orgId: OrgId, input: CreateIncentiveSchemeInput): Promise<IncentiveScheme>;
    createInventoryCategory(orgId: OrgId, input: CreateInventoryCategoryInput): Promise<InventoryCategory>;
    createInvoice(orgId: OrgId, input: CreateInvoiceInput): Promise<InvoiceView>;
    createItemAttribute(orgId: OrgId, input: CreateItemAttributeInput): Promise<ItemAttributeDef>;
    createItemMaster(orgId: OrgId, input: CreateItemMasterInput): Promise<ItemMaster>;
    createLead(orgId: OrgId, input: LeadInput): Promise<LeadId>;
    createLocation(orgId: OrgId, input: CreateLocationInput): Promise<Location>;
    createMachine(orgId: OrgId, input: CreateMachineInput): Promise<Machine>;
    createManufacturingOrder(orgId: OrgId, input: CreateManufacturingOrderInput): Promise<ManufacturingOrder>;
    createOrg(name: string, slug: string, timezone: string, orgType: OrgType, gstin: string | null, pan: string | null, address: OrgAddress | null, contactPerson: OrgContactPerson | null): Promise<OrgId>;
    createPortalEmployee(input: CreateEmployeeInput__1): Promise<{
        __kind__: "ok";
        ok: PortalEmployee;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPortalTask(input: CreateTaskInput): Promise<PortalTask>;
    createPosTransaction(orgId: OrgId, input: CreatePosTransactionInput): Promise<PosTransaction>;
    createProduct(input: CreateProductInput): Promise<{
        __kind__: "ok";
        ok: Product;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    }>;
    createProductionPlan(orgId: OrgId, input: CreateProductionPlanInput): Promise<ProductionPlan>;
    createPurchaseBill(orgId: OrgId, input: CreatePurchaseBillInput): Promise<PurchaseBill>;
    createPurchaseCreditNote(orgId: OrgId, input: CreateCreditNoteInput__1): Promise<PurchaseCreditNote>;
    createPurchaseDebitNote(orgId: OrgId, input: CreateDebitNoteInput__1): Promise<PurchaseDebitNote>;
    createPurchaseOrder(orgId: OrgId, input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
    createPurchaseReturn(orgId: OrgId, input: CreatePurchaseReturnInput): Promise<PurchaseReturn>;
    createQualityControl(orgId: OrgId, input: CreateQualityControlInput): Promise<QualityControl>;
    createQuotation(orgId: OrgId, input: CreateQuotationInput): Promise<Quotation>;
    createRawMaterialRequisition(orgId: OrgId, input: CreateRequisitionInput): Promise<RawMaterialRequisition>;
    createRefundRequest(input: CreateRefundRequestInput): Promise<GstRefundRequest>;
    createRole(orgId: OrgId, input: CreateRoleInput): Promise<Role>;
    createRoutingOperation(orgId: OrgId, input: CreateRoutingOperationInput): Promise<RoutingOperation>;
    createSaleCreditNote(orgId: OrgId, input: CreateCreditNoteInput): Promise<SaleCreditNote>;
    createSaleDebitNote(orgId: OrgId, input: CreateDebitNoteInput): Promise<SaleDebitNote>;
    createSaleReturn(orgId: OrgId, input: CreateSaleReturnInput): Promise<SaleReturn>;
    createSalesOrder(orgId: OrgId, input: CreateSalesOrderInput): Promise<SalesOrder>;
    createScrapRecord(orgId: OrgId, input: CreateScrapRecordInput): Promise<ScrapRecord>;
    createShipment(orgId: OrgId, input: CreateShipmentInput): Promise<Shipment>;
    createShopFloorControl(orgId: OrgId, input: CreateShopFloorInput): Promise<ShopFloorControl>;
    createSubscriptionCheckout(orgId: OrgId, plan: PlanTier, successUrl: string, cancelUrl: string): Promise<string>;
    createSupplierPayment(orgId: OrgId, input: CreateSupplierPaymentInput): Promise<SupplierPayment>;
    createUom(orgId: OrgId, input: CreateUomInput): Promise<UnitOfMeasure>;
    createWorkOrder(orgId: OrgId, input: CreateWorkOrderInput): Promise<WorkOrder>;
    deactivatePortalEmployee(employeeId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deductProductStock(productId: ProductId, orgId: OrgId, qty: bigint): Promise<boolean>;
    deleteBom(orgId: OrgId, id: bigint): Promise<void>;
    deleteCategory(orgId: OrgId, categoryId: CategoryId): Promise<Variant_ok_notAuthorized_notFound>;
    deleteContact(orgId: OrgId, id: ContactId): Promise<boolean>;
    deleteCostOfProduction(orgId: OrgId, id: bigint): Promise<void>;
    deleteDeal(orgId: OrgId, id: DealId): Promise<boolean>;
    deleteFinanceCategory(orgId: OrgId, id: string): Promise<boolean>;
    deleteFinishedGood(orgId: OrgId, id: bigint): Promise<void>;
    deleteGroup(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteHsnSacCode(orgId: OrgId, id: string): Promise<boolean>;
    deleteIncentiveScheme(orgId: OrgId, id: bigint): Promise<void>;
    deleteInventoryCategory(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteItemAttribute(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteItemMaster(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteLocation(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteMachine(orgId: OrgId, id: bigint): Promise<void>;
    deleteManufacturingOrder(orgId: OrgId, id: bigint): Promise<void>;
    deleteNotification(id: NotificationId): Promise<boolean>;
    deleteOrg(orgId: OrgId): Promise<void>;
    deletePortalTask(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteProduct(orgId: OrgId, productId: ProductId): Promise<Variant_ok_notAuthorized_notFound>;
    deleteProductionPlan(orgId: OrgId, id: bigint): Promise<void>;
    deletePurchaseBill(orgId: OrgId, id: bigint): Promise<void>;
    deletePurchaseOrder(orgId: OrgId, id: bigint): Promise<void>;
    deleteQualityControl(orgId: OrgId, id: bigint): Promise<void>;
    deleteRawMaterialRequisition(orgId: OrgId, id: bigint): Promise<void>;
    deleteRole(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteRoutingOperation(orgId: OrgId, id: bigint): Promise<void>;
    deleteScrapRecord(orgId: OrgId, id: bigint): Promise<void>;
    deleteShipment(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteShopFloorControl(orgId: OrgId, id: bigint): Promise<void>;
    deleteTrafficEvents(orgId: string, ids: Array<string>): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteUom(orgId: OrgId, id: bigint): Promise<boolean>;
    deleteWorkOrder(orgId: OrgId, id: bigint): Promise<void>;
    exportContactsCsv(orgId: OrgId): Promise<string>;
    generateGstReturn(orgId: OrgId, year: bigint, month: bigint, returnType: GstReturnType): Promise<GstReturn>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCashFlowForecast(orgId: OrgId): Promise<Array<CashFlowForecast>>;
    getContact(orgId: OrgId, id: ContactId): Promise<Contact | null>;
    getDeal(orgId: OrgId, id: DealId): Promise<Deal | null>;
    getErpModuleEnabled(orgId: OrgId): Promise<boolean>;
    getFinanceDashboard(orgId: OrgId): Promise<FinanceDashboard>;
    getGstReturn(gstReturnId: GstReturnId, orgId: OrgId): Promise<GstReturn | null>;
    getInvoice(orgId: OrgId, id: InvoiceId): Promise<InvoiceView | null>;
    getItemMaster(orgId: OrgId, id: bigint): Promise<ItemMaster | null>;
    getLeadByContact(orgId: OrgId, contactId: ContactId): Promise<Lead | null>;
    getModuleVisibility(orgId: OrgId): Promise<Array<[string, boolean]>>;
    getMonthlySummary(orgId: OrgId, year: bigint, month: bigint): Promise<MonthlySummary>;
    getMyRole(orgId: OrgId): Promise<OrgRole | null>;
    getOrg(orgId: OrgId): Promise<Org>;
    getOrgBillingInfo(orgId: OrgId): Promise<OrgBillingInfo | null>;
    getOrgConfiguration(orgId: OrgId): Promise<OrgConfiguration>;
    getOrgSubscription(orgId: OrgId): Promise<OrgSubscription | null>;
    getPipelineSummary(orgId: OrgId): Promise<PipelineSummary>;
    getPortalApiKeys(orgId: OrgId): Promise<Array<PortalApiKeyInfo>>;
    getPortalDashboardLayout(adminEmail: string): Promise<DashboardLayout | null>;
    getProduct(orgId: OrgId, productId: ProductId): Promise<{
        __kind__: "ok";
        ok: Product;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    } | {
        __kind__: "notFound";
        notFound: null;
    }>;
    getRefundRequest(orgId: OrgId, id: bigint): Promise<GstRefundRequest | null>;
    getShipment(orgId: OrgId, id: bigint): Promise<Shipment | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscription(orgId: OrgId): Promise<OrgSubscription | null>;
    getTrafficSummary(orgId: string): Promise<{
        __kind__: "ok";
        ok: TrafficSummary;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getUnreadCount(orgId: OrgId__15): Promise<bigint>;
    getWorkOrder(orgId: OrgId, id: bigint): Promise<WorkOrder | null>;
    hrCreateAttendance(orgId: bigint, input: CreateAttendanceInput): Promise<Attendance>;
    hrCreateEmployee(orgId: bigint, input: CreateEmployeeInput): Promise<Employee>;
    hrCreateSlip(orgId: bigint, input: CreateSlipInput): Promise<SalarySlip>;
    hrDeleteAttendance(orgId: bigint, id: bigint): Promise<void>;
    hrDeleteEmployee(orgId: bigint, id: bigint): Promise<void>;
    hrDeleteSlip(orgId: bigint, id: bigint): Promise<void>;
    hrGetEmployee(orgId: bigint, id: bigint): Promise<Employee | null>;
    hrGetPfEsiConfig(orgId: bigint): Promise<PfEsiConfig | null>;
    hrListAttendance(orgId: bigint, employeeId: bigint | null): Promise<Array<Attendance>>;
    hrListEmployees(orgId: bigint): Promise<Array<Employee>>;
    hrListPayrolls(orgId: bigint): Promise<Array<Payroll>>;
    hrListSlips(orgId: bigint, employeeId: bigint | null): Promise<Array<SalarySlip>>;
    hrProcessPayroll(orgId: bigint, input: CreatePayrollInput): Promise<Payroll>;
    hrToggleEmployee(orgId: bigint, id: bigint): Promise<Employee>;
    hrUpdateAttendance(orgId: bigint, input: UpdateAttendanceInput): Promise<Attendance>;
    hrUpdateEmployee(orgId: bigint, input: UpdateEmployeeInput): Promise<Employee>;
    hrUpdatePayrollStatus(orgId: bigint, id: bigint, status: PayrollStatus): Promise<Payroll>;
    hrUpdateSlip(orgId: bigint, input: UpdateSlipInput): Promise<SalarySlip>;
    hrUpsertPfEsiConfig(orgId: bigint, input: UpsertPfEsiInput): Promise<PfEsiConfig>;
    importLeadsFromCsv(orgId: OrgId, csvRows: Array<CsvLeadRow>): Promise<ImportResult>;
    inviteMember(orgId: OrgId, email: string, role: OrgRole): Promise<PendingInvite>;
    isCallerAdmin(): Promise<boolean>;
    isInvoiceStripeConfigured(orgId: OrgId): Promise<boolean>;
    isSlugAvailable(slug: string): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listAdminNotifications(companyId: string, employeeId: string): Promise<Array<AdminNotification>>;
    listBillingHistory(orgId: OrgId): Promise<Array<BillingEntry>>;
    listBoms(orgId: OrgId): Promise<Array<BillOfMaterial>>;
    listCategories(orgId: OrgId): Promise<{
        __kind__: "ok";
        ok: Array<Category>;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    }>;
    listContacts(orgId: OrgId, search: string | null, tag: string | null, sortField: ContactSortField | null, sortAsc: boolean): Promise<Array<Contact>>;
    listCostsOfProduction(orgId: OrgId): Promise<Array<CostOfProduction>>;
    listCustomerReceipts(orgId: OrgId): Promise<Array<CustomerReceipt>>;
    listDealNotes(orgId: OrgId, dealId: DealId): Promise<Array<DealNote>>;
    listDealStageHistory(orgId: OrgId, dealId: DealId): Promise<Array<DealStageEvent>>;
    listDeals(orgId: OrgId): Promise<Array<Deal>>;
    listFinanceCategories(orgId: OrgId, filter: FinanceCategoryFilter): Promise<Array<FinanceCategory>>;
    listFinishedGoods(orgId: OrgId): Promise<Array<FinishedGood>>;
    listGroups(orgId: OrgId): Promise<Array<Group_>>;
    listGstReturns(orgId: OrgId): Promise<Array<GstReturn>>;
    listHsnSacCodes(orgId: OrgId, filter: HsnSacFilter): Promise<Array<HsnSacCode>>;
    listIncentiveSchemes(orgId: OrgId): Promise<Array<IncentiveScheme>>;
    listInteractionNotes(orgId: OrgId, contactId: ContactId): Promise<Array<InteractionNote>>;
    listInventoryCategories(orgId: OrgId, parentId: Some<bigint | null> | None): Promise<Array<InventoryCategory>>;
    listInvoices(orgId: OrgId): Promise<Array<InvoiceView>>;
    listItemAttributes(orgId: OrgId): Promise<Array<ItemAttributeDef>>;
    listItemMasters(orgId: OrgId, searchText: string | null): Promise<Array<ItemMaster>>;
    listLeads(orgId: OrgId, statusFilter: LeadStatus | null): Promise<Array<ExtendedLead>>;
    listLocations(orgId: OrgId): Promise<Array<Location>>;
    listMachines(orgId: OrgId): Promise<Array<Machine>>;
    listManufacturingOrders(orgId: OrgId): Promise<Array<ManufacturingOrder>>;
    listMembers(orgId: OrgId): Promise<Array<OrgMember>>;
    listMyOrgs(): Promise<Array<OrgSummary>>;
    listNotifications(orgId: OrgId__15): Promise<Array<Notification>>;
    listPendingInvites(orgId: OrgId): Promise<Array<PendingInvite>>;
    listPermissions(orgId: OrgId, roleId: bigint | null): Promise<Array<Permission>>;
    listPortalEmployees(companyId: string): Promise<Array<PortalEmployee>>;
    listPortalSyncHistory(orgId: OrgId, portal: PortalType): Promise<Array<SyncRecord>>;
    listPortalTasks(companyId: string, employeeId: string | null): Promise<Array<PortalTask>>;
    listPosTransactions(orgId: OrgId): Promise<Array<PosTransaction>>;
    listProductionPlans(orgId: OrgId): Promise<Array<ProductionPlan>>;
    listProducts(orgId: OrgId): Promise<{
        __kind__: "ok";
        ok: Array<Product>;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    }>;
    listPurchaseBills(orgId: OrgId): Promise<Array<PurchaseBill>>;
    listPurchaseCreditNotes(orgId: OrgId): Promise<Array<PurchaseCreditNote>>;
    listPurchaseDebitNotes(orgId: OrgId): Promise<Array<PurchaseDebitNote>>;
    listPurchaseOrders(orgId: OrgId): Promise<Array<PurchaseOrder>>;
    listPurchaseReturns(orgId: OrgId): Promise<Array<PurchaseReturn>>;
    listQualityControls(orgId: OrgId): Promise<Array<QualityControl>>;
    listQuotations(orgId: OrgId): Promise<Array<Quotation>>;
    listRawMaterialRequisitions(orgId: OrgId): Promise<Array<RawMaterialRequisition>>;
    listRefundRequests(orgId: OrgId): Promise<Array<GstRefundRequest>>;
    listRoles(orgId: OrgId): Promise<Array<Role>>;
    listRoutingOperations(orgId: OrgId): Promise<Array<RoutingOperation>>;
    listSaleCreditNotes(orgId: OrgId): Promise<Array<SaleCreditNote>>;
    listSaleDebitNotes(orgId: OrgId): Promise<Array<SaleDebitNote>>;
    listSaleReturns(orgId: OrgId): Promise<Array<SaleReturn>>;
    listSalesOrders(orgId: OrgId): Promise<Array<SalesOrder>>;
    listScrapRecords(orgId: OrgId): Promise<Array<ScrapRecord>>;
    listShipments(orgId: OrgId, statusFilter: ShipmentStatus | null, fromDate: bigint | null, toDate: bigint | null): Promise<Array<Shipment>>;
    listShopFloorControls(orgId: OrgId): Promise<Array<ShopFloorControl>>;
    listStockLevels(orgId: OrgId, locationId: bigint | null): Promise<Array<StockLevel>>;
    listSupplierPayments(orgId: OrgId): Promise<Array<SupplierPayment>>;
    listTransactions(orgId: OrgId, filter: TransactionFilter): Promise<Array<LedgerEntry>>;
    listUoms(orgId: OrgId): Promise<Array<UnitOfMeasure>>;
    listUserRoleAssignments(orgId: OrgId, userId: Principal | null): Promise<Array<UserRoleAssignment>>;
    listWorkOrders(orgId: OrgId): Promise<Array<WorkOrder>>;
    logTraffic(orgId: string, page: string, referrer: string, sourceType: TrafficSource, sessionId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    loginPortalAdmin(email: string, password: string): Promise<{
        __kind__: "ok";
        ok: PortalAdminSession;
    } | {
        __kind__: "err";
        err: string;
    }>;
    loginPortalEmployee(employeeId: string, password: string): Promise<{
        __kind__: "ok";
        ok: PortalEmployeeSession;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markAllNotificationsRead(orgId: OrgId__15): Promise<bigint>;
    markInvoicePaid(orgId: OrgId, id: InvoiceId): Promise<InvoiceView>;
    markNotificationRead(id: NotificationId): Promise<boolean>;
    markPortalNotificationRead(id: string, employeeId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    publishNotification(orgId: OrgId__15, notifType: NotifType, title: string, message: string): Promise<NotificationId>;
    purgeTrafficEvents(orgId: string, cutoff: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    queryTrafficReport(q: TrafficQuery): Promise<{
        __kind__: "ok";
        ok: Array<TrafficEvent>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerPortalCompany(input: RegisterCompanyInput): Promise<{
        __kind__: "ok";
        ok: PortalAdminSession;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerPortalGroup(input: RegisterGroupInput): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerPortalIndividual(input: RegisterIndividualInput): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeMember(orgId: OrgId, target: Principal): Promise<void>;
    revokeUserRole(orgId: OrgId, assignmentId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePortalApiKey(orgId: OrgId, portal: PortalType, apiKey: string): Promise<void>;
    savePortalDashboardLayout(adminEmail: string, widgetConfig: string): Promise<DashboardLayout>;
    searchByHsn(orgId: OrgId, prefix: string): Promise<Array<Product>>;
    searchByPartNumber(orgId: OrgId, prefix: string): Promise<Array<Product>>;
    sendInvoice(orgId: OrgId, id: InvoiceId, successUrl: string, cancelUrl: string): Promise<string>;
    setErpModuleEnabled(orgId: OrgId, enabled: boolean): Promise<void>;
    setInvoiceStripeConfig(orgId: OrgId, config: StripeConfig): Promise<void>;
    setModuleVisibility(orgId: OrgId, module: string, enabled: boolean): Promise<void>;
    setOrgBillingInfo(orgId: OrgId, info: OrgBillingInfo): Promise<void>;
    setOrgSubscription(orgId: OrgId, sub: OrgSubscription): Promise<void>;
    setPermission(orgId: OrgId, input: SetPermissionsInput): Promise<Permission>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitGstReturn(gstReturnId: GstReturnId, orgId: OrgId): Promise<GstReturn | null>;
    subscribeToNotifications(orgId: OrgId__15): Promise<void>;
    syncPortalLeads(orgId: OrgId, portal: PortalType): Promise<SyncResult>;
    trackShipment(orgId: OrgId, id: bigint): Promise<TrackingInfo | null>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    transformInvoice(input: {
        context: Uint8Array;
        response: {
            status: bigint;
            body: Uint8Array;
            headers: Array<{
                value: string;
                name: string;
            }>;
        };
    }): Promise<{
        status: bigint;
        body: Uint8Array;
        headers: Array<{
            value: string;
            name: string;
        }>;
    }>;
    updateBom(orgId: OrgId, input: UpdateBomInput): Promise<BillOfMaterial>;
    updateCategory(input: UpdateCategoryInput): Promise<{
        __kind__: "ok";
        ok: Category;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    } | {
        __kind__: "notFound";
        notFound: null;
    }>;
    updateContact(orgId: OrgId, id: ContactId, input: ContactInput): Promise<boolean>;
    updateCostOfProduction(orgId: OrgId, input: UpdateCostOfProductionInput): Promise<CostOfProduction>;
    updateDeal(orgId: OrgId, id: DealId, input: DealInput): Promise<boolean>;
    updateExtendedLeadStatus(orgId: OrgId, leadId: LeadId, newStatus: LeadStatus): Promise<boolean>;
    updateFinanceCategory(orgId: OrgId, input: UpdateFinanceCategoryInput): Promise<FinanceCategory | null>;
    updateFinishedGood(orgId: OrgId, input: UpdateFinishedGoodInput): Promise<FinishedGood>;
    updateGroup(orgId: OrgId, input: UpdateGroupInput): Promise<Group_ | null>;
    updateHsnSacCode(orgId: OrgId, input: UpdateHsnSacCodeInput): Promise<HsnSacCode | null>;
    updateIncentiveScheme(orgId: OrgId, input: UpdateIncentiveSchemeInput): Promise<IncentiveScheme>;
    updateInventoryCategory(orgId: OrgId, input: UpdateInventoryCategoryInput): Promise<InventoryCategory | null>;
    updateInvoice(orgId: OrgId, input: UpdateInvoiceInput): Promise<InvoiceView>;
    updateItemMaster(orgId: OrgId, input: UpdateItemMasterInput): Promise<ItemMaster | null>;
    updateLocation(orgId: OrgId, input: UpdateLocationInput): Promise<Location | null>;
    updateMachine(orgId: OrgId, input: UpdateMachineInput): Promise<Machine>;
    updateManufacturingOrder(orgId: OrgId, input: UpdateManufacturingOrderInput): Promise<ManufacturingOrder>;
    updateMemberRole(orgId: OrgId, target: Principal, newRole: OrgRole): Promise<void>;
    updateOrg(orgId: OrgId, name: string, slug: string, timezone: string, orgType: OrgType, gstin: string | null, pan: string | null, address: OrgAddress | null, contactPerson: OrgContactPerson | null): Promise<void>;
    updateOrgConfiguration(orgId: OrgId, input: UpdateOrgConfigurationInput): Promise<OrgConfiguration>;
    updatePortalEmployee(employeeId: string, name: string | null, designation: string | null, department: string | null, modulePermissions: Array<[string, boolean]> | null): Promise<{
        __kind__: "ok";
        ok: PortalEmployee;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updatePortalTask(id: string, title: string | null, description: string | null, assignedTo: string | null, priority: TaskPriority | null, dueDate: bigint | null, fileUrl: string | null): Promise<{
        __kind__: "ok";
        ok: PortalTask;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updatePortalTaskStatus(id: string, status: TaskStatus): Promise<{
        __kind__: "ok";
        ok: PortalTask;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateProduct(input: UpdateProductInput): Promise<{
        __kind__: "ok";
        ok: Product;
    } | {
        __kind__: "notAuthorized";
        notAuthorized: null;
    } | {
        __kind__: "notFound";
        notFound: null;
    }>;
    updateProductionPlan(orgId: OrgId, input: UpdateProductionPlanInput): Promise<ProductionPlan>;
    updatePurchaseBill(orgId: OrgId, input: UpdatePurchaseBillInput): Promise<PurchaseBill>;
    updatePurchaseOrder(orgId: OrgId, input: UpdatePurchaseOrderInput): Promise<PurchaseOrder>;
    updateQualityControl(orgId: OrgId, input: UpdateQualityControlInput): Promise<QualityControl>;
    updateQuotation(orgId: OrgId, input: UpdateQuotationInput): Promise<Quotation>;
    updateRawMaterialRequisition(orgId: OrgId, input: UpdateRequisitionInput): Promise<RawMaterialRequisition>;
    updateRefundRequest(orgId: OrgId, id: bigint, newStatus: string): Promise<GstRefundRequest | null>;
    updateRole(orgId: OrgId, input: UpdateRoleInput): Promise<Role | null>;
    updateRoutingOperation(orgId: OrgId, input: UpdateRoutingOperationInput): Promise<RoutingOperation>;
    updateSalesOrder(orgId: OrgId, input: UpdateSalesOrderInput): Promise<SalesOrder>;
    updateScrapRecord(orgId: OrgId, input: UpdateScrapRecordInput): Promise<ScrapRecord>;
    updateShipment(orgId: OrgId, id: bigint, input: UpdateShipmentInput): Promise<Shipment | null>;
    updateShipmentStatus(orgId: OrgId, id: bigint, status: ShipmentStatus): Promise<Shipment | null>;
    updateShopFloorControl(orgId: OrgId, input: UpdateShopFloorInput): Promise<ShopFloorControl>;
    updateWorkOrder(orgId: OrgId, input: UpdateWorkOrderInput): Promise<WorkOrder>;
    upsertStockLevel(orgId: OrgId, input: UpdateStockLevelInput): Promise<StockLevel>;
    voidInvoice(orgId: OrgId, id: InvoiceId): Promise<void>;
}
