import React from "react";
import { BrowserRouter } from "react-router-dom";
import { NavLink, Routes, Route, useLocation } from "react-router-dom";
import { LogisticProvider, useLogistic } from "../../context/logisticContext";

/* ====================== SUB-COMPONENTS ====================== */
const Dashboard = () => {
  const { warehouse, inventory } = useLogistic();
  const occupiedPct = ((warehouse.occupied / warehouse.capacity) * 100).toFixed(
    1
  );
  const lowStockCount = inventory.filter((i) => i.qty <= i.minStock).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Capacity</p>
          <p className="text-2xl font-semibold">{warehouse.capacity}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-sm text-gray-600">Occupied</p>
          <p className="text-2xl font-semibold">{warehouse.occupied}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-sm text-gray-600">Utilisation</p>
          <p className="text-2xl font-semibold">{occupiedPct}%</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-semibold">{lowStockCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavLink
          to="inbound"
          className="bg-indigo-50 p-6 rounded-lg text-center hover:bg-indigo-100 transition"
        >
          <h3 className="font-medium text-indigo-700">Receive Inbound</h3>
        </NavLink>
        <NavLink
          to="outbound"
          className="bg-green-50 p-6 rounded-lg text-center hover:bg-green-100 transition"
        >
          <h3 className="font-medium text-green-700">Ship Outbound</h3>
        </NavLink>
        <NavLink
          to="transfer"
          className="bg-amber-50 p-6 rounded-lg text-center hover:bg-amber-100 transition"
        >
          <h3 className="font-medium text-amber-700">Transfer Stock</h3>
        </NavLink>
      </div>
    </div>
  );
};

const InventoryList = () => {
  const { inventory } = useLogistic();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Inventory</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map((item) => {
              const low = item.qty <= item.minStock;
              return (
                <tr key={item.id} className={low ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        low
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {low ? "Low Stock" : "Healthy"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InboundOrders = () => {
  const { inboundOrders } = useLogistic();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Inbound Orders</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          + New PO
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                PO #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expected
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inboundOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.po}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.supplier}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.items}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.expected}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === "Received"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OutboundOrders = () => {
  const { outboundOrders } = useLogistic();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Outbound Orders</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + New SO
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SO #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Shipped On
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {outboundOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.so}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.customer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.items}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.shipped || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === "Shipped"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockTransfer = () => {
  const { stockTransfers } = useLogistic();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Stock Transfers</h2>
        <button className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
          + New Transfer
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                From to To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockTransfers.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {t.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {t.from} to {t.to}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{t.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{t.qty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {t.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      t.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ====================== LAYOUT ====================== */
const Layout = () => {
  const { warehouse } = useLogistic();
  const location = useLocation();
  const path = location.pathname.split("/").pop() || "dashboard";
  const titles = {
    "": "Dashboard",
    inventory: "Inventory",
    inbound: "Inbound Orders",
    outbound: "Outbound Orders",
    transfer: "Stock Transfers",
  };

  const nav = [
    { to: "", name: "Dashboard", end: true },
    { to: "inventory", name: "Inventory" },
    { to: "inbound", name: "Inbound" },
    { to: "outbound", name: "Outbound" },
    { to: "transfer", name: "Stock Transfer" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Warehouse Management
          </h1>
          <span className="text-sm text-gray-600">
            {warehouse.warehouseId} – {warehouse.name}
          </span>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white shadow-md h-screen sticky top-0">
          <nav className="mt-5 px-2">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded transition duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {titles[path]}
          </h2>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="inbound" element={<InboundOrders />} />
            <Route path="outbound" element={<OutboundOrders />} />
            <Route path="transfer" element={<StockTransfer />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

/* ====================== MAIN EXPORT ====================== */

export default function WarehouseManagement() {
  return (
    <LogisticProvider>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </LogisticProvider>
  );
}
