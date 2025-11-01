// src/pages/HR.jsx
import React from "react";

const HR = () => {
  const mockData = {
    employees: 120,
    attendanceRate: "96%",
    openPositions: 5,
    recentHires: [
      {
        id: 1,
        name: "Amit Sharma",
        department: "Finance",
        position: "Accountant",
        joined: "2025-10-25",
      },
      {
        id: 2,
        name: "Priya Mehta",
        department: "HR",
        position: "Recruiter",
        joined: "2025-10-22",
      },
      {
        id: 3,
        name: "Rahul Verma",
        department: "Production",
        position: "Supervisor",
        joined: "2025-10-18",
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-blue-700">
          Human Resources (HR)
        </h1>
        <p className="text-gray-600 mt-2">
          Manage employees, payroll, attendance, performance, and recruitment in
          one place.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Total Employees</h3>
          <p className="text-3xl font-bold text-blue-600">
            {mockData.employees}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Attendance Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {mockData.attendanceRate}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-700 font-semibold mb-2">Open Positions</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {mockData.openPositions}
          </p>
        </div>
      </section>

      {/* Functional Areas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">
            Employee Management
          </h2>
          <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
            <li>View & Update Employee Profiles</li>
            <li>Manage Departments & Roles</li>
            <li>Employee Lifecycle Management</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">
            Payroll & Compensation
          </h2>
          <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
            <li>Process Monthly Payroll</li>
            <li>Generate Payslips</li>
            <li>Handle Bonuses & Deductions</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">
            Attendance & Leave
          </h2>
          <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
            <li>Track Attendance Logs</li>
            <li>Approve/Reject Leave Requests</li>
            <li>Holiday Calendar Management</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">
            Performance & Training
          </h2>
          <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
            <li>Employee Appraisal Reports</li>
            <li>Define Performance KPIs</li>
            <li>Training & Skill Development</li>
          </ul>
        </div>
      </section>

      {/* Recent Hires */}
      <section className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">
          Recent Hires
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2 border-b">Name</th>
                <th className="text-left px-4 py-2 border-b">Department</th>
                <th className="text-left px-4 py-2 border-b">Position</th>
                <th className="text-left px-4 py-2 border-b">Joined On</th>
              </tr>
            </thead>
            <tbody>
              {mockData.recentHires.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50 transition text-gray-800"
                >
                  <td className="px-4 py-2 border-b">{item.name}</td>
                  <td className="px-4 py-2 border-b">{item.department}</td>
                  <td className="px-4 py-2 border-b">{item.position}</td>
                  <td className="px-4 py-2 border-b">{item.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition">
          Add New Employee
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-700 transition">
          Generate Payroll
        </button>
        <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-yellow-700 transition">
          Manage Leave Requests
        </button>
      </section>
    </div>
  );
};

export default HR;
