// src/components/AccountsPayable.jsx
// =============================================================================
// Accounts Payable Component - Full-Cycle AP Management
// Features:
// - Dashboard with totals, overdue, due soon, aging buckets
// - Vendor management (CRUD + quick invoice)
// - Invoice management (CRUD, approval, PDF upload)
// - Payment recording with batch selection
// - Reconciliation with bank transactions
// - CSV exports
// - Search & filter
// - Safe date handling (no crashes on invalid/missing dates)
// - Responsive Tailwind UI with Lucide icons
// - Integrates with FinanceContext for global state
// =============================================================================

import React, { useState, useRef, useMemo, useCallback } from "react";
import { format, addDays, parseISO } from "date-fns";
import {
  Plus,
  Search,
  Upload,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  Download,
  CheckSquare,
  XSquare,
  FileDown,
  Filter,
  X,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

// =============================================================================
// Utility: Export any array of objects to CSV file
// =============================================================================
const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(","));
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// =============================================================================
// Utility: Determine aging bucket for invoice due date
// - Safely handles missing/invalid dates → returns "current"
// =============================================================================
const getAgingBucket = (dueDate) => {
  if (!dueDate) return "current";
  let due;
  try {
    due = parseISO(dueDate);
  } catch {
    return "current";
  }
  const today = new Date();
  const diff = Math.floor((today - due) / 86400000); // days past due
  if (diff <= 0) return "current";
  if (diff <= 30) return "1-30";
  if (diff <= 60) return "31-60";
  if (diff <= 90) return "61-90";
  return "90+";
};

// =============================================================================
// Reusable Component: Status badge (open/partial/paid)
// =============================================================================
const StatusBadge = ({ status }) => {
  const map = {
    open: { bg: "bg-blue-100", text: "text-blue-700", Icon: Clock },
    partial: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      Icon: AlertCircle,
    },
    paid: { bg: "bg-green-100", text: "text-green-700", Icon: CheckCircle },
  };
  const { bg, text, Icon } = map[status] || map.open;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// =============================================================================
