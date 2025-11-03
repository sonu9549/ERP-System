import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Finance = () => {
  const [activeTab, setActiveTab] = useState("accounting");

  // ===== Export Functions =====
  const exportPDF = (title, data, columns) => {
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    doc.autoTable({
      head: [columns],
      body: data.map((row) => Object.values(row)),
      startY: 25,
    });
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
  };

  const exportExcel = (title, data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}.xlsx`);
  };

  // ===== Sample Data =====
  const ledgerData = [
    { ID: 1, Account: "Cash", Debit: 20000, Credit: 0, Date: "2025-10-25" },
    {
      ID: 2,
      Account: "Sales Revenue",
      Debit: 0,
      Credit: 15000,
      Date: "2025-10-25",
    },
    {
      ID: 3,
      Account: "Rent Expense",
      Debit: 3000,
      Credit: 0,
      Date: "2025-10-26",
    },
  ];

  const payableData = [
    {
      ID: 1,
      Vendor: "ABC Supplies",
      Invoice: "INV-001",
      Amount: 5000,
      Status: "Paid",
    },
    {
      ID: 2,
      Vendor: "XYZ Traders",
      Invoice: "INV-002",
      Amount: 7000,
      Status: "Pending",
    },
  ];

  const receivableData = [
    {
      ID: 1,
      Customer: "Global Corp",
      Invoice: "CINV-001",
      Amount: 8000,
      Status: "Received",
    },
    {
      ID: 2,
      Customer: "Delta Ltd",
      Invoice: "CINV-002",
      Amount: 4500,
      Status: "Pending",
    },
  ];

  const assetData = [
    {
      ID: 1,
      Asset: "Office Equipment",
      Value: 20000,
      Depreciation: 10,
      Year: 2025,
    },
    { ID: 2, Asset: "Vehicle", Value: 30000, Depreciation: 15, Year: 2025 },
  ];

  const bankData = [
    {
      ID: 1,
      Bank: "HDFC",
      AccountNo: "12345",
      Type: "Current",
      Balance: 50000,
    },
    { ID: 2, Bank: "SBI", AccountNo: "67890", Type: "Savings", Balance: 75000 },
  ];

  const reportData = [
    { Report: "Balance Sheet", Status: "Generated", Period: "Q4 2025" },
    { Report: "Profit & Loss", Status: "Generated", Period: "Q4 2025" },
    { Report: "Cash Flow", Status: "Pending", Period: "Q4 2025" },
  ];

  // ===== Common Table Renderer =====
  const renderTable = (data) => (
    <div className="overflow-x-auto mt-4 rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-blue-900 text-white">
          <tr>
            {Object.keys(data[0]).map((col) => (
              <th key={col} className="px-4 py-2 text-left uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={`${
                i % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-blue-50`}
            >
              {Object.values(row).map((val, j) => (
                <td key={j} className="px-4 py-2">
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ===== Each Section =====
  const Section = ({ title, description, data }) => (
    <div className="p-4 bg-white rounded-lg shadow-md mb-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-blue-900">{title}</h2>
      <p className="text-gray-600 mb-2">{description}</p>
      {renderTable(data)}
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={() => exportPDF(title, data, Object.keys(data[0]))}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition"
        >
          Export PDF
        </button>
        <button
          onClick={() => exportExcel(title, data)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md transition"
        >
          Export Excel
        </button>
      </div>
    </div>
  );

  // ===== Tab Switcher =====
  const renderContent = () => {
    switch (activeTab) {
      case "accounting":
        return (
          <Section
            title="General Accounting"
            description="Manage ledgers, journal entries, trial balance, and chart of accounts."
            data={ledgerData}
          />
        );
      case "accountsPayable":
        return (
          <Section
            title="Accounts Payable"
            description="Handle vendor invoices, payments, and credit memos."
            data={payableData}
          />
        );
      case "accountsReceivable":
        return (
          <Section
            title="Accounts Receivable"
            description="Manage customer invoices, receipts, and dunning processes."
            data={receivableData}
          />
        );
      case "assetManagement":
        return (
          <Section
            title="Asset Management"
            description="Maintain and depreciate fixed assets."
            data={assetData}
          />
        );
      case "bankAccounting":
        return (
          <Section
            title="Bank Accounting"
            description="Manage bank accounts, statements, and reconciliations."
            data={bankData}
          />
        );
      case "financialReports":
        return (
          <Section
            title="Financial Reports"
            description="Generate and view financial statements and analytics."
            data={reportData}
          />
        );
      default:
        return null;
    }
  };

  // ===== Component UI =====
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">
        Finance Module (SAP FI Style)
      </h1>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: "accounting", label: "General Accounting" },
          { key: "accountsPayable", label: "Accounts Payable" },
          { key: "accountsReceivable", label: "Accounts Receivable" },
          { key: "assetManagement", label: "Asset Management" },
          { key: "bankAccounting", label: "Bank Accounting" },
          { key: "financialReports", label: "Reports" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === tab.key
                ? "bg-blue-900 text-white shadow-md"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};
export default Finance;
