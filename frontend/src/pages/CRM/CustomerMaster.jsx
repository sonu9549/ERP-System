// src/components/CustomerMaster.jsx
import React, { useState } from "react";
import { useCrm } from "../../context/CRmContext";
import { format } from "date-fns";

const CustomerMaster = () => {
  const { customers, setCustomers, logAudit } = useCrm();

  const [form, setForm] = useState({
    code: `CUS${String(customers.length + 1).padStart(3, "0")}`,
    name: "",
    mobile: "",
    email: "",
    gst: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    openingBal: 0,
    creditLimit: 0,
    status: "Active",
  });

  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const save = () => {
    if (!form.name || !form.mobile) return alert("Name & Mobile required!");

    const customer = {
      id: editId || Date.now().toString(),
      ...form,
      createdAt: editId
        ? customers.find((c) => c.id === editId).createdAt
        : new Date().toISOString(),
    };

    setCustomers((prev) =>
      editId
        ? prev.map((c) => (c.id === editId ? customer : c))
        : [...prev, customer]
    );

    logAudit(editId ? "Customer Updated" : "Customer Added", {
      name: form.name,
    });
    alert(editId ? "Updated!" : "Customer Added!");
    resetForm();
  };

  const resetForm = () => {
    setForm({
      code: `CUS${String(customers.length + (editId ? 0 : 1)).padStart(
        3,
        "0"
      )}`,
      name: "",
      mobile: "",
      email: "",
      gst: "",
      address: "",
      city: "",
      pincode: "",
      openingBal: 0,
      creditLimit: 0,
      status: "Active",
    });
    setEditId(null);
  };

  const edit = (c) => {
    setForm(c);
    setEditId(c.id);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.code.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* HEADER */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-3xl font-bold">Customer Master</h1>
          <p>Manage all your clients in one place</p>
        </div>

        <div className="p-6">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search by Name, Mobile, Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border-2 border-blue-300 rounded-lg mb-6 text-lg"
          />

          {/* FORM */}
          <div className="bg-gray-50 p-6 rounded-xl border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                placeholder="Code"
                value={form.code}
                readOnly
                className="p-3 bg-gray-200 rounded font-mono"
              />
              <input
                placeholder="Customer Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="p-3 border rounded"
              />
              <input
                placeholder="Mobile *"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="p-3 border rounded"
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="p-3 border rounded"
              />
              <input
                placeholder="GST No"
                value={form.gst}
                onChange={(e) => setForm({ ...form, gst: e.target.value })}
                className="p-3 border rounded"
              />
              <input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="p-3 border rounded"
              />
              <input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="p-3 border rounded"
              />
              <input
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="p-3 border rounded"
              />
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="p-3 border rounded"
              >
                <option>Maharashtra</option>
                <option>Gujarat</option>
                <option>Delhi</option>
              </select>
              <input
                type="number"
                placeholder="Opening Balance"
                value={form.openingBal}
                onChange={(e) =>
                  setForm({ ...form, openingBal: +e.target.value })
                }
                className="p-3 border rounded"
              />
              <input
                type="number"
                placeholder="Credit Limit"
                value={form.creditLimit}
                onChange={(e) =>
                  setForm({ ...form, creditLimit: +e.target.value })
                }
                className="p-3 border rounded"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="p-3 border rounded"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={save}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                {editId ? "UPDATE" : "SAVE"} CUSTOMER
              </button>
              {editId && (
                <button
                  onClick={resetForm}
                  className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">City</th>
                  <th className="p-3 text-left">Balance</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3 font-semibold">{c.name}</td>
                    <td className="p-3">{c.mobile}</td>
                    <td className="p-3">{c.city}</td>
                    <td className="p-3 text-right">₹{c.openingBal}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          c.status === "Active"
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => edit(c)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMaster;
