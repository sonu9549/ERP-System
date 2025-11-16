import { useState, useMemo, useRef } from "react";
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
  Package,
  Printer,
  RotateCcw,
  Eye,
  MoreVertical,
  Filter,
  BarChart3,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Truck,
  Mail,
  Copy,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useSales } from "../../context/SalesContext";

const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

const returnReasons = [
  "Defective Product",
  "Wrong Item Shipped",
  "Not as Described",
  "Changed Mind",
  "Arrived Damaged",
  "Arrived Late",
  "Size/Color Issue",
  "Better Price Found",
  "Duplicate Order",
  "Other",
];

const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Approved":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Processing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Refunded":
      return "bg-green-100 text-green-800 border-green-200";
    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "Exchange":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function Returns() {
  const {
    orders,
    returns,
    customers,
    loading,
    error,
    createReturn,
    updateReturnStatus,
    deleteReturn,
    processRefund,
  } = useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(null);
  const [showRefund, setShowRefund] = useState(null);

  const printRef = useRef();
  const itemsPerPage = 10;

  // Form state
  const initialForm = {
    orderId: "",
    items: [],
    reason: "",
    notes: "",
    refundAmount: 0,
    returnType: "refund", // refund or exchange
    exchangeProductId: "",
    condition: "unopened", // unopened, opened, damaged
  };
  const [form, setForm] = useState(initialForm);
  const [selectedItems, setSelectedItems] = useState({});

  const resetForm = () => {
    setForm(initialForm);
    setSelectedItems({});
    setEditingReturn(null);
  };

  // Get eligible orders (Delivered only)
  const eligibleOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "Delivered" &&
        !returns.find((r) => r.orderId === o.id && r.status !== "Rejected")
    );
  }, [orders, returns]);

  // Handle item selection
  const toggleItem = (itemIndex) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemIndex]: !prev[itemIndex],
    }));
  };

  // Calculate refund
  const calculateRefund = () => {
    if (!form.orderId) return 0;
    const order = orders.find((o) => o.id === Number(form.orderId));
    return Object.keys(selectedItems)
      .filter((k) => selectedItems[k])
      .reduce((sum, idx) => sum + order.items[idx].total, 0);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedIndices = Object.keys(selectedItems).filter(
        (k) => selectedItems[k]
      );
      if (selectedIndices.length === 0) {
        alert("Please select at least one item");
        return;
      }

      const order = orders.find((o) => o.id === Number(form.orderId));
      const returnItems = selectedIndices.map((idx) => ({
        ...order.items[idx],
      }));

      const refundAmount = calculateRefund();

      const returnData = {
        orderId: order.id,
        orderNo: order.orderNo,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        items: returnItems,
        reason: form.reason,
        notes: form.notes,
        refundAmount,
        returnType: form.returnType,
        condition: form.condition,
        exchangeProductId: form.exchangeProductId || null,
      };

      if (editingReturn) {
        await updateReturnStatus(editingReturn.id, {
          ...returnData,
          status: editingReturn.status,
        });
      } else {
        await createReturn(returnData);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving return:", error);
      alert("Error saving return: " + error.message);
    }
  };

  // Open edit
  const openEdit = (ret) => {
    setEditingReturn(ret);
    const order = orders.find((o) => o.id === ret.orderId);
    const itemMap = {};
    ret.items.forEach((it, i) => {
      const origIdx = order.items.findIndex(
        (oi) => oi.productId === it.productId && oi.qty === it.qty
      );
      if (origIdx !== -1) itemMap[origIdx] = true;
    });
    setSelectedItems(itemMap);
    setForm({
      orderId: ret.orderId,
      reason: ret.reason,
      notes: ret.notes || "",
      refundAmount: ret.refundAmount,
      returnType: ret.returnType || "refund",
      condition: ret.condition || "unopened",
      exchangeProductId: ret.exchangeProductId || "",
    });
    setShowForm(true);
  };

  // Print label
  const openPrint = (ret) => {
    setSelectedReturn(ret);
    setShowPrint(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Return_Label_${selectedReturn?.returnNo}`,
  });

  // View details
  const viewDetails = (ret) => {
    setSelectedReturn(ret);
    setShowDetails(true);
  };

  // Handle status update
  const handleStatusUpdate = async (returnId, newStatus) => {
    try {
      await updateReturnStatus(returnId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
    }
  };

  // Handle refund processing
  const handleRefund = async (returnId, refundData) => {
    try {
      await processRefund(returnId, refundData);
      setShowRefund(null);
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Error processing refund: " + error.message);
    }
  };

  // Enhanced filtering
  const filteredReturns = useMemo(() => {
    return returns.filter((ret) => {
      const matchesSearch =
        ret.returnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ret.status === statusFilter;
      const matchesReason =
        reasonFilter === "all" || ret.reason === reasonFilter;

      const returnDate = new Date(ret.createdAt);
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && isToday(returnDate)) ||
        (dateFilter === "week" && isThisWeek(returnDate)) ||
        (dateFilter === "month" && isThisMonth(returnDate));

      return matchesSearch && matchesStatus && matchesReason && matchesDate;
    });
  }, [returns, searchTerm, statusFilter, reasonFilter, dateFilter]);

  // Date helper functions
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date) => {
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    return date >= startOfWeek;
  };

  const isThisMonth = (date) => {
    const today = new Date();
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = filteredReturns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Returns statistics
  const returnStats = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter((r) => r.status === "Pending").length;
    const approved = returns.filter((r) => r.status === "Approved").length;
    const refunded = returns.filter((r) => r.status === "Refunded").length;
    const rejected = returns.filter((r) => r.status === "Rejected").length;
    const totalRefundAmount = returns.reduce(
      (sum, r) => sum + r.refundAmount,
      0
    );
    const avgRefund = total > 0 ? totalRefundAmount / total : 0;
    const returnRate = orders.length > 0 ? (total / orders.length) * 100 : 0;

    return {
      total,
      pending,
      approved,
      refunded,
      rejected,
      totalRefundAmount,
      avgRefund,
      returnRate,
    };
  }, [returns, orders]);

  // Export functionality
  const exportCSV = () => {
    const headers = [
      "Return No",
      "Order No",
      "Customer",
      "Reason",
      "Status",
      "Refund Amount",
      "Return Type",
      "Condition",
      "Created Date",
    ];

    const rows = filteredReturns.map((r) => [
      r.returnNo,
      r.orderNo,
      r.customerName,
      r.reason,
      r.status,
      r.refundAmount,
      r.returnType || "refund",
      r.condition || "unopened",
      r.createdAt?.split("T")[0] || "N/A",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `returns_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading returns...</p>
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search returns by number, order, or customer..."
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
            <h1 className="text-2xl font-bold text-gray-900">
              Returns Management
            </h1>
            <p className="text-gray-600">
              Process customer returns, refunds, and exchanges
            </p>
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
              <RotateCcw className="w-4 h-4" />
              New Return
            </button>
          </div>
        </div>

        {/* Returns Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {returnStats.total}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {returnStats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {returnStats.approved}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-green-600">
                  {returnStats.refunded}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatRevenue(returnStats.totalRefundAmount)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Return Rate</p>
                <p className="text-2xl font-bold text-teal-600">
                  {returnStats.returnRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-teal-600" />
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Processing">Processing</option>
                <option value="Refunded">Refunded</option>
                <option value="Rejected">Rejected</option>
                <option value="Exchange">Exchange</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Reason
              </label>
              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reasons</option>
                {returnReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
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
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setReasonFilter("all");
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

        {/* Returns Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Returns List ({filteredReturns.length} returns)
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredReturns.length} results</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Return No",
                    "Order No",
                    "Customer",
                    "Reason",
                    "Status",
                    "Refund",
                    "Type",
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
                {paginatedReturns.map((ret) => (
                  <tr
                    key={ret.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => viewDetails(ret)}
                      >
                        {ret.returnNo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ret.createdAt?.split("T")[0] || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {ret.orderNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {ret.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ret.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ret.reason}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ret.status}
                        onChange={(e) =>
                          handleStatusUpdate(ret.id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs border rounded-full bg-transparent focus:ring-2 focus:ring-blue-500 ${
                          getStatusColor(ret.status).split(" ")[0]
                        } ${getStatusColor(ret.status).split(" ")[1]}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Processing">Processing</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Exchange">Exchange</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatRevenue(ret.refundAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                      {ret.returnType || "refund"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => viewDetails(ret)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(ret)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit Return"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPrint(ret)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Print Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>

                        {/* More Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActions(
                                showActions === ret.id ? null : ret.id
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showActions === ret.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(ret.returnNo);
                                    setShowActions(null);
                                    alert("Return number copied to clipboard!");
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Return No
                                </button>
                                {ret.status === "Approved" && (
                                  <button
                                    onClick={() => setShowRefund(ret)}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    Process Refund
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const emailSubject = `Return ${ret.returnNo} - Status Update`;
                                    const emailBody = `Dear ${
                                      ret.customerName
                                    },\n\nYour return ${
                                      ret.returnNo
                                    } is currently ${
                                      ret.status
                                    }.\n\nRefund Amount: ${formatRevenue(
                                      ret.refundAmount
                                    )}\n\nThank you!`;
                                    window.open(
                                      `mailto:${
                                        ret.customerEmail
                                      }?subject=${encodeURIComponent(
                                        emailSubject
                                      )}&body=${encodeURIComponent(emailBody)}`
                                    );
                                    setShowActions(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send Email
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(ret)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Return
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
              {Math.min(currentPage * itemsPerPage, filteredReturns.length)} of{" "}
              {filteredReturns.length}
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

      {/* Return Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingReturn ? "Edit Return" : "Create New Return"}
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
              <div className="space-y-6">
                {/* Order Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Order *
                  </label>
                  <select
                    value={form.orderId}
                    onChange={(e) => {
                      setForm({ ...form, orderId: e.target.value });
                      setSelectedItems({});
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">
                      Select Order (Delivered orders only)
                    </option>
                    {eligibleOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNo} - {order.customerName} -{" "}
                        {formatRevenue(order.total)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only delivered orders without active returns are shown
                  </p>
                </div>

                {form.orderId && (
                  <>
                    {/* Items Selection */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">
                        Select Items to Return *
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {orders
                          .find((o) => o.id === Number(form.orderId))
                          ?.items.map((item, idx) => (
                            <label
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedItems[idx] || false}
                                  onChange={() => toggleItem(idx)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {item.productName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Qty: {item.qty} ×{" "}
                                    {formatRevenue(item.price)} ={" "}
                                    {formatRevenue(item.total)}
                                  </p>
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Return Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Return Type *
                        </label>
                        <select
                          value={form.returnType}
                          onChange={(e) =>
                            setForm({ ...form, returnType: e.target.value })
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="refund">Refund</option>
                          <option value="exchange">Exchange</option>
                          <option value="store_credit">Store Credit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Condition *
                        </label>
                        <select
                          value={form.condition}
                          onChange={(e) =>
                            setForm({ ...form, condition: e.target.value })
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="unopened">Unopened</option>
                          <option value="opened">Opened</option>
                          <option value="used">Used</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Return *
                      </label>
                      <select
                        value={form.reason}
                        onChange={(e) =>
                          setForm({ ...form, reason: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Reason</option>
                        {returnReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        placeholder="Enter any additional notes or details about the return..."
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Refund Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Refund Summary
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selected Items:</span>
                          <span>
                            {
                              Object.keys(selectedItems).filter(
                                (k) => selectedItems[k]
                              ).length
                            }{" "}
                            items
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Refund Amount:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatRevenue(calculateRefund())}
                          </span>
                        </div>
                        {form.returnType === "exchange" && (
                          <p className="text-blue-600 text-sm">
                            Customer will receive an exchange instead of refund
                          </p>
                        )}
                        {form.returnType === "store_credit" && (
                          <p className="text-purple-600 text-sm">
                            Customer will receive store credit
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    Object.keys(selectedItems).filter((k) => selectedItems[k])
                      .length === 0
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingReturn ? "Update Return" : "Create Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Label Modal */}
      {showPrint && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Print Return Label</h3>
                <button
                  onClick={() => setShowPrint(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div
                ref={printRef}
                className="bg-white p-6 border-2 border-dashed border-gray-300"
              >
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold">RETURN LABEL</h4>
                  <p className="text-sm text-gray-600">
                    #{selectedReturn.returnNo}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">From:</span>
                    <span className="text-right">
                      {selectedReturn.customerName}
                      <br />
                      {selectedReturn.customerAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">To:</span>
                    <span>Your Company Returns Dept</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Order:</span>
                    <span>{selectedReturn.orderNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Items:</span>
                    <span className="text-right">
                      {selectedReturn.items
                        .map((item) => item.productName)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Reason:</span>
                    <span>{selectedReturn.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Refund:</span>
                    <span className="font-bold">
                      {formatRevenue(selectedReturn.refundAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-center">
                  <div className="text-xs text-gray-500">
                    Generated on {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Please include this label with your return package
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPrint(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {showDetails && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Return Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Return Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return No:</span>
                      <span className="font-medium">
                        {selectedReturn.returnNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order No:</span>
                      <span className="font-medium">
                        {selectedReturn.orderNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          selectedReturn.status
                        )}`}
                      >
                        {selectedReturn.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return Type:</span>
                      <span className="font-medium capitalize">
                        {selectedReturn.returnType || "refund"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condition:</span>
                      <span className="font-medium capitalize">
                        {selectedReturn.condition || "unopened"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedReturn.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {selectedReturn.customerEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedReturn.customerAddress}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Return Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Product
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReturn.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {formatRevenue(item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                            {formatRevenue(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Reason & Notes
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span>{" "}
                      {selectedReturn.reason}
                    </p>
                    {selectedReturn.notes && (
                      <p className="text-sm">
                        <span className="font-medium">Notes:</span>{" "}
                        {selectedReturn.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Refund Summary
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{selectedReturn.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Refund Amount:</span>
                      <span className="font-bold text-green-600">
                        {formatRevenue(selectedReturn.refundAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>
                        {selectedReturn.createdAt?.split("T")[0] || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openEdit(selectedReturn);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Edit Return
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openPrint(selectedReturn);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {showRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Process Refund</h3>
                <button
                  onClick={() => setShowRefund(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Return: {showRefund.returnNo}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    Refund Amount: {formatRevenue(showRefund.refundAmount)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Method
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="original">Original Payment Method</option>
                    <option value="store_credit">Store Credit</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter transaction reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any notes about this refund..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    handleRefund(showRefund.id, {
                      method: "original",
                      amount: showRefund.refundAmount,
                    })
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Process Refund
                </button>
                <button
                  onClick={() => setShowRefund(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Return
                  </h3>
                  <p className="text-gray-600">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete return{" "}
                  <strong>{deleteConfirm.returnNo}</strong>? This will remove
                  all return data permanently.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteReturn(deleteConfirm.id);
                      setDeleteConfirm(null);
                    } catch (error) {
                      console.error("Error deleting return:", error);
                      alert("Error deleting return: " + error.message);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
