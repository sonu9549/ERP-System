// src/modules/sales/pages/SalesOrder.jsx
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
  Truck,
  Package,
  FileText,
  Calendar,
  User,
  ShoppingCart,
  DollarSign,
  Filter,
  MoreVertical,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useSales } from "../../context/SalesContext";
import { Link } from "react-router-dom";

const formatRevenue = (value, currency = "USD") => {
  if (!value) return `$0`;
  const num = Number(value);
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };
  const symbol = symbols[currency] || "$";

  if (num >= 1_000_000_000)
    return `${symbol}${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${symbol}${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${symbol}${(num / 1_000).toFixed(0)}k`;
  return `${symbol}${num.toLocaleString()}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Processing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Shipped":
      return "bg-green-100 text-green-800 border-green-200";
    case "Delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "Draft":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getShippingStatusColor = (status) => {
  switch (status) {
    case "Delivered":
      return "bg-emerald-100 text-emerald-800";
    case "Shipped":
      return "bg-green-100 text-green-800";
    case "In Transit":
      return "bg-yellow-100 text-yellow-800";
    case "Pending":
      return "bg-gray-100 text-gray-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function SalesOrder() {
  const {
    orders,
    customers,
    products,
    invoices,
    shipments,
    loading,
    error,
    addOrder,
    updateOrder,
    deleteOrder,
    generateInvoice,
    createShipmentFromOrder,
    updateShipmentStatus,
  } = useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showActions, setShowActions] = useState(null);

  const itemsPerPage = 10;

  const initialForm = {
    customerId: "",
    orderDate: new Date().toISOString().split("T")[0],
    status: "Draft",
    items: [],
    notes: "",
    priority: "Normal",
  };

  const [form, setForm] = useState(initialForm);
  const [newItem, setNewItem] = useState({ productId: "", qty: 1 });

  const resetForm = () => {
    setForm(initialForm);
    setNewItem({ productId: "", qty: 1 });
    setEditingOrder(null);
  };

  // Calculate order totals with pricing
  const calculateTotal = (items = form.items) => {
    const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);
    const tax = subtotal * 0.1;
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over $1000
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  };

  const addItem = () => {
    if (!newItem.productId) return;
    const prod = products.find((p) => p.id === Number(newItem.productId));
    if (!prod) return;

    const total = prod.price * newItem.qty;
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku || `SKU-${prod.id}`,
          qty: newItem.qty,
          price: prod.price,
          total: total,
          unitPrice: prod.price,
        },
      ],
    }));
    setNewItem({ productId: "", qty: 1 });
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemQuantity = (index, newQty) => {
    if (newQty < 1) return;

    setForm((prev) => {
      const updatedItems = [...prev.items];
      const item = updatedItems[index];
      item.qty = newQty;
      item.total = item.price * newQty;
      return { ...prev, items: updatedItems };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const { subtotal, tax, shipping, total } = calculateTotal();
      const customer = customers.find((c) => c.id === Number(form.customerId));

      if (!customer) {
        alert("Please select a valid customer");
        return;
      }

      if (form.items.length === 0) {
        alert("Please add at least one item to the order");
        return;
      }

      const orderData = {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || "N/A",
        customerAddress: customer.address || "N/A",
        orderDate: form.orderDate,
        status: form.status,
        items: form.items,
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        total: total,
        notes: form.notes,
        priority: form.priority,
        shippingStatus: "Pending",
        shipmentNo: null,
      };

      if (editingOrder) {
        updateOrder(editingOrder.id, orderData);
      } else {
        addOrder(orderData);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error saving order: " + error.message);
    }
  };

  const handleDelete = () => {
    try {
      deleteOrder(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order: " + error.message);
    }
  };

  const openEdit = (order) => {
    setEditingOrder(order);
    setForm({
      customerId: order.customerId.toString(),
      orderDate: order.orderDate,
      status: order.status,
      items: order.items.map((item) => ({
        ...item,
        sku: item.sku || `SKU-${item.productId}`,
      })),
      notes: order.notes || "",
      priority: order.priority || "Normal",
    });
    setShowForm(true);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const duplicateOrder = (order) => {
    const newOrder = {
      ...order,
      id: Date.now(),
      orderNo: `SO-${String(orders.length + 1001).padStart(4, "0")}`,
      status: "Draft",
      shippingStatus: "Pending",
      shipmentNo: null,
      createdAt: new Date().toISOString(),
    };
    addOrder(newOrder);
    setShowActions(null);
  };

  const handleCreateShipment = (order) => {
    try {
      createShipmentFromOrder(order);
      setShowActions(null);
      alert("Shipment created successfully!");
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("Error creating shipment: " + error.message);
    }
  };

  const handleGenerateInvoice = (order) => {
    try {
      generateInvoice(order);
      setShowActions(null);
      alert("Invoice generated successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Error generating invoice: " + error.message);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    try {
      updateOrder(orderId, { status: newStatus });
      setShowActions(null);
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status: " + error.message);
    }
  };

  // Enhanced filtering with multiple criteria
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" &&
          order.orderDate === new Date().toISOString().split("T")[0]) ||
        (dateFilter === "week" && isDateInLastWeek(order.orderDate)) ||
        (dateFilter === "month" && isDateInLastMonth(order.orderDate));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // Helper functions for date filtering
  const isDateInLastWeek = (dateString) => {
    const date = new Date(dateString);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return date >= oneWeekAgo;
  };

  const isDateInLastMonth = (dateString) => {
    const date = new Date(dateString);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return date >= oneMonthAgo;
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Enhanced stats calculation
  const stats = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter((o) => o.status === "Confirmed").length;
    const shipped = orders.filter(
      (o) => o.shippingStatus === "Shipped" || o.shippingStatus === "In Transit"
    ).length;
    const delivered = orders.filter(
      (o) => o.shippingStatus === "Delivered"
    ).length;
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingShipments = orders.filter(
      (o) => o.shippingStatus === "Pending"
    ).length;

    return {
      total,
      confirmed,
      shipped,
      delivered,
      revenue: totalRevenue,
      pendingShipments,
    };
  }, [orders]);

  const exportCSV = () => {
    const headers = [
      "Order No",
      "Customer",
      "Email",
      "Date",
      "Status",
      "Shipping Status",
      "Items Count",
      "Subtotal",
      "Tax",
      "Shipping",
      "Total",
      "Priority",
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNo,
      o.customerName,
      o.customerEmail || "",
      o.orderDate,
      o.status,
      o.shippingStatus,
      o.items.length,
      o.subtotal || 0,
      o.tax || 0,
      o.shipping || 0,
      o.total || 0,
      o.priority || "Normal",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
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

  const orderSummary = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders by number, customer, or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.confirmed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.shipped}
                </p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.delivered}
                </p>
              </div>
              <Package className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatRevenue(stats.revenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Shipment</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pendingShipments}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setDateFilter("all");
                  setSearchTerm("");
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Order List ({filteredOrders.length} orders)
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredOrders.length} results</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Date",
                    "Items",
                    "Status",
                    "Shipping",
                    "Total",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div
                          className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                          onClick={() => viewOrderDetails(order)}
                        >
                          {order.orderNo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.priority && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                order.priority === "High"
                                  ? "bg-red-100 text-red-800"
                                  : order.priority === "Urgent"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {order.orderDate}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {order.items.length} items
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.reduce(
                          (sum, item) => sum + (item.qty || 0),
                          0
                        )}{" "}
                        units
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShippingStatusColor(
                            order.shippingStatus
                          )}`}
                        >
                          {order.shippingStatus}
                        </span>
                        {order.shippingStatus === "Pending" &&
                          order.status === "Confirmed" && (
                            <button
                              onClick={() => handleCreateShipment(order)}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Create Shipment"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}
                        {order.shipmentNo && (
                          <span
                            className="text-xs text-blue-600"
                            title="Shipment Number"
                          >
                            {order.shipmentNo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatRevenue(order.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRevenue(order.subtotal)} + tax
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(order)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit Order"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!invoices.find(
                            (inv) => inv.orderId === order.id
                          ) && (
                            <button
                              onClick={() => handleGenerateInvoice(order)}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Generate Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* More Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActions(
                                showActions === order.id ? null : order.id
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showActions === order.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => duplicateOrder(order)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate Order
                                </button>
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "Cancelled")
                                  }
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel Order
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(order)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Order
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between text-sm border-t border-gray-200">
            <p className="text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
              {filteredOrders.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Order Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingOrder ? "Edit Order" : "Create New Order"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={form.customerId}
                    onChange={(e) =>
                      setForm({ ...form, customerId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    value={form.orderDate}
                    onChange={(e) =>
                      setForm({ ...form, orderDate: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-3 text-gray-900">Order Items</h4>

                {/* Add Item Form */}
                <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={newItem.productId}
                    onChange={(e) =>
                      setNewItem({ ...newItem, productId: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatRevenue(p.price)} (Stock:{" "}
                        {p.stock || "N/A"})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={
                      products.find((p) => p.id === Number(newItem.productId))
                        ?.stock || 999
                    }
                    value={newItem.qty}
                    onChange={(e) =>
                      setNewItem({ ...newItem, qty: Number(e.target.value) })
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!newItem.productId || newItem.qty < 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {form.items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No items added to this order
                    </div>
                  ) : (
                    form.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {item.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {item.sku}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.qty - 1)
                              }
                              disabled={item.qty <= 1}
                              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.qty + 1)
                              }
                              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm font-medium w-20 text-right">
                            {formatRevenue(item.total)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Order Summary */}
                {form.items.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatRevenue(orderSummary.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (10%):</span>
                        <span>{formatRevenue(orderSummary.tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatRevenue(orderSummary.shipping)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                        <span>Total:</span>
                        <span>{formatRevenue(orderSummary.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any special instructions or notes for this order..."
                />
              </div>

              <div className="flex gap-3 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {editingOrder ? "Update Order" : "Create Order"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Order Details - {selectedOrder.orderNo}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedOrder.customerName}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedOrder.customerEmail}
                    </div>
                    <div>
                      <strong>Address:</strong>{" "}
                      {selectedOrder.customerAddress || "N/A"}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Order Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Order Date:</strong> {selectedOrder.orderDate}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <strong>Shipping:</strong>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getShippingStatusColor(
                          selectedOrder.shippingStatus
                        )}`}
                      >
                        {selectedOrder.shippingStatus}
                      </span>
                    </div>
                    {selectedOrder.priority && (
                      <div>
                        <strong>Priority:</strong> {selectedOrder.priority}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.sku}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">{item.qty}</td>
                          <td className="px-4 py-2 text-right">
                            {formatRevenue(item.price)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatRevenue(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRevenue(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>{formatRevenue(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatRevenue(selectedOrder.shipping || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span>{formatRevenue(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Order Notes
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Related Documents */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Related Documents
                </h4>
                <div className="flex gap-3">
                  {invoices.find((inv) => inv.orderId === selectedOrder.id) ? (
                    <Link
                      to="/sales/invoices"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      View Invoice
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleGenerateInvoice(selectedOrder)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Invoice
                    </button>
                  )}

                  {selectedOrder.shipmentNo ? (
                    <Link
                      to="/sales/shipments"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Truck className="w-4 h-4" />
                      Track Shipment
                    </Link>
                  ) : (
                    selectedOrder.status === "Confirmed" && (
                      <button
                        onClick={() => handleCreateShipment(selectedOrder)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Truck className="w-4 h-4" />
                        Create Shipment
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delete Order?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete order{" "}
              <strong>{deleteConfirm.orderNo}</strong>? This action cannot be
              undone and will remove all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
