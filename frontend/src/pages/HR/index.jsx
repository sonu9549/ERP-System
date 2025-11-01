import React from "react";
import { Link } from "react-router-dom";

const HR = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">HR Dashboard</h1>
    <div className="space-y-3">
      <Link to="employees" className="block text-blue-600 hover:underline">
        Employees
      </Link>
      <Link to="attendance" className="block text-blue-600 hover:underline">
        Attendance
      </Link>
      <Link to="payroll" className="block text-blue-600 hover:underline">
        Payroll
      </Link>
      <Link to="recruitment" className="block text-blue-600 hover:underline">
        Recruitment
      </Link>
    </div>
  </div>
);

export default HR;
