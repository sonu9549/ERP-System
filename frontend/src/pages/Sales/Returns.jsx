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
  "Defective",
  "Wrong Item",
  "Not as Described",
  "Changed Mind",
  "Arrived Late",
  "Other",
];

export default function Returns() {
  const { orders, returns, setReturns, createReturn, updateReturnStatus } =
    useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const printRef = useRef();

  const itemsPerPage = 10;

  // Form state
  const initialForm = {
    orderId: "",
    items: [],
    reason: "",
    notes: "",
    refundAmount: 0,
  };
  const [form, setForm] = useState(initialForm);
  const [selectedItems, setSelectedItems] = useState({});

  const resetForm = () => {
    setForm(initialForm);
    setSelectedItems({});
    setEditingReturn(null);
  };

  // === Get eligible orders (Delivered only) ===
  const eligibleOrders = useMemo(() => {
    return orders.filter(
      (o) => o.shippingStatus === "Delivered" && !o.returnStatus
    );
  }, [orders]);

  // === Handle item selection ===
  const toggleItem = (itemIndex) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemIndex]: !prev[itemIndex],
    }));
  };

  // === Calculate refund ===
  const calculateRefund = () => {
    if (!form.orderId) return 0;
    const order = orders.find((o) => o.id === Number(form.orderId));
    return Object.keys(selectedItems)
      .filter((k) => selectedItems[k])
      .reduce((sum, idx) => sum + order.items[idx].total, 0);
  };

  // === Submit ===
  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedIndices = Object.keys(selectedItems).filter(
      (k) => selectedItems[k]
    );
    if (selectedIndices.length === 0) return alert("Select at least one item");

    const order = orders.find((o) => o.id === Number(form.orderId));
    const returnItems = selectedIndices.map((idx) => ({
      ...order.items[idx],
    }));

    const refundAmount = calculateRefund();

    const returnData = {
      orderId: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      items: returnItems,
      reason: form.reason,
      notes: form.notes,
      refundAmount,
    };

    if (editingReturn) {
      setReturns((prev) =>
        prev.map((r) =>
          r.id === editingReturn.id
            ? { ...r, ...returnData, status: r.status }
            : r
        )
      );
    } else {
      createReturn(returnData);
    }

    setShowForm(false);
    resetForm();
  };

  // === Open Edit ===
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
      notes: ret.notes,
      refundAmount: ret.refundAmount,
    });
    setShowForm(true);
  };

  // === Print Label ===
  const openPrint = (ret) => {
    setEditingReturn(ret);
    setShowPrint(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  // === Filter & Paginate ===
  const filtered = useMemo(() => {
    return returns.filter(
      (r) =>
        (r.returnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.customerName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "All" || r.status === statusFilter)
    );
  }, [returns, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // === Export CSV ===
  const exportCSV = () => {
    const headers = [
      "Return No",
      "Order No",
      "Customer",
      "Reason",
      "Status",
      "Refund",
    ];
    const rows = filtered.map((r) => [
      r.returnNo,
      r.orderNo,
      r.customerName,
      r.reason,
      r.status,
      formatRevenue(r.refundAmount),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "returns.csv";
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Returns Management
          </h1>
          <p className="text-gray-600">Process customer returns and refunds</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RotateCcw className="w-4 h-4" /> New Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Total Returns</p>
          <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {returns.filter((r) => r.status === "Pending").length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Refunded</p>
          <p className="text-2xl font-bold text-green-600">
            {formatRevenue(
              returns
                .filter((r) => r.status === "Refunded")
                .reduce((s, r) => s + r.refundAmount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border rounded-lg"
            />
          </div>
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
              <option>Processing</option>
              <option>Refunded</option>
              <option>Rejected</option>
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
                  "Return No",
                  "Order",
                  "Customer",
                  "Reason",
                  "Status",
                  "Refund",
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
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                    {r.returnNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {r.orderNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {r.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {r.reason}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateReturnStatus(r.id, e.target.value)}
                      className="px-2 py-1 text-xs border rounded-full bg-transparent"
                    >
                      <option>Pending</option>
                      <option>Processing</option>
                      <option>Refunded</option>
                      <option>Rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatRevenue(r.refundAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(r)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPrint(r)}
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

        {/* Pagination */}
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

      {/* === Form Modal === */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingReturn ? "Edit" : "Create"} Return
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={form.orderId}
                onChange={(e) => {
                  setForm({ ...form, orderId: e.target.value });
                  setSelectedItems({});
                }}
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Order (Delivered only)</option>
                {eligibleOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} - {o.customerName} (${formatRevenue(o.total)})
                  </option>
                ))}
              </select>

              {form.orderId && (
                <>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Select Items to Return</h4>
                    <div className="space-y-2">
                      {orders
                        .find((o) => o.id === Number(form.orderId))
                        ?.items.map((item, idx) => (
                          <label
                            key={idx}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedItems[idx] || false}
                                onChange={() => toggleItem(idx)}
                              />
                              <span>
                                {item.productName} × {item.qty} = ${item.total}
                              </span>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>

                  <select
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Reason</option>
                    {returnReasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <textarea
                    placeholder="Notes (optional)"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg h-20"
                  />

                  <div className="bg-blue-50 p-4 rounded-lg text-right">
                    <p className="text-lg font-bold">
                      Refund Amount: {formatRevenue(calculateRefund())}
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />{" "}
                  {editingReturn ? "Update" : "Create"} Return
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

      {/* === Print Modal === */}
      {showPrint && editingReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">Return Label</h3>
              <button onClick={() => setShowPrint(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={printRef} className="p-4 border text-sm space-y-2">
              <h1 className="text-xl font-bold text-center">RETURN LABEL</h1>
              <p className="text-center">#{editingReturn.returnNo}</p>
              <p>
                <strong>From:</strong> {editingReturn.customerName}
              </p>
              <p>
                <strong>Return Items:</strong>{" "}
                {editingReturn.items.map((i) => i.productName).join(", ")}
              </p>
              <p>
                <strong>Reason:</strong> {editingReturn.reason}
              </p>
              <p>
                <strong>Refund:</strong>{" "}
                {formatRevenue(editingReturn.refundAmount)}
              </p>
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

      {/* === Delete Confirm === */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delete Return?</h3>
            <p className="text-gray-600 mb-4">
              Delete <strong>{deleteConfirm.returnNo}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReturns((prev) =>
                    prev.filter((r) => r.id !== deleteConfirm.id)
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
