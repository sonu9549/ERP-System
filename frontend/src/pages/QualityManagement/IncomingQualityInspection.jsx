// src/components/quality/IncomingQualityControl.jsx
import React, { useState, useMemo } from "react";
import { useQuality } from "../../context/QualityContext";

export const IncomingQualityControl = () => {
  const { inspections, suppliers, defects, addInspection } = useQuality();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "all", supplier: "all" });
  const [form, setForm] = useState({
    batchNo: "",
    supplierId: "",
    item: "",
    quantityReceived: "",
    defectIds: [],
    notes: "",
    status: "Pass",
  });

  // AQL-based Sample Size (ISO 2859-1 inspired)
  const calculateSampleSize = (lotSize) => {
    const size = parseInt(lotSize);
    if (size <= 25) return { sample: 5, accept: 0, reject: 1 };
    if (size <= 90) return { sample: 13, accept: 1, reject: 2 };
    if (size <= 280) return { sample: 32, accept: 2, reject: 3 };
    if (size <= 1200) return { sample: 50, accept: 3, reject: 4 };
    if (size <= 3200) return { sample: 80, accept: 5, reject: 6 };
    return { sample: 125, accept: 7, reject: 8 };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const lotSize = parseInt(form.quantityReceived);
    const { sample } = calculateSampleSize(lotSize);
    const defectsFound = form.defectIds.length;

    const newInspection = {
      batchNo: form.batchNo,
      supplierId: parseInt(form.supplierId),
      item: form.item,
      quantityReceived: lotSize,
      sampleSize: sample,
      defectsFound,
      defectIds: form.defectIds,
      status: form.status,
      notes: form.notes,
      date: new Date().toISOString().split("T")[0],
      inspectedBy: "Current User", // Later from AuthContext
    };

    addInspection(newInspection);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setForm({
      batchNo: "",
      supplierId: "",
      item: "",
      quantityReceived: "",
      defectIds: [],
      notes: "",
      status: "Pass",
    });
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((i) => {
      const statusMatch =
        filters.status === "all" || i.status === filters.status;
      const supplierMatch =
        filters.supplier === "all" ||
        i.supplierId === parseInt(filters.supplier);
      return statusMatch && supplierMatch;
    });
  }, [inspections, filters]);

  const aql = form.quantityReceived
    ? calculateSampleSize(form.quantityReceived)
    : null;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Incoming Quality Control (IQC)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Inspect, Accept, Reject – Ensure Supplier Quality
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-md"
        >
          {showForm ? "Cancel" : "New Inspection"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
            Inspection Form
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Batch & Supplier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Batch No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.batchNo}
                onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="BATCH-2025-XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.supplierId}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Item & Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Item Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Steel Rod 12mm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Quantity Received <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.quantityReceived}
                onChange={(e) =>
                  setForm({ ...form, quantityReceived: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* AQL Sample Size */}
            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                AQL Sampling Plan (Normal, Level II)
              </p>
              {aql ? (
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Sample Size:</span>{" "}
                    <strong>{aql.sample}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-green-700">
                      Accept ≤
                    </span>{" "}
                    <strong>{aql.accept}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-red-700">Reject ≥</span>{" "}
                    <strong>{aql.reject}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 mt-1">
                  Enter quantity to calculate sample size
                </p>
              )}
            </div>

            {/* Defects */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Defects Found ({form.defectIds.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto p-3 border border-gray-300 rounded-lg bg-gray-50 space-y-2">
                {defects.length === 0 ? (
                  <p className="text-gray-500">No defect types defined.</p>
                ) : (
                  defects.map((def) => (
                    <label
                      key={def.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.defectIds.includes(def.id)}
                        onChange={() => {
                          const updated = form.defectIds.includes(def.id)
                            ? form.defectIds.filter((id) => id !== def.id)
                            : [...form.defectIds, def.id];
                          setForm({ ...form, defectIds: updated });
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium">{def.name}</span>
                      <span
                        className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                          def.severity === "High"
                            ? "bg-red-100 text-red-700"
                            : def.severity === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {def.severity}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Status & Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Inspection Result <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pass">Pass – Accept Lot</option>
                <option value="Fail">Fail – Reject Lot</option>
                <option value="Hold">Hold – Re-inspect</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                rows="3"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Minor scratches on 2 units, acceptable per spec."
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-md"
              >
                Submit & Save
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
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="Hold">Hold</option>
          </select>
          <select
            value={filters.supplier}
            onChange={(e) =>
              setFilters({ ...filters, supplier: e.target.value })
            }
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-600">
          Total: <strong>{filteredInspections.length}</strong> inspection(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Item
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Qty
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Defects
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No inspections match your filters.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((i) => {
                  const supplier = suppliers.find((s) => s.id === i.supplierId);
                  const defectNames =
                    i.defectIds
                      .map((id) => defects.find((d) => d.id === id)?.name)
                      .filter(Boolean)
                      .join(", ") || "None";

                  return (
                    <tr key={i.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {i.batchNo}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 hidden sm:table-cell">
                        {i.item}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {supplier?.name || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 hidden md:table-cell">
                        {i.quantityReceived}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            i.status === "Pass"
                              ? "bg-green-100 text-green-800"
                              : i.status === "Fail"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 hidden lg:table-cell">
                        {defectNames}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden sm:table-cell">
                        {i.date}
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
