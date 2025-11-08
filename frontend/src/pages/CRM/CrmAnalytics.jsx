// src/modules/analytics/CrmAnalytics.jsx
import React, { useState, useMemo } from "react";
import { useCrm } from "../../context/CRmContext";
import { format } from "date-fns";
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
import { Line, Bar, Pie } from "react-chartjs-2";

// Register Chart.js once
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

export default function CrmAnalytics() {
  /* ------------------------------------------------------------------ */
  /*                         CONTEXT DATA (no extra files)               */
  /* ------------------------------------------------------------------ */
  const {
    customers = [],
    sales = [],
    leads = [],
    supportTickets = [],
    loyaltyLedger = [],
    formatCurrency,
    branches = [],
    allCostCenters = [],
    logAudit,
  } = useCrm();

  /* ------------------------------------------------------------------ */
  /*                              FILTER STATE                           */
  /* ------------------------------------------------------------------ */
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateRange, setDateRange] = useState({
    start: "2025-01-01",
    end: today,
  });
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterCenter, setFilterCenter] = useState("All");

  /* ------------------------------------------------------------------ */
  /*                     FILTERED DATA (useMemo)                        */
  /* ------------------------------------------------------------------ */
  const filteredSales = useMemo(
    () =>
      sales.filter((s) => {
        const d = s.date;
        const inRange = d >= dateRange.start && d <= dateRange.end;
        const branchOk = filterBranch === "All" || s.branch === filterBranch;
        const centerOk =
          filterCenter === "All" || s.costCenter === filterCenter;
        return inRange && branchOk && centerOk;
      }),
    [sales, dateRange, filterBranch, filterCenter]
  );

  const filteredLeads = useMemo(
    () =>
      leads.filter((l) => {
        const d = l.date || l.created_at;
        const inRange = d >= dateRange.start && d <= dateRange.end;
        const branchOk = filterBranch === "All" || l.branch === filterBranch;
        return inRange && branchOk;
      }),
    [leads, dateRange, filterBranch]
  );

  const filteredTickets = useMemo(
    () =>
      supportTickets.filter((t) => {
        const d = t.date || t.created_at;
        return d >= dateRange.start && d <= dateRange.end;
      }),
    [supportTickets, dateRange]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const d = c.join_date || c.created_at;
        return d >= dateRange.start && d <= dateRange.end;
      }),
    [customers, dateRange]
  );

  const filteredLedger = useMemo(
    () =>
      loyaltyLedger.filter((l) =>
        customers.some(
          (c) =>
            c.id === l.customer_id &&
            (c.join_date || c.created_at) >= dateRange.start
        )
      ),
    [loyaltyLedger, customers, dateRange]
  );

  /* ------------------------------------------------------------------ */
  /*                            KEY METRICS                              */
  /* ------------------------------------------------------------------ */
  const totalCustomers = filteredCustomers.length;
  const totalRevenue = filteredSales.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );
  const convertedLeads = filteredLeads.filter(
    (l) => l.status === "converted" || l.status === "CONVERTED"
  ).length;
  const conversionRate =
    filteredLeads.length > 0
      ? (convertedLeads / filteredLeads.length) * 100
      : 0;

  const openTickets = filteredTickets.filter(
    (t) => t.status === "open" || t.status === "OPEN"
  ).length;

  // Average resolution in days (only closed tickets)
  const closedTickets = filteredTickets.filter(
    (t) => t.status === "closed" || t.status === "CLOSED"
  );
  const avgResolutionDays =
    closedTickets.length > 0
      ? closedTickets.reduce((sum, t, i, arr) => {
          if (i === 0) return sum;
          const days =
            (new Date(t.closed_at || t.date) -
              new Date(arr[i - 1].closed_at || arr[i - 1].date)) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / closedTickets.length
      : 0;

  const totalPoints = filteredLedger.reduce((sum, l) => sum + l.points, 0);

  /* ------------------------------------------------------------------ */
  /*                            CHART DATA                               */
  /* ------------------------------------------------------------------ */
  // 1. Monthly Sales (Line)
  const monthlySales = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const month = format(new Date(s.date), "MMM yyyy");
      map[month] = (map[month] || 0) + (s.amount || 0);
    });
    const labels = Object.keys(map);
    const data = Object.values(map);
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data,
          borderColor: "rgb(59,130,246)",
          backgroundColor: "rgba(59,130,246,0.1)",
          tension: 0.2,
        },
      ],
    };
  }, [filteredSales]);

  // 2. Lead Sources (Pie)
  const leadSources = useMemo(() => {
    const map = {};
    filteredLeads.forEach((l) => {
      const src = l.source || "Unknown";
      map[src] = (map[src] || 0) + 1;
    });
    return {
      labels: Object.keys(map),
      datasets: [
        {
          data: Object.values(map),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    };
  }, [filteredLeads]);

  // 3. Ticket Status (Bar)
  const ticketStatus = useMemo(() => {
    const map = {};
    filteredTickets.forEach((t) => {
      const st = t.status || "Unknown";
      map[st] = (map[st] || 0) + 1;
    });
    return {
      labels: Object.keys(map),
      datasets: [
        {
          label: "Tickets",
          data: Object.values(map),
          backgroundColor: "rgb(75,192,192)",
        },
      ],
    };
  }, [filteredTickets]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" } },
  };

  /* ------------------------------------------------------------------ */
  /*                             EXPORT HELPERS                           */
  /* ------------------------------------------------------------------ */
  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv =
      headers.join(",") +
      "\n" +
      rows
        .map((r) =>
          headers
            .map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    logAudit?.("Analytics Export", `CSV: ${filename}`);
  };

  const exportMetrics = () => {
    exportCSV(
      [
        {
          totalCustomers,
          totalRevenue,
          conversionRate: conversionRate.toFixed(2) + "%",
          openTickets,
          avgResolutionDays: avgResolutionDays.toFixed(1),
          totalPoints,
        },
      ],
      "crm_metrics.csv"
    );
  };

  const exportSales = () => exportCSV(filteredSales, "sales_data.csv");

  /* ------------------------------------------------------------------ */
  /*                                 UI                                   */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header + Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          CRM Analytics Dashboard
        </h1>

        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="border rounded px-3 py-1"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="border rounded px-3 py-1"
          />
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="border rounded px-3 py-1"
          >
            {allCostCenters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={exportMetrics}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Metrics
          </button>
          <button
            onClick={exportSales}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export Sales
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Customers", value: totalCustomers, color: "indigo" },
          {
            label: "Revenue",
            value: formatCurrency(totalRevenue),
            color: "green",
          },
          {
            label: "Conversion",
            value: `${conversionRate.toFixed(1)}%`,
            color: "purple",
          },
          { label: "Open Tickets", value: openTickets, color: "red" },
          {
            label: "Avg Resolution (days)",
            value: avgResolutionDays.toFixed(1),
            color: "blue",
          },
          { label: "Loyalty Points", value: totalPoints, color: "orange" },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg shadow flex flex-col items-center"
          >
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold text-${kpi.color}-600`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Revenue Trend</h3>
          <Line data={monthlySales} options={chartOptions} />
        </div>

        {/* Lead Sources */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Lead Sources</h3>
          <Pie data={leadSources} options={chartOptions} />
        </div>

        {/* Ticket Status */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Ticket Status</h3>
          <Bar data={ticketStatus} options={chartOptions} />
        </div>

        {/* Placeholder for future chart */}
        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-center">
          <p className="text-gray-400">Add more charts here</p>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-5 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-medium mb-3">Recent Sales (last 5)</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.slice(-5).map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    {customers.find((c) => c.id === s.customer_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2">{formatCurrency(s.amount)}</td>
                  <td className="px-4 py-2">
                    {format(new Date(s.date), "dd MMM yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Leads */}
        <div className="bg-white p-5 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-medium mb-3">Recent Leads (last 5)</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.slice(-5).map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2">{l.source ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        (l.status || "").toLowerCase().includes("convert")
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {l.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {format(new Date(l.date || l.created_at), "dd MMM yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
