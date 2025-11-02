import React from "react";

const FinancialReports = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
      <p className="text-gray-600">
        Generate and analyze financial statements, audit summaries, and custom
        reports.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">
            Core Financial Statements
          </h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Balance Sheet</li>
            <li>Profit & Loss Statement</li>
            <li>Cash Flow Statement</li>
            <li>Trial Balance</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Management Reports</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Branch / Unit Wise Performance</li>
            <li>Departmental Expense Analysis</li>
            <li>Cost Center Reports</li>
            <li>Revenue vs Expense Comparison</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">
            Audit & Compliance Reports
          </h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Ledger Audit Trail</li>
            <li>Tax Summary Reports</li>
            <li>Statutory Compliance Overview</li>
            <li>Adjustment & Closing Entries Log</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-2">Custom Reports</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Dynamic Report Builder (Filters, Date Range, Branch)</li>
          <li>Export to Excel / PDF</li>
          <li>Save Report Templates</li>
          <li>Schedule Automated Reports</li>
        </ul>
      </div>
    </div>
  );
};
export default FinancialReports;
