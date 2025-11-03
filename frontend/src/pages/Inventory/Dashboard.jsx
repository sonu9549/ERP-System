// src/pages/dashboard/InventoryDashboard.jsx
import { useMemo, useState } from "react";
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Truck,
  History,
  BarChart3,
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
  ResponsiveContainer,
} from "recharts";
import { useOrderShipping } from "../../context/OrderShippingContext";
import { format } from "date-fns";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function InventoryDashboard() {
  const {
    orders,
    stockLedger = [],
    products = [],
    warehouses = [],
  } = useOrderShipping();

  // === KPIs ===
  const stats = useMemo(() => {
    const totalItems = stockLedger.reduce((sum, t) => sum + t.balance, 0);
    const totalValue = stockLedger.reduce(
      (sum, t) => sum + t.balance * t.unit_cost,
      0
    );
    const lowStock = products.filter((p) => {
      const stock = stockLedger
        .filter((s) => s.product_id === p.id)
        .reduce((sum, s) => sum + s.balance, 0);
      return stock < p.reorder_point;
    }).length;

    const negativeStock = stockLedger.filter((s) => s.balance < 0).length;
    const expiringSoon = stockLedger.filter(
      (s) =>
        s.expiry_date &&
        new Date(s.expiry_date) <
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    return { totalItems, totalValue, lowStock, negativeStock, expiringSoon };
  }, [stockLedger, products]);

  // === Stock Trend (Last 7 Days) ===
  const stockTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, "MMM dd");
    }).reverse();

    return last7Days.map((day) => {
      const dayTransactions = stockLedger.filter(
        (t) => format(new Date(t.created_at), "MMM dd") === day
      );
      const net = dayTransactions.reduce(
        (sum, t) => sum + t.qty_in - t.qty_out,
        0
      );
      return { day, net: Math.abs(net), type: net > 0 ? "in" : "out" };
    });
  }, [stockLedger]);

  // === Top 5 Products by Value ===
  const topProducts = useMemo(() => {
    const map = {};
    stockLedger.forEach((t) => {
      if (t.balance > 0) {
        const prod = products.find((p) => p.id === t.product_id);
        if (prod) {
          map[prod.name] = (map[prod.name] || 0) + t.balance * t.unit_cost;
        }
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [stockLedger, products]);

  // === Recent Transactions ===
  const recentTx = useMemo(() => {
    return stockLedger
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map((t) => {
        const prod = products.find((p) => p.id === t.product_id);
        const wh = warehouses.find((w) => w.id === t.warehouse_id);
        return {
          ...t,
          product_name: prod?.name || "Unknown",
          warehouse_name: wh?.name || "Unknown",
        };
      });
  }, [stockLedger, products, warehouses]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Inventory Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Real-time overview of stock, value, and alerts
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalItems.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Items in inventory</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalValue)}
              </p>
              <p className="text-xs text-gray-500">FIFO valuation</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.lowStock}
              </p>
              <p className="text-xs text-gray-500">Below reorder point</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Negative Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.negativeStock}
              </p>
              <p className="text-xs text-gray-500">Requires adjustment</p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.expiringSoon}
              </p>
              <p className="text-xs text-gray-500">Within 30 days</p>
            </div>
            <History className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Purchase Order</span>
        </button>
        <button className="flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
          <Truck className="w-5 h-5" />
          <span className="font-medium">Receive GRN</span>
        </button>
        <button className="flex items-center justify-center gap-3 p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">Run Report</span>
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stock Movement Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Stock Movement (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stockTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(v) => `${v} units`}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products by Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Top Products by Value
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Recent Stock Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Warehouse</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Qty</th>
                <th className="px-4 py-3 text-left">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTx.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(t.created_at), "MMM dd, HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {t.product_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {t.warehouse_name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        t.transaction_type.includes("in")
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t.transaction_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        t.qty_in > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {t.qty_in > 0 ? `+${t.qty_in}` : `-${t.qty_out}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {t.balance.toLocaleString()}
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