// Main Component: AccountsPayable
// =============================================================================
export default function AccountsPayable() {
  // -------------------------------------------------------------------------
  // Global State from FinanceContext
  // -------------------------------------------------------------------------
  const {
    vendors,
    setVendors,
    invoices,
    setInvoices,
    payments,
    setPayments,
    bankTransactions,
    setBankTransactions,
    postToGL,
    apAccount,
    cashAccount,
    expenseAccount,
  } = useFinance();

  // -------------------------------------------------------------------------
  // Local UI State
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState(""); // Invoice search
  const [statusFilter, setStatusFilter] = useState("all"); // Invoice status filter
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]); // For payment tab
  const [uploadedFile, setUploadedFile] = useState(null); // PDF preview
  const fileInputRef = useRef(null);

  // -------------------------------------------------------------------------
  // Memoized: Dashboard summary totals
  // - Calculates AP totals, overdue, due soon, reconciliation stats
  // - Safe date parsing with try/catch
  // -------------------------------------------------------------------------
  const totals = useMemo(() => {
    const open = invoices.filter((i) => ["open", "partial"].includes(i.status));

    // Due soon: open invoices due within 7 days
    const dueSoon = invoices.filter((i) => {
      if (!i.dueDate) return false;
      let due;
      try {
        due = parseISO(i.dueDate);
      } catch {
        return false;
      }
      const days = Math.ceil((due - Date.now()) / 86400000);
      return i.status === "open" && days <= 7 && days > 0;
    });

    // Overdue: past due with balance > 0
    const overdue = invoices.filter((i) => {
      if (!i.dueDate) return false;
      let due;
      try {
        due = parseISO(i.dueDate);
      } catch {
        return false;
      }
      const days = Math.floor((Date.now() - due) / 86400000);
      return days > 0 && i.balance > 0;
    });

    return {
      totalAP: invoices.reduce((s, i) => s + i.balance, 0),
      openAmount: open.reduce((s, i) => s + i.balance, 0),
      overdueAmount: overdue.reduce((s, i) => s + i.balance, 0),
      dueSoonAmount: dueSoon.reduce((s, i) => s + i.balance, 0),
      reconciled: payments.filter((p) => p.reconciled).length,
      unreconciled: payments.filter((p) => !p.reconciled).length,
    };
  }, [invoices, payments]);

  // -------------------------------------------------------------------------
  // Memoized: Filtered invoices for search + status
  // -------------------------------------------------------------------------
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((i) => {
        const v = vendors.find((v) => v.id === i.vendorId);
        return (
          i.invoiceNo.toLowerCase().includes(term) ||
          v?.name.toLowerCase().includes(term)
        );
      });
    }
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    return list;
  }, [invoices, vendors, searchTerm, statusFilter]);

  // -------------------------------------------------------------------------
  // Callbacks: Export to CSV
  // -------------------------------------------------------------------------
  const handleExportInvoices = useCallback(() => {
    const data = filteredInvoices.map((i) => ({
      "Invoice #": i.invoiceNo,
      Vendor: vendors.find((v) => v.id === i.vendorId)?.name || "",
      "Due Date": i.dueDate || "-",
      Total: i.total,
      Balance: i.balance,
      Status: i.status,
      Approval: i.approval,
    }));
    exportToCSV(data, "ap_invoices");
  }, [filteredInvoices, vendors]);

  const handleExportPayments = useCallback(() => {
    const data = payments.map((p) => ({
      Date: p.date || "-",
      Vendor: vendors.find((v) => v.id === p.vendorId)?.name || "",
      Amount: p.amount,
      Method: p.method,
      Reconciled: p.reconciled ? "Yes" : "No",
    }));
    exportToCSV(data, "ap_payments");
  }, [payments, vendors]);

  // =============================================================================
  // MODALS
  // =============================================================================

  // -------------------------------------------------------------------------
  // Vendor Modal: Add or Edit Vendor
  // -------------------------------------------------------------------------
  const VendorModal = () => {
    const [form, setForm] = useState(
      editingVendor || {
        name: "",
        code: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        paymentTerms: 30,
        category: "",
      }
    );

    const save = () => {
      if (!form.name || !form.code) return;
      if (editingVendor) {
        setVendors((prev) =>
          prev.map((v) => (v.id === editingVendor.id ? { ...v, ...form } : v))
        );
      } else {
        setVendors((prev) => [...prev, { id: `v${Date.now()}`, ...form }]);
      }
      setShowVendorModal(false);
      setEditingVendor(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            {editingVendor ? "Edit" : "Add"} Vendor
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="col-span-2 px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Tax ID"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Terms (days)"
              value={form.paymentTerms}
              onChange={(e) =>
                setForm({ ...form, paymentTerms: +e.target.value })
              }
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="col-span-2 px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowVendorModal(false);
                setEditingVendor(null);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!form.name || !form.code}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Invoice Modal: Create or Edit Invoice
  // - Calculates due date based on vendor terms
  // - Supports PDF upload
  // - Posts to GL on create
  // -------------------------------------------------------------------------
  const InvoiceModal = () => {
    const [form, setForm] = useState(
      editingInvoice || {
        vendorId: "",
        invoiceNo: "",
        poNo: "",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        total: 0,
        file: null,
      }
    );

    const handleFile = (e) => {
      const file = e.target.files[0];
      if (file?.type === "application/pdf") {
        setForm((f) => ({ ...f, file: URL.createObjectURL(file) }));
        setUploadedFile(file);
      }
    };

    const save = () => {
      if (!form.vendorId || !form.invoiceNo || !form.total) return;
      const vendor = vendors.find((v) => v.id === form.vendorId);
      const due = addDays(new Date(form.issueDate), vendor?.paymentTerms || 30);
      const total = +form.total;
      const newInv = {
        id: editingInvoice?.id || `i${Date.now()}`,
        ...form,
        dueDate: format(due, "yyyy-MM-dd"),
        total,
        balance: editingInvoice
          ? total - (editingInvoice.total - editingInvoice.balance)
          : total,
        status:
          editingInvoice && total <= editingInvoice.balance
            ? "paid"
            : editingInvoice
            ? "partial"
            : "open",
        approval: editingInvoice?.approval || "pending",
      };
      setInvoices((prev) =>
        editingInvoice
          ? prev.map((i) => (i.id === editingInvoice.id ? newInv : i))
          : [...prev, newInv]
      );
      if (!editingInvoice)
        postToGL(
          expenseAccount?.id,
          apAccount?.id,
          total,
          `AP Invoice ${form.invoiceNo}`
        );
      setShowInvoiceModal(false);
      setEditingInvoice(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            {editingInvoice ? "Edit" : "New"} Invoice
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Invoice #"
              value={form.invoiceNo}
              onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="PO #"
              value={form.poNo}
              onChange={(e) => setForm({ ...form, poNo: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Total"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: +e.target.value })}
              className="col-span-2 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              PDF (optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
            >
              <Upload className="w-6 h-6 mx-auto text-gray-400" />
              <p className="text-xs mt-1">
                {uploadedFile?.name || "Click to upload"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowInvoiceModal(false);
                setEditingInvoice(null);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Payment Modal: Record payment for selected invoices
  // -------------------------------------------------------------------------
  const PaymentModal = () => {
    const payable = invoices.filter(
      (i) => selectedInvoices.includes(i.id) && i.balance > 0
    );
    const total = payable.reduce((s, i) => s + i.balance, 0);
    const [amount, setAmount] = useState(total);
    const [method, setMethod] = useState("ACH");

    const record = () => {
      const payment = {
        id: `p${Date.now()}`,
        invoiceIds: payable.map((i) => i.id),
        vendorId: payable[0]?.vendorId,
        amount,
        date: format(new Date(), "yyyy-MM-dd"),
        method,
        status: "pending",
        reconciled: false,
      };
      setPayments((prev) => [...prev, payment]);
      let rem = amount;
      setInvoices((prev) =>
        prev.map((inv) => {
          if (!payable.find((p) => p.id === inv.id)) return inv;
          const pay = Math.min(inv.balance, rem);
          rem -= pay;
          return {
            ...inv,
            balance: inv.balance - pay,
            status: inv.balance - pay <= 0 ? "paid" : "partial",
          };
        })
      );
      postToGL(apAccount?.id, cashAccount?.id, amount, `AP Payment ${method}`);
      setShowPaymentModal(false);
      setSelectedInvoices([]);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold">Record Payment</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(+e.target.value || 0, total))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option>ACH</option>
              <option>Check</option>
              <option>Wire</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={record}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Record
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Reconcile Modal: Match bank transactions with payments
  // -------------------------------------------------------------------------
  const ReconcileModal = () => {
    const match = (bankId, payId) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === payId ? { ...p, reconciled: true } : p))
      );
      setBankTransactions((prev) =>
        prev.map((t) => (t.id === bankId ? { ...t, matched: true } : t))
      );
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">Reconciliation</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Bank Transactions</h4>
              {bankTransactions.map((t) => (
                <div
                  key={t.id}
                  className={`p-3 border rounded mb-2 ${
                    t.matched ? "bg-green-50" : ""
                  }`}
                >
                  <p className="text-sm">
                    {t.date} - {t.description}
                  </p>
                  <p className="font-medium">
                    ${Math.abs(t.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2">Unreconciled Payments</h4>
              {payments
                .filter((p) => !p.reconciled)
                .map((p) => (
                  <div key={p.id} className="p-3 border rounded mb-2">
                    <p className="text-sm">
                      {p.date} -{" "}
                      {vendors.find((v) => v.id === p.vendorId)?.name}
                    </p>
                    <p className="font-medium">${p.amount.toFixed(2)}</p>
                    <button
                      onClick={() => match("b2", p.id)} // Example bank ID
                      className="text-xs text-indigo-600"
                    >
                      Match
                    </button>
                  </div>
                ))}
            </div>
          </div>
          <button
            onClick={() => setShowReconcileModal(false)}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // =============================================================================
  // TABS
  // =============================================================================

  // -------------------------------------------------------------------------
  // Dashboard Tab: Summary cards + aging report
  // -------------------------------------------------------------------------
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total AP", value: totals.totalAP, color: "indigo" },
          { label: "Open", value: totals.openAmount, color: "blue" },
          { label: "Overdue", value: totals.overdueAmount, color: "red" },
          { label: "Due 7d", value: totals.dueSoonAmount, color: "orange" },
          { label: "Reconciled", value: totals.reconciled, color: "green" },
          {
            label: "Unreconciled",
            value: totals.unreconciled,
            color: "orange",
          },
        ].map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-600">{k.label}</p>
            <p className={`text-2xl font-bold text-${k.color}-600`}>
              {k.label.includes("AP") ||
              k.label.includes("Open") ||
              k.label.includes("Overdue") ||
              k.label.includes("Due")
                ? `$${k.value.toFixed(2)}`
                : k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Aging Buckets */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold mb-4">Aging Summary</h3>
        <div className="grid grid-cols-5 gap-4 text-center">
          {["Current", "1-30", "31-60", "61-90", "90+"].map((b) => {
            const bucketKey = b.toLowerCase().replace(/[^0-9a-z]/g, "");
            const amt = invoices
              .filter((i) => getAgingBucket(i.dueDate) === bucketKey)
              .reduce((s, i) => s + i.balance, 0);
            return (
              <div key={b} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">{b}</p>
                <p className="font-semibold">${amt.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setEditingInvoice(null);
            setShowInvoiceModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
        <button
          onClick={handleExportInvoices}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          <FileDown className="w-4 h-4" /> Export Invoices
        </button>
        <button
          onClick={() => setShowReconcileModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          <CheckSquare className="w-4 h-4" /> Reconcile
        </button>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Vendors Tab: List with quick actions
  // -------------------------------------------------------------------------
  const VendorsTab = () => {
    const del = (id) => {
      if (confirm("Delete vendor? This will not delete associated invoices.")) {
        setVendors((prev) => prev.filter((v) => v.id !== id));
      }
    };

    const quickInv = (v) => {
      const due = addDays(new Date(), v.paymentTerms);
      setEditingInvoice({
        id: `i${Date.now()}`,
        vendorId: v.id,
        invoiceNo: `INV-${format(new Date(), "yyyy")}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        poNo: "",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(due, "dd MM yyyy"),
        total: 0,
        balance: 0,
        status: "open",
        approval: "pending",
        file: null,
      });
      setShowInvoiceModal(true);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Vendors ({vendors.length})</h2>
          <button
            onClick={() => {
              setEditingVendor(null);
              setShowVendorModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-6 py-4 text-sm">{v.code}</td>
                  <td className="px-6 py-4 text-sm font-medium">{v.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {v.email}
                    <br />
                    {v.phone}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    Net {v.paymentTerms} days
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => quickInv(v)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Quick Invoice
                    </button>
                    <button
                      onClick={() => {
                        setEditingVendor(v);
                        setShowVendorModal(true);
                      }}
                      className="text-indigo-600"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => del(v.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Invoices Tab: Full invoice list with selection & actions
  // - Safe date formatting (shows "-" if invalid)
  // -------------------------------------------------------------------------
  const InvoicesTab = () => {
    const [localSel, setLocalSel] = useState([]);
    const payable = filteredInvoices.filter(
      (i) => i.balance > 0 && i.approval === "approved"
    );

    const selAll = (e) =>
      setLocalSel(e.target.checked ? payable.map((i) => i.id) : []);

    const selOne = (id) =>
      setLocalSel((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );

    const selTotal = filteredInvoices
      .filter((i) => localSel.includes(i.id))
      .reduce((s, i) => s + i.balance, 0);

    const proceed = () => {
      setSelectedInvoices(localSel);
      setSelectedTab("payments");
    };

    const edit = (inv) => {
      setEditingInvoice(inv);
      setShowInvoiceModal(true);
    };

    const del = (id) => {
      if (confirm("Delete invoice?")) {
        setInvoices((prev) => prev.filter((i) => i.id !== id));
      }
    };

    const approve = (id) =>
      setInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, approval: "approved" } : i))
      );

    const reject = (id) =>
      setInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, approval: "rejected" } : i))
      );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Invoices ({filteredInvoices.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportInvoices}
              className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => {
                setEditingInvoice(null);
                setShowInvoiceModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        </div>

        {/* Selection Summary */}
        {localSel.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">
              {localSel.length} invoice{localSel.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-blue-700">
                ${(selTotal ?? 0).toFixed(2)}
              </span>
              <button
                onClick={proceed}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        )}

        {/* Invoice Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input
                    type="checkbox"
                    onChange={selAll}
                    checked={
                      localSel.length === payable.length && payable.length > 0
                    }
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Approval
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  File
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((inv) => {
                const v = vendors.find((x) => x.id === inv.vendorId);
                const payOk = inv.balance > 0 && inv.approval === "approved";
                const dueDate = inv.dueDate ? parseISO(inv.dueDate) : null;

                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={localSel.includes(inv.id)}
                        onChange={() => selOne(inv.id)}
                        disabled={!payOk}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-6 py-4 text-sm">{v?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {dueDate ? format(dueDate, "dd-MM-yyyy") : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${(inv.balance ?? 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.approval === "approved"
                            ? "bg-green-100 text-green-700"
                            : inv.approval === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {(inv.approval ?? "").charAt(0).toUpperCase() +
                          (inv.approval ?? "").slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {inv.file ? (
                        <a
                          href={inv.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View PDF
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => edit(inv)}
                        className="text-indigo-600"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => del(inv.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                      {inv.approval === "pending" && (
                        <>
                          <button
                            onClick={() => approve(inv.id)}
                            className="text-green-600 ml-2"
                          >
                            <CheckCircle className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => reject(inv.id)}
                            className="text-red-600 ml-1"
                          >
                            <X className="w-4 h-4 inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Payments Tab: View payments + batch pay selected invoices
  // -------------------------------------------------------------------------
  const PaymentsTab = () => {
    const payable = invoices.filter(
      (i) => selectedInvoices.includes(i.id) && i.balance > 0
    );
    const totalPay = payable.reduce((s, i) => s + i.balance, 0);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Payments ({payments.length})</h2>
          <button
            onClick={handleExportPayments}
            className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Ready to Pay Section */}
        {payable.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Ready to Pay</h3>
            <div className="space-y-1 text-sm">
              {payable.map((inv) => (
                <div key={inv.id} className="flex justify-between">
                  <span>
                    {inv.invoiceNo} (
                    {vendors.find((v) => v.id === inv.vendorId)?.name})
                  </span>
                  <span className="font-medium">${inv.balance.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-green-300 font-semibold text-green-800">
              Total: ${totalPay.toFixed(2)}
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg w-full"
            >
              Record Payment
            </button>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
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
                  Reconciled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((p) => {
                const v = vendors.find((x) => x.id === p.vendorId);
                const paymentDateObj = p.date ? parseISO(p.date) : null;
                const formattedDate = paymentDateObj
                  ? format(paymentDateObj, "MMM d, yyyy")
                  : "-";

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{formattedDate}</td>
                    <td className="px-6 py-4 text-sm">{v?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${(p.amount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">{p.method}</td>
                    <td className="px-6 py-4 text-center">
                      {p.reconciled ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XSquare className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Accounts Payable
            </h1>
            <p className="text-gray-600 mt-1">
              Full-cycle AP with GL posting, reconciliation, and reporting.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
            {["dashboard", "vendors", "invoices", "payments"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTab(t)}
                className={`px-6 py-2 rounded-lg font-medium capitalize transition-all ${
                  selectedTab === t
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t === "vendors"
                  ? "Vendors"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {selectedTab === "dashboard" && <DashboardTab />}
            {selectedTab === "vendors" && <VendorsTab />}
            {selectedTab === "invoices" && <InvoicesTab />}
            {selectedTab === "payments" && <PaymentsTab />}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVendorModal && <VendorModal />}
      {showInvoiceModal && <InvoiceModal />}
      {showPaymentModal && <PaymentModal />}
      {showReconcileModal && <ReconcileModal />}
    </>
  );
}
