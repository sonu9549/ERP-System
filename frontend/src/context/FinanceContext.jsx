// src/context/FinanceContext.js
import { createContext, useContext, useState, useEffect, useMemo } from "react";
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
} from "../data/data";

/* -------------------------------------------------------------------------- */
/*                             FINANCE CONTEXT                                */
/* -------------------------------------------------------------------------- */
const FinanceContext = createContext();

export const FinanceProvider = ({ children, sharedState }) => {
  const {
    customers: sharedCustomers,
    setCustomers: setSharedCustomers,
    auditLogs,
    setAuditLogs,
    logAudit,
  } = sharedState || {};

  /* --------------------------- LOCAL STORAGE HELPERS --------------------------- */
  const load = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  };

  const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  /* --------------------------- STATE (Persisted) --------------------------- */
  const [chartOfAccounts, setChartOfAccounts] = useState(() =>
    load("coa", sampleChartOfAccounts)
  );
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

  /* --------------------------- AUTO-SAVE TO LOCALSTORAGE --------------------------- */
  useEffect(() => {
    const saveAll = () => {
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
    };

    saveAll();
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
  ]);

  /* --------------------------- CURRENCY FORMATTER --------------------------- */
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  /* --------------------------- ACCOUNT LOOKUP MAP --------------------------- */
  const accountsMap = useMemo(() => {
    const map = {};
    chartOfAccounts.forEach((a) => (map[a.name] = a));
    return map;
  }, [chartOfAccounts]);

  const getAccount = (name) => accountsMap[name];

  /* --------------------------- UNIVERSAL GL POSTING (Tally-style) --------------------------- */
  const postToGL = (
    debitAccountName,
    creditAccountName,
    amount,
    description,
    ref = "",
    date = new Date().toISOString().split("T")[0]
  ) => {
    const debitAcc = getAccount(debitAccountName);
    const creditAcc = getAccount(creditAccountName);

    if (!debitAcc || !creditAcc) {
      console.error(
        `Account not found: ${debitAccountName} or ${creditAccountName}`
      );
      return null;
    }

    const newEntry = {
      id: `gl-${Date.now()}`,
      date,
      ref: ref || `GL-${Date.now()}`,
      description,
      lines: [
        {
          accountId: debitAcc.id,
          account: debitAcc.name,
          debit: amount,
          credit: 0,
        },
        {
          accountId: creditAcc.id,
          account: creditAcc.name,
          debit: 0,
          credit: amount,
        },
      ],
    };

    setJournalEntries((prev) => [...prev, newEntry]);

    // Update account balances
    setChartOfAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === debitAcc.id)
          return { ...acc, balance: (acc.balance || 0) + amount };
        if (acc.id === creditAcc.id)
          return { ...acc, balance: (acc.balance || 0) - amount };
        return acc;
      })
    );

    // Audit log (via shared)
    if (logAudit) {
      logAudit(
        "GL Entry",
        `${description} | ${formatCurrency(
          amount
        )} | ${debitAccountName} → ${creditAccountName}`
      );
    }

    return newEntry;
  };

  /* --------------------------- QUICK FINANCE ACTIONS --------------------------- */
  const createInvoice = (
    vendorId,
    amount,
    items = [],
    date = new Date().toISOString().split("T")[0]
  ) => {
    const invoice = {
      id: `inv-${Date.now()}`,
      vendorId,
      amount,
      items,
      date,
      status: "Unpaid",
    };
    setInvoices((prev) => [...prev, invoice]);
    postToGL(
      "Expenses",
      "Accounts Payable",
      amount,
      `Invoice #${invoice.id}`,
      invoice.id,
      date
    );
    if (logAudit) {
      logAudit("AP Invoice", `₹${amount} from Vendor #${vendorId}`);
    }
    return invoice;
  };

  const recordPayment = (
    invoiceId,
    amount,
    date = new Date().toISOString().split("T")[0]
  ) => {
    const payment = { id: `pay-${Date.now()}`, invoiceId, amount, date };
    setPayments((prev) => [...prev, payment]);
    postToGL(
      "Accounts Payable",
      "Cash",
      amount,
      `Payment for #${invoiceId}`,
      payment.id,
      date
    );
    if (logAudit) {
      logAudit("AP Payment", `₹${amount} for Invoice #${invoiceId}`);
    }
  };

  const receiveFromCustomer = (
    customerId,
    amount,
    arInvoiceId,
    date = new Date().toISOString().split("T")[0]
  ) => {
    const receipt = {
      id: `rec-${Date.now()}`,
      customerId,
      arInvoiceId,
      amount,
      date,
    };
    setReceipts((prev) => [...prev, receipt]);
    postToGL(
      "Cash",
      "Accounts Receivable",
      amount,
      `Receipt from Customer #${customerId}`,
      receipt.id,
      date
    );
    if (logAudit) {
      logAudit("AR Receipt", `₹${amount} from Customer #${customerId}`);
    }
  };

  /* --------------------------- ACCOUNT BALANCE HELPER --------------------------- */
  const getBalance = (accountName, { fromDate, toDate } = {}) => {
    const account = getAccount(accountName);
    if (!account) return 0;

    return journalEntries
      .filter((e) => {
        if (fromDate && e.date < fromDate) return false;
        if (toDate && e.date > toDate) return false;
        return true;
      })
      .flatMap((e) => e.lines)
      .filter((l) => l.accountId === account.id)
      .reduce((sum, l) => sum + l.debit - l.credit, account.opening || 0);
  };

  /* --------------------------- BRANCHES & COST CENTERS --------------------------- */
  const branches = ["All", "HQ", "Mumbai", "Delhi", "Bangalore"];
  const allCostCenters = useMemo(() => {
    const fromMaster = costCenters.map((c) => c.name);
    const fromEntries = journalEntries
      .flatMap((e) => e.lines.map((l) => l.costCenter))
      .filter(Boolean);
    return [...new Set([...fromMaster, ...fromEntries])];
  }, [costCenters, journalEntries]);

  /* -------------------------------------------------------------------------- */
  /*                               CONTEXT VALUE                                */
  /* -------------------------------------------------------------------------- */
  return (
    <FinanceContext.Provider
      value={{
        // === DATA ===
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

        // === SHARED ACCESS ===
        customers: sharedCustomers ?? [],
        setCustomers: setSharedCustomers,

        // === ACTIONS ===
        postToGL,
        createInvoice,
        recordPayment,
        receiveFromCustomer,

        // === HELPERS ===
        formatCurrency,
        getAccount,
        getBalance,
        branches,
        allCostCenters,

        // === QUICK ACCESS ===
        cash: getAccount("Cash"),
        bank: getAccount("Bank"),
        salesAccount: getAccount("Sales"),
        ap: getAccount("Accounts Payable"),
        ar: getAccount("Accounts Receivable"),
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                               USE FINANCE HOOK                             */
/* -------------------------------------------------------------------------- */
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return context;
};
