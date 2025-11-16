// src/modules/inventory/StockManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useInventory } from "../../context/InventoryContext";
import {
  Package,
  History,
  DollarSign,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Search,
  Calendar,
  Hash,
  Warehouse,
  Box,
} from "lucide-react";

export default function StockManagement() {
  // === HOOKS (Top-Level) ===
  const {
    products = [],
    warehouses = [],
    bins = [],
    stockLedger = [],
    addStockTransaction,
    loading,
    stockSummary = [],
  } = useInventory();

  const [activeTab, setActiveTab] = useState("ledger");
  const [search, setSearch] = useState("");
  const [txForm, setTxForm] = useState({
    product_id: "",
    warehouse_id: "",
    bin_id: "",
    qty: "",
    unit_cost: "",
    reference_type: "GRN",
    reference_id: "",
    batch_no: "",
    expiry_date: "",
  });
  const filteredLedger = useMemo(() => {
    if (!search) return stockLedger;
    return stockLedger
      .filter((t) => {
        const prod = products.find((p) => p.id === t.product_id);
        const term = search.toLowerCase();
        return (
          (prod?.name?.toLowerCase().includes(term) ?? false) ||
          (prod?.sku?.toLowerCase().includes(term) ?? false) ||
          (t.reference?.toLowerCase().includes(term) ?? false)
        );
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [stockLedger, products, search]);

  const valuation = useMemo(() => {
    const result = [];
    products.forEach((p) => {
      const layers = stockLedger
        .filter(
          (t) =>
            t.product_id === p.id &&
            t.transaction_type === "receipt_in" &&
            t.balance > 0
        )
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      let totalQty = 0;
      let totalValue = 0;

      layers.forEach((layer) => {
        const qty = Math.min(layer.balance, layer.qty);
        totalQty += qty;
        totalValue += qty * (layer.unit_cost || 0);
      });

      if (totalQty > 0) {
        result.push({
          ...p,
          qty: totalQty,
          value: totalValue,
          avgCost: totalValue / totalQty,
        });
      }
    });
    return result;
  }, [products, stockLedger]);

  const grandTotal = useMemo(() => {
    return valuation.reduce((sum, v) => sum + v.value, 0);
  }, [valuation]);

  const lowStockItems = useMemo(() => {
    return products
      .map((p) => {
        const total = stockLedger
          .filter((t) => t.product_id === p.id)
          .reduce(
            (s, t) =>
              s + (t.transaction_type === "receipt_in" ? t.qty : -t.qty),
            0
          );
        return { ...p, currentStock: total };
      })
      .filter((p) => p.currentStock < p.reorder_point && p.currentStock > 0);
  }, [products, stockLedger]);

  // === Safe Loading ===
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading inventory...</div>
      </div>
    );
  }

  // === Tabs ===
  const tabs = [
    { id: "ledger", label: "Stock Ledger", icon: History },
    { id: "valuation", label: "Valuation (FIFO)", icon: DollarSign },
    { id: "transaction", label: "New Transaction", icon: Package },
    { id: "reorder", label: "Reorder Alerts", icon: AlertTriangle },
  ];

  // === Handle Transaction ===
  const handleTransaction = (type) => {
    const product = products.find((p) => p.id === parseInt(txForm.product_id));
    if (!product) return alert("Select a product");

    const qty = parseInt(txForm.qty);
    const cost = parseFloat(txForm.unit_cost) || 0;

    if (qty <= 0) return alert("Enter valid quantity");

    if (type === "issue_out") {
      const current =
        stockSummary.find(
          (s) =>
            s.product_id === product.id &&
            s.warehouse_id === parseInt(txForm.warehouse_id)
        )?.stock || 0;
      if (qty > current) return alert(`Only ${current} available`);
    }

    const tx = {
      product_id: product.id,
      product_name: product.name,
      warehouse_id: parseInt(txForm.warehouse_id),
      bin_id: parseInt(txForm.bin_id),
      transaction_type: type,
      qty,
      unit_cost: cost,
      reference:
        `${txForm.reference_type}-${txForm.reference_id}`.trim() || null,
      batch_no: txForm.batch_no || null,
      expiry_date: txForm.expiry_date || null,
    };

    addStockTransaction(tx);
    setTxForm({
      product_id: "",
      warehouse_id: "",
      bin_id: "",
      qty: "",
      unit_cost: "",
      reference_type: "GRN",
      reference_id: "",
      batch_no: "",
      expiry_date: "",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-teal-50 to-emerald-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Package className="text-emerald-600" />
          Stock Management
        </h1>
        <p className="text-gray-600 mt-1">
          Complete inventory control with FIFO, batch, and reorder alerts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto bg-white rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === STOCK LEDGER TAB === */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search product, SKU, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">In</th>
                  <th className="px-4 py-3 text-left">Out</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      {search
                        ? "No matching transactions"
                        : "No transactions yet"}
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((t) => {
                    const prod = products.find((p) => p.id === t.product_id);
                    const wh = warehouses.find((w) => w.id === t.warehouse_id);
                    const bin = bins.find((b) => b.id === t.bin_id);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{prod?.name}</p>
                            <p className="text-xs text-gray-500">
                              SKU: {prod?.sku}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {wh?.name} → {bin?.code}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              t.transaction_type.includes("in")
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {t.transaction_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                          {t.transaction_type.includes("in") ? t.qty : "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                          {t.transaction_type.includes("out") ? t.qty : "-"}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          {t.balance}
                        </td>
                        <td className="px-4 py-3">
                          ${t.unit_cost?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === VALUATION TAB === */}
      {activeTab === "valuation" && (
        <div>
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl mb-6 flex justify-between items-center">
            <span className="text-xl font-bold text-emerald-800">
              Total Inventory Value (FIFO)
            </span>
            <span className="text-3xl font-bold text-emerald-700">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">On Hand</th>
                  <th className="px-4 py-3 text-left">Avg Cost</th>
                  <th className="px-4 py-3 text-left">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {valuation.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      No valued stock
                    </td>
                  </tr>
                ) : (
                  valuation.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{v.sku}</td>
                      <td className="px-4 py-3 font-medium">{v.name}</td>
                      <td className="px-4 py-3 font-bold">{v.qty}</td>
                      <td className="px-4 py-3">${v.avgCost.toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        ${v.value.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TRANSACTION TAB === */}
      {activeTab === "transaction" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Package className="text-emerald-600" />
            Record Stock Movement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={txForm.product_id}
              onChange={(e) =>
                setTxForm({ ...txForm, product_id: e.target.value })
              }
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>

            <select
              value={txForm.warehouse_id}
              onChange={(e) =>
                setTxForm({
                  ...txForm,
                  warehouse_id: e.target.value,
                  bin_id: "",
                })
              }
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <select
              value={txForm.bin_id}
              onChange={(e) => setTxForm({ ...txForm, bin_id: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!txForm.warehouse_id}
            >
              <option value="">Select Bin</option>
              {bins
                .filter((b) => b.warehouse_id === parseInt(txForm.warehouse_id))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.zone})
                  </option>
                ))}
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={txForm.qty}
              onChange={(e) => setTxForm({ ...txForm, qty: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="number"
              step="0.01"
              placeholder="Unit Cost"
              value={txForm.unit_cost}
              onChange={(e) =>
                setTxForm({ ...txForm, unit_cost: e.target.value })
              }
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              placeholder="Reference (GRN/SO/ADJ)"
              value={txForm.reference_id}
              onChange={(e) =>
                setTxForm({ ...txForm, reference_id: e.target.value })
              }
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {products.find((p) => p.id === parseInt(txForm.product_id))
              ?.has_batch && (
              <>
                <div className="flex items-center gap-2">
                  <Hash className="text-gray-400" size={20} />
                  <input
                    placeholder="Batch No"
                    value={txForm.batch_no}
                    onChange={(e) =>
                      setTxForm({ ...txForm, batch_no: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400" size={20} />
                  <input
                    type="date"
                    value={txForm.expiry_date}
                    onChange={(e) =>
                      setTxForm({ ...txForm, expiry_date: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleTransaction("receipt_in")}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <ArrowDown className="w-4 h-4" /> Receive (GRN)
            </button>
            <button
              onClick={() => handleTransaction("issue_out")}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <ArrowUp className="w-4 h-4" /> Issue (SO)
            </button>
            <button
              onClick={() => handleTransaction("adjustment_in")}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <AlertTriangle className="w-4 h-4" /> Adjustment
            </button>
          </div>
        </div>
      )}

      {/* === REORDER ALERTS TAB === */}
      {activeTab === "reorder" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-amber-700">
            <AlertTriangle className="text-amber-600" />
            Items Below Reorder Point
          </h3>
          {lowStockItems.length === 0 ? (
            <p className="text-emerald-600 text-lg">
              All items are above reorder level
            </p>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="bg-amber-50 border border-amber-300 p-5 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-lg">{p.name}</span>
                    <span className="text-sm text-gray-600 ml-3">
                      (Current: <strong>{p.currentStock}</strong> | Reorder:{" "}
                      <strong>{p.reorder_point}</strong>)
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                    Create PO
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
