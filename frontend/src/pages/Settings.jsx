// src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const allModules = [
  "Dashboard",
  "Inventory",
  "Sales",
  "Purchase",
  "CRM",
  "HR",
  "Finance",
  "Production",
  "Quality",
  "Logistics",
  "Procurement",
];

const roleNames = { 1: "Super Admin", 2: "Admin", 3: "User" };

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: 1,
    modules: ["Dashboard", "Sales", "Finance"],
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: 2,
    modules: ["Dashboard", "Inventory"],
  },
];

const Settings = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Access Denied. Super Admin only.
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    if (editingUser) {
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...data, id: u.id } : u))
      );
    } else {
      const newUser = { ...data, id: Date.now() };
      setUsers([...users, newUser]);
    }

    setSaving(false);
    setShowForm(false);
    setEditingUser(null);
  };

  const handleModuleToggle = (module) => {
    setEditingUser((prev) => {
      const modules = prev.modules.includes(module)
        ? prev.modules.filter((m) => m !== module)
        : [...prev.modules, module];
      return { ...prev, modules };
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage roles and module access</p>
        </div>
        <button
          onClick={() => {
            setEditingUser({
              name: "",
              email: "",
              role: 3,
              modules: [],
            });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Modules</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-gray-50 transition-all"
              >
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{roleNames[u.role]}</td>
                <td className="p-3 text-sm text-gray-600">
                  {u.modules.join(", ")}
                </td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <h2 className="text-xl font-bold mb-4">
              {editingUser?.id ? "Edit User" : "Add New User"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />

              <input
                type="email"
                placeholder="Email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />

              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value={1}>Super Admin</option>
                <option value={2}>Admin</option>
                <option value={3}>User</option>
              </select>

              <div>
                <h3 className="font-semibold mb-2">Module Access:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allModules.map((mod) => (
                    <label
                      key={mod}
                      className="flex items-center gap-2 text-sm border p-2 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={editingUser.modules.includes(mod)}
                        onChange={() => handleModuleToggle(mod)}
                      />
                      {mod}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editingUser)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
