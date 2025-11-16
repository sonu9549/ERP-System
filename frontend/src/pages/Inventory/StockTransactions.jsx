import { useInventory } from "../../context/InventoryContext";
import {
  Package,
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export default function StockTransactions() {
  const {
    addStockTransaction,
    stockLedger = [],
    products = [],
    warehouses = [],
    bins = [],
    loading = false,
  } = useInventory();

  const [search, setSearch] = useState("");

  // === Safe Loading ===
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading transactions...</div>
      </div>
    );
  }
  const [type, setType] = useState("receipt");
  const [form, setForm] = useState({
    product_id: "",
    warehouse_id: "",
    bin_id: "",
    qty: 0,
    unit_cost: "",
    reference_type: "GRN",
    reference_id: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addStockTransaction({
      ...form,
      product_id: parseInt(form.product_id),
      warehouse_id: parseInt(form.warehouse_id),
      bin_id: parseInt(form.bin_id),
      qty: parseInt(form.qty),
      unit_cost: parseFloat(form.unit_cost),
      transaction_type:
        type === "receipt"
          ? "receipt_in"
          : type === "issue"
          ? "issue_out"
          : type === "transfer"
          ? "transfer_in"
          : "adjustment_in",
    });
    setForm({
      product_id: "",
      warehouse_id: "",
      bin_id: "",
      qty: 0,
      unit_cost: "",
      reference_type: "GRN",
      reference_id: "",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Stock Transactions</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex gap-4 mb-6">
          {["receipt", "issue", "transfer", "adjustment"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded ${
                type === t ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {t === "receipt" && <ArrowDown className="inline w-4 h-4 mr-1" />}
              {t === "issue" && <ArrowUp className="inline w-4 h-4 mr-1" />}
              {t === "transfer" && (
                <ArrowLeftRight className="inline w-4 h-4 mr-1" />
              )}
              {t === "adjustment" && (
                <AlertTriangle className="inline w-4 h-4 mr-1" />
              )}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            required
            className="input"
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={form.warehouse_id}
            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
            required
            className="input"
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select
            value={form.bin_id}
            onChange={(e) => setForm({ ...form, bin_id: e.target.value })}
            required
            className="input"
          >
            <option value="">Select Bin</option>
            {bins
              .filter((b) => b.warehouse_id === parseInt(form.warehouse_id))
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code}
                </option>
              ))}
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            required
            className="input"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Unit Cost"
            value={form.unit_cost}
            onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
            required
            className="input"
          />
          <input
            placeholder="Reference (GRN/SO)"
            value={form.reference_id}
            onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
            className="input"
          />
          <button type="submit" className="btn-primary col-span-2">
            Record Transaction
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Balance</th>
            </tr>
          </thead>
          <tbody>
            {stockLedger
              .slice(-10)
              .reverse()
              .map((t) => {
                const prod = products.find((p) => p.id === t.product_id);
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-sm">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{prod?.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          t.transaction_type.includes("in")
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.transaction_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.qty_in || t.qty_out}</td>
                    <td className="px-4 py-3 font-medium">{t.balance}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
