// src/modules/hr/EmployeeManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import Papa from "papaparse";
import { useFinance } from "../../context/FinanceContext";
import OnboardingModule from "./OnboardingModule";
import Payroll from "./Payroll";
// === ATTENDANCE COMPONENT (Fixed & Improved) ===
const Attendance = ({
  employees = [],
  attendance = [],
  setAttendance,
  logAudit,
  branchFilter = "All",
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = employees.filter(
    (e) =>
      e.status === "Active" &&
      (branchFilter === "All" || e.branch === branchFilter)
  );

  const markInOut = (empId, type) => {
    const existing = attendance.find(
      (a) => a.empId === empId && a.date === today
    );
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (existing) {
      if (type === "in" && existing.inTime) return alert("Already clocked in");
      if (type === "out" && existing.outTime)
        return alert("Already clocked out");

      setAttendance((prev) =>
        prev.map((a) =>
          a.id === existing.id
            ? { ...a, [type === "in" ? "inTime" : "outTime"]: time }
            : a
        )
      );
    } else {
      setAttendance((prev) => [
        ...prev,
        {
          id: Date.now(),
          empId,
          date: today,
          inTime: type === "in" ? time : null,
          outTime: null,
        },
      ]);
    }
    logAudit(`Attendance ${type.toUpperCase()}`, { empId, time });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Attendance</h2>
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No active employees in this branch
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
              <tr>
                <th className="border p-2 text-left font-medium">Emp ID</th>
                <th className="border p-2 text-left font-medium">Name</th>
                <th className="border p-2 text-left font-medium">In</th>
                <th className="border p-2 text-left font-medium">Out</th>
                <th className="border p-2 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const rec = attendance.find(
                  (a) => a.empId === emp.id && a.date === today
                );
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="border p-2">{emp.empId}</td>
                    <td className="border p-2 font-medium">{emp.name}</td>
                    <td className="border p-2">{rec?.inTime || "-"}</td>
                    <td className="border p-2">{rec?.outTime || "-"}</td>
                    <td className="border p-2">
                      <div className="flex gap-2">
                        {!rec?.inTime && (
                          <button
                            onClick={() => markInOut(emp.id, "in")}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            IN
                          </button>
                        )}
                        {rec?.inTime && !rec?.outTime && (
                          <button
                            onClick={() => markInOut(emp.id, "out")}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            OUT
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// === MAIN COMPONENT ===
const EmployeeManagement = () => {
  const finance = useFinance() || {};
  const {
    postToGL = () => {},
    formatCurrency = (v) => `₹${v.toLocaleString()}`,
    logAudit: financeLogAudit = () => {},
    branches = ["HQ", "Unit A", "Unit B"],
  } = finance;

  // === LOCAL STATE (Safe Load) ===
  const load = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [employees, setEmployees] = useState(() => load("hr_employees", []));
  const [leaves, setLeaves] = useState(() => load("hr_leaves", []));
  const [attendance, setAttendance] = useState(() => load("hr_attendance", []));
  const [auditLogs, setAuditLogs] = useState(() => load("hr_audit", []));
  const [activeTab, setActiveTab] = useState("employees");
  const [branchFilter, setBranchFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const user = { name: "HR Manager", ip: "192.168.1.20" };

  // === AUTO-SAVE ===
  useEffect(() => {
    const save = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error("Save failed:", e);
      }
    };
    save("hr_employees", employees);
    save("hr_leaves", leaves);
    save("hr_attendance", attendance);
    save("hr_audit", auditLogs);
  }, [employees, leaves, attendance, auditLogs]);

  // === SEED DATA ===
  useEffect(() => {
    if (employees.length === 0) {
      const seed = [
        {
          id: 1,
          empId: "EMP001",
          name: "Amit Sharma",
          email: "amit@company.com",
          phone: "9876543210",
          branch: "HQ",
          department: "Finance",
          designation: "Accountant",
          joinDate: "2023-01-15",
          salary: 50000,
          bankName: "HDFC",
          accountNo: "1234567890",
          ifsc: "HDFC0001234",
          pan: "ABCDE1234F",
          aadhaar: "1234-5678-9012",
          status: "Active",
        },
      ];
      setEmployees(seed);
      logHR("HR Module Initialized");
    }
  }, [employees]);

  // === AUDIT LOG ===
  const logHR = (action, details = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      user: user.name,
      details: typeof details === "object" ? JSON.stringify(details) : details,
    };
    setAuditLogs((prev) => [...prev, log]);
    financeLogAudit?.("HR", action, details);
  };

  // === FILTERED EMPLOYEES ===
  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (e) => branchFilter === "All" || e.branch === branchFilter
      ),
    [employees, branchFilter]
  );

  // === TABS ===
  const tabs = [
    { id: "employees", label: "Employees" },
    { id: "attendance", label: "Attendance" },
    { id: "leaves", label: "Leave Management" },
    { id: "payroll", label: "Payroll" },
    { id: "documents", label: "Documents" },
    { id: "reports", label: "HR Reports" },
    { id: "audit", label: "Audit Trail" },
    { id: "import", label: "Import / Export" },
    { id: "onboarding", label: "Onboarding & Requisitions" },
  ];

  const leaveTypes = [
    "Casual Leave (CL)",
    "Sick Leave (SL)",
    "Paid Leave (PL)",
    "Unpaid Leave",
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          HR & Employee Management
        </h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border rounded px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Branches</option>
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
          >
            + Add Employee
          </button>
        </div>
      </header>

      {/* TABS */}
      <nav className="flex flex-wrap gap-2 mb-6 overflow-x-auto border-b pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow"
                : "bg-white border border-b-0 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* EMPLOYEES */}
        {activeTab === "employees" && (
          <EmployeeDirectory
            employees={filteredEmployees}
            setEmployees={setEmployees}
            logAudit={logHR}
          />
        )}

        {/* ATTENDANCE */}
        {activeTab === "attendance" && (
          <Attendance
            employees={employees}
            attendance={attendance}
            setAttendance={setAttendance}
            logAudit={logHR}
            branchFilter={branchFilter}
          />
        )}

        {/* LEAVE MANAGEMENT */}
        {activeTab === "leaves" && (
          <LeaveManagement
            employees={employees}
            leaves={leaves}
            setLeaves={setLeaves}
            logAudit={logHR}
            leaveTypes={leaveTypes}
          />
        )}

        {/* PAYROLL SYNC */}
        {activeTab === "payroll" && <Payroll />}

        {/* DOCUMENTS */}
        {activeTab === "documents" && <DocumentVault employees={employees} />}

        {/* REPORTS */}
        {activeTab === "reports" && (
          <HRReports
            employees={employees}
            leaves={leaves}
            attendance={attendance}
          />
        )}

        {/* AUDIT TRAIL */}
        {activeTab === "audit" && <HRAuditTrail logs={auditLogs} />}

        {/* IMPORT/EXPORT */}
        {activeTab === "import" && (
          <HRImportExport employees={employees} setEmployees={setEmployees} />
        )}

        {/* ONBOARDING */}
        {activeTab === "onboarding" && <OnboardingModule />}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSave={(emp) => {
            const newEmp = { ...emp, id: Date.now(), status: "Active" };
            setEmployees((prev) => [...prev, newEmp]);
            logHR("Employee Added", { empId: emp.empId, name: emp.name });
            setShowAddModal(false);
          }}
          branches={branches}
        />
      )}
    </div>
  );
};

