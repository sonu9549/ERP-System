// src/context/FinanceContext.js
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  sampleChartOfAccounts,
  sampleVendors,
  sampleInvoices,
  sampleJournalEntries,
  defaultPayments,
  defaultBankTransactions,
  defaultCustomers,
  defaultArInvoices,
  defaultReceipts,
  defaultBudgets,
  defaultCostCenters,
  initialFinanceData,
  sampleData, // ← Contains Loyalty + CRM sample data
} from "../data/data";

/* -------------------------------------------------------------------------- */
/*                             FINANCE CONTEXT                                */
/* -------------------------------------------------------------------------- */
const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
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
  const [customers, setCustomers] = useState(() =>
    load("customers", defaultCustomers)
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

  const [auditLogs, setAuditLogs] = useState(() =>
    load("audit", [
      {
        timestamp: new Date().toISOString(),
        action: "Finance System Started",
        user: "System",
        details: "Welcome to NextGen CRM + Finance!",
      },
    ])
  );

  /* --------------------------- CRM & LOYALTY STATE --------------------------- */
  // These are loaded from sampleData (data.js) and kept in sync with other modules
  const [leads, setLeads] = useState(() =>
    load("leads", sampleData.leads || [])
  );
  const [supportTickets, setTickets] = useState(() =>
    load("tickets", sampleData.supportTickets || [])
  );

  const [loyaltyPrograms, setLoyaltyPrograms] = useState(() =>
    load("loyaltyPrograms", sampleData.loyaltyPrograms || [])
  );
  const [loyaltyRules, setLoyaltyRules] = useState(() =>
    load("loyaltyRules", sampleData.loyaltyRules || [])
  );
  const [loyaltyLedger, setLoyaltyLedger] = useState(() =>
    load("loyaltyLedger", sampleData.loyaltyLedger || [])
  );
  const [loyaltyTransactions, setLoyaltyTransactions] = useState(() =>
    load("loyaltyTransactions", sampleData.loyaltyTransactions || [])
  );
  const [loyaltyRedemptions, setLoyaltyRedemptions] = useState(() =>
    load("loyaltyRedemptions", sampleData.loyaltyRedemptions || [])
  );

  const [sales, setSales] = useState(() =>
    load("sales", sampleData.sales || [])
  );

  /* --------------------------- AUTO-SAVE TO LOCALSTORAGE --------------------------- */
  useEffect(() => {
    const saveAll = () => {
      save("coa", chartOfAccounts);
      save("entries", journalEntries);
      save("vendors", vendors);
      save("invoices", invoices);
      save("payments", payments);
      save("customers", customers);
      save("arInvoices", arInvoices);
      save("receipts", receipts);
      save("budgets", budgets);
      save("costCenters", costCenters);
      save("assets", fixedAssets);
      save("financeData", financeData);
      save("audit", auditLogs);

      // CRM & Loyalty
      save("leads", leads);
      save("tickets", supportTickets);
      save("sales", sales);
      save("loyaltyPrograms", loyaltyPrograms);
      save("loyaltyRules", loyaltyRules);
      save("loyaltyLedger", loyaltyLedger);
      save("loyaltyTransactions", loyaltyTransactions);
      save("loyaltyRedemptions", loyaltyRedemptions);
    };

    saveAll();
  }, [
    chartOfAccounts,
    journalEntries,
    vendors,
    invoices,
    payments,
    customers,
    arInvoices,
    receipts,
    budgets,
    costCenters,
    fixedAssets,
    financeData,
    auditLogs,
    leads,
    supportTickets,
    sales,
    loyaltyPrograms,
    loyaltyRules,
    loyaltyLedger,
    loyaltyTransactions,
    loyaltyRedemptions,
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

    // Audit log
    logAudit(
      "GL Entry",
      `${description} | ${formatCurrency(
        amount
      )} | ${debitAccountName} → ${creditAccountName}`
    );

    return newEntry;
  };

  /* --------------------------- AUDIT LOG HELPER --------------------------- */
  const logAudit = (action, details, user = "You") => {
    setAuditLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        action,
        user,
        details,
      },
    ]);
  };

  /* --------------------------- LOYALTY POINTS ENGINE --------------------------- */
  const awardLoyaltyPoints = (
    customerId,
    triggerType,
    referenceId,
    amount = 0
  ) => {
    const activeRules = loyaltyRules.filter(
      (r) =>
        r.trigger_type === triggerType &&
        loyaltyPrograms.some((p) => p.id === r.program_id && p.is_active)
    );

    let totalPoints = 0;
    const appliedRules = [];

    for (const rule of activeRules) {
      const condition = rule.condition_json || {};
      if (
        triggerType === "SALE" &&
        condition.min_amount &&
        amount < condition.min_amount
      )
        continue;
      totalPoints += rule.points_awarded;
      appliedRules.push(rule.id);
    }

    if (totalPoints === 0) return;

    // Find or create ledger
    let ledger = loyaltyLedger.find((l) => l.customer_id === customerId);
    if (!ledger) {
      const newLedger = {
        id: `ledger-${Date.now()}`,
        customer_id: customerId,
        program_id: loyaltyPrograms[0]?.id,
        points: 0,
      };
      ledger = newLedger;
      setLoyaltyLedger((prev) => [...prev, newLedger]);
    }

    // Update points
    setLoyaltyLedger((prev) =>
      prev.map((l) =>
        l.id === ledger.id ? { ...l, points: l.points + totalPoints } : l
      )
    );

    // Record transaction
    const txn = {
      id: `txn-${Date.now()}`,
      ledger_id: ledger.id,
      type: "EARN",
      points: totalPoints,
      reference_id: referenceId,
      notes: `${triggerType} → ${appliedRules.join(", ")}`,
      created_at: new Date().toISOString(),
    };
    setLoyaltyTransactions((prev) => [...prev, txn]);

    logAudit(
      "Loyalty Points",
      `${totalPoints} pts → ${
        customers.find((c) => c.id === customerId)?.name
      }`,
      "Loyalty Engine"
    );
  };

  /* --------------------------- SALES → GL + LOYALTY --------------------------- */
  const recordSale = (saleData) => {
    const {
      customer_id,
      amount,
      items = [],
      date = new Date().toISOString().split("T")[0],
    } = saleData;
    const saleId = `sale-${Date.now()}`;

    // 1. Record in sales
    const newSale = { id: saleId, customer_id, amount, items, date };
    setSales((prev) => [...prev, newSale]);

    // 2. Post to GL: Dr. Cash/Bank, Cr. Sales
    postToGL("Cash", "Sales", amount, `Sale #${saleId}`, saleId, date);

    // 3. Award Loyalty Points
    awardLoyaltyPoints(customer_id, "SALE", saleId, amount);

    logAudit(
      "Sale Recorded",
      `${formatCurrency(amount)} from ${
        customers.find((c) => c.id === customer_id)?.name
      }`
    );
    return newSale;
  };

  /* --------------------------- LEAD CONVERTED → POINTS --------------------------- */
  const convertLead = (leadId, customerId) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: "CONVERTED", customer_id: customerId }
          : l
      )
    );
    awardLoyaltyPoints(customerId, "LEAD_CONVERTED", leadId);
    logAudit("Lead Converted", `Lead #${leadId} → Customer #${customerId}`);
  };

  /* --------------------------- SUPPORT TICKET CLOSED → POINTS --------------------------- */
  const closeSupportTicket = (ticketId, customerId) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "CLOSED" } : t))
    );
    awardLoyaltyPoints(customerId, "TICKET_CLOSED", ticketId);
    logAudit("Ticket Closed", `Ticket #${ticketId} resolved`);
  };

  /* --------------------------- REDEEM LOYALTY POINTS --------------------------- */
  const redeemPoints = (customerId, redemptionId) => {
    const redemption = loyaltyRedemptions.find((r) => r.id === redemptionId);
    if (!redemption) return false;

    const ledger = loyaltyLedger.find((l) => l.customer_id === customerId);
    if (!ledger || ledger.points < redemption.points_cost) {
      alert("Not enough points!");
      return false;
    }

    // Deduct points
    setLoyaltyLedger((prev) =>
      prev.map((l) =>
        l.id === ledger.id
          ? { ...l, points: l.points - redemption.points_cost }
          : l
      )
    );

    // Log redemption
    const txn = {
      id: `redeem-${Date.now()}`,
      ledger_id: ledger.id,
      type: "REDEEM",
      points: -redemption.points_cost,
      reference_id: redemptionId,
      notes: redemption.title,
      created_at: new Date().toISOString(),
    };
    setLoyaltyTransactions((prev) => [...prev, txn]);

    logAudit(
      "Points Redeemed",
      `${redemption.points_cost} pts → ${redemption.title}`
    );
    return true;
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
    logAudit("AP Invoice", `₹${amount} from Vendor #${vendorId}`);
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
    logAudit("AP Payment", `₹${amount} for Invoice #${invoiceId}`);
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
    logAudit("AR Receipt", `₹${amount} from Customer #${customerId}`);
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
        customers,
        setCustomers,
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

        // CRM & Loyalty
        leads,
        setLeads,
        supportTickets,
        setTickets,
        sales,
        setSales,
        loyaltyPrograms,
        setLoyaltyPrograms,
        loyaltyRules,
        setLoyaltyRules,
        loyaltyLedger,
        setLoyaltyLedger,
        loyaltyTransactions,
        setLoyaltyTransactions,
        loyaltyRedemptions,
        setLoyaltyRedemptions,

        // === ACTIONS ===
        postToGL,
        createInvoice,
        recordPayment,
        receiveFromCustomer,
        recordSale,
        convertLead,
        closeSupportTicket,
        redeemPoints,
        logAudit,

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
/*                               USE FINANCE HOOK                               */
/* -------------------------------------------------------------------------- */
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return context;
};
