import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mock data
const mockData = {
  revenue: "$45,230",
  expenses: "$28,450",
  profit: "$16,780",
  totalSales: "1,245",
  activeUsers: "156",
  pendingOrders: "23",
  lowStock: "7",
  monthlySales: [1200, 1900, 3000, 5000, 2000, 3000],
  moduleActivity: {
    labels: ["Sales", "Inventory", "Purchase", "CRM", "HR", "Finance"],
    values: [5000, 3000, 2500, 1800, 1200, 4000],
  },
  revenueBreakdown: {
    labels: ["Sales", "Finance", "CRM", "Other"],
    values: [55, 25, 15, 5],
  },
  recentActivity: [
    {
      id: 1,
      action: "New Sale #ORD-123",
      user: "John Doe",
      module: "Sales",
      time: "2 min ago",
      status: "Completed",
    },
    {
      id: 2,
      action: "Purchase Order #PO-456",
      user: "Jane Smith",
      module: "Purchase",
      time: "5 min ago",
      status: "Pending",
    },
    {
      id: 3,
      action: "Employee Onboarded",
      user: "Admin",
      module: "HR",
      time: "10 min ago",
      status: "Active",
    },
    {
      id: 4,
      action: "Invoice Paid #INV-789",
      user: "Bob Wilson",
      module: "Finance",
      time: "15 min ago",
      status: "Paid",
    },
    {
      id: 5,
      action: "Stock Updated",
      user: "Warehouse Team",
      module: "Inventory",
      time: "20 min ago",
      status: "Updated",
    },
  ],
};

const Dashboard = () => {
  // Charts
  const salesTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Sales ($)",
        data: mockData.monthlySales,
        borderColor: "#3498db",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
        tension: 0.4,
      },
    ],
  };
  const activityData = {
    labels: mockData.moduleActivity.labels,
    datasets: [
      {
        label: "Transactions",
        data: mockData.moduleActivity.values,
        backgroundColor: [
          "#3498db",
          "#e74c3c",
          "#2ecc71",
          "#f39c12",
          "#9b59b6",
          "#1abc9c",
        ],
      },
    ],
  };
  const revenueData = {
    labels: mockData.revenueBreakdown.labels,
    datasets: [
      {
        data: mockData.revenueBreakdown.values,
        backgroundColor: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12"],
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Real-time overview of your ERP system — Last updated:{" "}
          <span className="font-medium">{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {[
          {
            title: "Total Revenue",
            value: mockData.revenue,
            trend: "+12%",
            color: "text-green-500",
          },
          {
            title: "Expenses",
            value: mockData.expenses,
            trend: "-5%",
            color: "text-red-500",
          },
          {
            title: "Profit",
            value: mockData.profit,
            trend: "+18%",
            color: "text-green-500",
          },
          {
            title: "Total Sales",
            value: mockData.totalSales,
            trend: "+8%",
            color: "text-blue-500",
          },
          {
            title: "Active Users",
            value: mockData.activeUsers,
            trend: "Stable",
            color: "text-gray-500",
          },
          {
            title: "Pending Orders",
            value: mockData.pendingOrders,
            trend: "Attention",
            color: "text-yellow-500",
          },
          {
            title: "Low Stock Items",
            value: mockData.lowStock,
            trend: "Reorder soon",
            color: "text-orange-500",
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
          >
            <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            <span className={`text-xs ${kpi.color}`}>{kpi.trend}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            View All Sales
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            Check Inventory
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
            Review Finances
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            Manage HR
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Sales Trend (Last 6 Months)</h3>
          <Line data={salesTrendData} />
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Module Activity</h3>
          <Bar data={activityData} />
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Revenue Breakdown</h3>
          <Doughnut data={revenueData} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="py-2 px-3 font-semibold">Action</th>
                <th className="py-2 px-3 font-semibold">User</th>
                <th className="py-2 px-3 font-semibold">Module</th>
                <th className="py-2 px-3 font-semibold">Time</th>
                <th className="py-2 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockData.recentActivity.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{item.action}</td>
                  <td className="py-2 px-3">{item.user}</td>
                  <td className="py-2 px-3">{item.module}</td>
                  <td className="py-2 px-3">{item.time}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === "Completed" || item.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
