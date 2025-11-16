// src/modules/procurement/GRNModule.jsx
import { useState, useEffect, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  Package, Plus, CheckCircle, XCircle, AlertCircle,
  Download, Clock, Search, Calendar, Truck, ClipboardCheck,
  Eye, Edit, RefreshCw, FileText,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function GRNModule() {
  const {
    pos = [],
    grns: contextGRNs = [],
    loading = false,
    fetchPRs,
    createGRN,
    updateGRN,
    cancelGRN,
  } = useProcurement();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receiptQty, setReceiptQty] = useState({});
  const [qualityPass, setQualityPass] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [editingGRN, setEditingGRN] = useState(null);

  // Use context GRNs
  const [grns, setGRNs] = useState(contextGRNs);

  // Sync POs & GRNs
  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  // Sync context GRNs
  useEffect(() => {
    setGRNs(contextGRNs);
  }, [contextGRNs]);

  // Pending POs
  const pendingPOs = useMemo(() => {
    return pos.filter(po =>
      po.status === "pending" &&
      po.items.some(item => (item.received || 0) < item.qty)
    );
  }, [pos]);

  // CREATE GRN
  const handleCreateGRN = async () => {
    if (!selectedPO) return toast.error("Select a PO");

    const itemsReceived = Object.entries(receiptQty)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => ({ name, qty: +qty }));

    if (itemsReceived.length === 0) return toast.error("Receive at least 1 item");

    if (!qualityPass && !remarks.trim()) return toast.error("Remarks required for rejection");

    const totalOrdered = selectedPO.items.reduce((s, i) => s + i.qty, 0);
    const totalReceived = itemsReceived.reduce((s, i) => s + i.qty, 0);
    const status = totalReceived === totalOrdered ? "completed" : "partial";

    const newGRN = {
      id: Date.now(),
      grn_number: `GRN-${new Date().getFullYear()}-${String(grns.length + 1).padStart(4, "0")}`,
      po_number: selectedPO.po_number,
      vendor: selectedPO.supplier,
      receipt_date: new Date().toISOString().split("T")[0],
      status,
      items: itemsReceived,
      total_qty: totalOrdered,
      qty_received: totalReceived,
      quality: qualityPass ? "pass" : "fail",
      remarks: qualityPass ? "" : remarks,
      invoice_status: "pending",     // ← 3-WAY
      invoice_number: null,          // ← 3-WAY
    };

    try {
      await createGRN(newGRN, selectedPO.id, receiptQty);
      toast.success(`GRN ${newGRN.grn_number} created`);
      resetForm();
    } catch (err) {
      toast.error("Failed to create GRN");
    }
  };

  const resetForm = () => {
    setSelectedPO(null);
    setReceiptQty({});
    setQualityPass(true);
    setRemarks("");
    setShowCreateForm(false);
    setActiveTab("all");
  };

  // EDIT GRN
  const openEditModal = (grn) => {
    if (grn.status === "completed") return toast.error("Cannot edit completed GRN");
    setEditingGRN({ ...grn });
  };

  const handleUpdateGRN = async () => {
    if (!editingGRN) return;
    try {
      await updateGRN(editingGRN.id, editingGRN);
      toast.success(`GRN ${editingGRN.grn_number} updated`);
      setEditingGRN(null);
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  // CANCEL GRN
  const handleCancelGRN = async (grn) => {
    if (!window.confirm(`Cancel GRN ${grn.grn_number}?`)) return;
    try {
      await cancelGRN(grn.id);
      toast.success(`GRN ${grn.grn_number} cancelled`);
    } catch (err) {
      toast.error("Failed to cancel");
    }
  };

  // FILTER GRNs
  const filteredGRNs = useMemo(() => {
    return grns
      .filter(g => {
        const search = searchTerm.toLowerCase();
        return (
          g.grn_number?.toLowerCase().includes(search) ||
          g.po_number?.toLowerCase().includes(search) ||
          g.vendor?.toLowerCase().includes(search) ||
          g.invoice_number?.toLowerCase().includes(search)
        );
      })
      .filter(g => {
        if (filterStatus === "all") return true;
        if (filterStatus === "invoice-pending") return g.invoice_status === "pending";
        if (filterStatus === "invoice-matched") return g.invoice_status === "matched";
        return g.status === filterStatus;
      })
      .sort((a, b) => new Date(b.receipt_date) - new Date(a.receipt_date));
  }, [grns, searchTerm, filterStatus]);

  const tabs = [
    { id: "all", label: "All GRNs", icon: Package },
    { id: "create", label: "Create GRN", icon: Plus },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "partial", label: "Partial", icon: Truck },
    { id: "completed", label: "Completed", icon: CheckCircle },
    { id: "rejected", label: "Rejected", icon: XCircle },
    { id: "invoice-pending", label: "Invoice Pending", icon: FileText },
  ];

  const getStatusBadge = (status) => {
    const config = {
      completed: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      partial: { color: "bg-blue-100 text-blue-800", icon: Truck },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
      pending: { color: "bg-amber-100 text-amber-800", icon: Clock },
    };
    const { color, icon: Icon } = config[status] || { color: "bg-gray-100 text-gray-700", icon: AlertCircle };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon size={14} /> {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getInvoiceBadge = (grn) => {
    if (grn.invoice_status === "matched") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle size={12} /> Matched
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
        <Clock size={12} /> Pending
      </span>
    );
  };

  // PDF DOWNLOAD
  const downloadPDF = (grn) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20).setTextColor(0, 128, 128).setFont("helvetica", "bold");
    doc.text("ACME CORPORATION", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10).setTextColor(100);
    doc.text("Mumbai, India | GSTIN: 27AAAAA0000A1Z5", pageWidth / 2, 27, { align: "center" });

    doc.setFontSize(18).setTextColor(0).setFont("helvetica", "bold");
    doc.text("GOODS RECEIPT NOTE", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(`GRN#: ${grn.grn_number}`, 20, 60);
    doc.text(`PO#: ${grn.po_number}`, 20, 66);
    doc.text(`Vendor: ${grn.vendor}`, 20, 72);
    doc.text(`Date: ${grn.receipt_date}`, 20, 78);
    doc.text(`Status: ${grn.status.toUpperCase()}`, 20, 84);
    doc.text(`Quality: ${grn.quality.toUpperCase()}`, 20, 90);
    doc.text(`Invoice: ${grn.invoice_number || "Pending"}`, 20, 96);

    const items = grn.items.map((item, i) => [i + 1, item.name, item.qty, ""]);

    doc.autoTable({
      startY: 110,
      head: [["#", "Item", "Qty Received", "Remarks"]],
      body: items,
      theme: "grid",
      headStyles: { fillColor: [0, 128, 128], textColor: [255, 255, 255] },
    });

    if (grn.remarks) {
      const finalY = doc.lastAutoTable.finalY;
      doc.setFontSize(10).setFont("helvetica", "italic");
      doc.text(`Remarks: ${grn.remarks}`, 20, finalY + 15);
    }

    const blob = doc.output("blob");
    saveAs(blob, `${grn.grn_number}.pdf`);
    toast.success(`Downloaded: ${grn.grn_number}.pdf`);
  };

  if (loading) return <div className="text-center py-20 text-xl">Loading...</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Package className="text-emerald-600" />
                Goods Receipt Note (GRN)
              </h1>
              <p className="text-gray-500 mt-1">PO → GRN → Invoice | 3-Way Matching</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPRs}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Sync
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-md flex items-center gap-2"
              >
                <Plus size={18} /> Create GRN
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* GRN LIST */}
          {["all", "pending", "partial", "completed", "rejected", "invoice-pending"].includes(activeTab) && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search GRN#, PO#, Vendor, Invoice#..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="invoice-pending">Invoice Pending</option>
                  <option value="invoice-matched">Invoice Matched</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GRN#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredGRNs.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-12 text-gray-500">No GRNs found</td></tr>
                    ) : (
                      filteredGRNs.map((grn) => (
                        <tr key={grn.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600">{grn.grn_number}</td>
                          <td className="px-6 py-4 text-sm text-blue-600">{grn.po_number}</td>
                          <td className="px-6 py-4 text-sm font-medium">{grn.vendor}</td>
                          <td className="px-6 py-4 text-sm">{grn.receipt_date}</td>
                          <td className="px-6 py-4 text-sm">{grn.qty_received}/{grn.total_qty}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              grn.quality === "pass" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}>
                              {grn.quality}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">{getStatusBadge(grn.status)}</td>
                          <td className="px-6 py-4 text-sm">
                            {getInvoiceBadge(grn)}
                            {grn.invoice_number && (
                              <div className="text-xs text-indigo-600 mt-1">{grn.invoice_number}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button onClick={() => openEditModal(grn)} className="text-orange-600 hover:text-orange-800" title="Edit" disabled={grn.status === "completed"}>
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleCancelGRN(grn)} className="text-red-600 hover:text-red-800" title="Cancel" disabled={grn.status === "completed"}>
                                <XCircle size={18} />
                              </button>
                              <button onClick={() => downloadPDF(grn)} className="text-emerald-600 hover:text-emerald-800" title="Download PDF">
                                <Download size={18} />
                              </button>
                              <button className="text-blue-600 hover:text-blue-800" title="View">
                                <Eye size={18} />
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

          {/* CREATE FORM */}
          {activeTab === "create" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Create Goods Receipt Note</h2>
              <div className="max-w-4xl">
                <label className="block text-sm font-medium mb-2">Select PO</label>
                <select
                  value={selectedPO?.id || ""}
                  onChange={(e) => {
                    const po = pendingPOs.find(p => p.id === +e.target.value);
                    setSelectedPO(po);
                    if (po) {
                      const qty = {};
                      po.items.forEach(item => {
                        qty[item.description] = item.qty - (item.received || 0);
                      });
                      setReceiptQty(qty);
                    }
                  }}
                  className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Choose PO</option>
                  {pendingPOs.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.supplier} (₹{po.amount?.toLocaleString()})
                    </option>
                  ))}
                </select>

                {selectedPO && (
                  <>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-lg mb-6">
                      <h3 className="font-semibold mb-3">Items to Receive</h3>
                      <div className="space-y-3">
                        {selectedPO.items.map((item, i) => {
                          const pending = item.qty - (item.received || 0);
                          return pending > 0 ? (
                            <div key={i} className="flex items-center gap-4 text-sm">
                              <span className="w-40 font-medium">{item.description}</span>
                              <span className="w-28 text-gray-600">Ordered: {item.qty} | Pending: {pending}</span>
                              <input
                                type="number"
                                min="0"
                                max={pending}
                                value={receiptQty[item.description] || 0}
                                onChange={(e) => setReceiptQty({
                                  ...receiptQty,
                                  [item.description]: Math.min(+e.target.value, pending)
                                })}
                                className="w-24 p-2 border rounded focus:ring-emerald-500"
                              />
                              <span className="text-gray-500">Received</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qualityPass}
                          onChange={(e) => setQualityPass(e.target.checked)}
                          className="w-5 h-5 text-emerald-600 rounded"
                        />
                        <span className="font-medium">Quality Check Passed</span>
                      </label>
                      {!qualityPass && (
                        <textarea
                          placeholder="Remarks for rejection (required)"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full mt-3 p-3 border rounded-lg focus:ring-emerald-500"
                          rows="3"
                          required
                        />
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCreateGRN}
                        disabled={!selectedPO || Object.values(receiptQty).every(q => q === 0) || (!qualityPass && !remarks.trim())}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                      >
                        <ClipboardCheck size={18} /> Create GRN
                      </button>
                      <button onClick={resetForm} className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400">
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* EDIT MODAL */}
          {editingGRN && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                <h3 className="text-xl font-bold mb-4">Edit GRN: {editingGRN.grn_number}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Quality</label>
                    <select
                      value={editingGRN.quality}
                      onChange={(e) => setEditingGRN({ ...editingGRN, quality: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                  </div>
                  {editingGRN.quality === "fail" && (
                    <textarea
                      value={editingGRN.remarks}
                      onChange={(e) => setEditingGRN({ ...editingGRN, remarks: e.target.value })}
                      className="w-full p-2 border rounded"
                      rows="3"
                      placeholder="Remarks"
                    />
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditingGRN(null)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleUpdateGRN} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}