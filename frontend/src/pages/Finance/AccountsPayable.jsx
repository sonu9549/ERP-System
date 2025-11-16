import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { format, addDays, parseISO, isValid, subDays } from "date-fns";
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
  Upload,
  Search,
  BarChart3,
  Users,
  FileDigit,
  CreditCard as PaymentIcon,
  RefreshCw,
  X,
  Save,
  Calendar,
  Percent,
  FileUp,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Safe format utility
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

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    open: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      Icon: Clock,
      label: "Open",
    },
    partial: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      Icon: AlertCircle,
      label: "Partial",
    },
    paid: {
      bg: "bg-green-100",
      text: "text-green-700",
      Icon: CheckCircle,
      label: "Paid",
    },
    overdue: {
      bg: "bg-red-100",
      text: "text-red-700",
      Icon: AlertCircle,
      label: "Overdue",
    },
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <config.Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Approval Badge Component
const ApprovalBadge = ({ status }) => {
  const approvalConfig = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
    approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  };

  const config = approvalConfig[status] || approvalConfig.pending;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// Modal Component for Vendors
const VendorModal = ({ vendor, onSave, onClose }) => {
  const [form, setForm] = useState(
    vendor || {
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      paymentTerms: 30,
      category: "Supplier",
      contactPerson: "",
      website: "",
      notes: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      alert("Vendor name and code are required");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {vendor ? "Edit Vendor" : "Add New Vendor"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter vendor name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VEND001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="vendor@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 1234567890"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="GSTIN/PAN Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                value={form.paymentTerms}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentTerms: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Supplier">Supplier</option>
                <option value="Service Provider">Service Provider</option>
                <option value="Contractor">Contractor</option>
                <option value="Consultant">Consultant</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about the vendor"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {vendor ? "Update Vendor" : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Component for Invoices
const InvoiceModal = ({ invoice, onSave, onClose, vendors }) => {
  const [form, setForm] = useState(
    invoice || {
      vendorId: "",
      invoiceNo: "",
      poNo: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      subtotal: "",
      discountPercent: "",
      taxPercent: "",
      description: "",
      fileName: "",
      file: null,
    }
  );

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setForm((prev) => ({
          ...prev,
          file: URL.createObjectURL(file),
          fileName: file.name,
        }));
      } else {
        alert("Please upload a PDF file only.");
      }
    }
  };

  const calculateTotals = () => {
    const subtotal = parseFloat(form.subtotal) || 0;
    const discountPercent = parseFloat(form.discountPercent) || 0;
    const taxPercent = parseFloat(form.taxPercent) || 0;

    const discount = subtotal * (discountPercent / 100);
    const taxable = subtotal - discount;
    const tax = taxable * (taxPercent / 100);
    const total = taxable + tax;

    return { subtotal, discount, tax, total, discountPercent, taxPercent };
  };

  const { subtotal, discount, tax, total } = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vendorId || !form.invoiceNo || !form.subtotal) {
      alert(
        "Please fill in all required fields (Vendor, Invoice No, Subtotal)"
      );
      return;
    }

    const totals = calculateTotals();
    onSave({
      ...form,
      ...totals,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {invoice ? "Edit Invoice" : "Create New Invoice"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} ({vendor.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={form.invoiceNo}
                onChange={(e) =>
                  setForm({ ...form, invoiceNo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="INV-2024-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Number
              </label>
              <input
                type="text"
                value={form.poNo}
                onChange={(e) => setForm({ ...form, poNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="PO-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm({ ...form, issueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtotal Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.subtotal}
                onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={form.discountPercent}
                  onChange={(e) =>
                    setForm({ ...form, discountPercent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <Percent className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={form.taxPercent}
                  onChange={(e) =>
                    setForm({ ...form, taxPercent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <Percent className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Invoice description or notes"
            />
          </div>

          {/* Calculation Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-3">Amount Calculation</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {form.discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({form.discountPercent}%):</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {form.taxPercent > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Tax ({form.taxPercent}%):</span>
                  <span>+₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attach Invoice (PDF)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <FileUp className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {form.fileName
                  ? `Selected: ${form.fileName}`
                  : "Click to upload PDF file"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {invoice ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Component for Payments
const PaymentModal = ({
  invoices,
  vendors,
  onSave,
  onClose,
  selectedInvoices,
}) => {
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    method: "Bank Transfer",
    reference: `PAY-${Date.now().toString().slice(-6)}`,
    notes: "",
    amount: "",
  });

  const payableInvoices = invoices.filter(
    (inv) =>
      selectedInvoices.includes(inv.id) &&
      inv.balance > 0 &&
      inv.approval === "approved"
  );

  const totalPayable = payableInvoices.reduce(
    (sum, inv) => sum + inv.balance,
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount) || 0;

    if (amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (amount > totalPayable) {
      alert("Payment amount cannot exceed total payable amount");
      return;
    }

    onSave({
      ...form,
      amount,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Record Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected Invoices Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Selected Invoices</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {payableInvoices.map((invoice) => {
                const vendor = vendors.find((v) => v.id === invoice.vendorId);
                return (
                  <div
                    key={invoice.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoiceNo}</p>
                      <p className="text-sm text-gray-600">{vendor?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₹{invoice.balance.toFixed(2)}
                      </p>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
              <span>Total Payable:</span>
              <span>₹{totalPayable.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                max={totalPayable}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₹{totalPayable.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Payment reference"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Payment notes or description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reconcile Tab Component
const ReconcileTab = ({ payments, vendors, bankTransactions, onReconcile }) => {
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedBankTransaction, setSelectedBankTransaction] = useState("");

  const unreconciledPayments = payments.filter((p) => !p.reconciled);
  const unreconciledBankTransactions = bankTransactions.filter(
    (t) => !t.reconciled && t.type === "debit"
  );

  const handleReconcile = () => {
    if (!selectedPayment || !selectedBankTransaction) {
      alert("Please select both a payment and a bank transaction to reconcile");
      return;
    }
    onReconcile(selectedPayment, selectedBankTransaction);
    setSelectedPayment("");
    setSelectedBankTransaction("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reconcile Payments</h2>
        <div className="text-sm text-gray-600">
          {unreconciledPayments.length} unreconciled payments
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unreconciled Payments */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            AP Payments (Unreconciled)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unreconciledPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>All payments are reconciled!</p>
              </div>
            ) : (
              unreconciledPayments.map((payment) => {
                const vendor = vendors.find((v) => v.id === payment.vendorId);
                return (
                  <div
                    key={payment.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPayment === payment.id
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPayment(payment.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {vendor?.name || "Unknown Vendor"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {safeFormat(payment.date)} • {payment.method}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ₹{payment.amount.toFixed(2)}
                        </p>
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Unreconciled Bank Transactions */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Bank Transactions (Unmatched)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unreconciledBankTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No pending bank transactions</p>
              </div>
            ) : (
              unreconciledBankTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBankTransaction === transaction.id
                      ? "bg-green-50 border-green-500"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedBankTransaction(transaction.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {safeFormat(transaction.date)} • {transaction.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">
                        -₹{transaction.amount.toFixed(2)}
                      </p>
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Unmatched
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reconcile Button */}
      <div className="flex justify-center">
        <button
          onClick={handleReconcile}
          disabled={!selectedPayment || !selectedBankTransaction}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <CheckCheck className="w-5 h-5" />
          Reconcile Selected Items
        </button>
      </div>

      {/* Selected Items Summary */}
      {(selectedPayment || selectedBankTransaction) && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            Selected for Reconciliation:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedPayment && (
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-sm text-blue-700">
                  Selected Payment
                </p>
                {(() => {
                  const payment = unreconciledPayments.find(
                    (p) => p.id === selectedPayment
                  );
                  const vendor = vendors.find(
                    (v) => v.id === payment?.vendorId
                  );
                  return (
                    <p className="text-sm">
                      {vendor?.name} - ₹{payment?.amount.toFixed(2)}
                    </p>
                  );
                })()}
              </div>
            )}
            {selectedBankTransaction && (
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-sm text-green-700">
                  Selected Bank Transaction
                </p>
                {(() => {
                  const transaction = unreconciledBankTransactions.find(
                    (t) => t.id === selectedBankTransaction
                  );
                  return (
                    <p className="text-sm">
                      {transaction?.description} - ₹
                      {transaction?.amount.toFixed(2)}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main AccountsPayable Component
export default function AccountsPayable() {
  const {
    // Finance Context Data
    vendors = [],
    setVendors,
    invoices = [],
    setInvoices,
    payments = [],
    setPayments,
    chartOfAccounts,
    journalEntries,
    auditLogs,
    setAuditLogs,
    bankTransactions = [],
    setBankTransactions,

    // Finance Context Methods
    postToGL,
    formatCurrency,
    logAudit,
    getAccount,
    createJournalEntry,

    // Quick Accounts
    ap: apAccount,
    cash: cashAccount,
    bank: bankAccount,
  } = useFinance();

  // UI State
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Get AP-related accounts
  const expenseAccount = useMemo(
    () =>
      getAccount("Expense") ||
      getAccount("Operating Expense") ||
      chartOfAccounts.find((acc) => acc.type === "Expense"),
    [getAccount, chartOfAccounts]
  );

  // Enhanced Dashboard Totals
  const dashboardTotals = useMemo(() => {
    const openInvoices = invoices.filter((i) =>
      ["open", "partial"].includes(i.status)
    );
    const dueSoonInvoices = invoices.filter((i) => {
      if (!i.dueDate || i.status !== "open") return false;
      try {
        const due = parseISO(i.dueDate);
        if (!isValid(due)) return false;
        const days = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days > 0;
      } catch {
        return false;
      }
    });
    const overdueInvoices = invoices.filter((i) => {
      if (!i.dueDate || i.balance <= 0) return false;
      try {
        const due = parseISO(i.dueDate);
        if (!isValid(due)) return false;
        return due < new Date();
      } catch {
        return false;
      }
    });
    const pendingApproval = invoices.filter((i) => i.approval === "pending");

    return {
      totalAP: invoices.reduce((sum, i) => sum + (i.balance || 0), 0),
      openAmount: openInvoices.reduce((sum, i) => sum + (i.balance || 0), 0),
      overdueAmount: overdueInvoices.reduce(
        (sum, i) => sum + (i.balance || 0),
        0
      ),
      dueSoonAmount: dueSoonInvoices.reduce(
        (sum, i) => sum + (i.balance || 0),
        0
      ),
      pendingApproval: pendingApproval.length,
      totalVendors: vendors.length,
      reconciledPayments: payments.filter((p) => p.reconciled).length,
      unreconciledPayments: payments.filter((p) => !p.reconciled).length,
      totalPayments: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  }, [invoices, vendors, payments]);

  // Enhanced invoice filtering
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter((i) => i.vendorId === vendorFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((i) => {
        const vendor = vendors.find((v) => v.id === i.vendorId);
        return (
          (i.invoiceNo || "").toLowerCase().includes(term) ||
          (i.poNo || "").toLowerCase().includes(term) ||
          (vendor?.name || "").toLowerCase().includes(term) ||
          (vendor?.code || "").toLowerCase().includes(term)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // Approval filter
    if (approvalFilter !== "all") {
      filtered = filtered.filter((i) => i.approval === approvalFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      filtered = filtered.filter((i) => {
        if (!i.dueDate) return false;
        try {
          const dueDate = parseISO(i.dueDate);
          if (!isValid(dueDate)) return false;

          const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

          switch (dateRange) {
            case "overdue":
              return diffDays < 0;
            case "week":
              return diffDays >= 0 && diffDays <= 7;
            case "month":
              return diffDays >= 0 && diffDays <= 30;
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    return filtered.sort(
      (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
    );
  }, [
    invoices,
    vendors,
    vendorFilter,
    searchTerm,
    statusFilter,
    approvalFilter,
    dateRange,
  ]);

  // Enhanced Audit Logging
  const enhancedLogAudit = useCallback(
    (action, details = {}) => {
      const auditDetails = {
        module: "Accounts Payable",
        tab: selectedTab,
        ...details,
      };

      if (logAudit) {
        logAudit(action, auditDetails);
      } else {
        // Fallback audit logging
        const auditLog = {
          id: `audit_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action,
          user: "AP User",
          details: auditDetails,
        };
        setAuditLogs((prev) => [...prev.slice(-999), auditLog]);
      }
    },
    [logAudit, selectedTab, setAuditLogs]
  );

  // Export Functions
  const exportToCSV = useCallback(
    (data, filename) => {
      if (!data.length) {
        alert("No data to export!");
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      );

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      enhancedLogAudit("CSV Export", { filename, recordCount: data.length });
    },
    [enhancedLogAudit]
  );

  const exportToPDF = useCallback(
    (data, columns, title) => {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text(title, 14, 15);

      // Date
      doc.setFontSize(10);
      doc.text(
        `Generated on: ${format(new Date(), "dd MMM yyyy HH:mm")}`,
        14,
        22
      );

      // Prepare table data
      const tableColumns = columns.map((col) => col.header);
      const tableRows = data.map((row) =>
        columns.map((col) => {
          const value = row[col.key];
          if (col.format === "currency") {
            return formatCurrency
              ? formatCurrency(value)
              : `₹${Number(value).toFixed(2)}`;
          }
          if (col.format === "date" && value) {
            return safeFormat(value);
          }
          return value || "";
        })
      );

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(
        `${title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`
      );
      enhancedLogAudit("PDF Export", { title, recordCount: data.length });
    },
    [formatCurrency, enhancedLogAudit]
  );

  // Export Handlers
  const handleExportInvoices = useCallback(() => {
    const data = filteredInvoices.map((inv) => {
      const vendor = vendors.find((v) => v.id === inv.vendorId);
      return {
        "Invoice No": inv.invoiceNo || "",
        "PO No": inv.poNo || "-",
        Vendor: vendor?.name || "",
        "Vendor Code": vendor?.code || "",
        "Issue Date": safeFormat(inv.issueDate),
        "Due Date": safeDueDate(inv.dueDate),
        Subtotal: inv.subtotal || 0,
        "Discount %": inv.discountPercent || 0,
        "Discount Amount": inv.discount || 0,
        "Tax %": inv.taxPercent || 0,
        "Tax Amount": inv.tax || 0,
        "Total Amount": inv.total || 0,
        "Balance Due": inv.balance || 0,
        Status: inv.status,
        "Approval Status": inv.approval,
        "Approved By": inv.approvedBy || "-",
        "Approved Date": inv.approvedAt ? safeFormat(inv.approvedAt) : "-",
      };
    });

    exportToCSV(data, "AP_Invoices");
  }, [filteredInvoices, vendors, exportToCSV]);

  const handleExportInvoicesPDF = useCallback(() => {
    const columns = [
      { header: "Invoice No", key: "invoiceNo" },
      { header: "Vendor", key: "vendorName" },
      { header: "Due Date", key: "dueDate", format: "date" },
      { header: "Total", key: "total", format: "currency" },
      { header: "Balance", key: "balance", format: "currency" },
      { header: "Status", key: "status" },
      { header: "Approval", key: "approval" },
    ];

    const data = filteredInvoices.map((inv) => {
      const vendor = vendors.find((v) => v.id === inv.vendorId);
      return {
        invoiceNo: inv.invoiceNo,
        vendorName: vendor?.name || "",
        dueDate: inv.dueDate,
        total: inv.total,
        balance: inv.balance,
        status: inv.status,
        approval: inv.approval,
      };
    });

    exportToPDF(data, columns, "Accounts Payable Invoices");
  }, [filteredInvoices, vendors, exportToPDF]);

  // Enhanced Print Invoice
  const printInvoice = useCallback(
    (invoice) => {
      const vendor = vendors.find((v) => v.id === invoice.vendorId);
      const printWindow = window.open("", "_blank");

      const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
          .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info { float: right; text-align: right; }
          .invoice-details { margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
          .total-row { background-color: #f1f5f9; font-weight: bold; }
          .status-badge { padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; }
          .status-open { background: #ef4444; }
          .status-partial { background: #f59e0b; }
          .status-paid { background: #10b981; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <div class="company-info">
            <strong>Your Company</strong><br>
            123 Business Street<br>
            City, State 12345<br>
            contact@company.com
          </div>
        </div>
        
        <div class="invoice-details">
          <div style="float: left; width: 50%;">
            <strong>Bill To:</strong><br>
            ${vendor?.name || "Vendor"}<br>
            ${vendor?.address || ""}<br>
            ${vendor?.email || ""}
          </div>
          <div style="float: right; width: 40%;">
            <strong>Invoice #:</strong> ${invoice.invoiceNo}<br>
            <strong>PO #:</strong> ${invoice.poNo || "N/A"}<br>
            <strong>Issue Date:</strong> ${safeFormat(invoice.issueDate)}<br>
            <strong>Due Date:</strong> ${safeDueDate(invoice.dueDate)}<br>
            <strong>Status:</strong> 
            <span class="status-badge status-${
              invoice.status
            }">${invoice.status.toUpperCase()}</span>
          </div>
          <div style="clear: both;"></div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">${
                formatCurrency
                  ? formatCurrency(invoice.subtotal)
                  : `₹${(invoice.subtotal || 0).toFixed(2)}`
              }</td>
            </tr>
            ${
              invoice.discountPercent
                ? `
            <tr>
              <td>Discount (${invoice.discountPercent}%)</td>
              <td style="text-align: right;">-${
                formatCurrency
                  ? formatCurrency(invoice.discount)
                  : `₹${(invoice.discount || 0).toFixed(2)}`
              }</td>
            </tr>
            `
                : ""
            }
            ${
              invoice.taxPercent
                ? `
            <tr>
              <td>Tax (${invoice.taxPercent}%)</td>
              <td style="text-align: right;">${
                formatCurrency
                  ? formatCurrency(invoice.tax)
                  : `₹${(invoice.tax || 0).toFixed(2)}`
              }</td>
            </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td><strong>TOTAL DUE</strong></td>
              <td style="text-align: right;"><strong>${
                formatCurrency
                  ? formatCurrency(invoice.balance)
                  : `₹${(invoice.balance || 0).toFixed(2)}`
              }</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Approval:</strong> ${
            invoice.approval === "approved"
              ? `Approved by ${invoice.approvedBy} on ${safeFormat(
                  invoice.approvedAt
                )}`
              : "Pending Approval"
          }</p>
          <p><strong>Payment Terms:</strong> Net ${
            vendor?.paymentTerms || 30
          } days</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;

      printWindow.document.write(content);
      printWindow.document.close();
      enhancedLogAudit("Invoice Printed", { invoiceNo: invoice.invoiceNo });
    },
    [vendors, formatCurrency, enhancedLogAudit]
  );

  // Enhanced Email Invoice
  const emailInvoice = useCallback(
    (invoice) => {
      const vendor = vendors.find((v) => v.id === invoice.vendorId);
      const subject = `Invoice ${invoice.invoiceNo} - ${
        formatCurrency
          ? formatCurrency(invoice.balance)
          : `₹${(invoice.balance || 0).toFixed(2)}`
      } Due`;
      const body = `Dear ${vendor?.name},\n\nPlease find attached invoice ${
        invoice.invoiceNo
      }.\n\nAmount Due: ${
        formatCurrency
          ? formatCurrency(invoice.balance)
          : `₹${(invoice.balance || 0).toFixed(2)}`
      }\nDue Date: ${safeDueDate(
        invoice.dueDate
      )}\n\nThank you for your business.\n\nBest regards,\nYour Company`;

      window.open(
        `mailto:${vendor?.email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`
      );
      enhancedLogAudit("Invoice Emailed", {
        invoiceNo: invoice.invoiceNo,
        vendor: vendor?.name,
      });
    },
    [vendors, formatCurrency, enhancedLogAudit]
  );

  // Enhanced Approve Invoice with GL Integration
  const approveInvoice = useCallback(
    (invoiceId) => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === invoiceId && inv.approval !== "approved") {
            // Post to General Ledger
            if (postToGL && apAccount && expenseAccount) {
              try {
                postToGL(
                  expenseAccount.id,
                  apAccount.id,
                  inv.total,
                  `AP Invoice Approval - ${inv.invoiceNo}`,
                  `INV-${inv.invoiceNo}`,
                  inv.issueDate
                );
              } catch (error) {
                console.error("GL Posting failed:", error);
              }
            }

            enhancedLogAudit("Invoice Approved", {
              invoiceNo: inv.invoiceNo,
              amount: inv.total,
              vendorId: inv.vendorId,
            });

            return {
              ...inv,
              approval: "approved",
              approvedBy: "Current User",
              approvedAt: new Date().toISOString(),
            };
          }
          return inv;
        })
      );
    },
    [postToGL, apAccount, expenseAccount, setInvoices, enhancedLogAudit]
  );

  // Enhanced Vendor Management
  const saveVendor = useCallback(
    (vendorData) => {
      if (editingVendor) {
        setVendors((prev) =>
          prev.map((v) =>
            v.id === editingVendor.id
              ? { ...v, ...vendorData, updatedAt: new Date().toISOString() }
              : v
          )
        );
        enhancedLogAudit("Vendor Updated", {
          vendorId: editingVendor.id,
          vendorName: vendorData.name,
        });
      } else {
        const newVendor = {
          id: `vnd_${Date.now()}`,
          ...vendorData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setVendors((prev) => [...prev, newVendor]);
        enhancedLogAudit("Vendor Created", {
          vendorId: newVendor.id,
          vendorName: vendorData.name,
        });
      }
      setShowVendorModal(false);
      setEditingVendor(null);
    },
    [editingVendor, setVendors, enhancedLogAudit]
  );

  const deleteVendor = useCallback(
    (vendorId) => {
      const vendor = vendors.find((v) => v.id === vendorId);
      if (
        vendor &&
        confirm(`Are you sure you want to delete vendor "${vendor.name}"?`)
      ) {
        // Check if vendor has invoices
        const vendorInvoices = invoices.filter(
          (inv) => inv.vendorId === vendorId
        );
        if (vendorInvoices.length > 0) {
          alert(
            "Cannot delete vendor with existing invoices. Please reassign or delete the invoices first."
          );
          return;
        }

        setVendors((prev) => prev.filter((v) => v.id !== vendorId));
        enhancedLogAudit("Vendor Deleted", {
          vendorId,
          vendorName: vendor.name,
        });
      }
    },
    [vendors, invoices, setVendors, enhancedLogAudit]
  );

  // Enhanced Invoice Management with GL Integration
  const saveInvoice = useCallback(
    (invoiceData) => {
      const vendor = vendors.find((v) => v.id === invoiceData.vendorId);
      const subtotal = Number(invoiceData.subtotal) || 0;
      const discountPercent = Number(invoiceData.discountPercent) || 0;
      const taxPercent = Number(invoiceData.taxPercent) || 0;

      const discount = subtotal * (discountPercent / 100);
      const tax = (subtotal - discount) * (taxPercent / 100);
      const total = subtotal - discount + tax;

      const newInvoice = {
        id: editingInvoice?.id || `inv_${Date.now()}`,
        ...invoiceData,
        subtotal,
        discount,
        discountPercent,
        tax,
        taxPercent,
        total,
        balance: total, // Start with full balance
        dueDate: format(
          addDays(new Date(invoiceData.issueDate), vendor?.paymentTerms || 30),
          "yyyy-MM-dd"
        ),
        status: "open",
        approval: editingInvoice?.approval || "pending",
        approvedBy: editingInvoice?.approvedBy || null,
        approvedAt: editingInvoice?.approvedAt || null,
        createdAt: editingInvoice?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setInvoices((prev) => {
        if (editingInvoice) {
          return prev.map((inv) =>
            inv.id === editingInvoice.id ? newInvoice : inv
          );
        } else {
          // Post to GL for new invoices
          if (postToGL && expenseAccount && apAccount) {
            try {
              postToGL(
                expenseAccount.id,
                apAccount.id,
                total,
                `AP Invoice - ${invoiceData.invoiceNo}`,
                `INV-${invoiceData.invoiceNo}`,
                invoiceData.issueDate
              );
            } catch (error) {
              console.error("GL Posting failed:", error);
            }
          }

          enhancedLogAudit("Invoice Created", {
            invoiceNo: invoiceData.invoiceNo,
            amount: total,
            vendorId: invoiceData.vendorId,
          });

          return [...prev, newInvoice];
        }
      });

      setShowInvoiceModal(false);
      setEditingInvoice(null);
    },
    [
      editingInvoice,
      vendors,
      setInvoices,
      postToGL,
      expenseAccount,
      apAccount,
      enhancedLogAudit,
    ]
  );

  const deleteInvoice = useCallback(
    (invoiceId) => {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (invoice && confirm(`Delete invoice ${invoice.invoiceNo}?`)) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
        enhancedLogAudit("Invoice Deleted", {
          invoiceNo: invoice.invoiceNo,
          invoiceId: invoiceId,
        });
      }
    },
    [invoices, setInvoices, enhancedLogAudit]
  );

  // Enhanced Payment Processing with GL Integration
  const processPayment = useCallback(
    (paymentData) => {
      const payableInvoices = invoices.filter(
        (inv) =>
          selectedInvoices.includes(inv.id) &&
          inv.balance > 0 &&
          inv.approval === "approved"
      );

      const totalAmount = Number(paymentData.amount) || 0;

      if (totalAmount <= 0) {
        alert("Please enter a valid payment amount.");
        return;
      }

      const payment = {
        id: `pay_${Date.now()}`,
        invoiceIds: payableInvoices.map((inv) => inv.id),
        vendorId: payableInvoices[0]?.vendorId || "",
        amount: totalAmount,
        date: paymentData.date || format(new Date(), "yyyy-MM-dd"),
        method: paymentData.method || "Cash",
        reference: paymentData.reference || "",
        notes: paymentData.notes || "",
        reconciled: false,
        createdAt: new Date().toISOString(),
      };

      // Update invoices with payment allocation
      let remainingAmount = totalAmount;
      const updatedInvoices = [...invoices];

      payableInvoices.forEach((invoice) => {
        if (remainingAmount <= 0) return;

        const paymentAmount = Math.min(invoice.balance, remainingAmount);
        const invoiceIndex = updatedInvoices.findIndex(
          (inv) => inv.id === invoice.id
        );

        if (invoiceIndex !== -1) {
          updatedInvoices[invoiceIndex] = {
            ...updatedInvoices[invoiceIndex],
            balance: updatedInvoices[invoiceIndex].balance - paymentAmount,
            status:
              updatedInvoices[invoiceIndex].balance - paymentAmount <= 0
                ? "paid"
                : "partial",
          };
          remainingAmount -= paymentAmount;
        }
      });

      // Post to GL
      if (postToGL && apAccount && cashAccount) {
        try {
          postToGL(
            apAccount.id,
            cashAccount.id,
            totalAmount,
            `AP Payment - ${paymentData.method}`,
            `PAY-${payment.reference}`,
            payment.date
          );
        } catch (error) {
          console.error("GL Posting failed:", error);
        }
      }

      setInvoices(updatedInvoices);
      setPayments((prev) => [...prev, payment]);
      setShowPaymentModal(false);
      setSelectedInvoices([]);

      enhancedLogAudit("Payment Processed", {
        amount: totalAmount,
        method: paymentData.method,
        invoiceCount: payableInvoices.length,
      });
    },
    [
      invoices,
      selectedInvoices,
      setInvoices,
      setPayments,
      postToGL,
      apAccount,
      cashAccount,
      enhancedLogAudit,
    ]
  );

  // Quick Pay function
  const quickPay = useCallback((invoice) => {
    if (invoice.approval !== "approved") {
      alert("Invoice must be approved before payment.");
      return;
    }
    if (invoice.balance <= 0) {
      alert("Invoice has no balance due.");
      return;
    }
    setSelectedInvoices([invoice.id]);
    setShowPaymentModal(true);
  }, []);

  // Reconcile Payment function
  const reconcilePayment = useCallback(
    (paymentId, bankTransactionId) => {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, reconciled: true, bankTransactionId } : p
        )
      );

      setBankTransactions((prev) =>
        prev.map((t) =>
          t.id === bankTransactionId ? { ...t, reconciled: true, paymentId } : t
        )
      );

      enhancedLogAudit("Payment Reconciled", {
        paymentId,
        bankTransactionId,
      });

      alert("Payment reconciled successfully!");
    },
    [setPayments, setBankTransactions, enhancedLogAudit]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setVendorFilter("all");
    setSearchTerm("");
    setStatusFilter("all");
    setApprovalFilter("all");
    setDateRange("all");
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Accounts Payable
                </h1>
                <p className="text-gray-600 mt-1">
                  Complete AP management with GL integration and reconciliation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Last sync: {format(new Date(), "HH:mm")}
                </span>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white rounded-xl shadow-sm p-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "vendors", label: "Vendors", icon: Users },
              { id: "invoices", label: "Invoices", icon: FileDigit },
              { id: "payments", label: "Payments", icon: PaymentIcon },
              { id: "reconcile", label: "Reconcile", icon: CheckCheck },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Dashboard Tab */}
            {selectedTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: "Total AP Balance",
                      value: dashboardTotals.totalAP,
                      color: "blue",
                      format: "currency",
                    },
                    {
                      label: "Overdue Amount",
                      value: dashboardTotals.overdueAmount,
                      color: "red",
                      format: "currency",
                    },
                    {
                      label: "Due Soon (7 days)",
                      value: dashboardTotals.dueSoonAmount,
                      color: "orange",
                      format: "currency",
                    },
                    {
                      label: "Pending Approval",
                      value: dashboardTotals.pendingApproval,
                      color: "yellow",
                      format: "number",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm"
                    >
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {stat.label}
                      </p>
                      <p
                        className={`text-2xl font-bold text-${stat.color}-600`}
                      >
                        {stat.format === "currency"
                          ? formatCurrency
                            ? formatCurrency(stat.value)
                            : `₹${stat.value.toFixed(2)}`
                          : stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setEditingInvoice(null);
                      setShowInvoiceModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Invoice
                  </button>
                  <button
                    onClick={() => {
                      setEditingVendor(null);
                      setShowVendorModal(true);
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Users className="w-4 h-4" /> Add Vendor
                  </button>
                  <button
                    onClick={handleExportInvoices}
                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button
                    onClick={handleExportInvoicesPDF}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-lg mb-4">
                      Recent Invoices
                    </h3>
                    <div className="space-y-3">
                      {invoices.slice(0, 5).map((invoice) => {
                        const vendor = vendors.find(
                          (v) => v.id === invoice.vendorId
                        );
                        return (
                          <div
                            key={invoice.id}
                            className="flex justify-between items-center p-3 bg-white rounded-lg border"
                          >
                            <div>
                              <p className="font-medium">{invoice.invoiceNo}</p>
                              <p className="text-sm text-gray-600">
                                {vendor?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency
                                  ? formatCurrency(invoice.balance)
                                  : `₹${invoice.balance.toFixed(2)}`}
                              </p>
                              <StatusBadge status={invoice.status} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-lg mb-4">
                      Recent Payments
                    </h3>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => {
                        const vendor = vendors.find(
                          (v) => v.id === payment.vendorId
                        );
                        return (
                          <div
                            key={payment.id}
                            className="flex justify-between items-center p-3 bg-white rounded-lg border"
                          >
                            <div>
                              <p className="font-medium">{vendor?.name}</p>
                              <p className="text-sm text-gray-600">
                                {safeFormat(payment.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">
                                {formatCurrency
                                  ? formatCurrency(payment.amount)
                                  : `₹${payment.amount.toFixed(2)}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {payment.method}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vendors Tab */}
            {selectedTab === "vendors" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    Vendors ({vendors.length})
                  </h2>
                  <button
                    onClick={() => {
                      setEditingVendor(null);
                      setShowVendorModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Vendor
                  </button>
                </div>

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
                          Terms
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendors.map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vendor.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{vendor.name}</p>
                              {vendor.contactPerson && (
                                <p className="text-xs text-gray-500">
                                  {vendor.contactPerson}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <p>{vendor.email}</p>
                              <p>{vendor.phone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Net {vendor.paymentTerms} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vendor.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setEditingVendor(vendor);
                                setShowVendorModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() => deleteVendor(vendor.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {selectedTab === "invoices" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    Invoices ({filteredInvoices.length})
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingInvoice(null);
                        setShowInvoiceModal(true);
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> New Invoice
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <select
                      value={vendorFilter}
                      onChange={(e) => setVendorFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Vendors</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approval
                    </label>
                    <select
                      value={approvalFilter}
                      onChange={(e) => setApprovalFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Dates</option>
                      <option value="overdue">Overdue</option>
                      <option value="week">Due in 7 Days</option>
                      <option value="month">Due in 30 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search invoices..."
                        className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Selected Invoices Action Bar */}
                {selectedInvoices.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-blue-800">
                        {selectedInvoices.length} invoice(s) selected
                      </span>
                      <p className="text-sm text-blue-600">
                        Total amount:{" "}
                        {formatCurrency
                          ? formatCurrency(
                              selectedInvoices.reduce((sum, id) => {
                                const inv = invoices.find((i) => i.id === id);
                                return sum + (inv?.balance || 0);
                              }, 0)
                            )
                          : `₹${selectedInvoices
                              .reduce((sum, id) => {
                                const inv = invoices.find((i) => i.id === id);
                                return sum + (inv?.balance || 0);
                              }, 0)
                              .toFixed(2)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay Selected
                    </button>
                  </div>
                )}

                {/* Invoices Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvoices(
                                  filteredInvoices
                                    .filter(
                                      (inv) =>
                                        inv.balance > 0 &&
                                        inv.approval === "approved"
                                    )
                                    .map((inv) => inv.id)
                                );
                              } else {
                                setSelectedInvoices([]);
                              }
                            }}
                            checked={
                              selectedInvoices.length > 0 &&
                              selectedInvoices.length ===
                                filteredInvoices.filter(
                                  (inv) =>
                                    inv.balance > 0 &&
                                    inv.approval === "approved"
                                ).length
                            }
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approval
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => {
                        const vendor = vendors.find(
                          (v) => v.id === invoice.vendorId
                        );
                        const isOverdue =
                          invoice.dueDate &&
                          parseISO(invoice.dueDate) < new Date() &&
                          invoice.balance > 0;
                        const canSelect =
                          invoice.balance > 0 &&
                          invoice.approval === "approved";

                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedInvoices.includes(invoice.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedInvoices((prev) => [
                                      ...prev,
                                      invoice.id,
                                    ]);
                                  } else {
                                    setSelectedInvoices((prev) =>
                                      prev.filter((id) => id !== invoice.id)
                                    );
                                  }
                                }}
                                disabled={!canSelect}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {invoice.invoiceNo}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {invoice.poNo || "No PO"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {safeFormat(invoice.issueDate)}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-gray-900">
                                {vendor?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {vendor?.code}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {safeDueDate(invoice.dueDate)}
                                </p>
                                {isOverdue && (
                                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatCurrency
                                    ? formatCurrency(invoice.balance)
                                    : `₹${invoice.balance.toFixed(2)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  of{" "}
                                  {formatCurrency
                                    ? formatCurrency(invoice.total)
                                    : `₹${invoice.total.toFixed(2)}`}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge
                                status={isOverdue ? "overdue" : invoice.status}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ApprovalBadge status={invoice.approval} />
                              {invoice.approval === "pending" && (
                                <button
                                  onClick={() => approveInvoice(invoice.id)}
                                  className="ml-2 text-green-600 hover:text-green-700 text-xs"
                                >
                                  Approve
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                              <button
                                onClick={() => printInvoice(invoice)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Print"
                              >
                                <Printer className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => emailInvoice(invoice)}
                                className="text-green-600 hover:text-green-900"
                                title="Email"
                              >
                                <Mail className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setShowInvoiceModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 inline" />
                              </button>
                              {canSelect && (
                                <button
                                  onClick={() => quickPay(invoice)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Quick Pay"
                                >
                                  <CreditCard className="w-4 h-4 inline" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-12">
                      <FileDigit className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">No invoices found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {searchTerm ||
                        vendorFilter !== "all" ||
                        statusFilter !== "all" ||
                        approvalFilter !== "all" ||
                        dateRange !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first invoice to get started"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {selectedTab === "payments" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    Payments ({payments.length})
                  </h2>
                  <div className="text-sm text-gray-600">
                    Total:{" "}
                    {formatCurrency
                      ? formatCurrency(dashboardTotals.totalPayments)
                      : `₹${dashboardTotals.totalPayments.toFixed(2)}`}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoices
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => {
                        const vendor = vendors.find(
                          (v) => v.id === payment.vendorId
                        );
                        const paymentInvoices = invoices.filter((inv) =>
                          payment.invoiceIds.includes(inv.id)
                        );

                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {safeFormat(payment.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-gray-900">
                                {vendor?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {vendor?.code}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.reference}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.method}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency
                                ? formatCurrency(payment.amount)
                                : `₹${payment.amount.toFixed(2)}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {payment.reconciled ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Reconciled
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {paymentInvoices.slice(0, 2).map((inv) => (
                                <div key={inv.id} className="text-xs">
                                  {inv.invoiceNo} (
                                  {formatCurrency
                                    ? formatCurrency(inv.balance)
                                    : `₹${inv.balance.toFixed(2)}`}
                                  )
                                </div>
                              ))}
                              {paymentInvoices.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{paymentInvoices.length - 2} more
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {payments.length === 0 && (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">
                        No payments recorded
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Payments will appear here when you process invoice
                        payments
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reconcile Tab */}
            {selectedTab === "reconcile" && (
              <ReconcileTab
                payments={payments}
                vendors={vendors}
                bankTransactions={bankTransactions}
                onReconcile={reconcilePayment}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVendorModal && (
        <VendorModal
          vendor={editingVendor}
          onSave={saveVendor}
          onClose={() => {
            setShowVendorModal(false);
            setEditingVendor(null);
          }}
        />
      )}

      {showInvoiceModal && (
        <InvoiceModal
          invoice={editingInvoice}
          onSave={saveInvoice}
          onClose={() => {
            setShowInvoiceModal(false);
            setEditingInvoice(null);
          }}
          vendors={vendors}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          invoices={invoices}
          vendors={vendors}
          onSave={processPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoices([]);
          }}
          selectedInvoices={selectedInvoices}
        />
      )}
    </>
  );
}
