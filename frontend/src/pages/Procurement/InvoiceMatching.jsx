// src/modules/procurement/InvoiceMatchingModule.jsx
import { useState, useEffect, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Download,
  Eye,
  IndianRupee,
  Package,
  AlertCircle,
} from "lucide-react";

export default function InvoiceMatchingModule() {
  const {
    grns = [],
    invoices = [],
    purchaseOrders = [],
    loading = false,
    error = null,
    fetchGRNs,
    fetchPOs,
    addInvoice,
  } = useProcurement();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: "",
    invoice_date: "",
    total_amount: "",
    tax: "",
    file: null,
  });
  const [discrepancies, setDiscrepancies] = useState([]);

  // Fetch on mount
  useEffect(() => {
    fetchGRNs();
    fetchPOs();
  }, [fetchGRNs, fetchPOs]);

  // === PENDING GRNs: Received but not invoiced ===
  const pendingGRNs = useMemo(() => {
    return grns
      .filter((g) => g.status === "received")
      .filter((g) => !invoices.some((inv) => inv.grn_number === g.grn_number))
      .map((g) => {
        const po = purchaseOrders.find((p) => p.po_number === g.po_number);
        return {
          ...g,
          po_total: po?.total || 0,
          po_tax: po?.tax || 0,
          po_items: po?.items || [],
        };
      });
  }, [grns, invoices, purchaseOrders]);

  // === 3-WAY DISCREPANCY CALCULATION ===
  useEffect(() => {
    if (!selectedGRN || !invoiceData.total_amount) {
      setDiscrepancies([]);
      return;
    }

    const invTotal = parseFloat(invoiceData.total_amount) || 0;
    const invTax = parseFloat(invoiceData.tax) || 0;
    const TOLERANCE = 5; // ₹5 or 0.5%

    const disc = [];

    // 1. PO vs Invoice
    const poTotal = selectedGRN.po_total || 0;
    const poTax = selectedGRN.po_tax || 0;

    if (
      Math.abs(invTotal - poTotal) > TOLERANCE &&
      Math.abs((invTotal - poTotal) / poTotal) > 0.005
    )
      disc.push(
        `PO Amount mismatch: ₹${poTotal.toLocaleString()} vs ₹${invTotal.toLocaleString()}`
      );

    if (Math.abs(invTax - poTax) > TOLERANCE)
      disc.push(
        `PO Tax mismatch: ₹${poTax.toLocaleString()} vs ₹${invTax.toLocaleString()}`
      );

    // 2. GRN vs Invoice
    const grnTotal = selectedGRN.total || 0;
    const grnTax = selectedGRN.tax || 0;

    if (Math.abs(invTotal - grnTotal) > TOLERANCE)
      disc.push(
        `GRN Amount mismatch: ₹${grnTotal.toLocaleString()} vs ₹${invTotal.toLocaleString()}`
      );

    if (Math.abs(invTax - grnTax) > TOLERANCE)
      disc.push(
        `GRN Tax mismatch: ₹${grnTax.toLocaleString()} vs ₹${invTax.toLocaleString()}`
      );

    // 3. Item-Level Match (PO vs GRN)
    const poItems = selectedGRN.po_items || [];
    const grnItems = selectedGRN.items || [];

    poItems.forEach((poItem, i) => {
      const grnItem = grnItems.find((g) => g.product_id === poItem.product_id);
      if (!grnItem) {
        disc.push(`Item missing in GRN: ${poItem.name}`);
      } else if (grnItem.qty !== poItem.qty) {
        disc.push(
          `Qty mismatch: ${poItem.name} — PO: ${poItem.qty}, GRN: ${grnItem.qty}`
        );
      }
    });

    setDiscrepancies(disc);
  }, [selectedGRN, invoiceData]);

  // === HANDLE MATCH ===
  const handleMatchInvoice = async () => {
    if (
      !selectedGRN ||
      !invoiceData.invoice_number ||
      !invoiceData.total_amount
    ) {
      alert("Fill all required fields");
      return;
    }

    const status = discrepancies.length === 0 ? "matched" : "discrepancy";

    const newInvoice = {
      invoice_number: invoiceData.invoice_number,
      grn_number: selectedGRN.grn_number,
      po_number: selectedGRN.po_number,
      vendor: selectedGRN.vendor,
      invoice_date: invoiceData.invoice_date,
      total: parseFloat(invoiceData.total_amount),
      tax: parseFloat(invoiceData.tax || 0),
      status,
      matched_on:
        status === "matched" ? new Date().toISOString().split("T")[0] : null,
      discrepancies,
      file: invoiceData.file,
      auto_approved: status === "matched",
    };

    try {
      await addInvoice(newInvoice);
      resetForm();
    } catch (err) {
      alert("Failed to save invoice");
    }
  };

  const resetForm = () => {
    setInvoiceData({
      invoice_number: "",
      invoice_date: "",
      total_amount: "",
      tax: "",
      file: null,
    });
    setSelectedGRN(null);
    setDiscrepancies([]);
    setActiveTab("all");
  };

  // === FILTERED INVOICES ===
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(
        (inv) =>
          (inv.invoice_number || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (inv.po_number || "").includes(searchTerm) ||
          (inv.vendor || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((inv) => filterStatus === "all" || inv.status === filterStatus);
  }, [invoices, searchTerm, filterStatus]);

  const tabs = [
    { id: "all", label: "All", icon: FileText },
    { id: "match", label: "Match Invoice", icon: Upload },
    { id: "pending", label: `Pending (${pendingGRNs.length})`, icon: Clock },
    { id: "matched", label: "Matched", icon: CheckCircle },
    { id: "discrepancy", label: "Discrepancy", icon: AlertTriangle },
  ];

  const getStatusBadge = (status, auto = false) => {
    const config = {
      matched: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      discrepancy: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
      pending: { color: "bg-amber-100 text-amber-800", icon: Clock },
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}
      >
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
        {auto && <span className="ml-1 text-xs">(Auto)</span>}
      </span>
    );
  };

  const viewPDF = (inv) => {
    if (inv.file) {
      const url = URL.createObjectURL(inv.file);
      window.open(url, "_blank");
      URL.revokeObjectURL(url);
    } else {
      alert(`No PDF: ${inv.invoice_number}`);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading 3-Way Match...</div>;
  if (error)
    return <div className="p-8 text-red-600 text-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Package className="text-indigo-600" />
              3-Way Invoice Matching
            </h1>
            <p className="text-gray-500 mt-1">
              PO → GRN → Invoice | Auto-Approve on Match
            </p>
          </div>
          <button
            onClick={() => {
              fetchGRNs();
              fetchPOs();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            Sync Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-lg whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* INVOICE LIST */}
        {["all", "pending", "matched", "discrepancy"].includes(activeTab) && (
          <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search Invoice#, PO#, Vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="matched">Matched</option>
                <option value="discrepancy">Discrepancy</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      PO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      GRN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-gray-500"
                      >
                        No invoices
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600">
                          {inv.po_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-600">
                          {inv.grn_number}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <IndianRupee size={14} className="inline" />
                          {inv.total?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(inv.status, inv.auto_approved)}
                          {inv.discrepancies?.length > 0 && (
                            <div className="mt-1 text-xs text-red-600">
                              {inv.discrepancies[0]}
                              {inv.discrepancies.length > 1 &&
                                ` +${inv.discrepancies.length - 1}`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewPDF(inv)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <Eye size={18} />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800">
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATCH FORM */}
        {activeTab === "match" && (
          <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Upload className="text-indigo-600" />
              Match Vendor Invoice
            </h2>

            <div className="max-w-4xl">
              <label className="block text-sm font-medium mb-2">
                Select GRN
              </label>
              <select
                value={selectedGRN?.id || ""}
                onChange={(e) => {
                  const grn = pendingGRNs.find((g) => g.id === +e.target.value);
                  setSelectedGRN(grn);
                  if (grn) {
                    setInvoiceData((prev) => ({
                      ...prev,
                      total_amount: grn.total,
                      tax: grn.tax,
                    }));
                  }
                }}
                className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose GRN</option>
                {pendingGRNs.map((grn) => (
                  <option key={grn.id} value={grn.id}>
                    {grn.grn_number} | {grn.vendor} | PO: ₹
                    {grn.po_total.toLocaleString()}
                  </option>
                ))}
              </select>

              {selectedGRN && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <input
                      placeholder="Invoice Number *"
                      value={invoiceData.invoice_number}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          invoice_number: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="date"
                      value={invoiceData.invoice_date}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          invoice_date: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Total Amount (₹) *"
                      value={invoiceData.total_amount}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          total_amount: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Tax Amount (₹)"
                      value={invoiceData.tax}
                      onChange={(e) =>
                        setInvoiceData({ ...invoiceData, tax: e.target.value })
                      }
                      className="p-3 border rounded-lg focus:ring-indigo-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Upload Invoice PDF
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          file: e.target.files[0],
                        })
                      }
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-50 file:text-indigo-700"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="text-indigo-600" />
                      3-Way Match Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <strong>PO:</strong> ₹
                        {selectedGRN.po_total.toLocaleString()}
                      </div>
                      <div>
                        <strong>GRN:</strong> ₹
                        {selectedGRN.total.toLocaleString()}
                      </div>
                      <div>
                        <strong>Inv:</strong> ₹{invoiceData.total_amount || 0}
                      </div>
                    </div>
                    {discrepancies.length > 0 ? (
                      <div className="p-3 bg-red-100 text-red-700 rounded">
                        <strong>Discrepancies:</strong>
                        <ul className="list-disc list-inside text-xs mt-1">
                          {discrepancies.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-100 text-emerald-700 rounded flex items-center gap-2">
                        <CheckCircle size={16} />
                        <strong>All Clear! Auto-Approve Ready</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleMatchInvoice}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-md"
                    >
                      {discrepancies.length === 0
                        ? "Auto-Approve & Save"
                        : "Save with Discrepancy"}
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
