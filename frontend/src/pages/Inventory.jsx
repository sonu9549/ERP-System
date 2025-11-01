import React from "react";

const mockData = {
  totalItems: 480,
  lowStock: 12,
  warehouses: 4,
  recentStock: [
    {
      id: 1,
      item: "Steel Rods",
      category: "Raw Material",
      qty: 120,
      status: "In Stock",
    },
    {
      id: 2,
      item: "Plastic Sheets",
      category: "Raw Material",
      qty: 10,
      status: "Low Stock",
    },
    {
      id: 3,
      item: "Finished Widgets",
      category: "Finished Goods",
      qty: 85,
      status: "In Stock",
    },
    {
      id: 4,
      item: "Aluminium Sheets",
      category: "Raw Material",
      qty: 0,
      status: "Out of Stock",
    },
  ],
};

const Inventory = () => (
  <div className="p-6 bg-white rounded-2xl shadow-md">
    {/* Header */}
    <h1 className="text-2xl font-semibold mb-3">Inventory Management</h1>
    <p className="text-gray-600 mb-6">
      Track stock levels, manage warehouses, and monitor material availability.
    </p>

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm">
        <h3 className="text-gray-600 font-medium mb-2">Total Items</h3>
        <p className="text-3xl font-bold text-blue-700">
          {mockData.totalItems}
        </p>
      </div>
      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl shadow-sm">
        <h3 className="text-gray-600 font-medium mb-2">Low Stock Alerts</h3>
        <p className="text-3xl font-bold text-yellow-700">
          {mockData.lowStock}
        </p>
      </div>
      <div className="bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm">
        <h3 className="text-gray-600 font-medium mb-2">Warehouses</h3>
        <p className="text-3xl font-bold text-green-700">
          {mockData.warehouses}
        </p>
      </div>
    </div>

    {/* Stock Table */}
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Recent Stock Overview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockData.recentStock.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="px-4 py-2">{item.item}</td>
                <td className="px-4 py-2">{item.category}</td>
                <td className="px-4 py-2">{item.qty}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "In Stock"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Low Stock"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="flex flex-wrap gap-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Add New Item
      </button>
      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
        Manage Warehouses
      </button>
      <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
        Reorder Low Stock
      </button>
      <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
        Export Inventory Report
      </button>
    </div>
  </div>
);

export default Inventory;
