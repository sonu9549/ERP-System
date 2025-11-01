// src/pages/Logistics.jsx
import React from "react";

export const Logistics = () => {
  const mockData = {
    shipments: 28,
    onTimeRate: "95%",
    avgTransitTime: "3.2 days",
    recentShipments: [
      {
        id: 1,
        order: "ORD-101",
        destination: "New York City",
        status: "In Transit",
        eta: "2025-11-01",
      },
      {
        id: 2,
        order: "ORD-102",
        destination: "Los Angeles",
        status: "Delivered",
        eta: "2025-10-30",
      },
      {
        id: 3,
        order: "ORD-103",
        destination: "Chicago",
        status: "Pending",
        eta: "2025-11-02",
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-blue-700">
          Logistics Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage transportation, warehouse operations, and supply chain
          efficiency.
        </p>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Active Shipments</h3>
          <p className="text-3xl font-bold text-blue-600">
            {mockData.shipments}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">On-Time Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {mockData.onTimeRate}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Avg Transit Time</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {mockData.avgTransitTime}
          </p>
        </div>
      </section>

      {/* Recent Shipments */}
      <section className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">
          Recent Shipments
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="text-left px-4 py-2 border-b">Order</th>
                <th className="text-left px-4 py-2 border-b">Destination</th>
                <th className="text-left px-4 py-2 border-b">Status</th>
                <th className="text-left px-4 py-2 border-b">ETA</th>
              </tr>
            </thead>
            <tbody>
              {mockData.recentShipments.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50 transition text-sm"
                >
                  <td className="px-4 py-2 border-b">{item.order}</td>
                  <td className="px-4 py-2 border-b">{item.destination}</td>
                  <td className="px-4 py-2 border-b">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          item.status === "Delivered"
                            ? "bg-green-100 text-green-700"
                            : item.status === "In Transit"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b">{item.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition">
          Schedule New Shipment
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-700 transition">
          Track Warehouse Inventory
        </button>
        <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-yellow-600 transition">
          Generate Logistics Report
        </button>
      </section>
    </div>
  );
};

export default Logistics;
