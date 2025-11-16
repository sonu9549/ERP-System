// src/modules/sales/pages/SalesDashboard.jsx
import React, { useMemo, useState } from "react";
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
import { Bar, Doughnut, Scatter } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { useSales } from "../../context/SalesContext";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  isValid,
  parseISO,
  startOfWeek,
  endOfWeek,
  subMonths,
  startOfQuarter,
  endOfQuarter,
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

// === Date Range Options ===
const DATE_RANGES = {
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
};

// Chart Types
const CHART_TYPES = {
  BAR: "bar",
  SCATTER: "scatter",
};

// Chart color schemes
const CHART_COLORS = {
  revenue: "#3b82f6",
  orders: "#10b981",
  customers: "#8b5cf6",
  paid: "#10b981",
  unpaid: "#f59e0b",
  overdue: "#ef4444",
  background: {
    revenue: "rgba(59, 130, 246, 0.7)",
    orders: "rgba(16, 185, 129, 0.7)",
    customers: "rgba(139, 92, 246, 0.7)",
  },
};

const PRODUCT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#a855f7",
];

const SalesDashboard = () => {
  const {
    orders = [],
    invoices = [],
    customers = [],
    products = [],
    quotations = [],
    returns = [],
    filters,
    setFilters,
    isLoading = false,
  } = useSales();

  const [dateRange, setDateRange] = useState(DATE_RANGES.WEEK);
  const [chartType, setChartType] = useState(CHART_TYPES.BAR);

  // === Enhanced KPIs with comparison and trends ===
  const kpis = useMemo(() => {
    const currentPeriodOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = safeParseDate(order.createdAt);
      if (!orderDate) return false;

      const now = new Date();
      let startDate, endDate;

      switch (dateRange) {
        case DATE_RANGES.WEEK:
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case DATE_RANGES.MONTH:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case DATE_RANGES.QUARTER:
          startDate = startOfQuarter(now);
          endDate = endOfQuarter(now);
          break;
        default:
          return true;
      }

      return orderDate >= startDate && orderDate <= endDate;
    });

    // Previous period for comparison
    const previousPeriodOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = safeParseDate(order.createdAt);
      if (!orderDate) return false;

      const now = new Date();
      let startDate, endDate;

      switch (dateRange) {
        case DATE_RANGES.WEEK:
          startDate = startOfWeek(subDays(now, 7));
          endDate = endOfWeek(subDays(now, 7));
          break;
        case DATE_RANGES.MONTH:
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          break;
        case DATE_RANGES.QUARTER:
          startDate = startOfQuarter(subMonths(now, 3));
          endDate = endOfQuarter(subMonths(now, 3));
          break;
        default:
          return false;
      }

      return orderDate >= startDate && orderDate <= endDate;
    });

    // Current period calculations
    const totalOrders = currentPeriodOrders.length;
    const totalRevenue = currentPeriodOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );
    const paidInvoices = invoices.filter((i) => i.status === "Paid").length;
    const pendingInvoices = invoices.filter(
      (i) => i.status === "Pending" || i.status === "Unpaid"
    ).length;
    const avgOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const activeCustomers = new Set(
      currentPeriodOrders.map((o) => o.customerId)
    ).size;
    const pendingQuotations = quotations.filter(
      (q) => q.status === "Draft" || q.status === "Pending"
    ).length;
    const conversionRate =
      quotations.length > 0
        ? Math.round((currentPeriodOrders.length / quotations.length) * 100)
        : 0;

    // Previous period calculations for trends
    const prevTotalOrders = previousPeriodOrders.length;
    const prevTotalRevenue = previousPeriodOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );
    const prevAvgOrderValue =
      prevTotalOrders > 0 ? Math.round(prevTotalRevenue / prevTotalOrders) : 0;

    // Calculate trends
    const ordersTrend =
      prevTotalOrders > 0
        ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100
        : totalOrders > 0
        ? 100
        : 0;

    const revenueTrend =
      prevTotalRevenue > 0
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : totalRevenue > 0
        ? 100
        : 0;

    const aovTrend =
      prevAvgOrderValue > 0
        ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
        : avgOrderValue > 0
        ? 100
        : 0;

    // Return metrics
    const totalReturns = returns.length;
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
    const totalRefundAmount = returns.reduce(
      (sum, r) => sum + (r.refundAmount || 0),
      0
    );

    return {
      totalOrders: {
        value: totalOrders.toLocaleString(),
        trend: ordersTrend,
        isPositive: ordersTrend >= 0,
      },
      totalRevenue: {
        value: `₹${totalRevenue.toLocaleString()}`,
        trend: revenueTrend,
        isPositive: revenueTrend >= 0,
      },
      paidInvoices: {
        value: paidInvoices.toLocaleString(),
        trend: 0,
        isPositive: true,
      },
      pendingInvoices: {
        value: pendingInvoices.toLocaleString(),
        trend: 0,
        isPositive: false,
      },
      avgOrderValue: {
        value: `₹${avgOrderValue.toLocaleString()}`,
        trend: aovTrend,
        isPositive: aovTrend >= 0,
      },
      activeCustomers: {
        value: activeCustomers.toLocaleString(),
        trend: 0,
        isPositive: true,
      },
      pendingQuotations: {
        value: pendingQuotations.toLocaleString(),
        trend: 0,
        isPositive: false,
      },
      conversionRate: {
        value: `${conversionRate}%`,
        trend: 0,
        isPositive: conversionRate >= 20,
      },
      returnRate: {
        value: `${returnRate.toFixed(1)}%`,
        trend: 0,
        isPositive: returnRate <= 5,
      },
      totalRefunds: {
        value: `₹${totalRefundAmount.toLocaleString()}`,
        trend: 0,
        isPositive: false,
      },
    };
  }, [orders, invoices, quotations, returns, dateRange]);

  // === Bar Chart Data for Sales Trend ===
  const barChartData = useMemo(() => {
    let daysToShow = 7;
    let dateFormat = "EEE";

    switch (dateRange) {
      case DATE_RANGES.MONTH:
        daysToShow = 30;
        dateFormat = "MMM dd";
        break;
      case DATE_RANGES.QUARTER:
        daysToShow = 90;
        dateFormat = "MMM dd";
        break;
      default:
        daysToShow = 7;
        dateFormat = "EEE";
    }

    const periodData = Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(new Date(), daysToShow - 1 - i);
      return {
        date: format(date, dateFormat),
        fullDate: date,
        revenue: 0,
        orders: 0,
        customers: new Set(),
      };
    });

    orders.forEach((o) => {
      const date = safeParseDate(o.createdAt);
      if (!date) return;

      const formattedDate = format(date, dateFormat);
      const day = periodData.find((d) => d.date === formattedDate);
      if (day) {
        day.revenue += o.total || 0;
        day.orders += 1;
        day.customers.add(o.customerId);
      }
    });

    // Calculate unique customers per day
    periodData.forEach((day) => {
      day.customers = day.customers.size;
    });

    return {
      labels: periodData.map((d) => d.date),
      datasets: [
        {
          label: "Revenue (₹)",
          data: periodData.map((d) => d.revenue),
          backgroundColor: CHART_COLORS.background.revenue,
          borderColor: CHART_COLORS.revenue,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: "Orders",
          data: periodData.map((d) => d.orders),
          backgroundColor: CHART_COLORS.background.orders,
          borderColor: CHART_COLORS.orders,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: "Customers",
          data: periodData.map((d) => d.customers),
          backgroundColor: CHART_COLORS.background.customers,
          borderColor: CHART_COLORS.customers,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
          hidden: true,
        },
      ],
    };
  }, [orders, dateRange]);

  // === Scatter Chart Data for Sales Trend ===
  const scatterChartData = useMemo(() => {
    let daysToShow = 7;

    switch (dateRange) {
      case DATE_RANGES.MONTH:
        daysToShow = 30;
        break;
      case DATE_RANGES.QUARTER:
        daysToShow = 90;
        break;
      default:
        daysToShow = 7;
    }

    const scatterData = orders
      .map((order) => {
        const date = safeParseDate(order.createdAt);
        if (!date) return null;

        return {
          x: date.getTime(), // Use timestamp for X-axis
          y: order.total || 0,
          orderId: order.id,
          customerId: order.customerId,
          items: order.items?.length || 0,
        };
      })
      .filter(Boolean);

    // Filter to selected date range
    const startDate = subDays(new Date(), daysToShow).getTime();
    const filteredData = scatterData.filter((point) => point.x >= startDate);

    return {
      datasets: [
        {
          label: "Order Value vs Date",
          data: filteredData,
          backgroundColor: CHART_COLORS.revenue,
          borderColor: CHART_COLORS.revenue,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBorderWidth: 2,
          pointBorderColor: "#ffffff",
        },
        {
          label: "High Value Orders (> ₹10k)",
          data: filteredData.filter((point) => point.y > 10000),
          backgroundColor: "#ef4444",
          borderColor: "#ef4444",
          pointRadius: 8,
          pointHoverRadius: 10,
          pointBorderWidth: 2,
          pointBorderColor: "#ffffff",
        },
      ],
    };
  }, [orders, dateRange]);

  // === Enhanced Top Products with revenue percentages and better data structure ===
  const topProducts = useMemo(() => {
    const productSales = {};
    let totalRevenue = 0;

    orders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const pid = item.productId;
          if (!productSales[pid]) {
            productSales[pid] = {
              quantity: 0,
              revenue: 0,
              orders: 0,
              product: null,
            };
          }
          const itemRevenue = (item.quantity || 0) * (item.price || 0);
          productSales[pid].quantity += item.quantity || 0;
          productSales[pid].revenue += itemRevenue;
          productSales[pid].orders += 1;
          totalRevenue += itemRevenue;
        });
      }
    });

    const sorted = Object.entries(productSales)
      .map(([id, data]) => {
        const product = products.find((p) => p.id === parseInt(id));
        const percentage =
          totalRevenue > 0
            ? ((data.revenue / totalRevenue) * 100).toFixed(1)
            : 0;
        return {
          id: id,
          name: product?.name || "Unknown Product",
          ...data,
          percentage,
          product,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      labels: sorted.map((p) => p.name),
      datasets: [
        {
          label: "Revenue (₹)",
          data: sorted.map((p) => p.revenue),
          backgroundColor: PRODUCT_COLORS.slice(0, sorted.length),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
        {
          label: "Quantity Sold",
          data: sorted.map((p) => p.quantity),
          backgroundColor: PRODUCT_COLORS.slice(0, sorted.length).map(
            (color) => color + "80"
          ),
          borderWidth: 2,
          borderColor: "#ffffff",
          hidden: true,
        },
      ],
      detailedData: sorted,
    };
  }, [orders, products]);

  // === Enhanced Invoice Status with amounts and better categorization ===
  const invoiceStatus = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "Paid");
    const unpaid = invoices.filter(
      (i) => i.status === "Pending" || i.status === "Unpaid"
    );
    const overdue = invoices.filter((i) => i.status === "Overdue");
    const draft = invoices.filter((i) => i.status === "Draft");

    const paidAmount = paid.reduce(
      (sum, i) => sum + (i.total || i.amount || 0),
      0
    );
    const unpaidAmount = unpaid.reduce(
      (sum, i) => sum + (i.total || i.amount || 0),
      0
    );
    const overdueAmount = overdue.reduce(
      (sum, i) => sum + (i.total || i.amount || 0),
      0
    );
    const draftAmount = draft.reduce(
      (sum, i) => sum + (i.total || i.amount || 0),
      0
    );

    const totalInvoices =
      paid.length + unpaid.length + overdue.length + draft.length;

    return {
      labels: [
        `Paid (${paid.length})`,
        `Unpaid (${unpaid.length})`,
        `Overdue (${overdue.length})`,
        ...(draft.length > 0 ? [`Draft (${draft.length})`] : []),
      ],
      datasets: [
        {
          data: [
            paid.length,
            unpaid.length,
            overdue.length,
            ...(draft.length > 0 ? [draft.length] : []),
          ],
          backgroundColor: [
            CHART_COLORS.paid,
            CHART_COLORS.unpaid,
            CHART_COLORS.overdue,
            ...(draft.length > 0 ? ["#6b7280"] : []),
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
      amounts: {
        paid: paidAmount,
        unpaid: unpaidAmount,
        overdue: overdueAmount,
        draft: draftAmount,
        total: paidAmount + unpaidAmount + overdueAmount + draftAmount,
      },
      counts: {
        paid: paid.length,
        unpaid: unpaid.length,
        overdue: overdue.length,
        draft: draft.length,
        total: totalInvoices,
      },
    };
  }, [invoices]);

  // === Customer Acquisition Chart ===
  const customerAcquisition = useMemo(() => {
    const monthlyCustomers = {};

    customers.forEach((customer) => {
      const date = safeParseDate(customer.createdAt || customer.joinedDate);
      if (!date) return;

      const monthKey = format(date, "MMM yyyy");
      if (!monthlyCustomers[monthKey]) {
        monthlyCustomers[monthKey] = 0;
      }
      monthlyCustomers[monthKey]++;
    });

    const sortedMonths = Object.keys(monthlyCustomers)
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(-6);

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: "New Customers",
          data: sortedMonths.map((month) => monthlyCustomers[month]),
          backgroundColor: CHART_COLORS.revenue,
          borderColor: CHART_COLORS.revenue,
          borderWidth: 2,
        },
      ],
    };
  }, [customers]);

  // === Recent Orders ===
  const recentOrders = useMemo(() => {
    return orders
      .map((order) => {
        const date = safeParseDate(order.createdAt);
        return { ...order, parsedDate: date };
      })
      .filter((o) => o.parsedDate !== null)
      .sort((a, b) => b.parsedDate - a.parsedDate)
      .slice(0, 6);
  }, [orders]);

  // Chart options
  const barChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (₹)",
          color: CHART_COLORS.revenue,
        },
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
        ticks: {
          callback: function (value) {
            return "₹" + (value / 1000).toFixed(0) + "k";
          },
        },
      },
      x: {
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.95)",
        titleColor: "#1f2937",
        bodyColor: "#374151",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (label.includes("Revenue") || label.includes("Amount")) {
                label += "₹" + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
  };

  const scatterChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          callback: function (value) {
            return format(new Date(value), "MMM dd");
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Order Value (₹)",
        },
        ticks: {
          callback: function (value) {
            return "₹" + value.toLocaleString();
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          title: function (tooltipItems) {
            return format(new Date(tooltipItems[0].parsed.x), "MMM dd, yyyy");
          },
          label: function (context) {
            return `Order Value: ₹${context.parsed.y.toLocaleString()}`;
          },
          afterLabel: function (context) {
            const point = context.raw;
            return `Items: ${point.items}\nOrder ID: ${point.orderId}`;
          },
        },
      },
    },
  };

  const horizontalBarOptions = {
    maintainAspectRatio: false,
    responsive: true,
    indexAxis: "y",
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${
              context.dataset.label
            }: ₹${context.parsed.x.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: function (value) {
            return "₹" + (value / 1000).toFixed(0) + "k";
          },
        },
      },
    },
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // === Loading State ===
  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-800 font-medium">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen text-gray-800">
      {/* Header with Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Sales Dashboard</h1>
          <p className="text-sm text-blue-700 mt-1">
            Real-time Sales Performance — Last updated:{" "}
            <span className="font-medium">{new Date().toLocaleString()}</span>
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="mt-4 sm:mt-0">
          <label
            htmlFor="dateRange"
            className="text-sm font-medium text-gray-700 mr-2"
          >
            Date Range:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3"
          >
            <option value={DATE_RANGES.WEEK}>Last 7 Days</option>
            <option value={DATE_RANGES.MONTH}>Last 30 Days</option>
            <option value={DATE_RANGES.QUARTER}>Last Quarter</option>
          </select>

          <label
            htmlFor="chartType"
            className="text-sm font-medium text-gray-700 mr-2"
          >
            Chart Type:
          </label>
          <select
            id="chartType"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={CHART_TYPES.BAR}>Bar Chart</option>
            <option value={CHART_TYPES.SCATTER}>Scatter Chart</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-6">
        {[
          {
            key: "totalOrders",
            title: "Total Orders",
            icon: "📦",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            key: "totalRevenue",
            title: "Total Revenue",
            icon: "💰",
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            key: "avgOrderValue",
            title: "Avg Order Value",
            icon: "📊",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            key: "activeCustomers",
            title: "Active Customers",
            icon: "👥",
            color: "text-indigo-600",
            bgColor: "bg-indigo-50",
          },
          {
            key: "conversionRate",
            title: "Conversion Rate",
            icon: "🎯",
            color: "text-cyan-600",
            bgColor: "bg-cyan-50",
          },
          {
            key: "paidInvoices",
            title: "Paid Invoices",
            icon: "✅",
            color: "text-teal-600",
            bgColor: "bg-teal-50",
          },
          {
            key: "pendingInvoices",
            title: "Pending Invoices",
            icon: "⏳",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          {
            key: "pendingQuotations",
            title: "Pending Quotes",
            icon: "📝",
            color: "text-amber-600",
            bgColor: "bg-amber-50",
          },
          {
            key: "returnRate",
            title: "Return Rate",
            icon: "🔄",
            color: "text-rose-600",
            bgColor: "bg-rose-50",
          },
          {
            key: "totalRefunds",
            title: "Total Refunds",
            icon: "💸",
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
        ].map((kpi) => {
          const data = kpis[kpi.key];
          return (
            <div
              key={kpi.key}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <span>{kpi.icon}</span>
                    {kpi.title}
                  </h3>
                  <p className="text-2xl font-bold mt-2 text-gray-800">
                    {data.value}
                  </p>
                  {data.trend !== 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`text-xs font-medium ${
                          data.isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {data.isPositive ? "↗" : "↘"}{" "}
                        {Math.abs(data.trend).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">vs previous</span>
                    </div>
                  )}
                </div>
                <div
                  className={`w-12 h-12 rounded-full ${kpi.bgColor} flex items-center justify-center`}
                >
                  <span className="text-lg">{kpi.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
          <span>⚡</span>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/sales/orders/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium flex items-center gap-2"
          >
            <span>+</span>
            New Order
          </Link>
          <Link
            to="/sales/invoices"
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium flex items-center gap-2"
          >
            <span>📄</span>
            View Invoices
          </Link>
          <Link
            to="/sales/quotations/new"
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium flex items-center gap-2"
          >
            <span>+</span>
            Create Quote
          </Link>
          <Link
            to="/sales/customers"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-300 font-medium flex items-center gap-2"
          >
            <span>👥</span>
            Manage Customers
          </Link>
          <Link
            to="/sales/analytics"
            className="bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium flex items-center gap-2"
          >
            <span>📈</span>
            View Analytics
          </Link>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Sales Trend - Bar or Scatter Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <span>📈</span>
              Sales Trend -{" "}
              {chartType === CHART_TYPES.BAR ? "Bar Chart" : "Scatter Plot"}
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {dateRange === DATE_RANGES.WEEK
                ? "7 Days"
                : dateRange === DATE_RANGES.MONTH
                ? "30 Days"
                : "90 Days"}
            </span>
          </div>

          {chartType === CHART_TYPES.BAR ? (
            <Bar data={barChartData} options={barChartOptions} height={300} />
          ) : (
            <Scatter
              data={scatterChartData}
              options={scatterChartOptions}
              height={300}
            />
          )}

          <div className="mt-4 text-xs text-gray-600">
            {chartType === CHART_TYPES.BAR ? (
              <p>
                📊 Showing daily revenue, orders, and customer activity in bar
                format
              </p>
            ) : (
              <p>
                🔍 Scatter plot showing individual order values over time. Red
                dots indicate high-value orders (&gt; ₹10k)
              </p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="font-semibold mb-4 text-blue-800 flex items-center gap-2">
            <span>🏆</span>
            Top Selling Products
          </h3>
          <Bar data={topProducts} options={horizontalBarOptions} height={300} />
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {topProducts.detailedData.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate flex-1">{product.name}</span>
                <span className="font-semibold text-green-600 ml-2">
                  ₹{product.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="font-semibold mb-4 text-blue-800 flex items-center gap-2">
            <span>📊</span>
            Invoice Status
          </h3>
          <div className="flex flex-col items-center">
            <Doughnut
              data={invoiceStatus}
              options={doughnutOptions}
              height={220}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 w-full text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold text-green-700">
                  ₹{invoiceStatus.amounts?.paid?.toLocaleString() || 0}
                </div>
                <div className="text-green-600">
                  {invoiceStatus.counts?.paid || 0} Paid
                </div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-semibold text-yellow-700">
                  ₹{invoiceStatus.amounts?.unpaid?.toLocaleString() || 0}
                </div>
                <div className="text-yellow-600">
                  {invoiceStatus.counts?.unpaid || 0} Unpaid
                </div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="font-semibold text-red-700">
                  ₹{invoiceStatus.amounts?.overdue?.toLocaleString() || 0}
                </div>
                <div className="text-red-600">
                  {invoiceStatus.counts?.overdue || 0} Overdue
                </div>
              </div>
              {invoiceStatus.counts?.draft > 0 && (
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-700">
                    ₹{invoiceStatus.amounts?.draft?.toLocaleString() || 0}
                  </div>
                  <div className="text-gray-600">
                    {invoiceStatus.counts?.draft || 0} Draft
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Acquisition */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="font-semibold mb-4 text-blue-800 flex items-center gap-2">
            <span>👥</span>
            Customer Acquisition
          </h3>
          <Bar
            data={customerAcquisition}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
            height={250}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <span>🆕</span>
            Recent Orders
          </h2>
          <Link
            to="/sales/orders"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            View All
            <span>→</span>
          </Link>
        </div>
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
                <th className="py-3 px-4 font-semibold text-blue-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">📦</span>
                      No orders found
                    </div>
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
                      className="border-b hover:bg-blue-50 transition-colors duration-200"
                    >
                      <td className="py-3 px-4 font-medium">{order.orderNo}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {customer?.name || "Unknown"}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        ₹{(order.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === "Delivered" ||
                            order.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{displayDate}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/sales/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
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
