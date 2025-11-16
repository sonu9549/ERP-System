// src/modules/sales/pages/PricingConditions.jsx
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  Filter,
  Download,
  Upload,
  Copy,
  Tag,
  Percent,
  DollarSign,
  Package,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Zap,
  Crown,
  Star,
  Gift,
  Truck,
  CreditCard,
  Shield,
  Target,
  PieChart,
  TrendingUp,
  Eye,
  MoreVertical,
} from "lucide-react";
import { useSales } from "../../context/SalesContext";

const PricingConditions = () => {
  const {
    pricingRules,
    discountSchemes,
    taxConfigurations,
    shippingRules,
    paymentTerms,
    products,
    customers,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    addDiscountScheme,
    updateDiscountScheme,
    calculatePrice,
  } = useSales();

  const [activeTab, setActiveTab] = useState("pricing");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [priceSimulation, setPriceSimulation] = useState({
    productId: "",
    quantity: 1,
    customerId: "",
    orderTotal: 0,
  });
  const [simulationResult, setSimulationResult] = useState(null);

  const tabs = [
    {
      id: "pricing",
      name: "Pricing Rules",
      icon: Tag,
      count: pricingRules.length,
    },
    {
      id: "discounts",
      name: "Discount Schemes",
      icon: Percent,
      count: discountSchemes.length,
    },
    {
      id: "tax",
      name: "Tax Configuration",
      icon: BarChart3,
      count: taxConfigurations.length,
    },
    {
      id: "shipping",
      name: "Shipping Rules",
      icon: Truck,
      count: shippingRules.length,
    },
    {
      id: "payment",
      name: "Payment Terms",
      icon: CreditCard,
      count: paymentTerms.length,
    },
    { id: "simulator", name: "Price Simulator", icon: Zap, count: 0 },
  ];

  // Pricing Rules Form
  const [pricingForm, setPricingForm] = useState({
    name: "",
    ruleType: "percentage_discount",
    discountValue: 0,
    fixedPrice: 0,
    minQuantity: 0,
    maxQuantity: null,
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    customerGroups: [],
    products: [],
    isActive: true,
    priority: 1,
    conditions: [],
  });

  // Discount Scheme Form
  const [discountForm, setDiscountForm] = useState({
    name: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderValue: 0,
    minQuantity: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    customerGroups: [],
    products: [],
    isActive: true,
    maxUses: null,
    usageCount: 0,
  });

  const resetForms = () => {
    setPricingForm({
      name: "",
      ruleType: "percentage_discount",
      discountValue: 0,
      fixedPrice: 0,
      minQuantity: 0,
      maxQuantity: null,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      customerGroups: [],
      products: [],
      isActive: true,
      priority: 1,
      conditions: [],
    });
    setDiscountForm({
      name: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderValue: 0,
      minQuantity: 0,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      customerGroups: [],
      products: [],
      isActive: true,
      maxUses: null,
      usageCount: 0,
    });
    setEditingItem(null);
  };

  const handlePricingSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        updatePricingRule(editingItem.id, pricingForm);
      } else {
        addPricingRule(pricingForm);
      }
      setShowForm(false);
      resetForms();
    } catch (error) {
      console.error("Error saving pricing rule:", error);
      alert("Error saving pricing rule: " + error.message);
    }
  };

  const handleDiscountSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        updateDiscountScheme(editingItem.id, discountForm);
      } else {
        addDiscountScheme(discountForm);
      }
      setShowForm(false);
      resetForms();
    } catch (error) {
      console.error("Error saving discount scheme:", error);
      alert("Error saving discount scheme: " + error.message);
    }
  };

  const handleDelete = () => {
    try {
      if (activeTab === "pricing") {
        deletePricingRule(deleteConfirm.id);
      }
      // Add delete for other types as needed
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting: " + error.message);
    }
  };

  const runPriceSimulation = () => {
    if (!priceSimulation.productId) return;

    const product = products.find(
      (p) => p.id === Number(priceSimulation.productId)
    );
    const customer = customers.find(
      (c) => c.id === Number(priceSimulation.customerId)
    );

    if (product) {
      const result = calculatePrice(
        product,
        priceSimulation.quantity,
        customer,
        priceSimulation.orderTotal
      );
      setSimulationResult(result);
    }
  };

  // Filter data based on search and status
  const filteredData = useMemo(() => {
    const data =
      {
        pricing: pricingRules,
        discounts: discountSchemes,
        tax: taxConfigurations,
        shipping: shippingRules,
        payment: paymentTerms,
      }[activeTab] || [];

    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === "all" ||
          (statusFilter === "active" && item.isActive) ||
          (statusFilter === "inactive" && !item.isActive))
    );
  }, [
    activeTab,
    pricingRules,
    discountSchemes,
    taxConfigurations,
    shippingRules,
    paymentTerms,
    searchTerm,
    statusFilter,
  ]);

  const customerGroups = ["Basic", "Standard", "Premium", "Enterprise"];
  const ruleTypes = [
    {
      value: "percentage_discount",
      label: "Percentage Discount",
      icon: Percent,
    },
    {
      value: "fixed_discount",
      label: "Fixed Amount Discount",
      icon: DollarSign,
    },
    { value: "fixed_price", label: "Fixed Price", icon: Tag },
    { value: "tiered_pricing", label: "Tiered Pricing", icon: TrendingUp },
    { value: "bundle_pricing", label: "Bundle Pricing", icon: Package },
  ];

  const discountTypes = [
    { value: "percentage", label: "Percentage Discount", icon: Percent },
    { value: "fixed_amount", label: "Fixed Amount", icon: DollarSign },
    { value: "buy_x_get_y", label: "Buy X Get Y", icon: Gift },
    { value: "volume_discount", label: "Volume Discount", icon: TrendingUp },
  ];

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
                  placeholder={`Search ${tabs
                    .find((t) => t.id === activeTab)
                    ?.name.toLowerCase()}...`}
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
              Pricing & Conditions
            </h1>
            <p className="text-gray-600">
              Manage pricing rules, discounts, and business terms
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                resetForms();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add{" "}
              {activeTab === "pricing"
                ? "Rule"
                : activeTab === "discounts"
                ? "Scheme"
                : "Item"}
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
                    {tab.count > 0 && (
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded-full ${
                          activeTab === tab.id
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Pricing Rules Tab */}
          {activeTab === "pricing" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conditions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {rule.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rule.ruleCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {ruleTypes.find((t) => t.value === rule.ruleType)
                            ?.icon &&
                            React.createElement(
                              ruleTypes.find((t) => t.value === rule.ruleType)
                                .icon,
                              { className: "w-3 h-3" }
                            )}
                          {
                            ruleTypes.find((t) => t.value === rule.ruleType)
                              ?.label
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {rule.ruleType === "percentage_discount" &&
                          `${rule.discountValue}%`}
                        {rule.ruleType === "fixed_discount" &&
                          `$${rule.discountValue}`}
                        {rule.ruleType === "fixed_price" &&
                          `$${rule.fixedPrice}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {rule.minQuantity > 0 && (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              Min Qty: {rule.minQuantity}
                            </span>
                          )}
                          {rule.customerGroups.length > 0 && (
                            <span className="text-xs bg-purple-100 px-1.5 py-0.5 rounded">
                              {rule.customerGroups.length} groups
                            </span>
                          )}
                          {rule.products.length > 0 && (
                            <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded">
                              {rule.products.length} products
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {rule.validFrom} to {rule.validTo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            rule.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rule.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(rule);
                              setPricingForm(rule);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit rule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(rule)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete rule"
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
          )}

          {/* Discount Schemes Tab */}
          {activeTab === "discounts" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conditions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((scheme) => (
                    <tr
                      key={scheme.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {scheme.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {scheme.schemeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {discountTypes.find(
                            (t) => t.value === scheme.discountType
                          )?.icon &&
                            React.createElement(
                              discountTypes.find(
                                (t) => t.value === scheme.discountType
                              ).icon,
                              { className: "w-3 h-3" }
                            )}
                          {
                            discountTypes.find(
                              (t) => t.value === scheme.discountType
                            )?.label
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {scheme.discountType === "percentage" &&
                          `${scheme.discountValue}%`}
                        {scheme.discountType === "fixed_amount" &&
                          `$${scheme.discountValue}`}
                        {scheme.discountType === "buy_x_get_y" &&
                          `Buy ${scheme.buyQuantity} Get ${scheme.getQuantity}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {scheme.minOrderValue > 0 && (
                            <span className="text-xs bg-yellow-100 px-1.5 py-0.5 rounded">
                              Min Order: ${scheme.minOrderValue}
                            </span>
                          )}
                          {scheme.customerGroups.length > 0 && (
                            <span className="text-xs bg-purple-100 px-1.5 py-0.5 rounded">
                              {scheme.customerGroups.length} groups
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {scheme.usageCount || 0} / {scheme.maxUses || "∞"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            scheme.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {scheme.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(scheme);
                              setDiscountForm(scheme);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit scheme"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(scheme)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete scheme"
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
          )}

          {/* Price Simulator Tab */}
          {activeTab === "simulator" && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simulation Input */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Price Simulation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Test how pricing rules and discounts apply to specific
                    scenarios
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <select
                        value={priceSimulation.productId}
                        onChange={(e) =>
                          setPriceSimulation((prev) => ({
                            ...prev,
                            productId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={priceSimulation.quantity}
                        onChange={(e) =>
                          setPriceSimulation((prev) => ({
                            ...prev,
                            quantity: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer
                      </label>
                      <select
                        value={priceSimulation.customerId}
                        onChange={(e) =>
                          setPriceSimulation((prev) => ({
                            ...prev,
                            customerId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any Customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} ({customer.customerTier})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Total
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceSimulation.orderTotal}
                        onChange={(e) =>
                          setPriceSimulation((prev) => ({
                            ...prev,
                            orderTotal: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Total order value for discount eligibility"
                      />
                    </div>

                    <button
                      onClick={runPriceSimulation}
                      disabled={!priceSimulation.productId}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Zap className="w-4 h-4" />
                      Run Simulation
                    </button>
                  </div>
                </div>

                {/* Simulation Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Simulation Results
                  </h3>

                  {simulationResult ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Base Price:</span>
                            <div className="font-semibold text-lg">
                              ${simulationResult.basePrice.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Final Price:</span>
                            <div className="font-semibold text-lg text-green-600">
                              ${simulationResult.finalPrice.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">You Save:</span>
                            <div className="font-semibold text-blue-600">
                              ${simulationResult.savings.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Discount:</span>
                            <div className="font-semibold text-purple-600">
                              {simulationResult.discountPercentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {simulationResult.appliedRules.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Applied Pricing Rules
                          </h4>
                          <div className="space-y-2">
                            {simulationResult.appliedRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex items-center justify-between p-2 bg-blue-50 rounded"
                              >
                                <span className="text-sm font-medium">
                                  {rule.name}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {rule.ruleType}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {simulationResult.discounts.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Applied Discounts
                          </h4>
                          <div className="space-y-2">
                            {simulationResult.discounts.map(
                              (discount, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-green-50 rounded"
                                >
                                  <span className="text-sm font-medium">
                                    {discount.scheme.name}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    -${discount.amount.toFixed(2)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {simulationResult.appliedRules.length === 0 &&
                        simulationResult.discounts.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No pricing rules or discounts applied to this
                            scenario
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>Run a simulation to see pricing results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredData.length === 0 && activeTab !== "simulator" && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {activeTab === "pricing" && (
                  <Tag className="w-12 h-12 mx-auto" />
                )}
                {activeTab === "discounts" && (
                  <Percent className="w-12 h-12 mx-auto" />
                )}
                {activeTab === "tax" && (
                  <BarChart3 className="w-12 h-12 mx-auto" />
                )}
                {activeTab === "shipping" && (
                  <Truck className="w-12 h-12 mx-auto" />
                )}
                {activeTab === "payment" && (
                  <CreditCard className="w-12 h-12 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {tabs.find((t) => t.id === activeTab)?.name.toLowerCase()}{" "}
                found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first{" "}
                {activeTab === "pricing" ? "pricing rule" : "discount scheme"}.
              </p>
              <button
                onClick={() => {
                  resetForms();
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add{" "}
                {activeTab === "pricing"
                  ? "Rule"
                  : activeTab === "discounts"
                  ? "Scheme"
                  : "Item"}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Pricing Rule Form Modal */}
      {showForm && activeTab === "pricing" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingItem ? "Edit Pricing Rule" : "Create Pricing Rule"}
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

            <form onSubmit={handlePricingSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={pricingForm.name}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Volume Discount for Premium Customers"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Type *
                    </label>
                    <select
                      value={pricingForm.ruleType}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          ruleType: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {ruleTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {pricingForm.ruleType === "percentage_discount" &&
                        "Discount Percentage"}
                      {pricingForm.ruleType === "fixed_discount" &&
                        "Discount Amount"}
                      {pricingForm.ruleType === "fixed_price" && "Fixed Price"}*
                    </label>
                    <input
                      type="number"
                      step={
                        pricingForm.ruleType === "percentage_discount"
                          ? "0.1"
                          : "0.01"
                      }
                      min="0"
                      value={
                        pricingForm.ruleType === "fixed_price"
                          ? pricingForm.fixedPrice
                          : pricingForm.discountValue
                      }
                      onChange={(e) => {
                        if (pricingForm.ruleType === "fixed_price") {
                          setPricingForm((prev) => ({
                            ...prev,
                            fixedPrice: Number(e.target.value),
                          }));
                        } else {
                          setPricingForm((prev) => ({
                            ...prev,
                            discountValue: Number(e.target.value),
                          }));
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pricingForm.minQuantity}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          minQuantity: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pricingForm.maxQuantity || ""}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          maxQuantity: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={pricingForm.validFrom}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          validFrom: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid To *
                    </label>
                    <input
                      type="date"
                      value={pricingForm.validTo}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          validTo: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Groups
                  </label>
                  <div className="space-y-2">
                    {customerGroups.map((group) => (
                      <label key={group} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pricingForm.customerGroups.includes(group)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPricingForm((prev) => ({
                                ...prev,
                                customerGroups: [...prev.customerGroups, group],
                              }));
                            } else {
                              setPricingForm((prev) => ({
                                ...prev,
                                customerGroups: prev.customerGroups.filter(
                                  (g) => g !== group
                                ),
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {group}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pricingForm.isActive}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? "Update Rule" : "Create Rule"}
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

      {/* Discount Scheme Form Modal */}
      {showForm && activeTab === "discounts" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingItem
                    ? "Edit Discount Scheme"
                    : "Create Discount Scheme"}
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

            <form onSubmit={handleDiscountSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheme Name *
                  </label>
                  <input
                    type="text"
                    value={discountForm.name}
                    onChange={(e) =>
                      setDiscountForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Summer Sale 2024"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={discountForm.discountType}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          discountType: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {discountTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {discountForm.discountType === "percentage" &&
                        "Discount Percentage"}
                      {discountForm.discountType === "fixed_amount" &&
                        "Discount Amount"}
                      {discountForm.discountType === "buy_x_get_y" &&
                        "Buy Quantity"}
                      *
                    </label>
                    <input
                      type="number"
                      step={
                        discountForm.discountType === "percentage" ? "0.1" : "1"
                      }
                      min="0"
                      value={discountForm.discountValue}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          discountValue: Number(e.target.value),
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {discountForm.discountType === "buy_x_get_y" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Get Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={discountForm.getQuantity || 1}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          getQuantity: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountForm.minOrderValue}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          minOrderValue: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountForm.minQuantity}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          minQuantity: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={discountForm.validFrom}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          validFrom: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid To *
                    </label>
                    <input
                      type="date"
                      value={discountForm.validTo}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          validTo: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountForm.maxUses || ""}
                    onChange={(e) =>
                      setDiscountForm((prev) => ({
                        ...prev,
                        maxUses: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Groups
                  </label>
                  <div className="space-y-2">
                    {customerGroups.map((group) => (
                      <label key={group} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={discountForm.customerGroups.includes(group)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDiscountForm((prev) => ({
                                ...prev,
                                customerGroups: [...prev.customerGroups, group],
                              }));
                            } else {
                              setDiscountForm((prev) => ({
                                ...prev,
                                customerGroups: prev.customerGroups.filter(
                                  (g) => g !== group
                                ),
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {group}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={discountForm.isActive}
                      onChange={(e) =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? "Update Scheme" : "Create Scheme"}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Delete{" "}
              {activeTab === "pricing" ? "Pricing Rule" : "Discount Scheme"}?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirm.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingConditions;
