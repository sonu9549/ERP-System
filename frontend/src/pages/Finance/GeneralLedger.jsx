// src/components/GeneralLedger.jsx
import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import Papa from "papaparse";
import { useFinance } from "../../context/FinanceContext"; // <-- Shared context

const CURRENCY = "INR";
const EXCHANGE_RATES = { USD: 83.5, EUR: 90.2 }; // Mock rates (kept for possible future use)

const GeneralLedger = () => {
  const {
    chartOfAccounts,
    setChartOfAccounts,
    journalEntries,
    setJournalEntries,
    auditLogs,
    setAuditLogs,
    postToGL, // generic helper to post debit/credit
  } = useFinance();

  const [activeTab, setActiveTab] = useState("chart");
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [currencyFilter, setCurrencyFilter] = useState("All");

  // Static lists (can be moved to context later)
  const costCenters = ["Marketing", "R&D", "Admin", "Sales"];
  const projects = ["Project Alpha", "Project Beta", "None"];
  const branches = ["HQ", "Unit A", "Unit B"];
  const currencies = ["INR", "USD", "EUR"];
  const accountTypes = ["Asset", "Liability", "Equity", "Income", "Expense"];
  const subTypes = {
    Asset: ["Cash", "Bank", "Receivable", "Fixed Asset", "Inventory"],
    Liability: ["Payable", "Loan", "Tax Payable"],
    Equity: ["Capital", "Retained Earnings"],
    Income: ["Sales", "Service Income", "Other Income"],
    Expense: ["COGS", "Operating Expense", "Admin Expense", "Tax"],
  };

  const user = { id: 1, name: "admin", ip: "192.168.1.10" };

  const tabs = [
    { id: "chart", label: "Chart of Accounts" },
    { id: "journal", label: "Journal Entries" },
    { id: "opening", label: "Opening Balances" },
    { id: "trial", label: "Trial Balance" },
    { id: "ledger", label: "General Ledger" },
    { id: "reconcile", label: "Reconciliation" },
    { id: "yearend", label: "Year-End Closing" },
    { id: "audit", label: "Audit Trail" },
    { id: "import", label: "Import / Export" },
  ];

  // --------------------------------------------------------------
  // Helper: log audit (centralised)
  // --------------------------------------------------------------
  const logAudit = (action, details = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      user: user.name,
      ip: user.ip,
      details: JSON.stringify(details),
    };
    setAuditLogs((prev) => [...prev, log]);
  };

  // --------------------------------------------------------------
  // Balance calculation (memoised)
  // --------------------------------------------------------------
  const getBalance = useMemo(() => {
    return (accountId, year = yearFilter) => {
      const lines = journalEntries
        .filter((e) => new Date(e.date).getFullYear() <= year)
        .flatMap((e) => e.lines);

      const net = lines
        .filter((l) => l.accountId === accountId)
        .reduce((sum, l) => sum + l.debit - l.credit, 0);

      const acc = chartOfAccounts.find((a) => a.id === accountId);
      return acc?.normalBalance === "Debit" ? net : -net;
    };
  }, [journalEntries, chartOfAccounts, yearFilter]);

  const filteredAccounts = useMemo(() => {
    return chartOfAccounts.filter(
      (acc) =>
        (branchFilter === "All" || acc.branch === branchFilter) &&
        (currencyFilter === "All" || acc.currency === currencyFilter)
    );
  }, [chartOfAccounts, branchFilter, currencyFilter]);

  // --------------------------------------------------------------
  // UI
  // --------------------------------------------------------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">General Ledger</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option>All</option>
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option>All</option>
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(+e.target.value)}
            className="border p-2 rounded w-20"
            placeholder="Year"
          />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow"
                : "bg-white border text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === "chart" && (
          <ChartOfAccounts
            accounts={filteredAccounts}
            accountTypes={accountTypes}
            subTypes={subTypes}
            branches={branches}
            currencies={currencies}
            setAccounts={setChartOfAccounts}
            logAudit={logAudit}
          />
        )}
        {activeTab === "journal" && (
          <JournalEntries
            accounts={chartOfAccounts}
            journalEntries={journalEntries}
            setJournalEntries={setJournalEntries}
            costCenters={costCenters}
            projects={projects}
            branches={branches}
            currencies={currencies}
            logAudit={logAudit}
            postToGL={postToGL}
          />
        )}
        {activeTab === "opening" && (
          <OpeningBalances
            accounts={chartOfAccounts}
            year={yearFilter}
            setJournalEntries={setJournalEntries}
            logAudit={logAudit}
            postToGL={postToGL}
          />
        )}
        {activeTab === "trial" && (
          <TrialBalance
            accounts={chartOfAccounts}
            getBalance={getBalance}
            year={yearFilter}
          />
        )}
        {activeTab === "ledger" && (
          <GeneralLedgerReport
            accounts={chartOfAccounts}
            journalEntries={journalEntries}
            year={yearFilter}
          />
        )}
        {activeTab === "reconcile" && (
          <AccountReconciliation
            accounts={chartOfAccounts}
            journalEntries={journalEntries}
          />
        )}
        {activeTab === "yearend" && (
          <YearEndClosing
            accounts={chartOfAccounts}
            journalEntries={journalEntries}
            setJournalEntries={setJournalEntries}
            year={yearFilter}
            logAudit={logAudit}
            getBalance={getBalance}
            postToGL={postToGL}
          />
        )}
        {activeTab === "audit" && <AuditTrail logs={auditLogs} />}
        {activeTab === "import" && (
          <ImportExport
            accounts={chartOfAccounts}
            setAccounts={setChartOfAccounts}
            journalEntries={journalEntries}
            setJournalEntries={setJournalEntries}
          />
        )}
      </div>
    </div>
  );
};

