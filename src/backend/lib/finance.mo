import Types "../types/finance";
import AuthOrgTypes "../types/auth-org";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  public type OrgId = Types.OrgId;
  public type Transaction = Types.Transaction;
  public type TransactionInput = Types.TransactionInput;
  public type TransactionFilter = Types.TransactionFilter;
  public type Budget = Types.Budget;
  public type BudgetInput = Types.BudgetInput;
  public type FinanceDashboard = Types.FinanceDashboard;
  public type MonthlySummary = Types.MonthlySummary;
  public type MonthlyRevenue = Types.MonthlyRevenue;
  public type CategoryExpense = Types.CategoryExpense;
  public type LedgerEntry = Types.LedgerEntry;
  public type CashFlowForecast = Types.CashFlowForecast;
  public type PlanChecker = (orgId : OrgId) -> ?AuthOrgTypes.PlanTier;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // Approximate year/month from nanoseconds (accurate to within a day)
  func nsToYearMonth(ns : Int) : (Nat, Nat) {
    let days = Int.abs(ns) / 86_400_000_000_000;
    // Each 400-year cycle = 146097 days (exact Gregorian)
    let year = (days * 400 / 146097) + 1970;
    // Approximate remaining days in the year
    let yearStart = (year - 1970) * 365 + (year - 1970) / 4 - (year - 1970) / 100 + (year - 1970) / 400;
    let rem = if (days > yearStart) { days - yearStart } else { 0 };
    let month : Nat = if (rem < 31) 1
      else if (rem < 59) 2
      else if (rem < 90) 3
      else if (rem < 120) 4
      else if (rem < 151) 5
      else if (rem < 181) 6
      else if (rem < 212) 7
      else if (rem < 243) 8
      else if (rem < 273) 9
      else if (rem < 304) 10
      else if (rem < 334) 11
      else 12;
    (year, month)
  };

  // Start-of-month timestamp in nanoseconds (approximate)
  func ymToNs(year : Nat, month : Nat) : Int {
    let y : Int = year.toInt() - 1970;
    let leaps : Int = (y + 2) / 4 - (y + 68) / 100 + (y + 368) / 400;
    let yearDays : Int = y * 365 + leaps;
    let mDays : Int = switch (month) {
      case 2 31; case 3 59; case 4 90; case 5 120;
      case 6 151; case 7 181; case 8 212; case 9 243;
      case 10 273; case 11 304; case 12 334; case _ 0;
    };
    (yearDays + mDays) * 86_400_000_000_000
  };

  // Subtract one month from (year, month)
  func prevMonth(year : Nat, month : Nat) : (Nat, Nat) {
    if (month == 1) { (if (year >= 1) { year - 1 } else { 0 }, 12) } else { (year, month - 1) }
  };

  // Filter transactions for a given org and year/month
  func txForMonth(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    year : Nat,
    month : Nat,
  ) : List.List<Transaction> {
    let startNs = ymToNs(year, month);
    let (ny, nm) = if (month == 12) { (year + 1, 1) } else { (year, month + 1) };
    let endNs = ymToNs(ny, nm);
    transactions.filter(func(tx : Transaction) : Bool {
      tx.orgId == orgId and tx.date >= startNs and tx.date < endNs
    })
  };

  func categoryToText(cat : Types.TransactionCategory) : Text {
    switch (cat) {
      case (#revenue)        "revenue";
      case (#travel)         "travel";
      case (#software)       "software";
      case (#equipment)      "equipment";
      case (#contractorFees) "contractorFees";
      case (#other)          "other";
    }
  };

  // ── Public API ───────────────────────────────────────────────────────────────

  // Add a new transaction for an org
  public func addTransaction(
    transactions : List.List<Transaction>,
    nextId : Nat,
    orgId : OrgId,
    caller : Principal,
    input : TransactionInput,
  ) : (Transaction, Nat) {
    let now = Time.now();
    let tx : Transaction = {
      id = nextId;
      orgId;
      amount = input.amount;
      category = input.category;
      date = input.date;
      description = input.description;
      reconciliation = #unreconciled;
      createdAt = now;
      createdBy = caller;
    };
    transactions.add(tx);
    (tx, nextId + 1)
  };

  // List transactions for an org with optional filters, returns ledger with running balance
  public func listTransactions(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    filter : TransactionFilter,
  ) : [LedgerEntry] {
    // Filter by org first, then apply optional filters
    let filtered = transactions.filter(func(tx : Transaction) : Bool {
      if (tx.orgId != orgId) { return false };
      switch (filter.category) {
        case (?cat) { if (tx.category != cat) { return false } };
        case null {};
      };
      switch (filter.fromDate) {
        case (?d) { if (tx.date < d) { return false } };
        case null {};
      };
      switch (filter.toDate) {
        case (?d) { if (tx.date > d) { return false } };
        case null {};
      };
      switch (filter.reconciled) {
        case (?true) {
          switch (tx.reconciliation) {
            case (#reconciled _) {};
            case (#unreconciled) { return false };
          };
        };
        case (?false) {
          switch (tx.reconciliation) {
            case (#unreconciled) {};
            case (#reconciled _) { return false };
          };
        };
        case null {};
      };
      true
    });
    // Sort by date ascending
    let sorted = filtered.sort(func(a : Transaction, b : Transaction) : { #less; #equal; #greater } {
      if (a.date < b.date) { #less }
      else if (a.date > b.date) { #greater }
      else { #equal }
    });
    // Build running balance
    var balance : Int = 0;
    sorted.map<Transaction, LedgerEntry>(func(tx : Transaction) : LedgerEntry {
      balance += tx.amount;
      { transaction = tx; runningBalance = balance }
    }).toArray()
  };

  // Reconcile a transaction with a bank reference
  public func reconcileTransaction(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    transactionId : Nat,
    bankRef : Text,
  ) : Bool {
    var found = false;
    transactions.mapInPlace(func(tx : Transaction) : Transaction {
      if (tx.id == transactionId and tx.orgId == orgId) {
        found := true;
        { tx with reconciliation = #reconciled bankRef }
      } else { tx }
    });
    found
  };

  // Get monthly summary for a specific year/month
  public func getMonthlySummary(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    year : Nat,
    month : Nat,
  ) : MonthlySummary {
    let txs = txForMonth(transactions, orgId, year, month);
    var income : Nat = 0;
    var expenses : Nat = 0;
    txs.forEach(func(tx : Transaction) {
      if (tx.amount > 0) {
        income += Int.abs(tx.amount)
      } else {
        expenses += Int.abs(tx.amount)
      }
    });
    let net : Int = income.toInt() - expenses.toInt();
    { year; month; income; expenses; net }
  };

  // Get monthly revenue trend for past 12 months (oldest first)
  public func getMonthlyRevenueTrend(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    nowNs : Int,
  ) : [MonthlyRevenue] {
    let (curYear, curMonth) = nsToYearMonth(nowNs);
    let result = List.empty<MonthlyRevenue>();
    // Walk back 11 months, compute each, collect in reverse, then reverse
    var y = curYear;
    var m = curMonth;
    var i = 0;
    while (i < 12) {
      let txs = txForMonth(transactions, orgId, y, m);
      var revenue : Nat = 0;
      var expenses : Nat = 0;
      txs.forEach(func(tx : Transaction) {
        if (tx.amount > 0) { revenue += Int.abs(tx.amount) }
        else { expenses += Int.abs(tx.amount) }
      });
      result.add({ year = y; month = m; revenue; expenses });
      let (py, pm) = prevMonth(y, m);
      y := py;
      m := pm;
      i += 1;
    };
    // result is newest-first; reverse to oldest-first using array-based approach
    let arr = result.toArray();
    arr.reverse()
  };

  // Get expense breakdown by category for current month
  public func getExpensesByCategory(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    nowNs : Int,
  ) : [CategoryExpense] {
    let (year, month) = nsToYearMonth(nowNs);
    let txs = txForMonth(transactions, orgId, year, month);
    // Accumulate by category
    var travel : Nat = 0;
    var software : Nat = 0;
    var equipment : Nat = 0;
    var contractor : Nat = 0;
    var other : Nat = 0;
    txs.forEach(func(tx : Transaction) {
      if (tx.amount < 0) {
        let amt = Int.abs(tx.amount);
        switch (tx.category) {
          case (#travel) { travel += amt };
          case (#software) { software += amt };
          case (#equipment) { equipment += amt };
          case (#contractorFees) { contractor += amt };
          case (#other or #revenue) { other += amt };
        };
      }
    });
    [
      { category = #travel; amount = travel },
      { category = #software; amount = software },
      { category = #equipment; amount = equipment },
      { category = #contractorFees; amount = contractor },
      { category = #other; amount = other },
    ]
  };

  // Build the full finance dashboard
  public func buildDashboard(
    transactions : List.List<Transaction>,
    budgets : List.List<Budget>,
    orgId : OrgId,
    nowNs : Int,
  ) : FinanceDashboard {
    let (year, month) = nsToYearMonth(nowNs);
    let (prevY, prevM) = prevMonth(year, month);

    // Revenue MTD — sum of positive transactions this month
    let txsMTD = txForMonth(transactions, orgId, year, month);
    var revenueMTD : Nat = 0;
    var spentMTD : Nat = 0;
    txsMTD.forEach(func(tx : Transaction) {
      if (tx.amount > 0) {
        revenueMTD += Int.abs(tx.amount)
      } else {
        spentMTD += Int.abs(tx.amount)
      }
    });

    // MRR = revenue MTD (simple approximation)
    let mrr = revenueMTD;

    // Previous month revenue for growth calculation
    let txsPrev = txForMonth(transactions, orgId, prevY, prevM);
    var revenuePrev : Nat = 0;
    txsPrev.forEach(func(tx : Transaction) {
      if (tx.amount > 0) { revenuePrev += Int.abs(tx.amount) }
    });

    // Growth % in basis points (100 = 1%). Avoid div by zero.
    let revenueGrowthPct : Int = if (revenuePrev == 0) {
      if (revenueMTD > 0) { 10000 } else { 0 }
    } else {
      ((revenueMTD.toInt() - revenuePrev.toInt()) * 10000) / revenuePrev.toInt()
    };

    // Budget: sum allocated budgets active this month
    let startNs = ymToNs(year, month);
    let (ny, nm) = if (month == 12) { (year + 1, 1) } else { (year, month + 1) };
    let endNs = ymToNs(ny, nm);
    var budgetAllocated : Nat = 0;
    budgets.filter(func(b : Budget) : Bool {
      b.orgId == orgId and b.periodStart < endNs and b.periodEnd > startNs
    }).forEach(func(b : Budget) {
      budgetAllocated += b.allocated
    });
    let budgetSpent = spentMTD;
    let budgetRemaining : Int = budgetAllocated.toInt() - budgetSpent.toInt();
    let budgetUtilizationPct : Nat = if (budgetAllocated == 0) {
      0
    } else {
      (budgetSpent * 10000) / budgetAllocated
    };

    let expensesByCategory = getExpensesByCategory(transactions, orgId, nowNs);
    let monthlyRevenueTrend = getMonthlyRevenueTrend(transactions, orgId, nowNs);

    {
      revenueMTD;
      mrr;
      revenueGrowthPct;
      budgetAllocated;
      budgetSpent;
      budgetRemaining;
      budgetUtilizationPct;
      expensesByCategory;
      monthlyRevenueTrend;
    }
  };

  // Get 90-day cash flow forecast using trailing 30-day average daily cash flow
  public func getCashFlowForecast(
    transactions : List.List<Transaction>,
    orgId : OrgId,
    nowNs : Int,
  ) : [CashFlowForecast] {
    let orgTxs = transactions.filter(func(tx : Transaction) : Bool { tx.orgId == orgId });
    var currentBalance : Int = 0;
    orgTxs.forEach(func(tx : Transaction) { currentBalance += tx.amount });
    let thirtyDaysNs : Int = 30 * 86400 * 1_000_000_000;
    let fromNs = nowNs - thirtyDaysNs;
    var trailingNet : Int = 0;
    orgTxs.forEach(func(tx : Transaction) {
      if (tx.date >= fromNs and tx.date <= nowNs) { trailingNet += tx.amount }
    });
    let dailyAvg : Int = trailingNet / 30;
    let dayNs : Int = 86400 * 1_000_000_000;
    let buf = List.empty<CashFlowForecast>();
    var d : Int = 1;
    while (d <= 90) {
      buf.add({ date = nowNs + d * dayNs; projectedBalance = currentBalance + d * dailyAvg });
      d += 1;
    };
    buf.toArray()
  };

  // Upsert a budget for an org/category/period
  public func setBudget(
    budgets : List.List<Budget>,
    nextId : Nat,
    orgId : OrgId,
    input : BudgetInput,
  ) : (Budget, Nat) {
    let now = Time.now();
    // Check if a budget for this org/category/period already exists
    switch (budgets.findIndex(func(b : Budget) : Bool {
      b.orgId == orgId and b.category == input.category and
      b.periodStart == input.periodStart and b.periodEnd == input.periodEnd
    })) {
      case (?idx) {
        let existing = budgets.at(idx);
        let updated : Budget = { existing with allocated = input.allocated };
        budgets.put(idx, updated);
        (updated, nextId)
      };
      case null {
        let b : Budget = {
          id = nextId;
          orgId;
          category = input.category;
          allocated = input.allocated;
          periodStart = input.periodStart;
          periodEnd = input.periodEnd;
          createdAt = now;
        };
        budgets.add(b);
        (b, nextId + 1)
      };
    }
  };

  // List budgets for an org
  public func listBudgets(
    budgets : List.List<Budget>,
    orgId : OrgId,
  ) : [Budget] {
    budgets.filter(func(b : Budget) : Bool { b.orgId == orgId }).toArray()
  };

  // Bulk import transactions from parsed CSV rows
  // Row format: [amount_cents, category, date_iso_ms, description]
  public func bulkImport(
    transactions : List.List<Transaction>,
    nextId : Nat,
    orgId : OrgId,
    caller : Principal,
    rows : [[Text]],
  ) : (Nat, Nat, Nat) {
    var imported : Nat = 0;
    var skipped : Nat = 0;
    var currentId = nextId;
    let now = Time.now();
    for (row in rows.values()) {
      if (row.size() < 4) {
        skipped += 1;
      } else {
        let amountText = row[0];
        let categoryText = row[1];
        let dateText = row[2];
        let description = row[3];
        // Parse amount
        let maybeAmount = Int.fromText(amountText);
        // Parse date (milliseconds since epoch → nanoseconds)
        let maybeDate = Int.fromText(dateText);
        // Parse category
        let maybeCategory : ?Types.TransactionCategory = switch (categoryText) {
          case "revenue" { ?#revenue };
          case "travel" { ?#travel };
          case "software" { ?#software };
          case "equipment" { ?#equipment };
          case "contractorFees" { ?#contractorFees };
          case "other" { ?#other };
          case _ { null };
        };
        switch (maybeAmount, maybeDate, maybeCategory) {
          case (?amount, ?dateMs, ?category) {
            let dateNs = dateMs * 1_000_000; // ms → ns
            let tx : Transaction = {
              id = currentId;
              orgId;
              amount;
              category;
              date = dateNs;
              description;
              reconciliation = #unreconciled;
              createdAt = now;
              createdBy = caller;
            };
            transactions.add(tx);
            currentId += 1;
            imported += 1;
          };
          case _ { skipped += 1 };
        };
      }
    };
    (imported, skipped, currentId)
  };

  // ── Accounting exports ───────────────────────────────────────────────────────

  // Export transactions as Tally-compatible XML (Pro+ only)
  public func exportAccountingTally(
    transactions : List.List<Transaction>,
    orgId        : OrgId,
    fromDate     : Int,
    toDate       : Int,
    getOrgPlan   : PlanChecker,
  ) : Text {
    let plan = switch (getOrgPlan(orgId)) {
      case (?p) p;
      case null Runtime.trap("Finance: no subscription found for org " # orgId.toText());
    };
    switch (plan) {
      case (#free) Runtime.trap("Finance: Tally export requires Pro or Enterprise plan for org " # orgId.toText());
      case _ {};
     };

    let filtered = transactions.filter(func(tx : Transaction) : Bool {
      tx.orgId == orgId and tx.date >= fromDate and tx.date <= toDate
    }).toArray();

    let parts = List.empty<Text>();
    parts.add("<?xml version=\"1.0\"?><ENVELOPE><BODY><IMPORTDATA><REQUESTDATA>");
    for (tx in filtered.values()) {
      let d = (Int.abs(tx.date) / 1_000_000_000).toText();
      parts.add("<TALLYMESSAGE><VOUCHER><DATE>" # d # "</DATE><TYPE>" # categoryToText(tx.category) # "</TYPE><NOTE>" # tx.description # "</NOTE><AMT>" # tx.amount.toText() # "</AMT></VOUCHER></TALLYMESSAGE>");
    };
    parts.add("</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>");
    parts.values().join("")
  };

  // Export transactions as CSV (Pro+ only)
  public func exportAccountingExcel(
    transactions : List.List<Transaction>,
    orgId        : OrgId,
    fromDate     : Int,
    toDate       : Int,
    getOrgPlan   : PlanChecker,
  ) : Text {
    let plan = switch (getOrgPlan(orgId)) {
      case (?p) p;
      case null Runtime.trap("Finance: no subscription found for org " # orgId.toText());
    };
    switch (plan) {
      case (#free) Runtime.trap("Finance: Excel export requires Pro or Enterprise plan for org " # orgId.toText());
      case _ {};
    };

    let filtered = transactions.filter(func(tx : Transaction) : Bool {
      tx.orgId == orgId and tx.date >= fromDate and tx.date <= toDate
    }).toArray();

    let rows = List.empty<Text>();
    rows.add("Date,Cat,Desc,Amt,Tax\n");
    for (tx in filtered.values()) {
      let d = (Int.abs(tx.date) / 1_000_000_000).toText();
      let t = if (tx.amount >= 0) { "I" } else { "E" };
      let desc = tx.description.replace(#text ",", ";");
      let tax : Int = if (tx.amount < 0) { (Int.abs(tx.amount) * 18) / 100 } else { 0 };
      rows.add(d # "," # t # "," # categoryToText(tx.category) # "," # desc # "," # tx.amount.toText() # "," # tax.toText() # "\n");
    };
    rows.values().join("")
  };
};
