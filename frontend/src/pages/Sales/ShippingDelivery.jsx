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
  Truck,
  Package,
  Printer,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Eye,
  MoreVertical,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useSales } from "../../context/SalesContext";

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
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "Shipped":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "In Transit":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const carriers = [
  {
    id: 1,
    name: "UPS",
    rate: 25,
    deliveryTime: "2-3 days",
    phone: "1-800-742-5877",
  },
  {
    id: 2,
    name: "FedEx",
    rate: 28,
    deliveryTime: "1-2 days",
    phone: "1-800-463-3339",
  },
  {
    id: 3,
    name: "DHL",
    rate: 32,
    deliveryTime: "2-4 days",
    phone: "1-800-225-5345",
  },
  {
    id: 4,
    name: "USPS",
    rate: 18,
    deliveryTime: "3-5 days",
    phone: "1-800-275-8777",
  },
  {
    id: 5,
    name: "Amazon Logistics",
    rate: 22,
    deliveryTime: "1-3 days",
    phone: "1-888-280-4331",
  },
];

export default function Shipping() {
  const {
    orders,
    shipments,
    customers,
    loading,
    error,
    createShipmentFromOrder,
    updateShipmentStatus,
    deleteShipment,
  } = useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(null);

  const printRef = useRef();
  const itemsPerPage = 10;

  const initialForm = {
    orderId: "",
    carrierId: "",
    trackingNo: "",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    notes: "",
    insurance: false,
    insuranceValue: "",
    signatureRequired: false,
  };

  const [form, setForm] = useState(initialForm);

  const resetForm = () => {
    setForm(initialForm);
    setEditingShipment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const order = orders.find((o) => o.id === Number(form.orderId));
      const carrier = carriers.find((c) => c.id === Number(form.carrierId));

      if (!order || !carrier) {
        alert("Please select valid order and carrier");
        return;
      }

      const shipmentData = {
        orderId: order.id,
        carrier: carrier.name,
        trackingNo: form.trackingNo,
        weight: Number(form.weight),
        dimensions: form.dimensions,
        cost: carrier.rate,
        notes: form.notes,
        insurance: form.insurance,
        insuranceValue: form.insurance ? Number(form.insuranceValue) : 0,
        signatureRequired: form.signatureRequired,
      };

      if (editingShipment) {
        await updateShipmentStatus(editingShipment.id, shipmentData);
      } else {
        await createShipmentFromOrder({
          ...order,
          ...shipmentData,
          carrierId: carrier.id,
        });
      }

      setShowForm(false);
      resetForm();
      alert(
        `Shipment ${editingShipment ? "updated" : "created"} successfully!`
      );
    } catch (error) {
      console.error("Error saving shipment:", error);
      alert("Error saving shipment: " + error.message);
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await updateShipmentStatus(shipmentId, { status: newStatus });
      alert("Shipment status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteShipment(deleteConfirm.id);
      setDeleteConfirm(null);
      alert("Shipment deleted successfully!");
    } catch (error) {
      console.error("Error deleting shipment:", error);
      alert("Error deleting shipment: " + error.message);
    }
  };

  const openEdit = (shipment) => {
    setEditingShipment(shipment);
    const carrier = carriers.find((c) => c.name === shipment.carrier);
    setForm({
      orderId: shipment.orderId.toString(),
      carrierId: carrier?.id.toString() || "",
      trackingNo: shipment.trackingNo,
      weight: shipment.weight?.toString() || "",
      dimensions: shipment.dimensions || { length: "", width: "", height: "" },
      notes: shipment.notes || "",
      insurance: shipment.insurance || false,
      insuranceValue: shipment.insuranceValue?.toString() || "",
      signatureRequired: shipment.signatureRequired || false,
    });
    setShowForm(true);
  };

  const openPrint = (shipment) => {
    setSelectedShipment(shipment);
    setShowPrint(true);
  };

  const viewDetails = (shipment) => {
    setSelectedShipment(shipment);
    setShowDetails(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Shipping_Label_${selectedShipment?.shipmentNo}`,
  });

  // Enhanced filtering
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const matchesSearch =
        !searchTerm ||
        shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || shipment.status === statusFilter;
      const matchesCarrier =
        carrierFilter === "all" || shipment.carrier === carrierFilter;

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" &&
          shipment.createdAt?.split("T")[0] ===
            new Date().toISOString().split("T")[0]) ||
        (dateFilter === "week" && isDateInLastWeek(shipment.createdAt)) ||
        (dateFilter === "month" && isDateInLastMonth(shipment.createdAt));

      return matchesSearch && matchesStatus && matchesCarrier && matchesDate;
    });
  }, [shipments, searchTerm, statusFilter, carrierFilter, dateFilter]);

  // Helper functions for date filtering
  const isDateInLastWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return date >= oneWeekAgo;
  };

  const isDateInLastMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return date >= oneMonthAgo;
  };

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Shipping statistics
  const shippingStats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === "Delivered").length;
    const inTransit = shipments.filter((s) => s.status === "In Transit").length;
    const pending = shipments.filter((s) => s.status === "Pending").length;
    const totalCost = shipments.reduce((sum, s) => sum + (s.cost || 0), 0);
    const averageDeliveryTime = 2.5; // This would be calculated from actual data

    return {
      total,
      delivered,
      inTransit,
      pending,
      totalCost,
      averageDeliveryTime,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }, [shipments]);

  const exportCSV = () => {
    const headers = [
      "Shipment No",
      "Order No",
      "Customer",
      "Carrier",
      "Tracking No",
      "Status",
      "Weight",
      "Cost",
      "Created Date",
      "Delivery Date",
    ];

    const rows = filteredShipments.map((s) => [
      s.shipmentNo,
      s.orderNo,
      s.customerName,
      s.carrier,
      s.trackingNo,
      s.status,
      s.weight || "N/A",
      s.cost || 0,
      s.createdAt?.split("T")[0] || "N/A",
      s.deliveredAt?.split("T")[0] || "N/A",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Orders eligible for new shipments
  const eligibleOrders = orders.filter(
    (order) =>
      order.status === "Confirmed" &&
      (!order.shipmentNo || !shipments.find((s) => s.orderId === order.id))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading shipments...</p>
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
                  placeholder="Search shipments by number, order, tracking, or customer..."
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
              Shipping & Delivery
            </h1>
            <p className="text-gray-600">
              Manage shipments, track deliveries, and print labels
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
              <Plus className="w-4 h-4" />
              New Shipment
            </button>
          </div>
        </div>

        {/* Shipping Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippingStats.total}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {shippingStats.delivered}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {shippingStats.inTransit}
                </p>
              </div>
              <Truck className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">
                  {shippingStats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatRevenue(shippingStats.totalCost)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-teal-600">
                  {shippingStats.deliveryRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-600" />
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
                <option value="Shipped">Shipped</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Carrier
              </label>
              <select
                value={carrierFilter}
                onChange={(e) => {
                  setCarrierFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Carriers</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.name}>
                    {carrier.name}
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
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setCarrierFilter("all");
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

        {/* Shipments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Shipment List ({filteredShipments.length} shipments)
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredShipments.length} results</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Shipment No",
                    "Order No",
                    "Customer",
                    "Carrier",
                    "Status",
                    "Tracking",
                    "Weight",
                    "Cost",
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
                {paginatedShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => viewDetails(shipment)}
                      >
                        {shipment.shipmentNo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {shipment.createdAt?.split("T")[0] || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {shipment.orderNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.customerName}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-32">
                        {shipment.customerAddress}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {shipment.carrier}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={shipment.status}
                        onChange={(e) =>
                          handleStatusUpdate(shipment.id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs border rounded-full bg-transparent focus:ring-2 focus:ring-blue-500 ${
                          getStatusColor(shipment.status).split(" ")[0]
                        } ${getStatusColor(shipment.status).split(" ")[1]}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-blue-600 font-mono">
                        {shipment.trackingNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {shipment.weight ? `${shipment.weight} lbs` : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatRevenue(shipment.cost)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => viewDetails(shipment)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(shipment)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit Shipment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPrint(shipment)}
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
                                showActions === shipment.id ? null : shipment.id
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showActions === shipment.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      shipment.trackingNo
                                    );
                                    setShowActions(null);
                                    alert(
                                      "Tracking number copied to clipboard!"
                                    );
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Copy Tracking
                                </button>
                                <button
                                  onClick={() => {
                                    const trackingUrl = `https://www.google.com/search?q=${shipment.carrier}+tracking+${shipment.trackingNo}`;
                                    window.open(trackingUrl, "_blank");
                                    setShowActions(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Track Online
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(shipment)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Shipment
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
              {Math.min(currentPage * itemsPerPage, filteredShipments.length)}{" "}
              of {filteredShipments.length}
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

      {/* Shipment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingShipment ? "Edit Shipment" : "Create New Shipment"}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order *
                  </label>
                  <select
                    value={form.orderId}
                    onChange={(e) =>
                      setForm({ ...form, orderId: e.target.value })
                    }
                    required
                    disabled={!!editingShipment}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Select Order</option>
                    {(editingShipment ? orders : eligibleOrders).map(
                      (order) => (
                        <option key={order.id} value={order.id}>
                          {order.orderNo} - {order.customerName} -{" "}
                          {formatRevenue(order.total)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier *
                  </label>
                  <select
                    value={form.carrierId}
                    onChange={(e) =>
                      setForm({ ...form, carrierId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Carrier</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name} - {formatRevenue(carrier.rate)} -{" "}
                        {carrier.deliveryTime}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={form.trackingNo}
                      onChange={(e) =>
                        setForm({ ...form, trackingNo: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (lbs) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="0.0"
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions (inches)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Length"
                      value={form.dimensions.length}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dimensions: {
                            ...form.dimensions,
                            length: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Width"
                      value={form.dimensions.width}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dimensions: {
                            ...form.dimensions,
                            width: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Height"
                      value={form.dimensions.height}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dimensions: {
                            ...form.dimensions,
                            height: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.insurance}
                      onChange={(e) =>
                        setForm({ ...form, insurance: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Add Insurance
                    </span>
                  </label>

                  {form.insurance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Value
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.insuranceValue}
                        onChange={(e) =>
                          setForm({ ...form, insuranceValue: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.signatureRequired}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          signatureRequired: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Signature Required
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    placeholder="Additional notes or instructions"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingShipment ? "Update Shipment" : "Create Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Label Modal */}
      {showPrint && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Print Shipping Label</h3>
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
                  <h4 className="text-xl font-bold">SHIPPING LABEL</h4>
                  <p className="text-sm text-gray-600">
                    {selectedShipment.shipmentNo}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">From:</span>
                    <span>Your Company Name</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">To:</span>
                    <span className="text-right">
                      {selectedShipment.customerName}
                      <br />
                      {selectedShipment.customerAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Carrier:</span>
                    <span>{selectedShipment.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tracking:</span>
                    <span className="font-mono">
                      {selectedShipment.trackingNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Weight:</span>
                    <span>{selectedShipment.weight} lbs</span>
                  </div>
                  {selectedShipment.signatureRequired && (
                    <div className="text-center border-t pt-2 mt-2">
                      <span className="font-bold text-red-600">
                        SIGNATURE REQUIRED
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t text-center">
                  <div className="text-xs text-gray-500">
                    Generated on {new Date().toLocaleDateString()}
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

      {/* Shipment Details Modal */}
      {showDetails && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Shipment Details</h3>
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
                    Shipment Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipment No:</span>
                      <span className="font-medium">
                        {selectedShipment.shipmentNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order No:</span>
                      <span className="font-medium">
                        {selectedShipment.orderNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          selectedShipment.status
                        )}`}
                      >
                        {selectedShipment.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier:</span>
                      <span className="font-medium">
                        {selectedShipment.carrier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking No:</span>
                      <span className="font-medium font-mono">
                        {selectedShipment.trackingNo}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Shipping Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">
                        {selectedShipment.weight || "N/A"} lbs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Cost:</span>
                      <span className="font-medium">
                        {formatRevenue(selectedShipment.cost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance:</span>
                      <span className="font-medium">
                        {selectedShipment.insurance
                          ? formatRevenue(selectedShipment.insuranceValue)
                          : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signature Required:</span>
                      <span className="font-medium">
                        {selectedShipment.signatureRequired ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {selectedShipment.createdAt
                          ? new Date(
                              selectedShipment.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-4">
                  Customer Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedShipment.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium text-right">
                      {selectedShipment.customerAddress}
                    </span>
                  </div>
                </div>
              </div>

              {selectedShipment.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600">{selectedShipment.notes}</p>
                </div>
              )}

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
                    openEdit(selectedShipment);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Edit Shipment
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openPrint(selectedShipment);
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
                    Delete Shipment
                  </h3>
                  <p className="text-gray-600">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete shipment{" "}
                  <strong>{deleteConfirm.shipmentNo}</strong>? This will remove
                  all shipment data permanently.
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
                  onClick={handleDelete}
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
