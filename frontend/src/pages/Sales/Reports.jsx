// src/pages/Sales/Reports.jsx
import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Reports = () => {
  const reportData = [
    { report: "Monthly Sales", status: "Completed", period: "Oct 2025" },
    { report: "Customer Aging", status: "Pending", period: "Oct 2025" },
    { report: "Revenue Summary", status: "Completed", period: "Q4 2025" },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Reports Summary", 14, 16);
    doc.autoTable({
      head: [["Report Name", "Status", "Period"]],
      body: reportData.map((r) => [r.report, r.status, r.period]),
      startY: 25,
    });
    doc.save("Sales_Reports.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "Sales_Reports.xlsx");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Sales Reports
      </h2>
      <table className="w-full border border-gray-200 rounded-lg text-sm mb-6">
        <thead className="bg-gray-100">
          <tr className="text-left">
            <th className="p-3 border-b">Report</th>
            <th className="p-3 border-b">Status</th>
            <th className="p-3 border-b">Period</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="p-3 border-b">{r.report}</td>
              <td className="p-3 border-b">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    r.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="p-3 border-b">{r.period}</td>
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

export default Reports;
