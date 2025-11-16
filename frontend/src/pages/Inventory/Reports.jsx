// src/modules/reports/Reports.jsx
import { useInventory } from "../../context/InventoryContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  Package,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function Reports() {
  // === SAFE DEFAULTS ===
  const {
    orders = [],
    shipments = [],
    returns = [],
    purchaseOrders = [],
    grns = [],
    products = [],
    stockLedger = [],
    stockSummary = [],
    loading = false,
  } = useInventory();

  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState("last30");

  // === Date Range Filter ===
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: now, end: now };
      case "last7":
        return { start: subDays(now, 7), end: now };
      case "last30":
        return { start: subDays(now, 30), end: now };
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDateRange();

  // === 1. SALES REPORT ===
  const salesData = useMemo(() => {
    const filtered = orders.filter((o) => {
      const date = new Date(o.orderDate);
      return date >= start && date <= end && o.status !== "Cancelled";
    });

    const daily = {};
    filtered.forEach((o) => {
      const day = format(new Date(o.orderDate), "MMM dd");
      daily[day] = (daily[day] || 0) + (o.total || 0);
    });

    return Object.entries(daily)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [orders, start, end]);

  const totalSales = useMemo(() => {
    return orders
      .filter((o) => {
        const date = new Date(o.orderDate);
        return date >= start && date <= end && o.status !== "Cancelled";
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders, start, end]);

  const orderCount = useMemo(() => {
    return orders.filter((o) => {
      const date = new Date(o.orderDate);
      return date >= start && date <= end;
    }).length;
  }, [orders, start, end]);

  const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

  // === 2. INVENTORY REPORT ===
  const inventoryValue = useMemo(() => {
    return products
      .map((p) => {
        const balance = stockLedger
          .filter((t) => t.product_id === p.id)
          .reduce((s, t) => s + (t.qty_in || 0) - (t.qty_out || 0), 0);

        const costPrice = p.cost_price || 0;
        return {
          ...p,
          stock: balance,
          value: balance * costPrice,
        };
      })
      .filter((p) => p.stock > 0);
  }, [products, stockLedger]);

  const totalInventoryValue = inventoryValue.reduce((s, p) => s + p.value, 0);

  // === 3. PURCHASE REPORT ===
  const purchaseData = useMemo(() => {
    return (purchaseOrders || [])
      .filter((po) => {
        const date = new Date(po.orderDate);
        return date >= start && date <= end;
      })
      .reduce((sum, po) => sum + (po.total || 0), 0);
  }, [purchaseOrders, start, end]);

  // === 4. TOP PRODUCTS ===
  const topProducts = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const id = item.productId || item.product_id;
        if (id) map[id] = (map[id] || 0) + (item.qty || 0);
      });
    });

    return Object.entries(map)
      .map(([id, qty]) => {
        const prod = products.find((p) => p.id === parseInt(id));
        return { name: prod?.name || "Unknown", qty };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders, products]);

  // === 5. PIE: Order Status ===
  const orderStatusData = useMemo(() => {
    const counts = { Confirmed: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    orders.forEach((o) => {
      const status = o.status || "Unknown";
      if (status in counts) counts[status]++;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [orders]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  // === Export to CSV ===
  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return alert("No data to export");

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "sales", label: "Sales", icon: DollarSign },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "purchase", label: "Purchase", icon: FileText },
    { id: "performance", label: "Performance", icon: TrendingUp },
  ];

  // === Safe Loading ===
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Generating reports...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-teal-50 to-emerald-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-emerald-600" />
            Reports Dashboard
          </h1>
          <div className="flex gap-3 items-center">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
            </select>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {format(start, "MMM dd")} - {format(end, "MMM dd")}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto bg-white rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === SALES REPORT === */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow">
              <p className="text-sm text-gray-600">Orders</p>
              <p className="text-2xl font-bold">{orderCount}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow">
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Sales Trend</h3>
              <button
                onClick={() => exportCSV(salesData, "sales-trend")}
                className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Top 5 Products</h3>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sales data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Order Status</h3>
              {orderStatusData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === INVENTORY REPORT === */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${totalInventoryValue.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() =>
                exportCSV(
                  inventoryValue.map((p) => ({
                    SKU: p.sku,
                    Name: p.name,
                    Stock: p.stock,
                    "Unit Cost": p.cost_price || 0,
                    "Total Value": p.value.toFixed(2),
                  })),
                  "inventory-valuation"
                )
              }
              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Unit Cost</th>
                    <th className="px-4 py-3 text-left">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryValue.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-gray-500"
                      >
                        No stock available
                      </td>
                    </tr>
                  ) : (
                    inventoryValue.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{p.sku}</td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 font-bold">{p.stock}</td>
                        <td className="px-4 py-3">
                          ${(p.cost_price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          ${p.value.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === PURCHASE REPORT === */}
      {activeTab === "purchase" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Purchase</p>
              <p className="text-2xl font-bold text-purple-600">
                ${purchaseData.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow">
              <p className="text-sm text-gray-600">POs Created</p>
              <p className="text-2xl font-bold">{purchaseOrders.length}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow">
              <p className="text-sm text-gray-600">GRNs Received</p>
              <p className="text-2xl font-bold">{grns.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Purchase Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      PO No
                    </th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-12 text-gray-500"
                      >
                        No purchase orders
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {po.poNo || po.id}
                        </td>
                        <td className="px-4 py-3">{po.supplier || "—"}</td>
                        <td className="px-4 py-3">
                          ${(po.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              po.received || po.status === "Received"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {po.status ||
                              (po.received ? "Received" : "Pending")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === PERFORMANCE REPORT === */}
      {activeTab === "performance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Fulfillment Rate</h3>
            <p className="text-3xl font-bold text-emerald-600">
              {orders.length > 0
                ? (
                    (orders.filter((o) => o.shippingStatus === "Delivered")
                      .length /
                      orders.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-600 mt-1">Delivered on time</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Return Rate</h3>
            <p className="text-3xl font-bold text-orange-600">
              {orders.length > 0
                ? ((returns.length / orders.length) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-600 mt-1">Returns processed</p>
          </div>
        </div>
      )}
    </div>
  );
}
