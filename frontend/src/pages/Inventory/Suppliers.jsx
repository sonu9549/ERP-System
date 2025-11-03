// src/pages/purchase/Suppliers.jsx
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Star,
} from "lucide-react";
import { useState, useMemo } from "react";

export default function Suppliers() {
  // === Mock Suppliers Data (In real app, store in context or DB) ===
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: "TechParts Inc.",
      email: "purchase@techparts.com",
      phone: "+1 555-0198",
      address: "456 Industrial Ave, Chicago, IL",
      leadTime: 7,
      rating: 4.8,
      status: "Active",
      lastPurchase: "2025-03-10",
      category: "Electronics",
    },
    {
      id: 2,
      name: "Global Electronics",
      email: "orders@globalelec.com",
      phone: "+1 555-0271",
      address: "789 Tech Park, Austin, TX",
      leadTime: 10,
      rating: 4.5,
      status: "Active",
      lastPurchase: "2025-02-28",
      category: "Electronics",
    },
    {
      id: 3,
      name: "Office Supplies Co.",
      email: "sales@officesupplies.co",
      phone: "+1 555-0333",
      address: "101 Business Rd, Miami, FL",
      leadTime: 5,
      rating: 4.9,
      status: "Inactive",
      lastPurchase: "2024-12-15",
      category: "Office",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    leadTime: 7,
    rating: 5,
    category: "Electronics",
  });

  // === Search + Filter ===
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || s.status === filterStatus;
      const matchesCategory =
        filterCategory === "all" || s.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suppliers, searchTerm, filterStatus, filterCategory]);

  // === Save Supplier ===
  const saveSupplier = () => {
    if (!form.name || !form.email) return;

    const newSupplier = {
      id: editing?.id || Date.now(),
      ...form,
      status: editing?.status || "Active",
      lastPurchase: editing?.lastPurchase || null,
    };

    if (editing) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editing.id ? newSupplier : s))
      );
    } else {
      setSuppliers((prev) => [...prev, newSupplier]);
    }

    setShowForm(false);
    setEditing(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      leadTime: 7,
      rating: 5,
      category: "Electronics",
    });
  };

  // === Delete Supplier ===
  const deleteSupplier = (id) => {
    if (window.confirm("Delete this supplier permanently?")) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // === Edit Supplier ===
  const startEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      leadTime: supplier.leadTime,
      rating: supplier.rating,
      category: supplier.category,
    });
    setShowForm(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Supplier
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input"
        >
          <option value="all">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Office">Office</option>
          <option value="Furniture">Furniture</option>
        </select>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup.id}
            className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{sup.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    sup.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {sup.status}
                </span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(sup.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${sup.email}`} className="hover:text-blue-600">
                  {sup.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{sup.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{sup.address}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between text-xs text-gray-500 border-t pt-3">
              <div>
                <p>Lead Time</p>
                <p className="font-bold text-gray-700">{sup.leadTime} days</p>
              </div>
              <div>
                <p>Last Purchase</p>
                <p className="font-bold text-gray-700">
                  {sup.lastPurchase || "—"}
                </p>
              </div>
              <div>
                <p>Category</p>
                <p className="font-bold text-gray-700">{sup.category}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => startEdit(sup)}
                className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => deleteSupplier(sup.id)}
                className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 text-xs py-1.5 rounded flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <p>No suppliers found.</p>
        </div>
      )}

      {/* === ADD / EDIT FORM MODAL === */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-5">
              {editing ? "Edit Supplier" : "Add New Supplier"}
            </h3>

            <div className="space-y-4">
              <input
                placeholder="Company Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                required
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
              <textarea
                placeholder="Address"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Lead Time (days)"
                  value={form.leadTime}
                  onChange={(e) =>
                    setForm({ ...form, leadTime: e.target.value })
                  }
                  className="input"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm">Rating:</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value })
                    }
                    className="input w-20"
                  />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                <option value="Electronics">Electronics</option>
                <option value="Office">Office Supplies</option>
                <option value="Furniture">Furniture</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={saveSupplier} className="btn-primary flex-1">
                {editing ? "Update" : "Create"} Supplier
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    leadTime: 7,
                    rating: 5,
                    category: "Electronics",
                  });
                }}
                className="btn-secondary flex-1"
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
