import Types "../types/finance";
import AuthOrgTypes "../types/auth-org";
import FinanceLib "../lib/finance";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

mixin (
  transactions      : List.List<Types.Transaction>,
  budgets           : List.List<Types.Budget>,
  nextTransactionId : { var value : Nat },
  nextBudgetId      : { var value : Nat },
  getOrgRole        : (caller : Principal, orgId : Types.OrgId) -> ?{ #owner; #admin; #member },
  getOrgPlan        : (orgId : Types.OrgId) -> ?AuthOrgTypes.PlanTier,
) {

  // ── Authorization helper ─────────────────────────────────────────────────────

  func requireFinanceMember(caller : Principal, orgId : Types.OrgId) {
    switch (getOrgRole(caller, orgId)) {
      case null { Runtime.trap("Finance: caller is not a member of org " # orgId.toText()) };
      case _ {};
    };
  };

  func requireFinanceAdmin(caller : Principal, orgId : Types.OrgId) {
    switch (getOrgRole(caller, orgId)) {
      case (?(#owner)) {};
      case (?(#admin)) {};
      case _ { Runtime.trap("Finance: caller must be admin or owner in org " # orgId.toText()) };
    };
  };

  // ── Dashboard ────────────────────────────────────────────────────────────────

  /// Returns the full finance dashboard for the given org
  public shared ({ caller }) func getFinanceDashboard(orgId : Types.OrgId) : async Types.FinanceDashboard {
    requireFinanceMember(caller, orgId);
    let nowNs = Time.now();
    FinanceLib.buildDashboard(transactions, budgets, orgId, nowNs)
  };

  /// Returns the 90-day cash flow forecast for the org
  public shared ({ caller }) func getCashFlowForecast(orgId : Types.OrgId) : async [Types.CashFlowForecast] {
    requireFinanceMember(caller, orgId);
    let nowNs = Time.now();
    FinanceLib.getCashFlowForecast(transactions, orgId, nowNs)
  };

  // ── Transactions ─────────────────────────────────────────────────────────────

  /// Add a new transaction
  public shared ({ caller }) func addTransaction(
    orgId : Types.OrgId,
    input : Types.TransactionInput,
  ) : async Types.Transaction {
    requireFinanceMember(caller, orgId);
    let (tx, newId) = FinanceLib.addTransaction(
      transactions,
      nextTransactionId.value,
      orgId,
      caller,
      input,
    );
    nextTransactionId.value := newId;
    tx
  };

  /// Query the ledger with optional filters
  public shared query ({ caller }) func listTransactions(
    orgId : Types.OrgId,
    filter : Types.TransactionFilter,
  ) : async [Types.LedgerEntry] {
    requireFinanceMember(caller, orgId);
    FinanceLib.listTransactions(transactions, orgId, filter)
  };

  /// Get monthly income/expense/net summary
  public shared query ({ caller }) func getMonthlySummary(
    orgId : Types.OrgId,
    year : Nat,
    month : Nat,
  ) : async Types.MonthlySummary {
    requireFinanceMember(caller, orgId);
    FinanceLib.getMonthlySummary(transactions, orgId, year, month)
  };


};
