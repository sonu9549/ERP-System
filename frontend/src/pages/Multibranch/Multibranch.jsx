import React, { useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Building2,
  Users,
  Edit,
  Trash,
  X,
} from "lucide-react";

const Multibranch = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Head Office - Delhi",
      code: "DEL-HQ",
      manager: "Ravi Sharma",
      employees: 58,
      address: "Connaught Place, New Delhi",
      status: "Active",
    },
    {
      id: 2,
      name: "Mumbai Branch",
      code: "MUM-01",
      manager: "Amit Verma",
      employees: 42,
      address: "Andheri East, Mumbai",
      status: "Active",
    },
    {
      id: 3,
      name: "Bangalore Branch",
      code: "BLR-02",
      manager: "Priya Nair",
      employees: 37,
      address: "Koramangala, Bangalore",
      status: "Inactive",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    manager: "",
    employees: "",
    address: "",
    status: "Active",
  });

  // ✅ Filter Logic: Matches search + status filter
  const filtered = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Form Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.manager)
      return alert("Please fill all required fields");

    if (editingBranch) {
      setBranches((prev) =>
        prev.map((b) =>
          b.id === editingBranch.id ? { ...formData, id: b.id } : b
        )
      );
    } else {
      setBranches((prev) => [
        ...prev,
        {
          ...formData,
          id: Date.now(),
          employees: Number(formData.employees) || 0,
        },
      ]);
    }

    setShowModal(false);
    setEditingBranch(null);
    setFormData({
      name: "",
      code: "",
      manager: "",
      employees: "",
      address: "",
      status: "Active",
    });
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData(branch);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      setBranches((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">
            Multi-Branch Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage all company branches, managers, and employees.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Add New Branch
        </button>
      </div>

      {/* 🔍 Search + Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute top-2.5 left-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or code..."
            className="pl-10 pr-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-600" size={28} />
            <div>
              <h2 className="text-lg font-medium text-gray-700">
                Total Branches
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {branches.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <Users className="text-green-600" size={28} />
            <div>
              <h2 className="text-lg font-medium text-gray-700">
                Total Employees
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {branches.reduce((sum, b) => sum + Number(b.employees), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <MapPin className="text-orange-500" size={28} />
            <div>
              <h2 className="text-lg font-medium text-gray-700">
                Active Branches
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {branches.filter((b) => b.status === "Active").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <MapPin className="text-red-500" size={28} />
            <div>
              <h2 className="text-lg font-medium text-gray-700">
                Inactive Branches
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {branches.filter((b) => b.status === "Inactive").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🧾 Branch Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="p-3 text-left">Branch Name</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Manager</th>
              <th className="p-3 text-left">Employees</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((branch) => (
              <tr
                key={branch.id}
                className="border-t hover:bg-gray-50 transition text-gray-700"
              >
                <td className="p-3 font-medium">{branch.name}</td>
                <td className="p-3">{branch.code}</td>
                <td className="p-3">{branch.manager}</td>
                <td className="p-3">{branch.employees}</td>
                <td className="p-3">{branch.address}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      branch.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {branch.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No branches found.
          </div>
        )}
      </div>

      {/* Modal for Add/Edit — same as before */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">
              {editingBranch ? "Edit Branch" : "Add New Branch"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* (form fields same as before) */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Manager *
                  </label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Employees
                  </label>
                  <input
                    type="number"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {editingBranch ? "Update Branch" : "Add Branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Multibranch;
