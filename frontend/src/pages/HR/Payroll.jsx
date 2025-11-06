// src/components/hr/Payroll.jsx
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { useFinance } from "../../context/FinanceContext";

const Payroll = () => {
  const {
    employees = [],
    postToGL,
    logAudit,
    formatCurrency = (v) => `₹${v.toLocaleString()}`,
  } = useFinance() || {};

  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [payrollStatus, setPayrollStatus] = useState({}); // { empId: "Paid" | "Pending" }

  // === LOAD FROM LOCALSTORAGE (Sync with EmployeeManagement) ===
  const loadPayrollStatus = () => {
    try {
      const saved = localStorage.getItem("hr_payroll_status");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const [statusFromStorage] = useState(loadPayrollStatus);

  // === AUTO-SAVE STATUS ===
  React.useEffect(() => {
    localStorage.setItem("hr_payroll_status", JSON.stringify(payrollStatus));
  }, [payrollStatus]);

  // === FILTERED & CALCULATED PAYROLL ===
  const payrollData = useMemo(() => {
    return employees
      .filter((e) => e.status === "Active")
      .map((emp) => {
        const monthKey = `${emp.id}_${selectedMonth}`;
        const status =
          payrollStatus[monthKey] || statusFromStorage[monthKey] || "Pending";
        return {
          ...emp,
          month: format(parseISO(`${selectedMonth}-01`), "MMM yyyy"),
          salary: emp.salary || 0,
          status,
          key: monthKey,
        };
      });
  }, [employees, selectedMonth, payrollStatus, statusFromStorage]);

  // === MARK AS PAID ===
  const markAsPaid = (key, emp) => {
    setPayrollStatus((prev) => ({ ...prev, [key]: "Paid" }));
    logAudit?.("Payroll", "Salary Paid", {
      empId: emp.empId,
      name: emp.name,
      amount: emp.salary,
      month: selectedMonth,
    });

    // Post to GL
    postToGL?.(
      "Salary Expense",
      "Cash/Bank",
      emp.salary,
      `Salary - ${emp.name} (${selectedMonth})`,
      `SAL-${emp.id}-${selectedMonth}`
    );
  };

  // === GENERATE PAYSLIP (PDF-like preview) ===
  const generatePayslip = (emp) => {
    const payslip = `
      ═══════════════════════════════════════
               PAYSLIP - ${emp.month}
      ═══════════════════════════════════════
      Employee     : ${emp.name}
      Emp ID       : ${emp.empId}
      Department   : ${emp.department}
      Designation  : ${emp.designation}
      ───────────────────────────────────────
      Basic Salary : ${formatCurrency(emp.salary)}
      Deductions   : ₹0
      Net Pay      : ${formatCurrency(emp.salary)}
      ───────────────────────────────────────
      Status       : ${emp.status}
      Paid On      : ${format(new Date(), "dd MMM yyyy")}
      ═══════════════════════════════════════
    `;

    const win = window.open("", "_blank");
    win.document.write(`
      <pre style="font-family: monospace; padding: 20px; background: #f9f9f9;">
${payslip}
      </pre>
    `);
    win.document.close();
  };

  // === TOTAL CALCULATION ===
  const totalPayable = payrollData.reduce((sum, p) => sum + p.salary, 0);
  const totalPaid = payrollData
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.salary, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Payroll Management
          </h1>
          <div className="flex gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                const pending = payrollData.filter(
                  (p) => p.status === "Pending"
                );
                if (pending.length === 0) return alert("All paid!");
                pending.forEach((p) => markAsPaid(p.key, p));
                alert(`All ${pending.length} salaries marked as paid!`);
              }}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Pay All
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-blue-800">
              Total Payable
            </h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {formatCurrency(totalPayable)}
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-green-800">Total Paid</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-yellow-800">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {payrollData.filter((p) => p.status === "Pending").length}
            </p>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white shadow-lg rounded-2xl p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Salary Details
            </h2>
            <button
              onClick={() => {
                const csv = [
                  "Emp ID,Name,Department,Month,Salary,Status",
                  ...payrollData.map(
                    (p) =>
                      `${p.empId},${p.name},${p.department},${p.month},${p.salary},${p.status}`
                  ),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `payroll_${selectedMonth}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-xl">
              <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                <tr>
                  <th className="p-3 text-left font-medium">Employee</th>
                  <th className="p-3 text-left font-medium">Department</th>
                  <th className="p-3 text-left font-medium">Month</th>
                  <th className="p-3 text-left font-medium">Salary</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-gray-500">
                      No active employees
                    </td>
                  </tr>
                ) : (
                  payrollData.map((p) => (
                    <tr
                      key={p.key}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-gray-600">{p.department}</td>
                      <td className="p-3">{p.month}</td>
                      <td className="p-3 font-semibold">
                        {formatCurrency(p.salary)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {p.status === "Pending" && (
                            <button
                              onClick={() => markAsPaid(p.key, p)}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => generatePayslip(p)}
                            className="text-indigo-600 hover:underline text-sm"
                          >
                            Payslip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
