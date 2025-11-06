// src/components/quality/InspectionPlan.jsx
import React, { useState, useMemo } from "react";
import { useQuality } from "../../context/QualityContext";

export const InspectionPlan = () => {
  const { suppliers, addInspectionPlan, inspectionPlans = [] } = useQuality();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "all", type: "all" });
  const [form, setForm] = useState({
    planId: "",
    title: "",
    product: "",
    supplierId: "",
    inspectionType: "iqc", // iqc, ipqc, fqc
    lotSize: "",
    aqlLevel: "normal-II",
    frequency: "per-batch",
    startDate: "",
    endDate: "",
    responsible: "",
    notes: "",
    status: "draft",
  });

  // AQL Levels
  const aqlLevels = [
    { value: "normal-II", label: "Normal - Level II (Standard)" },
    { value: "normal-I", label: "Normal - Level I (Relaxed)" },
    { value: "tightened", label: "Tightened (High Risk)" },
    { value: "reduced", label: "Reduced (Trusted Supplier)" },
  ];

  // Inspection Types
  const inspectionTypes = [
    { id: "iqc", name: "Incoming QC (IQC)", color: "indigo" },
    { id: "ipqc", name: "In-Process QC (IPQC)", color: "teal" },
    { id: "fqc", name: "Final QC (FQC)", color: "amber" },
  ];

  // Sample Size Table (AQL Normal Level II)
  const getSampleSize = (lotSize, level = "normal-II") => {
    const size = parseInt(lotSize);
    const table = {
      "normal-II": [
        { min: 2, max: 8, code: "A", sample: 2, ac: 0, re: 1 },
        { min: 9, max: 15, code: "B", sample: 3, ac: 0, re: 1 },
        { min: 16, max: 25, code: "C", sample: 5, ac: 0, re: 1 },
        { min: 26, max: 50, code: "D", sample: 8, ac: 0, re: 1 },
        { min: 51, max: 90, code: "E", sample: 13, ac: 1, re: 2 },
        { min: 91, max: 150, code: "F", sample: 20, ac: 1, re: 2 },
        { min: 151, max: 280, code: "G", sample: 32, ac: 2, re: 3 },
        { min: 281, max: 500, code: "H", sample: 50, ac: 3, re: 4 },
        { min: 501, max: 1200, code: "J", sample: 80, ac: 5, re: 6 },
        { min: 1201, max: 3200, code: "K", sample: 125, ac: 7, re: 8 },
      ],
    };
    const row =
      table[level].find((r) => size >= r.min && size <= r.max) ||
      table[level][table[level].length - 1];
    return row;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sample = getSampleSize(form.lotSize, form.aqlLevel);
    const newPlan = {
      id: Date.now(),
      planId: form.planId || `PLAN-${Date.now().toString().slice(-6)}`,
      ...form,
      lotSize: parseInt(form.lotSize),
      sampleSize: sample.sample,
      accept: sample.ac,
      reject: sample.re,
      codeLetter: sample.code,
      createdAt: new Date().toISOString().split("T")[0],
      status: form.status,
    };

    addInspectionPlan(newPlan);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setForm({
      planId: "",
      title: "",
      product: "",
      supplierId: "",
      inspectionType: "iqc",
      lotSize: "",
      aqlLevel: "normal-II",
      frequency: "per-batch",
      startDate: "",
      endDate: "",
      responsible: "",
      notes: "",
      status: "draft",
    });
  };

  const filteredPlans = useMemo(() => {
    return inspectionPlans.filter((p) => {
      const statusMatch =
        filters.status === "all" || p.status === filters.status;
      const typeMatch =
        filters.type === "all" || p.inspectionType === filters.type;
      return statusMatch && typeMatch;
    });
  }, [inspectionPlans, filters]);

  const aql = form.lotSize ? getSampleSize(form.lotSize, form.aqlLevel) : null;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-purple-900">
            Inspection Plan Management
          </h1>
          <p className="text-sm text-purple-700 mt-1">
            Define, Schedule & Approve Quality Inspection Plans
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-md"
        >
          {showForm ? "Cancel" : "Create Plan"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-purple-200">
          <h2 className="text-xl font-semibold text-purple-800 mb-5">
            New Inspection Plan
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Plan ID & Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Plan ID (Optional)
              </label>
              <input
                type="text"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Plan Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Steel Rod Incoming QC Plan"
              />
            </div>

            {/* Product & Supplier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Supplier{" "}
                {form.inspectionType === "iqc" ? (
                  <span className="text-red-500">*</span>
                ) : (
                  ""
                )}
              </label>
              <select
                value={form.supplierId}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required={form.inspectionType === "iqc"}
                disabled={form.inspectionType !== "iqc"}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Inspection Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Inspection Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.inspectionType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inspectionType: e.target.value,
                    supplierId: "",
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {inspectionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Lot Size (Expected) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.lotSize}
                onChange={(e) => setForm({ ...form, lotSize: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* AQL Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                AQL Level
              </label>
              <select
                value={form.aqlLevel}
                onChange={(e) => setForm({ ...form, aqlLevel: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {aqlLevels.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sampling Plan */}
            <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-900">
                Sampling Plan (AQL {form.aqlLevel})
              </p>
              {aql ? (
                <div className="mt-2 grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Code:</span>{" "}
                    <strong>{aql.code}</strong>
                  </div>
                  <div>
                    <span className="font-semibold">Sample:</span>{" "}
                    <strong>{aql.sample}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-green-700">Ac:</span>{" "}
                    <strong>{aql.ac}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-red-700">Re:</span>{" "}
                    <strong>{aql.re}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 mt-1">Enter lot size</p>
              )}
            </div>

            {/* Frequency & Dates */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Inspection Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="per-batch">Per Batch</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Responsible Person
              </label>
              <input
                type="text"
                value={form.responsible}
                onChange={(e) =>
                  setForm({ ...form, responsible: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="QC Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Notes & Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Plan Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-md"
              >
                Save Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">All Types</option>
            {inspectionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-purple-700">
          Total: <strong>{filteredPlans.length}</strong> plan(s)
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-100 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">
                  Plan ID
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider hidden sm:table-cell">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider hidden md:table-cell">
                  Sample
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-purple-800 uppercase tracking-wider hidden lg:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No inspection plans found.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p) => {
                  const type = inspectionTypes.find(
                    (t) => t.id === p.inspectionType
                  );
                  return (
                    <tr key={p.id} className="hover:bg-purple-50 transition">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {p.planId}
                      </td>
                      <td className="px-5 py-4 text-sm text-purple-700 font-medium">
                        {p.title}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 hidden sm:table-cell">
                        {p.product}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full bg-${
                            type?.color || "gray"
                          }-100 text-${type?.color || "gray"}-800`}
                        >
                          {type?.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm hidden md:table-cell">
                        {p.sampleSize} (Ac {p.accept}, Re {p.reject})
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            p.status === "active"
                              ? "bg-green-100 text-green-800"
                              : p.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : p.status === "draft"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {p.createdAt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
