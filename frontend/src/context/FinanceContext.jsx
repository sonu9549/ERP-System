// FinanceContext.js
import { createContext, useState, useContext, useMemo } from "react";
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
  defaultBankDeposits,
} from "../data/data";

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const [chartOfAccounts, setChartOfAccounts] = useState(sampleChartOfAccounts);
  const [vendors, setVendors] = useState(sampleVendors);
  const [invoices, setInvoices] = useState(sampleInvoices);
  const [journalEntries, setJournalEntries] = useState(sampleJournalEntries);
  const [payments, setPayments] = useState(defaultPayments);
  const [bankTransactions, setBankTransactions] = useState(
    defaultBankTransactions
  );
  const [customers, setCustomers] = useState(defaultCustomers);
  const [arInvoices, setArInvoices] = useState(defaultArInvoices);
  const [receipts, setReceipts] = useState(defaultReceipts);
  const [bankDeposits, setBankDeposits] = useState(defaultBankDeposits);
  const [auditLogs, setAuditLogs] = useState([
    // ← Start with empty array or seed
    {
      timestamp: new Date().toISOString(),
      action: "Module initialized",
      user: "system",
      ip: "0.0.0.0",
      details: "{}",
    },
  ]);

  const apAccount = useMemo(
    () => chartOfAccounts.find((a) => a.name === "Accounts Payable"),
    [chartOfAccounts]
  );
  const cashAccount = useMemo(
    () => chartOfAccounts.find((a) => a.name === "Cash"),
    [chartOfAccounts]
  );
  const expenseAccount = useMemo(
    () => chartOfAccounts.find((a) => a.name === "Expenses"),
    [chartOfAccounts]
  );
  const arAccount = useMemo(
    () => chartOfAccounts.find((a) => a.name === "Accounts Receivable"),
    [chartOfAccounts]
  );

  const salesAccount = useMemo(
    () => chartOfAccounts.find((a) => a.name === "Sales"),
    [chartOfAccounts]
  );
  const cogsAccount = useMemo(
    () => chartOfAccounts.find((a) => a.name === "COGS"),
    [chartOfAccounts]
  );
  // Function to post to GL (interconnection: AP posts to GL)
  const postToGL = (debitAccountId, creditAccountId, amount, description) => {
    const newEntry = {
      id: journalEntries.length + 1,
      date: new Date().toISOString(),
      description,
      details: [
        { accountId: debitAccountId, debit: amount, credit: 0 },
        { accountId: creditAccountId, debit: 0, credit: amount },
      ],
    };
    setJournalEntries([...journalEntries, newEntry]);

    // Update balances in COA
    setChartOfAccounts(
      chartOfAccounts.map((acc) => {
        if (acc.id === debitAccountId)
          return { ...acc, balance: acc.balance + amount };
        if (acc.id === creditAccountId)
          return { ...acc, balance: acc.balance - amount };
        return acc;
      })
    );
    setAuditLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        action: "GL Post (AP)",
        user: "system",
        details: JSON.stringify({ desc, amount, debitId, creditId }),
      },
    ]);

    // In real app, call backend API
    // e.g., fetch('/api/postJournal', { method: 'POST', body: JSON.stringify(newEntry) });
  };

  // Add more functions for other submodules (e.g., update from AR)

  return (
    <FinanceContext.Provider
      value={{
        chartOfAccounts,
        journalEntries,
        vendors,

        setVendors,

        postToGL,

        invoices,
        setInvoices,
        payments,
        setPayments,
        bankTransactions,
        setBankTransactions,

        apAccount,
        cashAccount,
        expenseAccount,
        // AR
        customers,
        setCustomers,
        arInvoices,
        setArInvoices,
        receipts,
        setReceipts,
        bankDeposits,
        setBankDeposits,
        // Add setters as needed
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return {
    ...context,
    auditLogs: context.auditLogs || [],
    vendors: context.vendors || [],
    invoices: context.invoices || [],
    payments: context.payments || [],
    bankTransactions: context.bankTransactions || [],
    customers: context.customers || [],
    arInvoices: context.arInvoices || [],
    receipts: context.receipts || [],
    bankDeposits: context.bankDeposits || [],
  };
};
