// src/components/AccountsPayable.jsx
// FULLY FUNCTIONAL AP MODULE
// Reconciliation | Approval | Vendor Filter | % Tax/Discount

import React, { useState, useRef, useMemo, useCallback } from "react";
import { format, addDays, parseISO, isValid } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Download,
  Mail,
  Printer,
  CreditCard,
  Banknote,
  CheckCheck,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

// Safe format
const safeFormat = (dateStr, fmt = "MMM d, yyyy") => {
  if (!dateStr) return "-";
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, fmt) : "-";
  } catch {
    return "-";
  }
};

const safeDueDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "dd-MM-yyyy") : "N/A";
  } catch {
    return "N/A";
  }
};

// CSV Export
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

// Status Badge
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

export default function AccountsPayable() {
  const {
    vendors = [],
    setVendors,
    invoices = [],
    setInvoices,
    payments = [],
    setPayments,
    bankTransactions = [],
    setBankTransactions,
    postToGL,
    apAccount,
    cashAccount,
    expenseAccount,
  } = useFinance() || {};

  // UI State
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [vendorFilter, setVendorFilter] = useState("all"); // NEW: Vendor filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef(null);

  // Dashboard Totals
  const totals = useMemo(() => {
    const open = invoices.filter((i) => ["open", "partial"].includes(i.status));
    const dueSoon = invoices.filter((i) => {
      if (!i.dueDate) return false;
      let due;
      try {
        due = parseISO(i.dueDate);
      } catch {
        return false;
      }
      if (!isValid(due)) return false;
      const days = Math.ceil((due - Date.now()) / 86400000);
      return i.status === "open" && days <= 7 && days > 0;
    });
    const overdue = invoices.filter((i) => {
      if (!i.dueDate) return false;
      let due;
      try {
        due = parseISO(i.dueDate);
      } catch {
        return false;
      }
      if (!isValid(due)) return false;
      const days = Math.floor((Date.now() - due) / 86400000);
      return days > 0 && i.balance > 0;
    });

    return {
      totalAP: invoices.reduce((s, i) => s + (i.balance || 0), 0),
      openAmount: open.reduce((s, i) => s + (i.balance || 0), 0),
      overdueAmount: overdue.reduce((s, i) => s + (i.balance || 0), 0),
      dueSoonAmount: dueSoon.reduce((s, i) => s + (i.balance || 0), 0),
      reconciled: payments.filter((p) => p.reconciled).length,
      unreconciled: payments.filter((p) => !p.reconciled).length,
    };
  }, [invoices, payments]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (vendorFilter !== "all") {
      list = list.filter((i) => i.vendorId === vendorFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((i) => {
        const v = vendors.find((v) => v.id === i.vendorId);
        return (
          (i.invoiceNo || "").toLowerCase().includes(term) ||
          (i.poNo || "").toLowerCase().includes(term) ||
          (v?.name || "").toLowerCase().includes(term)
        );
      });
    }
    if (statusFilter !== "all")
      list = list.filter((i) => i.status === statusFilter);
    return list;
  }, [invoices, vendors, vendorFilter, searchTerm, statusFilter]);

  // Export
  const handleExportInvoices = useCallback(() => {
    const data = filteredInvoices.map((i) => ({
      "Invoice #": i.invoiceNo || "",
      "PO #": i.poNo || "-",
      Vendor: vendors.find((v) => v.id === i.vendorId)?.name || "",
      "Issue Date": i.issueDate || "-",
      "Due Date": i.dueDate || "-",
      Subtotal: i.subtotal || 0,
      "Discount %": i.discountPercent || 0,
      Discount: i.discount || 0,
      "Tax %": i.taxPercent || 0,
      Tax: i.tax || 0,
      Total: i.total || 0,
      Balance: i.balance || 0,
      Status: i.status || "",
      Approval: i.approval || "",
      "Approved By": i.approvedBy || "-",
    }));
    exportToCSV(data, "ap_invoices");
  }, [filteredInvoices, vendors]);

  // PDF PRINT
  const printInvoice = (inv) => {
    const vendor = vendors.find((v) => v.id === inv.vendorId);
    const win = window.open("", "", "width=900,height=700");
    win.document.write(`
      <html><head><title>Invoice ${inv.invoiceNo}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; line-height: 1.6; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 15px; }
        h1 { margin: 0; color: #4f46e5; font-size: 28px; }
        .info { display: flex; justify-content: space-between; margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f8f9fa; }
        .total { text-align: right; font-size: 1.3em; font-weight: bold; }
        .status { padding: 8px 16px; border-radius: 20px; color: white; display: inline-block; }
        .paid { background: #10b981; }
        .partial { background: #f59e0b; }
        .open { background: #ef4444; }
        .footer { margin-top: 50px; color: #666; font-size: 0.9em; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header"><h1>INVOICE #${inv.invoiceNo}</h1>
        <p>Issue: ${safeFormat(inv.issueDate)} | Due: ${safeDueDate(
      inv.dueDate
    )}</p></div>
        <div class="info">
          <div><strong>From:</strong><br>Your Company<br>123 Finance St<br>email@company.com</div>
          <div><strong>Bill To:</strong><br>${vendor?.name}<br>${
      vendor?.address || ""
    }<br>${vendor?.email || ""}</div>
        </div>
        <table>
          <tr><th>Description</th><th class="text-right">Amount</th></tr>
          <tr><td>Subtotal</td><td class="text-right">$${(
            inv.subtotal || 0
          ).toFixed(2)}</td></tr>
          ${
            inv.discountPercent
              ? `<tr><td>Discount (${
                  inv.discountPercent
                }%)</td><td class="text-right">-$${(inv.discount || 0).toFixed(
                  2
                )}</td></tr>`
              : ""
          }
          ${
            inv.taxPercent
              ? `<tr><td>Tax (${
                  inv.taxPercent
                }%)</td><td class="text-right">$${(inv.tax || 0).toFixed(
                  2
                )}</td></tr>`
              : ""
          }
          <tr><td><strong>Balance Due</strong></td><td class="text-right"><strong>$${(
            inv.balance || 0
          ).toFixed(2)}</strong></td></tr>
        </table>
        <p class="total">Status: <span class="status ${
          inv.status
        }">${inv.status.toUpperCase()}</span></p>
        <div class="footer">
          <p>PO: ${inv.poNo || "N/A"} | Terms: Net ${
      vendor?.paymentTerms || 30
    } days</p>
          <p>Approved by: ${inv.approvedBy || "Pending"} on ${
      inv.approvedAt ? safeFormat(inv.approvedAt) : "-"
    }</p>
        </div>
        <hr><p style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 20px; background:#4f46e5; color:white; border:none; border-radius:5px; cursor:pointer;">
            Print / Save as PDF
          </button>
        </p>
      </body></html>
    `);
    win.document.close();
  };

  // EMAIL
  const emailInvoice = (inv) => {
    const vendor = vendors.find((v) => v.id === inv.vendorId);
    alert(
      `Email sent to ${vendor?.email || "vendor"}:\nInvoice #${
        inv.invoiceNo
      } - $${inv.balance}`
    );
  };

  // APPROVE INVOICE (FUNCTIONAL)
  const approveInvoice = (id) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv.approval === "approved") return;
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              approval: "approved",
              approvedBy: "You",
              approvedAt: new Date().toISOString(),
            }
          : i
      )
    );
    postToGL?.(
      apAccount?.id,
      expenseAccount?.id,
      inv.total,
      `AP Invoice Approval ${inv.invoiceNo}`
    );
  };

  // RECONCILE PAYMENT (FUNCTIONAL)
  const reconcilePayment = (paymentId, bankId) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId ? { ...p, reconciled: true, bankId } : p
      )
    );
    setBankTransactions((prev) =>
      prev.map((t) => (t.id === bankId ? { ...t, reconciled: true } : t))
    );
  };

  // Edit / Delete
  const editVendor = (v) => {
    setEditingVendor(v);
    setShowVendorModal(true);
  };
  const deleteVendor = (id) => {
    if (confirm("Delete vendor?"))
      setVendors((prev) => prev.filter((v) => v.id !== id));
  };
  const editInvoice = (i) => {
    setEditingInvoice(i);
    setShowInvoiceModal(true);
  };
  const deleteInvoice = (id) => {
    if (confirm("Delete invoice?"))
      setInvoices((prev) => prev.filter((i) => i.id !== id));
  };
  const quickPay = (i) => {
    if (i.approval !== "approved") {
      alert("Invoice must be approved before payment.");
      return;
    }
    setSelectedInvoices([i.id]);
    setShowPaymentModal(true);
  };

  // Vendor Modal
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
                setForm({ ...form, paymentTerms: +e.target.value || 0 })
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Invoice Modal - % TAX & DISCOUNT
  const InvoiceModal = () => {
    const [form, setForm] = useState(
      editingInvoice || {
        vendorId: "",
        invoiceNo: "",
        poNo: "",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        subtotal: "",
        discountPercent: "",
        taxPercent: "",
        fileName: "",
        file: null,
      }
    );

    const handleFile = (e) => {
      const file = e.target.files[0];
      if (file?.type === "application/pdf") {
        setForm((f) => ({
          ...f,
          file: URL.createObjectURL(file),
          fileName: file.name,
        }));
      }
    };

    const save = () => {
      if (!form.vendorId || !form.invoiceNo || !form.subtotal) return;
      const vendor = vendors.find((v) => v.id === form.vendorId);
      const subtotal = +form.subtotal || 0;
      const discountPercent = +form.discountPercent || 0;
      const taxPercent = +form.taxPercent || 0;

      const discount = subtotal * (discountPercent / 100);
      const tax = (subtotal - discount) * (taxPercent / 100);
      const total = subtotal - discount + tax;

      const paidSoFar = editingInvoice
        ? (editingInvoice.total || 0) - (editingInvoice.balance || 0)
        : 0;
      const newBalance = total - paidSoFar;

      const newInv = {
        id: editingInvoice?.id || `i${Date.now()}`,
        ...form,
        subtotal,
        discount,
        discountPercent,
        tax,
        taxPercent,
        total,
        balance: newBalance,
        dueDate: format(
          addDays(new Date(form.issueDate), vendor?.paymentTerms || 30),
          "yyyy-MM-dd"
        ),
        status:
          newBalance <= 0 ? "paid" : newBalance < total ? "partial" : "open",
        approval: editingInvoice?.approval || "pending",
        approvedBy: editingInvoice?.approvedBy || null,
        approvedAt: editingInvoice?.approvedAt || null,
      };

      setInvoices((prev) =>
        editingInvoice
          ? prev.map((i) => (i.id === editingInvoice.id ? newInv : i))
          : [...prev, newInv]
      );
      if (!editingInvoice)
        postToGL?.(
          expenseAccount?.id,
          apAccount?.id,
          total,
          `AP Invoice ${form.invoiceNo}`
        );
      setShowInvoiceModal(false);
      setEditingInvoice(null);
    };

    const subtotal = +form.subtotal || 0;
    const discountPercent = +form.discountPercent || 0;
    const taxPercent = +form.taxPercent || 0;
    const discount = subtotal * (discountPercent / 100);
    const taxable = subtotal - discount;
    const tax = taxable * (taxPercent / 100);
    const total = taxable + tax;

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
              placeholder="Subtotal"
              value={form.subtotal}
              onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Discount %"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm({ ...form, discountPercent: e.target.value })
                }
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <span className="text-sm text-gray-500">
                = -${discount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Tax %"
                value={form.taxPercent}
                onChange={(e) =>
                  setForm({ ...form, taxPercent: e.target.value })
                }
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <span className="text-sm text-gray-500">
                = +${tax.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({discountPercent}%):</span>{" "}
              <span>-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable:</span> <span>${taxable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxPercent}%):</span> <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-1 font-bold flex justify-between">
              <span>Total:</span> <span>${total.toFixed(2)}</span>
            </div>
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
                {form.fileName || "Click to upload"}
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

  // Payment Modal
  const PaymentModal = () => {
    const payable = invoices.filter(
      (i) =>
        selectedInvoices.includes(i.id) &&
        i.balance > 0 &&
        i.approval === "approved"
    );
    const total = payable.reduce((s, i) => s + i.balance, 0);
    const [amount, setAmount] = useState(total.toString());
    const [method, setMethod] = useState("ACH");

    const record = () => {
      const payment = {
        id: `p${Date.now()}`,
        invoiceIds: payable.map((i) => i.id),
        vendorId: payable[0]?.vendorId || "",
        amount: +amount || 0,
        date: format(new Date(), "yyyy-MM-dd"),
        method,
        reconciled: false,
      };
      setPayments((prev) => [...prev, payment]);
      let rem = +amount || 0;
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
      postToGL?.(
        apAccount?.id,
        cashAccount?.id,
        +amount || 0,
        `AP Payment ${method}`
      );
      setShowPaymentModal(false);
      setSelectedInvoices([]);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold">Record Payment</h3>
          <div className="text-sm space-y-1">
            {payable.map((inv) => (
              <div key={inv.id} className="flex justify-between">
                <span>
                  {inv.invoiceNo} (
                  {vendors.find((v) => v.id === inv.vendorId)?.name})
                </span>
                <span>${inv.balance.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-1 font-bold">
              Total: ${total.toFixed(2)}
            </div>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Amount"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option>ACH</option>
            <option>Check</option>
            <option>Wire</option>
          </select>
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

  // RECONCILIATION TAB (FULLY FUNCTIONAL)
  const ReconcileTab = () => {
    const unreconciledPayments = payments.filter((p) => !p.reconciled);
    const unreconciledBank = bankTransactions.filter(
      (t) => !t.reconciled && t.type === "debit"
    );

    const [selectedBank, setSelectedBank] = useState("");
    const [selectedPayment, setSelectedPayment] = useState("");

    const handleReconcile = () => {
      if (!selectedPayment || !selectedBank) {
        alert("Please select both payment and bank entry.");
        return;
      }
      reconcilePayment(selectedPayment, selectedBank);
      setSelectedPayment("");
      setSelectedBank("");
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Reconcile Payments</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border">
            <h3 className="font-semibold text-lg mb-3">
              AP Payments (Unreconciled)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unreconciledPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  All reconciled!
                </p>
              ) : (
                unreconciledPayments.map((p) => {
                  const vendor = vendors.find((v) => v.id === p.vendorId);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedPayment === p.id
                          ? "bg-blue-50 border-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedPayment(p.id)}
                    >
                      <p className="font-medium">{vendor?.name}</p>
                      <p className="text-sm text-gray-600">
                        {safeFormat(p.date)} • {p.method} • $
                        {p.amount.toFixed(2)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border">
            <h3 className="font-semibold text-lg mb-3">
              Bank Transactions (Unmatched)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unreconciledBank.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No pending entries
                </p>
              ) : (
                unreconciledBank.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedBank === t.id
                        ? "bg-green-50 border-green-500"
                        : ""
                    }`}
                    onClick={() => setSelectedBank(t.id)}
                  >
                    <p className="font-medium">{t.description}</p>
                    <p className="text-sm text-gray-600">
                      {safeFormat(t.date)} • ${t.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleReconcile}
            disabled={!selectedPayment || !selectedBank}
            className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            Reconcile Selected
          </button>
        </div>
      </div>
    );
  };

  // MAIN RENDER
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Accounts Payable
            </h1>
            <p className="text-gray-600 mt-1">
              Full-cycle AP with functional reconciliation & approval.
            </p>
          </div>

          <div className="flex space-x-1 bg-white rounded-xl shadow-sm p-1">
            {["dashboard", "vendors", "invoices", "payments", "reconcile"].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTab(t)}
                  className={`px-6 py-2 rounded-lg font-medium capitalize ${
                    selectedTab === t
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t === "reconcile"
                    ? "Reconcile"
                    : t === "vendors"
                    ? "Vendors"
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              )
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            {selectedTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    {
                      label: "Total AP",
                      value: totals.totalAP,
                      color: "indigo",
                    },
                    { label: "Open", value: totals.openAmount, color: "blue" },
                    {
                      label: "Overdue",
                      value: totals.overdueAmount,
                      color: "red",
                    },
                    {
                      label: "Due 7d",
                      value: totals.dueSoonAmount,
                      color: "orange",
                    },
                    {
                      label: "Reconciled",
                      value: totals.reconciled,
                      color: "green",
                    },
                    {
                      label: "Unreconciled",
                      value: totals.unreconciled,
                      color: "orange",
                    },
                  ].map((k, i) => (
                    <div
                      key={i}
                      className="bg-white p-5 rounded-xl shadow-sm border"
                    >
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
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
            )}

            {selectedTab === "vendors" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    Vendors ({vendors.length})
                  </h2>
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
                        <td className="px-6 py-4 text-sm font-medium">
                          {v.name}
                        </td>
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
                            onClick={() => editVendor(v)}
                            title="Edit"
                            className="text-indigo-600"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => deleteVendor(v.id)}
                            title="Delete"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedTab === "invoices" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold">
                    Invoices ({filteredInvoices.length})
                  </h2>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <select
                        value={vendorFilter}
                        onChange={(e) => setVendorFilter(e.target.value)}
                        className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8"
                      >
                        <option value="all">All Vendors</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
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

                {selectedInvoices.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                    <span>{selectedInvoices.length} selected</span>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-green-600 text-white px-4 py-1.5 rounded"
                    >
                      Pay Now
                    </button>
                  </div>
                )}

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            setSelectedInvoices(
                              e.target.checked
                                ? filteredInvoices.map((i) => i.id)
                                : []
                            )
                          }
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Taxes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Approval
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      const v = vendors.find((x) => x.id === inv.vendorId);
                      const overdue =
                        inv.dueDate &&
                        parseISO(inv.dueDate) < new Date() &&
                        inv.balance > 0;
                      const canPay =
                        inv.approval === "approved" && inv.balance > 0;
                      return (
                        <tr key={inv.id}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(inv.id)}
                              onChange={(e) =>
                                setSelectedInvoices((prev) =>
                                  e.target.checked
                                    ? [...prev, inv.id]
                                    : prev.filter((x) => x !== inv.id)
                                )
                              }
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {inv.invoiceNo}
                          </td>
                          <td className="px-6 py-4 text-sm">{v?.name}</td>
                          <td className="px-6 py-4 text-sm">
                            {safeDueDate(inv.dueDate)}{" "}
                            {overdue && (
                              <span className="text-red-600 text-xs">
                                OVERDUE
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            ${(inv.balance || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {inv.discountPercent
                              ? `Disc: ${inv.discountPercent}% `
                              : ""}
                            {inv.taxPercent ? `| Tax: ${inv.taxPercent}%` : ""}
                          </td>
                          <td className="px-6 py-4">
                            {inv.approval === "pending" ? (
                              <button
                                onClick={() => approveInvoice(inv.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4 inline" />{" "}
                                Approve
                              </button>
                            ) : (
                              <span className="text-green-600 text-xs">
                                Approved
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-1">
                            <button
                              onClick={() => printInvoice(inv)}
                              title="Print"
                              className="text-indigo-600"
                            >
                              <Printer className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() => emailInvoice(inv)}
                              title="Email"
                              className="text-green-600"
                            >
                              <Mail className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() => editInvoice(inv)}
                              title="Edit"
                              className="text-blue-600"
                            >
                              <Edit className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              title="Delete"
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                            {canPay ? (
                              <button
                                onClick={() => quickPay(inv)}
                                title="Pay"
                                className="text-green-600"
                              >
                                <CreditCard className="w-4 h-4 inline" />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="Approve first"
                                className="text-gray-400"
                              >
                                <CreditCard className="w-4 h-4 inline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedTab === "payments" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                  Payments ({payments.length})
                </h2>
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
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const v = vendors.find((x) => x.id === p.vendorId);
                      return (
                        <tr key={p.id}>
                          <td className="px-6 py-4 text-sm">
                            {safeFormat(p.date)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {v?.name || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            ${(p.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">{p.method}</td>
                          <td className="px-6 py-4">
                            {p.reconciled ? (
                              <span className="text-green-600 text-xs">
                                Reconciled
                              </span>
                            ) : (
                              <span className="text-orange-600 text-xs">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedTab === "reconcile" && <ReconcileTab />}
          </div>
        </div>
      </div>

      {showVendorModal && <VendorModal />}
      {showInvoiceModal && <InvoiceModal />}
      {showPaymentModal && <PaymentModal />}
    </>
  );
}
