// src/pages/Sales/Inbound.jsx
import React, { useState } from "react";

const Inbound = () => {
  const [receipts, setReceipts] = useState([
    { id: "REC-001", vendor: "Global Traders", items: 40, status: "Received" },
    { id: "REC-002", vendor: "Delta Supplies", items: 60, status: "Pending" },
  ]);

  const updateStatus = (id, newStatus) => {
    setReceipts(
      receipts.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Inbound Receipts
      </h2>
      <table className="w-full border border-gray-200 rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr className="text-left">
            <th className="p-3 border-b">Receipt ID</th>
            <th className="p-3 border-b">Vendor</th>
            <th className="p-3 border-b">Items</th>
            <th className="p-3 border-b">Status</th>
            <th className="p-3 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{r.id}</td>
              <td className="p-3 border-b">{r.vendor}</td>
              <td className="p-3 border-b">{r.items}</td>
              <td className="p-3 border-b">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    r.status === "Received"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="p-3 border-b">
                {r.status !== "Received" && (
                  <button
                    onClick={() => updateStatus(r.id, "Received")}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Confirm Receipt
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

export default Inbound;