/* ====================== SUB COMPONENTS ====================== */

const ChartOfAccounts = ({
  accounts,
  accountTypes,
  subTypes,
  branches,
  currencies,
  setAccounts,
  logAudit,
}) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "Asset",
    subType: "Cash",
    branch: "HQ",
    currency: "INR",
    normalBalance: "Debit",
    status: "Active",
    taxCode: "",
    notes: "",
  });

  const handleAdd = () => {
    if (!form.code || !form.name) return alert("Code & Name required");
    const newAcc = { ...form, id: Date.now(), balance: 0 };
    setAccounts((prev) => [...prev, newAcc]);
    logAudit("Added account", { code: form.code, name: form.name });
    setForm({ ...form, code: "", name: "", taxCode: "", notes: "" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Chart of Accounts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={form.type}
          onChange={(e) =>
            setForm({
              ...form,
              type: e.target.value,
              subType: subTypes[e.target.value][0],
            })
          }
          className="border p-2 rounded"
        >
          {accountTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={form.subType}
          onChange={(e) => setForm({ ...form, subType: e.target.value })}
          className="border p-2 rounded"
        >
          {subTypes[form.type].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          className="border p-2 rounded"
        >
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          className="border p-2 rounded"
        >
          {currencies.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          placeholder="Tax Code"
          value={form.taxCode}
          onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
          className="border p-2 rounded"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white p-2 rounded col-span-3"
        >
          Add Account
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Code</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Branch</th>
            <th className="border p-2 text-left">Balance</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td className="border p-1">{acc.code}</td>
              <td className="border p-1">{acc.name}</td>
              <td className="border p-1">{acc.subType}</td>
              <td className="border p-1">{acc.branch}</td>
              <td className="border p-1 text-right">
                ₹{Math.abs(acc.balance ?? 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const JournalEntries = ({
  accounts,
  journalEntries,
  setJournalEntries,
  costCenters,
  projects,
  branches,
  currencies,
  logAudit,
  postToGL,
}) => {
  const [entry, setEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    ref: "",
    desc: "",
    branch: "HQ",
    currency: "INR",
    lines: [
      {
        accountId: "",
        debit: 0,
        credit: 0,
        costCenter: "",
        project: "",
        memo: "",
      },
    ],
  });

  const addLine = () =>
    setEntry({
      ...entry,
      lines: [
        ...entry.lines,
        {
          accountId: "",
          debit: 0,
          credit: 0,
          costCenter: "",
          project: "",
          memo: "",
        },
      ],
    });
  const updateLine = (i, field, val) => {
    const lines = [...entry.lines];
    lines[i][field] = field === "accountId" ? +val : val;
    setEntry({ ...entry, lines });
  };
  const removeLine = (i) =>
    setEntry({ ...entry, lines: entry.lines.filter((_, idx) => idx !== i) });

  const totals = entry.lines.reduce(
    (s, l) => ({ debit: s.debit + l.debit, credit: s.credit + l.credit }),
    { debit: 0, credit: 0 }
  );

  const post = () => {
    if (totals.debit !== totals.credit)
      return alert("Debits must equal Credits");

    // Use context helper to keep balances in sync
    entry.lines.forEach((line) => {
      if (line.accountId && (line.debit || line.credit)) {
        const acc = accounts.find((a) => a.id === line.accountId);
        const debitAcc = line.debit ? line.accountId : null;
        const creditAcc = line.credit ? line.accountId : null;
        // postToGL(debitAccountId, creditAccountId, amount, description)
        if (debitAcc) postToGL(debitAcc, null, line.debit, entry.desc);
        if (creditAcc) postToGL(null, creditAcc, line.credit, entry.desc);
      }
    });

    const newEntry = { ...entry, id: Date.now(), posted: true };
    setJournalEntries((prev) => [...prev, newEntry]);
    logAudit("Posted Journal", { ref: entry.ref, desc: entry.desc });

    // Reset form
    setEntry({
      ...entry,
      ref: "",
      desc: "",
      lines: [
        {
          accountId: "",
          debit: 0,
          credit: 0,
          costCenter: "",
          project: "",
          memo: "",
        },
      ],
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Journal Entries</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input
          type="date"
          value={entry.date}
          onChange={(e) => setEntry({ ...entry, date: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Ref #"
          value={entry.ref}
          onChange={(e) => setEntry({ ...entry, ref: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Description"
          value={entry.desc}
          onChange={(e) => setEntry({ ...entry, desc: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={entry.branch}
          onChange={(e) => setEntry({ ...entry, branch: e.target.value })}
          className="border p-2 rounded"
        >
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>

      {entry.lines.map((line, i) => (
        <div key={i} className="flex gap-2 mb-2 items-center">
          <select
            value={line.accountId}
            onChange={(e) => updateLine(i, "accountId", e.target.value)}
            className="border p-2 rounded flex-1"
          >
            <option value="">Select Account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Debit"
            value={line.debit}
            onChange={(e) => updateLine(i, "debit", +e.target.value)}
            className="border p-2 rounded w-24"
          />
          <input
            type="number"
            placeholder="Credit"
            value={line.credit}
            onChange={(e) => updateLine(i, "credit", +e.target.value)}
            className="border p-2 rounded w-24"
          />
          <select
            value={line.costCenter}
            onChange={(e) => updateLine(i, "costCenter", e.target.value)}
            className="border p-2 rounded w-32"
          >
            <option>None</option>
            {costCenters.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={line.project}
            onChange={(e) => updateLine(i, "project", e.target.value)}
            className="border p-2 rounded w-32"
          >
            {projects.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            placeholder="Memo"
            value={line.memo}
            onChange={(e) => updateLine(i, "memo", e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={() => removeLine(i)}
            className="bg-red-500 text-white p-2 rounded"
          >
            X
          </button>
        </div>
      ))}

      <button
        onClick={addLine}
        className="bg-gray-600 text-white px-3 py-1 rounded mb-2"
      >
        + Line
      </button>
      <div className="flex justify-between font-bold">
        <span>Total Debit: ₹{totals.debit.toLocaleString()}</span>
        <span>Total Credit: ₹{totals.credit.toLocaleString()}</span>
      </div>
      <button
        onClick={post}
        className="bg-green-600 text-white px-6 py-2 rounded mt-3"
      >
        Post Entry
      </button>
    </div>
  );
};

const OpeningBalances = ({
  accounts,
  year,
  setJournalEntries,
  logAudit,
  postToGL,
}) => {
  const [balances, setBalances] = useState({});

  const handleChange = (id, type, value) => {
    setBalances((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: +value || 0 },
    }));
  };

  const apply = () => {
    const lines = [];
    let totalDebit = 0,
      totalCredit = 0;

    Object.entries(balances).forEach(([id, b]) => {
      const acc = accounts.find((a) => a.id === +id);
      if (!acc) return;
      if (b.debit) {
        lines.push({ accountId: +id, debit: b.debit, credit: 0 });
        totalDebit += b.debit;
      }
      if (b.credit) {
        lines.push({ accountId: +id, debit: 0, credit: b.credit });
        totalCredit += b.credit;
      }
    });

    if (totalDebit !== totalCredit)
      return alert("Opening balances must balance.");

    // Post each line via context
    lines.forEach((l) => {
      if (l.debit) postToGL(l.accountId, null, l.debit, "Opening Balance");
      if (l.credit) postToGL(null, l.accountId, l.credit, "Opening Balance");
    });

    const entry = {
      id: Date.now(),
      date: `${year}-01-01`,
      ref: "OPENING",
      desc: "Opening Balances",
      branch: "HQ",
      currency: "INR",
      lines,
      posted: true,
    };
    setJournalEntries((prev) => [...prev, entry]);
    logAudit("Applied Opening Balances", { year });
    setBalances({});
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Opening Balances</h2>
      <p className="text-gray-600 mb-4">
        Set opening balances for the year {year}.
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Account</th>
            <th className="border p-2 text-left">Debit</th>
            <th className="border p-2 text-left">Credit</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td className="border p-1">
                {acc.code} - {acc.name}
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  className="w-full p-1 border rounded"
                  onChange={(e) =>
                    handleChange(acc.id, "debit", e.target.value)
                  }
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  className="w-full p-1 border rounded"
                  onChange={(e) =>
                    handleChange(acc.id, "credit", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={apply}
        className="bg-green-600 text-white px-6 py-2 rounded mt-4"
      >
        Apply Opening Balances
      </button>
    </div>
  );
};

const TrialBalance = ({ accounts, getBalance, year }) => {
  const totals = accounts.reduce(
    (acc, a) => {
      const bal = getBalance(a.id, year);
      if (bal >= 0) acc.debit += bal;
      else acc.credit += Math.abs(bal);
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Trial Balance</h2>
      <p className="text-gray-600 mb-4">As of December 31, {year}</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Account</th>
            <th className="border p-2 text-right">Debit</th>
            <th className="border p-2 text-right">Credit</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => {
            const bal = getBalance(acc.id, year);
            return (
              <tr key={acc.id}>
                <td className="border p-1">
                  {acc.code} - {acc.name}
                </td>
                <td className="border p-1 text-right">
                  {bal >= 0 ? `₹${bal.toLocaleString()}` : ""}
                </td>
                <td className="border p-1 text-right">
                  {bal < 0 ? `₹${Math.abs(bal).toLocaleString()}` : ""}
                </td>
              </tr>
            );
          })}
          <tr className="font-bold bg-gray-50">
            <td className="border p-2">Total</td>
            <td className="border p-2 text-right">
              ₹{totals.debit.toLocaleString()}
            </td>
            <td className="border p-2 text-right">
              ₹{totals.credit.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const GeneralLedgerReport = ({ accounts, journalEntries, year }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const account = accounts.find((a) => a.id === selectedAccount);

  const transactions = journalEntries
    .filter((e) => new Date(e.date).getFullYear() <= year)
    .flatMap((e) => e.lines.map((l) => ({ ...l, entry: e })))
    .filter((t) => t.accountId === selectedAccount)
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date));

  let running = 0;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">General Ledger</h2>
      <select
        onChange={(e) => setSelectedAccount(+e.target.value)}
        className="border p-2 rounded mb-4 w-full md:w-96"
      >
        <option>Select Account</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} - {a.name}
          </option>
        ))}
      </select>

      {account && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {account.name} ({account.code})
          </h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Ref</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-right">Debit</th>
                <th className="border p-2 text-right">Credit</th>
                <th className="border p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => {
                running += t.debit - t.credit;
                return (
                  <tr key={i}>
                    <td className="border p-1">
                      {format(parseISO(t.entry.date), "dd MMM yyyy")}
                    </td>
                    <td className="border p-1">{t.entry.ref}</td>
                    <td className="border p-1">{t.entry.desc}</td>
                    <td className="border p-1 text-right">
                      ₹{t.debit.toLocaleString()}
                    </td>
                    <td className="border p-1 text-right">
                      ₹{t.credit.toLocaleString()}
                    </td>
                    <td className="border p-1 text-right">
                      ₹{running.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AccountReconciliation = ({ accounts, journalEntries }) => {
  const bankAccounts = accounts.filter(
    (a) => a.subType === "Bank" || a.subType === "Cash"
  );
  const [selected, setSelected] = useState(bankAccounts[0]?.id || null);
  const [statementBalance, setStatementBalance] = useState(0);
  const [reconciled, setReconciled] = useState([]);

  const transactions = journalEntries
    .flatMap((e) => e.lines.map((l) => ({ ...l, entry: e })))
    .filter((t) => t.accountId === selected);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bank Reconciliation</h2>
      <select
        value={selected}
        onChange={(e) => setSelected(+e.target.value)}
        className="border p-2 rounded mb-4"
      >
        {bankAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Statement Balance"
        value={statementBalance}
        onChange={(e) => setStatementBalance(+e.target.value)}
        className="border p-2 rounded w-48 mb-4"
      />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Desc</th>
            <th className="border p-2 text-right">Amount</th>
            <th className="border p-2">Reconciled</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i}>
              <td className="border p-1">
                {format(parseISO(t.entry.date), "dd MMM")}
              </td>
              <td className="border p-1">{t.entry.desc}</td>
              <td className="border p-1 text-right">
                ₹{(t.debit - t.credit).toLocaleString()}
              </td>
              <td className="border p-1 text-center">
                <input
                  type="checkbox"
                  checked={reconciled.includes(i)}
                  onChange={(e) => {
                    if (e.target.checked) setReconciled((prev) => [...prev, i]);
                    else setReconciled((prev) => prev.filter((x) => x !== i));
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const YearEndClosing = ({
  accounts,
  journalEntries,
  setJournalEntries,
  year,
  logAudit,
  getBalance,
  postToGL,
}) => {
  const performClosing = () => {
    const incomeAccts = accounts.filter((a) => a.type === "Income");
    const expenseAccts = accounts.filter((a) => a.type === "Expense");
    const retained = accounts.find((a) => a.name === "Retained Earnings");
    if (!retained) return alert("Retained Earnings account not found!");

    const income = incomeAccts.reduce(
      (s, a) => s + Math.max(getBalance(a.id, year), 0),
      0
    );
    const expense = expenseAccts.reduce(
      (s, a) => s + Math.max(-getBalance(a.id, year), 0),
      0
    );
    const netIncome = income - expense;

    const lines = [];

    // Close income
    incomeAccts.forEach((a) => {
      const bal = getBalance(a.id, year);
      if (bal > 0) {
        lines.push({ accountId: a.id, debit: 0, credit: bal });
        postToGL(null, a.id, bal, "Year-End Close Income");
      }
    });

    // Close expense
    expenseAccts.forEach((a) => {
      const bal = getBalance(a.id, year);
      if (bal < 0) {
        lines.push({ accountId: a.id, debit: Math.abs(bal), credit: 0 });
        postToGL(a.id, null, Math.abs(bal), "Year-End Close Expense");
      }
    });

    // Transfer net income
    if (netIncome !== 0) {
      lines.push({
        accountId: retained.id,
        debit: netIncome < 0 ? Math.abs(netIncome) : 0,
        credit: netIncome > 0 ? netIncome : 0,
      });
      postToGL(
        netIncome < 0 ? retained.id : null,
        netIncome > 0 ? retained.id : null,
        Math.abs(netIncome),
        "Year-End Net Income"
      );
    }

    const entry = {
      id: Date.now(),
      date: `${year}-12-31`,
      ref: "CLOSING",
      desc: `Year-End Closing - Net Income: ₹${netIncome.toLocaleString()}`,
      branch: "HQ",
      currency: "INR",
      lines,
      posted: true,
    };
    setJournalEntries((prev) => [...prev, entry]);
    logAudit("Year-End Closing", { year, netIncome });
    alert(
      `Year-End Closing Complete! Net Income: ₹${netIncome.toLocaleString()}`
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Year-End Closing</h2>
      <p className="text-gray-600 mb-4">
        Close income/expense accounts for <strong>{year}</strong>.
      </p>
      <button
        onClick={performClosing}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
      >
        Perform Year-End Closing
      </button>
    </div>
  );
};

const AuditTrail = ({ logs = [] }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Audit Trail</h2>
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Time</th>
          <th className="border p-2 text-left">User</th>
          <th className="border p-2 text-left">Action</th>
          <th className="border p-2 text-left">Details</th>
        </tr>
      </thead>
      <tbody>
        {logs
          .slice()
          .reverse()
          .map((log, i) => (
            <tr key={i}>
              <td className="border p-1">
                {format(parseISO(log.timestamp), "dd MMM yyyy HH:mm")}
              </td>
              <td className="border p-1">{log.user}</td>
              <td className="border p-1">{log.action}</td>
              <td className="border p-1">{log.details}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const ImportExport = ({
  accounts,
  setAccounts,
  journalEntries,
  setJournalEntries,
}) => {
  const exportCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const importCSV = (e, setter, parser) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = parser(results.data);
        setter(data);
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Import / Export</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Chart of Accounts</h3>
          <button
            onClick={() => exportCSV(accounts, "chart_of_accounts.csv")}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
          >
            Export CSV
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              importCSV(e, setAccounts, (rows) =>
                rows.map((r, i) => ({ ...r, id: Date.now() + i }))
              )
            }
            className="border p-2 rounded"
          />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Journal Entries</h3>
          <button
            onClick={() => exportCSV(journalEntries, "journal_entries.csv")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;
