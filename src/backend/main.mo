import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Runtime "mo:core/Runtime";

import AuthOrgMixin "mixins/auth-org-api";
import CrmMixin "mixins/crm-api";
import FinanceMixin "mixins/finance-api";
import InvoicingMixin "mixins/invoicing-api";
import InventoryGstMixin "mixins/inventory-gst-api";
import B2bLeadsMixin "mixins/b2b-leads-api";
import AuthOrg "lib/auth-org";
import InvoicingLib "lib/invoicing";
import InventoryGstLib "lib/inventory-gst";
import B2bLeadsLib "lib/b2b-leads";
import GstExtMixin "mixins/gst-extended-api";
import LogisticsMixin "mixins/logistics-api";
import NotificationsMixin "mixins/notifications-api";
import GstExtLib "lib/gst-extended";
import LogisticsLib "lib/logistics";
import NotificationsLib "lib/notifications";
import CrmTypes "types/crm";
import FinanceTypes "types/finance";
import AuthOrgTypes "types/auth-org";

// ── New domain imports ─────────────────────────────────────────────────────
import PurchasesMixin "mixins/purchases-api";
import SalesOrdersMixin "mixins/sales-orders-api";
import InventoryMasterMixin "mixins/inventory-master-api";
import RolesPermMixin "mixins/roles-permissions-api";
import ConfigMixin "mixins/configuration-api";
import LocGrpMixin "mixins/location-group-api";
import IncentiveMixin "mixins/incentive-api";

import PurchasesLib "lib/purchases";
import SalesOrdersLib "lib/sales-orders";
import InventoryMasterLib "lib/inventory-master";
import RolesLib "lib/roles-permissions";
import ConfigLib "lib/configuration";
import LocGrpLib "lib/location-group";
import IncentiveLib "lib/incentive";
import IfcMixin "mixins/inventory-finance-config-api";
import IfcLib "lib/inventory-finance-config";
import ErpMixin "mixins/erp-manufacturing-api";
import ErpLib "lib/erp-manufacturing";
import TrafficMixin "mixins/traffic-api";
import TrafficLib "lib/traffic";
import HrMixin "mixins/hr-api";
import HrLib "lib/hr";
import PortalMixin "mixins/portal-api";
import PortalLib "lib/portal";


