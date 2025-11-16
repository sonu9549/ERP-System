// src/pages/Procurement/PaymentModule.jsx
import { useState, useEffect, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
  IndianRupee,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Building2,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function PaymentModule() {
  const {
    invoices,
    payments: contextPayments,
    pos,
    grns,
    fetchInvoices,
    makePayment,
    updatePaymentStatus,
    loading,
  } = useProcurement();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    method: "bank_transfer",
    reference: "",
    payment_date: "",
    amount: "",
    proof: null,
  });

  // Sync local payments with context
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setPayments(contextPayments);
  }, [contextPayments]);

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Find matched invoices: PO + GRN + Invoice
  const payableInvoices = useMemo(() => {
    if (!invoices || !pos || !grns) return [];

    return invoices
      .filter((inv) => {
        const po = pos.find((p) => p.po_number === inv.po_number);
        const grn = grns.find((g) => g.po_number === inv.po_number);
        return po && grn && inv.status === "matched";
      })
      .map((inv) => {
        const po = pos.find((p) => p.po_number === inv.po_number);
        return {
          ...inv,
          vendor: po?.supplier || "Unknown",
        };
      });
  }, [invoices, pos, grns]);

  const handleMakePayment = () => {
    if (!selectedInvoice || !paymentData.amount || !paymentData.payment_date) {
      toast.error("Please fill all required fields");
      return;
    }

    const paymentDate = new Date(paymentData.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newPayment = {
      id: Date.now(),
      payment_id: `PAY-2025-${String(Date.now()).slice(-4)}`,
      invoice_number: selectedInvoice.invoice_number,
      vendor: selectedInvoice.vendor,
      amount: parseFloat(paymentData.amount),
      method: paymentData.method,
      reference: paymentData.reference,
      payment_date: paymentData.payment_date,
      status: paymentDate > today ? "scheduled" : "completed",
      proof: paymentData.proof,
    };

    makePayment(newPayment);
    toast.success(`Payment ${newPayment.payment_id} processed!`);

    // Reset form
    setPaymentData({
      method: "bank_transfer",
      reference: "",
      payment_date: "",
      amount: "",
      proof: null,
    });
    setSelectedInvoice(null);
    setActiveTab("all");
  };

  const filteredPayments = useMemo(() => {
    return payments
      .filter(
        (p) =>
          p.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((p) => filterStatus === "all" || p.status === filterStatus);
  }, [payments, searchTerm, filterStatus]);

  const tabs = [
    { id: "all", label: "All Payments", icon: IndianRupee },
    { id: "make", label: "Make Payment", icon: Send },
    { id: "scheduled", label: "Scheduled", icon: Clock },
    { id: "completed", label: "Completed", icon: CheckCircle },
    { id: "failed", label: "Failed", icon: XCircle },
  ];

  const getStatusBadge = (status) => {
    const config = {
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      scheduled: { color: "bg-blue-100 text-blue-800", icon: Clock },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    const { color, icon: Icon } = config[status] || {
      color: "bg-gray-100 text-gray-700",
      icon: XCircle,
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}
      >
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const viewProof = (payment) => {
    if (payment.proof) {
      const url = URL.createObjectURL(payment.proof);
      window.open(url, "_blank");
    } else {
      toast("No proof attached", { icon: "Info" });
    }
  };

  const downloadReceipt = (payment) => {
    const content = `
      PAYMENT RECEIPT
      ID: ${payment.payment_id}
      Invoice: ${payment.invoice_number}
      Vendor: ${payment.vendor}
      Amount: ₹${payment.amount.toLocaleString()}
      Method: ${payment.method.replace("_", " ").toUpperCase()}
      Date: ${payment.payment_date}
      Status: ${payment.status.toUpperCase()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payment.payment_id}_receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading payments...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
              <p className="text-gray-500 mt-1">
                Release payments after 3-way matching
              </p>
            </div>
            <button
              onClick={fetchInvoices}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Sync Invoices
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
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
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

          {/* Payment List */}
          {["all", "scheduled", "completed", "failed"].includes(activeTab) && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search Payment ID, Invoice#, Vendor..."
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
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Invoice#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
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
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-12 text-gray-500"
                        >
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                            {pay.payment_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-purple-600">
                            {pay.invoice_number}
                          </td>
                          <td className="px-6 py-4 text-sm">{pay.vendor}</td>
                          <td className="px-6 py-4 text-sm font-medium">
                            ₹{pay.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm capitalize">
                            {pay.method.replace("_", " ")}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {pay.payment_date}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {getStatusBadge(pay.status)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              {pay.proof && (
                                <button
                                  onClick={() => viewProof(pay)}
                                  title="View Proof"
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Eye size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => downloadReceipt(pay)}
                                title="Download Receipt"
                                className="text-gray-600 hover:text-gray-800"
                              >
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

          {/* Make Payment Form */}
          {activeTab === "make" && (
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">
                Make Vendor Payment
              </h2>

              <div className="max-w-4xl">
                <label className="block text-sm font-medium mb-2">
                  Select Matched Invoice
                </label>
                <select
                  value={selectedInvoice?.id || ""}
                  onChange={(e) => {
                    const inv = payableInvoices.find(
                      (i) => i.id === +e.target.value
                    );
                    setSelectedInvoice(inv);
                    if (inv) {
                      setPaymentData((prev) => ({
                        ...prev,
                        amount: inv.amount,
                      }));
                    }
                  }}
                  className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a matched invoice</option>
                  {payableInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.vendor} (₹
                      {inv.amount.toLocaleString()}) - Due: {inv.due_date}
                    </option>
                  ))}
                </select>

                {selectedInvoice && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Payment Method
                        </label>
                        <select
                          value={paymentData.method}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              method: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-lg focus:ring-indigo-500"
                        >
                          <option value="bank_transfer">
                            Bank Transfer (NEFT/RTGS)
                          </option>
                          <option value="upi">UPI</option>
                          <option value="cheque">Cheque</option>
                          <option value="credit_card">Credit Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Reference / UTR / Cheque No.
                        </label>
                        <input
                          placeholder="e.g., UPI123456 or NEFT987654"
                          value={paymentData.reference}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              reference: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-lg focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Payment Date
                        </label>
                        <input
                          type="date"
                          value={paymentData.payment_date}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              payment_date: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-lg focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={paymentData.amount}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              amount: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-lg focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        Upload Payment Proof (PDF/Image)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            proof: e.target.files[0],
                          })
                        }
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg mb-6">
                      <h3 className="font-semibold mb-2">Payment Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Vendor:</strong> {selectedInvoice.vendor}
                        </div>
                        <div>
                          <strong>Invoice#:</strong>{" "}
                          {selectedInvoice.invoice_number}
                        </div>
                        <div>
                          <strong>Amount:</strong> ₹{paymentData.amount}
                        </div>
                        <div>
                          <strong>Method:</strong>{" "}
                          {paymentData.method.replace("_", " ").toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleMakePayment}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-md flex items-center gap-2"
                      >
                        <Send size={18} /> Process Payment
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(null);
                          setPaymentData({
                            method: "bank_transfer",
                            reference: "",
                            payment_date: "",
                            amount: "",
                            proof: null,
                          });
                        }}
                        className="bg-gray-300 px-6 py-2 rounded-lg"
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
    </>
  );
}
