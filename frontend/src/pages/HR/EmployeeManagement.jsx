import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import Papa from "papaparse";
import Attendance from "./Attendance";

// Sub-components (can be moved to separate files later)
const EmployeeDirectory = ({ employees, setEmployees, logAudit }) => {
  const terminate = (id) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Terminated",
              exitDate: new Date().toISOString().split("T")[0],
            }
          : e
      )
    );
    logAudit("Terminated Employee", { id });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Employee Directory</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">ID</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Department</th>
            <th className="border p-2 text-left">Branch</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id}>
              <td className="border p-1">{e.empId}</td>
              <td className="border p-1">{e.name}</td>
              <td className="border p-1">{e.department}</td>
              <td className="border p-1">{e.branch}</td>
              <td className="border p-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    e.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {e.status}
                </span>
              </td>
              <td className="border p-1">
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AddEmployeeModal = ({ onClose, onSave, branches }) => {
  const [form, setForm] = useState({
    empId: "",
    name: "",
    email: "",
    phone: "",
    branch: "HQ",
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
    if (!form.empId || !form.name) return alert("ID & Name required");
    onSave({ ...form, salary: +form.salary, status: "Active" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add New Employee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Emp ID"
            value={form.empId}
            onChange={(e) => setForm({ ...form, empId: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            className="border p-2 rounded"
          >
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="date"
            placeholder="Join Date"
            value={form.joinDate}
            onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Salary"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Bank Name"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Account No"
            value={form.accountNo}
            onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="IFSC"
            value={form.ifsc}
            onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="PAN"
            value={form.pan}
            onChange={(e) => setForm({ ...form, pan: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Aadhaar"
            value={form.aadhaar}
            onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save Employee
          </button>
        </div>
      </div>
    </div>
  );
};

const LeaveManagement = ({
  employees,
  leaves,
  setLeaves,
  logAudit,
  leaveTypes,
}) => {
  const [form, setForm] = useState({
    empId: "",
    type: leaveTypes[0],
    from: "",
    to: "",
    reason: "",
  });

  const applyLeave = () => {
    if (!form.empId || !form.from || !form.to)
      return alert("Select employee and dates");
    const newLeave = {
      ...form,
      empId: +form.empId,
      id: Date.now(),
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
    };
    setLeaves((prev) => [...prev, newLeave]);
    logAudit("Leave Applied", { empId: form.empId, type: form.type });
    setForm({ ...form, from: "", to: "", reason: "" });
  };

  const approveLeave = (id) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "Approved" } : l))
    );
    logAudit("Leave Approved", { id });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Leave Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <select
          value={form.empId}
          onChange={(e) => setForm({ ...form, empId: e.target.value })}
          className="border p-2 rounded"
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
          placeholder="Reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="border p-2 rounded col-span-2"
        />
        <button
          onClick={applyLeave}
          className="bg-blue-600 text-white p-2 rounded"
        >
          Apply Leave
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Employee</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">From</th>
            <th className="border p-2 text-left">To</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => {
            const emp = employees.find((e) => e.id === l.empId);
            return (
              <tr key={l.id}>
                <td className="border p-1">{emp?.name}</td>
                <td className="border p-1">{l.type}</td>
                <td className="border p-1">{l.from}</td>
                <td className="border p-1">{l.to}</td>
                <td className="border p-1">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
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
                    <button
                      onClick={() => approveLeave(l.id)}
                      className="text-green-600 text-xs hover:underline"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const DocumentVault = ({ employees }) => {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const emp = employees.find((e) => e.id === selectedEmp);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Document Vault</h2>
      <select
        value={selectedEmp}
        onChange={(e) => setSelectedEmp(+e.target.value)}
        className="border p-2 rounded mb-4 w-full md:w-64"
      >
        <option>Select Employee</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.empId} - {e.name}
          </option>
        ))}
      </select>

      {emp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <h3 className="font-semibold">PAN</h3>
            <p>{emp.pan}</p>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-semibold">Aadhaar</h3>
            <p>{emp.aadhaar}</p>
          </div>
          <div className="border p-4 rounded col-span-2">
            <h3 className="font-semibold">Bank Details</h3>
            <p>
              {emp.bankName} | A/c: {emp.accountNo} | IFSC: {emp.ifsc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const HRReports = ({ employees, leaves, attendance }) => {
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const totalSalary = employees
    .filter((e) => e.status === "Active")
    .reduce((s, e) => s + e.salary, 0);
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">HR Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">
            Active Employees
          </h3>
          <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">
            Total Payroll
          </h3>
          <p className="text-3xl font-bold text-green-600">
            ₹{totalSalary.toLocaleString()}
          </p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">
            Pending Leaves
          </h3>
          <p className="text-3xl font-bold text-yellow-600">{pendingLeaves}</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3">Employee Summary</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Branch</th>
            <th className="border p-2 text-left">Active</th>
            <th className="border p-2 text-left">Terminated</th>
          </tr>
        </thead>
        <tbody>
          {["HQ", "Unit A", "Unit B"].map((b) => {
            const active = employees.filter(
              (e) => e.branch === b && e.status === "Active"
            ).length;
            const terminated = employees.filter(
              (e) => e.branch === b && e.status === "Terminated"
            ).length;
            return (
              <tr key={b}>
                <td className="border p-1">{b}</td>
                <td className="border p-1">{active}</td>
                <td className="border p-1">{terminated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const HRAuditTrail = ({ logs }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">HR Audit Trail</h2>
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Time</th>
          <th className="border p-2 text-left">User</th>
          <th className="border p-2 text-left">Action</th>
          <th className="border p-2 text-left">Details</th>
        </tr>
      </thead>
      <tbody>
        {logs
          .slice()
          .reverse()
          .map((log, i) => (
            <tr key={i}>
              <td className="border p-1">
                {format(parseISO(log.timestamp), "dd MMM yyyy HH:mm")}
              </td>
              <td className="border p-1">{log.user}</td>
              <td className="border p-1">{log.action}</td>
              <td className="border p-1">{log.details}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const HRImportExport = ({ employees, setEmployees }) => {
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
    a.download = "employees.csv";
    a.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const imported = results.data.map((d, i) => ({
          ...d,
          id: Date.now() + i,
          salary: +d.salary || 0,
        }));
        setEmployees((prev) => [...prev, ...imported]);
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Import / Export</h2>
      <div className="space-y-4">
        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export Employees (CSV)
        </button>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={importCSV}
            className="border p-2 rounded"
          />
          <p className="text-sm text-gray-600 mt-1">
            Import Employees from CSV
          </p>
        </div>
      </div>
    </div>
  );
};

const OnboardingOffboarding = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Onboarding & Offboarding</h2>
    <p className="text-gray-600">
      Onboarding checklist and exit process will be implemented here.
    </p>
  </div>
);

const PayrollSync = ({ employees, accounts, postToGL, logAudit }) => {
  const runPayroll = () => {
    const salaryAccount = accounts.find((a) => a.name === "Salary Expense");
    if (!salaryAccount) return alert("Salary Expense account not found in GL");

    const activeEmployees = employees.filter((e) => e.status === "Active");
    const totalSalary = activeEmployees.reduce((s, e) => s + e.salary, 0);

    const lines = activeEmployees.map((emp) => ({
      accountId: salaryAccount.id,
      debit: emp.salary,
      credit: 0,
      memo: `Salary - ${emp.name}`,
    }));

    const cashLine = {
      accountId: accounts.find((a) => a.name === "Cash")?.id || 1,
      debit: 0,
      credit: totalSalary,
    };

    postToGL({
      date: new Date().toISOString().split("T")[0],
      ref: "PAYROLL",
      desc: `Monthly Payroll - ${activeEmployees.length} employees`,
      branch: "HQ",
      lines: [...lines, cashLine],
      posted: true,
    });

    logAudit("Payroll Synced to GL", {
      total: totalSalary,
      count: activeEmployees.length,
    });
    alert(`Payroll ₹${totalSalary.toLocaleString()} posted to GL`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Payroll to GL Sync</h2>
      <p className="mb-4">
        Active Employees:{" "}
        {employees.filter((e) => e.status === "Active").length}
      </p>
      <p className="mb-6 font-semibold">
        Total Salary: ₹
        {employees
          .filter((e) => e.status === "Active")
          .reduce((s, e) => s + e.salary, 0)
          .toLocaleString()}
      </p>
      <button
        onClick={runPayroll}
        className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700"
      >
        Run Payroll & Post to GL
      </button>
    </div>
  );
};

// Main Component
const EmploymentManagement = ({
  accounts = [],
  journalEntries = [],
  postToGL = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("employees");
  const [branchFilter, setBranchFilter] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const user = { name: "hr_manager", ip: "192.168.1.20" };

  const tabs = [
    { id: "employees", label: "Employees" },
    { id: "onboarding", label: "Onboarding" },
    { id: "leaves", label: "Leave Management" },
    { id: "attendance", label: "Attendance" },
    { id: "payroll", label: "Payroll Sync" },
    { id: "documents", label: "Documents" },
    { id: "reports", label: "HR Reports" },
    { id: "audit", label: "Audit Trail" },
    { id: "import", label: "Import / Export" },
  ];

  const branches = ["HQ", "Unit A", "Unit B"];
  const leaveTypes = [
    "Casual Leave (CL)",
    "Sick Leave (SL)",
    "Paid Leave (PL)",
    "Unpaid Leave",
  ];

  // Load + Seed
  useEffect(() => {
    const data = {
      employees: JSON.parse(localStorage.getItem("hr_employees")) || [],
      leaves: JSON.parse(localStorage.getItem("hr_leaves")) || [],
      attendance: JSON.parse(localStorage.getItem("hr_attendance")) || [],
      auditLogs: JSON.parse(localStorage.getItem("hr_audit")) || [],
    };

    if (data.employees.length === 0) {
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
          bankName: "HDFC Bank",
          accountNo: "1234567890",
          ifsc: "HDFC0001234",
          pan: "ABCDE1234F",
          aadhaar: "1234-5678-9012",
          status: "Active",
        },
      ];
      setEmployees(seed);
      localStorage.setItem("hr_employees", JSON.stringify(seed));
    } else {
      setEmployees(data.employees);
    }

    if (data.attendance.length === 0) {
      const seedAttendance = [
        {
          id: 1,
          empId: 1,
          date: "2025-04-01",
          inTime: "09:15",
          outTime: "18:30",
          status: "Late",
          lateBy: 15,
          totalHours: "9.25",
          overtime: "0.25",
        },
        {
          id: 2,
          empId: 1,
          date: "2025-04-02",
          inTime: "08:55",
          outTime: "19:00",
          status: "Present",
          lateBy: 0,
          totalHours: "10.08",
          overtime: "1.08",
        },
      ];
      setAttendance(seedAttendance);
      localStorage.setItem("hr_attendance", JSON.stringify(seedAttendance));
    } else {
      setAttendance(data.attendance);
    }

    setLeaves(data.leaves);
    setAuditLogs(
      data.auditLogs.length
        ? data.auditLogs
        : [
            {
              timestamp: new Date().toISOString(),
              action: "HR Module Initialized",
              user: user.name,
            },
          ]
    );
  }, []);

  // Persist
  useEffect(
    () => localStorage.setItem("hr_employees", JSON.stringify(employees)),
    [employees]
  );
  useEffect(
    () => localStorage.setItem("hr_leaves", JSON.stringify(leaves)),
    [leaves]
  );
  useEffect(
    () => localStorage.setItem("hr_attendance", JSON.stringify(attendance)),
    [attendance]
  );
  useEffect(
    () => localStorage.setItem("hr_audit", JSON.stringify(auditLogs)),
    [auditLogs]
  );

  const logAudit = (action, details = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      user: user.name,
      details: JSON.stringify(details),
    };
    setAuditLogs((prev) => [...prev, log]);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) => branchFilter === "All" || e.branch === branchFilter
    );
  }, [employees, branchFilter]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          HR & Employment Management
        </h1>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option>All</option>
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            + Add Employee
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow"
                : "bg-white border text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === "employees" && (
          <EmployeeDirectory
            employees={filteredEmployees}
            setEmployees={setEmployees}
            logAudit={logAudit}
          />
        )}
        {activeTab === "onboarding" && <OnboardingOffboarding />}
        {activeTab === "leaves" && (
          <LeaveManagement
            employees={employees}
            leaves={leaves}
            setLeaves={setLeaves}
            logAudit={logAudit}
            leaveTypes={leaveTypes}
          />
        )}
        {activeTab === "attendance" && (
          <Attendance
            employees={employees}
            leaves={leaves}
            attendance={attendance}
            setAttendance={setAttendance}
            logAudit={logAudit}
            branchFilter={branchFilter}
          />
        )}
        {activeTab === "payroll" && (
          <PayrollSync
            employees={employees}
            accounts={accounts}
            postToGL={postToGL}
            logAudit={logAudit}
          />
        )}
        {activeTab === "documents" && <DocumentVault employees={employees} />}
        {activeTab === "reports" && (
          <HRReports
            employees={employees}
            leaves={leaves}
            attendance={attendance}
          />
        )}
        {activeTab === "audit" && <HRAuditTrail logs={auditLogs} />}
        {activeTab === "import" && (
          <HRImportExport employees={employees} setEmployees={setEmployees} />
        )}
      </div>

      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSave={(emp) => {
            setEmployees((prev) => [...prev, { ...emp, id: Date.now() }]);
            logAudit("Added Employee", { empId: emp.empId, name: emp.name });
            setShowAddEmployee(false);
          }}
          branches={branches}
        />
      )}
    </div>
  );
};

export default EmploymentManagement;
