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
  FileText,
  DollarSign,
  Calendar,
  User,
  Printer,
  Percent,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

// ---------- Revenue Formatter ----------
const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

// ---------- Sample Data ----------
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

// ---------- Generate Invoices ----------
const generateInvoices = () => [
  {
    id: 1,
    invoiceNo: "INV-1001",
    customerId: 1,
    customerName: "Acme Corp",
    customerAddress: "123 Main St, NY",
    invoiceDate: "2025-03-15",
    dueDate: "2025-04-15",
    status: "Paid",
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
    discount: 100,
    total: 3027.3,
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
    const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.05) : 0;
    return {
      id: i + 2,
      invoiceNo: `INV-${String(1002 + i).padStart(4, "0")}`,
      customerId: cust.id,
      customerName: cust.name,
      customerAddress: cust.address,
      invoiceDate: `2025-${String(Math.floor(Math.random() * 3) + 1).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      dueDate: `2025-${String(Math.floor(Math.random() * 3) + 4).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      status: ["Paid", "Pending", "Overdue"][Math.floor(Math.random() * 3)],
      items,
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
    };
  }),
];

export default function Invoice() {
  const [invoices, setInvoices] = useState(generateInvoices());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const printRef = useRef();

  const itemsPerPage = 10;

  // Form State
  const initialForm = {
    customerId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [],
    discount: 0,
  };
  const [form, setForm] = useState(initialForm);
  const [newItem, setNewItem] = useState({ productId: "", qty: 1 });

  const resetForm = () => {
    setForm(initialForm);
    setNewItem({ productId: "", qty: 1 });
    setEditingInvoice(null);
  };

  const calculateTotal = () => {
    const subtotal = form.items.reduce((s, i) => s + i.total, 0);
    const tax = subtotal * 0.1;
    const discount = Number(form.discount) || 0;
    return { subtotal, tax, total: subtotal + tax - discount };
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
    const invoiceData = {
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      status: "Pending",
      items: form.items,
      subtotal,
      tax,
      discount: Number(form.discount),
      total,
    };

    if (editingInvoice) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editingInvoice.id ? { ...inv, ...invoiceData } : inv
        )
      );
    } else {
      const newInvoice = {
        id: Math.max(...invoices.map((i) => i.id)) + 1,
        invoiceNo: `INV-${String(1000 + invoices.length + 1).padStart(4, "0")}`,
        ...invoiceData,
      };
      setInvoices((prev) => [...prev, newInvoice]);
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = () => {
    setInvoices((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const openEdit = (inv) => {
    setEditingInvoice(inv);
    setForm({
      customerId: inv.customerId,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      items: inv.items,
      discount: inv.discount,
    });
    setShowForm(true);
  };

  const openPrint = (inv) => {
    setEditingInvoice(inv);
    setShowPrint(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () => {
      if (!editingInvoice) return Promise.reject();
      return Promise.resolve();
    },
  });

  /* ---------- Filtering ---------- */
  const filtered = useMemo(
    () =>
      invoices.filter(
        (i) =>
          (i.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.customerName.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (statusFilter === "All" || i.status === statusFilter)
      ),
    [invoices, searchTerm, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ---------- CSV Export ---------- */
  const exportCSV = () => {
    const headers = [
      "Invoice No",
      "Customer",
      "Date",
      "Due",
      "Status",
      "Total",
    ];
    const rows = filtered.map((i) => [
      i.invoiceNo,
      i.customerName,
      i.invoiceDate,
      i.dueDate,
      i.status,
      i.total,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
  };

  /* ---------- Stats ---------- */
  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "Paid").length;
    const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
    return { total: invoices.length, paid, revenue: totalRevenue };
  }, [invoices]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Billing & Invoices
            </h1>
            <p className="text-gray-600">
              Generate and manage customer invoices
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Billed</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatRevenue(stats.revenue)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Avg. Invoice</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatRevenue(stats.revenue / stats.total)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice List
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option>All</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
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
                    "Invoice No",
                    "Customer",
                    "Date",
                    "Due",
                    "Status",
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
                {paginated.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {inv.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.invoiceDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.dueDate}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inv.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : inv.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatRevenue(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(inv)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(inv)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPrint(inv)}
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
          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between text-sm">
            <p className="text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1">
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- Print Preview Modal ---------- */}
      {showPrint && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Print Invoice</h3>
              <button
                onClick={() => setShowPrint(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={printRef} className="p-6 bg-white text-sm">
              <div className="border-b pb-4 mb-6 flex justify-between">
                <div>
                  <h1 className="text-2xl font-bold">INVOICE</h1>
                  <p className="text-gray-600">#{editingInvoice.invoiceNo}</p>
                </div>
                <div className="text-right">
                  <p>
                    <strong>Date:</strong> {editingInvoice.invoiceDate}
                  </p>
                  <p>
                    <strong>Due:</strong> {editingInvoice.dueDate}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="font-semibold">From:</p>
                  <p>
                    Your Company Ltd
                    <br />
                    123 Business St, City
                    <br />
                    contact@company.com
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Bill To:</p>
                  <p>
                    {editingInvoice.customerName}
                    <br />
                    {editingInvoice.customerAddress}
                  </p>
                </div>
              </div>

              <table className="w-full mb-6">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {editingInvoice.items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{item.productName}</td>
                      <td className="text-center py-2">{item.qty}</td>
                      <td className="text-right py-2">${item.price}</td>
                      <td className="text-right py-2">${item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right space-y-1">
                <p>Subtotal: {formatRevenue(editingInvoice.subtotal)}</p>
                <p>Tax (10%): {formatRevenue(editingInvoice.tax)}</p>
                {editingInvoice.discount > 0 && (
                  <p>Discount: -{formatRevenue(editingInvoice.discount)}</p>
                )}
                <p className="text-xl font-bold mt-2">
                  Total: {formatRevenue(editingInvoice.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => setShowPrint(false)}
                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Create/Edit Form Modal ---------- */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingInvoice ? "Edit" : "Create"} Invoice
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  value={form.invoiceDate}
                  onChange={(e) =>
                    setForm({ ...form, invoiceDate: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
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

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-right space-y-1">
                    <p>Subtotal: {formatRevenue(calculateTotal().subtotal)}</p>
                    <p>Tax (10%): {formatRevenue(calculateTotal().tax)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <input
                      type="number"
                      placeholder="Discount"
                      value={form.discount}
                      onChange={(e) =>
                        setForm({ ...form, discount: e.target.value })
                      }
                      className="w-full px-2 py-1 border rounded text-right"
                    />
                    <p className="font-bold text-lg">
                      Total: {formatRevenue(calculateTotal().total)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" /> Save Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Delete Confirm ---------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delete Invoice?</h3>
            <p className="text-gray-600 mb-4">
              Delete <strong>{deleteConfirm.invoiceNo}</strong> permanently?
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
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
