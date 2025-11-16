// src/components/finance/BankAccounts.jsx
import React, { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Building,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  Landmark,
  Wallet,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useFinance } from "../../context/FinanceContext";

const BankAccounts = () => {
  const {
    bankAccounts = [],
    bankTransactions = [],
    bankDeposits = [],
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addBankTransaction,
    reconcileAccount,
    getCashFlowData,
  } = useFinance();

  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Safe cash flow data calculation
  const cashFlowData = useMemo(() => {
    if (typeof getCashFlowData === "function") {
      return getCashFlowData("month");
    }
    return {
      income: 0,
      expenses: 0,
      netCashFlow: 0,
      transactions: 0,
    };
  }, [getCashFlowData]);

  // Calculations and summaries with safe data access
  const totals = useMemo(() => {
    const totalBalance = (bankAccounts || []).reduce(
      (sum, acc) => sum + (acc?.balance || 0),
      0
    );
    const cashBalance = (bankAccounts || [])
      .filter((acc) => acc?.accountType === "checking")
      .reduce((sum, acc) => sum + (acc?.balance || 0), 0);
    const creditBalance = (bankAccounts || [])
      .filter((acc) => acc?.accountType === "credit")
      .reduce((sum, acc) => sum + (acc?.balance || 0), 0);

    const reconciledAccounts = (bankAccounts || []).filter(
      (acc) => acc?.isReconciled
    ).length;
    const totalAccounts = (bankAccounts || []).length;

    return {
      totalBalance: totalBalance || 0,
      cashBalance: cashBalance || 0,
      creditBalance: creditBalance || 0,
      ...cashFlowData,
      reconciledAccounts,
      totalAccounts,
    };
  }, [bankAccounts, cashFlowData]);

  const filteredTransactions = useMemo(() => {
    let filtered = bankTransactions || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t?.description?.toLowerCase().includes(term) ||
          t?.reference?.toLowerCase().includes(term)
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter((t) => t?.date >= dateRange.start);
    }

    if (dateRange.end) {
      filtered = filtered.filter((t) => t?.date <= dateRange.end);
    }

    return filtered;
  }, [bankTransactions, searchTerm, dateRange]);

  const accountTypes = {
    checking: { label: "Checking", icon: Landmark, color: "blue" },
    savings: { label: "Savings", icon: Wallet, color: "green" },
    credit: { label: "Credit Card", icon: CreditCard, color: "purple" },
  };

  // Modal Components
  const AccountModal = () => {
    const [form, setForm] = useState({
      name: "",
      bankName: "",
      accountNumber: "",
      accountType: "checking",
      openingDate: format(new Date(), "yyyy-MM-dd"),
      currency: "USD",
      creditLimit: 0,
      ...editingAccount,
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};
      if (!form.name.trim()) newErrors.name = "Account name is required";
      if (!form.bankName.trim()) newErrors.bankName = "Bank name is required";
      if (!form.accountNumber.trim())
        newErrors.accountNumber = "Account number is required";
      if (form.creditLimit < 0)
        newErrors.creditLimit = "Credit limit cannot be negative";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const accountData = {
        name: form.name,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountType: form.accountType,
        openingDate: form.openingDate,
        currency: form.currency,
        creditLimit: form.creditLimit || 0,
        balance: 0,
        currentBalance: 0,
        availableBalance: form.accountType === "credit" ? form.creditLimit : 0,
        status: "active",
        isReconciled: false,
      };

      try {
        if (editingAccount && typeof updateBankAccount === "function") {
          updateBankAccount(editingAccount.id, accountData);
        } else if (typeof addBankAccount === "function") {
          addBankAccount(accountData);
        }

        setShowAccountModal(false);
        setEditingAccount(null);
        setErrors({});
      } catch (error) {
        console.error("Error saving account:", error);
        setErrors({ submit: "Failed to save account. Please try again." });
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {editingAccount ? "Edit Account" : "Add New Account"}
          </h3>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Account Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Primary Business Account"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.bankName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Chase Bank"
              />
              {errors.bankName && (
                <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Number *
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.accountNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Last 4 digits"
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accountNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Type
              </label>
              <select
                value={form.accountType}
                onChange={(e) =>
                  setForm({ ...form, accountType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>

            {form.accountType === "credit" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Credit Limit
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.creditLimit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      creditLimit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.creditLimit ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.creditLimit && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.creditLimit}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                  setErrors({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {editingAccount ? "Update" : "Create"} Account
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Safe reconcile account function
  const handleReconcileAccount = (accountId) => {
    if (typeof reconcileAccount === "function") {
      reconcileAccount(accountId);
    } else {
      console.warn("reconcileAccount function not available");
    }
  };

  // Safe delete account function
  const handleDeleteAccount = (accountId) => {
    if (typeof deleteBankAccount === "function") {
      if (window.confirm("Are you sure you want to delete this account?")) {
        deleteBankAccount(accountId);
      }
    } else {
      console.warn("deleteBankAccount function not available");
    }
  };

  // Tab Components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Balance",
            value: totals.totalBalance,
            trend: "up",
            icon: DollarSign,
            color: "green",
          },
          {
            label: "Cash Balance",
            value: totals.cashBalance,
            trend: "up",
            icon: Landmark,
            color: "blue",
          },
          {
            label: "Monthly Cash Flow",
            value: totals.netCashFlow,
            trend: totals.netCashFlow >= 0 ? "up" : "down",
            icon: TrendingUp,
            color: totals.netCashFlow >= 0 ? "green" : "red",
          },
          {
            label: "Accounts Reconciled",
            value: `${totals.reconciledAccounts}/${totals.totalAccounts}`,
            trend: "up",
            icon: CheckCircle,
            color: "purple",
          },
        ].map((metric, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p
                  className={`text-2xl font-bold text-${metric.color}-600 mt-1`}
                >
                  {metric.label.includes("Reconciled")
                    ? metric.value
                    : `$${Math.abs(metric.value).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-${metric.color}-100`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accounts Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Bank Accounts</h3>
          <button
            onClick={() => {
              setEditingAccount(null);
              setShowAccountModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>

        <div className="space-y-4">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Landmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No bank accounts
              </h4>
              <p className="text-gray-600 mb-4">
                Get started by adding your first bank account.
              </p>
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setShowAccountModal(true);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Add Account
              </button>
            </div>
          ) : (
            bankAccounts.map((account) => {
              const AccountIcon =
                accountTypes[account?.accountType]?.icon || Landmark;
              const isCredit = account?.accountType === "credit";
              const color = accountTypes[account?.accountType]?.color || "gray";

              return (
                <div
                  key={account?.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full bg-${color}-100`}>
                      <AccountIcon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {account?.name || "Unnamed Account"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {account?.bankName || "Unknown Bank"} •{" "}
                        {account?.accountNumber || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        isCredit ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isCredit && (account?.balance || 0) < 0 ? "-" : ""}$
                      {Math.abs(account?.balance || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {accountTypes[account?.accountType]?.label || "Account"}
                      {account?.isReconciled && (
                        <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const AccountsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bank Account Management</h3>
        <button
          onClick={() => {
            setEditingAccount(null);
            setShowAccountModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Landmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No bank accounts yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first bank account to manage your finances.
          </p>
          <button
            onClick={() => {
              setEditingAccount(null);
              setShowAccountModal(true);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" /> Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bankAccounts.map((account) => {
            const AccountIcon =
              accountTypes[account?.accountType]?.icon || Landmark;
            const isCredit = account?.accountType === "credit";
            const color = accountTypes[account?.accountType]?.color || "gray";

            return (
              <div
                key={account?.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-${color}-100`}>
                    <AccountIcon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAccount(account);
                        setShowAccountModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account?.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-lg mb-2">
                  {account?.name || "Unnamed Account"}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {account?.bankName || "Unknown Bank"} •{" "}
                  {account?.accountNumber || "N/A"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Balance:</span>
                    <span
                      className={`font-semibold ${
                        isCredit ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isCredit && (account?.balance || 0) < 0 ? "-" : ""}$
                      {Math.abs(account?.balance || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {account?.accountType === "credit" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Credit:</span>
                      <span className="font-semibold">
                        $
                        {(account?.availableBalance || 0).toLocaleString(
                          "en-US",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReconcileAccount(account?.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      account?.isReconciled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {account?.isReconciled ? "Reconciled" : "Mark Reconciled"}
                  </button>
                  <button className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200">
                    View Transactions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Bank & Cash Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage bank accounts, track cash flow, and reconcile
                transactions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                $
                {totals.totalBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-gray-500">Total Balance</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "accounts", label: "Accounts", icon: Landmark },
              { id: "transactions", label: "Transactions", icon: Receipt },
              {
                id: "reconciliation",
                label: "Reconciliation",
                icon: CheckCircle,
              },
              { id: "cashflow", label: "Cash Flow", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "bg-indigo-600 text-white"
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          {selectedTab === "overview" && <OverviewTab />}
          {selectedTab === "accounts" && <AccountsTab />}
          {/* Add other tabs as needed */}
        </div>
      </div>

      {/* Modals */}
      {showAccountModal && <AccountModal />}
    </div>
  );
};

export default BankAccounts;
