import React from "react";

const Payroll = () => {
  const payroll = [
    {
      id: 1,
      name: "Ravi Sharma",
      department: "Finance",
      month: "Oct 2025",
      salary: "₹60,000",
      status: "Paid",
    },
    {
      id: 2,
      name: "Neha Singh",
      department: "HR",
      month: "Oct 2025",
      salary: "₹45,000",
      status: "Pending",
    },
    {
      id: 3,
      name: "Amit Kumar",
      department: "IT",
      month: "Oct 2025",
      salary: "₹70,000",
      status: "Paid",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Payroll Management</h1>

      <div className="bg-white shadow-md rounded-2xl p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Salary Details</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            Generate Payslip
          </button>
        </div>

        <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Month</th>
              <th className="p-3 text-left">Salary</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.department}</td>
                <td className="p-3">{p.month}</td>
                <td className="p-3">{p.salary}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      p.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Payroll;
