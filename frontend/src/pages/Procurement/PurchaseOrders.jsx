// src/pages/Procurement/PurchaseOrderModule.jsx
import { useState, useEffect, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  FileText,
  Plus,
  Package,
  Clock,
  AlertCircle,
  Download,
  Search,
  Filter,
  Calendar,
  IndianRupee,
  Eye,
  CheckCircle,
  RefreshCw,
  X,
  Mail,
  Printer,
  Edit,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function PurchaseOrderModule() {
  const {
    prs,
    rfqs,
    quotes,
    pos,
    awardPO,
    fetchPRs,
    loading,
    updatePO,
    cancelPO,
  } = useProcurement();

  /* ------------------------------------------------------------------ */
  /*  GLOBAL UI STATE                                                   */
  /* ------------------------------------------------------------------ */
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ------------------------------------------------------------------ */
  /*  WIZARD STATE (3-step)                                            */
  /* ------------------------------------------------------------------ */
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1 | 2 | 3
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [poForm, setPoForm] = useState({
    due_date: "",
    terms: "Net 10 Days\nFOB Destination\nPayment via Bank Transfer",
    notes: "",
  });

  /* ------------------------------------------------------------------ */
  /*  EDIT / CANCEL STATE                                               */
  /* ------------------------------------------------------------------ */
  const [editingPO, setEditingPO] = useState(null);
  const [editForm, setEditForm] = useState({
    due_date: "",
    terms: "",
    notes: "",
    status: "",
  });

  /* ------------------------------------------------------------------ */
  /*  AUTO-CREATE PO ON AWARD (unchanged)                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const awardedQuotes = quotes.filter((q) => q.status === "awarded");

    awardedQuotes.forEach((q) => {
      const rfq = rfqs.find((r) => r.id === q.rfq_id);
      const pr = prs.find((p) => p.pr_number === rfq?.pr_number);
      if (!pr || !rfq) return;

      const alreadyExists = pos.some(
        (po) => po.supplier === q.supplier && po.pr_number === pr.pr_number
      );
      if (alreadyExists) return;

      const newPO = {
        id: Date.now() + Math.random(),
        po_number: `PO-${new Date().getFullYear()}-${String(
          pos.length + 1
        ).padStart(4, "0")}`,
        supplier: q.supplier,
        amount: q.amount,
        pr_number: pr.pr_number,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: "pending",
        items: pr.items.map((item) => ({
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          amount: item.qty * item.rate,
        })),
      };

      awardPO(q, pr, newPO);
    });
  }, [quotes, pos, rfqs, prs, awardPO]);

  /* ------------------------------------------------------------------ */
  /*  WIZARD HELPERS                                                    */
  /* ------------------------------------------------------------------ */
  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setSelectedQuote(null);
    setPoForm({
      due_date: "",
      terms: "Net 10 Days\nFOB Destination\nPayment via Bank Transfer",
      notes: "",
    });
  };

  const handleNext = () => {
    // Step 1 → Step 2 : need a quote
    if (wizardStep === 1 && !selectedQuote) {
      toast.error("Please select an awarded quote");
      return;
    }
    // Step 2 → Step 3 : need due date
    if (wizardStep === 2 && !poForm.due_date) {
      toast.error("Due date is required");
      return;
    }
    setWizardStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setWizardStep((s) => Math.max(s - 1, 1));

  const handleIssuePO = () => {
    if (!selectedQuote) return;

    const rfq = rfqs.find((r) => r.id === selectedQuote.rfq_id);
    const pr = prs.find((p) => p.pr_number === rfq?.pr_number);
    if (!pr || !rfq) {
      toast.error("PR / RFQ not found");
      return;
    }

    const alreadyIssued = pos.some(
      (po) =>
        po.supplier === selectedQuote.supplier && po.pr_number === pr.pr_number
    );
    if (alreadyIssued) {
      toast.error("PO already issued for this quote");
      return;
    }

    const newPO = {
      id: Date.now(),
      po_number: `PO-${new Date().getFullYear()}-${String(
        pos.length + 1
      ).padStart(4, "0")}`,
      supplier: selectedQuote.supplier,
      amount: selectedQuote.amount,
      pr_number: pr.pr_number,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: poForm.due_date,
      status: "pending",
      items: pr.items.map((item) => ({
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        amount: item.qty * item.rate,
      })),
      terms: poForm.terms,
      notes: poForm.notes,
    };

    awardPO(selectedQuote, pr, newPO);
    toast.success(`PO ${newPO.po_number} issued`);
    resetWizard();
    setActiveTab("all");
  };

  /* ------------------------------------------------------------------ */
  /*  EDIT / CANCEL / STATUS CHANGE (unchanged)                         */
  /* ------------------------------------------------------------------ */
  const openEditModal = (po) => {
    if (["delivered", "cancelled"].includes(po.status)) {
      toast.error(`Cannot edit ${po.status} PO`);
      return;
    }
    setEditingPO(po);
    setEditForm({
      due_date: po.due_date,
      terms: po.terms || "",
      notes: po.notes || "",
      status: po.status,
    });
  };

  const handleUpdatePO = () => {
    if (!editForm.due_date) {
      toast.error("Due date is required");
      return;
    }
    const updated = {
      ...editingPO,
      due_date: editForm.due_date,
      terms: editForm.terms,
      notes: editForm.notes,
      status: editForm.status,
    };
    updatePO(editingPO.id, updated);
    toast.success(`PO ${editingPO.po_number} updated`);
    setEditingPO(null);
  };

  const handleCancelPO = (po) => {
    if (po.status === "delivered") {
      toast.error("Cannot cancel delivered PO");
      return;
    }
    if (po.status === "cancelled") {
      toast.error("Already cancelled");
      return;
    }
    if (window.confirm(`Cancel PO ${po.po_number}?`)) {
      cancelPO(po.id);
      toast.success(`PO ${po.po_number} cancelled`);
    }
  };

  const handleStatusChange = (poId, newStatus) => {
    const po = pos.find((p) => p.id === poId);
    if (!po) return;
    if (po.status === "delivered" && newStatus !== "delivered") {
      toast.error("Cannot change delivered PO");
      return;
    }
    updatePO(poId, { ...po, status: newStatus });
    toast.success(`Status → ${newStatus}`);
  };

  /* ------------------------------------------------------------------ */
  /*  FILTERED PO LIST (memoised)                                      */
  /* ------------------------------------------------------------------ */
  const filteredPOs = useMemo(() => {
    if (!Array.isArray(pos)) return [];

    return pos
      .filter((po) => po && typeof po === "object")
      .filter((po) => {
        const s = searchTerm.toLowerCase();
        return (
          (po.po_number || "").toLowerCase().includes(s) ||
          (po.supplier || "").toLowerCase().includes(s) ||
          (po.pr_number || "").includes(s)
        );
      })
      .filter((po) => filterStatus === "all" || po.status === filterStatus)
      .sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date));
  }, [pos, searchTerm, filterStatus]);

  /* ------------------------------------------------------------------ */
  /*  TABS & BADGES (unchanged)                                        */
  /* ------------------------------------------------------------------ */
  const tabs = [
    { id: "all", label: "All POs", icon: FileText },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "delivered", label: "Delivered", icon: Package },
    { id: "overdue", label: "Overdue", icon: AlertCircle },
    { id: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  const getStatusBadge = (status) => {
    const cfg = {
      pending: { c: "bg-yellow-100 text-yellow-800", i: Clock },
      delivered: { c: "bg-green-100 text-green-800", i: CheckCircle },
      overdue: { c: "bg-red-100 text-red-800", i: AlertCircle },
      cancelled: { c: "bg-gray-100 text-gray-600", i: XCircle },
    };
    const { c, i: Icon } = cfg[status?.toLowerCase()] || {
      c: "bg-gray-100 text-gray-700",
      i: AlertCircle,
    };
    const txt = status
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : "Unknown";
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${c}`}
      >
        <Icon size={14} /> {txt}
      </span>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  PDF / PRINT / EMAIL (unchanged)                                   */
  /* ------------------------------------------------------------------ */
  const downloadPDF = (po) => {
    const doc = new jsPDF("p", "mm", "a4");
    const w = doc.internal.pageSize.getWidth();

    doc
      .setFontSize(22)
      .setFont("helvetica", "bold")
      .setTextColor(255, 140, 0)
      .text("ACME CORPORATION", w / 2, 20, { align: "center" });

    doc
      .setFontSize(10)
      .setTextColor(100, 100, 100)
      .setFont("helvetica", "normal")
      .text("Mumbai, India | GSTIN: 27AAAAA0000A1Z5", w / 2, 27, {
        align: "center",
      });

    doc
      .setFontSize(18)
      .setTextColor(0, 0, 0)
      .setFont("helvetica", "bold")
      .text("PURCHASE ORDER", w / 2, 45, { align: "center" });

    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(`PO#: ${po.po_number}`, 20, 60);
    doc.text(`Issue: ${po.issue_date}`, 20, 66);
    doc.text(`Due: ${po.due_date}`, 20, 72);
    doc.text(`Vendor: ${po.supplier}`, 20, 78);
    doc.text(`PR#: ${po.pr_number}`, 20, 84);
    doc.text(`Status: ${po.status.toUpperCase()}`, 20, 90);

    const items =
      po.items?.map((it, i) => [
        i + 1,
        it.description || "Item",
        it.qty || 1,
        `₹${(it.rate || 0).toLocaleString()}`,
        `₹${(it.amount || 0).toLocaleString()}`,
      ]) || [];

    doc.autoTable({
      startY: 100,
      head: [["#", "Description", "Qty", "Rate", "Amount"]],
      body: items,
      theme: "grid",
      headStyles: { fillColor: [255, 140, 0], textColor: [255, 255, 255] },
      columnStyles: { 4: { halign: "right" } },
    });

    const finalY = doc.lastAutoTable.finalY;
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .text(`Total: ₹${po.amount.toLocaleString()}`, w - 60, finalY + 15);

    const blob = doc.output("blob");
    saveAs(blob, `${po.po_number}.pdf`);
    toast.success(`Downloaded ${po.po_number}.pdf`);
  };

  const printPO = (po) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>${po.po_number}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;}</style></head>
      <body><h1>${po.po_number}</h1>
      <p><strong>Vendor:</strong> ${po.supplier}</p>
      <p><strong>Amount:</strong> ₹${po.amount.toLocaleString()}</p>
      <p><strong>Due:</strong> ${po.due_date}</p>
      <p><strong>Status:</strong> ${po.status}</p>
      <script>window.print();setTimeout(()=>window.close(),1000);</script>
      </body></html>
    `);
  };

  const emailPO = (po) => toast.success(`Email sent to ${po.supplier}`);

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  if (loading) return <div className="text-center py-20 text-xl">Loading…</div>;

  return (
    <>
      <Toaster position="top-right" />

      {/* ==================== MAIN LAYOUT ==================== */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Purchase Orders
              </h1>
              <p className="text-gray-500 mt-1">
                Full CRUD + 3-step PO issuance wizard
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPRs}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw size={18} /> Sync
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:shadow-md flex items-center gap-2"
              >
                <Plus size={18} /> Issue PO
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? "bg-orange-600 text-white"
                      : "text-gray-600 hover:text-orange-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* PO LIST (only for list tabs) */}
          {["all", "pending", "delivered", "overdue", "cancelled"].includes(
            activeTab
          ) && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              {/* SEARCH + FILTER */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search PO#, Vendor, PR#..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        PO#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        PR#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due
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
                    {filteredPOs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-12 text-gray-500"
                        >
                          No POs found
                        </td>
                      </tr>
                    ) : (
                      filteredPOs.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-bold text-orange-600">
                            {po.po_number}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {po.supplier}
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-600">
                            {po.pr_number}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">
                            ₹{po.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={
                                po.status === "overdue"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {po.due_date}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <select
                              value={po.status}
                              onChange={(e) =>
                                handleStatusChange(po.id, e.target.value)
                              }
                              className={`text-xs px-2 py-1 rounded-full border ${
                                ["cancelled", "delivered"].includes(po.status)
                                  ? "opacity-60 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={["delivered", "cancelled"].includes(
                                po.status
                              )}
                            >
                              <option value="pending">Pending</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(po)}
                                title="Edit"
                                disabled={["delivered", "cancelled"].includes(
                                  po.status
                                )}
                                className="text-orange-600 hover:text-orange-800 disabled:opacity-40"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleCancelPO(po)}
                                title="Cancel"
                                disabled={["delivered", "cancelled"].includes(
                                  po.status
                                )}
                                className="text-red-600 hover:text-red-800 disabled:opacity-40"
                              >
                                <XCircle size={18} />
                              </button>
                              <button
                                onClick={() => downloadPDF(po)}
                                title="Download"
                                className="text-orange-600 hover:text-orange-800"
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={() => printPO(po)}
                                title="Print"
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Printer size={18} />
                              </button>
                              <button
                                onClick={() => emailPO(po)}
                                title="Email"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Mail size={18} />
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
        </div>
      </div>

      {/* ============================================================= */}
      {/*  3-STEP WIZARD MODAL                                          */}
      {/* ============================================================= */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Header + Close */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Issue Purchase Order</h2>
              <button
                onClick={resetWizard}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center mb-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`flex-1 h-2 rounded-full ${
                    wizardStep >= n ? "bg-orange-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-4">
              <span>1. Select Quote</span>
              <span>2. Set Details</span>
              <span>3. Confirm</span>
            </div>

            {/* ==================== STEP 1 ==================== */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Select Awarded Quote
                </label>
                <select
                  value={selectedQuote?.id || ""}
                  onChange={(e) => {
                    const q = quotes.find((qq) => qq.id === +e.target.value);
                    setSelectedQuote(q || null);
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Choose Quote --</option>
                  {quotes
                    .filter((q) => q.status === "awarded")
                    .map((q) => {
                      const rfq = rfqs.find((r) => r.id === q.rfq_id);
                      const pr = prs.find(
                        (p) => p.pr_number === rfq?.pr_number
                      );
                      return (
                        <option key={q.id} value={q.id}>
                          {q.supplier} – ₹{q.amount.toLocaleString()} (
                          {pr?.pr_number || "—"})
                        </option>
                      );
                    })}
                </select>

                {selectedQuote && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg text-sm">
                    <p>
                      <strong>Vendor:</strong> {selectedQuote.supplier}
                    </p>
                    <p>
                      <strong>Amount:</strong> ₹
                      {selectedQuote.amount.toLocaleString()}
                    </p>
                    <p>
                      <strong>PR#:</strong>{" "}
                      {
                        prs.find(
                          (p) =>
                            p.pr_number ===
                            rfqs.find((r) => r.id === selectedQuote.rfq_id)
                              ?.pr_number
                        )?.pr_number
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== STEP 2 ==================== */}
            {wizardStep === 2 && selectedQuote && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={poForm.due_date}
                      onChange={(e) =>
                        setPoForm({ ...poForm, due_date: e.target.value })
                      }
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={poForm.notes}
                      onChange={(e) =>
                        setPoForm({ ...poForm, notes: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={poForm.terms}
                    onChange={(e) =>
                      setPoForm({ ...poForm, terms: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}

            {/* ==================== STEP 3 ==================== */}
            {wizardStep === 3 && selectedQuote && (
              <div className="space-y-5">
                <h3 className="font-semibold text-lg">Confirm PO Details</h3>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">PO Number (auto)</span>
                    <span>
                      PO-
                      {new Date().getFullYear()}-
                      {String(pos.length + 1).padStart(4, "0")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Vendor</span>
                    <span>{selectedQuote.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount</span>
                    <span>₹{selectedQuote.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">PR#</span>
                    <span>
                      {
                        prs.find(
                          (p) =>
                            p.pr_number ===
                            rfqs.find((r) => r.id === selectedQuote.rfq_id)
                              ?.pr_number
                        )?.pr_number
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Issue Date</span>
                    <span>{new Date().toISOString().split("T")[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Due Date</span>
                    <span>{poForm.due_date}</span>
                  </div>
                  {poForm.notes && (
                    <div className="flex justify-between">
                      <span className="font-medium">Notes</span>
                      <span>{poForm.notes}</span>
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 p-3 rounded-lg text-sm">
                  <strong>Terms:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{poForm.terms}</pre>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={wizardStep === 1 ? resetWizard : handleBack}
                className="px-5 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {wizardStep === 1 ? (
                  <>Cancel</>
                ) : (
                  <>
                    <ChevronLeft size={18} /> Back
                  </>
                )}
              </button>

              {wizardStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (wizardStep === 1 && !selectedQuote) ||
                    (wizardStep === 2 && !poForm.due_date)
                  }
                  className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-2 rounded-lg hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleIssuePO}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-2 rounded-lg hover:shadow-md flex items-center gap-2"
                >
                  <CheckCircle size={18} /> Issue PO
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/*  EDIT PO MODAL (unchanged)                                    */}
      {/* ============================================================= */}
      {editingPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Edit PO: {editingPO.po_number}
              </h2>
              <button
                onClick={() => setEditingPO(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, due_date: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Terms</label>
                <textarea
                  rows={3}
                  value={editForm.terms}
                  onChange={(e) =>
                    setEditForm({ ...editForm, terms: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingPO(null)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePO}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-2 rounded-lg hover:shadow-md flex items-center gap-2"
              >
                <CheckCircle size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
