// src/pages/purchase/PurchaseManagement.jsx
import { useOrderShipping } from "../../context/OrderShippingContext";
import {
  FileText,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

export default function PurchaseManagement() {
  const { products, warehouses, bins, stockLedger, addStockTransaction } =
    useOrderShipping();
  const [activeTab, setActiveTab] = useState("orders");

  // === Purchase Orders State ===
  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 1,
      poNo: "PO-1001",
      supplier: "TechParts Inc.",
      orderDate: "2025-03-10",
      expectedDate: "2025-03-20",
      status: "Sent",
      items: [
        {
          productId: 1,
          name: 'Laptop Pro 16"',
          qty: 10,
          unitCost: 1150,
          total: 11500,
        },
        {
          productId: 5,
          name: "16GB RAM Stick",
          qty: 20,
          unitCost: 70,
          total: 1400,
        },
      ],
      subtotal: 12900,
      tax: 1290,
      total: 14190,
      received: false,
    },
  ]);

  // === GRN (Goods Received Note) State ===
  const [grns, setGrns] = useState([]);

  // === Form States ===
  const [showPOForm, setShowPOForm] = useState(false);
  const [poForm, setPoForm] = useState({
    supplier: "",
    expectedDate: "",
    items: [],
  });
  const [poItem, setPoItem] = useState({
    productId: "",
    qty: "",
    unitCost: "",
  });

  const [showGRNForm, setShowGRNForm] = useState(false);
  const [grnForm, setGrnForm] = useState({
    poId: "",
    warehouse_id: "",
    bin_id: "",
    receivedDate: "",
    items: [],
  });

  // === Tabs ===
  const tabs = [
    { id: "orders", label: "Purchase Orders", icon: FileText },
    { id: "grn", label: "GRN (Receive)", icon: Truck },
    { id: "pending", label: "Pending Receipts", icon: Package },
    { id: "suppliers", label: "Suppliers", icon: AlertTriangle },
  ];

  // === Add PO Item ===
  const addPOItem = () => {
    if (!poItem.productId || !poItem.qty) return;
    const prod = products.find((p) => p.id === parseInt(poItem.productId));
    const item = {
      productId: prod.id,
      name: prod.name,
      qty: parseInt(poItem.qty),
      unitCost: parseFloat(poItem.unitCost || prod.cost_price),
      total:
        parseInt(poItem.qty) * parseFloat(poItem.unitCost || prod.cost_price),
    };
    setPoForm({ ...poForm, items: [...poForm.items, item] });
    setPoItem({ productId: "", qty: "", unitCost: "" });
  };

  // === Save PO ===
  const savePO = () => {
    const subtotal = poForm.items.reduce((s, i) => s + i.total, 0);
    const newPO = {
      id: Date.now(),
      poNo: `PO-${String(1002 + purchaseOrders.length).padStart(4, "0")}`,
      supplier: poForm.supplier,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: poForm.expectedDate,
      status: "Sent",
      items: poForm.items,
      subtotal,
      tax: subtotal * 0.1,
      total: subtotal * 1.1,
      received: false,
    };
    setPurchaseOrders([...purchaseOrders, newPO]);
    setShowPOForm(false);
    setPoForm({ supplier: "", expectedDate: "", items: [] });
  };

  // === Receive GRN ===
  const receiveGRN = () => {
    const po = purchaseOrders.find((p) => p.id === parseInt(grnForm.poId));
    if (!po) return;

    const newGRN = {
      id: Date.now(),
      grnNo: `GRN-${String(1001 + grns.length).padStart(4, "0")}`,
      poId: po.id,
      poNo: po.poNo,
      receivedDate: grnForm.receivedDate,
      warehouse_id: parseInt(grnForm.warehouse_id),
      bin_id: parseInt(grnForm.bin_id),
      items: grnForm.items,
    };
    setGrns([...grns, newGRN]);

    // Update PO
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === po.id ? { ...p, received: true, status: "Received" } : p
      )
    );

    // Add to Stock Ledger
    grnForm.items.forEach((item) => {
      addStockTransaction({
        product_id: item.productId,
        warehouse_id: parseInt(grnForm.warehouse_id),
        bin_id: parseInt(grnForm.bin_id),
        transaction_type: "receipt_in",
        reference_type: "GRN",
        reference_id: newGRN.grnNo,
        qty: item.qty,
        unit_cost: item.unitCost,
      });
    });

    setShowGRNForm(false);
    setGrnForm({
      poId: "",
      warehouse_id: "",
      bin_id: "",
      receivedDate: "",
      items: [],
    });
  };

  // === Pending POs ===
  const pendingPOs = purchaseOrders.filter((po) => !po.received);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Purchase Management
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
            {tab.id === "pending" && pendingPOs.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {pendingPOs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* === PURCHASE ORDERS TAB === */}
      {activeTab === "orders" && (
        <div>
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="Search PO..."
              className="input w-64"
            />
            <button
              onClick={() => setShowPOForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New PO
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">PO No</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Expected</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className={po.received ? "bg-green-50" : ""}>
                    <td className="px-4 py-3 font-medium">{po.poNo}</td>
                    <td className="px-4 py-3">{po.supplier}</td>
                    <td className="px-4 py-3 text-sm">{po.orderDate}</td>
                    <td className="px-4 py-3 text-sm">{po.expectedDate}</td>
                    <td className="px-4 py-3">${po.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          po.received
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!po.received && (
                        <button
                          onClick={() => {
                            setGrnForm({
                              poId: po.id,
                              warehouse_id: "1",
                              bin_id: "1",
                              receivedDate: new Date()
                                .toISOString()
                                .split("T")[0],
                              items: po.items.map((i) => ({ ...i })),
                            });
                            setShowGRNForm(true);
                          }}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Receive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === GRN TAB === */}
      {activeTab === "grn" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Recent GRNs</h3>
          {grns.length === 0 ? (
            <p className="text-gray-500">No goods received yet.</p>
          ) : (
            <div className="space-y-3">
              {grns.map((grn) => (
                <div key={grn.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-bold">{grn.grnNo}</span>
                    <span className="text-sm text-gray-600">
                      {grn.receivedDate}
                    </span>
                  </div>
                  <p>
                    PO: {grn.poNo} | Items: {grn.items.length}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === PENDING RECEIPTS === */}
      {activeTab === "pending" && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-red-700">
            Pending Receipts ({pendingPOs.length})
          </h3>
          {pendingPOs.map((po) => (
            <div
              key={po.id}
              className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-3 flex justify-between items-center"
            >
              <div>
                <span className="font-bold">{po.poNo}</span>
                <span className="text-sm text-gray-600 ml-2">
                  | {po.supplier} | Expected: {po.expectedDate}
                </span>
              </div>
              <button
                onClick={() => {
                  setGrnForm({
                    poId: po.id,
                    warehouse_id: "1",
                    bin_id: "1",
                    receivedDate: new Date().toISOString().split("T")[0],
                    items: po.items.map((i) => ({ ...i })),
                  });
                  setShowGRNForm(true);
                }}
                className="btn-primary text-sm"
              >
                Receive Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* === SUPPLIERS TAB === */}
      {activeTab === "suppliers" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Supplier Lead Times</h3>
          <p className="text-sm text-gray-600">
            Coming soon: Track supplier performance, lead time, quality rating.
          </p>
        </div>
      )}

      {/* === PO FORM MODAL === */}
      {showPOForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create Purchase Order</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                placeholder="Supplier Name"
                value={poForm.supplier}
                onChange={(e) =>
                  setPoForm({ ...poForm, supplier: e.target.value })
                }
                className="input"
                required
              />
              <input
                type="date"
                placeholder="Expected Date"
                value={poForm.expectedDate}
                onChange={(e) =>
                  setPoForm({ ...poForm, expectedDate: e.target.value })
                }
                className="input"
                required
              />
            </div>

            <div className="border p-4 rounded mb-4">
              <h4 className="font-semibold mb-2">Add Item</h4>
              <div className="grid grid-cols-4 gap-2">
                <select
                  value={poItem.productId}
                  onChange={(e) =>
                    setPoItem({ ...poItem, productId: e.target.value })
                  }
                  className="input text-sm"
                >
                  <option value="">Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={poItem.qty}
                  onChange={(e) =>
                    setPoItem({ ...poItem, qty: e.target.value })
                  }
                  className="input text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  value={poItem.unitCost}
                  onChange={(e) =>
                    setPoItem({ ...poItem, unitCost: e.target.value })
                  }
                  className="input text-sm"
                />
                <button onClick={addPOItem} className="btn-primary text-sm">
                  Add
                </button>
              </div>
              <div className="mt-3">
                {poForm.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm py-1 border-b"
                  >
                    <span>
                      {item.name} x {item.qty}
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={savePO} className="btn-primary flex-1">
                Create PO
              </button>
              <button
                onClick={() => setShowPOForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === GRN FORM MODAL === */}
      {showGRNForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Receive Goods (GRN)</h3>
            <select
              value={grnForm.warehouse_id}
              onChange={(e) =>
                setGrnForm({
                  ...grnForm,
                  warehouse_id: e.target.value,
                  bin_id: "",
                })
              }
              className="input mb-3"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              value={grnForm.bin_id}
              onChange={(e) =>
                setGrnForm({ ...grnForm, bin_id: e.target.value })
              }
              className="input mb-3"
            >
              <option value="">Select Bin</option>
              {bins
                .filter(
                  (b) => b.warehouse_id === parseInt(grnForm.warehouse_id)
                )
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
            </select>
            <input
              type="date"
              value={grnForm.receivedDate}
              onChange={(e) =>
                setGrnForm({ ...grnForm, receivedDate: e.target.value })
              }
              className="input mb-3"
            />
            <div className="border p-3 rounded">
              <p className="font-medium mb-2">Receiving Items:</p>
              {grnForm.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>
                    {item.name} x {item.qty}
                  </span>
                  <span>@ ${item.unitCost}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={receiveGRN} className="btn-success flex-1">
                Receive & Update Stock
              </button>
              <button
                onClick={() => setShowGRNForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
