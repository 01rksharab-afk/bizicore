import { Layout } from "@/components/Layout";
import { EditContactPage, NewContactPage } from "@/components/crm/ContactForm";
import { InvoiceForm } from "@/components/invoicing/InvoiceForm";
import { Toaster } from "@/components/ui/sonner";
import { PortalAuthProvider } from "@/context/PortalAuthContext";
import { SettingsVisibilityProvider } from "@/context/SettingsVisibilityContext";
import { AcceptInvitePage } from "@/pages/AcceptInvitePage";
import AccountingPage from "@/pages/AccountingPage";
import AdvanceCustomerReceiptsPage from "@/pages/AdvanceCustomerReceiptsPage";
import AdvanceSupplierPaymentsPage from "@/pages/AdvanceSupplierPaymentsPage";
import B2bPortalPage from "@/pages/B2bPortalPage";
import BalanceSheetPage from "@/pages/BalanceSheetPage";
import BulkImportPage from "@/pages/BulkImportPage";
import CategoriesPage from "@/pages/CategoriesPage";
import ChartOfAccountsPage from "@/pages/ChartOfAccountsPage";
import ConfigurationPage from "@/pages/ConfigurationPage";
import ConsolePage from "@/pages/ConsolePage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import ContactsPage from "@/pages/ContactsPage";
import { CreateOrgPage } from "@/pages/CreateOrgPage";
import CustomerReceiptsPage from "@/pages/CustomerReceiptsPage";
import DashboardPage from "@/pages/DashboardPage";
import DealsPage from "@/pages/DealsPage";
import EwayAuditPage from "@/pages/EwayAuditPage";
import FinanceCategoriesPage from "@/pages/FinanceCategoriesPage";
import GeneralLedgerPage from "@/pages/GeneralLedgerPage";
import GroupsPage from "@/pages/GroupsPage";
import GstFilingPage from "@/pages/GstFilingPage";
import GstRefundsPage from "@/pages/GstRefundsPage";
import GstReturnDetailPage from "@/pages/GstReturnDetailPage";
import Gstr2aPage from "@/pages/Gstr2aPage";
import Gstr9Page from "@/pages/Gstr9Page";
import HsnSacCodesPage from "@/pages/HsnSacCodesPage";
import HsnSearchPage from "@/pages/HsnSearchPage";
import ImportExportPage from "@/pages/ImportExportPage";
import IncentivePage from "@/pages/IncentivePage";
import InventoryPage from "@/pages/InventoryPage";
import InventoryReportPage from "@/pages/InventoryReportPage";
import InvoiceDetailPage from "@/pages/InvoiceDetailPage";
import InvoicingPage from "@/pages/InvoicingPage";
import ItemAttributesPage from "@/pages/ItemAttributesPage";
import ItemMasterPage from "@/pages/ItemMasterPage";
import JournalVouchersPage from "@/pages/JournalVouchersPage";
import LeadsPage from "@/pages/LeadsPage";
import LedgerPostingsPage from "@/pages/LedgerPostingsPage";
import LedgersPage from "@/pages/LedgersPage";
import LocationStockLevelsPage from "@/pages/LocationStockLevelsPage";
import LocationsPage from "@/pages/LocationsPage";
import { LoginPage } from "@/pages/LoginPage";
import LogisticsPage from "@/pages/LogisticsPage";
import MisReportPage from "@/pages/MisReportPage";
import NewProductPage from "@/pages/NewProductPage";
import NewShipmentPage from "@/pages/NewShipmentPage";
import { OrgSelectPage } from "@/pages/OrgSelectPage";
import OrgStockLevelsPage from "@/pages/OrgStockLevelsPage";
import OutstandingCreditorsPage from "@/pages/OutstandingCreditorsPage";
import OutstandingDebtorsPage from "@/pages/OutstandingDebtorsPage";
import PermissionsPage from "@/pages/PermissionsPage";
import { PhoneLoginPage } from "@/pages/PhoneLoginPage";
import PosPage from "@/pages/PosPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import ProfitLossPage from "@/pages/ProfitLossPage";
import PurchaseBillsPage from "@/pages/PurchaseBillsPage";
import PurchaseCreditNotesPage from "@/pages/PurchaseCreditNotesPage";
import PurchaseDebitNotesPage from "@/pages/PurchaseDebitNotesPage";
import PurchaseOrdersPage from "@/pages/PurchaseOrdersPage";
import PurchaseReturnsPage from "@/pages/PurchaseReturnsPage";
import QuotationsPage from "@/pages/QuotationsPage";
import RolesPage from "@/pages/RolesPage";
import SaleCreditNotesPage from "@/pages/SaleCreditNotesPage";
import SaleDebitNotesPage from "@/pages/SaleDebitNotesPage";
import SaleReturnsPage from "@/pages/SaleReturnsPage";
import SalesChannelsPage from "@/pages/SalesChannelsPage";
import SalesOrdersPage from "@/pages/SalesOrdersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import ShipmentDetailPage from "@/pages/ShipmentDetailPage";
import SupplierPaymentsPage from "@/pages/SupplierPaymentsPage";
import TrafficReportPage from "@/pages/TrafficReportPage";
import TrialBalancePage from "@/pages/TrialBalancePage";
import UomPage from "@/pages/UomPage";
// ─── ERP Manufacturing pages ─────────────────────────────────────────────────
import BomPage from "@/pages/erp/BomPage";
import CostOfProductionPage from "@/pages/erp/CostOfProductionPage";
import FinishedGoodsPage from "@/pages/erp/FinishedGoodsPage";
import MachineMasterPage from "@/pages/erp/MachineMasterPage";
import ManufacturingOrdersPage from "@/pages/erp/ManufacturingOrdersPage";
import ProductionPlansPage from "@/pages/erp/ProductionPlansPage";
import QualityControlPage from "@/pages/erp/QualityControlPage";
import RmrPage from "@/pages/erp/RmrPage";
import RoutingPage from "@/pages/erp/RoutingPage";
import ScrapManagementPage from "@/pages/erp/ScrapManagementPage";
import ShopFloorPage from "@/pages/erp/ShopFloorPage";
import WorkOrdersPage from "@/pages/erp/WorkOrdersPage";
// ─── HR Portal pages ──────────────────────────────────────────────────────────
import AdvanceManagementPage from "@/pages/hr/AdvanceManagementPage";
import AttendancePage from "@/pages/hr/AttendancePage";
import EmployeeManagementPage from "@/pages/hr/EmployeeManagementPage";
import OvertimeVoucherPage from "@/pages/hr/OvertimeVoucherPage";
import PayrollPage from "@/pages/hr/PayrollPage";
import PfEsiInsurancePage from "@/pages/hr/PfEsiInsurancePage";
import SalarySlipPage from "@/pages/hr/SalarySlipPage";
// ─── Multi-Role Portal pages ──────────────────────────────────────────────────
import { PortalLoginPage } from "@/pages/portal/PortalLoginPage";
import { PortalRegisterPage } from "@/pages/portal/PortalRegisterPage";
import { PortalAdminDashboardPage } from "@/pages/portal/admin/PortalAdminDashboardPage";
import { PortalAdminSettingsPage } from "@/pages/portal/admin/PortalAdminSettingsPage";
import { PortalAdminTasksPage } from "@/pages/portal/admin/PortalAdminTasksPage";
import { PortalAdminTeamPage } from "@/pages/portal/admin/PortalAdminTeamPage";
import PortalEmployeeDashboardPage from "@/pages/portal/employee/PortalEmployeeDashboardPage";
import PortalEmployeeNotificationsPage from "@/pages/portal/employee/PortalEmployeeNotificationsPage";
import PortalEmployeeProfilePage from "@/pages/portal/employee/PortalEmployeeProfilePage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// ─── Root Layout ───────────────────────────────────────────────────────────────
function RootLayout() {
  return <Outlet />;
}

