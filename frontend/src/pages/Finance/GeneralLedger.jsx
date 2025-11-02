import React, { useState } from "react";

const GeneralLedger = () => {
  const [activeTab, setActiveTab] = useState("chart");
  const [branchFilter, setBranchFilter] = useState("All");
  const [closingYear, setClosingYear] = useState(new Date().getFullYear());

  const tabs = [
    { id: "chart", label: "Chart of Accounts" },
    { id: "journal", label: "Journal Entries" },
    { id: "opening", label: "Opening Balances" },
    { id: "yearend", label: "Year-End Closing" },
    { id: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">General Ledger</h1>
        <div className="flex items-center gap-3">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded-md text-gray-700"
          >
            <option>All</option>
            <option>HQ</option>
            <option>Unit A</option>
            <option>Unit B</option>
          </select>
          <div className="text-sm text-gray-700">
            Year:{" "}
            <input
              type="number"
              value={closingYear}
              onChange={(e) => setClosingYear(e.target.value)}
              className="w-24 border border-gray-300 rounded-md p-1 ml-2"
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === "chart" && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Chart of Accounts</h2>
            <p className="text-gray-600 mb-4">
              Manage the list of accounts categorized by Assets, Liabilities,
              Income, and Expenses. Each account can be customized by branch or
              unit.
            </p>
            <ul className="divide-y divide-gray-200">
              <li className="py-2 flex justify-between">
                <span>💰 Cash (Assets - HQ)</span>
                <span className="text-green-600">Balance: ₹15,000</span>
              </li>
              <li className="py-2 flex justify-between">
                <span>📦 Accounts Payable (Liabilities - HQ)</span>
                <span className="text-red-600">Balance: -₹4,000</span>
              </li>
              <li className="py-2 flex justify-between">
                <span>💼 Sales (Income - Unit A)</span>
                <span className="text-green-600">Balance: ₹24,000</span>
              </li>
            </ul>
          </div>
        )}

        {activeTab === "journal" && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Journal Entries</h2>
            <p className="text-gray-600 mb-4">
              Record and manage manual or automated journal entries. Ensure
              total debit equals total credit for every entry.
            </p>
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <p>
                <strong>Date:</strong> 2025-10-01
              </p>
              <p>
                <strong>Description:</strong> Opening Balances
              </p>
              <table className="w-full mt-3 border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Account</th>
                    <th className="p-2 border">Debit</th>
                    <th className="p-2 border">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Cash</td>
                    <td className="border p-2">₹15,000</td>
                    <td className="border p-2">-</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Accounts Payable</td>
                    <td className="border p-2">-</td>
                    <td className="border p-2">₹4,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "opening" && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Opening Balances</h2>
            <p className="text-gray-600 mb-4">
              Set or adjust opening balances for each account at the beginning
              of the financial year.
            </p>
            <form className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Account Code"
                  className="border p-2 rounded-md flex-1"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="border p-2 rounded-md w-32"
                />
                <select className="border p-2 rounded-md w-28">
                  <option>Debit</option>
                  <option>Credit</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "yearend" && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Year-End Closing</h2>
            <p className="text-gray-600 mb-4">
              Close the current year by transferring income and expense balances
              to retained earnings.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Perform Year-End Closing
            </button>
          </div>
        )}

        {activeTab === "audit" && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Audit Trail</h2>
            <p className="text-gray-600 mb-4">
              Track every action performed in the General Ledger module.
            </p>
            <ul className="divide-y divide-gray-200 text-sm text-gray-700">
              <li className="py-2">
                ✅ Module loaded — by admin — 2025-10-01 10:00 AM
              </li>
              <li className="py-2">
                📝 Added Journal Entry — Opening Balances
              </li>
              <li className="py-2">🔄 Year-End Closing — 2024 completed</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralLedger;
