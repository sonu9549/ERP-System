// src/pages/Procurement/RFQModule.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  FileText,
  Send,
  Package,
  Award,
  GitCompare,
  RefreshCw,
  CheckCircle,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function RFQModule() {
  const {
    prs,
    rfqs,
    quotes,
    pos,
    raiseRFQ,
    receiveQuote,
    awardPO,
    fetchPRs,
    loading,
  } = useProcurement();

  const [activeTab, setActiveTab] = useState("all");
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const currentUser = "Rahul";
  const mockRan = useRef(false);

  /* --------------------------------------------------------------
     1. FETCH PRs + AUTO MOCK RFQ + QUOTES (ONCE)
     -------------------------------------------------------------- */
  useEffect(() => {
    if (prs.length === 0 && !loading) {
      fetchPRs();
    }
  }, [prs.length, loading, fetchPRs]);

  useEffect(() => {
    // Run only once when PRs are loaded and no RFQ exists
    if (mockRan.current || rfqs.length > 0 || prs.length === 0) return;

    const approvedPR = prs.find((p) => p.status === "approved");
    if (!approvedPR) return;

    mockRan.current = true;

    // Step 1: Create RFQ
    const newRFQ = raiseRFQ({
      pr_number: approvedPR.pr_number,
      suppliers: ["Supplier A", "Supplier B"],
    });

    // Step 2: Auto receive 2 quotes after 1.5s
    setTimeout(() => {
      receiveQuote({
        rfq_id: newRFQ.id,
        supplier: "Supplier A",
        amount: 87000,
        valid_till: "2025-11-18",
      });
      receiveQuote({
        rfq_id: newRFQ.id,
        supplier: "Supplier B",
        amount: 85500,
        valid_till: "2025-11-19",
      });
      toast.success("2 quotes received for RFQ-" + newRFQ.id);
    }, 1500);
  }, [prs, rfqs.length, raiseRFQ, receiveQuote]);

  /* --------------------------------------------------------------
     HANDLERS
     -------------------------------------------------------------- */
  const handleCreateRFQ = () => {
    if (!selectedPR || selectedSuppliers.length === 0) {
      toast.error("Select PR and suppliers");
      return;
    }
    const rfq = raiseRFQ({
      pr_number: selectedPR.pr_number,
      suppliers: selectedSuppliers,
    });
    toast.success(`RFQ-${rfq.id} sent!`);
    setSelectedPR(null);
    setSelectedSuppliers([]);
    setActiveTab("all");
  };

  const handleAward = (quote) => {
    const rfq = rfqs.find((r) => r.id === quote.rfq_id);
    const pr = prs.find((p) => p.pr_number === rfq.pr_number);
    if (!pr) return toast.error("PR not found");

    awardPO(quote, pr);
    toast.success(`PO awarded to ${quote.supplier}!`);
    setSelectedQuote(null);
    setActiveTab("all");
  };

  /* --------------------------------------------------------------
     HELPERS
     -------------------------------------------------------------- */
  const approvedPRs = useMemo(
    () => prs.filter((p) => p.status === "approved"),
    [prs]
  );
  const getQuotesForRFQ = (rfq_id) => quotes.filter((q) => q.rfq_id === rfq_id);
  const getPOForQuote = (quote_id) =>
    pos.find(
      (po) => po.supplier === quotes.find((q) => q.id === quote_id)?.supplier
    );

  /* --------------------------------------------------------------
     TABS
     -------------------------------------------------------------- */
  const tabs = [
    { id: "all", label: "All RFQs", icon: FileText },
    { id: "create", label: "Create RFQ", icon: Plus },
    { id: "my", label: "My RFQs", icon: Send },
    { id: "quotes", label: "Received Quotes", icon: Package },
    { id: "compare", label: "Compare Quotes", icon: GitCompare },
    { id: "award", label: "Award PO", icon: Award },
  ];

  const filteredRFQs = useMemo(() => {
    let list = rfqs;
    if (activeTab === "my") {
      list = rfqs.filter(
        (rfq) =>
          prs.find((p) => p.pr_number === rfq.pr_number)?.user === currentUser
      );
    }
    return list.sort((a, b) => b.id - a.id);
  }, [rfqs, activeTab, prs, currentUser]);

  /* --------------------------------------------------------------
     LOADING
     -------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                RFQ Management
              </h1>
              <p className="text-gray-500">Send RFQ → Get Quotes → Award PO</p>
            </div>
            <button
              onClick={fetchPRs}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-t-xl shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* CREATE RFQ */}
          {activeTab === "create" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Select Approved PR
                </h2>
                <select
                  value={selectedPR?.id || ""}
                  onChange={(e) =>
                    setSelectedPR(
                      approvedPRs.find((p) => p.id === +e.target.value) || null
                    )
                  }
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Choose PR</option>
                  {approvedPRs.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.pr_number} - ₹{pr.amount.toLocaleString()} ({pr.dept})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPR && (
                <>
                  <div>
                    <h3 className="font-medium mb-2">Select Suppliers</h3>
                    {["Supplier A", "Supplier B", "Supplier C"].map((s) => (
                      <label key={s} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(s)}
                          onChange={(e) => {
                            setSelectedSuppliers((prev) =>
                              e.target.checked
                                ? [...prev, s]
                                : prev.filter((x) => x !== s)
                            );
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleCreateRFQ}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                  >
                    <Send size={18} /> Send RFQ
                  </button>
                </>
              )}
            </div>
          )}

          {/* ALL / MY RFQs */}
          {(activeTab === "all" || activeTab === "my") && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      RFQ ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      PR#
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Suppliers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quotes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRFQs.map((rfq) => {
                    const count = getQuotesForRFQ(rfq.id).length;
                    const status =
                      count === 0
                        ? "sent"
                        : count < rfq.suppliers.length
                        ? "partial"
                        : "complete";
                    return (
                      <tr key={rfq.id}>
                        <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                          RFQ-{rfq.id}
                        </td>
                        <td className="px-6 py-4 text-sm">{rfq.pr_number}</td>
                        <td className="px-6 py-4 text-sm">
                          {rfq.suppliers.join(", ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          {count}/{rfq.suppliers.length}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              status === "sent"
                                ? "bg-blue-100 text-blue-800"
                                : status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* RECEIVED QUOTES */}
          {activeTab === "quotes" && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quote ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      RFQ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No quotes received
                      </td>
                    </tr>
                  ) : (
                    quotes.map((q) => (
                      <tr key={q.id}>
                        <td className="px-6 py-4 text-sm font-medium">
                          Q-{q.id}
                        </td>
                        <td className="px-6 py-4 text-sm">RFQ-{q.rfq_id}</td>
                        <td className="px-6 py-4 text-sm">{q.supplier}</td>
                        <td className="px-6 py-4 text-sm font-medium">
                          ₹{q.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setSelectedQuote(q);
                              setActiveTab("compare");
                            }}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye size={16} /> Compare
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* COMPARE QUOTES */}
          {activeTab === "compare" && selectedQuote && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">
                Compare Quotes for RFQ-{selectedQuote.rfq_id}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getQuotesForRFQ(selectedQuote.rfq_id).map((q) => (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer ${
                      q.id === selectedQuote.id
                        ? "border-indigo-500 shadow-lg"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedQuote(q)}
                  >
                    <h4 className="font-semibold">{q.supplier}</h4>
                    <p className="text-2xl font-bold">
                      ₹{q.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Valid: {q.valid_till}
                    </p>
                    {q.id === selectedQuote.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("award");
                        }}
                        className="mt-3 w-full bg-indigo-600 text-white py-2 rounded"
                      >
                        Award PO
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AWARD PO */}
          {activeTab === "award" && selectedQuote && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Award size={48} className="mx-auto text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Award PO</h3>
              <p className="text-gray-600 mb-4">
                Confirm: <strong>{selectedQuote.supplier}</strong> at{" "}
                <strong>₹{selectedQuote.amount.toLocaleString()}</strong>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleAward(selectedQuote)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg"
                >
                  Confirm & Award
                </button>
                <button
                  onClick={() => setActiveTab("compare")}
                  className="bg-gray-300 px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
