// src/components/quality/FinalQualityControl.jsx
import React, { useState, useMemo } from "react";
import { useQuality } from "../../context/QualityContext";

export const FinalQualityControl = () => {
  const { inspections, suppliers, defects, addInspection } = useQuality();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "all", packaging: "all" });
  const [form, setForm] = useState({
    batchNo: "",
    product: "",
    quantityPacked: "",
    sampleSize: "",
    defectIds: [],
    packagingIssues: [],
    notes: "",
    status: "Pass",
  });

  // Packaging Checkpoints
  const packagingChecks = [
    { id: "label", name: "Label Correct & Clear" },
    { id: "seal", name: "Proper Sealing" },
    { id: "damage", name: "No Physical Damage" },
    { id: "manual", name: "User Manual Included" },
    { id: "barcode", name: "Barcode Scannable" },
    { id: "qty", name: "Correct Quantity per Box" },
  ];

  // AQL Sampling (Final Inspection - Stricter)
  const calculateSampleSize = (lotSize) => {
    const size = parseInt(lotSize);
    if (size <= 50) return { sample: 8, accept: 0, reject: 1 };
    if (size <= 150) return { sample: 20, accept: 1, reject: 2 };
    if (size <= 500) return { sample: 32, accept: 1, reject: 2 };
    if (size <= 1200) return { sample: 50, accept: 2, reject: 3 };
    if (size <= 3200) return { sample: 80, accept: 3, reject: 4 };
    return { sample: 125, accept: 5, reject: 6 };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const lotSize = parseInt(form.quantityPacked);
    const { sample, accept, reject } = calculateSampleSize(lotSize);
    const defectsFound = form.defectIds.length;
    const packagingFailed = form.packagingIssues.length;

    const newInspection = {
      id: Date.now(),
      batchNo: form.batchNo,
      product: form.product,
      quantityPacked: lotSize,
      sampleSize: sample,
      defectsFound,
      defectIds: form.defectIds,
      packagingIssues: form.packagingIssues,
      totalIssues: defectsFound + packagingFailed,
      status: form.status,
      notes: form.notes,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].slice(0, 5),
      type: "final",
      inspectedBy: "QC Inspector", // Later from Auth
    };

    addInspection(newInspection);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setForm({
      batchNo: "",
      product: "",
      quantityPacked: "",
      sampleSize: "",
      defectIds: [],
      packagingIssues: [],
      notes: "",
      status: "Pass",
    });
  };

  // Filter Final Inspections
  const finalInspections = useMemo(() => {
    return inspections.filter((i) => i.type === "final");
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    return finalInspections.filter((i) => {
      const statusMatch =
        filters.status === "all" || i.status === filters.status;
      const packagingMatch =
        filters.packaging === "all" ||
        (filters.packaging === "ok" && i.packagingIssues.length === 0) ||
        (filters.packaging === "issue" && i.packagingIssues.length > 0);
      return statusMatch && packagingMatch;
    });
  }, [finalInspections, filters]);

  const aql = form.quantityPacked
    ? calculateSampleSize(form.quantityPacked)
    : null;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-900">
            Final Quality Control (FQC)
          </h1>
          <p className="text-sm text-amber-700 mt-1">
            Final Gate Before Shipment – Zero Defects to Customer
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-lg hover:bg-amber-700 transition flex items-center gap-2 shadow-md"
        >
          {showForm ? "Cancel" : "Final Check"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-amber-800 mb-5 flex items-center gap-2">
            Final Inspection Form
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Batch & Product */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Batch No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.batchNo}
                onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="BATCH-FINAL-001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., Premium Steel Chair"
              />
            </div>

            {/* Quantity Packed */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Quantity Packed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.quantityPacked}
                onChange={(e) =>
                  setForm({ ...form, quantityPacked: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* AQL Sampling */}
            <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-900">
                AQL Final Inspection (Level II, Critical)
              </p>
              {aql ? (
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Sample:</span>{" "}
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
                <p className="text-gray-600 mt-1">Enter packed quantity</p>
              )}
            </div>

            {/* Functional & Visual Defects */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product Defects ({form.defectIds.length} found)
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
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
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

            {/* Packaging Checks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Packaging & Labeling (
                {form.packagingIssues.filter((i) => !i).length}/
                {packagingChecks.length} Passed)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-gray-300 rounded-lg bg-amber-50">
                {packagingChecks.map((check, idx) => (
                  <label
                    key={check.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!form.packagingIssues.includes(check.id)}
                      onChange={() => {
                        const updated = form.packagingIssues.includes(check.id)
                          ? form.packagingIssues.filter((id) => id !== check.id)
                          : [...form.packagingIssues, check.id];
                        setForm({ ...form, packagingIssues: updated });
                      }}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium">{check.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status & Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Final Decision <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="Pass">Pass – Ready to Ship</option>
                <option value="Fail">Fail – Return to Production</option>
                <option value="Hold">Hold – Rework Packaging</option>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., 2 units had scratched labels, repacked."
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-md"
              >
                Approve & Release
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
            value={filters.packaging}
            onChange={(e) =>
              setFilters({ ...filters, packaging: e.target.value })
            }
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">All Packaging</option>
            <option value="ok">Packaging OK</option>
            <option value="issue">Packaging Issues</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-amber-700">
          Total: <strong>{filteredInspections.length}</strong> final record(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50 to-orange-100 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider hidden sm:table-cell">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider hidden md:table-cell">
                  Qty
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider hidden lg:table-cell">
                  Packaging
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider hidden sm:table-cell">
                  Time
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
                    No final inspections found.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((i) => {
                  const defectNames =
                    i.defectIds
                      .map((id) => defects.find((d) => d.id === id)?.name)
                      .filter(Boolean)
                      .join(", ") || "None";
                  const packIssues = i.packagingIssues.length;

                  return (
                    <tr key={i.id} className="hover:bg-amber-50 transition">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {i.batchNo}
                      </td>
                      <td className="px-5 py-4 text-sm text-amber-700 hidden sm:table-cell">
                        {i.product}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 hidden md:table-cell">
                        {i.quantityPacked}
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
                      <td className="px-5 py-4 text-sm">
                        <span className="font-medium">{i.totalIssues}</span>{" "}
                        total
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            packIssues === 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {packIssues === 0 ? "OK" : `${packIssues} issue(s)`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden sm:table-cell">
                        {i.date} {i.time}
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
