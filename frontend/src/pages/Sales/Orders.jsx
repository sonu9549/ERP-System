// src/pages/Sales/Orders.jsx
import React, { useState } from "react";

const Orders = () => {
  const [orders, setOrders] = useState([
    { id: "SO-001", customer: "Acme Corp", amount: 2500, status: "Completed" },
    { id: "SO-002", customer: "Techline Ltd", amount: 1200, status: "Pending" },
  ]);

  const [newOrder, setNewOrder] = useState({ customer: "", amount: "" });

  const handleAdd = () => {
    if (!newOrder.customer || !newOrder.amount) return;
    const id = `SO-${(orders.length + 1).toString().padStart(3, "0")}`;
    setOrders([
      ...orders,
      {
        id,
        customer: newOrder.customer,
        amount: newOrder.amount,
        status: "Pending",
      },
    ]);
    setNewOrder({ customer: "", amount: "" });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales Orders</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Customer Name"
          value={newOrder.customer}
          onChange={(e) =>
            setNewOrder({ ...newOrder, customer: e.target.value })
          }
          className="border border-gray-300 rounded-lg px-4 py-2 w-64"
        />
        <input
          type="number"
          placeholder="Amount"
          value={newOrder.amount}
          onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
          className="border border-gray-300 rounded-lg px-4 py-2 w-32"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Order
        </button>
      </div>

      <table className="w-full border border-gray-200 rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr className="text-left">
            <th className="p-3 border-b">Order ID</th>
            <th className="p-3 border-b">Customer</th>
            <th className="p-3 border-b">Amount ($)</th>
            <th className="p-3 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{o.id}</td>
              <td className="p-3 border-b">{o.customer}</td>
              <td className="p-3 border-b">{o.amount}</td>
              <td className="p-3 border-b">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    o.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {o.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;
