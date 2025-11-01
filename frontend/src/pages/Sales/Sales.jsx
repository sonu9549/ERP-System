// src/pages/Sales/Sales.jsx
import React, { useState } from "react";
import Orders from "./Orders";
import Outbound from "./Outbound";
import Inbound from "./Inbound";
import Billing from "./Billing";
import Reports from "./Reports";

const Sales = () => {
  const [activeTab, setActiveTab] = useState("Orders");

  const renderTab = () => {
    switch (activeTab) {
      case "Orders":
        return <Orders />;
      case "Outbound":
        return <Outbound />;
      case "Inbound":
        return <Inbound />;
      case "Billing":
        return <Billing />;
      case "Reports":
        return <Reports />;
      default:
        return <Orders />;
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Sales & Distribution
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["Orders", "Outbound", "Inbound", "Billing", "Reports"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow p-6">{renderTab()}</div>
    </div>
  );
};

export default Sales;
