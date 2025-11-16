import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Calendar,
  Download,
  Truck,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { useSales } from "../../context/SalesContext";

const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function SalesAnalytics() {
  const { orders, customers, products, returns, loading, error } = useSales();
  const [dateRange, setDateRange] = useState("all");
  const [chartType, setChartType] = useState("line");

  // Date range filtering
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);

    switch (dateRange) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        break;
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return dateRange === "all" || orderDate >= startDate;
    });
  }, [orders, dateRange]);

  // === 1. Comprehensive Key Metrics ===
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );
    const totalOrders = filteredOrders.length;
    const confirmedOrders = filteredOrders.filter(
      (o) => o.status === "Confirmed"
    ).length;
    const deliveredOrders = filteredOrders.filter(
      (o) => o.shippingStatus === "Delivered"
    ).length;
    const pendingOrders = filteredOrders.filter(
      (o) => o.status === "Pending"
    ).length;
    const cancelledOrders = filteredOrders.filter(
      (o) => o.status === "Cancelled"
    ).length;

    const uniqueCustomers = new Set(filteredOrders.map((o) => o.customerId))
      .size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Customer metrics
    const repeatCustomers = customers.filter(
      (customer) =>
        filteredOrders.filter((o) => o.customerId === customer.id).length > 1
    ).length;

    // Return metrics
    const totalReturns = returns.length;
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
    const totalRefundAmount = returns.reduce(
      (sum, r) => sum + (r.refundAmount || 0),
      0
    );

    // Trend calculations
    const now = new Date();
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const prev30 = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const recentRevenue = filteredOrders
      .filter((o) => new Date(o.orderDate) >= last30)
      .reduce((s, o) => s + (o.total || 0), 0);

    const prevRevenue = filteredOrders
      .filter(
        (o) => new Date(o.orderDate) >= prev30 && new Date(o.orderDate) < last30
      )
      .reduce((s, o) => s + (o.total || 0), 0);

    const revenueTrend =
      prevRevenue === 0
        ? recentRevenue > 0
          ? 100
          : 0
        : ((recentRevenue - prevRevenue) / prevRevenue) * 100;

    // Order trend
    const recentOrders = filteredOrders.filter(
      (o) => new Date(o.orderDate) >= last30
    ).length;
    const prevOrders = filteredOrders.filter(
      (o) => new Date(o.orderDate) >= prev30 && new Date(o.orderDate) < last30
    ).length;
    const orderTrend =
      prevOrders === 0
        ? recentOrders > 0
          ? 100
          : 0
        : ((recentOrders - prevOrders) / prevOrders) * 100;

    return {
      totalRevenue,
      totalOrders,
      confirmedOrders,
      deliveredOrders,
      pendingOrders,
      cancelledOrders,
      uniqueCustomers,
      averageOrderValue,
      repeatCustomers,
      totalReturns,
      returnRate,
      totalRefundAmount,
      revenueTrend,
      orderTrend,
      recentRevenue,
    };
  }, [filteredOrders, customers, returns]);

  // === 2. Enhanced Monthly Revenue Data ===
  const monthlyData = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const date = new Date(o.orderDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!map[monthKey]) {
        map[monthKey] = {
          revenue: 0,
          orders: 0,
          customers: new Set(),
          aov: 0,
        };
      }
      map[monthKey].revenue += o.total || 0;
      map[monthKey].orders += 1;
      map[monthKey].customers.add(o.customerId);
    });

    // Calculate AOV for each month
    Object.keys(map).forEach((key) => {
      map[key].aov =
        map[key].orders > 0 ? map[key].revenue / map[key].orders : 0;
      map[key].customers = map[key].customers.size;
    });

    return Object.entries(map)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers,
        aov: data.aov,
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-12);
  }, [filteredOrders]);

  // === 3. Top Products with Quantity - FIXED ===
  const topProducts = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (!map[item.productName]) {
            map[item.productName] = {
              revenue: 0,
              quantity: 0,
              orders: 0,
            };
          }
          map[item.productName].revenue += item.total || 0;
          map[item.productName].quantity += item.qty || 0;
          map[item.productName].orders += 1;
        });
      }
    });

    // Convert to array and calculate average price
    const productsArray = Object.entries(map).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      quantity: data.quantity,
      orders: data.orders,
      avgPrice: data.quantity > 0 ? data.revenue / data.quantity : 0,
    }));

    // Sort by revenue and take top 8
    return productsArray.sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredOrders]);

  // === 4. Enhanced Top Customers - FIXED ===
  const topCustomers = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      if (!map[o.customerName]) {
        map[o.customerName] = {
          revenue: 0,
          orders: 0,
          firstOrder: o.orderDate,
          lastOrder: o.orderDate,
        };
      }
      map[o.customerName].revenue += o.total || 0;
      map[o.customerName].orders += 1;
      if (new Date(o.orderDate) < new Date(map[o.customerName].firstOrder)) {
        map[o.customerName].firstOrder = o.orderDate;
      }
      if (new Date(o.orderDate) > new Date(map[o.customerName].lastOrder)) {
        map[o.customerName].lastOrder = o.orderDate;
      }
    });

    // Convert to array and calculate AOV
    const customersArray = Object.entries(map).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      orders: data.orders,
      aov: data.orders > 0 ? data.revenue / data.orders : 0,
      firstOrder: data.firstOrder,
      lastOrder: data.lastOrder,
    }));

    // Sort by revenue and take top 8
    return customersArray.sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredOrders]);

  // === 5. Order Status Distribution - FIXED ===
  const orderStatusData = useMemo(() => {
    const statusCount = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    filteredOrders.forEach((order) => {
      if (order.status && statusCount.hasOwnProperty(order.status)) {
        statusCount[order.status] += 1;
      }
    });

    return Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // === 6. Sales Performance by Time of Day - FIXED ===
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      revenue: 0,
      orders: 0,
    }));

    filteredOrders.forEach((order) => {
      try {
        const orderDate = new Date(order.orderDate);
        const hour = orderDate.getHours();
        if (hour >= 0 && hour <= 23) {
          hours[hour].revenue += order.total || 0;
          hours[hour].orders += 1;
        }
      } catch (error) {
        console.warn("Invalid order date:", order.orderDate);
      }
    });

    return hours.map((h) => ({
      hour: `${h.hour}:00`,
      revenue: h.revenue,
      orders: h.orders,
    }));
  }, [filteredOrders]);

  // === 7. Export Enhanced CSV ===
  const exportAnalyticsCSV = () => {
    const headers = ["Metric", "Value", "Details"];
    const rows = [
      [
        "Total Revenue",
        metrics.totalRevenue,
        formatRevenue(metrics.totalRevenue),
      ],
      ["Total Orders", metrics.totalOrders, `${metrics.totalOrders} orders`],
      [
        "Average Order Value",
        metrics.averageOrderValue,
        formatRevenue(metrics.averageOrderValue),
      ],
      [
        "Unique Customers",
        metrics.uniqueCustomers,
        `${metrics.uniqueCustomers} customers`,
      ],
      [
        "Repeat Customers",
        metrics.repeatCustomers,
        `${metrics.repeatCustomers} customers`,
      ],
      ["Return Rate", metrics.returnRate, `${metrics.returnRate.toFixed(1)}%`],
      [
        "Total Refunds",
        metrics.totalRefundAmount,
        formatRevenue(metrics.totalRefundAmount),
      ],
      ...monthlyData.map((d) => [
        `Revenue ${d.month}`,
        d.revenue,
        `${d.orders} orders, ${d.customers} customers`,
      ]),
      ...topProducts.map((p) => [
        `Top Product: ${p.name}`,
        p.revenue,
        `${p.quantity} units, ${p.orders} orders`,
      ]),
      ...topCustomers.map((c) => [
        `Top Customer: ${c.name}`,
        c.revenue,
        `${c.orders} orders, AOV: ${formatRevenue(c.aov)}`,
      ]),
    ];

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                Sales Analytics
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive sales performance and trends analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={exportAnalyticsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* === Comprehensive Key Metrics === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          {/* Total Revenue */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
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

          {/* Total Orders */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.totalOrders}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {metrics.orderTrend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={
                  metrics.orderTrend > 0 ? "text-green-600" : "text-red-600"
                }
              >
                {Math.abs(metrics.orderTrend).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatRevenue(metrics.averageOrderValue)}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* Customers */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {metrics.uniqueCustomers}
                </p>
              </div>
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {metrics.repeatCustomers} repeat customers
            </div>
          </div>

          {/* Delivered Orders */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.deliveredOrders}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {metrics.totalOrders > 0
                ? (
                    (metrics.deliveredOrders / metrics.totalOrders) *
                    100
                  ).toFixed(1)
                : 0}
              % rate
            </div>
          </div>

          {/* Returns */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Return Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.returnRate.toFixed(1)}%
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {formatRevenue(metrics.totalRefundAmount)} refunded
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Revenue Trend
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("line")}
                  className={`px-3 py-1 text-sm rounded ${
                    chartType === "line"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`px-3 py-1 text-sm rounded ${
                    chartType === "bar"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "line" ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? formatRevenue(value) : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              ) : (
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatRevenue(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Top Products by Revenue
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatRevenue(value) : value,
                    name === "revenue" ? "Revenue" : "Quantity",
                  ]}
                />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue">
                  {topProducts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" /> Order Status
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} orders`, "Count"]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Hour */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Sales by Hour
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatRevenue(value)} />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Top Customers
            </h3>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {customer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-500">
                        {customer.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatRevenue(customer.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      AOV: {formatRevenue(customer.aov)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Performance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Product Performance Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Avg Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((product) => (
                  <tr key={product.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      {formatRevenue(product.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {product.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {product.orders}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {formatRevenue(product.avgPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
