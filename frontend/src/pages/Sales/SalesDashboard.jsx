// src/modules/sales/pages/SalesDashboard.jsx
import React, { useMemo } from "react";
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
import { Link } from "react-router-dom"; // ← YE NEW ADD KIYA
import { useSales } from "../../context/SalesContext";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  isValid,
  parseISO,
} from "date-fns";

// Register Chart.js
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

// === Helper: Safe Date Parser ===
const safeParseDate = (dateInput) => {
  if (!dateInput) return null;
  let date;
  if (typeof dateInput === "string") {
    date = parseISO(dateInput);
  } else {
    date = new Date(dateInput);
  }
  return isValid(date) ? date : null;
};

const SalesDashboard = () => {
  const {
    orders = [],
    invoices = [],
    customers = [],
    products = [],
    quotations = [],
    filters,
    setFilters,
  } = useSales();

  // === KPIs ===
  const kpis = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidInvoices = invoices.filter((i) => i.status === "Paid").length;
    const pendingInvoices = invoices.filter(
      (i) => i.status === "Unpaid"
    ).length;
    const avgOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const activeCustomers = new Set(orders.map((o) => o.customerId)).size;
    const pendingQuotations = quotations.filter(
      (q) => q.status === "Draft"
    ).length;

    return {
      totalOrders: totalOrders.toString(),
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      paidInvoices: paidInvoices.toString(),
      pendingInvoices: pendingInvoices.toString(),
      avgOrderValue: `₹${avgOrderValue.toLocaleString()}`,
      activeCustomers: activeCustomers.toString(),
      pendingQuotations: pendingQuotations.toString(),
    };
  }, [orders, invoices, quotations]);

  // === Sales Trend (Last 7 Days) ===
  const salesTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "MMM dd"),
        revenue: 0,
        count: 0,
      };
    });

    orders.forEach((o) => {
      const date = safeParseDate(o.createdAt);
      if (!date) return;

      const orderDate = format(date, "MMM dd");
      const day = last7Days.find((d) => d.date === orderDate);
      if (day) {
        day.revenue += o.total || 0;
        day.count += 1;
      }
    });

    return {
      labels: last7Days.map((d) => d.date),
      datasets: [
        {
          label: "Revenue (₹)",
          data: last7Days.map((d) => d.revenue),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Orders",
          data: last7Days.map((d) => d.count),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    };
  }, [orders]);

  // === Top Products ===
  const topProducts = useMemo(() => {
    const productSales = {};
    orders.forEach((o) => {
      o.items?.forEach((item) => {
        const pid = item.productId;
        if (!productSales[pid]) productSales[pid] = { qty: 0, revenue: 0 };
        productSales[pid].qty += item.quantity || 0;
        productSales[pid].revenue += (item.quantity || 0) * (item.price || 0);
      });
    });

    const sorted = Object.entries(productSales)
      .map(([id, data]) => {
        const product = products.find((p) => p.id === parseInt(id));
        return { name: product?.name || "Unknown", ...data };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      labels: sorted.map((p) => p.name),
      datasets: [
        {
          label: "Revenue (₹)",
          data: sorted.map((p) => p.revenue),
          backgroundColor: [
            "#3b82f6",
            "#8b5cf6",
            "#ec4899",
            "#f59e0b",
            "#10b981",
          ],
        },
      ],
    };
  }, [orders, products]);

  // === Invoice Status ===
  const invoiceStatus = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "Paid").length;
    const unpaid = invoices.filter((i) => i.status === "Unpaid").length;
    const overdue = invoices.filter((i) => i.status === "Overdue").length;

    return {
      labels: ["Paid", "Unpaid", "Overdue"],
      datasets: [
        {
          data: [paid, unpaid, overdue],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        },
      ],
    };
  }, [invoices]);

  // === Recent Orders ===
  const recentOrders = useMemo(() => {
    return orders
      .map((order) => {
        const date = safeParseDate(order.createdAt);
        return { ...order, parsedDate: date };
      })
      .filter((o) => o.parsedDate !== null) // optional: skip invalid
      .sort((a, b) => b.parsedDate - a.parsedDate)
      .slice(0, 6);
  }, [orders]);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Sales Dashboard</h1>
        <p className="text-sm text-blue-700 mt-1">
          Real-time Sales Performance — Last updated:{" "}
          <span className="font-medium">{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-6">
        {[
          {
            title: "Total Orders",
            value: kpis.totalOrders,
            trend: "This Month",
            color: "text-blue-600",
          },
          {
            title: "Revenue",
            value: kpis.totalRevenue,
            trend: "Growth",
            color: "text-green-600",
          },
          {
            title: "Paid Invoices",
            value: kpis.paidInvoices,
            trend: "Collected",
            color: "text-teal-600",
          },
          {
            title: "Avg Order Value",
            value: kpis.avgOrderValue,
            trend: "AOV",
            color: "text-purple-600",
          },
          {
            title: "Active Customers",
            value: kpis.activeCustomers,
            trend: "Engaged",
            color: "text-indigo-600",
          },
          {
            title: "Pending Quotes",
            value: kpis.pendingQuotations,
            trend: "Convert",
            color: "text-orange-600",
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
            <p className="text-3xl font-bold mt-2">{kpi.value}</p>
            <span className={`text-xs font-medium ${kpi.color}`}>
              {kpi.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions - FIXED WITH LINK */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-800">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/sales/orders"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            New Order
          </Link>
          <Link
            to="/sales/invoices"
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition"
          >
            View Invoices
          </Link>
          <Link
            to="/sales/quotations"
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition"
          >
            Create Quote
          </Link>
          <Link
            to="/sales/customers"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition"
          >
            Customers
          </Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 text-blue-800">
            Sales Trend (7 Days)
          </h3>
          <Line
            data={salesTrend}
            options={{
              maintainAspectRatio: false,
              scales: {
                y: {
                  position: "left",
                  title: { display: true, text: "Revenue (₹)" },
                },
                y1: {
                  position: "right",
                  title: { display: true, text: "Orders" },
                  grid: { drawOnChartArea: false },
                },
              },
            }}
            height={220}
          />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 text-blue-800">
            Top Selling Products
          </h3>
          <Bar
            data={topProducts}
            options={{ maintainAspectRatio: false, indexAxis: "y" }}
            height={220}
          />
        </div>

        {/* Invoice Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 text-blue-800">Invoice Status</h3>
          <Doughnut
            data={invoiceStatus}
            options={{ maintainAspectRatio: false }}
            height={220}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-800">
          Recent Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-blue-50 text-left">
                <th className="py-3 px-4 font-semibold text-blue-700">
                  Order No
                </th>
                <th className="py-3 px-4 font-semibold text-blue-700">
                  Customer
                </th>
                <th className="py-3 px-4 font-semibold text-blue-700">
                  Amount
                </th>
                <th className="py-3 px-4 font-semibold text-blue-700">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold text-blue-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const customer = customers.find(
                    (c) => c.id === order.customerId
                  );
                  const displayDate = order.parsedDate
                    ? format(order.parsedDate, "MMM dd, yyyy")
                    : "—";

                  return (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-blue-50 transition"
                    >
                      <td className="py-3 px-4 font-medium">{order.orderNo}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {customer?.name || "Unknown"}
                      </td>
                      <td className="py-3 px-4">
                        ₹{(order.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            order.status === "Delivered" ||
                            order.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{displayDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
