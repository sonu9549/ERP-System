import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useFinance } from "../../context/FinanceContext";

const BudgetsForecasting = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const { budgets, addBudget } = useFinance();

  const [form, setForm] = useState({
    department: "",
    year: "",
    allocated: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddBudget = (e) => {
    e.preventDefault();
    const newBudget = {
      id: budgets.length + 1,
      ...form,
      year: parseInt(form.year),
      allocated: parseFloat(form.allocated),
      spent: 0,
    };
    setBudgets([...budgets, newBudget]);
    setForm({ department: "", year: "", allocated: "" });
    setActiveTab("overview");
  };

  const calculateVariance = (allocated, spent) => {
    const variance = allocated - spent;
    const percentage = ((variance / allocated) * 100).toFixed(2);
    return { variance, percentage };
  };

  // Chart Data: include forecast for next year
  const chartData = budgets.map((b) => {
    const growthRate = ((b.spent / b.allocated) * 100).toFixed(2);
    const forecasted = Math.round(b.allocated * (1 + growthRate / 100));
    return {
      department: b.department,
      allocated: b.allocated,
      spent: b.spent,
      forecasted,
    };
  });

  const tabs = [
    { id: "overview", label: "Budget Overview" },
    { id: "add", label: "Add New Budget" },
    { id: "forecast", label: "Forecasting" },
    { id: "variance", label: "Variance Analysis" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Budgets & Forecasting
      </h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Budget Summary</h2>
            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Department</th>
                  <th className="px-4 py-2 border">Year</th>
                  <th className="px-4 py-2 border">Allocated (₹)</th>
                  <th className="px-4 py-2 border">Spent (₹)</th>
                  <th className="px-4 py-2 border">Remaining (₹)</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{b.department}</td>
                    <td className="px-4 py-2 border">{b.year}</td>
                    <td className="px-4 py-2 border">
                      ₹{b.allocated.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border">
                      ₹{b.spent.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border text-green-700">
                      ₹{(b.allocated - b.spent).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "add" && (
          <form onSubmit={handleAddBudget} className="space-y-4 max-w-xl">
            <h2 className="text-xl font-semibold mb-4">Add New Budget</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="department"
                placeholder="Department"
                value={form.department}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                name="year"
                placeholder="Year"
                value={form.year}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                name="allocated"
                placeholder="Allocated Budget (₹)"
                value={form.allocated}
                onChange={handleChange}
                className="border p-2 rounded col-span-2"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Save Budget
            </button>
          </form>
        )}

        {activeTab === "forecast" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Budget Forecasting & Trend Analysis
            </h2>
            <p className="text-gray-600 mb-4">
              Forecast budgets using historical spending patterns.
            </p>

            {/* Forecast Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {chartData.map((b) => (
                <div
                  key={b.department}
                  className="p-4 border rounded-lg shadow hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {b.department}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Allocated: ₹{b.allocated.toLocaleString()}
                  </p>
                  <p className="text-gray-700 text-sm">
                    Spent: ₹{b.spent.toLocaleString()}
                  </p>
                  <p className="text-blue-600 font-medium">
                    Forecasted: ₹{b.forecasted.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Forecast Chart */}
            <div className="w-full h-96">
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocated" fill="#60a5fa" name="Allocated" />
                  <Bar dataKey="spent" fill="#34d399" name="Spent" />
                  <Bar dataKey="forecasted" fill="#fbbf24" name="Forecasted" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "variance" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Variance Analysis</h2>
            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Department</th>
                  <th className="px-4 py-2 border">Allocated (₹)</th>
                  <th className="px-4 py-2 border">Spent (₹)</th>
                  <th className="px-4 py-2 border">Variance (₹)</th>
                  <th className="px-4 py-2 border">Variance (%)</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const { variance, percentage } = calculateVariance(
                    b.allocated,
                    b.spent
                  );
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{b.department}</td>
                      <td className="px-4 py-2 border">
                        ₹{b.allocated.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border">
                        ₹{b.spent.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-2 border ${
                          variance < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        ₹{variance.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-2 border ${
                          variance < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reports" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
            <p className="text-gray-600 mb-4">
              Download or visualize budget performance summaries.
            </p>

            <div className="w-full h-96 mb-6">
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="allocated"
                    stroke="#60a5fa"
                    name="Allocated"
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#34d399"
                    name="Spent"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecasted"
                    stroke="#fbbf24"
                    name="Forecasted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Download Summary Report
              </button>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                Export Chart as PNG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetsForecasting;
