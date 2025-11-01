// src/pages/Sales/Billing.jsx
import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Billing = () => {
  const invoices = [
    { id: "INV-001", customer: "Acme Corp", total: 2500, status: "Paid" },
    { id: "INV-002", customer: "Techline Ltd", total: 1200, status: "Unpaid" },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Billing Report", 14, 16);
    doc.autoTable({
      head: [["Invoice ID", "Customer", "Total", "Status"]],
      body: invoices.map((i) => [i.id, i.customer, i.total, i.status]),
      startY: 25,
    });
    doc.save("Billing_Report.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(invoices);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "Billing_Report.xlsx");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Billing</h2>
      <table className="w-full border border-gray-200 rounded-lg text-sm mb-6">
        <thead className="bg-gray-100">
          <tr className="text-left">
            <th className="p-3 border-b">Invoice ID</th>
            <th className="p-3 border-b">Customer</th>
            <th className="p-3 border-b">Total ($)</th>
            <th className="p-3 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{i.id}</td>
              <td className="p-3 border-b">{i.customer}</td>
              <td className="p-3 border-b">{i.total}</td>
              <td className="p-3 border-b">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    i.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {i.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4">
        <button
          onClick={exportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Export PDF
        </button>
        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Export Excel
        </button>
      </div>
    </div>
  );
};

export default Billing;