// ─── Page Placeholders ─────────────────────────────────────────────────────────
function PlaceholderPage({
  title,
  description,
}: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-semibold text-foreground">
        {title}
      </h1>
      <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl">
          ✦
        </div>
        <h2 className="font-display font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
    </div>
  );
}

// ─── Routes ────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: RootLayout });

// Full-page routes (no Layout wrapper)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const phoneLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login/phone",
  component: PhoneLoginPage,
});

const orgSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orgs/select",
  component: OrgSelectPage,
});

const orgNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orgs/new",
  component: CreateOrgPage,
});

const acceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/accept",
  component: AcceptInvitePage,
});

// ─── Portal Routes (no Layout wrapper) ────────────────────────────────────────
const portalLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/login",
  component: PortalLoginPage,
});

const portalRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/register",
  component: PortalRegisterPage,
});

// Admin portal routes (under layout)
const portalAdminDashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/admin/dashboard",
  component: PortalAdminDashboardPage,
});

const portalAdminTeamRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/admin/team",
  component: PortalAdminTeamPage,
});

const portalAdminTasksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/admin/tasks",
  component: PortalAdminTasksPage,
});

const portalAdminSettingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/admin/settings",
  component: PortalAdminSettingsPage,
});

// Employee portal routes (under layout)
const portalEmployeeDashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/employee/dashboard",
  component: PortalEmployeeDashboardPage,
});

const portalEmployeeProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/employee/profile",
  component: PortalEmployeeProfilePage,
});

const portalEmployeeNotificationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/portal/employee/notifications",
  component: PortalEmployeeNotificationsPage,
});

// Layout-wrapped routes
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

// ─── CRM Routes ──────────────────────────────────────────────────────────────
const crmContactsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crm/contacts",
  component: ContactsPage,
});
const crmContactNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crm/contacts/new",
  component: NewContactPage,
});
const crmContactDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crm/contacts/$contactId",
  component: ContactDetailPage,
});
const crmContactEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crm/contacts/$contactId/edit",
  component: EditContactPage,
});
const crmLeadsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crm/leads",
  component: LeadsPage,
});
const crmDealsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crm/deals",
  component: DealsPage,
});

// ─── Finance Routes ──────────────────────────────────────────────────────────
const financeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/finance",
  component: DashboardPage,
});
const financeBudgetsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/finance/budgets",
  component: () => (
    <PlaceholderPage
      title="Budgets"
      description="Set and monitor budgets by category."
    />
  ),
});
const financeCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/finance/categories",
  component: FinanceCategoriesPage,
});
const adminFinanceCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/finance-categories",
  component: FinanceCategoriesPage,
});

// ─── Accounting Routes ───────────────────────────────────────────────────────
const accountingTransactionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/transactions",
  component: AccountingPage,
});
const accountingSummaryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/summary",
  component: () => (
    <PlaceholderPage
      title="Monthly Summary"
      description="Income, expenses, and net by month."
    />
  ),
});
const accountingChartOfAccountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/chart-of-accounts",
  component: ChartOfAccountsPage,
});
const accountingLedgersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/ledgers",
  component: LedgersPage,
});
const accountingJournalVouchersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/journal-vouchers",
  component: JournalVouchersPage,
});
const accountingLedgerPostingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/ledger-postings",
  component: LedgerPostingsPage,
});

// ─── Accounting Reports Routes ───────────────────────────────────────────────
const accountingReportGeneralLedgerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/reports/general-ledger",
  component: GeneralLedgerPage,
});
const accountingReportTrialBalanceRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/reports/trial-balance",
  component: TrialBalancePage,
});
const accountingReportProfitLossRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/reports/profit-loss",
  component: ProfitLossPage,
});
const accountingReportBalanceSheetRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/reports/balance-sheet",
  component: BalanceSheetPage,
});
const accountingReportOutstandingDebtorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/reports/outstanding-debtors",
  component: OutstandingDebtorsPage,
});
const accountingReportOutstandingCreditorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/accounting/reports/outstanding-creditors",
  component: OutstandingCreditorsPage,
});

// ─── Reports Routes ──────────────────────────────────────────────────────────
const reportsInventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports/inventory",
  component: InventoryReportPage,
});
const reportsMisRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports/mis",
  component: MisReportPage,
});

// ─── Purchases Routes ────────────────────────────────────────────────────────
const purchasesOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/orders",
  component: PurchaseOrdersPage,
});
const purchasesBillsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/bills",
  component: PurchaseBillsPage,
});
const purchasesCreditNotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/credit-notes",
  component: PurchaseCreditNotesPage,
});
const purchasesDebitNotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/debit-notes",
  component: PurchaseDebitNotesPage,
});
const purchasesReturnsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/returns",
  component: PurchaseReturnsPage,
});
const purchasesPaymentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/payments",
  component: SupplierPaymentsPage,
});
const purchasesAdvancePaymentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases/advance-payments",
  component: AdvanceSupplierPaymentsPage,
});

// ─── Sales Routes ────────────────────────────────────────────────────────────
const salesOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/orders",
  component: SalesOrdersPage,
});
const salesQuotationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/quotations",
  component: QuotationsPage,
});
const salesCreditNotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/credit-notes",
  component: SaleCreditNotesPage,
});
const salesDebitNotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/debit-notes",
  component: SaleDebitNotesPage,
});
const salesReturnsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/returns",
  component: SaleReturnsPage,
});
const salesReceiptsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/receipts",
  component: CustomerReceiptsPage,
});
const salesAdvanceReceiptsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/advance-receipts",
  component: AdvanceCustomerReceiptsPage,
});
const salesPosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/pos",
  component: PosPage,
});

