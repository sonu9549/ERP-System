// src/modules/sales/pages/CreditManagement.jsx
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  Download,
  Filter,
  Users,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  BarChart3,
  Eye,
  MoreVertical,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { useSales } from "../../context/SalesContext";

const CreditManagement = () => {
  const {
    customers,
    invoices,
    creditLimits,
    creditApplications,
    agingReports,
    creditNotes,
    paymentCollections,
    updateCreditLimit,
    submitCreditApplication,
    processCreditApplication,
    createCreditNote,
    recordPayment,
    assessCreditRisk,
    checkCreditLimit,
    loading,
    error,
  } = useSales();

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showCreditCheck, setShowCreditCheck] = useState(false);

  const tabs = [
    { id: "overview", name: "Credit Overview", icon: BarChart3 },
    { id: "limits", name: "Credit Limits", icon: CreditCard },
    { id: "applications", name: "Applications", icon: FileText },
    { id: "aging", name: "Aging Report", icon: Clock },
    { id: "collections", name: "Collections", icon: DollarSign },
    { id: "notes", name: "Credit Notes", icon: FileText },
  ];

  // Credit Application Form
  const [applicationForm, setApplicationForm] = useState({
    customerId: "",
    requestedLimit: "",
    annualRevenue: "",
    yearsInBusiness: "",
    businessType: "",
    references: "",
  });

  // Credit Limit Update Form
  const [limitForm, setLimitForm] = useState({
    customerId: "",
    newLimit: "",
    reason: "",
  });

  // Payment Collection Form
  const [paymentForm, setPaymentForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    reference: "",
  });

  // Credit Note Form
  const [creditNoteForm, setCreditNoteForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: "",
    reason: "",
  });

  const resetForms = () => {
    setApplicationForm({
      customerId: "",
      requestedLimit: "",
      annualRevenue: "",
      yearsInBusiness: "",
      businessType: "",
      references: "",
    });
    setLimitForm({
      customerId: "",
      newLimit: "",
      reason: "",
    });
    setPaymentForm({
      customerId: "",
      invoiceId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      reference: "",
    });
    setCreditNoteForm({
      customerId: "",
      invoiceId: "",
      amount: "",
      reason: "",
    });
  };

  const handleCreditApplication = async (e) => {
    e.preventDefault();
    try {
      await submitCreditApplication({
        ...applicationForm,
        requestedLimit: Number(applicationForm.requestedLimit),
        annualRevenue: Number(applicationForm.annualRevenue),
        yearsInBusiness: Number(applicationForm.yearsInBusiness),
      });
      setShowForm(false);
      resetForms();
      alert("Credit application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application: " + error.message);
    }
  };

  const handleLimitUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateCreditLimit(
        Number(limitForm.customerId),
        Number(limitForm.newLimit),
        limitForm.reason
      );
      setShowForm(false);
      resetForms();
      alert("Credit limit updated successfully!");
    } catch (error) {
      console.error("Error updating credit limit:", error);
      alert("Error updating credit limit: " + error.message);
    }
  };

  const handlePaymentCollection = async (e) => {
    e.preventDefault();
    try {
      await recordPayment({
        ...paymentForm,
        amount: Number(paymentForm.amount),
        customerId: Number(paymentForm.customerId),
        invoiceId: Number(paymentForm.invoiceId),
      });
      setShowForm(false);
      resetForms();
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Error recording payment: " + error.message);
    }
  };

  const handleCreditNote = async (e) => {
    e.preventDefault();
    try {
      await createCreditNote({
        ...creditNoteForm,
        amount: Number(creditNoteForm.amount),
        customerId: Number(creditNoteForm.customerId),
        invoiceId: Number(creditNoteForm.invoiceId),
      });
      setShowForm(false);
      resetForms();
      alert("Credit note created successfully!");
    } catch (error) {
      console.error("Error creating credit note:", error);
      alert("Error creating credit note: " + error.message);
    }
  };

  const handleApplicationDecision = async (
    applicationId,
    decision,
    approvedLimit = 0,
    notes = ""
  ) => {
    try {
      await processCreditApplication(
        applicationId,
        decision,
        approvedLimit,
        notes
      );
      alert(`Application ${decision.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error processing application:", error);
      alert("Error processing application: " + error.message);
    }
  };

  // Credit Overview Stats
  const creditStats = useMemo(() => {
    const totalCreditLimit = customers.reduce(
      (sum, customer) => sum + (customer.creditLimit || 0),
      0
    );
    const totalOutstanding = agingReports.reduce(
      (sum, report) => sum + report.total,
      0
    );
    const utilizationRate =
      totalCreditLimit > 0 ? (totalOutstanding / totalCreditLimit) * 100 : 0;

    const overdueAmount = agingReports.reduce(
      (sum, report) =>
        sum + report.days30 + report.days60 + report.days90 + report.over90,
      0
    );

    const highRiskCustomers = agingReports.filter(
      (report) => report.utilization > 80
    ).length;
    const pendingApplications = creditApplications.filter(
      (app) => app.status === "Pending"
    ).length;

    return {
      totalCreditLimit,
      totalOutstanding,
      utilizationRate,
      overdueAmount,
      highRiskCustomers,
      pendingApplications,
    };
  }, [customers, agingReports, creditApplications]);

  // Risk Assessment for selected customer
  const customerRisk = useMemo(() => {
    if (!selectedCustomer) return null;
    return assessCreditRisk(selectedCustomer.id);
  }, [selectedCustomer, assessCreditRisk]);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    const dataMap = {
      limits: creditLimits,
      applications: creditApplications,
      aging: agingReports,
      collections: paymentCollections,
      notes: creditNotes,
    };

    const data = dataMap[activeTab] || [];
    return data.filter(
      (item) =>
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === "all" || item.status === statusFilter)
    );
  }, [
    activeTab,
    creditLimits,
    creditApplications,
    agingReports,
    paymentCollections,
    creditNotes,
    searchTerm,
    statusFilter,
  ]);

  // Get unpaid invoices for a customer
  const getUnpaidInvoices = (customerId) => {
    return invoices.filter(
      (inv) => inv.customerId === customerId && inv.status === "Unpaid"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading credit data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "overview"
                      ? "Search customers..."
                      : `Search ${tabs
                          .find((t) => t.id === activeTab)
                          ?.name.toLowerCase()}...`
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Credit Management
            </h1>
            <p className="text-gray-600">
              Manage customer credit limits, applications, and collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreditCheck(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              Credit Check
            </button>
            <button
              onClick={() => {
                resetForms();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New{" "}
              {activeTab === "applications"
                ? "Application"
                : activeTab === "collections"
                ? "Payment"
                : activeTab === "notes"
                ? "Credit Note"
                : "Limit"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Credit Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Credit Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Credit Limit</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${creditStats.totalCreditLimit.toLocaleString()}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Outstanding</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${creditStats.totalOutstanding.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Utilization Rate</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {creditStats.utilizationRate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue Amount</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${creditStats.overdueAmount.toLocaleString()}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Risk Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Risk Distribution
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">High Risk</span>
                    </div>
                    <span className="font-bold text-red-600">
                      {creditStats.highRiskCustomers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Medium Risk</span>
                    </div>
                    <span className="font-bold text-yellow-600">
                      {
                        agingReports.filter(
                          (r) => r.utilization > 50 && r.utilization <= 80
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Low Risk</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {agingReports.filter((r) => r.utilization <= 50).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Actions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Pending Applications</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {creditStats.pendingApplications}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>Overdue{">"} 60 days</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      {
                        agingReports.filter(
                          (r) => r.days60 + r.days90 + r.over90 > 0
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-purple-600" />
                      <span>Limit Reviews Due</span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {
                        creditLimits.filter((l) => {
                          const monthsSinceUpdate =
                            (new Date() - new Date(l.changeDate)) /
                            (30 * 24 * 60 * 60 * 1000);
                          return monthsSinceUpdate >= 6;
                        }).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab("applications");
                      setShowForm(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Credit Application
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("collections");
                      setShowForm(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                    Record Payment
                  </button>
                  <button
                    onClick={() => setShowCreditCheck(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    Credit Check
                  </button>
                </div>
              </div>
            </div>

            {/* Customer List with Credit Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Credit Status
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Limit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilization
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.slice(0, 10).map((customer) => {
                      const aging = agingReports.find(
                        (r) => r.customerId === customer.id
                      );
                      const utilization = aging ? aging.utilization : 0;
                      const outstanding = aging ? aging.total : 0;

                      let riskLevel = "Low";
                      let riskColor = "green";

                      if (utilization > 80) {
                        riskLevel = "High";
                        riskColor = "red";
                      } else if (utilization > 50) {
                        riskLevel = "Medium";
                        riskColor = "yellow";
                      }

                      return (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${(customer.creditLimit || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${outstanding.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    utilization > 80
                                      ? "bg-red-600"
                                      : utilization > 50
                                      ? "bg-yellow-600"
                                      : "bg-green-600"
                                  }`}
                                  style={{
                                    width: `${Math.min(utilization, 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {utilization.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                riskLevel === "High"
                                  ? "bg-red-100 text-red-800"
                                  : riskLevel === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {riskLevel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowCustomerDetails(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setLimitForm({
                                    customerId: customer.id.toString(),
                                    newLimit:
                                      customer.creditLimit?.toString() || "",
                                    reason: "",
                                  });
                                  setShowForm(true);
                                }}
                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                title="Update Limit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Credit Limits Tab */}
        {activeTab === "limits" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Limits History
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changed By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((limit) => (
                    <tr
                      key={limit.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {limit.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${limit.previousLimit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          ${limit.newLimit.toLocaleString()}
                          {limit.newLimit > limit.previousLimit && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                          {limit.newLimit < limit.previousLimit && (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {limit.changeDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {limit.reason}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {limit.changedBy}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            limit.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {limit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Credit Applications Tab */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Applications
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Annual Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Years in Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((application) => (
                    <tr
                      key={application.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {application.applicationNo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {application.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${application.requestedLimit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${application.annualRevenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {application.yearsInBusiness} years
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            application.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : application.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {application.appliedDate}
                      </td>
                      <td className="px-4 py-3">
                        {application.status === "Pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleApplicationDecision(
                                  application.id,
                                  "Approved",
                                  application.requestedLimit
                                )
                              }
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleApplicationDecision(
                                  application.id,
                                  "Rejected"
                                )
                              }
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aging Report Tab */}
        {activeTab === "aging" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Accounts Receivable Aging Report
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      1-30 Days
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      31-60 Days
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      61-90 Days
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Over 90 Days
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {report.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${report.current.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${report.days30.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${report.days60.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${report.days90.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${report.over90.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${report.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${report.creditLimit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                report.utilization > 80
                                  ? "bg-red-600"
                                  : report.utilization > 50
                                  ? "bg-yellow-600"
                                  : "bg-green-600"
                              }`}
                              style={{
                                width: `${Math.min(report.utilization, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {report.utilization.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Collections Tab */}
        {activeTab === "collections" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Collections
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.receiptNo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.invoiceNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.paymentDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.reference}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Credit Notes Tab */}
        {activeTab === "notes" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Notes
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Applied">Applied</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((note) => (
                    <tr
                      key={note.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {note.noteNo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {note.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {note.invoiceNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${note.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {note.reason}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {note.createdDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            note.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : note.status === "Applied"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {note.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Credit Application Form Modal */}
      {showForm && activeTab === "applications" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  New Credit Application
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForms();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreditApplication} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={applicationForm.customerId}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        customerId: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Credit Limit *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={applicationForm.requestedLimit}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        requestedLimit: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter requested credit limit"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Revenue *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={applicationForm.annualRevenue}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({
                          ...prev,
                          annualRevenue: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years in Business *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={applicationForm.yearsInBusiness}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({
                          ...prev,
                          yearsInBusiness: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={applicationForm.businessType}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        businessType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Business Type</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Sole Proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="LLC">LLC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade References
                  </label>
                  <textarea
                    value={applicationForm.references}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        references: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="List any trade references or previous credit relationships..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForms();
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Limit Update Form Modal */}
      {showForm && activeTab === "limits" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Credit Limit</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForms();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLimitUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  value={limitForm.customerId}
                  onChange={(e) =>
                    setLimitForm((prev) => ({
                      ...prev,
                      customerId: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - Current: $
                      {(customer.creditLimit || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Credit Limit *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={limitForm.newLimit}
                  onChange={(e) =>
                    setLimitForm((prev) => ({
                      ...prev,
                      newLimit: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Change *
                </label>
                <textarea
                  value={limitForm.reason}
                  onChange={(e) =>
                    setLimitForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain the reason for this credit limit change..."
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  Update Limit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForms();
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Customer Credit Details - {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setShowCustomerDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedCustomer.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedCustomer.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedCustomer.phone || "N/A"}
                    </div>
                    <div>
                      <strong>Customer Tier:</strong>{" "}
                      {selectedCustomer.customerTier}
                    </div>
                    <div>
                      <strong>Credit Limit:</strong> $
                      {(selectedCustomer.creditLimit || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Credit Risk Assessment
                  </h4>
                  {customerRisk && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Risk Score:</span>
                        <span
                          className={`font-semibold ${
                            customerRisk.riskLevel === "High"
                              ? "text-red-600"
                              : customerRisk.riskLevel === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {customerRisk.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Level:</span>
                        <span
                          className={`font-semibold ${
                            customerRisk.riskLevel === "High"
                              ? "text-red-600"
                              : customerRisk.riskLevel === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {customerRisk.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Utilization:</span>
                        <span>
                          {customerRisk.creditUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Outstanding:</span>
                        <span>
                          ${customerRisk.totalOutstanding.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Payment Days:</span>
                        <span>{customerRisk.averagePaymentDays} days</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unpaid Invoices */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Unpaid Invoices
                </h4>
                <div className="space-y-2">
                  {getUnpaidInvoices(selectedCustomer.id).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {invoice.invoiceNo}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {invoice.dueDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${invoice.total.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Check Modal */}
      {showCreditCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Credit Limit Check</h3>
              <button
                onClick={() => setShowCreditCheck(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) =>
                    setSelectedCustomer(
                      customers.find((c) => c.id === Number(e.target.value))
                    )
                  }
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter order amount"
                  onChange={(e) => {
                    if (selectedCustomer) {
                      const result = checkCreditLimit(
                        selectedCustomer.id,
                        Number(e.target.value)
                      );
                      if (result.allowed) {
                        alert(
                          `✅ Credit approved! Available: $${result.availableCredit.toLocaleString()}`
                        );
                      } else {
                        alert(`❌ Credit limit exceeded: ${result.reason}`);
                      }
                    }
                  }}
                />
              </div>

              {selectedCustomer && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">
                    Current Credit Status
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Credit Limit:</span>
                      <span>
                        ${(selectedCustomer.creditLimit || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Credit:</span>
                      <span>
                        $
                        {checkCreditLimit(
                          selectedCustomer.id,
                          0
                        ).availableCredit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
