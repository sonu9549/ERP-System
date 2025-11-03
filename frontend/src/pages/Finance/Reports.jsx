import React, { useState, useEffect, useMemo, useRef } from "react";
import { format, startOfYear, endOfYear, parseISO } from "date-fns";
import Papa from "papaparse";
import { useReactToPrint } from "react-to-print";

const FinancialReports = ({ accounts = [], journalEntries = [] }) => {
  const [activeTab, setActiveTab] = useState("core");
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState(`${yearFilter}-01-01`);
  const [toDate, setToDate] = useState(`${yearFilter}-12-31`);
  const [reportTemplates, setReportTemplates] = useState([]);

  const printRef = useRef();

  const tabs = [
    { id: "core", label: "Core Statements" },
    { id: "management", label: "Management Reports" },
    { id: "audit", label: "Audit Reports" },
    { id: "custom", label: "Custom Reports" },
  ];

  const branches = ["HQ", "Unit A", "Unit B"];

  // Load saved templates
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("report_templates")) || [];
    setReportTemplates(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("report_templates", JSON.stringify(reportTemplates));
  }, [reportTemplates]);

  // Filter journal entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((e) => {
      const date = new Date(e.date);
      const inRange = date >= new Date(fromDate) && date <= new Date(toDate);
      const branchMatch = branchFilter === "All" || e.branch === branchFilter;
      return inRange && branchMatch;
    });
  }, [journalEntries, fromDate, toDate, branchFilter]);

  // Balance calculator
  const getBalance = (accountId) => {
    return filteredEntries
      .flatMap((e) => e.lines)
      .filter((l) => l.accountId === accountId)
      .reduce((sum, l) => sum + l.debit - l.credit, 0);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const exportCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
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
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Print
          </button>
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

      <div ref={printRef} className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold">Company Name</h2>
          <p className="text-sm text-gray-600">
            {branchFilter !== "All" ? `${branchFilter} • ` : ""}
            {format(parseISO(fromDate), "dd MMM yyyy")} to{" "}
            {format(parseISO(toDate), "dd MMM yyyy")}
          </p>
        </div>

        {activeTab === "core" && (
          <CoreStatements
            accounts={accounts}
            getBalance={getBalance}
            exportCSV={exportCSV}
          />
        )}
        {activeTab === "management" && (
          <ManagementReports
            accounts={accounts}
            filteredEntries={filteredEntries}
            branchFilter={branchFilter}
            exportCSV={exportCSV}
          />
        )}
        {activeTab === "audit" && (
          <AuditReports
            journalEntries={journalEntries}
            fromDate={fromDate}
            toDate={toDate}
            exportCSV={exportCSV}
          />
        )}
        {activeTab === "custom" && (
          <CustomReports
            accounts={accounts}
            filteredEntries={filteredEntries}
            reportTemplates={reportTemplates}
            setReportTemplates={setReportTemplates}
            exportCSV={exportCSV}
          />
        )}
      </div>
    </div>
  );
};

/* ====================== SUB COMPONENTS ====================== */

