// src/pages/Procurement/BudgetReportsModule.jsx
import { useState, useEffect, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  IndianRupee,
  Download,
  FileText,
  TrendingUp,
  AlertCircle,
  Search,
  Building,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

export default function BudgetReportsModule() {
  const { stats, prs, fetchPRs, loading } = useProcurement();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // === CONFIG: Department Budgets (can be moved to DB/API) ===
  const departmentBudgets = {
    IT: 1500000,
    HR: 800000,
    Operations: 1200000,
    Finance: 600000,
    Marketing: 500000,
  };

  // === Calculate Actual Spend per Department from PRs ===
  const departmentSpend = useMemo(() => {
    const spendMap = {};
    prs.forEach((pr) => {
      const dept = pr.dept || "Unknown";
      spendMap[dept] = (spendMap[dept] || 0) + pr.amount;
    });
    return spendMap;
  }, [prs]);

  // === Derive All Budget Metrics ===
  const budgetData = useMemo(() => {
    const totalBudget = Object.values(departmentBudgets).reduce(
      (a, b) => a + b,
      0
    );
    const allocated = totalBudget;
    const spent = stats.totalSpend || 0;
    const remaining = Math.max(0, allocated - spent);

    const departments = Object.keys(departmentBudgets).map((dept) => ({
      name: dept,
      budget: departmentBudgets[dept],
      spent: departmentSpend[dept] || 0,
      remaining: Math.max(
        0,
        departmentBudgets[dept] - (departmentSpend[dept] || 0)
      ),
      color:
        dept === "IT"
          ? "#3B82F6"
          : dept === "HR"
          ? "#10B981"
          : dept === "Operations"
          ? "#F59E0B"
          : dept === "Finance"
          ? "#EF4444"
          : "#8B5CF6",
    }));

    const monthlyTrend = (stats.monthlySpend || []).map((m) => ({
      month: m.month,
      budget: totalBudget / 12,
      spend: m.amount,
    }));

    return {
      totalBudget,
      allocated,
      spent,
      remaining,
      departments,
      monthlyTrend,
    };
  }, [departmentSpend, stats]);

  // === Chart Data ===
  const pieData = budgetData.departments
    .filter((d) => d.spent > 0)
    .map((d) => ({
      name: d.name,
      value: d.spent,
      color: d.color,
    }));

  const barData = budgetData.departments.map((d) => ({
    name: d.name,
    budget: d.budget / 100000,
    spent: d.spent / 100000,
  }));

  const filteredDepts = budgetData.departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === Export to PDF using file-saver ===
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Budget & Spend Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

    // Summary
    doc.setFontSize(14);
    doc.text("Summary", 14, 45);
    doc.setFontSize(11);
    doc.text(
      `Total Budget: ₹${(budgetData.totalBudget / 100000).toFixed(1)}L`,
      14,
      55
    );
    doc.text(
      `Total Spent: ₹${(budgetData.spent / 100000).toFixed(1)}L`,
      14,
      63
    );
    doc.text(
      `Utilization: ${((budgetData.spent / budgetData.allocated) * 100).toFixed(
        1
      )}%`,
      14,
      71
    );

    // Department Table
    const tableData = budgetData.departments.map((d) => [
      d.name,
      `₹${(d.budget / 100000).toFixed(1)}L`,
      `₹${(d.spent / 100000).toFixed(1)}L`,
      `${((d.spent / d.budget) * 100).toFixed(1)}%`,
    ]);

    doc.autoTable({
      head: [["Department", "Budget", "Spent", "Utilization"]],
      body: tableData,
      startY: 85,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [51, 65, 85] },
    });

    const pdfBlob = doc.output("blob");
    saveAs(
      pdfBlob,
      `budget-report-${new Date().toISOString().split("T")[0]}.pdf`
    );
    toast.success("PDF exported successfully!");
  };

  // === Export to Excel using file-saver ===
  const exportExcel = () => {
    const exportData = budgetData.departments.map((d) => ({
      Department: d.name,
      "Budget (₹)": d.budget,
      "Spent (₹)": d.spent,
      "Remaining (₹)": d.remaining,
      "Utilization (%)": ((d.spent / d.budget) * 100).toFixed(1),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budget Report");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      excelBlob,
      `budget-report-${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Excel exported successfully!");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: IndianRupee },
    { id: "departments", label: "Departments", icon: Building },
    { id: "spendvsbudget", label: "Spend vs Budget", icon: BarChart },
    { id: "reports", label: "Trend", icon: TrendingUp },
    { id: "export", label: "Export", icon: Download },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-xl text-gray-600">Loading budget reports...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Budget & Reports
              </h1>
              <p className="text-gray-500 mt-1">
                Real-time financial insights from procurement
              </p>
            </div>
            <button
              onClick={fetchPRs}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 transition"
            >
              <RefreshCw size={18} /> Refresh Data
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-slate-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold">Total Budget</h3>
                <p className="text-3xl font-bold mt-2">
                  ₹{(budgetData.totalBudget / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold">Spent</h3>
                <p className="text-3xl font-bold mt-2">
                  ₹{(budgetData.spent / 100000).toFixed(1)}L
                </p>
                <p className="text-sm mt-1 opacity-90">
                  {((budgetData.spent / budgetData.allocated) * 100).toFixed(1)}
                  % used
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold">Remaining</h3>
                <p className="text-3xl font-bold mt-2">
                  ₹{(budgetData.remaining / 100000).toFixed(1)}L
                </p>
              </div>

              <div className="md:col-span-3 mt-6">
                <h3 className="text-xl font-semibold mb-4">
                  Spend Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Departments */}
          {activeTab === "departments" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepts.map((dept) => {
                  const utilization = (dept.spent / dept.budget) * 100;
                  return (
                    <div
                      key={dept.name}
                      className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{dept.name}</h3>
                        {utilization > 90 && (
                          <AlertCircle className="text-red-600" size={20} />
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget</span>
                          <span className="font-medium">
                            ₹{(dept.budget / 100000).toFixed(1)}L
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Spent</span>
                          <span className="font-medium text-red-600">
                            ₹{(dept.spent / 100000).toFixed(1)}L
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remaining</span>
                          <span className="font-medium text-green-600">
                            ₹{(dept.remaining / 100000).toFixed(1)}L
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              utilization > 90
                                ? "bg-red-500"
                                : utilization > 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-right mt-1">
                          {utilization.toFixed(1)}% used
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spend vs Budget */}
          {activeTab === "spendvsbudget" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">
                Spend vs Budget (Lakhs)
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => `₹${v}L`} />
                    <Legend />
                    <Bar dataKey="budget" fill="#94A3B8" name="Budget" />
                    <Bar dataKey="spent" fill="#3B82F6" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">
                Monthly Spend Trend
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={budgetData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="budget"
                      stroke="#94A3B8"
                      name="Budget"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="#3B82F6"
                      name="Spend"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Export */}
          {activeTab === "export" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6 text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-6">Export Reports</h3>
                <div className="space-y-4">
                  <button
                    onClick={exportPDF}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-3 transition"
                  >
                    <Download size={20} /> Export as PDF
                  </button>
                  <button
                    onClick={exportExcel}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-3 transition"
                  >
                    <Download size={20} /> Export as Excel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
