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
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useSales } from "../../context/SalesContext";
import { carriers } from "../../data/salesData";

const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

export default function Shipping() {
  const { orders, shipments, setShipments, setOrders, updateShipmentStatus } =
    useSales();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const printRef = useRef();

  const itemsPerPage = 10;

  const initialForm = {
    orderId: "",
    carrierId: "",
    trackingNo: "",
    weight: "",
    notes: "",
  };
  const [form, setForm] = useState(initialForm);

  const resetForm = () => {
    setForm(initialForm);
    setEditingShipment(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === Number(form.orderId));
    const carrier = carriers.find((c) => c.id === Number(form.carrierId));
    const newShipment = {
      id: editingShipment?.id || Date.now(),
      shipmentNo:
        editingShipment?.shipmentNo ||
        `SH-${String(shipments.length + 1001).padStart(4, "0")}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      carrier: carrier.name,
      trackingNo: form.trackingNo,
      status: "Pending",
      weight: Number(form.weight),
      cost: carrier.rate,
      notes: form.notes,
    };

    if (editingShipment) {
      setShipments((prev) =>
        prev.map((s) => (s.id === editingShipment.id ? newShipment : s))
      );
    } else {
      setShipments((prev) => [...prev, newShipment]);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                shippingStatus: "Shipped",
                shipmentNo: newShipment.shipmentNo,
              }
            : o
        )
      );
    }
    setShowForm(false);
    resetForm();
  };

  const updateStatus = (shipmentId, newStatus) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, status: newStatus } : s))
    );
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (shipment?.orderId) {
      const statusMap = {
        Pending: "Pending",
        Shipped: "Shipped",
        "In Transit": "In Transit",
        Delivered: "Delivered",
        Cancelled: "Cancelled",
      };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === shipment.orderId
            ? { ...o, shippingStatus: statusMap[newStatus] }
            : o
        )
      );
    }
  };

  const openEdit = (shipment) => {
    setEditingShipment(shipment);
    setForm({
      orderId: shipment.orderId,
      carrierId: carriers.find((c) => c.name === shipment.carrier)?.id || "",
      trackingNo: shipment.trackingNo,
      weight: shipment.weight.toString(),
      notes: shipment.notes,
    });
    setShowForm(true);
  };

  const openPrint = (shipment) => {
    setEditingShipment(shipment);
    setShowPrint(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () =>
      editingShipment ? Promise.resolve() : Promise.reject(),
  });

  const filtered = useMemo(
    () =>
      shipments.filter(
        (s) =>
          (s.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (statusFilter === "All" || s.status === statusFilter)
      ),
    [shipments, searchTerm, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = [
      "Shipment No",
      "Order No",
      "Customer",
      "Carrier",
      "Status",
      "Cost",
    ];
    const rows = filtered.map((s) => [
      s.shipmentNo,
      s.orderNo,
      s.customerName,
      s.carrier,
      s.status,
      s.cost,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipments.csv";
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shipping & Delivery
          </h1>
          <p className="text-gray-600">Track shipments and update status</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-3">
          <input
            type="text"
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 border rounded-lg w-full max-w-md"
          />
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Shipped</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
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
                  "Cost",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                    {s.shipmentNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {s.orderNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {s.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {s.carrier}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      onChange={(e) => updateStatus(s.id, e.target.value)}
                      className="px-2 py-1 text-xs border rounded-full bg-transparent"
                    >
                      <option>Pending</option>
                      <option>Shipped</option>
                      <option>In Transit</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600 cursor-pointer hover:underline">
                    {s.trackingNo}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatRevenue(s.cost)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(s)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPrint(s)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-gray-50 flex justify-between text-sm">
          <p>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrint && editingShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">Shipping Label</h3>
              <button onClick={() => setShowPrint(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={printRef} className="p-4 border text-sm">
              <h1 className="text-xl font-bold text-center">SHIPPING LABEL</h1>
              <p className="text-center text-gray-600">
                #{editingShipment.shipmentNo}
              </p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong>To:</strong> {editingShipment.customerName}
                </p>
                <p>{editingShipment.customerAddress}</p>
                <p>
                  <strong>Carrier:</strong> {editingShipment.carrier}
                </p>
                <p>
                  <strong>Tracking:</strong> {editingShipment.trackingNo}
                </p>
                <p>
                  <strong>Weight:</strong> {editingShipment.weight} lbs
                </p>
                {editingShipment.notes && (
                  <p>
                    <strong>Notes:</strong> {editingShipment.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => setShowPrint(false)}
                className="flex-1 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingShipment ? "Edit" : "Create"} Shipment
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Order</option>
                {orders
                  .filter(
                    (o) =>
                      o.shippingStatus === "Pending" ||
                      o.shippingStatus === "Shipped"
                  )
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} - {o.customerName}
                    </option>
                  ))}
              </select>
              <select
                value={form.carrierId}
                onChange={(e) =>
                  setForm({ ...form, carrierId: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Carrier</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (${c.rate})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tracking No"
                value={form.trackingNo}
                onChange={(e) =>
                  setForm({ ...form, trackingNo: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Weight (lbs)"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg h-20"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delete Shipment?</h3>
            <p className="text-gray-600 mb-4">
              Delete <strong>{deleteConfirm.shipmentNo}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShipments((prev) =>
                    prev.filter((s) => s.id !== deleteConfirm.id)
                  );
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
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
