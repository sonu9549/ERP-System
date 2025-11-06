// src/components/quality/NonConformanceManagement.jsx
import React, { useState, useMemo } from "react";
import { useQuality } from "../../context/QualityContext";

export const NonConformanceManagement = () => {
  const {
    inspections,
    suppliers,
    defects,
    addNCM,
    ncmRecords = [],
  } = useQuality();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "all", source: "all" });
  const [form, setForm] = useState({
    ncmId: "",
    title: "",
    source: "iqc", // iqc, ipqc, fqc, customer
    inspectionId: "",
    defectIds: [],
    quantityAffected: "",
    description: "",
    rootCause: "",
    immediateAction: "",
    correctiveAction: "",
    preventiveAction: "",
    responsible: "",
    dueDate: "",
    status: "open",
    cost: "",
  });

  // NCM Sources
  const sources = [
    { id: "iqc", name: "Incoming QC", color: "indigo" },
    { id: "ipqc", name: "In-Process QC", color: "teal" },
    { id: "fqc", name: "Final QC", color: "amber" },
    { id: "customer", name: "Customer Complaint", color: "red" },
  ];

  // 8D Steps
  const eightDSteps = [
    "D0: Preparation",
    "D1: Team Formation",
    "D2: Problem Description",
    "D3: Interim Containment",
    "D4: Root Cause Analysis",
    "D5: Corrective Actions",
    "D6: Implement & Validate",
    "D7: Prevent Recurrence",
    "D8: Team Recognition",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const inspection = inspections.find(
      (i) => i.id === parseInt(form.inspectionId)
    );
    const newNCM = {
      id: Date.now(),
      ncmId:
        form.ncmId ||
        `NCM-${new Date().getFullYear()}-${String(
          ncmRecords.length + 1
        ).padStart(3, "0")}`,
      ...form,
      inspectionId: form.inspectionId ? parseInt(form.inspectionId) : null,
      quantityAffected: parseInt(form.quantityAffected),
      cost: form.cost ? parseFloat(form.cost) : 0,
      reportedDate: new Date().toISOString().split("T")[0],
      status: form.status,
      eightD: {
        d0: true,
        d1: form.responsible ? true : false,
        d2: form.description ? true : false,
        d3: form.immediateAction ? true : false,
        d4: form.rootCause ? true : false,
        d5: form.correctiveAction ? true : false,
        d6: false,
        d7: form.preventiveAction ? true : false,
        d8: false,
      },
    };

    addNCM(newNCM);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setForm({
      ncmId: "",
      title: "",
      source: "iqc",
      inspectionId: "",
      defectIds: [],
      quantityAffected: "",
      description: "",
      rootCause: "",
      immediateAction: "",
      correctiveAction: "",
      preventiveAction: "",
      responsible: "",
      dueDate: "",
      status: "open",
      cost: "",
    });
  };

  const filteredNCMs = useMemo(() => {
    return ncmRecords.filter((n) => {
      const statusMatch =
        filters.status === "all" || n.status === filters.status;
      const sourceMatch =
        filters.source === "all" || n.source === filters.source;
      return statusMatch && sourceMatch;
    });
  }, [ncmRecords, filters]);

  const getInspectionLink = (id) => inspections.find((i) => i.id === id);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-rose-900">
            Non-Conformance Management (NCM)
          </h1>
          <p className="text-sm text-rose-700 mt-1">
            8D Problem Solving • CAPA • Zero Repeat Defects
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-lg hover:bg-rose-700 transition flex items-center gap-2 shadow-md"
        >
          {showForm ? "Cancel" : "Report NCM"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-rose-200">
          <h2 className="text-xl font-semibold text-rose-800 mb-5 flex items-center gap-2">
            New Non-Conformance Report (8D)
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NCM ID & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  NCM ID (Auto)
                </label>
                <input
                  type="text"
                  readOnly
                  value={form.ncmId || "Auto-generated"}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="e.g., Weld Crack in Batch B001"
                />
              </div>
            </div>

            {/* Source & Inspection Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Source <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.source}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source: e.target.value,
                      inspectionId: "",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {form.source !== "customer" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Link to Inspection
                  </label>
                  <select
                    value={form.inspectionId}
                    onChange={(e) =>
                      setForm({ ...form, inspectionId: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">None</option>
                    {inspections
                      .filter(
                        (i) =>
                          i.type === form.source.replace("qc", "") ||
                          (form.source === "fqc" && i.type === "final")
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.batchNo} - {i.status}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Defects & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Defects Found
                </label>
                <div className="max-h-32 overflow-y-auto p-2 border rounded-lg bg-gray-50 space-y-1">
                  {defects.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.defectIds.includes(d.id)}
                        onChange={() => {
                          const updated = form.defectIds.includes(d.id)
                            ? form.defectIds.filter((id) => id !== d.id)
                            : [...form.defectIds, d.id];
                          setForm({ ...form, defectIds: updated });
                        }}
                        className="w-4 h-4 text-rose-600"
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Quantity Affected <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.quantityAffected}
                  onChange={(e) =>
                    setForm({ ...form, quantityAffected: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* D2: Problem Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                D2: Problem Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="What, When, Where, How Many?"
              />
            </div>

            {/* D3: Immediate Action */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                D3: Interim Containment Action
              </label>
              <textarea
                rows="2"
                value={form.immediateAction}
                onChange={(e) =>
                  setForm({ ...form, immediateAction: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="e.g., Segregated 50 units, stopped line"
              />
            </div>

            {/* D4: Root Cause */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                D4: Root Cause Analysis
              </label>
              <textarea
                rows="2"
                value={form.rootCause}
                onChange={(e) =>
                  setForm({ ...form, rootCause: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="5 Why, Fishbone..."
              />
            </div>

            {/* D5 & D7: CAPA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  D5: Corrective Action
                </label>
                <textarea
                  rows="2"
                  value={form.correctiveAction}
                  onChange={(e) =>
                    setForm({ ...form, correctiveAction: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  D7: Preventive Action
                </label>
                <textarea
                  rows="2"
                  value={form.preventiveAction}
                  onChange={(e) =>
                    setForm({ ...form, preventiveAction: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Responsibility & Due */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Estimated Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Current Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition font-medium shadow-md"
              >
                Submit NCM
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
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-rose-700">
          Total: <strong>{filteredNCMs.length}</strong> NCM(s)
        </div>
      </div>

      {/* NCM Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-rose-50 to-pink-100 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider">
                  NCM ID
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider hidden sm:table-cell">
                  Source
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider hidden md:table-cell">
                  Qty
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider">
                  8D Progress
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-rose-800 uppercase tracking-wider hidden lg:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNCMs.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No NCM records found.
                  </td>
                </tr>
              ) : (
                filteredNCMs.map((n) => {
                  const source = sources.find((s) => s.id === n.source);
                  const completedSteps = Object.values(n.eightD).filter(
                    Boolean
                  ).length;
                  const inspection = getInspectionLink(n.inspectionId);

                  return (
                    <tr key={n.id} className="hover:bg-rose-50 transition">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {n.ncmId}
                      </td>
                      <td className="px-5 py-4 text-sm text-rose-700 font-medium">
                        {n.title}
                        {inspection && (
                          <span className="block text-xs text-gray-500">
                            ← {inspection.batchNo}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm hidden sm:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full bg-${
                            source?.color || "gray"
                          }-100 text-${source?.color || "gray"}-800`}
                        >
                          {source?.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            n.status === "closed"
                              ? "bg-green-100 text-green-800"
                              : n.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : n.status === "open"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm hidden md:table-cell">
                        {n.quantityAffected}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {eightDSteps.map((_, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                                i < completedSteps
                                  ? "bg-rose-600 text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                              title={eightDSteps[i]}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {n.reportedDate}
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
