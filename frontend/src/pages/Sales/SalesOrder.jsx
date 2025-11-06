import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useSales } from "../../context/SalesContext";

const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

const customers = [
  {
    id: 1,
    name: "Acme Corp",
    email: "contact@acme.com",
    address: "123 Main St, NY",
  },
  {
    id: 2,
    name: "Beta Systems",
    email: "info@betasys.com",
    address: "456 Tech Ave, CA",
  },
  {
    id: 3,
    name: "Gamma Tech",
    email: "sales@gamma.tech",
    address: "789 Innovate Rd, TX",
  },
];

const products = [
  { id: 1, name: "Laptop Pro", price: 1299 },
  { id: 2, name: "Wireless Mouse", price: 49 },
  { id: 3, name: "USB-C Hub", price: 89 },
  { id: 4, name: 'Monitor 27"', price: 399 },
];

const generateOrders = () => [
  {
    id: 1,
    orderNo: "SO-1001",
    customerId: 1,
    customerName: "Acme Corp",
    orderDate: "2025-03-15",
    status: "Confirmed",
    items: [
      {
        productId: 1,
        productName: "Laptop Pro",
        qty: 2,
        price: 1299,
        total: 2598,
      },
      {
        productId: 2,
        productName: "Wireless Mouse",
        qty: 5,
        price: 49,
        total: 245,
      },
    ],
    subtotal: 2843,
    tax: 284.3,
    total: 3127.3,
    shippingStatus: "Pending",
    shipmentNo: null,
  },
  ...Array.from({ length: 18 }, (_, i) => {
    const cust = customers[Math.floor(Math.random() * customers.length)];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items = Array.from({ length: itemCount }, () => {
      const prod = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      return {
        productId: prod.id,
        productName: prod.name,
        qty,
        price: prod.price,
        total: qty * prod.price,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const tax = subtotal * 0.1;
    const hasShipment = Math.random() > 0.5;
    return {
      id: i + 2,
      orderNo: `SO-${String(1002 + i).padStart(4, "0")}`,
      customerId: cust.id,
      customerName: cust.name,
      orderDate: `2025-${String(Math.floor(Math.random() * 3) + 1).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      status: ["Draft", "Confirmed", "Shipped", "Cancelled"][
        Math.floor(Math.random() * 4)
      ],
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      shippingStatus: hasShipment
        ? ["Shipped", "In Transit", "Delivered"][Math.floor(Math.random() * 3)]
        : "Pending",
      shipmentNo: hasShipment
        ? `SH-${String(1002 + i).padStart(4, "0")}`
        : null,
    };
  }),
];

export default function SalesOrder() {
  const { orders, setOrders, createShipmentFromOrder } = useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const itemsPerPage = 10;

  const initialForm = {
    customerId: "",
    orderDate: new Date().toISOString().split("T")[0],
    status: "Draft",
    items: [],
  };
  const [form, setForm] = useState(initialForm);
  const [newItem, setNewItem] = useState({ productId: "", qty: 1 });

  const resetForm = () => {
    setForm(initialForm);
    setNewItem({ productId: "", qty: 1 });
    setEditingOrder(null);
  };

  const calculateTotal = () => {
    const subtotal = form.items.reduce((s, i) => s + i.total, 0);
    const tax = subtotal * 0.1;
    return { subtotal, tax, total: subtotal + tax };
  };

  const addItem = () => {
    if (!newItem.productId) return;
    const prod = products.find((p) => p.id === Number(newItem.productId));
    const total = prod.price * newItem.qty;
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: prod.id,
          productName: prod.name,
          qty: newItem.qty,
          price: prod.price,
          total,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const { subtotal, tax, total } = calculateTotal();
    const customer = customers.find((c) => c.id === Number(form.customerId));
    const orderData = {
      customerId: customer.id,
      customerName: customer.name,
      orderDate: form.orderDate,
      status: form.status,
      items: form.items,
      subtotal,
      tax,
      total,
      shippingStatus: "Pending",
      shipmentNo: null,
    };

    if (editingOrder) {
      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? { ...o, ...orderData } : o))
      );
    } else {
      const newOrder = {
        id: Math.max(...orders.map((o) => o.id), 0) + 1,
        orderNo: `SO-${String(1000 + orders.length + 1).padStart(4, "0")}`,
        ...orderData,
      };
      setOrders((prev) => [...prev, newOrder]);
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = () => {
    setOrders((prev) => prev.filter((o) => o.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const openEdit = (order) => {
    setEditingOrder(order);
    setForm({
      customerId: order.customerId,
      orderDate: order.orderDate,
      status: order.status,
      items: order.items,
    });
    setShowForm(true);
  };

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (statusFilter === "All" || o.status === statusFilter)
      ),
    [orders, searchTerm, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = [
      "Order No",
      "Customer",
      "Date",
      "Status",
      "Shipping",
      "Total",
    ];
    const rows = filtered.map((o) => [
      o.orderNo,
      o.customerName,
      o.orderDate,
      o.status,
      o.shippingStatus,
      o.total,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-orders.csv";
    a.click();
  };

  const stats = useMemo(() => {
    const confirmed = orders.filter((o) => o.status === "Confirmed").length;
    const shipped = orders.filter((o) => o.shippingStatus === "Shipped").length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    return { total: orders.length, confirmed, shipped, revenue: totalRevenue };
  }, [orders]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Shipped</p>
          <p className="text-2xl font-bold text-blue-600">{stats.shipped}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatRevenue(stats.revenue)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
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
              <option>Draft</option>
              <option>Confirmed</option>
              <option>Shipped</option>
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
                  "Order No",
                  "Customer",
                  "Date",
                  "Status",
                  "Shipping",
                  "Total",
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
              {paginated.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                    {o.orderNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {o.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {o.orderDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        o.status === "Confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : o.status === "Shipped"
                          ? "bg-green-100 text-green-800"
                          : o.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          o.shippingStatus === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : o.shippingStatus === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : o.shippingStatus === "In Transit"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {o.shippingStatus}
                      </span>
                      {o.shippingStatus === "Pending" && (
                        <button
                          onClick={() => createShipmentFromOrder(o)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {o.shipmentNo && (
                        <span className="text-xs text-blue-600">
                          ({o.shipmentNo})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatRevenue(o.total)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(o)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(o)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingOrder ? "Edit" : "Create"} Order
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({ ...form, customerId: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.orderDate}
                  onChange={(e) =>
                    setForm({ ...form, orderDate: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Line Items</h4>
                <div className="flex gap-2 mb-3">
                  <select
                    value={newItem.productId}
                    onChange={(e) =>
                      setNewItem({ ...newItem, productId: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${p.price}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={newItem.qty}
                    onChange={(e) =>
                      setNewItem({ ...newItem, qty: Number(e.target.value) })
                    }
                    className="w-20 px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between bg-gray-50 p-2 rounded text-sm"
                    >
                      <span>
                        {item.productName} × {item.qty} = ${item.total}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <p>Subtotal: {formatRevenue(calculateTotal().subtotal)}</p>
                  <p>Tax (10%): {formatRevenue(calculateTotal().tax)}</p>
                  <p className="font-bold text-lg">
                    Total: {formatRevenue(calculateTotal().total)}
                  </p>
                </div>
              </div>

              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              >
                <option>Draft</option>
                <option>Confirmed</option>
                <option>Shipped</option>
                <option>Cancelled</option>
              </select>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" /> Save Order
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
            <h3 className="text-lg font-semibold mb-2">Delete Order?</h3>
            <p className="text-gray-600 mb-4">
              Delete <strong>{deleteConfirm.orderNo}</strong> permanently?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
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
