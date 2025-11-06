// src/components/quality/QualityCertificate.jsx
import React, { useState, useMemo, useRef } from "react";
import { useQuality } from "../../context/QualityContext";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";

export const QualityCertificate = () => {
  const {
    inspections,
    suppliers,
    defects,
    addCertificate,
    certificates = [],
  } = useQuality();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "all", type: "all" });
  const [form, setForm] = useState({
    certId: "",
    inspectionId: "",
    type: "coc", // coc, coa
    product: "",
    batchNo: "",
    quantity: "",
    testResults: "",
    standard: "ISO 9001:2015",
    remarks: "",
    issuedTo: "",
    issuedBy: "QC Manager",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    status: "issued",
  });

  const certificateRef = useRef();

  const certificateTypes = [
    { id: "coc", name: "Certificate of Conformance (CoC)", color: "emerald" },
    { id: "coa", name: "Certificate of Analysis (CoA)", color: "violet" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const inspection = inspections.find(
      (i) => i.id === parseInt(form.inspectionId)
    );
    const newCert = {
      id: Date.now(),
      certId:
        form.certId ||
        `CERT-${new Date().getFullYear()}-${String(
          certificates.length + 1
        ).padStart(4, "0")}`,
      ...form,
      inspectionId: parseInt(form.inspectionId),
      product: form.product || inspection?.item,
      batchNo: form.batchNo || inspection?.batchNo,
      quantity: parseInt(form.quantity) || inspection?.quantityPacked,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || "",
      digitalSign: `Digitally signed by ${form.issuedBy} on ${format(
        new Date(form.issueDate),
        "dd MMM yyyy"
      )}`,
      qrCode: `https://yourcompany.com/verify/${Date.now()}`, // Mock
      status: form.status,
    };

    addCertificate(newCert);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setForm({
      certId: "",
      inspectionId: "",
      type: "coc",
      product: "",
      batchNo: "",
      quantity: "",
      testResults: "",
      standard: "ISO 9001:2015",
      remarks: "",
      issuedTo: "",
      issuedBy: "QC Manager",
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      status: "issued",
    });
  };

  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const statusMatch =
        filters.status === "all" || c.status === filters.status;
      const typeMatch = filters.type === "all" || c.type === filters.type;
      return statusMatch && typeMatch;
    });
  }, [certificates, filters]);

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: `Certificate_${form.certId || "DRAFT"}`,
  });

  const selectedInspection = inspections.find(
    (i) => i.id === parseInt(form.inspectionId)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
            Quality Certificate Management
          </h1>
          <p className="text-sm text-emerald-700 mt-1">
            CoC • CoA • Digital Sign • PDF Export
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-md"
        >
          {showForm ? "Cancel" : "Issue Certificate"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-emerald-200">
          <h2 className="text-xl font-semibold text-emerald-800 mb-5">
            Issue Quality Certificate
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cert ID & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Certificate ID (Auto)
                </label>
                <input
                  type="text"
                  readOnly
                  value={form.certId || "Auto-generated"}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Certificate Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {certificateTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link to FQC Inspection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Link to Final Inspection <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.inspectionId}
                onChange={(e) =>
                  setForm({ ...form, inspectionId: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select FQC Record</option>
                {inspections
                  .filter((i) => i.type === "final" && i.status === "Pass")
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.batchNo} | {i.item} | Qty: {i.quantityPacked} |{" "}
                      {i.date}
                    </option>
                  ))}
              </select>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={form.product || selectedInspection?.item || ""}
                  readOnly={!!selectedInspection}
                  onChange={(e) =>
                    setForm({ ...form, product: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Batch No.
                </label>
                <input
                  type="text"
                  value={form.batchNo || selectedInspection?.batchNo || ""}
                  readOnly={!!selectedInspection}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  value={
                    form.quantity || selectedInspection?.quantityPacked || ""
                  }
                  readOnly={!!selectedInspection}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            {/* Test Results (for CoA) */}
            {form.type === "coa" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Test Results / Specifications
                </label>
                <textarea
                  rows="4"
                  value={form.testResults}
                  onChange={(e) =>
                    setForm({ ...form, testResults: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Tensile Strength: 450 MPa (Spec: ≥400 MPa)\nHardness: 85 HRB (Spec: 80-90 HRB)"
                />
              </div>
            )}

            {/* Standard & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Compliance Standard
                </label>
                <input
                  type="text"
                  value={form.standard}
                  onChange={(e) =>
                    setForm({ ...form, standard: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="ISO 9001:2015, ASTM A36, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Remarks (Optional)
                </label>
                <textarea
                  rows="2"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Issued To & By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Issued To (Customer) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.issuedTo}
                  onChange={(e) =>
                    setForm({ ...form, issuedTo: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="ABC Industries Ltd."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Issued By
                </label>
                <input
                  type="text"
                  value={form.issuedBy}
                  onChange={(e) =>
                    setForm({ ...form, issuedBy: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm({ ...form, issueDate: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-medium shadow-md"
              >
                Save & Generate
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

      {/* Preview & Print */}
      {showForm && selectedInspection && (
        <div
          className="bg-white p-8 rounded-xl shadow-lg mb-6 border"
          ref={certificateRef}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-800">
              {form.type === "coc"
                ? "Certificate of Conformance"
                : "Certificate of Analysis"}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Quality Assurance Document
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p>
                <strong>Certificate No:</strong> {form.certId || "DRAFT"}
              </p>
              <p>
                <strong>Issue Date:</strong>{" "}
                {format(new Date(form.issueDate), "dd MMMM yyyy")}
              </p>
              {form.expiryDate && (
                <p>
                  <strong>Expiry Date:</strong>{" "}
                  {format(new Date(form.expiryDate), "dd MMMM yyyy")}
                </p>
              )}
            </div>
            <div>
              <p>
                <strong>Product:</strong>{" "}
                {form.product || selectedInspection.item}
              </p>
              <p>
                <strong>Batch No:</strong>{" "}
                {form.batchNo || selectedInspection.batchNo}
              </p>
              <p>
                <strong>Quantity:</strong>{" "}
                {form.quantity || selectedInspection.quantityPacked} units
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="font-semibold text-emerald-700">
              Compliance Statement:
            </p>
            <p className="mt-2">
              We hereby certify that the above-mentioned product has been
              manufactured, inspected, and tested in accordance with
              <strong> {form.standard} </strong> and conforms to all specified
              requirements.
            </p>
            {form.type === "coa" && form.testResults && (
              <div className="mt-4">
                <p className="font-semibold text-emerald-700">Test Results:</p>
                <pre className="bg-gray-50 p-3 rounded mt-2 text-xs whitespace-pre-wrap">
                  {form.testResults}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="font-semibold">Issued To:</p>
              <p className="mt-1">{form.issuedTo}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Authorized Signatory:</p>
              <p className="mt-1">{form.issuedBy}</p>
              <div className="mt-4 h-16 w-32 border-b-2 border-emerald-600"></div>
              <p className="text-xs text-gray-500">Digital Signature</p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Verify authenticity:{" "}
              <span className="underline">{`https://yourcompany.com/verify/${Date.now()}`}</span>
            </p>
            <div className="mt-2 inline-block bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20"></div>
            <p className="mt-1">QR Code</p>
          </div>
        </div>
      )}

      {showForm && selectedInspection && (
        <div className="text-center mb-6">
          <button
            onClick={handlePrint}
            className="bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 transition shadow-md"
          >
            Download PDF
          </button>
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
            <option value="issued">Issued</option>
            <option value="revoked">Revoked</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">All Types</option>
            {certificateTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-emerald-700">
          Total: <strong>{filteredCerts.length}</strong> certificate(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-100 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Cert ID
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider hidden sm:table-cell">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider hidden md:table-cell">
                  Issued
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No certificates issued.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c) => {
                  const type = certificateTypes.find((t) => t.id === c.type);
                  return (
                    <tr key={c.id} className="hover:bg-emerald-50 transition">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {c.certId}
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
                      <td className="px-5 py-4 text-sm text-gray-700 hidden sm:table-cell">
                        {c.product}
                      </td>
                      <td className="px-5 py-4 text-sm text-emerald-700 font-medium">
                        {c.batchNo}
                      </td>
                      <td className="px-5 py-4 text-sm">{c.issuedTo}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {format(new Date(c.issueDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            c.status === "issued"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {c.status}
                        </span>
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
