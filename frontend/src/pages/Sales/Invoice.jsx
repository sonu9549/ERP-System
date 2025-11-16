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
  Mail,
  Copy,
  MoreVertical,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  Upload,
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Send,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useSales } from "../../context/SalesContext";

// ---------- Revenue Formatter ----------
const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
};

// ---------- Status Badge Component ----------
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Paid: { color: "bg-green-100 text-green-800", label: "Paid" },
    Pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    Overdue: { color: "bg-red-100 text-red-800", label: "Overdue" },
    Draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
  };

  const config = statusConfig[status] || statusConfig.Draft;

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// ---------- Date Helper Functions ----------
const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isThisWeek = (date) => {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  return date >= startOfWeek;
};

const isThisMonth = (date) => {
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export default function Invoice() {
  const {
    invoices,
    customers,
    products,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    recordPayment,
  } = useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    customer: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const printRef = useRef();
  const itemsPerPage = 10;

  // Form State
  const initialForm = {
    customerId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [],
    discount: 0,
    notes: "",
    status: "Draft",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { subtotal, tax, total } = calculateTotal();
      const customer = customers.find((c) => c.id === Number(form.customerId));

      const invoiceData = {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        status: form.status,
        items: form.items,
        subtotal,
        tax,
        discount: Number(form.discount),
        total,
        notes: form.notes,
      };

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceData);
      } else {
        await createInvoice(invoiceData);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Error saving invoice: " + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Error deleting invoice: " + error.message);
    }
  };

  const openEdit = (inv) => {
    setEditingInvoice(inv);
    setForm({
      customerId: inv.customerId,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      items: inv.items,
      discount: inv.discount,
      notes: inv.notes || "",
      status: inv.status,
    });
    setShowForm(true);
  };

  const openPrint = (inv) => {
    setSelectedInvoice(inv);
    setShowPrint(true);
  };

  const viewDetails = (inv) => {
    setSelectedInvoice(inv);
    setShowDetails(true);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice_${selectedInvoice?.invoiceNo}`,
  });

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
    }
  };

  const handlePayment = async (invoiceId, paymentData) => {
    try {
      await recordPayment(invoiceId, paymentData);
      setShowPayment(null);
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Error recording payment: " + error.message);
    }
  };

  // Enhanced filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.total.toString().includes(searchTerm);

      const matchesStatus =
        filters.status === "all" || invoice.status === filters.status;
      const matchesCustomer =
        filters.customer === "all" ||
        invoice.customerId === Number(filters.customer);

      const invoiceDate = new Date(invoice.invoiceDate);
      const matchesDate =
        filters.dateRange === "all" ||
        (filters.dateRange === "today" && isToday(invoiceDate)) ||
        (filters.dateRange === "week" && isThisWeek(invoiceDate)) ||
        (filters.dateRange === "month" && isThisMonth(invoiceDate));

      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [invoices, searchTerm, filters]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Invoice statistics
  const invoiceStats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === "Paid").length;
    const pending = invoices.filter((i) => i.status === "Pending").length;
    const overdue = invoices.filter((i) => i.status === "Overdue").length;
    const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
    const paidRevenue = invoices
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + i.total, 0);
    const outstanding = invoices
      .filter((i) => i.status === "Pending" || i.status === "Overdue")
      .reduce((sum, i) => sum + i.total, 0);

    return {
      total,
      paid,
      pending,
      overdue,
      totalRevenue,
      paidRevenue,
      outstanding,
      collectionRate: total > 0 ? (paid / total) * 100 : 0,
    };
  }, [invoices]);

  // Export functionality
  const exportCSV = () => {
    const headers = [
      "Invoice No",
      "Customer",
      "Date",
      "Due Date",
      "Status",
      "Subtotal",
      "Tax",
      "Discount",
      "Total",
    ];

    const rows = filteredInvoices.map((i) => [
      i.invoiceNo,
      i.customerName,
      i.invoiceDate,
      i.dueDate,
      i.status,
      i.subtotal,
      i.tax,
      i.discount,
      i.total,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Bulk actions
  const handleBulkDelete = () => {
    selectedInvoices.forEach((id) => {
      deleteInvoice(id);
    });
    setSelectedInvoices([]);
  };

  const handleBulkStatusUpdate = (newStatus) => {
    selectedInvoices.forEach((id) => {
      updateInvoiceStatus(id, newStatus);
    });
    setSelectedInvoices([]);
  };

  const toggleSelectInvoice = (invoiceId) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const selectAllInvoices = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map((inv) => inv.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices by number, customer, or amount..."
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
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Billing & Invoices
            </h1>
            <p className="text-gray-600">
              Generate and manage customer invoices
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
              New Invoice
            </button>
          </div>
        </div>

        {/* Invoice Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoiceStats.total}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoiceStats.paid}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {invoiceStats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {invoiceStats.overdue}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatRevenue(invoiceStats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-teal-600">
                  {invoiceStats.collectionRate.toFixed(1)}%
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
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Customer
              </label>
              <select
                value={filters.customer}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, customer: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: e.target.value,
                  }));
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
                  setFilters({
                    status: "all",
                    dateRange: "all",
                    customer: "all",
                  });
                  setSearchTerm("");
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedInvoices.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-800">
                {selectedInvoices.length} invoice(s) selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate("Paid")}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate("Pending")}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Mark Pending
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedInvoices([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice List ({filteredInvoices.length} invoices)
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredInvoices.length} results</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedInvoices.length === paginatedInvoices.length &&
                        paginatedInvoices.length > 0
                      }
                      onChange={selectAllInvoices}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {[
                    "Invoice No",
                    "Customer",
                    "Date",
                    "Due Date",
                    "Status",
                    "Amount",
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
                {paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleSelectInvoice(invoice.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => viewDetails(invoice)}
                      >
                        {invoice.invoiceNo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.invoiceDate}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {invoice.invoiceDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {invoice.dueDate}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={invoice.status}
                        onChange={(e) =>
                          handleStatusUpdate(invoice.id, e.target.value)
                        }
                        className="px-2 py-1 text-xs border rounded-full bg-transparent focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatRevenue(invoice.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => viewDetails(invoice)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(invoice)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPrint(invoice)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>

                        {/* More Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActions(
                                showActions === invoice.id ? null : invoice.id
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showActions === invoice.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      invoice.invoiceNo
                                    );
                                    setShowActions(null);
                                    alert(
                                      "Invoice number copied to clipboard!"
                                    );
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Invoice No
                                </button>
                                <button
                                  onClick={() => setShowPayment(invoice)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Record Payment
                                </button>
                                <button
                                  onClick={() => {
                                    const emailSubject = `Invoice ${invoice.invoiceNo}`;
                                    const emailBody = `Dear ${
                                      invoice.customerName
                                    },\n\nPlease find your invoice ${
                                      invoice.invoiceNo
                                    } attached.\n\nTotal Amount: ${formatRevenue(
                                      invoice.total
                                    )}\nDue Date: ${
                                      invoice.dueDate
                                    }\n\nThank you!`;
                                    window.open(
                                      `mailto:${
                                        invoice.customerEmail
                                      }?subject=${encodeURIComponent(
                                        emailSubject
                                      )}&body=${encodeURIComponent(emailBody)}`
                                    );
                                    setShowActions(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Send className="w-4 h-4" />
                                  Send Email
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(invoice)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Invoice
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
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of{" "}
              {filteredInvoices.length}
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

      {/* Invoice Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
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
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      value={form.invoiceDate}
                      onChange={(e) =>
                        setForm({ ...form, invoiceDate: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({ ...form, dueDate: e.target.value })
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
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Line Items */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Line Items</h4>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={newItem.productId}
                      onChange={(e) =>
                        setNewItem({ ...newItem, productId: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatRevenue(product.price)}
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
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Qty"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!newItem.productId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {form.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.qty} × {formatRevenue(item.price)} ={" "}
                            {formatRevenue(item.total)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes or terms..."
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatRevenue(calculateTotal().subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (10%):</span>
                      <span>{formatRevenue(calculateTotal().tax)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">
                        Discount:
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discount}
                        onChange={(e) =>
                          setForm({ ...form, discount: e.target.value })
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatRevenue(calculateTotal().total)}</span>
                    </div>
                  </div>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingInvoice ? "Update Invoice" : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrint && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Print Invoice</h3>
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
                className="p-8 bg-white border-2 border-gray-200"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      INVOICE
                    </h1>
                    <p className="text-gray-600 text-lg">
                      #{selectedInvoice.invoiceNo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      <strong>Date:</strong> {selectedInvoice.invoiceDate}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Due Date:</strong> {selectedInvoice.dueDate}
                    </p>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">From:</p>
                    <div className="text-sm text-gray-600">
                      <p>Your Company Ltd</p>
                      <p>123 Business Street</p>
                      <p>City, State 12345</p>
                      <p>contact@company.com</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Bill To:</p>
                    <div className="text-sm text-gray-600">
                      <p>{selectedInvoice.customerName}</p>
                      <p>{selectedInvoice.customerAddress}</p>
                      <p>{selectedInvoice.customerEmail}</p>
                    </div>
                  </div>
                </div>

                <table className="w-full mb-8">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Item
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">
                          {item.qty}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">
                          {formatRevenue(item.price)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium">
                          {formatRevenue(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatRevenue(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (10%):</span>
                      <span>{formatRevenue(selectedInvoice.tax)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span>-{formatRevenue(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatRevenue(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">Notes:</p>
                    <p className="text-sm text-gray-600">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    Thank you for your business!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
                <button
                  onClick={() => setShowPrint(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Invoice Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-medium">
                        {selectedInvoice.invoiceNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <StatusBadge status={selectedInvoice.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Date:</span>
                      <span className="font-medium">
                        {selectedInvoice.invoiceDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">
                        {selectedInvoice.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {selectedInvoice.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedInvoice.customerEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedInvoice.customerAddress}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Item
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
                    {selectedInvoice.items.map((item, index) => (
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

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatRevenue(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%):</span>
                    <span>{formatRevenue(selectedInvoice.tax)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span>-{formatRevenue(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatRevenue(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">
                    {selectedInvoice.notes}
                  </p>
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
                    openEdit(selectedInvoice);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Edit Invoice
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openPrint(selectedInvoice);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Record Payment</h3>
                <button
                  onClick={() => setShowPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={showPayment.total}
                    defaultValue={showPayment.total}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    handlePayment(showPayment.id, {
                      amount: showPayment.total,
                      paymentDate: new Date().toISOString().split("T")[0],
                      method: "bank_transfer",
                    })
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => setShowPayment(null)}
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
                    Delete Invoice
                  </h3>
                  <p className="text-gray-600">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete invoice{" "}
                  <strong>{deleteConfirm.invoiceNo}</strong>? This will remove
                  all invoice data permanently.
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
