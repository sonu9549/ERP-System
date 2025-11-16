// src/components/AccountsReceivable.jsx
import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { format, addDays, parseISO, isBefore, isAfter } from "date-fns";
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
  Search,
  Filter,
  Users,
  FileBarChart,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((value) =>
        typeof value === "string" && value.includes(",") ? `"${value}"` : value
      )
      .join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const getAgingBucket = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = Math.floor((today - due) / 86400000);
  if (diff <= 0) return "current";
  if (diff <= 30) return "1-30";
  if (diff <= 60) return "31-60";
  if (diff <= 90) return "61-90";
  return "90+";
};

const StatusBadge = ({ status }) => {
  const statusMap = {
    open: { bg: "bg-blue-100", text: "text-blue-700", Icon: Clock },
    partial: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      Icon: AlertCircle,
    },
    paid: { bg: "bg-green-100", text: "text-green-700", Icon: CheckCircle },
    overdue: { bg: "bg-red-100", text: "text-red-700", Icon: AlertCircle },
  };

  const { bg, text, Icon } = statusMap[status] || statusMap.open;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Modal = ({ children, onClose, title, size = "max-w-2xl" }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div
      className={`bg-white rounded-xl w-full ${size} p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
    >
      {title && <h3 className="text-xl font-semibold">{title}</h3>}
      {children}
    </div>
  </div>
);

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
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef(null);

  // Calculate totals with improved performance
  const totals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openInvoices = arInvoices.filter((i) =>
      ["open", "partial"].includes(i.status)
    );

    const dueSoon = arInvoices.filter((i) => {
      if (i.status !== "open" || i.balance <= 0) return false;
      const dueDate = new Date(i.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate - today) / 86400000);
      return daysUntilDue <= 7 && daysUntilDue > 0;
    });

    const overdue = arInvoices.filter((i) => {
      if (i.balance <= 0) return false;
      const dueDate = new Date(i.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    return {
      totalAR: arInvoices.reduce((sum, i) => sum + i.balance, 0),
      openAmount: openInvoices.reduce((sum, i) => sum + i.balance, 0),
      overdueAmount: overdue.reduce((sum, i) => sum + i.balance, 0),
      dueSoonAmount: dueSoon.reduce((sum, i) => sum + i.balance, 0),
      totalInvoices: arInvoices.length,
      openInvoices: openInvoices.length,
      reconciled: receipts.filter((r) => r.reconciled).length,
      unreconciled: receipts.filter((r) => !r.reconciled).length,
    };
  }, [arInvoices, receipts]);

  // Enhanced filtering with multiple criteria
  const filteredInvoices = useMemo(() => {
    let list = arInvoices.map((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customerId);
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let status = invoice.status;
      if (invoice.balance > 0 && dueDate < today && status !== "paid") {
        status = "overdue";
      }

      return {
        ...invoice,
        customerName: customer?.name || "",
        status,
      };
    });

    // Apply filters
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNo.toLowerCase().includes(term) ||
          i.customerName.toLowerCase().includes(term) ||
          i.soNo?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }

    if (customerFilter !== "all") {
      list = list.filter((i) => i.customerId === customerFilter);
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      list = list.filter(
        (i) =>
          isAfter(new Date(i.dueDate), startDate) ||
          format(new Date(i.dueDate), "yyyy-MM-dd") === dateRange.start
      );
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      list = list.filter(
        (i) =>
          isBefore(new Date(i.dueDate), endDate) ||
          format(new Date(i.dueDate), "yyyy-MM-dd") === dateRange.end
      );
    }

    return list;
  }, [
    arInvoices,
    customers,
    searchTerm,
    statusFilter,
    customerFilter,
    dateRange,
  ]);

  const agingSummary = useMemo(() => {
    const buckets = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };

    arInvoices.forEach((invoice) => {
      if (invoice.balance > 0) {
        const bucket = getAgingBucket(invoice.dueDate);
        buckets[bucket] += invoice.balance;
      }
    });

    return buckets;
  }, [arInvoices]);

  // Export functions
  const handleExportInvoices = useCallback(() => {
    const data = filteredInvoices.map((i) => ({
      "Invoice #": i.invoiceNo,
      "SO #": i.soNo || "",
      Customer: i.customerName,
      "Issue Date": i.issueDate,
      "Due Date": i.dueDate,
      Total: i.total,
      Balance: i.balance,
      Status: i.status,
      "Aging Bucket": getAgingBucket(i.dueDate),
    }));
    exportToCSV(data, "ar_invoices");
  }, [filteredInvoices]);

  const handleExportReceipts = useCallback(() => {
    const data = receipts.map((r) => {
      const customer = customers.find((c) => c.id === r.customerId);
      return {
        Date: r.date,
        Customer: customer?.name || "",
        Amount: r.amount,
        Method: r.method,
        "Invoice IDs": r.invoiceIds?.join("; ") || "",
        Reconciled: r.reconciled ? "Yes" : "No",
      };
    });
    exportToCSV(data, "ar_receipts");
  }, [receipts, customers]);

  // Customer Management
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
        category: "general",
      }
    );

    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};
      if (!form.name.trim()) newErrors.name = "Name is required";
      if (!form.code.trim()) newErrors.code = "Code is required";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
        newErrors.email = "Invalid email format";
      if (form.creditLimit < 0)
        newErrors.creditLimit = "Credit limit cannot be negative";
      if (form.paymentTerms <= 0)
        newErrors.paymentTerms = "Payment terms must be positive";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const save = () => {
      if (!validateForm()) return;

      if (editingCustomer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...form } : c))
        );
      } else {
        // Check for duplicate code
        if (customers.some((c) => c.code === form.code)) {
          setErrors({ code: "Customer code already exists" });
          return;
        }
        setCustomers((prev) => [
          ...prev,
          {
            id: `c${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...form,
          },
        ]);
      }
      setShowCustomerModal(false);
      setEditingCustomer(null);
    };

    return (
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              placeholder="Customer Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? "border-red-500" : ""
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <input
              placeholder="CUST-001"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.code ? "border-red-500" : ""
              }`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              placeholder="Full address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax ID</label>
            <input
              placeholder="Tax Identification Number"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="general">General</option>
              <option value="corporate">Corporate</option>
              <option value="government">Government</option>
              <option value="individual">Individual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Credit Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.creditLimit}
              onChange={(e) =>
                setForm({ ...form, creditLimit: +e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.creditLimit ? "border-red-500" : ""
              }`}
            />
            {errors.creditLimit && (
              <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Terms (days)
            </label>
            <input
              type="number"
              min="1"
              placeholder="30"
              value={form.paymentTerms}
              onChange={(e) =>
                setForm({ ...form, paymentTerms: +e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.paymentTerms ? "border-red-500" : ""
              }`}
            />
            {errors.paymentTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.paymentTerms}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => {
              setShowCustomerModal(false);
              setEditingCustomer(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Customer
          </button>
        </div>
      </Modal>
    );
  };

  // Invoice Management
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

    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};
      if (!form.customerId) newErrors.customerId = "Customer is required";
      if (!form.invoiceNo.trim())
        newErrors.invoiceNo = "Invoice number is required";
      if (form.total <= 0) newErrors.total = "Total must be greater than 0";
      if (form.cogs < 0) newErrors.cogs = "COGS cannot be negative";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleFile = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type === "application/pdf") {
          setForm((f) => ({ ...f, file: URL.createObjectURL(file) }));
          setUploadedFile(file);
        } else {
          alert("Please upload a PDF file");
        }
      }
    };

    const save = () => {
      if (!validateForm()) return;

      const customer = customers.find((c) => c.id === form.customerId);
      const dueDate = addDays(
        new Date(form.issueDate),
        customer?.paymentTerms || 30
      );

      const total = +form.total;
      const cogs = +form.cogs || 0;

      const invoiceData = {
        ...form,
        dueDate: format(dueDate, "yyyy-MM-dd"),
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
        updatedAt: new Date().toISOString(),
      };

      if (editingInvoice) {
        setArInvoices((prev) =>
          prev.map((i) =>
            i.id === editingInvoice.id ? { ...i, ...invoiceData } : i
          )
        );
      } else {
        const newInvoice = {
          id: `ari${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...invoiceData,
        };
        setArInvoices((prev) => [...prev, newInvoice]);

        // Post to GL
        postToGL(
          arAccount?.id,
          salesAccount?.id,
          total,
          `AR Invoice ${form.invoiceNo} Sales`
        );
        if (cogs > 0) {
          postToGL(
            cogsAccount?.id,
            null,
            cogs,
            `AR Invoice ${form.invoiceNo} COGS`
          );
        }
      }

      setShowInvoiceModal(false);
      setEditingInvoice(null);
      setUploadedFile(null);
    };

    return (
      <Modal
        title={editingInvoice ? "Edit Invoice" : "Create New Invoice"}
        onClose={() => {
          setShowInvoiceModal(false);
          setEditingInvoice(null);
          setUploadedFile(null);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer *</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.customerId ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Invoice # *
            </label>
            <input
              placeholder="INV-2024-001"
              value={form.invoiceNo}
              onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.invoiceNo ? "border-red-500" : ""
              }`}
            />
            {errors.invoiceNo && (
              <p className="text-red-500 text-xs mt-1">{errors.invoiceNo}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SO #</label>
            <input
              placeholder="SO-2024-001"
              value={form.soNo}
              onChange={(e) => setForm({ ...form, soNo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Issue Date</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Amount *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: +e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.total ? "border-red-500" : ""
              }`}
            />
            {errors.total && (
              <p className="text-red-500 text-xs mt-1">{errors.total}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">COGS</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.cogs}
              onChange={(e) => setForm({ ...form, cogs: +e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.cogs ? "border-red-500" : ""
              }`}
            />
            {errors.cogs && (
              <p className="text-red-500 text-xs mt-1">{errors.cogs}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Attach PDF</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {uploadedFile ? uploadedFile.name : "Click to upload PDF file"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 10MB
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

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => {
              setShowInvoiceModal(false);
              setEditingInvoice(null);
              setUploadedFile(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {editingInvoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </Modal>
    );
  };

  // Receipt Management
  const ReceiptModal = () => {
    const receivableInvoices = arInvoices.filter(
      (i) => selectedInvoices.includes(i.id) && i.balance > 0
    );
    const totalReceivable = receivableInvoices.reduce(
      (sum, i) => sum + i.balance,
      0
    );

    const [amount, setAmount] = useState(totalReceivable);
    const [method, setMethod] = useState("Wire");
    const [receiptDate, setReceiptDate] = useState(
      format(new Date(), "yyyy-MM-dd")
    );

    const recordReceipt = () => {
      if (amount <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      const receipt = {
        id: `r${Date.now()}`,
        invoiceIds: receivableInvoices.map((i) => i.id),
        customerId: receivableInvoices[0]?.customerId,
        amount: +amount,
        date: receiptDate,
        method,
        status: "applied",
        reconciled: false,
        createdAt: new Date().toISOString(),
      };

      setReceipts((prev) => [...prev, receipt]);

      // Update invoice balances
      let remainingAmount = +amount;
      setArInvoices((prev) =>
        prev.map((invoice) => {
          if (!receivableInvoices.find((i) => i.id === invoice.id))
            return invoice;

          const amountToApply = Math.min(invoice.balance, remainingAmount);
          remainingAmount -= amountToApply;

          const newBalance = invoice.balance - amountToApply;
          return {
            ...invoice,
            balance: newBalance,
            status: newBalance <= 0 ? "paid" : "partial",
          };
        })
      );

      // Post to GL
      postToGL(
        cashAccount?.id,
        arAccount?.id,
        +amount,
        `AR Receipt - ${method}`
      );

      setShowReceiptModal(false);
      setSelectedInvoices([]);
    };

    return (
      <Modal
        title="Record Payment Receipt"
        size="max-w-md"
        onClose={() => setShowReceiptModal(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Receipt Date
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(Math.min(+e.target.value || 0, totalReceivable))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ${totalReceivable.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="Wire">Wire Transfer</option>
              <option value="Check">Check</option>
              <option value="ACH">ACH</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {receivableInvoices.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Applied to Invoices:</h4>
              {receivableInvoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between text-sm">
                  <span>{invoice.invoiceNo}</span>
                  <span>${invoice.balance.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setShowReceiptModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={recordReceipt}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Record Receipt
          </button>
        </div>
      </Modal>
    );
  };

  // Reconcile Modal
  const ReconcileModal = () => {
    const matchDeposit = (depositId, receiptId) => {
      setReceipts((prev) =>
        prev.map((r) => (r.id === receiptId ? { ...r, reconciled: true } : r))
      );
      setBankDeposits((prev) =>
        prev.map((d) => (d.id === depositId ? { ...d, matched: true } : d))
      );
    };

    // Add safe fallbacks for undefined arrays
    const unreconciledReceipts = receipts?.filter((r) => !r.reconciled) || [];
    const unmatchedDeposits = bankDeposits?.filter((d) => !d.matched) || [];

    return (
      <Modal
        title="Bank Reconciliation"
        size="max-w-6xl"
        onClose={() => setShowReconcileModal(false)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-4">Bank Deposits</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unmatchedDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{deposit.description}</p>
                      <p className="text-sm text-gray-500">{deposit.date}</p>
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                      ${deposit.amount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Reference: {deposit.reference || "N/A"}
                  </p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      Unmatched
                    </span>
                  </div>
                </div>
              ))}
              {unmatchedDeposits.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {bankDeposits
                    ? "All deposits have been matched"
                    : "No bank deposits available"}
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">
              Unreconciled Receipts
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unreconciledReceipts.map((receipt) => {
                const customer = customers.find(
                  (c) => c.id === receipt.customerId
                );
                return (
                  <div
                    key={receipt.id}
                    className="p-4 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {customer?.name || "Unknown Customer"}
                        </p>
                        <p className="text-sm text-gray-500">{receipt.date}</p>
                      </div>
                      <p className="text-lg font-semibold text-blue-600">
                        ${receipt.amount?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Method: {receipt.method} | Invoices:{" "}
                      {receipt.invoiceIds?.length || 0}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        Unreconciled
                      </span>
                      <button
                        onClick={() => matchDeposit("d2", receipt.id)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                      >
                        Match to Deposit
                      </button>
                    </div>
                  </div>
                );
              })}
              {unreconciledReceipts.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {receipts
                    ? "All receipts have been reconciled"
                    : "No receipts available"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t mt-6">
          <button
            onClick={() => setShowReconcileModal(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close Reconciliation
          </button>
        </div>
      </Modal>
    );
  };

  // Tab Components
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total AR Balance",
            value: totals.totalAR,
            color: "indigo",
            icon: DollarSign,
          },
          {
            label: "Open Invoices",
            value: totals.openAmount,
            color: "blue",
            icon: FileText,
            subLabel: `${totals.openInvoices} invoices`,
          },
          {
            label: "Overdue",
            value: totals.overdueAmount,
            color: "red",
            icon: AlertCircle,
          },
          {
            label: "Due in 7 Days",
            value: totals.dueSoonAmount,
            color: "orange",
            icon: Clock,
          },
        ].map((metric, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {metric.label}
                </p>
                <p
                  className={`text-2xl font-bold text-${metric.color}-600 mt-1`}
                >
                  ${metric.value.toFixed(2)}
                </p>
                {metric.subLabel && (
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.subLabel}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full bg-${metric.color}-100`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aging Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Aging Summary</h3>
          <div className="text-sm text-gray-500">
            Total Outstanding:{" "}
            <span className="font-semibold">
              ${totals.openAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(agingSummary).map(([bucket, amount], index) => {
            const percentage =
              totals.openAmount > 0 ? (amount / totals.openAmount) * 100 : 0;
            const colors = [
              "bg-green-500",
              "bg-blue-500",
              "bg-yellow-500",
              "bg-orange-500",
              "bg-red-500",
            ];

            return (
              <div key={bucket} className="text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${amount.toFixed(2)}
                  </div>
                  <div className="text-sm font-medium text-gray-600 capitalize mb-3">
                    {bucket === "current" ? "Current" : `${bucket} days`}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[index]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setEditingInvoice(null);
            setShowInvoiceModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
        <button
          onClick={handleExportInvoices}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
        >
          <FileDown className="w-4 h-4" /> Export Invoices
        </button>
        <button
          onClick={() => setShowReconcileModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700"
        >
          <CheckSquare className="w-4 h-4" /> Reconcile Bank
        </button>
        <button
          onClick={() => setSelectedTab("customers")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700"
        >
          <Users className="w-4 h-4" /> Manage Customers
        </button>
      </div>
    </div>
  );

  const CustomersTab = () => {
    const deleteCustomer = (id) => {
      if (
        window.confirm(
          "Are you sure you want to delete this customer? This action cannot be undone."
        )
      ) {
        // Check if customer has invoices
        const hasInvoices = arInvoices.some(
          (invoice) => invoice.customerId === id
        );
        if (hasInvoices) {
          alert(
            "Cannot delete customer with existing invoices. Please reassign or delete the invoices first."
          );
          return;
        }
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      }
    };

    const quickInvoice = (customer) => {
      const dueDate = addDays(new Date(), customer.paymentTerms);
      setEditingInvoice({
        customerId: customer.id,
        invoiceNo: `INV-${format(new Date(), "yyyy")}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        soNo: "",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(dueDate, "yyyy-MM-dd"),
        total: 0,
        balance: 0,
        status: "open",
        approval: "sent",
        file: null,
      });
      setShowInvoiceModal(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
            <p className="text-gray-600 mt-1">
              {customers.length} customers registered
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowCustomerModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {customer.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${customer.creditLimit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.paymentTerms} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => quickInvoice(customer)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                        >
                          Quick Invoice
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowCustomerModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No customers
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first customer.
              </p>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowCustomerModal(true);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Add Customer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const InvoicesTab = () => {
    const [localSelection, setLocalSelection] = useState([]);

    const receivableInvoices = filteredInvoices.filter((i) => i.balance > 0);
    const selectedTotal = filteredInvoices
      .filter((i) => localSelection.includes(i.id))
      .reduce((sum, i) => sum + i.balance, 0);

    const selectAll = (e) => {
      setLocalSelection(
        e.target.checked ? receivableInvoices.map((i) => i.id) : []
      );
    };

    const selectOne = (id) => {
      setLocalSelection((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    const proceedToReceipt = () => {
      setSelectedInvoices(localSelection);
      setSelectedTab("receipts");
    };

    const editInvoice = (invoice) => {
      setEditingInvoice(invoice);
      setShowInvoiceModal(true);
    };

    const deleteInvoice = (id) => {
      if (
        window.confirm(
          "Are you sure you want to delete this invoice? This action cannot be undone."
        )
      ) {
        setArInvoices((prev) => prev.filter((i) => i.id !== id));
      }
    };

    const clearFilters = () => {
      setSearchTerm("");
      setStatusFilter("all");
      setCustomerFilter("all");
      setDateRange({ start: "", end: "" });
      setShowFilters(false);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
            <p className="text-gray-600 mt-1">
              {filteredInvoices.length} of {arInvoices.length} invoices
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportInvoices}
              className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => {
                setEditingInvoice(null);
                setShowInvoiceModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices, customers, SO numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {/* Date Range Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selection Banner */}
        {localSelection.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {localSelection.length} invoice
                {localSelection.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-blue-700">
                ${selectedTotal.toFixed(2)}
              </span>
              <button
                onClick={proceedToReceipt}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      onChange={selectAll}
                      checked={
                        localSelection.length === receivableInvoices.length &&
                        receivableInvoices.length > 0
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const customer = customers.find(
                    (c) => c.id === invoice.customerId
                  );
                  const isOverdue = invoice.status === "overdue";

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={localSelection.includes(invoice.id)}
                          onChange={() => selectOne(invoice.id)}
                          disabled={invoice.balance <= 0}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-indigo-600">
                            {invoice.invoiceNo}
                          </div>
                          {invoice.soNo && (
                            <div className="text-xs text-gray-500">
                              SO: {invoice.soNo}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Issued:{" "}
                            {format(parseISO(invoice.issueDate), "MMM d, yyyy")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer?.code || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-sm ${
                            isOverdue
                              ? "text-red-600 font-medium"
                              : "text-gray-900"
                          }`}
                        >
                          {format(parseISO(invoice.dueDate), "MMM d, yyyy")}
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-red-500">Overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ${invoice.balance.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          of ${invoice.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4">
                        {invoice.file ? (
                          <a
                            href={invoice.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editInvoice(invoice)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No invoices found
              </h3>
              <p className="text-gray-500 mb-4">
                {arInvoices.length === 0
                  ? "Get started by creating your first invoice."
                  : "Try adjusting your search or filters."}
              </p>
              {arInvoices.length === 0 && (
                <button
                  onClick={() => {
                    setEditingInvoice(null);
                    setShowInvoiceModal(true);
                  }}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" /> Create Invoice
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ReceiptsTab = () => {
    const selectedInvoicesData = arInvoices.filter(
      (i) => selectedInvoices.includes(i.id) && i.balance > 0
    );
    const totalSelected = selectedInvoicesData.reduce(
      (sum, i) => sum + i.balance,
      0
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Payment Receipts
            </h2>
            <p className="text-gray-600 mt-1">
              {receipts.length} receipts recorded •
              <span className="text-green-600 font-medium">
                {" "}
                ${receipts
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toFixed(2)}{" "}
                total
              </span>
            </p>
          </div>
          <button
            onClick={handleExportReceipts}
            className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
          >
            <Download className="w-4 h-4" /> Export Receipts
          </button>
        </div>

        {/* Selected Invoices Banner */}
        {selectedInvoicesData.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Ready to Apply Payment
              </h3>
              <button
                onClick={() => setShowReceiptModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Record Payment
              </button>
            </div>
            <div className="space-y-2">
              {selectedInvoicesData.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{invoice.invoiceNo}</span>
                  <span className="font-semibold">
                    ${invoice.balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-green-300 flex justify-between items-center font-semibold text-green-800">
              <span>Total Amount:</span>
              <span>${totalSelected.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Receipts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reconciled
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => {
                  const customer = customers.find(
                    (c) => c.id === receipt.customerId
                  );
                  return (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(receipt.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer?.name || "Unknown Customer"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {receipt.invoiceIds?.length || 0} invoice(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${receipt.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {receipt.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {receipt.reconciled ? (
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

          {receipts.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No receipts recorded
              </h3>
              <p className="text-gray-500 mb-4">
                Record payments against invoices to see them here.
              </p>
              <button
                onClick={() => setSelectedTab("invoices")}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Go to Invoices
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Accounts Receivable
                </h1>
                <p className="text-gray-600 mt-1">
                  Full-cycle AR management with customers, invoices, receipts,
                  and GL integration.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  ${totals.totalAR.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Total AR Balance</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-1 border border-gray-200">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "customers", label: "Customers", icon: Users },
                { id: "invoices", label: "Invoices", icon: FileText },
                { id: "receipts", label: "Receipts", icon: CreditCard },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedTab === tab.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            {selectedTab === "dashboard" && <DashboardTab />}
            {selectedTab === "customers" && <CustomersTab />}
            {selectedTab === "invoices" && <InvoicesTab />}
            {selectedTab === "receipts" && <ReceiptsTab />}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCustomerModal && <CustomerModal />}
      {showInvoiceModal && <InvoiceModal />}
      {showReceiptModal && <ReceiptModal />}
      {showReconcileModal && <ReconcileModal />}
    </>
  );
}
