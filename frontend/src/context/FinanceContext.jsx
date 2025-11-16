// src/context/FinanceContext.js
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  sampleChartOfAccounts,
  sampleVendors,
  sampleInvoices,
  sampleJournalEntries,
  defaultPayments,
  defaultCustomers,
  defaultArInvoices,
  defaultReceipts,
  defaultBudgets,
  defaultCostCenters,
  initialFinanceData,
  initialBankAccounts,
  initialBankTransactions,
  initialBankDeposits,
  initialCashFlowCategories,
} from "../data/data";

const FinanceContext = createContext();

// Validation schemas
const ACCOUNT_TYPES = [
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expense",
  "Bank",
  "Cash",
];
const ENTRY_STATUSES = ["draft", "posted", "void", "reconciled"];

// Utility functions
const generateId = (prefix = "") =>
  `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const isValidDate = (dateString) => !isNaN(Date.parse(dateString));
const roundCurrency = (amount) => Math.round(amount * 100) / 100;

export const FinanceProvider = ({ children, sharedState }) => {
  const [bankDeposits, setBankDeposits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const {
    customers: sharedCustomers = [],
    setCustomers: setSharedCustomers,
    logAudit: sharedLogAudit,
    user,
  } = sharedState || {};
  // Bank & Cash Management states with proper initialization
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts || []);
  const [bankTransactions, setBankTransactions] = useState(
    initialBankTransactions || []
  );
  const [cashFlowCategories, setCashFlowCategories] = useState(
    initialCashFlowCategories || []
  );

  /* --------------------------- LOCAL STORAGE HELPERS --------------------------- */
  const load = useCallback((key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed !== null ? parsed : fallback;
      }
      return fallback;
    } catch (err) {
      console.warn(`[FinanceContext] Failed to load ${key}:`, err);
      return fallback;
    }
  }, []);

  const save = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`[FinanceContext] Failed to save ${key}:`, err);
    }
  }, []);

  /* --------------------------- STATE (Persisted) --------------------------- */
  const [chartOfAccounts, setChartOfAccounts] = useState(() => {
    const saved = load("coa", []);
    return saved.length > 0 ? saved : sampleChartOfAccounts;
  });

  const [journalEntries, setJournalEntries] = useState(() =>
    load("entries", sampleJournalEntries)
  );

  const [vendors, setVendors] = useState(() => load("vendors", sampleVendors));
  const [invoices, setInvoices] = useState(() =>
    load("invoices", sampleInvoices)
  );
  const [payments, setPayments] = useState(() =>
    load("payments", defaultPayments)
  );
  const [arInvoices, setArInvoices] = useState(() =>
    load("arInvoices", defaultArInvoices)
  );
  const [receipts, setReceipts] = useState(() =>
    load("receipts", defaultReceipts)
  );
  const [budgets, setBudgets] = useState(() => load("budgets", defaultBudgets));
  const [costCenters, setCostCenters] = useState(() =>
    load("costCenters", defaultCostCenters)
  );
  const [fixedAssets, setFixedAssets] = useState(() => load("assets", []));
  const [financeData, setFinanceData] = useState(() =>
    load("financeData", initialFinanceData)
  );
  const [auditLogs, setAuditLogs] = useState(() => load("auditLogs", []));

  /* --------------------------- AUTO-SAVE TO LOCALSTORAGE --------------------------- */
  useEffect(() => {
    save("coa", chartOfAccounts);
    save("entries", journalEntries);
    save("vendors", vendors);
    save("invoices", invoices);
    save("payments", payments);
    save("arInvoices", arInvoices);
    save("receipts", receipts);
    save("budgets", budgets);
    save("costCenters", costCenters);
    save("assets", fixedAssets);
    save("financeData", financeData);
    save("auditLogs", auditLogs);
  }, [
    chartOfAccounts,
    journalEntries,
    vendors,
    invoices,
    payments,
    arInvoices,
    receipts,
    budgets,
    costCenters,
    fixedAssets,
    financeData,
    auditLogs,
  ]);

  /* --------------------------- CURRENCY FORMATTER --------------------------- */
  const formatCurrency = useCallback(
    (amount) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount || 0),
    []
  );

  /* --------------------------- AUDIT LOGGING --------------------------- */
  const logAudit = useCallback(
    (action, details = {}) => {
      const log = {
        id: generateId("audit-"),
        timestamp: new Date().toISOString(),
        action,
        user: user?.email || "Unknown",
        details:
          typeof details === "object" ? details : { message: String(details) },
      };

      setAuditLogs((prev) => [...prev.slice(-999), log]); // Keep last 1000 logs

      // Also log to shared audit if available
      if (sharedLogAudit) {
        sharedLogAudit(action, details);
      }
    },
    [user, sharedLogAudit]
  );

  /* --------------------------- ACCOUNT MANAGEMENT --------------------------- */
  const accountsMap = useMemo(() => {
    const map = {};
    chartOfAccounts.forEach((a) => {
      map[a.id] = a;
      map[a.name] = a;
      if (a.code) map[a.code] = a;
    });
    return map;
  }, [chartOfAccounts]);

  const getAccount = useCallback(
    (idOrNameOrCode) => {
      if (!idOrNameOrCode) return null;
      const key = String(idOrNameOrCode).trim();

      // Direct map lookup
      const account = accountsMap[key];
      if (account) return account;

      const lowerKey = key.toLowerCase();

      for (const acc of chartOfAccounts) {
        const idStr = String(acc.id);
        const nameStr = String(acc.name || "");
        const codeStr = String(acc.code || "");

        if (
          idStr === key ||
          nameStr.toLowerCase() === lowerKey ||
          codeStr.toLowerCase() === lowerKey
        ) {
          return acc;
        }
      }

      console.warn(`[FinanceContext] Account not found: "${key}"`);
      return null;
    },
    [accountsMap, chartOfAccounts]
  );

  const validateAccount = useCallback((account) => {
    const errors = [];

    if (!account.id) errors.push("Account ID is required");
    if (!account.name || account.name.trim() === "")
      errors.push("Account name is required");
    if (!account.type || !ACCOUNT_TYPES.includes(account.type)) {
      errors.push(`Account type must be one of: ${ACCOUNT_TYPES.join(", ")}`);
    }
    if (account.opening && typeof account.opening !== "number")
      errors.push("Opening balance must be a number");
    if (account.balance && typeof account.balance !== "number")
      errors.push("Balance must be a number");

    return errors;
  }, []);

  const createAccount = useCallback(
    (accountData) => {
      const validationErrors = validateAccount(accountData);
      if (validationErrors.length > 0) {
        throw new Error(
          `Account validation failed: ${validationErrors.join(", ")}`
        );
      }

      const newAccount = {
        id: generateId("acc-"),
        opening: 0,
        balance: 0,
        ...accountData,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "system",
      };

      setChartOfAccounts((prev) => [...prev, newAccount]);
      logAudit("Account Created", newAccount);
      return newAccount;
    },
    [validateAccount, user, logAudit]
  );

  const updateAccount = useCallback(
    (accountId, updates) => {
      const existingAccount = chartOfAccounts.find(
        (acc) => acc.id === accountId
      );
      if (!existingAccount) throw new Error("Account not found");

      const updatedAccount = { ...existingAccount, ...updates };
      const validationErrors = validateAccount(updatedAccount);
      if (validationErrors.length > 0) {
        throw new Error(
          `Account validation failed: ${validationErrors.join(", ")}`
        );
      }

      setChartOfAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? {
                ...acc,
                ...updates,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email,
              }
            : acc
        )
      );

      logAudit("Account Updated", { accountId, updates });
      return true;
    },
    [chartOfAccounts, user, logAudit, validateAccount]
  );

  const deleteAccount = useCallback(
    (accountId) => {
      const account = chartOfAccounts.find((acc) => acc.id === accountId);
      if (!account) throw new Error("Account not found");

      // Check if account has transactions
      const hasTransactions = journalEntries.some((entry) =>
        entry.lines.some((line) => line.accountId === accountId)
      );

      if (hasTransactions) {
        throw new Error("Cannot delete account with existing transactions");
      }

      setChartOfAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
      logAudit("Account Deleted", account);
      return true;
    },
    [chartOfAccounts, journalEntries, logAudit]
  );

  /* --------------------------- JOURNAL ENTRIES MANAGEMENT --------------------------- */
  const validateJournalEntry = useCallback((entry) => {
    const errors = [];

    if (!entry.date || !isValidDate(entry.date))
      errors.push("Valid date is required");
    if (
      !entry.lines ||
      !Array.isArray(entry.lines) ||
      entry.lines.length === 0
    ) {
      errors.push("Journal entry must have at least one line");
    }

    if (entry.lines) {
      const totalDebit = entry.lines.reduce(
        (sum, line) => sum + (line.debit || 0),
        0
      );
      const totalCredit = entry.lines.reduce(
        (sum, line) => sum + (line.credit || 0),
        0
      );

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.push(
          `Journal entry not balanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`
        );
      }

      entry.lines.forEach((line, index) => {
        if (!line.accountId)
          errors.push(`Line ${index + 1}: Account ID is required`);
        if (typeof line.debit !== "number" || typeof line.credit !== "number") {
          errors.push(`Line ${index + 1}: Debit and credit must be numbers`);
        }
        if (line.debit < 0 || line.credit < 0) {
          errors.push(`Line ${index + 1}: Debit and credit cannot be negative`);
        }
      });
    }

    return errors;
  }, []);

  const createJournalEntry = useCallback(
    (entryData) => {
      const validationErrors = validateJournalEntry(entryData);
      if (validationErrors.length > 0) {
        throw new Error(
          `Journal entry validation failed: ${validationErrors.join(", ")}`
        );
      }

      const newEntry = {
        id: generateId("je-"),
        status: "posted",
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "system",
        ...entryData,
      };

      setJournalEntries((prev) => [...prev, newEntry]);

      // Update account balances
      setChartOfAccounts((prev) =>
        prev.map((account) => {
          const entryLines = newEntry.lines.filter(
            (line) => line.accountId === account.id
          );
          if (entryLines.length === 0) return account;

          const netChange = entryLines.reduce(
            (sum, line) => sum + line.debit - line.credit,
            0
          );
          return {
            ...account,
            balance: roundCurrency((account.balance || 0) + netChange),
            updatedAt: new Date().toISOString(),
          };
        })
      );

      logAudit("Journal Entry Created", newEntry);
      return newEntry;
    },
    [validateJournalEntry, user, logAudit]
  );

  const updateJournalEntry = useCallback(
    (entryId, updates) => {
      const existingEntry = journalEntries.find(
        (entry) => entry.id === entryId
      );
      if (!existingEntry) throw new Error("Journal entry not found");

      if (existingEntry.status === "posted") {
        throw new Error("Cannot modify posted journal entry");
      }

      const updatedEntry = { ...existingEntry, ...updates };
      const validationErrors = validateJournalEntry(updatedEntry);
      if (validationErrors.length > 0) {
        throw new Error(
          `Journal entry validation failed: ${validationErrors.join(", ")}`
        );
      }

      setJournalEntries((prev) =>
        prev.map((entry) => (entry.id === entryId ? updatedEntry : entry))
      );

      logAudit("Journal Entry Updated", { entryId, updates });
      return updatedEntry;
    },
    [journalEntries, validateJournalEntry, logAudit]
  );

  const voidJournalEntry = useCallback(
    (entryId) => {
      setJournalEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                status: "void",
                voidedAt: new Date().toISOString(),
                voidedBy: user?.email,
              }
            : entry
        )
      );

      logAudit("Journal Entry Voided", { entryId });
      return true;
    },
    [user, logAudit]
  );

  /* --------------------------- UNIVERSAL GL POSTING --------------------------- */
  const postToGL = useCallback(
    (
      debitAccountIdOrName,
      creditAccountIdOrName,
      amount,
      description,
      ref = "",
      date = new Date().toISOString().split("T")[0],
      costCenter = null
    ) => {
      if (!amount || amount <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      const debitAcc = debitAccountIdOrName
        ? getAccount(debitAccountIdOrName)
        : null;
      const creditAcc = creditAccountIdOrName
        ? getAccount(creditAccountIdOrName)
        : null;

      if (!debitAcc && !creditAcc) {
        throw new Error("At least one account must be provided");
      }

      const lines = [];
      if (debitAcc)
        lines.push({
          accountId: debitAcc.id,
          debit: amount,
          credit: 0,
          costCenter,
        });
      if (creditAcc)
        lines.push({
          accountId: creditAcc.id,
          debit: 0,
          credit: amount,
          costCenter,
        });

      const entry = {
        date,
        ref: ref || `JE-${Date.now().toString().slice(-6)}`,
        desc: description || "Journal Entry",
        lines,
      };

      return createJournalEntry(entry);
    },
    [getAccount, createJournalEntry]
  );

  /* --------------------------- BALANCE CALCULATIONS --------------------------- */
  const getBalance = useCallback(
    (accountIdOrName, { fromDate, toDate } = {}) => {
      const account = getAccount(accountIdOrName);
      if (!account) return 0;

      const opening = account.opening || 0;

      const relevantEntries = journalEntries
        .filter((entry) => entry.status !== "void")
        .filter((entry) => {
          if (fromDate && entry.date < fromDate) return false;
          if (toDate && entry.date > toDate) return false;
          return true;
        });

      const balanceChange = relevantEntries
        .flatMap((entry) => entry.lines)
        .filter((line) => line.accountId === account.id)
        .reduce((sum, line) => sum + line.debit - line.credit, 0);

      return roundCurrency(opening + balanceChange);
    },
    [journalEntries, getAccount]
  );

  const getAccountBalance = useCallback(
    (accountIdOrName) => {
      const account = getAccount(accountIdOrName);
      return account ? account.balance || 0 : 0;
    },
    [getAccount]
  );

  /* --------------------------- FINANCIAL REPORTS --------------------------- */
  const getTrialBalance = useCallback(
    (asOfDate = new Date().toISOString().split("T")[0]) => {
      const trialBalance = chartOfAccounts.map((account) => {
        const balance = getBalance(account.id, { toDate: asOfDate });
        return {
          account: account.name,
          code: account.code,
          type: account.type,
          debit: balance > 0 ? balance : 0,
          credit: balance < 0 ? Math.abs(balance) : 0,
        };
      });

      const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
      const totalCredit = trialBalance.reduce(
        (sum, acc) => sum + acc.credit,
        0
      );

      return {
        data: trialBalance,
        totalDebit: roundCurrency(totalDebit),
        totalCredit: roundCurrency(totalCredit),
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        asOfDate,
      };
    },
    [chartOfAccounts, getBalance]
  );

  const getProfitAndLoss = useCallback(
    (fromDate, toDate) => {
      const revenueAccounts = chartOfAccounts.filter(
        (acc) => acc.type === "Income"
      );
      const expenseAccounts = chartOfAccounts.filter(
        (acc) => acc.type === "Expense"
      );

      const revenue = revenueAccounts.reduce(
        (sum, acc) => sum + getBalance(acc.id, { fromDate, toDate }),
        0
      );

      const expenses = expenseAccounts.reduce(
        (sum, acc) => sum + getBalance(acc.id, { fromDate, toDate }),
        0
      );

      const grossProfit = revenue - expenses;

      return {
        revenue: roundCurrency(revenue),
        expenses: roundCurrency(expenses),
        grossProfit: roundCurrency(grossProfit),
        margin: revenue ? roundCurrency((grossProfit / revenue) * 100) : 0,
        period: { fromDate, toDate },
      };
    },
    [chartOfAccounts, getBalance]
  );

  const getBalanceSheet = useCallback(
    (asOfDate = new Date().toISOString().split("T")[0]) => {
      const assets = chartOfAccounts
        .filter((acc) => acc.type === "Asset")
        .map((acc) => ({
          ...acc,
          balance: getBalance(acc.id, { toDate: asOfDate }),
        }));

      const liabilities = chartOfAccounts
        .filter((acc) => acc.type === "Liability")
        .map((acc) => ({
          ...acc,
          balance: getBalance(acc.id, { toDate: asOfDate }),
        }));

      const equity = chartOfAccounts
        .filter((acc) => acc.type === "Equity")
        .map((acc) => ({
          ...acc,
          balance: getBalance(acc.id, { toDate: asOfDate }),
        }));

      const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
      const totalLiabilities = liabilities.reduce(
        (sum, acc) => sum + acc.balance,
        0
      );
      const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

      return {
        assets: {
          items: assets,
          total: roundCurrency(totalAssets),
        },
        liabilities: {
          items: liabilities,
          total: roundCurrency(totalLiabilities),
        },
        equity: {
          items: equity,
          total: roundCurrency(totalEquity),
        },
        isBalanced:
          Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        asOfDate,
      };
    },
    [chartOfAccounts, getBalance]
  );

  /* --------------------------- QUICK ACCOUNTS --------------------------- */
  const quickAccounts = useMemo(() => {
    return {
      cash: getAccount("Cash"),
      bank: getAccount("Bank"),
      salesAccount: getAccount("Sales"),
      ap: getAccount("Accounts Payable"),
      ar: getAccount("Accounts Receivable"),
    };
  }, [getAccount]);

  /* --------------------------- BRANCHES & COST CENTERS --------------------------- */
  const branches = ["All", "HQ", "Mumbai", "Delhi", "Bangalore"];

  const allCostCenters = useMemo(() => {
    const fromMaster = costCenters.map((c) => c.name);
    const fromEntries = journalEntries.flatMap((e) =>
      e.lines.map((l) => l.costCenter).filter(Boolean)
    );
    return [...new Set([...fromMaster, ...fromEntries])].sort();
  }, [costCenters, journalEntries]);

  // Bank & Cash Management Functions
  const addBankAccount = (accountData) => {
    const newAccount = {
      id: `ba${Date.now()}`,
      ...accountData,
      createdAt: new Date().toISOString(),
    };
    setBankAccounts((prev) => [...(prev || []), newAccount]);
    return newAccount;
  };

  const updateBankAccount = (accountId, updates) => {
    setBankAccounts((prev) =>
      (prev || []).map((account) =>
        account.id === accountId ? { ...account, ...updates } : account
      )
    );
  };

  const deleteBankAccount = (accountId) => {
    setBankAccounts((prev) =>
      (prev || []).filter((account) => account.id !== accountId)
    );
  };

  const addBankTransaction = (transactionData) => {
    const newTransaction = {
      id: `bt${Date.now()}`,
      ...transactionData,
      createdAt: new Date().toISOString(),
    };
    setBankTransactions((prev) => [...(prev || []), newTransaction]);

    // Update account balance with safe access
    const account = (bankAccounts || []).find(
      (acc) => acc.id === transactionData.accountId
    );
    if (account) {
      const balanceChange =
        transactionData.type === "deposit"
          ? transactionData.amount
          : -transactionData.amount;

      updateBankAccount(account.id, {
        balance: (account.balance || 0) + balanceChange,
        currentBalance: (account.currentBalance || 0) + balanceChange,
        availableBalance: (account.availableBalance || 0) + balanceChange,
      });
    }

    return newTransaction;
  };

  const reconcileTransaction = (transactionId) => {
    setBankTransactions((prev) =>
      (prev || []).map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, isReconciled: true }
          : transaction
      )
    );
  };

  const reconcileAccount = (accountId) => {
    setBankAccounts((prev) =>
      (prev || []).map((account) =>
        account.id === accountId
          ? {
              ...account,
              isReconciled: true,
              lastReconciled: new Date().toISOString().split("T")[0],
            }
          : account
      )
    );
  };

  const matchDepositToReceipt = (depositId, receiptId) => {
    setBankDeposits((prev) =>
      (prev || []).map((deposit) =>
        deposit.id === depositId
          ? {
              ...deposit,
              status: "matched",
              matchedReceipts: [...(deposit.matchedReceipts || []), receiptId],
            }
          : deposit
      )
    );
  };

  // Cash Flow Analysis with safe data access
  const getCashFlowData = useCallback(
    (period = "month") => {
      const now = new Date();
      let startDate, endDate;

      if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (period === "quarter") {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      } else {
        // year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }

      const periodTransactions = (bankTransactions || []).filter((t) => {
        if (!t || !t.date) return false;
        const transDate = new Date(t.date);
        return (
          transDate >= startDate &&
          transDate <= endDate &&
          t.status === "completed"
        );
      });

      const income = periodTransactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const expenses = periodTransactions
        .filter((t) => t.type === "withdrawal")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        income: income || 0,
        expenses: expenses || 0,
        netCashFlow: (income || 0) - (expenses || 0),
        transactions: periodTransactions.length,
      };
    },
    [bankTransactions]
  );

  // Get account by ID helper function
  const getAccountById = (accountId) => {
    return (bankAccounts || []).find((account) => account.id === accountId);
  };

  // Get transactions by account ID
  const getTransactionsByAccountId = (accountId) => {
    return (bankTransactions || []).filter(
      (transaction) => transaction.accountId === accountId
    );
  };

  /* --------------------------- CONTEXT VALUE --------------------------- */
  const value = useMemo(
    () => ({
      // Data
      chartOfAccounts,
      setChartOfAccounts,
      journalEntries,
      setJournalEntries,
      vendors,
      setVendors,
      invoices,
      setInvoices,
      payments,
      setPayments,
      arInvoices,
      setArInvoices,
      receipts,
      setReceipts,
      budgets,
      setBudgets,
      costCenters,
      setCostCenters,
      fixedAssets,
      setFixedAssets,
      financeData,
      setFinanceData,
      auditLogs,
      setAuditLogs,

      // Shared
      customers: sharedCustomers,
      setCustomers: setSharedCustomers,

      // Account Management
      getAccount,
      createAccount,
      updateAccount,
      deleteAccount,

      // Journal Entries
      createJournalEntry,
      updateJournalEntry,
      voidJournalEntry,

      // Core Actions
      postToGL,
      getBalance,
      getAccountBalance,
      formatCurrency,

      // Financial Reports
      getTrialBalance,
      getProfitAndLoss,
      getBalanceSheet,

      // Helpers
      branches,
      allCostCenters,

      // Quick Access Accounts
      ...quickAccounts,

      // Audit
      logAudit,

      // Validation
      validateAccount,
      validateJournalEntry,
    }),
    [
      chartOfAccounts,
      journalEntries,
      vendors,
      invoices,
      payments,
      arInvoices,
      receipts,
      budgets,
      costCenters,
      fixedAssets,
      financeData,
      auditLogs,
      sharedCustomers,
      setSharedCustomers,
      getAccount,
      createAccount,
      updateAccount,
      deleteAccount,
      createJournalEntry,
      updateJournalEntry,
      voidJournalEntry,
      postToGL,
      getBalance,
      getAccountBalance,
      formatCurrency,
      getTrialBalance,
      getProfitAndLoss,
      getBalanceSheet,
      branches,
      allCostCenters,
      quickAccounts,
      logAudit,
      validateAccount,
      validateJournalEntry,
      bankDeposits,
      setBankDeposits,
      receipts,
      setReceipts,
      arInvoices,
      setArInvoices,
      customers,
      setCustomers,
      // Bank & Cash Management data
      bankAccounts,
      bankTransactions,
      cashFlowCategories,

      // Bank & Cash Management functions
      addBankAccount,
      updateBankAccount,
      deleteBankAccount,
      addBankTransaction,
      reconcileTransaction,
      reconcileAccount,
      matchDepositToReceipt,
      getCashFlowData,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return context;
};

// Custom hooks for specific functionality
export const useAccounts = () => {
  const {
    chartOfAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,
  } = useFinance();

  return {
    accounts: chartOfAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,
  };
};

export const useJournal = () => {
  const {
    journalEntries,
    createJournalEntry,
    updateJournalEntry,
    voidJournalEntry,
    postToGL,
  } = useFinance();

  return {
    entries: journalEntries,
    createJournalEntry,
    updateJournalEntry,
    voidJournalEntry,
    postToGL,
  };
};

export const useFinancialReports = () => {
  const { getTrialBalance, getProfitAndLoss, getBalanceSheet } = useFinance();

  return {
    getTrialBalance,
    getProfitAndLoss,
    getBalanceSheet,
  };
};
