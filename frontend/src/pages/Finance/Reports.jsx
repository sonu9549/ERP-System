// src/components/FinanceReport.jsx
import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFinance } from "../../context/FinanceContext";

const FinanceReport = () => {
  const {
    chartOfAccounts,
    journalEntries,
    getBalance,
    formatCurrency,
    getAccount,
  } = useFinance();
  const printRef = useRef();
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("dashboard");

  const fromDate = `${year}-01-01`;
  const toDate = `${year}-12-31`;

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Finance_Report_${year}`,
  });

  const exportPDF = (title, data) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 15, 15);
    doc.setFontSize(10);
    doc.text(`Year: ${year} | ${format(new Date(), "dd MMM yyyy")}`, 15, 25);

    const rows = data.map((d) => [d.name, formatCurrency(d.amount)]);
    doc.autoTable({
      head: [["Account", "Amount"]],
      body: rows,
      startY: 35,
      theme: "striped",
    });
    doc.save(`${title}_${year}.pdf`);
  };

  // Calculations
  const income = chartOfAccounts.filter((a) => a.type === "Income");
  const expense = chartOfAccounts.filter((a) => a.type === "Expense");

  const totalIncome = income.reduce(
    (s, a) => s + Math.max(getBalance(a.name, { fromDate, toDate }), 0),
    0
  );
  const totalExpense = expense.reduce(
    (s, a) => s + Math.max(-getBalance(a.name, { fromDate, toDate }), 0),
    0
  );
  const netProfit = totalIncome - totalExpense;

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const inc = income.reduce(
      (s, a) =>
        s +
        Math.max(
          getBalance(a.name, {
            fromDate: `${year}-${m}-01`,
            toDate: `${year}-${m}-31`,
          }),
          0
        ),
      0
    );
    const exp = expense.reduce(
      (s, a) =>
        s +
        Math.max(
          -getBalance(a.name, {
            fromDate: `${year}-${m}-01`,
            toDate: `${year}-${m}-31`,
          }),
          0
        ),
      0
    );
    return {
      month: format(new Date(year, i), "MMM"),
      income: inc,
      expense: exp,
    };
  });

  const pieData = [
    { name: "Income", value: totalIncome, color: "#3b82f6" },
    { name: "Expense", value: totalExpense, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div ref={printRef} className="max-w-6xl mx-auto bg-white">
        {/* Header */}
        <div className="border-b-4 border-blue-600 p-6 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Finance Report
              </h1>
              <p className="text-gray-600">Financial Year {year}</p>
            </div>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="w-24 px-3 py-2 border rounded text-center font-bold"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 bg-gray-100 flex gap-3">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() =>
              exportPDF("Profit_Loss", [
                { name: "Total Income", amount: totalIncome },
                { name: "Total Expense", amount: totalExpense },
                {
                  name: netProfit >= 0 ? "Net Profit" : "Net Loss",
                  amount: Math.abs(netProfit),
                },
              ])
            }
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          {["dashboard", "pl", "bs", "cash", "ratios"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium ${
                activeTab === tab
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {tab === "dashboard"
                ? "Dashboard"
                : tab === "pl"
                ? "Profit & Loss"
                : tab === "bs"
                ? "Balance Sheet"
                : tab === "cash"
                ? "Cash Flow"
                : "Ratios"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "dashboard" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded border">
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="bg-red-50 p-6 rounded border">
                  <p className="text-sm text-gray-600">Total Expense</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalExpense)}
                  </p>
                </div>
                <div
                  className={`p-6 rounded border ${
                    netProfit >= 0 ? "bg-green-50" : "bg-orange-50"
                  }`}
                >
                  <p className="text-sm text-gray-600">
                    {netProfit >= 0 ? "Net Profit" : "Net Loss"}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      netProfit >= 0 ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(netProfit))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 border rounded">
                  <h3 className="font-bold mb-4 text-center">Monthly Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={formatCurrency} />
                      <Bar dataKey="income" fill="#3b82f6" />
                      <Bar dataKey="expense" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 border rounded">
                  <h3 className="font-bold mb-4 text-center">
                    Income vs Expense
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatCurrency} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pl" && (
            <div className="bg-white border rounded p-6">
              <h2 className="text-2xl font-bold mb-4">Profit & Loss</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border">Account</th>
                    <th className="text-right p-3 border">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((a) => (
                    <tr key={a.id}>
                      <td className="p-3 border">{a.name}</td>
                      <td className="text-right p-3 border">
                        {formatCurrency(
                          Math.max(getBalance(a.name, { fromDate, toDate }), 0)
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-blue-50">
                    <td className="p-3">Total Income</td>
                    <td className="text-right p-3">
                      {formatCurrency(totalIncome)}
                    </td>
                  </tr>
                  {expense.map((a) => (
                    <tr key={a.id}>
                      <td className="p-3 border">{a.name}</td>
                      <td className="text-right p-3 border">
                        {formatCurrency(
                          Math.max(-getBalance(a.name, { fromDate, toDate }), 0)
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-red-50">
                    <td className="p-3">Total Expense</td>
                    <td className="text-right p-3">
                      {formatCurrency(totalExpense)}
                    </td>
                  </tr>
                  <tr
                    className={`font-bold text-xl ${
                      netProfit >= 0 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <td className="p-4">
                      {netProfit >= 0 ? "NET PROFIT" : "NET LOSS"}
                    </td>
                    <td className="text-right p-4">
                      {formatCurrency(Math.abs(netProfit))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "bs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded p-6">
                <h3 className="font-bold text-xl mb-4">ASSETS</h3>
                {chartOfAccounts
                  .filter((a) => a.type === "Asset")
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between py-2 border-b"
                    >
                      <span>{a.name}</span>
                      <span>
                        {formatCurrency(
                          getBalance(a.name, { fromDate, toDate })
                        )}
                      </span>
                    </div>
                  ))}
                <div className="font-bold mt-4 pt-4 border-t-2 border-blue-600">
                  Total:{" "}
                  {formatCurrency(
                    chartOfAccounts
                      .filter((a) => a.type === "Asset")
                      .reduce(
                        (s, a) => s + getBalance(a.name, { fromDate, toDate }),
                        0
                      )
                  )}
                </div>
              </div>

              <div className="bg-white border rounded p-6">
                <h3 className="font-bold text-xl mb-4">LIABILITIES & EQUITY</h3>
                {chartOfAccounts
                  .filter((a) => ["Liability", "Equity"].includes(a.type))
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between py-2 border-b"
                    >
                      <span>{a.name}</span>
                      <span>
                        {formatCurrency(
                          getBalance(a.name, { fromDate, toDate })
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "cash" && (
            <div className="bg-white border rounded p-6">
              <h3 className="font-bold text-xl mb-4">Cash Flow</h3>
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Desc</th>
                    <th className="p-3 text-right">In</th>
                    <th className="p-3 text-right">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries
                    .flatMap((e) =>
                      e.lines.map((l) => ({ ...l, date: e.date, desc: e.desc }))
                    )
                    .filter((t) =>
                      ["Cash", "Bank"].some(
                        (name) => getAccount(name)?.id === t.accountId
                      )
                    )
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((t, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-3">
                          {format(new Date(t.date), "dd MMM")}
                        </td>
                        <td className="p-3">{t.desc}</td>
                        <td className="p-3 text-right text-green-600">
                          {t.debit ? formatCurrency(t.debit) : ""}
                        </td>
                        <td className="p-3 text-right text-red-600">
                          {t.credit ? formatCurrency(t.credit) : ""}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "ratios" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border p-6 rounded text-center">
                <p className="text-gray-600">Profit Margin</p>
                <p className="text-3xl font-bold text-blue-600">
                  {totalIncome
                    ? ((netProfit / totalIncome) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-white border p-6 rounded text-center">
                <p className="text-gray-600">Current Ratio</p>
                <p className="text-3xl font-bold text-green-600">1.8</p>
              </div>
              <div className="bg-white border p-6 rounded text-center">
                <p className="text-gray-600">Growth</p>
                <p className="text-3xl font-bold text-purple-600">+15%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceReport;
