// src/pages/Procurement/SettingsModule.jsx
import { useState, useEffect } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  Users,
  IndianRupee,
  Mail,
  Save,
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

export default function SettingsModule() {
  const { settings, saveSettings, loadSettings } = useProcurement();
  const [activeTab, setActiveTab] = useState("approval");
  const [localSettings, setLocalSettings] = useState(settings);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    key: "",
    subject: "",
    body: "",
  });

  // Sync local state when context changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    saveSettings(localSettings);
    toast.success("Settings saved successfully!");
  };

  const handleReset = () => {
    if (window.confirm("Reset all settings to default?")) {
      localStorage.removeItem("procurementSettings");
      loadSettings();
      toast.success("Settings reset to default");
    }
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(localSettings, null, 2)], {
      type: "application/json",
    });
    saveAs(
      blob,
      `procurement-settings-${new Date().toISOString().split("T")[0]}.json`
    );
    toast.success("Settings exported!");
  };

  // DEFAULT TEMPLATES (cannot be edited/deleted)
  const defaultTemplates = {
    prApproved: {
      subject: "PR {{pr_number}} Approved",
      body: `Hi {{user}},\n\nYour Purchase Requisition {{pr_number}} for ₹{{amount}} has been approved.\n\nThanks,\nProcurement Team`,
    },
    poIssued: {
      subject: "PO {{po_number}} Issued",
      body: `Dear {{vendor}},\n\nPurchase Order {{po_number}} for ₹{{amount}} has been issued.\nDue Date: {{due_date}}\n\nBest,\nProcurement Team`,
    },
    paymentDone: {
      subject: "Payment {{payment_id}} Released",
      body: `Dear {{vendor}},\n\nPayment {{payment_id}} of ₹{{amount}} via {{method}} has been released.\nRef: {{reference}}\n\nThank you,\nFinance Team`,
    },
  };

  const allTemplates = {
    ...defaultTemplates,
    ...(localSettings.emailTemplates || {}),
  };

  const isDefault = (key) => Object.keys(defaultTemplates).includes(key);

  const handleAddTemplate = () => {
    if (!newTemplate.key || !newTemplate.subject || !newTemplate.body) {
      toast.error("All fields are required");
      return;
    }
    if (allTemplates[newTemplate.key]) {
      toast.error("Template key already exists");
      return;
    }

    setLocalSettings((prev) => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [newTemplate.key]: {
          subject: newTemplate.subject,
          body: newTemplate.body,
        },
      },
    }));

    setNewTemplate({ key: "", subject: "", body: "" });
    setShowAddTemplate(false);
    toast.success("Template added!");
  };

  const handleDeleteTemplate = (key) => {
    if (isDefault(key)) {
      toast.error("Cannot delete default template");
      return;
    }

    setLocalSettings((prev) => {
      const updated = { ...prev.emailTemplates };
      delete updated[key];
      return { ...prev, emailTemplates: updated };
    });

    toast.success("Template deleted");
  };

  const updateTemplate = (key, field, value) => {
    if (isDefault(key)) return;

    setLocalSettings((prev) => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [key]: {
          ...prev.emailTemplates[key],
          [field]: value,
        },
      },
    }));
  };

  const tabs = [
    { id: "approval", label: "Approval Matrix", icon: Users },
    { id: "budget", label: "Budget Allocation", icon: IndianRupee },
    { id: "email", label: "Email Templates", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500 mt-1">
              Configure approval, budget & emails
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportSettings}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={18} /> Export
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save size={18} /> Save
            </button>
            <button
              onClick={handleReset}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Reset
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-600 text-white"
                    : "text-gray-600 hover:text-slate-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Approval Matrix */}
        {activeTab === "approval" && (
          <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Approval Matrix</h3>
              <button
                onClick={() => {
                  const newUser = {
                    id: Date.now(),
                    user: "New User",
                    role: "Manager",
                    dept: "IT",
                    maxAmount: 50000,
                    autoApprove: false,
                  };
                  setLocalSettings((prev) => ({
                    ...prev,
                    approvalMatrix: [...(prev.approvalMatrix || []), newUser],
                  }));
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} /> Add Approver
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dept
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Max Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Auto-Approve
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(localSettings.approvalMatrix || []).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <input
                          value={user.user}
                          onChange={(e) => {
                            const updated = localSettings.approvalMatrix.map(
                              (u) =>
                                u.id === user.id
                                  ? { ...u, user: e.target.value }
                                  : u
                            );
                            setLocalSettings((prev) => ({
                              ...prev,
                              approvalMatrix: updated,
                            }));
                          }}
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          value={user.role}
                          onChange={(e) => {
                            const updated = localSettings.approvalMatrix.map(
                              (u) =>
                                u.id === user.id
                                  ? { ...u, role: e.target.value }
                                  : u
                            );
                            setLocalSettings((prev) => ({
                              ...prev,
                              approvalMatrix: updated,
                            }));
                          }}
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={user.dept}
                          onChange={(e) => {
                            const updated = localSettings.approvalMatrix.map(
                              (u) =>
                                u.id === user.id
                                  ? { ...u, dept: e.target.value }
                                  : u
                            );
                            setLocalSettings((prev) => ({
                              ...prev,
                              approvalMatrix: updated,
                            }));
                          }}
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                          {[
                            "IT",
                            "HR",
                            "Operations",
                            "Finance",
                            "Marketing",
                          ].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="number"
                          value={user.maxAmount}
                          onChange={(e) => {
                            const updated = localSettings.approvalMatrix.map(
                              (u) =>
                                u.id === user.id
                                  ? { ...u, maxAmount: +e.target.value }
                                  : u
                            );
                            setLocalSettings((prev) => ({
                              ...prev,
                              approvalMatrix: updated,
                            }));
                          }}
                          className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => {
                            const updated = localSettings.approvalMatrix.map(
                              (u) =>
                                u.id === user.id
                                  ? { ...u, autoApprove: !u.autoApprove }
                                  : u
                            );
                            setLocalSettings((prev) => ({
                              ...prev,
                              approvalMatrix: updated,
                            }));
                          }}
                          className={`p-1 rounded transition ${
                            user.autoApprove
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {user.autoApprove ? (
                            <Check size={20} />
                          ) : (
                            <X size={20} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => {
                            const updated = localSettings.approvalMatrix.filter(
                              (u) => u.id !== user.id
                            );
                            setLocalSettings((prev) => ({
                              ...prev,
                              approvalMatrix: updated,
                            }));
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Budget Allocation */}
        {activeTab === "budget" && (
          <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6">
              Department Budget Allocation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(localSettings.budgetAllocation || []).map((dept, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border hover:shadow-md transition"
                >
                  <h4 className="font-semibold text-lg mb-3">{dept.dept}</h4>
                  <label className="block text-sm font-medium mb-2">
                    Annual Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={dept.budget}
                    onChange={(e) => {
                      const updated = [...localSettings.budgetAllocation];
                      updated[i].budget = +e.target.value;
                      setLocalSettings((prev) => ({
                        ...prev,
                        budgetAllocation: updated,
                      }));
                    }}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    ₹{(dept.budget / 100000).toFixed(1)} Lakh
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm">
                <strong>Total Budget:</strong> ₹
                {(
                  (localSettings.budgetAllocation || []).reduce(
                    (sum, d) => sum + d.budget,
                    0
                  ) / 100000
                ).toFixed(1)}{" "}
                Lakh
              </p>
            </div>
          </div>
        )}

        {/* Email Templates – FIXED HINT */}
        {activeTab === "email" && (
          <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Email Templates</h3>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} /> Add Template
              </button>
            </div>

            {/* Add New Template Form */}
            {showAddTemplate && (
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                <h4 className="font-semibold mb-4">Create New Template</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Key (unique)
                    </label>
                    <input
                      placeholder="e.g., invoiceReminder"
                      value={newTemplate.key}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, key: e.target.value })
                      }
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <input
                      placeholder="Invoice Due Reminder"
                      value={newTemplate.subject}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          subject: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Body
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Dear {{vendor}}, invoice {{invoice_id}} is due..."
                      value={newTemplate.body}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, body: e.target.value })
                      }
                      className="w-full p-2 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddTemplate}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTemplate(false);
                      setNewTemplate({ key: "", subject: "", body: "" });
                    }}
                    className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Template List */}
            {Object.entries(allTemplates).map(([key, template]) => (
              <div
                key={key}
                className={`border rounded-xl p-6 ${
                  isDefault(key) ? "bg-gray-50 opacity-90" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                    {isDefault(key) && (
                      <span className="ml-2 text-xs text-blue-600">
                        (Default)
                      </span>
                    )}
                  </h4>
                  {!isDefault(key) && (
                    <button
                      onClick={() => handleDeleteTemplate(key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  value={template.subject}
                  onChange={(e) =>
                    updateTemplate(key, "subject", e.target.value)
                  }
                  disabled={isDefault(key)}
                  className={`w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 ${
                    isDefault(key) ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />

                <label className="block text-sm font-medium mb-2">Body</label>
                <textarea
                  value={template.body}
                  onChange={(e) => updateTemplate(key, "body", e.target.value)}
                  rows={5}
                  disabled={isDefault(key)}
                  className={`w-full p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 ${
                    isDefault(key) ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />

                {/* FIXED HINT – no back-ticks, no undefined variable */}
                <p className="text-xs text-gray-500 mt-2">
                  Use{" "}
                  <code className="bg-gray-200 px-1 rounded">{`{variable}`}</code>{" "}
                  for dynamic data
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
