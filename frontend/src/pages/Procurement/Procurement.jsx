import React, { useState } from "react";

const Procurement = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const data = {
    kpis: {
      orders: 15,
      vendors: 8,
      savings: "$2,450",
    },
    recentPOs: [
      {
        id: 1,
        vendor: "Supplier X",
        item: "Raw Material A",
        amount: 1200,
        status: "Approved",
      },
      {
        id: 2,
        vendor: "Supplier Y",
        item: "Component B",
        amount: 800,
        status: "Pending",
      },
      {
        id: 3,
        vendor: "Supplier Z",
        item: "Tool C",
        amount: 650,
        status: "Received",
      },
    ],
    vendors: [
      {
        id: 1,
        name: "Supplier X",
        rating: "A",
        location: "Mumbai",
        totalSpend: "$12,000",
      },
      {
        id: 2,
        name: "Supplier Y",
        rating: "B",
        location: "Delhi",
        totalSpend: "$8,400",
      },
    ],
  };

  const KPICard = ({ title, value }) => (
    <div className="bg-white shadow-md rounded-xl p-4 flex flex-col justify-center items-center hover:shadow-lg transition">
      <h3 className="text-gray-700 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-blue-600 mt-1">{value}</p>
    </div>
  );

  const PurchaseOrderTable = ({ data }) => (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Recent Purchase Orders
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 text-left">Vendor</th>
            <th className="py-2 text-left">Item</th>
            <th className="py-2 text-left">Amount</th>
            <th className="py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((po) => (
            <tr key={po.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{po.vendor}</td>
              <td>{po.item}</td>
              <td>${po.amount}</td>
              <td>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    po.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : po.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {po.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const VendorTable = ({ vendors }) => (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Active Vendors
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 text-left">Vendor Name</th>
            <th className="py-2 text-left">Rating</th>
            <th className="py-2 text-left">Location</th>
            <th className="py-2 text-left">Total Spend</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{v.name}</td>
              <td>{v.rating}</td>
              <td>{v.location}</td>
              <td>{v.totalSpend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const QuickActions = () => (
    <div className="flex gap-3 mt-6">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        Create Purchase Requisition
      </button>
      <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
        Manage Vendors
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Procurement Dashboard
        </h1>
        <p className="text-gray-600">
          Manage vendors, purchase orders, requisitions, and supplier
          performance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {["overview", "purchase-orders", "vendors"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "overview"
              ? "Overview"
              : tab === "purchase-orders"
              ? "Purchase Orders"
              : "Vendors"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Open Purchase Orders" value={data.kpis.orders} />
            <KPICard title="Active Vendors" value={data.kpis.vendors} />
            <KPICard title="Cost Savings" value={data.kpis.savings} />
          </div>
          <PurchaseOrderTable data={data.recentPOs} />
          <QuickActions />
        </>
      )}

      {activeTab === "purchase-orders" && (
        <PurchaseOrderTable data={data.recentPOs} />
      )}
      {activeTab === "vendors" && <VendorTable vendors={data.vendors} />}
    </div>
  );
};

export default Procurement;
