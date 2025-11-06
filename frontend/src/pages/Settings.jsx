// src/pages/Settings.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { MODULE_ACCESS } from "../config/moduleAccessConfig";

const roleNames = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.SALES_MANAGER]: "Sales Manager",
  [ROLES.INVENTORY_MANAGER]: "Inventory Manager",
  [ROLES.CRM_MANAGER]: "CRM Manager",
  [ROLES.HR_MANAGER]: "HR Manager",
  [ROLES.FINANCE_MANAGER]: "Finance Manager",
  [ROLES.QUALITY_MANAGER]: "Quality Manager",
  [ROLES.LOGISTICS_MANAGER]: "Logistics Manager",
  [ROLES.PRODUCTION_MANAGER]: "Production Manager",
  [ROLES.PROCUREMENT_MANAGER]: "Procurement Manager",
  [ROLES.PLANT_MANAGER]: "Plant Manager",
  [ROLES.SALES_REP]: "Sales Representative",
  [ROLES.USER]: "User",
};

const Settings = () => {
  const { user: currentUser, canAccessSettings } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // ACCESS CHECK
  if (!canAccessSettings) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
          Access Denied. You need "Settings" access.
        </div>
      </div>
    );
  }

  // LOAD USERS
  useEffect(() => {
    const stored = localStorage.getItem("erp_users_v2");
    if (stored) {
      try {
        setUsers(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse users", e);
      }
    } else {
      // DEFAULT USERS (NO allowedPaths)
      const defaultUsers = [
        {
          id: 1,
          name: "Super Admin",
          email: "admin@nextgen.com",
          password: "admin123",
          role: ROLES.SUPER_ADMIN,
        },
        {
          id: 2,
          name: "Sales Manager",
          email: "sales@nextgen.com",
          password: "sales123",
          role: ROLES.SALES_MANAGER,
        },
        {
          id: 3,
          name: "Regular User",
          email: "user@nextgen.com",
          password: "user123",
          role: ROLES.USER,
        },
      ];
      setUsers(defaultUsers);
      localStorage.setItem("erp_users_v2", JSON.stringify(defaultUsers));
    }
  }, []);

  // SAVE USERS
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("erp_users_v2", JSON.stringify(users));
    }
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // VALIDATE
  const validateForm = () => {
    const errors = {};
    if (!editingUser.name.trim()) errors.name = "Name is required";
    if (!editingUser.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(editingUser.email))
      errors.email = "Invalid email";

    // Password required only for new users
    if (!editingUser.id && !editingUser.password?.trim()) {
      errors.password = "Password is required for new users";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // SAVE USER
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const userToSave = {
      id: editingUser.id || Date.now(),
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
      // Add password only if new or updated
      ...(editingUser.password && { password: editingUser.password }),
    };

    if (editingUser.id) {
      setUsers(users.map((u) => (u.id === userToSave.id ? userToSave : u)));
    } else {
      setUsers([...users, userToSave]);
    }

    setSaving(false);
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormErrors({});
  };

  const handleDelete = (id) => {
    if (id === currentUser?.id) {
      alert("You cannot delete yourself!");
      return;
    }
    if (window.confirm("Delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            User & Access Management
          </h1>
          <p className="text-gray-600">
            Configure user roles (access is role-based)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser({
              name: "",
              email: "",
              role: ROLES.USER,
              password: "", // Initialize password
            });
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition font-medium"
        >
          + Add User
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <svg
          className="absolute left-3 top-3 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Access
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === ROLES.SUPER_ADMIN
                          ? "bg-purple-100 text-purple-800"
                          : u.role === ROLES.ADMIN
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {roleNames[u.role] || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {u.role === ROLES.SUPER_ADMIN ? (
                      <span className="text-purple-700 font-medium">
                        All Modules
                      </span>
                    ) : (
                      <span className="text-gray-500">Role-Based</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setEditingUser({ ...u, password: "" }); // Reset password on edit
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                      disabled={u.id === currentUser?.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No users found.</div>
        )}
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingUser.id ? "Edit User" : "Add New User"}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* NAME & EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* PASSWORD (only for new users) */}
              {!editingUser.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password for new user"
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.password}
                    </p>
                  )}
                </div>
              )}

              {/* ROLE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => {
                    setEditingUser({
                      ...editingUser,
                      role: Number(e.target.value),
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={ROLES.SUPER_ADMIN}>
                    Super Admin (All Access)
                  </option>
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.SALES_MANAGER}>Sales Manager</option>
                  <option value={ROLES.INVENTORY_MANAGER}>
                    Inventory Manager
                  </option>
                  <option value={ROLES.CRM_MANAGER}>CRM Manager</option>
                  <option value={ROLES.HR_MANAGER}>HR Manager</option>
                  <option value={ROLES.FINANCE_MANAGER}>Finance Manager</option>
                  <option value={ROLES.QUALITY_MANAGER}>Quality Manager</option>
                  <option value={ROLES.LOGISTICS_MANAGER}>
                    Logistics Manager
                  </option>
                  <option value={ROLES.PRODUCTION_MANAGER}>
                    Production Manager
                  </option>
                  <option value={ROLES.PROCUREMENT_MANAGER}>
                    Procurement Manager
                  </option>
                  <option value={ROLES.PLANT_MANAGER}>Plant Manager</option>
                  <option value={ROLES.SALES_REP}>Sales Representative</option>
                  <option value={ROLES.USER}>User (Limited)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Access is automatically granted based on role.
                </p>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeForm}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
