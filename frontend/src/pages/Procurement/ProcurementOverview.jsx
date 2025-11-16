// src/pages/Procurement/ProcurementOverview.jsx
import React, { useEffect } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  IndianRupee,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Archive,
} from "lucide-react";

export default function ProcurementOverview() {
  const { stats, loading, fetchStats } = useProcurement();

  // Auto-refresh every 5 mins
  useEffect(() => {
    if (typeof fetchStats === "function") {
      fetchStats();
      const id = setInterval(fetchStats, 5 * 60 * 1000);
      return () => clearInterval(id);
    }
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading Procurement Overview...</p>
        </div>
      </div>
    );
  }

  // Safe defaults
  const s = {
    totalPR: stats?.totalPR ?? 0,
    pendingPR: stats?.pendingPR ?? 0,
    approvedPR: stats?.approvedPR ?? 0,
    totalSpend: stats?.totalSpend ?? 0,
    overduePO: stats?.overduePO ?? 0,
    totalSuppliers: stats?.totalSuppliers ?? 0,
    activeRFQs: stats?.activeRFQs ?? 0,
    avgApprovalTime: stats?.avgApprovalTime ?? 0,
    monthlySpend: stats?.monthlySpend ?? [],
    topCategories: stats?.topCategories ?? [],
    recentPRs: stats?.recentPRs ?? [],
  };

  const currentDate = new Date().toLocaleDateString("en-IN");
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 lg:p-2">
      {/* Header */}
      <div className="max-w-9xl mx-auto mb-5">
        <div className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Procurement Overview
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time • {currentDate} • {currentTime}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={!fetchStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* PR Overview */}
        <Section title="Purchase Requisitions" icon={FileText}>
          <KPIGrid>
            <KPICard
              title="Total PRs"
              value={s.totalPR}
              icon={FileText}
              color="blue"
            />
            <KPICard
              title="Pending"
              value={s.pendingPR}
              icon={Clock}
              color="yellow"
              alert={s.pendingPR > 10}
            />
            <KPICard
              title="Approved"
              value={s.approvedPR}
              icon={CheckCircle}
              color="green"
            />
            <KPICard
              title="Spend"
              value={`₹${(s.totalSpend / 100000).toFixed(1)}L`}
              icon={IndianRupee}
              color="purple"
            />
          </KPIGrid>
        </Section>

        {/* PO & RFQ */}
        <Section title="PO & RFQ Pipeline" icon={Package}>
          <KPIGrid cols={3}>
            <KPICard
              title="Active RFQs"
              value={s.activeRFQs}
              icon={Package}
              color="indigo"
            />
            <KPICard
              title="Overdue POs"
              value={s.overduePO}
              icon={AlertTriangle}
              color="red"
              alert
            />
            <KPICard
              title="Avg Approval"
              value={`${s.avgApprovalTime} days`}
              icon={TrendingUp}
              color="teal"
            />
          </KPIGrid>
        </Section>

        {/* Spend Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Spend</h3>
            <div className="space-y-3">
              {s.monthlySpend.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 w-16">{m.month}</span>
                  <div className="flex-1 mx-3 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{ width: `${(m.amount / 800000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-medium w-24 text-right">
                    ₹{m.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
            <div className="space-y-4">
              {s.topCategories.map((cat, i) => (
                <div key={i} className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">{cat.name}</span>
                  <div className="flex-1 mx-3 h-3 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        i === 0
                          ? "bg-blue-600"
                          : i === 1
                          ? "bg-indigo-600"
                          : i === 2
                          ? "bg-purple-600"
                          : "bg-gray-600"
                      }`}
                      style={{ width: `${cat.value}%` }}
                    ></div>
                  </div>
                  <span className="font-medium w-12 text-right">
                    {cat.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent PRs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent PRs</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b">
                  <th className="pb-2">PR#</th>
                  <th className="pb-2">Dept</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {s.recentPRs.map((pr) => (
                  <tr key={pr.id} className="border-b">
                    <td className="py-2 font-medium text-blue-600">
                      {pr.pr_number}
                    </td>
                    <td className="py-2 text-gray-700">{pr.dept}</td>
                    <td className="py-2 font-medium">
                      ₹{pr.amount.toLocaleString()}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          pr.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={22} className="text-blue-600" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function KPIGrid({ children, cols = 4 }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-6`}
    >
      {children}
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color, alert }) {
  return (
    <div
      className={`bg-white rounded-lg p-5 shadow-sm border-l-4 border-${color}-500`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {alert && (
            <p className="text-xs text-red-600 mt-1">Action Required!</p>
          )}
        </div>
        <div className={`p-2 rounded-full bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={22} />
        </div>
      </div>
    </div>
  );
}
