import Common "common";

module {
  public type OrgId = Common.OrgId;
  public type Timestamp = Common.Timestamp;

  // Transaction category
  public type TransactionCategory = {
    #revenue;
    #travel;
    #software;
    #equipment;
    #contractorFees;
    #other;
  };

  // Reconciliation status
  public type ReconciliationStatus = {
    #unreconciled;
    #reconciled : Text; // bank reference
  };

  // A financial transaction
  public type Transaction = {
    id : Nat;
    orgId : OrgId;
    amount : Int; // positive = income, negative = expense (in cents)
    category : TransactionCategory;
    date : Timestamp;
    description : Text;
    reconciliation : ReconciliationStatus;
    createdAt : Timestamp;
    createdBy : Principal;
  };

  // Input for creating a transaction
  public type TransactionInput = {
    amount : Int;
    category : TransactionCategory;
    date : Timestamp;
    description : Text;
  };

  // Filter for querying transactions
  public type TransactionFilter = {
    category : ?TransactionCategory;
    fromDate : ?Timestamp;
    toDate : ?Timestamp;
    reconciled : ?Bool;
  };

  // Budget record per org
  public type Budget = {
    id : Nat;
    orgId : OrgId;
    category : TransactionCategory;
    allocated : Nat; // in cents
    periodStart : Timestamp;
    periodEnd : Timestamp;
    createdAt : Timestamp;
  };

  // Input for setting a budget
  public type BudgetInput = {
    category : TransactionCategory;
    allocated : Nat;
    periodStart : Timestamp;
    periodEnd : Timestamp;
  };

  // Monthly revenue data point (for charts)
  public type MonthlyRevenue = {
    year : Nat;
    month : Nat; // 1-12
    revenue : Nat; // in cents
    expenses : Nat; // in cents
  };

  // Expense breakdown by category
  public type CategoryExpense = {
    category : TransactionCategory;
    amount : Nat; // in cents
  };

  // Finance dashboard metrics
  public type FinanceDashboard = {
    revenueMTD : Nat; // cents
    mrr : Nat; // cents (monthly recurring revenue)
    revenueGrowthPct : Int; // vs last month, basis points (100 = 1%)
    budgetAllocated : Nat; // cents
    budgetSpent : Nat; // cents
    budgetRemaining : Int; // cents
    budgetUtilizationPct : Nat; // 0-10000 basis points
    expensesByCategory : [CategoryExpense];
    monthlyRevenueTrend : [MonthlyRevenue]; // past 12 months
  };

  // Monthly financial summary
  public type MonthlySummary = {
    year : Nat;
    month : Nat;
    income : Nat; // cents
    expenses : Nat; // cents
    net : Int; // cents
  };

  // Cash flow forecast data point
  public type CashFlowForecast = {
    date : Timestamp;
    projectedBalance : Int; // cents
  };

  // Ledger entry (transaction with running balance)
  public type LedgerEntry = {
    transaction : Transaction;
    runningBalance : Int; // cents
  };
};
