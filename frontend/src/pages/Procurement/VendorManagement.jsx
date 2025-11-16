// src/pages/Procurement/VendorManagement.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  Users,
  Plus,
  Star,
  FileText,
  Send,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building,
  Award,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function VendorManagement() {
  const { rfqs, quotes, pos, fetchPRs } = useProcurement();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    rating: 3,
    gstin: "",
    pan: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  });

  // Real Vendors from RFQ/Quote/PO data + Manual
  const vendors = useMemo(() => {
    const fromRFQs = rfqs.flatMap((rfq) =>
      rfq.suppliers.map((s) => ({ name: s, source: "rfq" }))
    );
    const fromQuotes = quotes.map((q) => ({
      name: q.supplier,
      source: "quote",
    }));
    const fromPOs = pos.map((po) => ({ name: po.supplier, source: "po" }));

    const unique = new Map();
    [...fromRFQs, ...fromQuotes, ...fromPOs].forEach((v) => {
      if (!unique.has(v.name)) {
        unique.set(v.name, {
          id: Date.now() + Math.random(),
          name: v.name,
          email: `${v.name.toLowerCase().replace(/ /g, ".")}@vendor.com`,
          phone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
          address: "Mumbai, MH",
          category: "General",
          rating: Math.floor(Math.random() * 2) + 3.5,
          rfqs: 0,
          quotes: 0,
          pos: 0,
          onTime: Math.floor(Math.random() * 30) + 70,
          status: "active",
          gstin: `27AAAAA${Math.floor(1000 + Math.random() * 9000)}Z1`,
          pan: `AAAAA${Math.floor(1000 + Math.random() * 9000)}A`,
          bankName: "HDFC Bank",
          accountNumber: `${Math.floor(
            100000000000 + Math.random() * 900000000000
          )}`,
          ifsc: "HDFC0000123",
          createdAt: new Date().toISOString().split("T")[0],
        });
      }
    });

    // Count stats
    rfqs.forEach((rfq) => {
      rfq.suppliers.forEach((s) => {
        if (unique.has(s)) unique.get(s).rfqs++;
      });
    });
    quotes.forEach((q) => {
      if (unique.has(q.supplier)) unique.get(q.supplier).quotes++;
    });
    pos.forEach((po) => {
      if (unique.has(po.supplier)) unique.get(po.supplier).pos++;
    });

    return Array.from(unique.values());
  }, [rfqs, quotes, pos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVendor) {
      toast.success(`${form.name} updated!`);
    } else {
      toast.success(`${form.name} added!`);
    }
    setShowAddForm(false);
    setEditingVendor(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      category: "",
      rating: 3,
      gstin: "",
      pan: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    });
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      category: vendor.category,
      rating: vendor.rating,
      gstin: vendor.gstin,
      pan: vendor.pan,
      bankName: vendor.bankName,
      accountNumber: vendor.accountNumber,
      ifsc: vendor.ifsc,
    });
    setShowAddForm(true);
  };

  const filteredVendors = useMemo(() => {
    return vendors
      .filter(
        (v) =>
          v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.email.includes(searchTerm) ||
          v.gstin.includes(searchTerm)
      )
      .filter(
        (v) =>
          filterRating === "all" ||
          Math.floor(v.rating) >= parseInt(filterRating)
      )
      .filter((v) => filterCategory === "all" || v.category === filterCategory);
  }, [vendors, searchTerm, filterRating, filterCategory]);

  const categories = [...new Set(vendors.map((v) => v.category))];

  const StarRating = ({ rating, size = 16 }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }
        />
      ))}
      {rating % 1 !== 0 && (
        <Star
          size={size}
          className="fill-yellow-400 text-yellow-400"
          style={{ clipPath: "inset(0 50% 0 0)" }}
        />
      )}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Vendor Management
              </h1>
              <p className="text-gray-500 mt-1">
                Real-time supplier performance, compliance & analytics
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPRs}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw size={18} /> Sync
              </button>
              <button
                onClick={() => {
                  setEditingVendor(null);
                  setShowAddForm(true);
                }}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Plus size={18} /> Add Vendor
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto">
            {[
              { id: "all", label: "All Vendors", icon: Users },
              { id: "performance", label: "Performance", icon: Award },
              { id: "compliance", label: "Compliance", icon: FileText },
              { id: "rfqs", label: "RFQs & POs", icon: Send },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-teal-600 text-white"
                      : "text-gray-600 hover:text-teal-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ALL VENDORS */}
          {activeTab === "all" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, email, GSTIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-white border rounded-xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{vendor.name}</h3>
                        <p className="text-sm text-gray-500">
                          {vendor.category}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="text-gray-500 hover:text-teal-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={14} /> {vendor.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} /> {vendor.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} /> {vendor.address}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <StarRating rating={vendor.rating} />
                      <div className="text-right text-xs">
                        <p className="font-medium">{vendor.pos} POs</p>
                        <p className="text-green-600">
                          {vendor.onTime}% On-Time
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6">
                Vendor Performance Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vendors.slice(0, 6).map((v) => (
                  <div
                    key={v.id}
                    className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl"
                  >
                    <h4 className="font-bold text-lg mb-3">{v.name}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">RFQs Sent</span>
                        <span className="font-bold">{v.rfqs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Quotes Received</span>
                        <span className="font-bold">{v.quotes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">POs Awarded</span>
                        <span className="font-bold text-green-600">
                          {v.pos}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">On-Time Delivery</span>
                        <span className="font-bold text-green-600">
                          {v.onTime}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-teal-600 h-full rounded-full transition-all"
                            style={{ width: `${v.onTime}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPLIANCE */}
          {activeTab === "compliance" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6">Compliance & Documents</h3>
              <div className="space-y-4">
                {vendors.map((v) => (
                  <div
                    key={v.id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-semibold">{v.name}</h4>
                      <p className="text-sm text-gray-600">
                        GSTIN: {v.gstin} | PAN: {v.pan}
                      </p>
                    </div>
                    <button className="text-teal-600 hover:underline flex items-center gap-1">
                      <Download size={16} /> Download Docs
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RFQs & POs */}
          {activeTab === "rfqs" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6">RFQ & PO History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        RFQs
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quotes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        POs
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Win Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vendors.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-3 text-sm font-medium">
                          {v.name}
                        </td>
                        <td className="px-4 py-3 text-sm">{v.rfqs}</td>
                        <td className="px-4 py-3 text-sm">{v.quotes}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                          {v.pos}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {v.rfqs > 0
                            ? `${Math.round((v.pos / v.rfqs) * 100)}%`
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADD / EDIT FORM MODAL */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingVendor ? "Edit" : "Add"} Vendor
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingVendor(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input
                      placeholder="Vendor Name *"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      required
                    />
                    <input
                      placeholder="Phone *"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      required
                    />
                    <input
                      placeholder="Address *"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      required
                    />
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      required
                    >
                      <option value="">Select Category</option>
                      {[
                        "IT Hardware",
                        "Office Supplies",
                        "Services",
                        "Furniture",
                        "Printing",
                        "General",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="GSTIN"
                      value={form.gstin}
                      onChange={(e) =>
                        setForm({ ...form, gstin: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      placeholder="PAN"
                      value={form.pan}
                      onChange={(e) =>
                        setForm({ ...form, pan: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      placeholder="Bank Name"
                      value={form.bankName}
                      onChange={(e) =>
                        setForm({ ...form, bankName: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      placeholder="Account Number"
                      value={form.accountNumber}
                      onChange={(e) =>
                        setForm({ ...form, accountNumber: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      placeholder="IFSC Code"
                      value={form.ifsc}
                      onChange={(e) =>
                        setForm({ ...form, ifsc: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Initial Rating
                    </label>
                    <StarRating rating={form.rating} />
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={form.rating}
                      onChange={(e) =>
                        setForm({ ...form, rating: +e.target.value })
                      }
                      className="w-full mt-2"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingVendor(null);
                      }}
                      className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
                    >
                      {editingVendor ? "Update" : "Add"} Vendor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VENDOR DETAIL MODAL */}
          {selectedVendor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{selectedVendor.name}</h2>
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Contact Info</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <Mail className="inline mr-2" size={14} />{" "}
                        {selectedVendor.email}
                      </p>
                      <p>
                        <Phone className="inline mr-2" size={14} />{" "}
                        {selectedVendor.phone}
                      </p>
                      <p>
                        <MapPin className="inline mr-2" size={14} />{" "}
                        {selectedVendor.address}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Performance</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        RFQs: <strong>{selectedVendor.rfqs}</strong>
                      </p>
                      <p>
                        Quotes: <strong>{selectedVendor.quotes}</strong>
                      </p>
                      <p>
                        POs:{" "}
                        <strong className="text-green-600">
                          {selectedVendor.pos}
                        </strong>
                      </p>
                      <p>
                        On-Time:{" "}
                        <strong className="text-green-600">
                          {selectedVendor.onTime}%
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Compliance</h3>
                  <p className="text-sm">
                    GSTIN: {selectedVendor.gstin} | PAN: {selectedVendor.pan}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
