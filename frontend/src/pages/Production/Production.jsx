import React, { useState } from "react";
import {
  PlusCircle,
  ClipboardList,
  CalendarDays,
  Factory,
  Package,
  TrendingUp,
} from "lucide-react";

// Mock data for demo (replace with API later)
const mockProduction = {
  workOrders: 14,
  totalOutput: 12850,
  efficiency: 93,
  downtime: "2h 15m",
  recentOrders: [
    {
      id: 101,
      product: "Widget A",
      quantity: 500,
      status: "In Progress",
      due: "2025-11-03",
      assignedTo: "Line 2",
    },
    {
      id: 102,
      product: "Gadget B",
      quantity: 300,
      status: "Completed",
      due: "2025-10-30",
      assignedTo: "Line 1",
    },
    {
      id: 103,
      product: "Tool C",
      quantity: 450,
      status: "Scheduled",
      due: "2025-11-05",
      assignedTo: "Line 3",
    },
  ],
};

const Production = () => {
  const [data, setData] = useState(mockProduction);

  const handleNewWorkOrder = () => {
    alert("Opening work order creation form...");
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Factory className="text-blue-600" /> Production Management
          </h1>
          <p className="text-gray-600">
            Manage manufacturing orders, BOMs, scheduling, and shop floor
            execution.
          </p>
        </div>
        <button
          onClick={handleNewWorkOrder}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          <PlusCircle size={18} /> New Work Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Active Work Orders</span>
            <ClipboardList className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{data.workOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Total Output</span>
            <Package className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{data.totalOutput} units</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Efficiency</span>
            <TrendingUp className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{data.efficiency}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Downtime</span>
            <CalendarDays className="text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{data.downtime}</p>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Recent Work Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Assigned Line</th>
                <th className="px-4 py-2 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50 transition-all"
                >
                  <td className="px-4 py-2 font-semibold text-gray-700">
                    #{item.id}
                  </td>
                  <td className="px-4 py-2">{item.product}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : item.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{item.assignedTo}</td>
                  <td className="px-4 py-2">{item.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow">
          View BOM
        </button>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow">
          Schedule Production
        </button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 shadow">
          Resource Utilization
        </button>
        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 shadow">
          Machine Downtime Report
        </button>
      </div>
    </div>
  );
};

export default Production;
