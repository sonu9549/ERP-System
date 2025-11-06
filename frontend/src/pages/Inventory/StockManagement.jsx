import { useSales } from "../../context/SalesContext";
import {
  Package,
  History,
  DollarSign,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
} from "lucide-react";
import { useState, useMemo } from "react";

export default function StockManagement() {
  const { products, warehouses, bins, stockLedger, addStockTransaction } =
    useSales();
  const [activeTab, setActiveTab] = useState("ledger");

  // === Transaction Form State ===
  const [txForm, setTxForm] = useState({
    product_id: "",
    warehouse_id: "",
    bin_id: "",
    qty: 0,
    unit_cost: "",
    reference_type: "GRN",
    reference_id: "",
    batch_no: "",
    expiry_date: "",
  });

  // === Tabs ===
  const tabs = [
    { id: "ledger", label: "Stock Ledger", icon: History },
    { id: "valuation", label: "Valuation (FIFO)", icon: DollarSign },
    { id: "transaction", label: "New Transaction", icon: Package },
    { id: "reorder", label: "Reorder Alerts", icon: AlertTriangle },
  ];

  // === Helper: Current Stock per Product + Bin ===
  const currentStock = useMemo(() => {
    const map = {};
    stockLedger.forEach((t) => {
      const key = `${t.product_id}-${t.warehouse_id}-${t.bin_id}`;
      map[key] = (map[key] || 0) + t.qty_in - t.qty_out;
    });
    return map;
  }, [stockLedger]);

  // === Valuation (FIFO) ===
  const valuation = useMemo(() => {
    return products
      .map((p) => {
        const layers = stockLedger
          .filter((t) => t.product_id === p.id && t.balance > 0)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const qty = layers.reduce((s, t) => s + t.balance, 0);
        const value = layers.reduce((s, t) => s + t.balance * t.unit_cost, 0);

        return { ...p, qty, value, avgCost: qty > 0 ? value / qty : 0 };
      })
      .filter((v) => v.qty > 0);
  }, [products, stockLedger]);

  const grandTotal = valuation.reduce((s, v) => s + v.value, 0);

  // === Reorder Alerts ===
  const lowStockItems = products.filter((p) => {
    const total = stockLedger
      .filter((t) => t.product_id === p.id)
      .reduce((s, t) => s + t.qty_in - t.qty_out, 0);
    return total < p.reorder_point && total > 0;
  });

  // === Handle Transaction ===
  const handleTransaction = (type) => {
    const tx = {
      ...txForm,
      product_id: parseInt(txForm.product_id),
      warehouse_id: parseInt(txForm.warehouse_id),
      bin_id: parseInt(txForm.bin_id),
      qty: parseInt(txForm.qty),
      unit_cost: parseFloat(txForm.unit_cost),
      transaction_type: type,
      batch_no: txForm.batch_no || null,
      expiry_date: txForm.expiry_date || null,
    };
    addStockTransaction(tx);
    setTxForm({
      product_id: "",
      warehouse_id: "",
      bin_id: "",
      qty: 0,
      unit_cost: "",
      reference_type: "GRN",
      reference_id: "",
      batch_no: "",
      expiry_date: "",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Stock Management
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
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
              {stockLedger
                .slice()
                .reverse()
                .map((t) => {
                  const prod = products.find((p) => p.id === t.product_id);
                  const wh = warehouses.find((w) => w.id === t.warehouse_id);
                  const bin = bins.find((b) => b.id === t.bin_id);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{prod?.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {wh?.code}-{bin?.code}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            t.transaction_type.includes("in")
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {t.transaction_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.qty_in || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.qty_out || "-"}
                      </td>
                      <td className="px-4 py-3 font-bold">{t.balance}</td>
                      <td className="px-4 py-3">${t.unit_cost.toFixed(2)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* === VALUATION TAB === */}
      {activeTab === "valuation" && (
        <div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span className="font-bold text-green-800">
              Total Inventory Value (FIFO)
            </span>
            <span className="text-2xl font-bold text-green-700">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">On Hand</th>
                  <th className="px-4 py-3 text-left">Avg Cost</th>
                  <th className="px-4 py-3 text-left">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {valuation.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3">{v.sku}</td>
                    <td className="px-4 py-3 font-medium">{v.name}</td>
                    <td className="px-4 py-3">{v.qty}</td>
                    <td className="px-4 py-3">${v.avgCost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      ${v.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TRANSACTION TAB === */}
      {activeTab === "transaction" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Record Stock Movement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={txForm.product_id}
              onChange={(e) =>
                setTxForm({ ...txForm, product_id: e.target.value })
              }
              className="input"
              required
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
              className="input"
              required
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
              className="input"
              required
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
              className="input"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Unit Cost"
              value={txForm.unit_cost}
              onChange={(e) =>
                setTxForm({ ...txForm, unit_cost: e.target.value })
              }
              className="input"
              required
            />
            <input
              placeholder="Reference (GRN/SO)"
              value={txForm.reference_id}
              onChange={(e) =>
                setTxForm({ ...txForm, reference_id: e.target.value })
              }
              className="input"
            />
            {products.find((p) => p.id === parseInt(txForm.product_id))
              ?.has_batch && (
              <>
                <input
                  placeholder="Batch No"
                  value={txForm.batch_no}
                  onChange={(e) =>
                    setTxForm({ ...txForm, batch_no: e.target.value })
                  }
                  className="input"
                />
                <input
                  type="date"
                  placeholder="Expiry"
                  value={txForm.expiry_date}
                  onChange={(e) =>
                    setTxForm({ ...txForm, expiry_date: e.target.value })
                  }
                  className="input"
                />
              </>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleTransaction("receipt_in")}
              className="btn-success flex items-center gap-2"
            >
              <ArrowDown className="w-4 h-4" /> Receive (GRN)
            </button>
            <button
              onClick={() => handleTransaction("issue_out")}
              className="btn-danger flex items-center gap-2"
            >
              <ArrowUp className="w-4 h-4" /> Issue (SO)
            </button>
            <button
              onClick={() => handleTransaction("adjustment_in")}
              className="btn-warning flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Adjustment
            </button>
          </div>
        </div>
      )}

      {/* === REORDER ALERTS TAB === */}
      {activeTab === "reorder" && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-orange-700">
            Items Below Reorder Point
          </h3>
          {lowStockItems.length === 0 ? (
            <p className="text-green-600">All items are above reorder level</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((p) => {
                const stock = stockLedger
                  .filter((t) => t.product_id === p.id)
                  .reduce((s, t) => s + t.qty_in - t.qty_out, 0);
                return (
                  <div
                    key={p.id}
                    className="bg-orange-50 border border-orange-300 p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold">{p.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        (Current: {stock} | Reorder: {p.reorder_point})
                      </span>
                    </div>
                    <button className="btn-primary text-sm">Create PO</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