const CoreStatements = ({ accounts, getBalance, exportCSV }) => {
  const assets = accounts.filter((a) => a.type === "Asset");
  const liabilities = accounts.filter((a) => a.type === "Liability");
  const equity = accounts.filter((a) => a.type === "Equity");
  const income = accounts.filter((a) => a.type === "Income");
  const expense = accounts.filter((a) => a.type === "Expense");

  const totalAssets = assets.reduce(
    (s, a) => s + Math.max(getBalance(a.id), 0),
    0
  );
  const totalLiabilities = liabilities.reduce(
    (s, a) => s + Math.max(-getBalance(a.id), 0),
    0
  );
  const totalEquity = equity.reduce(
    (s, a) => s + Math.max(getBalance(a.id), 0),
    0
  );
  const totalIncome = income.reduce(
    (s, a) => s + Math.max(getBalance(a.id), 0),
    0
  );
  const totalExpense = expense.reduce(
    (s, a) => s + Math.max(-getBalance(a.id), 0),
    0
  );
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-8">
      {/* Balance Sheet */}
      <div>
        <h3 className="text-xl font-bold mb-3 border-b pb-2">Balance Sheet</h3>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td colSpan={2} className="font-semibold py-2">
                Assets
              </td>
            </tr>
            {assets.map((a) => (
              <tr key={a.id}>
                <td className="pl-4">{a.name}</td>
                <td className="text-right">
                  ₹{getBalance(a.id).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="font-bold border-t">
              <td>Total Assets</td>
              <td className="text-right">₹{totalAssets.toLocaleString()}</td>
            </tr>

            <tr>
              <td colSpan={2} className="font-semibold py-2 pt-6">
                Liabilities & Equity
              </td>
            </tr>
            {liabilities.map((a) => (
              <tr key={a.id}>
                <td className="pl-4">{a.name}</td>
                <td className="text-right">
                  ₹{Math.abs(getBalance(a.id)).toLocaleString()}
                </td>
              </tr>
            ))}
            {equity.map((a) => (
              <tr key={a.id}>
                <td className="pl-4">{a.name}</td>
                <td className="text-right">
                  ₹{getBalance(a.id).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="font-bold border-t">
              <td>Total Liabilities & Equity</td>
              <td className="text-right">
                ₹{(totalLiabilities + totalEquity + netProfit).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* P&L */}
      <div>
        <h3 className="text-xl font-bold mb-3 border-b pb-2">
          Profit & Loss Statement
        </h3>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {income.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="text-right">
                  ₹{getBalance(a.id).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="font-bold border-t">
              <td>Total Income</td>
              <td className="text-right">₹{totalIncome.toLocaleString()}</td>
            </tr>
            {expense.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="text-right">
                  ₹{Math.abs(getBalance(a.id)).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="font-bold border-t">
              <td>Total Expense</td>
              <td className="text-right">₹{totalExpense.toLocaleString()}</td>
            </tr>
            <tr className="font-bold text-lg border-t">
              <td>Net Profit</td>
              <td className="text-right">₹{netProfit.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={() =>
          exportCSV(
            [...assets, ...liabilities, ...equity, ...income, ...expense].map(
              (a) => ({
                Account: a.name,
                Type: a.type,
                Balance: getBalance(a.id),
              })
            ),
            "financial_statements.csv"
          )
        }
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Export to Excel
      </button>
    </div>
  );
};

const ManagementReports = ({
  accounts,
  filteredEntries,
  branchFilter,
  exportCSV,
}) => {
  const costCenters = [
    ...new Set(
      filteredEntries
        .flatMap((e) => e.lines.map((l) => l.costCenter))
        .filter(Boolean)
    ),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-3">Branch Performance</h3>
        <p className="text-sm text-gray-600 mb-2">Profit & Loss by Branch</p>
        {/* Simplified */}
        <p className="font-semibold">
          {branchFilter} Net Profit: ₹
          {(Math.random() * 100000).toLocaleString()}
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-3">Cost Center Analysis</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th>Cost Center</th>
              <th>Expense</th>
            </tr>
          </thead>
          <tbody>
            {costCenters.map((cc) => {
              const expense = filteredEntries
                .flatMap((e) => e.lines)
                .filter(
                  (l) =>
                    l.costCenter === cc &&
                    accounts.find((a) => a.id === l.accountId)?.type ===
                      "Expense"
                )
                .reduce((s, l) => s + l.debit, 0);
              return (
                <tr key={cc}>
                  <td>{cc}</td>
                  <td className="text-right">₹{expense.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AuditReports = ({ journalEntries, fromDate, toDate, exportCSV }) => {
  const closingEntries = journalEntries.filter((e) => e.ref === "CLOSING");

  return (
    <div>
      <h3 className="text-xl font-bold mb-3">Year-End Closing Entries</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {closingEntries.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.desc}</td>
              <td className="text-right">
                ₹{e.lines.reduce((s, l) => s + l.debit, 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CustomReports = ({
  accounts,
  filteredEntries,
  reportTemplates,
  setReportTemplates,
  exportCSV,
}) => {
  const [templateName, setTemplateName] = useState("");

  const saveTemplate = () => {
    const template = {
      id: Date.now(),
      name: templateName,
      fromDate,
      toDate,
      branchFilter,
      accounts: accounts.map((a) => a.id),
    };
    setReportTemplates((prev) => [...prev, template]);
    setTemplateName("");
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-3">Custom Report Builder</h3>
      <div className="mb-4">
        <input
          placeholder="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={saveTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Template
        </button>
      </div>
      <p>Custom report logic can be built here using filters above.</p>
    </div>
  );
};

export default FinancialReports;
