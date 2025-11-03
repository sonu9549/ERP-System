// src/pages/QualityManagement.jsx
import React from "react";

const QualityManagement = () => {
  const mockData = {
    inspections: 45,
    defects: 3,
    complianceRate: "98.5%",
    recentInspections: [
      {
        id: 1,
        product: "Widget A",
        stage: "Production",
        result: "Pass",
        date: "2025-10-30",
      },
      {
        id: 2,
        product: "Gadget B",
        stage: "Procurement",
        result: "Fail",
        date: "2025-10-29",
      },
      {
        id: 3,
        product: "Tool C",
        stage: "Inventory",
        result: "Pass",
        date: "2025-10-28",
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-purple-700">
          Quality Management
        </h1>
        <p className="text-gray-600 mt-2">
          Ensure consistent product standards through inspections, compliance
          checks, and defect tracking.
        </p>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">
            Total Inspections
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {mockData.inspections}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Defects Found</h3>
          <p className="text-3xl font-bold text-red-600">{mockData.defects}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Compliance Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {mockData.complianceRate}
          </p>
        </div>
      </section>

      {/* Recent Inspections */}
      <section className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">
          Recent Inspections
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="text-left px-4 py-2 border-b">Product</th>
                <th className="text-left px-4 py-2 border-b">Stage</th>
                <th className="text-left px-4 py-2 border-b">Result</th>
                <th className="text-left px-4 py-2 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockData.recentInspections.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-purple-50 transition text-sm"
                >
                  <td className="px-4 py-2 border-b">{item.product}</td>
                  <td className="px-4 py-2 border-b">{item.stage}</td>
                  <td className="px-4 py-2 border-b">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          item.result === "Pass"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {item.result}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4">
        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-purple-700 transition">
          Create Inspection Plan
        </button>
        <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-red-700 transition">
          View Non-Conformance Reports
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-700 transition">
          Generate Compliance Report
        </button>
      </section>
    </div>
  );
};

export default QualityManagement;
