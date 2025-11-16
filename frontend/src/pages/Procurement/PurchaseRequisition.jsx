// src/components/PurchaseRequisition.jsx
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProcurement } from "../../context/ProcurementContext";
import {
  Plus,
  FileText,
  Clock,
  History,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  Search,
  Filter,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const prSchema = z.object({
  dept: z.string().min(1, "Department is required"),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name required"),
        qty: z.coerce.number().min(1, "Qty ≥ 1"),
        price: z.coerce.number().min(0, "Price ≥ 0"),
      })
    )
    .min(1, "At least one item required"),
});

export default function PurchaseRequisition() {
  const { prs, loading, fetchPRs, raisePR, approvePR, rejectPR } =
    useProcurement();

  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedPR, setSelectedPR] = useState(null);

  const currentUser = "Rahul";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(prSchema),
    defaultValues: {
      dept: "",
      items: [{ name: "", qty: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = watch("items");

  const totalAmount =
    watchItems?.reduce((sum, i) => sum + (i.qty || 0) * (i.price || 0), 0) || 0;

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  const onSubmit = async (data) => {
    try {
      raisePR({
        user: currentUser,
        dept: data.dept,
        items: data.items, // ← full array
        amount: totalAmount,
      });
      toast.success("PR raised successfully!");
      reset();
      setShowForm(false);
      setActiveTab("all");
    } catch (err) {
      toast.error("Failed to raise PR");
    }
  };

  const canApprove = (pr) => {
    const approvers = [
      { user: "Priya", max: 100000 },
      { user: "Amit", max: 50000 },
    ];
    return approvers.some((a) => a.user !== currentUser && pr.amount <= a.max);
  };

  const filteredPRs = useMemo(() => {
    let filtered = prs.filter((pr) => {
      const matchesSearch =
        pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.dept.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "my"
          ? pr.user === currentUser
          : activeTab === "pending"
          ? pr.status === "pending"
          : activeTab === "history"
          ? ["approved", "rejected"].includes(pr.status)
          : activeTab === "all"
          ? true
          : false;

      const matchesStatus =
        filterStatus === "all" || pr.status === filterStatus;

      return matchesSearch && matchesTab && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "amount") return b.amount - a.amount;
      return 0;
    });

    return filtered;
  }, [prs, activeTab, searchTerm, filterStatus, sortBy, currentUser]);

  const exportCSV = () => {
    const headers = [
      "PR#",
      "User",
      "Dept",
      "Amount",
      "Items",
      "Status",
      "Date",
    ];
    const rows = filteredPRs.map((pr) => [
      pr.pr_number,
      pr.user,
      pr.dept,
      pr.amount,
      pr.items.length || pr.items, // fallback for old data
      pr.status,
      pr.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PRs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const tabs = [
    { id: "all", label: "All PRs", icon: Users },
    { id: "raise", label: "Raise PR", icon: Plus },
    { id: "my", label: "My PRs", icon: FileText },
    { id: "pending", label: "Pending Approvals", icon: Clock },
    { id: "history", label: "PR History", icon: History },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    const icons = { approved: CheckCircle, pending: Clock, rejected: XCircle };
    const Icon = icons[status] || Clock;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        <Icon size={16} /> {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading PR Module...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Purchase Requisition
              </h1>
              <p className="text-gray-500 mt-1">Raise, Track & Approve PRs</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download size={18} /> Export
              </button>
              <button
                onClick={fetchPRs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw size={18} /> Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-lg ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Raise PR */}
          {activeTab === "raise" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Raise New Purchase Requisition
                </h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg hover:shadow-md flex items-center gap-2"
                >
                  <Plus size={18} /> New PR
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requester
                      </label>
                      <input
                        type="text"
                        value={currentUser}
                        readOnly
                        className="w-full p-3 bg-gray-100 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department *
                      </label>
                      <select
                        {...register("dept")}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Department</option>
                        <option>IT</option>
                        <option>HR</option>
                        <option>Operations</option>
                        <option>Finance</option>
                        <option>Marketing</option>
                      </select>
                      {errors.dept && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.dept.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Items</h4>
                      <button
                        type="button"
                        onClick={() => append({ name: "", qty: 1, price: 0 })}
                        className="text-indigo-600 text-sm hover:underline"
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, i) => (
                        <div
                          key={field.id}
                          className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border"
                        >
                          <div>
                            <input
                              placeholder="Item Name"
                              {...register(`items.${i}.name`)}
                              className="w-full p-2 border rounded focus:ring-indigo-500"
                            />
                            {errors.items?.[i]?.name && (
                              <p className="text-red-600 text-xs">
                                {errors.items[i].name.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Qty"
                              {...register(`items.${i}.qty`, {
                                valueAsNumber: true,
                              })}
                              className="w-full p-2 border rounded focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Price"
                              {...register(`items.${i}.price`, {
                                valueAsNumber: true,
                              })}
                              className="w-full p-2 border rounded focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex items-center">
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(i)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.items && !Array.isArray(errors.items) && (
                      <p className="text-red-600 text-xs mt-1">
                        {errors.items.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-5 p-4 bg-indigo-50 rounded-lg">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-indigo-600">
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        reset();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit PR"}
                    </button>
                  </div>
                </form>
              )}

              {!showForm && (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Click "New PR" to raise a requisition</p>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {activeTab !== "raise" && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search PR#, User, Dept..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="date">Latest First</option>
                  <option value="amount">Amount High</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        PR#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Requester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dept
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      {activeTab === "pending" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPRs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeTab === "pending" ? 7 : 6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No PRs found
                        </td>
                      </tr>
                    ) : (
                      filteredPRs.map((pr) => (
                        <tr key={pr.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                            {pr.pr_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {pr.user}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {pr.dept}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            ₹{pr.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            {Array.isArray(pr.items)
                              ? pr.items.length
                              : pr.items}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {getStatusBadge(pr.status)}
                          </td>
                          {activeTab === "pending" && (
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                {canApprove(pr) ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        approvePR(pr.id);
                                        toast.success("PR Approved");
                                      }}
                                      className="text-green-600 hover:text-green-800 flex items-center gap-1"
                                    >
                                      <CheckCircle size={16} /> Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        rejectPR(pr.id);
                                        toast.error("PR Rejected");
                                      }}
                                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                    >
                                      <XCircle size={16} /> Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-gray-500 text-xs">
                                    Requires higher approval
                                  </span>
                                )}
                                <button
                                  onClick={() => setSelectedPR(pr)}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Eye size={16} /> View
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedPR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  PR Details: {selectedPR.pr_number}
                </h3>
                <button
                  onClick={() => setSelectedPR(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>User:</strong> {selectedPR.user}
                </p>
                <p>
                  <strong>Dept:</strong> {selectedPR.dept}
                </p>
                <p>
                  <strong>Amount:</strong> ₹
                  {selectedPR.amount.toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Items:</strong>{" "}
                  {Array.isArray(selectedPR.items)
                    ? selectedPR.items.length
                    : selectedPR.items}
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(selectedPR.status)}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {format(new Date(selectedPR.created_at), "dd MMM yyyy")}
                </p>

                {Array.isArray(selectedPR.items) && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Items:</h4>
                    <table className="w-full text-xs border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Price</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPR.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-center">{item.qty}</td>
                            <td className="p-2 text-right">₹{item.price}</td>
                            <td className="p-2 text-right">
                              ₹{(item.qty * item.price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Print PDF
                </button>
                <button
                  onClick={() => setSelectedPR(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