// === SUB-COMPONENTS (All Updated & Safe) ===

const EmployeeDirectory = ({ employees, setEmployees, logAudit }) => {
  const terminate = (id) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Terminated",
              exitDate: format(new Date(), "yyyy-MM-dd"),
            }
          : e
      )
    );
    logAudit("Employee Terminated", { id });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Employee Directory
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <tr>
              <th className="border p-2 text-left font-medium">ID</th>
              <th className="border p-2 text-left font-medium">Name</th>
              <th className="border p-2 text-left font-medium">Dept</th>
              <th className="border p-2 text-left font-medium">Branch</th>
              <th className="border p-2 text-left font-medium">Status</th>
              <th className="border p-2 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No employees
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="border p-2">{e.empId}</td>
                  <td className="border p-2 font-medium">{e.name}</td>
                  <td className="border p-2">{e.department}</td>
                  <td className="border p-2">{e.branch}</td>
                  <td className="border p-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        e.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="border p-2">
                    {e.status === "Active" && (
                      <button
                        onClick={() => terminate(e.id)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AddEmployeeModal = ({ onClose, onSave, branches = [] }) => {
  const [form, setForm] = useState({
    empId: "",
    name: "",
    email: "",
    phone: "",
    branch: branches[0] || "",
    department: "",
    designation: "",
    joinDate: "",
    salary: 0,
    bankName: "",
    accountNo: "",
    ifsc: "",
    pan: "",
    aadhaar: "",
  });

  const handleSave = () => {
    if (!form.empId || !form.name) return alert("Emp ID & Name are required");
    onSave({ ...form, salary: +form.salary || 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <h3 className="text-xl font-bold mb-5 text-gray-800">
          Add New Employee
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(form).map((key) => {
            if (key === "salary")
              return (
                <input
                  key={key}
                  type="number"
                  placeholder="Salary"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              );
            if (key === "joinDate")
              return (
                <input
                  key={key}
                  type="date"
                  placeholder="Join Date"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              );
            if (key === "branch")
              return (
                <select
                  key={key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  {branches.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              );
            return (
              <input
                key={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            );
          })}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const LeaveManagement = ({
  employees = [],
  leaves = [],
  setLeaves,
  logAudit,
  leaveTypes = [],
}) => {
  const [form, setForm] = useState({
    empId: "",
    type: leaveTypes[0] || "",
    from: "",
    to: "",
    reason: "",
  });

  const applyLeave = () => {
    if (!form.empId || !form.from || !form.to) return alert("Fill all fields");
    const newLeave = {
      ...form,
      id: Date.now(),
      status: "Pending",
      appliedOn: format(new Date(), "yyyy-MM-dd"),
    };
    setLeaves((prev) => [...prev, newLeave]);
    logAudit("Leave Applied", { empId: form.empId, type: form.type });
    setForm({ ...form, from: "", to: "", reason: "" });
  };

  const approve = (id) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Approved" } : l))
    );
    logAudit("Leave Approved", { id });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Leave Management
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-indigo-50 rounded-lg">
        <select
          value={form.empId}
          onChange={(e) => setForm({ ...form, empId: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Select Employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.empId} - {e.name}
            </option>
          ))}
        </select>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border rounded px-3 py-2"
        >
          {leaveTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          type="date"
          value={form.from}
          onChange={(e) => setForm({ ...form, from: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={form.to}
          onChange={(e) => setForm({ ...form, to: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          placeholder="Reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="border rounded px-3 py-2 col-span-2"
        />
        <button
          onClick={applyLeave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-3"
        >
          Apply Leave
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <tr>
              <th className="border p-2 text-left font-medium">Employee</th>
              <th className="border p-2 text-left font-medium">Type</th>
              <th className="border p-2 text-left font-medium">From</th>
              <th className="border p-2 text-left font-medium">To</th>
              <th className="border p-2 text-left font-medium">Status</th>
              <th className="border p-2 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No leave requests
                </td>
              </tr>
            ) : (
              leaves.map((l) => {
                const emp = employees.find((e) => e.id === l.empId);
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="border p-2">{emp?.name || "—"}</td>
                    <td className="border p-2">{l.type}</td>
                    <td className="border p-2">{l.from}</td>
                    <td className="border p-2">{l.to}</td>
                    <td className="border p-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          l.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="border p-2">
                      {l.status === "Pending" && (
                        <button
                          onClick={() => approve(l.id)}
                          className="text-green-600 text-xs hover:underline"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DocumentVault = ({ employees = [] }) => {
  const [selected, setSelected] = useState(null);
  const emp = employees.find((e) => e.id === selected);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Document Vault</h2>
      <select
        value={selected || ""}
        onChange={(e) => setSelected(+e.target.value)}
        className="border rounded px-4 py-2 mb-6 w-full md:w-64 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Select Employee</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.empId} - {e.name}
          </option>
        ))}
      </select>
      {emp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-5 rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">PAN Card</h3>
            <p className="font-mono">{emp.pan}</p>
          </div>
          <div className="border p-5 rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">Aadhaar</h3>
            <p className="font-mono">{emp.aadhaar}</p>
          </div>
          <div className="border p-5 rounded-lg bg-gray-50 col-span-2">
            <h3 className="font-semibold text-gray-700 mb-2">Bank Details</h3>
            <p className="font-mono">
              {emp.bankName} | A/c: {emp.accountNo} | IFSC: {emp.ifsc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const HRReports = ({ employees = [], leaves = [], attendance = [] }) => {
  const active = employees.filter((e) => e.status === "Active").length;
  const totalSalary = employees
    .filter((e) => e.status === "Active")
    .reduce((s, e) => s + (e.salary || 0), 0);
  const pending = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">HR Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold text-blue-800">
            Active Employees
          </h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{active}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold text-green-800">
            Total Payroll
          </h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            ₹{totalSalary.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold text-yellow-800">
            Pending Leaves
          </h3>
          <p className="text-4xl font-bold text-yellow-600 mt-2">{pending}</p>
        </div>
      </div>
    </div>
  );
};

const HRAuditTrail = ({ logs = [] }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Audit Trail</h2>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
          <tr>
            <th className="border p-2 text-left font-medium">Time</th>
            <th className="border p-2 text-left font-medium">User</th>
            <th className="border p-2 text-left font-medium">Action</th>
            <th className="border p-2 text-left font-medium">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center p-6 text-gray-500">
                No logs
              </td>
            </tr>
          ) : (
            logs
              .slice()
              .reverse()
              .map((log, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2">
                    {format(parseISO(log.timestamp), "dd MMM yyyy HH:mm")}
                  </td>
                  <td className="border p-2">{log.user}</td>
                  <td className="border p-2 font-medium">{log.action}</td>
                  <td className="border p-2 text-xs">{log.details}</td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const HRImportExport = ({ employees = [], setEmployees }) => {
  const exportCSV = () => {
    const csv = Papa.unparse(
      employees.map((e) => ({
        empId: e.empId,
        name: e.name,
        email: e.email,
        phone: e.phone,
        branch: e.branch,
        department: e.department,
        designation: e.designation,
        joinDate: e.joinDate,
        salary: e.salary,
        status: e.status,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (res) => {
        const imported = res.data
          .filter((d) => d.empId && d.name)
          .map((d, i) => ({
            ...d,
            id: Date.now() + i,
            salary: +d.salary || 0,
            status: d.status || "Active",
          }));
        setEmployees((prev) => [...prev, ...imported]);
        alert(`${imported.length} employees imported`);
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Import / Export</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
        >
          Export to CSV
        </button>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={importCSV}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="text-xs text-gray-600 mt-1">Upload CSV to import</p>
        </div>
      </div>
    </div>
  );
};

const PayrollSync = ({
  employees = [],
  postToGL,
  logAudit,
  formatCurrency,
}) => {
  const runPayroll = () => {
    const active = employees.filter((e) => e.status === "Active");
    const total = active.reduce((s, e) => s + (e.salary || 0), 0);
    if (total === 0) return alert("No active employees");

    postToGL(
      "Salary Expense",
      "Cash",
      total,
      `Payroll - ${active.length} employees`,
      `PAY-${Date.now()}`
    );
    logAudit("Payroll Posted to GL", { total, count: active.length });
    alert(`Payroll ₹${total.toLocaleString()} posted to GL`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Payroll to GL Sync
      </h2>
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-lg mb-6">
        <p className="text-lg">
          <strong>Active Employees:</strong>{" "}
          {employees.filter((e) => e.status === "Active").length}
        </p>
        <p className="text-2xl font-bold mt-2">
          <strong>Total Payroll:</strong>{" "}
          {formatCurrency(
            employees
              .filter((e) => e.status === "Active")
              .reduce((s, e) => s + (e.salary || 0), 0)
          )}
        </p>
      </div>
      <button
        onClick={runPayroll}
        className="bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 transition text-lg font-semibold"
      >
        Run Payroll & Post to GL
      </button>
    </div>
  );
};

export default EmployeeManagement;
