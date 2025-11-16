// src/modules/sales/pages/CustomerMaster.jsx
import { useState, useMemo } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Plus,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
  Filter,
  MoreVertical,
  Eye,
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Shield,
  CreditCard,
  Building,
  Globe,
  Clock,
  BarChart3,
  Users,
  MailCheck,
  PhoneCall,
  MessageSquare,
  DownloadCloud,
  UploadCloud,
  Settings,
  Tag,
  Activity,
  Award,
  Target,
  PieChart,
} from "lucide-react";
import { useSales } from "../../context/SalesContext";

/* ---------- Enhanced Revenue Formatter ---------- */
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

  if (num >= 1_000_000_000) {
    return `${symbol}${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `${symbol}${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${symbol}${(num / 1_000).toFixed(0)}k`;
  } else {
    return `${symbol}${num.toLocaleString()}`;
  }
};

const CustomerMaster = () => {
  const {
    customers,
    filters,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setFilters,
    clearFilters,
  } = useSales();

  const [currentPage, setCurrentPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [importing, setImporting] = useState(false);

  const itemsPerPage = 10;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
    joinDate: "",
    revenue: "",
    country: "",
    city: "",
    industry: "",
    customerTier: "Standard",
    creditLimit: "",
    paymentTerms: "Net 30",
    accountManager: "",
    notes: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      status: "Active",
      joinDate: "",
      revenue: "",
      country: "",
      city: "",
      industry: "",
      customerTier: "Standard",
      creditLimit: "",
      paymentTerms: "Net 30",
      accountManager: "",
      notes: "",
    });
    setEditingCustomer(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const customerData = {
        ...form,
        revenue: Number(form.revenue) || 0,
        creditLimit: Number(form.creditLimit) || 0,
        totalOrders: 0,
        satisfaction: 0,
        tags: [],
      };

      if (editingCustomer) {
        updateCustomer(editingCustomer.id, customerData);
      } else {
        addCustomer(customerData);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleDelete = () => {
    try {
      deleteCustomer(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const openEdit = (cust) => {
    setEditingCustomer(cust);
    setForm({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      status: cust.status,
      joinDate: cust.joinDate,
      revenue: cust.revenue.toString(),
      country: cust.country,
      city: cust.city || "",
      industry: cust.industry || "",
      customerTier: cust.customerTier || "Standard",
      creditLimit: cust.creditLimit?.toString() || "",
      paymentTerms: cust.paymentTerms || "Net 30",
      accountManager: cust.accountManager || "",
      notes: cust.notes || "",
    });
    setShowForm(true);
  };

  /* ---------- Enhanced Filtering ---------- */
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        !filters.search ||
        c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.customerCode?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || c.status === filters.status;
      const matchesIndustry =
        filters.industry === "all" || c.industry === filters.industry;
      const matchesTier =
        filters.tier === "all" || c.customerTier === filters.tier;

      return matchesSearch && matchesStatus && matchesIndustry && matchesTier;
    });
  }, [customers, filters]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginated = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ---------- Enhanced Stats ---------- */
  const stats = useMemo(() => {
    const active = customers.filter((c) => c.status === "Active").length;
    const totalRevenue = customers.reduce((s, c) => s + c.revenue, 0);
    const premiumCustomers = customers.filter(
      (c) => c.customerTier === "Premium" || c.customerTier === "Enterprise"
    ).length;
    const avgSatisfaction =
      customers.length > 0
        ? (
            customers.reduce((s, c) => s + (c.satisfaction || 0), 0) /
            customers.length
          ).toFixed(1)
        : 0;

    return {
      total: customers.length,
      active,
      revenue: totalRevenue,
      premium: premiumCustomers,
      satisfaction: avgSatisfaction,
    };
  }, [customers]);

  /* ---------- CSV Export ---------- */
  const exportCSV = () => {
    const headers = [
      "Customer Code",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Join Date",
      "Revenue",
      "Country",
      "City",
      "Industry",
      "Customer Tier",
      "Satisfaction",
      "Total Orders",
      "Credit Limit",
      "Payment Terms",
      "Account Manager",
    ];

    const rows = filteredCustomers.map((c) => [
      c.customerCode,
      c.name,
      c.email,
      c.phone,
      c.status,
      c.joinDate,
      c.revenue,
      c.country,
      c.city,
      c.industry,
      c.customerTier,
      c.satisfaction,
      c.totalOrders,
      c.creditLimit,
      c.paymentTerms,
      c.accountManager,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  /* ---------- Industries and Tiers for Filters ---------- */
  const industries = useMemo(() => {
    return [...new Set(customers.map((c) => c.industry).filter(Boolean))];
  }, [customers]);

  const tiers = useMemo(() => {
    return [...new Set(customers.map((c) => c.customerTier).filter(Boolean))];
  }, [customers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading customers...</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or code..."
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters({ search: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                  showFilters
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.values(filters).some(
                  (val) => val !== "all" && val !== ""
                ) && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {
                      Object.values(filters).filter(
                        (val) => val !== "all" && val !== ""
                      ).length
                    }
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Industry
              </label>
              <select
                value={filters.industry}
                onChange={(e) => setFilters({ industry: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Tier
              </label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ tier: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                {tiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="self-end px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Master
            </h1>
            <p className="text-gray-600">Manage and analyze customer data</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <DownloadCloud className="w-4 h-4" />
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
              Add Customer
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
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
                <p className="text-sm text-gray-600">Premium Customers</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.premium}
                </p>
              </div>
              <Award className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {stats.satisfaction}/5
                </p>
              </div>
              <Star className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer List ({filteredCustomers.length} customers)
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredCustomers.length} results</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Customer",
                    "Contact",
                    "Status",
                    "Tier",
                    "Revenue",
                    "Orders",
                    "Location",
                    "Last Activity",
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
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {c.name}
                          {c.tags?.includes("VIP") && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {c.customerCode}
                        </div>
                        <div className="text-xs text-gray-400">
                          {c.industry}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{c.email}</div>
                      <div className="text-xs text-gray-500">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          c.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          c.customerTier === "Enterprise"
                            ? "bg-purple-100 text-purple-800"
                            : c.customerTier === "Premium"
                            ? "bg-blue-100 text-blue-800"
                            : c.customerTier === "Standard"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.customerTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatRevenue(c.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.totalOrders} orders
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {c.totalOrders}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.city}, {c.country}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.lastActivity}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete customer"
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

          {/* Pagination */}
          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between text-sm border-t border-gray-200">
            <p className="text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}{" "}
              of {filteredCustomers.length}
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

      {/* Enhanced Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
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
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
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
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) =>
                      setForm({ ...form, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Tier
                  </label>
                  <select
                    value={form.customerTier}
                    onChange={(e) =>
                      setForm({ ...form, customerTier: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revenue
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.revenue}
                    onChange={(e) =>
                      setForm({ ...form, revenue: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.creditLimit}
                    onChange={(e) =>
                      setForm({ ...form, creditLimit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={form.paymentTerms}
                    onChange={(e) =>
                      setForm({ ...form, paymentTerms: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Manager
                  </label>
                  <input
                    type="text"
                    value={form.accountManager}
                    onChange={(e) =>
                      setForm({ ...form, accountManager: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) =>
                      setForm({ ...form, joinDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
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
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delete Customer?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirm.name}</strong>? This action cannot be
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
};

export default CustomerMaster;