// ─── Inventory Master Routes ─────────────────────────────────────────────────
const inventoryItemMasterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/item-master",
  component: ItemMasterPage,
});
const inventoryUomRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/uom",
  component: UomPage,
});
const inventoryStockOrgRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/stock-levels/org",
  component: OrgStockLevelsPage,
});
const inventoryStockLocationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/stock-levels/location",
  component: LocationStockLevelsPage,
});
const inventoryAttributesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/attributes",
  component: ItemAttributesPage,
});

// ─── Admin Routes ────────────────────────────────────────────────────────────
const adminPermissionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/permissions",
  component: PermissionsPage,
});
const adminRolesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/roles",
  component: RolesPage,
});
const adminConfigurationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/configuration",
  component: ConfigurationPage,
});
const adminLocationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/locations",
  component: LocationsPage,
});
const adminGroupsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/groups",
  component: GroupsPage,
});
const adminImportExportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/import-export",
  component: ImportExportPage,
});
const adminIncentivesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin/incentives",
  component: IncentivePage,
});

// ─── HR Portal Routes ─────────────────────────────────────────────────────────
const hrEmployeesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/employees",
  component: EmployeeManagementPage,
});
const hrAttendanceRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/attendance",
  component: AttendancePage,
});
const hrSalarySlipsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/salary-slips",
  component: SalarySlipPage,
});
const hrPayrollRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/payroll",
  component: PayrollPage,
});
const hrPfEsiRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/pf-esi",
  component: PfEsiInsurancePage,
});
const hrOvertimeVoucherRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/overtime-voucher",
  component: OvertimeVoucherPage,
});
const hrAdvancesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/hr/advances",
  component: AdvanceManagementPage,
});

// ─── ERP Manufacturing Routes ─────────────────────────────────────────────────
const erpBomRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/bom",
  component: BomPage,
});
const erpWorkOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/work-orders",
  component: WorkOrdersPage,
});
const erpProductionPlansRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/production-plans",
  component: ProductionPlansPage,
});
const erpManufacturingOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/manufacturing-orders",
  component: ManufacturingOrdersPage,
});
const erpRmrRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/rmr",
  component: RmrPage,
});
const erpShopFloorRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/shop-floor",
  component: ShopFloorPage,
});
const erpQualityControlRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/quality-control",
  component: QualityControlPage,
});
const erpFinishedGoodsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/finished-goods",
  component: FinishedGoodsPage,
});
const erpScrapRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/scrap",
  component: ScrapManagementPage,
});
const erpMachinesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/machines",
  component: MachineMasterPage,
});
const erpRoutingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/routing",
  component: RoutingPage,
});
const erpCostOfProductionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/erp/cost-of-production",
  component: CostOfProductionPage,
});

// ─── Invoicing Routes ────────────────────────────────────────────────────────
const invoicingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/invoicing",
  component: InvoicingPage,
});
const invoicingNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/invoicing/new",
  component: () => (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-display font-semibold text-foreground">
        New Invoice
      </h1>
      <InvoiceForm />
    </div>
  ),
});
const invoiceDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/invoicing/$invoiceId",
  component: InvoiceDetailPage,
});

// ─── Inventory Routes ───────────────────────────────────────────────────────
const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory",
  component: InventoryPage,
});
const inventoryNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/new",
  component: NewProductPage,
});
const inventoryImportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/import",
  component: BulkImportPage,
});
const inventoryCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/categories",
  component: CategoriesPage,
});
const inventoryHsnRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/hsn",
  component: HsnSearchPage,
});
const inventoryHsnSacRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/hsn-sac",
  component: HsnSacCodesPage,
});
const inventoryProductRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory/$productId",
  component: ProductDetailPage,
});

// ─── GST Routes ─────────────────────────────────────────────────────────────
const gstRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst",
  component: GstFilingPage,
});
const gstReturnRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst/$returnId",
  component: GstReturnDetailPage,
});
const gstGstr2aRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst/gstr2a",
  component: Gstr2aPage,
});
const gstGstr9Route = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst/gstr9",
  component: Gstr9Page,
});
const gstRefundsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst/refunds",
  component: GstRefundsPage,
});
const gstEwayAuditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst/eway-audit",
  component: EwayAuditPage,
});

// ─── Logistics Routes ────────────────────────────────────────────────────────
const logisticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/logistics",
  component: LogisticsPage,
});
const logisticsNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/logistics/new",
  component: NewShipmentPage,
});
const logisticsShipmentRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/logistics/$shipmentId",
  component: ShipmentDetailPage,
});

// ─── B2B Portal Route ────────────────────────────────────────────────────────
const b2bRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/b2b",
  component: B2bPortalPage,
});

// ─── Settings Routes ─────────────────────────────────────────────────────────
const consoleRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/console",
  component: ConsolePage,
});

const consoleTrafficRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/console/traffic",
  component: TrafficReportPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) ?? "profile",
  }),
  component: SettingsPage,
});
const settingsOrgNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings/org/new",
  component: () => (
    <PlaceholderPage
      title="Create Organization"
      description="Set up a new organization workspace."
    />
  ),
});
const settingsProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings/profile",
  component: ProfilePage,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([
    loginRoute,
    phoneLoginRoute,
    orgSelectRoute,
    orgNewRoute,
    acceptInviteRoute,
    // Portal full-page routes (no Layout wrapper)
    portalLoginRoute,
    portalRegisterRoute,
    layoutRoute.addChildren([
      indexRoute,
      // CRM
      crmContactsRoute,
      crmContactNewRoute,
      crmContactDetailRoute,
      crmContactEditRoute,
      crmLeadsRoute,
      crmDealsRoute,
      // Finance
      financeRoute,
      financeBudgetsRoute,
      financeCategoriesRoute,
      adminFinanceCategoriesRoute,
      // Accounting
      accountingTransactionsRoute,
      accountingSummaryRoute,
      accountingChartOfAccountsRoute,
      accountingLedgersRoute,
      accountingJournalVouchersRoute,
      accountingLedgerPostingsRoute,
      // Accounting Reports
      accountingReportGeneralLedgerRoute,
      accountingReportTrialBalanceRoute,
      accountingReportProfitLossRoute,
      accountingReportBalanceSheetRoute,
      accountingReportOutstandingDebtorsRoute,
      accountingReportOutstandingCreditorsRoute,
      // Reports
      reportsInventoryRoute,
      reportsMisRoute,
      // Purchases
      purchasesOrdersRoute,
      purchasesBillsRoute,
      purchasesCreditNotesRoute,
      purchasesDebitNotesRoute,
      purchasesReturnsRoute,
      purchasesPaymentsRoute,
      purchasesAdvancePaymentsRoute,
      // Sales
      salesOrdersRoute,
      salesQuotationsRoute,
      salesCreditNotesRoute,
      salesDebitNotesRoute,
      salesReturnsRoute,
      salesReceiptsRoute,
      salesAdvanceReceiptsRoute,
      salesPosRoute,
      // Invoicing
      invoicingRoute,
      invoicingNewRoute,
      invoiceDetailRoute,
      // Inventory
      inventoryRoute,
      inventoryNewRoute,
      inventoryImportRoute,
      inventoryCategoriesRoute,
      inventoryHsnRoute,
      inventoryHsnSacRoute,
      inventoryItemMasterRoute,
      inventoryUomRoute,
      inventoryStockOrgRoute,
      inventoryStockLocationRoute,
      inventoryAttributesRoute,
      inventoryProductRoute,
      // GST
      gstRoute,
      gstGstr2aRoute,
      gstGstr9Route,
      gstRefundsRoute,
      gstEwayAuditRoute,
      gstReturnRoute,
      // Logistics
      logisticsRoute,
      logisticsNewRoute,
      logisticsShipmentRoute,
      // B2B
      b2bRoute,
      // Admin
      adminPermissionsRoute,
      adminRolesRoute,
      adminConfigurationRoute,
      adminLocationsRoute,
      adminGroupsRoute,
      adminImportExportRoute,
      adminIncentivesRoute,
      // ERP Manufacturing
      erpBomRoute,
      erpWorkOrdersRoute,
      erpProductionPlansRoute,
      erpManufacturingOrdersRoute,
      erpRmrRoute,
      erpShopFloorRoute,
      erpQualityControlRoute,
      erpFinishedGoodsRoute,
      erpScrapRoute,
      erpMachinesRoute,
      erpRoutingRoute,
      erpCostOfProductionRoute,
      // HR Portal
      hrEmployeesRoute,
      hrAttendanceRoute,
      hrSalarySlipsRoute,
      hrPayrollRoute,
      hrPfEsiRoute,
      hrOvertimeVoucherRoute,
      hrAdvancesRoute,
      // Multi-Role Portal (admin + employee sub-pages, wrapped in Layout)
      portalAdminDashboardRoute,
      portalAdminTeamRoute,
      portalAdminTasksRoute,
      portalAdminSettingsRoute,
      portalEmployeeDashboardRoute,
      portalEmployeeProfileRoute,
      portalEmployeeNotificationsRoute,
      // Settings
      consoleRoute,
      consoleTrafficRoute,
      settingsRoute,
      settingsOrgNewRoute,
      settingsProfileRoute,
    ]),
  ]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <SettingsVisibilityProvider>
      <PortalAuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </PortalAuthProvider>
    </SettingsVisibilityProvider>
  );
}
