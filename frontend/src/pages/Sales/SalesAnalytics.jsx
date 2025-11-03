import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Calendar,
  Download,
  Truck,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useOrderShipping } from "../../context/OrderShippingContext";

const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

export default function SalesAnalytics() {
  const { orders } = useOrderShipping();

  // === 1. Key Metrics ===
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const confirmedOrders = orders.filter(
      (o) => o.status === "Confirmed"
    ).length;
    const shippedOrders = orders.filter(
      (o) => o.shippingStatus === "Delivered"
    ).length;
    const totalCustomers = new Set(orders.map((o) => o.customerId)).size;

    // Trend: compare last 30 days vs previous 30
    const now = new Date();
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const prev30 = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const recentRevenue = orders
      .filter((o) => new Date(o.orderDate) >= last30)
      .reduce((s, o) => s + o.total, 0);
    const prevRevenue = orders
      .filter(
        (o) => new Date(o.orderDate) >= prev30 && new Date(o.orderDate) < last30
      )
      .reduce((s, o) => s + o.total, 0);

    const revenueTrend =
      prevRevenue === 0
        ? 100
        : ((recentRevenue - prevRevenue) / prevRevenue) * 100;

    return {
      totalRevenue,
      confirmedOrders,
      shippedOrders,
      totalCustomers,
      revenueTrend,
      recentRevenue,
    };
  }, [orders]);

  // === 2. Monthly Revenue ===
  const monthlyData = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const date = new Date(o.orderDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      map[monthKey] = (map[monthKey] || 0) + o.total;
    });
    return Object.entries(map)
      .map(([month, revenue]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue,
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [orders]);

  // === 3. Top Products ===
  const topProducts = useMemo(() => {
    const map = {};
    orders.forEach((o) =>
      o.items.forEach((item) => {
        map[item.productName] = (map[item.productName] || 0) + item.total;
      })
    );
    return Object.entries(map)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // === 4. Top Customers ===
  const topCustomers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      map[o.customerName] = (map[o.customerName] || 0) + o.total;
    });
    return Object.entries(map)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // === 5. Export CSV ===
  const exportAnalyticsCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", metrics.totalRevenue],
      ["Confirmed Orders", metrics.confirmedOrders],
      ["Delivered Orders", metrics.shippedOrders],
      ["Unique Customers", metrics.totalCustomers],
      ...monthlyData.map((d) => [`Revenue ${d.month}`, d.revenue]),
      ...topProducts.map((p) => [`Top Product: ${p.name}`, p.revenue]),
      ...topCustomers.map((c) => [`Top Customer: ${c.name}`, c.revenue]),
    ];
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-analytics.csv";
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600">Track performance and trends</p>
        </div>
        <button
          onClick={exportAnalyticsCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* === Key Metrics Cards === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRevenue(metrics.totalRevenue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            {metrics.revenueTrend > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={
                metrics.revenueTrend > 0 ? "text-green-600" : "text-red-600"
              }
            >
              {Math.abs(metrics.revenueTrend).toFixed(1)}%
            </span>
            <span className="text-gray-500">vs last 30d</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed Orders</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics.confirmedOrders}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics.shippedOrders}
              </p>
            </div>
            <Truck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-indigo-600">
                {metrics.totalCustomers}
              </p>
            </div>
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* === Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatRevenue(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" /> Top Products
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(v) => formatRevenue(v)} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Top Customers
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topCustomers} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip formatter={(v) => formatRevenue(v)} />
            <Bar dataKey="revenue" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
