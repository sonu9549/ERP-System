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
} from "lucide-react";

/* ---------- Revenue Formatter ---------- */
const formatRevenue = (value) => {
  if (!value) return "$0";
  const num = Number(value);
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}k`;
  } else {
    return `$${num.toLocaleString()}`;
  }
};

/* ---------- Sample Data ---------- */
const generateCustomers = () => [
  {
    id: 1,
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+1 234-567-8901",
    status: "Active",
    joinDate: "2023-01-15",
    revenue: 125000,
    country: "USA",
  },
  {
    id: 2,
    name: "Beta Systems",
    email: "info@betasys.com",
    phone: "+44 20 7946 0958",
    status: "Inactive",
    joinDate: "2023-03-22",
    revenue: 89000,
    country: "UK",
  },
  ...Array.from({ length: 48 }, (_, i) => ({
    id: i + 3,
    name: `Customer ${i + 3} Inc`,
    email: `cust${i + 3}@example.com`,
    phone: `+1 555-${String(i + 100).padStart(3, "0")}-${String(
      i + 200
    ).padStart(3, "0")}`,
    status: ["Active", "Inactive", "Pending"][Math.floor(Math.random() * 3)],
    joinDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(
      2,
      "0"
    )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
    revenue: Math.floor(Math.random() * 3000000) + 20000,
    country: ["USA", "UK", "India", "Germany", "Canada"][
      Math.floor(Math.random() * 5)
    ],
  })),
];

const CustomerMaster = () => {
  const [customers, setCustomers] = useState(generateCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const itemsPerPage = 10;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
    joinDate: "",
    revenue: "",
    country: "",
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
    });
    setEditingCustomer(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? { ...c, ...form, revenue: Number(form.revenue) }
            : c
        )
      );
    } else {
      const newCust = {
        id: Math.max(...customers.map((c) => c.id)) + 1,
        ...form,
        revenue: Number(form.revenue),
        joinDate: form.joinDate || new Date().toISOString().split("T")[0],
      };
      setCustomers((prev) => [...prev, newCust]);
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = () => {
    setCustomers((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    setDeleteConfirm(null);
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
    });
    setShowForm(true);
  };

  /* ---------- Filtering ---------- */
  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (statusFilter === "All" || c.status === statusFilter)
      ),
    [customers, searchTerm, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ---------- CSV Export (Full Number) ---------- */
  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Join Date",
      "Revenue",
      "Country",
    ];
    const rows = filtered.map((c) => [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.status,
      c.joinDate,
      c.revenue,
      c.country,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
  };

  /* ---------- Stats (Formatted) ---------- */
  const stats = useMemo(() => {
    const active = customers.filter((c) => c.status === "Active").length;
    const totalRevenue = customers.reduce((s, c) => s + c.revenue, 0);
    return { total: customers.length, active, revenue: totalRevenue };
  }, [customers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center">
              <div className="802 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search customers..."
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
              Customer Master
            </h1>
            <p className="text-gray-600">Manage and analyze customer data</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatRevenue(stats.revenue)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Avg. Revenue</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatRevenue(stats.revenue / stats.total)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer List
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
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
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
                    "Name",
                    "Email",
                    "Phone",
                    "Status",
                    "Join Date",
                    "Revenue",
                    "Country",
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
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          c.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : c.status === "Inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.joinDate}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatRevenue(c.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.country}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c)}
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

      {/* ---------- Add/Edit Form Modal ---------- */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCustomer ? "Edit" : "Add"} Customer
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Revenue (e.g. 150000)"
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                placeholder="Join Date"
                value={form.joinDate}
                onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" /> Save
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

      {/* ---------- Delete Confirm Modal ---------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delete Customer?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirm.name}</strong>?
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
};

export default CustomerMaster;
