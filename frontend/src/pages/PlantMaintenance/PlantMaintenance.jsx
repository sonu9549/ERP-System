// src/pages/PlantMaintenance/PlantMaintenanceModule.jsx
import React, { useState } from "react";
import { usePlantMaintenance } from "../../context/PlantMaintenanceContext";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
  Users,
  RefreshCw,
  Calendar,
  User,
  Plus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PlantMaintenanceModule() {
  const { stats, loading, assets, workOrders, createWO, settings } =
    usePlantMaintenance();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assetId: "",
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
  });

  const technicians = ["Rajesh", "Sunil", "Vikram", "Amit"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.assetId || !form.title || !form.assignedTo) {
      toast.error("Please fill required fields");
      return;
    }
    createWO(form);
    toast.success("Work Order Created!");
    setForm({
      assetId: "",
      title: "",
      description: "",
      priority: "Medium",
      assignedTo: "",
      dueDate: "",
    });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading Plant Maintenance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 p-2">
      <div className=" mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Plant Maintenance
            </h1>
            <p className="text-gray-500 mt-1">
              Asset Health • Work Orders • PM Schedules
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                activeTab === "dashboard"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              <FileText size={18} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("wo")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                activeTab === "wo"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              <Wrench size={18} /> Work Orders
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Assets"
                value={stats.totalAssets}
                icon={Wrench}
                color="teal"
              />
              <KPICard
                title="Critical Assets"
                value={stats.criticalAssets}
                icon={AlertTriangle}
                color="red"
                alert
              />
              <KPICard
                title="Open WOs"
                value={stats.openWOs}
                icon={FileText}
                color="blue"
              />
              <KPICard
                title="Overdue PM"
                value={stats.overduePM}
                icon={Clock}
                color="orange"
                alert
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <KPICard
                title="MTTR"
                value={`${stats.mttr} hrs`}
                icon={TrendingUp}
                color="purple"
              />
              <KPICard
                title="MTBF"
                value={`${stats.mtbf} hrs`}
                icon={CheckCircle}
                color="green"
              />
              <KPICard
                title="Downtime"
                value={`${stats.downtimeHours} hrs`}
                icon={AlertTriangle}
                color="red"
              />
            </div>

            {/* Recent WOs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Work Orders</h3>
                <button
                  onClick={() => {
                    setActiveTab("wo");
                    setShowForm(true);
                  }}
                  className="bg-teal-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> New WO
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase border-b">
                      <th className="pb-2">WO#</th>
                      <th className="pb-2">Asset</th>
                      <th className="pb-2">Issue</th>
                      <th className="pb-2">Priority</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentWOs.map((wo) => {
                      const asset = assets.find((a) => a.id === wo.assetId);
                      return (
                        <tr key={wo.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-medium text-teal-600">
                            {wo.woNumber}
                          </td>
                          <td className="py-2">{asset?.name || "—"}</td>
                          <td className="py-2">{wo.title}</td>
                          <td className="py-2">
                            <PriorityBadge priority={wo.priority} />
                          </td>
                          <td className="py-2">
                            <StatusBadge status={wo.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Work Orders Tab + Form */}
        {activeTab === "wo" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Work Orders</h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={18} /> New Work Order
              </button>
            </div>

            {/* Create WO Form */}
            {showForm && (
              <div className="border-2 border-dashed border-teal-300 rounded-xl p-6 mb-6 bg-teal-50">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Wrench size={20} /> Create New Work Order
                </h4>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Asset
                    </label>
                    <select
                      value={form.assetId}
                      onChange={(e) =>
                        setForm({ ...form, assetId: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Asset</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                      placeholder="e.g., Motor Overheating"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    >
                      {settings.priorities.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Assign To
                    </label>
                    <select
                      value={form.assignedTo}
                      onChange={(e) =>
                        setForm({ ...form, assignedTo: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Technician</option>
                      {technicians.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({ ...form, dueDate: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Create WO
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* WO List */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b">
                    <th className="pb-2">WO#</th>
                    <th className="pb-2">Asset</th>
                    <th className="pb-2">Title</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Assigned</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo) => {
                    const asset = assets.find((a) => a.id === wo.assetId);
                    return (
                      <tr key={wo.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium text-teal-600">
                          {wo.woNumber}
                        </td>
                        <td className="py-2">{asset?.name || "—"}</td>
                        <td className="py-2">{wo.title}</td>
                        <td className="py-2">
                          <PriorityBadge priority={wo.priority} />
                        </td>
                        <td className="py-2">{wo.assignedTo}</td>
                        <td className="py-2">
                          <StatusBadge status={wo.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable UI Components
function KPICard({ title, value, icon: Icon, color, alert }) {
  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm border-l-4 border-${color}-500`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {alert && (
            <p className="text-xs text-red-600 mt-1">Action Required!</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={28} />
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    Critical: "bg-red-100 text-red-800",
    High: "bg-orange-100 text-orange-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        colors[priority] || "bg-gray-100 text-gray-800"
      }`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Completed: "bg-green-100 text-green-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Planned: "bg-gray-100 text-gray-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        colors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
