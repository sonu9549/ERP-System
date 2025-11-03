// src/components/AccountsReceivable.jsx
import React, { useState, useRef, useMemo, useCallback } from "react";
import { format, addDays, parseISO } from "date-fns";
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Download,
  CheckSquare,
  XSquare,
  FileDown,
  X,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

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

const getAgingBucket = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.floor((today - due) / 86400000);
  if (diff <= 0) return "current";
  if (diff <= 30) return "1-30";
  if (diff <= 60) return "31-60";
  if (diff <= 90) return "61-90";
  return "90+";
};

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

export default function AccountsReceivable() {
  const {
    customers,
    setCustomers,
    arInvoices,
    setArInvoices,
    receipts,
    setReceipts,
    bankDeposits,
    setBankDeposits,
    postToGL,
    arAccount,
    cashAccount,
    salesAccount,
    cogsAccount,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const totals = useMemo(() => {
    const open = arInvoices.filter((i) =>
      ["open", "partial"].includes(i.status)
    );
    const dueSoon = arInvoices.filter((i) => {
      const days = Math.ceil((new Date(i.dueDate) - Date.now()) / 86400000);
      return i.status === "open" && days <= 7 && days > 0;
    });
    const overdue = arInvoices.filter((i) => {
      const days = Math.floor((Date.now() - new Date(i.dueDate)) / 86400000);
      return days > 0 && i.balance > 0;
    });
    return {
      totalAR: arInvoices.reduce((s, i) => s + i.balance, 0),
      openAmount: open.reduce((s, i) => s + i.balance, 0),
      overdueAmount: overdue.reduce((s, i) => s + i.balance, 0),
      dueSoonAmount: dueSoon.reduce((s, i) => s + i.balance, 0),
      reconciled: receipts.filter((r) => r.reconciled).length,
      unreconciled: receipts.filter((r) => !r.reconciled).length,
    };
  }, [arInvoices, receipts]);

  const filteredInvoices = useMemo(() => {
    let list = [...arInvoices];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((i) => {
        const c = customers.find((v) => v.id === i.customerId);
        return (
          i.invoiceNo.toLowerCase().includes(term) ||
          c?.name.toLowerCase().includes(term)
        );
      });
    }
    if (statusFilter !== "all")
      list = list.filter((i) => i.status === statusFilter);
    return list;
  }, [arInvoices, customers, searchTerm, statusFilter]);

  const handleExportInvoices = useCallback(() => {
    const data = filteredInvoices.map((i) => ({
      "Invoice #": i.invoiceNo,
      Customer: customers.find((c) => c.id === i.customerId)?.name || "",
      "Due Date": i.dueDate,
      Total: i.total,
      Balance: i.balance,
      Status: i.status,
    }));
    exportToCSV(data, "ar_invoices");
  }, [filteredInvoices, customers]);

  const handleExportReceipts = useCallback(() => {
    const data = receipts.map((r) => ({
      Date: r.date,
      Customer: customers.find((c) => c.id === r.customerId)?.name || "",
      Amount: r.amount,
      Method: r.method,
      Reconciled: r.reconciled ? "Yes" : "No",
    }));
    exportToCSV(data, "ar_receipts");
  }, [receipts, customers]);

  // ==================== MODALS ====================
  const CustomerModal = () => {
    const [form, setForm] = useState(
      editingCustomer || {
        name: "",
        code: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        creditLimit: 0,
        paymentTerms: 30,
        category: "",
      }
    );
    const save = () => {
      if (!form.name || !form.code) return;
      if (editingCustomer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...form } : c))
        );
      } else {
        setCustomers((prev) => [...prev, { id: `c${Date.now()}`, ...form }]);
      }
      setShowCustomerModal(false);
      setEditingCustomer(null);
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            {editingCustomer ? "Edit" : "Add"} Customer
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
              placeholder="Credit Limit"
              value={form.creditLimit}
              onChange={(e) =>
                setForm({ ...form, creditLimit: +e.target.value })
              }
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
                setShowCustomerModal(false);
                setEditingCustomer(null);
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

  const InvoiceModal = () => {
    const [form, setForm] = useState(
      editingInvoice || {
        customerId: "",
        invoiceNo: "",
        soNo: "",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        total: 0,
        cogs: 0,
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
      if (!form.customerId || !form.invoiceNo || !form.total) return;
      const customer = customers.find((c) => c.id === form.customerId);
      const due = addDays(
        new Date(form.issueDate),
        customer?.paymentTerms || 30
      );
      const total = +form.total;
      const cogs = +form.cogs || 0;
      const newInv = {
        id: editingInvoice?.id || `ari${Date.now()}`,
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
        approval: "sent",
      };
      setArInvoices((prev) =>
        editingInvoice
          ? prev.map((i) => (i.id === editingInvoice.id ? newInv : i))
          : [...prev, newInv]
      );
      if (!editingInvoice) {
        postToGL(
          arAccount?.id,
          salesAccount?.id,
          total,
          `AR Invoice ${form.invoiceNo} Sales`
        );
        if (cogs > 0)
          postToGL(
            cogsAccount?.id,
            null,
            cogs,
            `AR Invoice ${form.invoiceNo} COGS`
          );
      }
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
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              placeholder="SO #"
              value={form.soNo}
              onChange={(e) => setForm({ ...form, soNo: e.target.value })}
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
              placeholder="Total Amount"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: +e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="COGS (optional)"
              value={form.cogs}
              onChange={(e) => setForm({ ...form, cogs: +e.target.value })}
              className="px-3 py-2 border rounded-lg"
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

  const ReceiptModal = () => {
    const receivable = arInvoices.filter(
      (i) => selectedInvoices.includes(i.id) && i.balance > 0
    );
    const total = receivable.reduce((s, i) => s + i.balance, 0);
    const [amount, setAmount] = useState(total);
    const [method, setMethod] = useState("Wire");
    const record = () => {
      const receipt = {
        id: `r${Date.now()}`,
        invoiceIds: receivable.map((i) => i.id),
        customerId: receivable[0]?.customerId,
        amount,
        date: format(new Date(), "yyyy-MM-dd"),
        method,
        status: "applied",
        reconciled: false,
      };
      setReceipts((prev) => [...prev, receipt]);
      let rem = amount;
      setArInvoices((prev) =>
        prev.map((inv) => {
          if (!receivable.find((p) => p.id === inv.id)) return inv;
          const apply = Math.min(inv.balance, rem);
          rem -= apply;
          return {
            ...inv,
            balance: inv.balance - apply,
            status: inv.balance - apply <= 0 ? "paid" : "partial",
          };
        })
      );
      postToGL(cashAccount?.id, arAccount?.id, amount, `AR Receipt ${method}`);
      setShowReceiptModal(false);
      setSelectedInvoices([]);
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold">Record Receipt</h3>
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
              <option>Wire</option>
              <option>Check</option>
              <option>ACH</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowReceiptModal(false)}
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

  const ReconcileModal = () => {
    const match = (depId, recId) => {
      setReceipts((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, reconciled: true } : r))
      );
      setBankDeposits((prev) =>
        prev.map((d) => (d.id === depId ? { ...d, matched: true } : d))
      );
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">Bank Reconciliation</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Bank Deposits</h4>
              {bankDeposits.map((d) => (
                <div
                  key={d.id}
                  className={`p-3 border rounded mb-2 ${
                    d.matched ? "bg-green-50" : ""
                  }`}
                >
                  <p className="text-sm">
                    {d.date} - {d.description}
                  </p>
                  <p className="font-medium">${d.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2">Unreconciled Receipts</h4>
              {receipts
                .filter((r) => !r.reconciled)
                .map((r) => (
                  <div key={r.id} className="p-3 border rounded mb-2">
                    <p className="text-sm">
                      {r.date} -{" "}
                      {customers.find((c) => c.id === r.customerId)?.name}
                    </p>
                    <p className="font-medium">${r.amount.toFixed(2)}</p>
                    <button
                      onClick={() => match("d2", r.id)}
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

  // ==================== TABS ====================
  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total AR", value: totals.totalAR, color: "indigo" },
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
              {k.label.includes("AR") ||
              k.label.includes("Open") ||
              k.label.includes("Overdue") ||
              k.label.includes("Due")
                ? `$${k.value.toFixed(2)}`
                : k.value}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold mb-4">Aging Summary</h3>
        <div className="grid grid-cols-5 gap-4 text-center">
          {["Current", "1-30", "31-60", "61-90", "90+"].map((b) => {
            const amt = arInvoices
              .filter(
                (i) =>
                  getAgingBucket(i.dueDate) ===
                  b.toLowerCase().replace(/[^0-9a-z]/g, "")
              )
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

  const CustomersTab = () => {
    const del = (id) => {
      if (confirm("Delete customer?"))
        setCustomers((prev) => prev.filter((c) => c.id !== id));
    };
    const quickInv = (c) => {
      const due = addDays(new Date(), c.paymentTerms);
      setEditingInvoice({
        id: `ari${Date.now()}`,
        customerId: c.id,
        invoiceNo: `AR-${format(new Date(), "yyyy")}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        soNo: "",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(due, "yyyy-MM-dd"),
        total: 0,
        balance: 0,
        status: "open",
        approval: "sent",
        file: null,
      });
      setShowInvoiceModal(true);
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Customers ({customers.length})</h2>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowCustomerModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add
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
                  Credit Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 text-sm">{c.code}</td>
                  <td className="px-6 py-4 text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.email}
                    <br />
                    {c.phone}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    ${c.creditLimit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => quickInv(c)}
                      className="text-blue-600 hover:underline mr-3 text-xs"
                    >
                      Quick Invoice
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomer(c);
                        setShowCustomerModal(true);
                      }}
                      className="text-indigo-600 mr-2"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => del(c.id)} className="text-red-600">
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

  const InvoicesTab = () => {
    const [localSel, setLocalSel] = useState([]);
    const receivable = filteredInvoices.filter((i) => i.balance > 0);
    const selAll = (e) =>
      setLocalSel(e.target.checked ? receivable.map((i) => i.id) : []);
    const selOne = (id) =>
      setLocalSel((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    const selTotal = filteredInvoices
      .filter((i) => localSel.includes(i.id))
      .reduce((s, i) => s + i.balance, 0);
    const proceed = () => {
      setSelectedInvoices(localSel);
      setSelectedTab("receipts");
    };
    const edit = (inv) => {
      setEditingInvoice(inv);
      setShowInvoiceModal(true);
    };
    const del = (id) => {
      if (confirm("Delete?"))
        setArInvoices((prev) => prev.filter((i) => i.id !== id));
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
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
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        </div>
        {localSel.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">
              {localSel.length} selected
            </span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-blue-700">
                ${selTotal.toFixed(2)}
              </span>
              <button
                onClick={proceed}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm"
              >
                Apply Receipt
              </button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    onChange={selAll}
                    checked={
                      localSel.length === receivable.length &&
                      receivable.length > 0
                    }
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
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
                  File
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((inv) => {
                const c = customers.find((x) => x.id === inv.customerId);
                return (
                  <tr key={inv.id}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={localSel.includes(inv.id)}
                        onChange={() => selOne(inv.id)}
                        disabled={inv.balance <= 0}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-6 py-4 text-sm">{c?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(parseISO(inv.dueDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${inv.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {inv.file ? (
                        <a
                          href={inv.file}
                          target="_blank"
                          className="text-indigo-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => edit(inv)}
                        className="text-indigo-600 mr-2"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => del(inv.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
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

  const ReceiptsTab = () => {
    const receivable = arInvoices.filter(
      (i) => selectedInvoices.includes(i.id) && i.balance > 0
    );
    const totalRec = receivable.reduce((s, i) => s + i.balance, 0);
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Receipts ({receipts.length})</h2>
          <button
            onClick={handleExportReceipts}
            className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        {receivable.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Ready to Apply</h3>
            <div className="space-y-1 text-sm">
              {receivable.map((inv) => (
                <div key={inv.id} className="flex justify-between">
                  <span>{inv.invoiceNo}</span>
                  <span className="font-medium">${inv.balance.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-green-300 font-semibold text-green-800">
              Total: ${totalRec.toFixed(2)}
            </div>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg w-full"
            >
              Record Receipt
            </button>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
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
              {receipts.map((r) => {
                const c = customers.find((x) => x.id === r.customerId);
                return (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-sm">
                      {format(parseISO(r.date), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm">{c?.name}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${r.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">{r.method}</td>
                    <td className="px-6 py-4">
                      {r.reconciled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XSquare className="w-5 h-5 text-red-600" />
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

  // ==================== RENDER ====================
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Accounts Receivable
            </h1>
            <p className="text-gray-600 mt-1">
              Full-cycle AR with customers, invoices, receipts, and GL
              integration.
            </p>
          </div>
          <div className="flex space-x-1 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
            {["dashboard", "customers", "invoices", "receipts"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTab(t)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  selectedTab === t
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t === "customers" ? "Customers" : t}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            {selectedTab === "dashboard" && <DashboardTab />}
            {selectedTab === "customers" && <CustomersTab />}
            {selectedTab === "invoices" && <InvoicesTab />}
            {selectedTab === "receipts" && <ReceiptsTab />}
          </div>
        </div>
      </div>
      {showCustomerModal && <CustomerModal />}
      {showInvoiceModal && <InvoiceModal />}
      {showReceiptModal && <ReceiptModal />}
      {showReconcileModal && <ReconcileModal />}
    </>
  );
}
