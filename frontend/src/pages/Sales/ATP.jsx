// src/modules/sales/pages/ATP.jsx
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
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Users,
  Truck,
  Warehouse,
  Zap,
  Eye,
  Filter,
  RefreshCw,
  TrendingUp,
  Shield,
  Target,
  PieChart,
  DollarSign,
} from "lucide-react";
import { useSales } from "../../context/SalesContext";

const ATP = () => {
  const {
    products,
    customers,
    inventory,
    atpChecks,
    stockMovements,
    checkATP,
    bulkATPCheck,
    reserveStock,
    loading,
    error,
  } = useSales();

  const [activeTab, setActiveTab] = useState("single");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showResults, setShowResults] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);

  // Single ATP Check Form
  const [singleForm, setSingleForm] = useState({
    productId: "",
    quantity: 1,
    requiredDate: new Date().toISOString().split("T")[0],
    customerId: "",
  });

  // Bulk ATP Check Form
  const [bulkForm, setBulkForm] = useState({
    items: [],
    requiredDate: new Date().toISOString().split("T")[0],
    customerId: "",
  });

  const [newBulkItem, setNewBulkItem] = useState({
    productId: "",
    quantity: 1,
  });
  const [atpResult, setAtpResult] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);

  const tabs = [
    { id: "single", name: "Single Check", icon: Package },
    { id: "bulk", name: "Bulk Check", icon: BarChart3 },
    { id: "history", name: "Check History", icon: Clock },
    { id: "inventory", name: "Inventory View", icon: Warehouse },
  ];

  const resetForms = () => {
    setSingleForm({
      productId: "",
      quantity: 1,
      requiredDate: new Date().toISOString().split("T")[0],
      customerId: "",
    });
    setBulkForm({
      items: [],
      requiredDate: new Date().toISOString().split("T")[0],
      customerId: "",
    });
    setNewBulkItem({ productId: "", quantity: 1 });
    setAtpResult(null);
    setBulkResult(null);
    setShowResults(false);
  };

  const handleSingleCheck = async (e) => {
    e.preventDefault();
    try {
      const result = await checkATP(
        Number(singleForm.productId),
        singleForm.quantity,
        singleForm.requiredDate,
        singleForm.customerId ? Number(singleForm.customerId) : null
      );
      setAtpResult(result);
      setShowResults(true);
    } catch (error) {
      console.error("ATP Check failed:", error);
      alert("ATP Check failed: " + error.message);
    }
  };

  const handleBulkCheck = async (e) => {
    e.preventDefault();
    if (bulkForm.items.length === 0) {
      alert("Please add at least one item to check");
      return;
    }

    try {
      const result = await bulkATPCheck(
        bulkForm.items,
        bulkForm.requiredDate,
        bulkForm.customerId ? Number(bulkForm.customerId) : null
      );
      setBulkResult(result);
      setShowResults(true);
    } catch (error) {
      console.error("Bulk ATP Check failed:", error);
      alert("Bulk ATP Check failed: " + error.message);
    }
  };

  const addBulkItem = () => {
    if (!newBulkItem.productId) return;

    const product = products.find(
      (p) => p.id === Number(newBulkItem.productId)
    );
    if (product) {
      setBulkForm((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: newBulkItem.quantity,
          },
        ],
      }));
      setNewBulkItem({ productId: "", quantity: 1 });
    }
  };

  const removeBulkItem = (index) => {
    setBulkForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const reserveAllAvailable = () => {
    if (!bulkResult) return;

    bulkResult.results.forEach((result) => {
      if (result.canFulfill) {
        reserveStock(
          result.productId,
          result.requestedQuantity,
          null, // orderId would be set when creating actual order
          result.promisedDate
        );
      }
    });

    alert("Available stock reserved successfully!");
  };

  // Filter ATP checks for history tab
  const filteredChecks = useMemo(() => {
    return atpChecks.filter(
      (check) =>
        check.productName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === "all" || check.status === statusFilter)
    );
  }, [atpChecks, searchTerm, statusFilter]);

  // Inventory summary stats
  const inventoryStats = useMemo(() => {
    const totalProducts = inventory.length;
    const lowStock = inventory.filter(
      (item) => item.availableStock <= item.safetyStock
    ).length;
    const outOfStock = inventory.filter(
      (item) => item.availableStock === 0
    ).length;
    const totalValue = inventory.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + item.availableStock * (product?.price || 0);
    }, 0);

    return { totalProducts, lowStock, outOfStock, totalValue };
  }, [inventory, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ATP data...</p>
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
                    activeTab === "history"
                      ? "Search check history..."
                      : activeTab === "inventory"
                      ? "Search inventory..."
                      : "Search products..."
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
            <h1 className="text-2xl font-bold text-gray-900">ATP Check</h1>
            <p className="text-gray-600">
              Available-to-Promise Inventory Checking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetForms}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
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
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowResults(false);
                    }}
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

        {/* Single ATP Check Tab */}
        {activeTab === "single" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Check Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Single Product ATP Check
              </h3>

              <form onSubmit={handleSingleCheck} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={singleForm.productId}
                    onChange={(e) =>
                      setSingleForm((prev) => ({
                        ...prev,
                        productId: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => {
                      const inventoryItem = inventory.find(
                        (i) => i.productId === product.id
                      );
                      const availableStock = inventoryItem?.availableStock || 0;
                      return (
                        <option key={product.id} value={product.id}>
                          {product.name} - Stock: {availableStock}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={singleForm.quantity}
                    onChange={(e) =>
                      setSingleForm((prev) => ({
                        ...prev,
                        quantity: Number(e.target.value),
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Date *
                  </label>
                  <input
                    type="date"
                    value={singleForm.requiredDate}
                    onChange={(e) =>
                      setSingleForm((prev) => ({
                        ...prev,
                        requiredDate: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer (Optional)
                  </label>
                  <select
                    value={singleForm.customerId}
                    onChange={(e) =>
                      setSingleForm((prev) => ({
                        ...prev,
                        customerId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerTier})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Zap className="w-4 h-4" />
                  Check Availability
                </button>
              </form>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {showResults && atpResult && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ATP Check Results
                  </h3>

                  <div
                    className={`p-4 rounded-lg mb-4 ${
                      atpResult.canFulfill
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {atpResult.canFulfill ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <div>
                            <div className="font-semibold text-green-800">
                              Available
                            </div>
                            <div className="text-sm text-green-600">
                              Can fulfill {atpResult.requestedQuantity} units by{" "}
                              {atpResult.requiredDate}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Clock className="w-8 h-8 text-yellow-600" />
                          <div>
                            <div className="font-semibold text-yellow-800">
                              Backorder Required
                            </div>
                            <div className="text-sm text-yellow-600">
                              Shortfall of {atpResult.shortfall} units.
                              Available by {atpResult.promisedDate}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-600">Available Stock</div>
                      <div className="font-semibold text-lg">
                        {atpResult.availableStock}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-600">Committed Stock</div>
                      <div className="font-semibold text-lg">
                        {atpResult.committedStock}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-600">Planned Receipts</div>
                      <div className="font-semibold text-lg">
                        {atpResult.plannedReceipts}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-600">ATP Quantity</div>
                      <div className="font-semibold text-lg">
                        {atpResult.atpQuantity}
                      </div>
                    </div>
                  </div>

                  {atpResult.canFulfill && (
                    <button
                      onClick={() =>
                        reserveStock(
                          atpResult.productId,
                          atpResult.requestedQuantity,
                          null,
                          atpResult.promisedDate
                        )
                      }
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      Reserve Stock
                    </button>
                  )}
                </div>
              )}

              {/* Quick Inventory Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Quick Inventory Overview
                </h4>
                <div className="space-y-3">
                  {inventory.slice(0, 5).map((item) => {
                    const product = products.find(
                      (p) => p.id === item.productId
                    );
                    const isLowStock = item.availableStock <= item.safetyStock;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {product?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.sku}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              isLowStock ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {item.availableStock} units
                          </div>
                          {isLowStock && (
                            <div className="text-xs text-red-500">
                              Low Stock
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk ATP Check Tab */}
        {activeTab === "bulk" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bulk Check Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bulk ATP Check
              </h3>

              <form onSubmit={handleBulkCheck} className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={newBulkItem.productId}
                    onChange={(e) =>
                      setNewBulkItem((prev) => ({
                        ...prev,
                        productId: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => {
                      const inventoryItem = inventory.find(
                        (i) => i.productId === product.id
                      );
                      const availableStock = inventoryItem?.availableStock || 0;
                      return (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {availableStock})
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={newBulkItem.quantity}
                    onChange={(e) =>
                      setNewBulkItem((prev) => ({
                        ...prev,
                        quantity: Number(e.target.value),
                      }))
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={addBulkItem}
                    disabled={!newBulkItem.productId}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {/* Items List */}
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {bulkForm.items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No items added
                    </div>
                  ) : (
                    bulkForm.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {item.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.sku}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.quantity} units</span>
                          <button
                            type="button"
                            onClick={() => removeBulkItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Date *
                  </label>
                  <input
                    type="date"
                    value={bulkForm.requiredDate}
                    onChange={(e) =>
                      setBulkForm((prev) => ({
                        ...prev,
                        requiredDate: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer (Optional)
                  </label>
                  <select
                    value={bulkForm.customerId}
                    onChange={(e) =>
                      setBulkForm((prev) => ({
                        ...prev,
                        customerId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerTier})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={bulkForm.items.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  Check All Items
                </button>
              </form>
            </div>

            {/* Bulk Results */}
            <div className="space-y-6">
              {showResults && bulkResult && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bulk ATP Results
                  </h3>

                  {/* Overall Status */}
                  <div
                    className={`p-4 rounded-lg mb-4 ${
                      bulkResult.overallStatus === "Available"
                        ? "bg-green-50 border border-green-200"
                        : bulkResult.overallStatus === "Partial"
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {bulkResult.overallStatus === "Available" ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : bulkResult.overallStatus === "Partial" ? (
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                      <div>
                        <div
                          className={`font-semibold ${
                            bulkResult.overallStatus === "Available"
                              ? "text-green-800"
                              : bulkResult.overallStatus === "Partial"
                              ? "text-yellow-800"
                              : "text-red-800"
                          }`}
                        >
                          {bulkResult.overallStatus} Availability
                        </div>
                        <div className="text-sm">
                          {bulkResult.totalAvailable} of{" "}
                          {bulkResult.totalRequested} units available
                          {bulkResult.totalBackorder > 0 &&
                            `, ${bulkResult.totalBackorder} on backorder`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-green-600">Available</div>
                      <div className="font-semibold text-lg">
                        {bulkResult.totalAvailable}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="text-yellow-600">Partial</div>
                      <div className="font-semibold text-lg">
                        {
                          bulkResult.results.filter(
                            (r) => !r.canFulfill && r.atpQuantity > 0
                          ).length
                        }
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <div className="text-red-600">Backorder</div>
                      <div className="font-semibold text-lg">
                        {bulkResult.totalBackorder}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bulkResult.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          result.canFulfill
                            ? "bg-green-50 border-green-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {result.productName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.requestedQuantity} units requested
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-semibold ${
                                result.canFulfill
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {result.canFulfill
                                ? "Available"
                                : `Backorder: ${result.shortfall}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.canFulfill
                                ? result.requiredDate
                                : result.promisedDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {bulkResult.overallStatus !== "Backorder" && (
                    <button
                      onClick={reserveAllAvailable}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      Reserve Available Stock
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                ATP Check History
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Backorder">Backorder</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promise Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checked At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredChecks.map((check) => (
                    <tr
                      key={check.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {check.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {check.requestedQuantity}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {check.requestedQuantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {check.requiredDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            check.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {check.status === "Available" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {check.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {check.promisedDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(check.checkedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedCheck(check)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory View Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Inventory Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryStats.totalProducts}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {inventoryStats.lowStock}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {inventoryStats.outOfStock}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${inventoryStats.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Inventory Details
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Safety Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventory.map((item) => {
                      const product = products.find(
                        (p) => p.id === item.productId
                      );
                      const isLowStock =
                        item.availableStock <= item.safetyStock;
                      const isOutOfStock = item.availableStock === 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {product?.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3">
                            <div
                              className={`text-sm font-semibold ${
                                isOutOfStock
                                  ? "text-red-600"
                                  : isLowStock
                                  ? "text-amber-600"
                                  : "text-green-600"
                              }`}
                            >
                              {item.availableStock}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.safetyStock}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isOutOfStock
                                  ? "bg-red-100 text-red-800"
                                  : isLowStock
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : isLowStock
                                ? "Low Stock"
                                : "In Stock"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.warehouse}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.location}
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
      </main>

      {/* Check Details Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">ATP Check Details</h3>
              <button
                onClick={() => setSelectedCheck(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Product
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedCheck.productName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Requested Quantity
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedCheck.requestedQuantity}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Required Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedCheck.requiredDate}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Promise Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedCheck.promisedDate}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Stock Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">Available Stock</div>
                    <div className="font-semibold">
                      {selectedCheck.availableStock}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">Committed Stock</div>
                    <div className="font-semibold">
                      {selectedCheck.committedStock}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">Planned Receipts</div>
                    <div className="font-semibold">
                      {selectedCheck.plannedReceipts}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">ATP Quantity</div>
                    <div className="font-semibold">
                      {selectedCheck.atpQuantity}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div
                  className={`p-3 rounded ${
                    selectedCheck.canFulfill
                      ? "bg-green-50 text-green-800"
                      : "bg-yellow-50 text-yellow-800"
                  }`}
                >
                  <div className="font-medium">
                    {selectedCheck.canFulfill
                      ? "✓ Available to Promise"
                      : "⚠ Requires Backorder"}
                  </div>
                  {!selectedCheck.canFulfill && (
                    <div className="text-sm mt-1">
                      Shortfall: {selectedCheck.shortfall} units
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATP;
