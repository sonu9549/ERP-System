// src/pages/inventory/Products.jsx
import { useSales } from "../../context/SalesContext";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Products() {
  const { products, setProducts, stockLedger } = useSales();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    uom: "PCS",
    cost_price: "",
    selling_price: "",
    min_stock: 0,
    reorder_point: 0,
    has_batch: false,
    has_serial: false,
  });

  // Calculate current stock per product
  const getStock = (productId) => {
    return stockLedger
      .filter((t) => t.product_id === productId)
      .reduce((sum, t) => sum + t.qty_in - t.qty_out, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      id: editing?.id || Date.now(),
      ...form,
      cost_price: parseFloat(form.cost_price),
      selling_price: parseFloat(form.selling_price),
      min_stock: parseInt(form.min_stock),
      reorder_point: parseInt(form.reorder_point),
    };

    if (editing) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? newProduct : p))
      );
    } else {
      setProducts((prev) => [...prev, newProduct]);
    }
    setShowForm(false);
    setEditing(null);
    setForm({
      sku: "",
      name: "",
      uom: "PCS",
      cost_price: "",
      selling_price: "",
      min_stock: 0,
      reorder_point: 0,
      has_batch: false,
      has_serial: false,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      <div className="mb-6">
        {products
          .filter((p) => getStock(p.id) < p.reorder_point)
          .map((p) => (
            <div
              key={p.id}
              className="bg-orange-50 border border-orange-200 p-3 rounded mb-2 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="font-medium">{p.name}</span>
              <span className="text-sm">
                Stock: {getStock(p.id)} | Reorder: {p.reorder_point}
              </span>
            </div>
          ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">UOM</th>
              <th className="px-4 py-3 text-left">Cost</th>
              <th className="px-4 py-3 text-left">Sell</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Min</th>
              <th className="px-4 py-3 text-left">Reorder</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => {
              const stock = getStock(p.id);
              return (
                <tr
                  key={p.id}
                  className={stock < p.reorder_point ? "bg-orange-50" : ""}
                >
                  <td className="px-4 py-3 font-medium">{p.sku}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.uom}</td>
                  <td className="px-4 py-3">${p.cost_price}</td>
                  <td className="px-4 py-3">${p.selling_price}</td>
                  <td className="px-4 py-3 font-medium">{stock}</td>
                  <td className="px-4 py-3">{p.min_stock}</td>
                  <td className="px-4 py-3">{p.reorder_point}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setForm(p);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() =>
                        setProducts((prev) => prev.filter((x) => x.id !== p.id))
                      }
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editing ? "Edit" : "Add"} Product
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                placeholder="SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
                className="input"
              />
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input"
              />
              <input
                placeholder="Cost Price"
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) =>
                  setForm({ ...form, cost_price: e.target.value })
                }
                required
                className="input"
              />
              <input
                placeholder="Selling Price"
                type="number"
                step="0.01"
                value={form.selling_price}
                onChange={(e) =>
                  setForm({ ...form, selling_price: e.target.value })
                }
                required
                className="input"
              />
              <input
                placeholder="Min Stock"
                type="number"
                value={form.min_stock}
                onChange={(e) =>
                  setForm({ ...form, min_stock: e.target.value })
                }
                className="input"
              />
              <input
                placeholder="Reorder Point"
                type="number"
                value={form.reorder_point}
                onChange={(e) =>
                  setForm({ ...form, reorder_point: e.target.value })
                }
                className="input"
              />
              <div className="flex gap-4">
                <label>
                  <input
                    type="checkbox"
                    checked={form.has_batch}
                    onChange={(e) =>
                      setForm({ ...form, has_batch: e.target.checked })
                    }
                  />{" "}
                  Batch
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.has_serial}
                    onChange={(e) =>
                      setForm({ ...form, has_serial: e.target.checked })
                    }
                  />{" "}
                  Serial
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
