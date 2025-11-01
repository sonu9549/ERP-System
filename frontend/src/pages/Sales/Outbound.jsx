// src/pages/Sales/Outbound.jsx
import React, { useState } from "react";

const Outbound = () => {
  const [deliveries, setDeliveries] = useState([
    {
      id: "DEL-001",
      orderId: "SO-001",
      customer: "Acme Corp",
      status: "Shipped",
    },
    {
      id: "DEL-002",
      orderId: "SO-002",
      customer: "Techline Ltd",
      status: "Pending",
    },
  ]);

  const updateStatus = (id, newStatus) => {
    setDeliveries(
      deliveries.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Outbound Deliveries
      </h2>
      <table className="w-full border border-gray-200 rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr className="text-left">
            <th className="p-3 border-b">Delivery ID</th>
            <th className="p-3 border-b">Order ID</th>
            <th className="p-3 border-b">Customer</th>
            <th className="p-3 border-b">Status</th>
            <th className="p-3 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{d.id}</td>
              <td className="p-3 border-b">{d.orderId}</td>
              <td className="p-3 border-b">{d.customer}</td>
              <td className="p-3 border-b">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    d.status === "Shipped"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {d.status}
                </span>
              </td>
              <td className="p-3 border-b">
                {d.status !== "Shipped" && (
                  <button
                    onClick={() => updateStatus(d.id, "Shipped")}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Mark Shipped
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Outbound;
