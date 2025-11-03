// LeaveManagement.jsx
import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";

const LeaveManagement = ({
  employees = [],
  leaves = [],
  setLeaves,
  logAudit,
  leaveTypes = [],
  branchFilter = "All",
}) => {
  const [form, setForm] = useState({
    empId: "",
    type: leaveTypes[0] || "Casual Leave (CL)",
    from: "",
    to: "",
    reason: "",
  });

  // Filter employees by branch
  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === "Active" &&
        (branchFilter === "All" || e.branch === branchFilter)
    );
  }, [employees, branchFilter]);

  // Filter leaves by branch
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const emp = employees.find((e) => e.id === l.empId);
      return branchFilter === "All" || emp?.branch === branchFilter;
    });
  }, [leaves, employees, branchFilter]);

  const applyLeave = () => {
    if (!form.empId || !form.from || !form.to) {
      return alert("Please select employee and dates");
    }
    if (new Date(form.from) > new Date(form.to)) {
      return alert("From date cannot be after To date");
    }

    const newLeave = {
      id: Date.now(),
      empId: +form.empId,
      type: form.type,
      from: form.from,
      to: form.to,
      reason: form.reason,
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
    };

    setLeaves((prev) => [...prev, newLeave]);
    logAudit("Leave Applied", {
      empId: form.empId,
      type: form.type,
      from: form.from,
      to: form.to,
    });

    // Reset form
    setForm({ ...form, from: "", to: "", reason: "" });
    alert("Leave applied successfully!");
  };

  const approveLeave = (id) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Approved" } : l))
    );
    logAudit("Leave Approved", { leaveId: id });
  };

  const rejectLeave = (id) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Rejected" } : l))
    );
    logAudit("Leave Rejected", { leaveId: id });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">Leave Management</h2>

      {/* === APPLY LEAVE FORM === */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Apply Leave</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={form.empId}
            onChange={(e) => setForm({ ...form, empId: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">Select Employee</option>
            {filteredEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.empId} - {e.name}
              </option>
            ))}
          </select>

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border p-2 rounded"
          >
            {leaveTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <input
            type="date"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="border p-2 rounded md:col-span-2"
          />
          <button
            onClick={applyLeave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply Leave
          </button>
        </div>
      </div>

      {/* === LEAVE REQUESTS TABLE === */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Employee</th>
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-left">From</th>
              <th className="border p-2 text-left">To</th>
              <th className="border p-2 text-left">Applied On</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No leave requests
                </td>
              </tr>
            ) : (
              filteredLeaves.map((l) => {
                const emp = employees.find((e) => e.id === l.empId);
                return (
                  <tr
                    key={l.id}
                    className={l.status === "Pending" ? "bg-yellow-50" : ""}
                  >
                    <td className="border p-1">{emp?.name || "Unknown"}</td>
                    <td className="border p-1">{l.type}</td>
                    <td className="border p-1">
                      {format(parseISO(l.from), "dd MMM")}
                    </td>
                    <td className="border p-1">
                      {format(parseISO(l.to), "dd MMM")}
                    </td>
                    <td className="border p-1">
                      {format(parseISO(l.appliedOn), "dd MMM")}
                    </td>
                    <td className="border p-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          l.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : l.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="border p-1">
                      {l.status === "Pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => approveLeave(l.id)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectLeave(l.id)}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* === LEAVE SUMMARY === */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 p-4 rounded">
          <p className="font-semibold">Total Requests</p>
          <p className="text-2xl font-bold">{filteredLeaves.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="font-semibold">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredLeaves.filter((l) => l.status === "Approved").length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <p className="font-semibold">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredLeaves.filter((l) => l.status === "Pending").length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