actor {
  // ── Authorization (Internet Identity) ─────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Org & membership state ─────────────────────────────────────────────────
  let orgs      : AuthOrg.OrgMap      = Map.empty();
  let members   : AuthOrg.MemberMap   = Map.empty();
  let invites   : AuthOrg.InviteList  = List.empty();
  let userOrgs  : AuthOrg.UserOrgsMap = Map.empty();
  let profiles  : AuthOrg.ProfileMap  = Map.empty();
  let subs      : AuthOrg.SubMap      = Map.empty();
  let billing   : AuthOrg.BillingList = List.empty();

  let nextOrgId     = { var value : Nat = 1 };
  let nextInviteId  = { var value : Nat = 1 };
  let nextBillingId = { var value : Nat = 1 };

  // ── Stripe configuration (global — must live in actor, not mixin) ──────────
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // ── Stripe: required directly in actor by caffeine tool ───────────────────

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(
    config : Stripe.StripeConfiguration,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Main: only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    let cfg = switch (stripeConfig) {
      case (null) { Runtime.trap("Main: Stripe is not configured — call setStripeConfiguration first") };
      case (?c) { c };
    };
    await Stripe.getSessionStatus(cfg, sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(
    items      : [Stripe.ShoppingItem],
    successUrl : Text,
    cancelUrl  : Text,
  ) : async Text {
    let cfg = switch (stripeConfig) {
      case (null) { Runtime.trap("Main: Stripe is not configured — call setStripeConfiguration first") };
      case (?c) { c };
    };
    await Stripe.createCheckoutSession(cfg, caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── Auth-Org domain API ────────────────────────────────────────────────────
  include AuthOrgMixin(
    accessControlState,
    orgs,
    members,
    invites,
    userOrgs,
    profiles,
    subs,
    billing,
    nextOrgId,
    nextInviteId,
    nextBillingId,
    func() : ?Stripe.StripeConfiguration { stripeConfig },
    transform,
  );

  // ── CRM state ──────────────────────────────────────────────────────────────
  let crmContacts      : List.List<CrmTypes.Contact>          = List.empty();
  let interactionNotes : List.List<CrmTypes.InteractionNote>  = List.empty();
  let leads            : List.List<CrmTypes.Lead>             = List.empty();
  let deals            : List.List<CrmTypes.Deal>             = List.empty();
  let dealStageHistory : List.List<CrmTypes.DealStageEvent>   = List.empty();
  let dealNotes        : List.List<CrmTypes.DealNote>         = List.empty();

  let nextContactId = { var value : Nat = 1 };
  let nextLeadId    = { var value : Nat = 1 };
  let nextDealId    = { var value : Nat = 1 };
  let nextNoteId    = { var value : Nat = 1 };

  include CrmMixin(
    crmContacts,
    interactionNotes,
    leads,
    deals,
    dealStageHistory,
    dealNotes,
    nextContactId,
    nextLeadId,
    nextDealId,
    nextNoteId,
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.OrgRole {
      AuthOrg.getCallerRole(members, caller, orgId);
    },
  );

  // ── Finance state ──────────────────────────────────────────────────────────
  let transactions : List.List<FinanceTypes.Transaction> = List.empty();
  let budgets      : List.List<FinanceTypes.Budget>      = List.empty();

  let nextTransactionId = { var value : Nat = 1 };
  let nextBudgetId      = { var value : Nat = 1 };

  include FinanceMixin(
    transactions,
    budgets,
    nextTransactionId,
    nextBudgetId,
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?{ #owner; #admin; #member } {
      AuthOrg.getCallerRole(members, caller, orgId)
    },
    func(orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.PlanTier {
      switch (subs.get(orgId)) {
        case (?sub) ?sub.plan;
        case null   null;
      }
    },
  );

  // ── Invoicing state ────────────────────────────────────────────────────────
  let invoices  : InvoicingLib.InvoiceMap = Map.empty();
  let stripeMap : InvoicingLib.StripeMap  = Map.empty();
  let orgInfos  : InvoicingLib.OrgInfoMap = Map.empty();
  let nextInvoiceId = { var value : Nat = 1 };

  include InvoicingMixin(
    invoices,
    stripeMap,
    orgInfos,
    nextInvoiceId,
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.OrgRole {
      AuthOrg.getCallerRole(members, caller, orgId);
    },
  );

  // ── B2B Leads state ────────────────────────────────────────────────────────
  let b2bApiKeys    : B2bLeadsLib.ApiKeyMap    = Map.empty();
  let b2bSyncHist   : B2bLeadsLib.SyncHistList = List.empty();
  let b2bExtLeads   : B2bLeadsLib.LeadList     = List.empty();

  let nextB2bLeadId    = { var value : Nat = 1 };
  let nextB2bContactId = { var value : Nat = 10000 }; // offset to avoid collision with CRM contacts

  include B2bLeadsMixin(
    b2bApiKeys,
    b2bSyncHist,
    b2bExtLeads,
    crmContacts,
    nextB2bLeadId,
    nextB2bContactId,
    func(orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.PlanTier {
      switch (subs.get(orgId)) {
        case (?sub) ?sub.plan;
        case null   null;
      }
    },
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.OrgRole {
      AuthOrg.getCallerRole(members, caller, orgId);
    },
    transform,
  );

  // ── Inventory & GST state ──────────────────────────────────────────────────
  let categories : InventoryGstLib.CategoryMap  = Map.empty();
  let products   : InventoryGstLib.ProductMap   = Map.empty();
  let gstReturns : InventoryGstLib.GstReturnMap = Map.empty();

  let nextCategoryId  = { var value : Nat = 1 };
  let nextProductId   = { var value : Nat = 1 };
  let nextGstReturnId = { var value : Nat = 1 };

  include InventoryGstMixin(
    categories,
    products,
    gstReturns,
    subs,
    nextCategoryId,
    nextProductId,
    nextGstReturnId,
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.OrgRole {
      AuthOrg.getCallerRole(members, caller, orgId);
    },
  );

  // ── GST Extended state (GSTR-2A, GSTR-9, refunds, E-way audit) ────────────
  let gstRefunds : GstExtLib.RefundMap = Map.empty();
  let nextRefundId = { var value : Nat = 1 };

  include GstExtMixin(
    gstRefunds,
    nextRefundId,
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.OrgRole {
      AuthOrg.getCallerRole(members, caller, orgId);
    },
    func(orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.PlanTier {
      switch (subs.get(orgId)) {
        case (?sub) ?sub.plan;
        case null   null;
      }
    },
  );

  // ── Logistics state (shipments / courier tracking) ─────────────────────────
  let shipments : LogisticsLib.ShipmentMap = Map.empty();
  let nextShipmentId = { var value : Nat = 1 };

  include LogisticsMixin(
    shipments,
    nextShipmentId,
    func(caller : Principal, orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.OrgRole {
      AuthOrg.getCallerRole(members, caller, orgId);
    },
    func(orgId : AuthOrgTypes.OrgId) : ?AuthOrgTypes.PlanTier {
      switch (subs.get(orgId)) {
        case (?sub) ?sub.plan;
        case null   null;
      }
    },
  );

  // ── Notifications state ────────────────────────────────────────────────────
  let notifStore  : NotificationsLib.NotificationMap = Map.empty();
  let nextNotifId : NotificationsLib.NextIdRef       = { var value = 1 };

  include NotificationsMixin(notifStore, nextNotifId);

  // ── Purchases state ────────────────────────────────────────────────────────
  let purchaseOrders      : PurchasesLib.PoMap      = Map.empty();
  let purchaseBills       : PurchasesLib.BillMap    = Map.empty();
  let purchaseCreditNotes : PurchasesLib.CreditMap  = Map.empty();
  let purchaseDebitNotes  : PurchasesLib.DebitMap   = Map.empty();
  let purchaseReturns     : PurchasesLib.ReturnMap  = Map.empty();
  let supplierPayments    : PurchasesLib.PaymentMap = Map.empty();

  let nextPoId         = { var value : Nat = 1 };
  let nextBillId       = { var value : Nat = 1 };
  let nextCreditNoteId = { var value : Nat = 1 };
  let nextDebitNoteId  = { var value : Nat = 1 };
  let nextReturnId     = { var value : Nat = 1 };
  let nextPaymentId    = { var value : Nat = 1 };

  include PurchasesMixin(
    purchaseOrders,
    purchaseBills,
    purchaseCreditNotes,
    purchaseDebitNotes,
    purchaseReturns,
    supplierPayments,
    nextPoId,
    nextBillId,
    nextCreditNoteId,
    nextDebitNoteId,
    nextReturnId,
    nextPaymentId,
  );

  // ── Sales Orders state ─────────────────────────────────────────────────────
  let salesOrders      : SalesOrdersLib.SoMap         = Map.empty();
  let quotations       : SalesOrdersLib.QuoteMap      = Map.empty();
  let saleDebitNotes   : SalesOrdersLib.DebitNoteMap  = Map.empty();
  let saleCreditNotes  : SalesOrdersLib.CreditNoteMap = Map.empty();
  let saleReturns      : SalesOrdersLib.ReturnMap     = Map.empty();
  let customerReceipts : SalesOrdersLib.ReceiptMap    = Map.empty();
  let posTransactions  : SalesOrdersLib.PosMap        = Map.empty();

  let nextSoId         = { var value : Nat = 1 };
  let nextQuoteId      = { var value : Nat = 1 };
  let nextSaleDebitId  = { var value : Nat = 1 };
  let nextSaleCreditId = { var value : Nat = 1 };
  let nextSaleReturnId = { var value : Nat = 1 };
  let nextReceiptId    = { var value : Nat = 1 };
  let nextPosId        = { var value : Nat = 1 };

  include SalesOrdersMixin(
    salesOrders,
    quotations,
    saleDebitNotes,
    saleCreditNotes,
    saleReturns,
    customerReceipts,
    posTransactions,
    nextSoId,
    nextQuoteId,
    nextSaleDebitId,
    nextSaleCreditId,
    nextSaleReturnId,
    nextReceiptId,
    nextPosId,
  );

  // ── Inventory Master state ─────────────────────────────────────────────────
  let itemMasters    : InventoryMasterLib.ItemMasterMap    = Map.empty();
  let unitsOfMeasure : InventoryMasterLib.UomMap           = Map.empty();
  let stockLevels    : InventoryMasterLib.StockLevelMap    = Map.empty();
  let itemAttributes : InventoryMasterLib.ItemAttributeMap = Map.empty();

  let nextItemId  = { var value : Nat = 1 };
  let nextUomId   = { var value : Nat = 1 };
  let nextStockId = { var value : Nat = 1 };
  let nextAttrId  = { var value : Nat = 1 };

  include InventoryMasterMixin(
    itemMasters,
    unitsOfMeasure,
    stockLevels,
    itemAttributes,
    nextItemId,
    nextUomId,
    nextStockId,
    nextAttrId,
  );

  // ── Roles & Permissions state ──────────────────────────────────────────────
  let roles_              : RolesLib.RoleMap       = Map.empty();
  let permissions_        : RolesLib.PermissionMap = Map.empty();
  let userRoleAssignments : RolesLib.AssignmentMap = Map.empty();

  let nextRoleId       = { var value : Nat = 1 };
  let nextPermId       = { var value : Nat = 1 };
  let nextAssignmentId = { var value : Nat = 1 };

  include RolesPermMixin(
    roles_,
    permissions_,
    userRoleAssignments,
    nextRoleId,
    nextPermId,
    nextAssignmentId,
  );

  // ── Configuration state ────────────────────────────────────────────────────
  let orgConfigurations : ConfigLib.ConfigMap = Map.empty();
  let nextConfigId = { var value : Nat = 1 };

  include ConfigMixin(orgConfigurations, nextConfigId);

  // ── Location & Group state ─────────────────────────────────────────────────
  let locations : LocGrpLib.LocationMap = Map.empty();
  let groups_   : LocGrpLib.GroupMap    = Map.empty();

  let nextLocationId = { var value : Nat = 1 };
  let nextGroupId    = { var value : Nat = 1 };

  include LocGrpMixin(locations, groups_, nextLocationId, nextGroupId);

  // ── Incentive state ────────────────────────────────────────────────────────
  let incentiveSchemes : IncentiveLib.IncentiveMap = Map.empty();
  let nextSchemeId = { var value : Nat = 1 };

  include IncentiveMixin(incentiveSchemes, nextSchemeId);

  // ── Inventory-Finance-Config domain state ──────────────────────────────────
  let invCategories    : IfcLib.InvCategoryMap  = Map.empty();
  let hsnSacCodes      : IfcLib.HsnSacMap       = Map.empty();
  let finCategories    : IfcLib.FinCategoryMap  = Map.empty();
  let moduleVisibility : IfcLib.ModuleVisMap    = Map.empty();

  let nextInvCatId     = { var value : Nat = 1 };
  let nextHsnSacTextId = { var value : Nat = 1 };
  let nextFinCatTextId = { var value : Nat = 1 };

  include IfcMixin(
    invCategories,
    hsnSacCodes,
    finCategories,
    moduleVisibility,
    nextInvCatId,
    nextHsnSacTextId,
    nextFinCatTextId,
  );

  // ── ERP Manufacturing state ────────────────────────────────────────────────
  let erpBoms          : ErpLib.BomMap        = Map.empty();
  let erpWorkOrders    : ErpLib.WorkOrderMap   = Map.empty();
  let erpPlans         : ErpLib.PlanMap        = Map.empty();
  let erpMos           : ErpLib.MoMap          = Map.empty();
  let erpReqs          : ErpLib.ReqMap         = Map.empty();
  let erpSfcs          : ErpLib.SfcMap         = Map.empty();
  let erpQcs           : ErpLib.QcMap          = Map.empty();
  let erpFgs           : ErpLib.FgMap          = Map.empty();
  let erpScraps        : ErpLib.ScrapMap       = Map.empty();
  let erpMachines      : ErpLib.MachineMap     = Map.empty();
  let erpRoutings      : ErpLib.RoutingMap     = Map.empty();
  let erpCops          : ErpLib.CopMap         = Map.empty();
  let erpModuleEnabled : ErpLib.ModuleEnabled  = Map.empty();

  let nextBomId     = { var value : Nat = 1 };
  let nextWoId      = { var value : Nat = 1 };
  let nextPlanId    = { var value : Nat = 1 };
  let nextMoId      = { var value : Nat = 1 };
  let nextReqId     = { var value : Nat = 1 };
  let nextSfcId     = { var value : Nat = 1 };
  let nextQcId      = { var value : Nat = 1 };
  let nextFgId      = { var value : Nat = 1 };
  let nextScrapId   = { var value : Nat = 1 };
  let nextMachineId = { var value : Nat = 1 };
  let nextRoutingId = { var value : Nat = 1 };
  let nextCopId     = { var value : Nat = 1 };

  include ErpMixin(
    erpBoms,
    erpWorkOrders,
    erpPlans,
    erpMos,
    erpReqs,
    erpSfcs,
    erpQcs,
    erpFgs,
    erpScraps,
    erpMachines,
    erpRoutings,
    erpCops,
    erpModuleEnabled,
    nextBomId,
    nextWoId,
    nextPlanId,
    nextMoId,
    nextReqId,
    nextSfcId,
    nextQcId,
    nextFgId,
    nextScrapId,
    nextMachineId,
    nextRoutingId,
    nextCopId,
  );

  // ── Traffic Analytics state ────────────────────────────────────────────────
  let trafficEvents : TrafficLib.EventMap = Map.empty();
  let nextTrafficId = { var value : Nat = 1 };

  include TrafficMixin(trafficEvents, members, nextTrafficId);

  // ── HR state ───────────────────────────────────────────────────────────────
  let hrEmployees  : HrLib.EmployeeMap   = Map.empty();
  let hrAttendance : HrLib.AttendanceMap = Map.empty();
  let hrSlips      : HrLib.SlipMap       = Map.empty();
  let hrPayrolls   : HrLib.PayrollMap    = Map.empty();
  let hrPfEsi      : HrLib.PfEsiMap      = Map.empty();
  let hrOvertimes  : HrLib.OvertimeMap   = Map.empty();
  let hrVouchers   : HrLib.VoucherMap    = Map.empty();
  let hrAdvances   : HrLib.AdvanceMap    = Map.empty();

  let nextHrEmpId  = { var value : Nat = 1 };
  let nextHrAttId  = { var value : Nat = 1 };
  let nextHrSlipId = { var value : Nat = 1 };
  let nextHrPayId  = { var value : Nat = 1 };
  let nextHrPfEsiId = { var value : Nat = 1 };
  let nextHrOtId   = { var value : Nat = 1 };
  let nextHrVchId  = { var value : Nat = 1 };
  let nextHrAdvId  = { var value : Nat = 1 };

  include HrMixin(
    hrEmployees,
    hrAttendance,
    hrSlips,
    hrPayrolls,
    hrPfEsi,
    hrOvertimes,
    hrVouchers,
    hrAdvances,
    nextHrEmpId,
    nextHrAttId,
    nextHrSlipId,
    nextHrPayId,
    nextHrPfEsiId,
    nextHrOtId,
    nextHrVchId,
    nextHrAdvId,
  );

  // ── Portal state ───────────────────────────────────────────────────────────
  let portalCompanies   : PortalLib.CompanyMap    = Map.empty();
  let portalGroups      : PortalLib.GroupMap      = Map.empty();
  let portalIndividuals : PortalLib.IndividualMap = Map.empty();
  let portalEmployees   : PortalLib.EmpMap        = Map.empty();
  let portalTasks       : PortalLib.TaskMap       = Map.empty();
  let portalLayouts     : PortalLib.LayoutMap     = Map.empty();
  let portalNotifs      : PortalLib.NotifMap      = Map.empty();

  let nextPortalCompId  : PortalLib.NextIdRef = { var value = 1 };
  let nextPortalGrpId   : PortalLib.NextIdRef = { var value = 1 };
  let nextPortalIndId   : PortalLib.NextIdRef = { var value = 1 };
  let nextPortalEmpId   : PortalLib.NextIdRef = { var value = 1 };
  let nextPortalTaskId  : PortalLib.NextIdRef = { var value = 1 };
  let nextPortalNotifId : PortalLib.NextIdRef = { var value = 1 };

  include PortalMixin(
    portalCompanies,
    portalGroups,
    portalIndividuals,
    portalEmployees,
    portalTasks,
    portalLayouts,
    portalNotifs,
    nextPortalCompId,
    nextPortalGrpId,
    nextPortalIndId,
    nextPortalEmpId,
    nextPortalTaskId,
    nextPortalNotifId,
  );

};
