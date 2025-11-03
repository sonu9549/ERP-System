// src/pages/inventory/WarehouseBins.jsx
import { useOrderShipping } from "../../context/OrderShippingContext";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

export default function WarehouseBins() {
  const { warehouses, setWarehouses, bins, setBins } = useOrderShipping();
  const [showWhForm, setShowWhForm] = useState(false);
  const [showBinForm, setShowBinForm] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [editingBin, setEditingBin] = useState(null);

  const [whForm, setWhForm] = useState({ name: "", code: "", address: "" });
  const [binForm, setBinForm] = useState({
    warehouse_id: "",
    code: "",
    zone: "",
  });

  const handleSaveWh = () => {
    const newWh = { id: editingWh?.id || Date.now(), ...whForm };
    if (editingWh) {
      setWarehouses((prev) =>
        prev.map((w) => (w.id === editingWh.id ? newWh : w))
      );
    } else {
      setWarehouses((prev) => [...prev, newWh]);
    }
    setShowWhForm(false);
    setEditingWh(null);
    setWhForm({ name: "", code: "", address: "" });
  };

  const handleSaveBin = () => {
    const newBin = {
      id: editingBin?.id || Date.now(),
      ...binForm,
      warehouse_id: parseInt(binForm.warehouse_id),
    };
    if (editingBin) {
      setBins((prev) => prev.map((b) => (b.id === editingBin.id ? newBin : b)));
    } else {
      setBins((prev) => [...prev, newBin]);
    }
    setShowBinForm(false);
    setEditingBin(null);
    setBinForm({ warehouse_id: "", code: "", zone: "" });
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Warehouses</h2>
          <button
            onClick={() => setShowWhForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-white p-4 rounded-lg shadow border">
              <h3 className="font-semibold">
                {wh.name} ({wh.code})
              </h3>
              <p className="text-sm text-gray-600">{wh.address}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingWh(wh);
                    setWhForm(wh);
                    setShowWhForm(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() =>
                    setWarehouses((prev) => prev.filter((w) => w.id !== wh.id))
                  }
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Bins</h2>
          <button
            onClick={() => setShowBinForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Bin
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Warehouse</th>
                <th className="px-4 py-3 text-left">Bin Code</th>
                <th className="px-4 py-3 text-left">Zone</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((bin) => {
                const wh = warehouses.find((w) => w.id === bin.warehouse_id);
                return (
                  <tr key={bin.id}>
                    <td className="px-4 py-3">{wh?.name || "N/A"}</td>
                    <td className="px-4 py-3 font-medium">{bin.code}</td>
                    <td className="px-4 py-3">{bin.zone}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingBin(bin);
                          setBinForm(bin);
                          setShowBinForm(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() =>
                          setBins((prev) => prev.filter((b) => b.id !== bin.id))
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
      </div>

      {/* Modals */}
      {showWhForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Warehouse</h3>
            <input
              placeholder="Name"
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              className="input mb-3"
            />
            <input
              placeholder="Code"
              value={whForm.code}
              onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
              className="input mb-3"
            />
            <input
              placeholder="Address"
              value={whForm.address}
              onChange={(e) =>
                setWhForm({ ...whForm, address: e.target.value })
              }
              className="input mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveWh} className="btn-primary flex-1">
                Save
              </button>
              <button
                onClick={() => setShowWhForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Bin</h3>
            <select
              value={binForm.warehouse_id}
              onChange={(e) =>
                setBinForm({ ...binForm, warehouse_id: e.target.value })
              }
              className="input mb-3"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Bin Code"
              value={binForm.code}
              onChange={(e) => setBinForm({ ...binForm, code: e.target.value })}
              className="input mb-3"
            />
            <input
              placeholder="Zone"
              value={binForm.zone}
              onChange={(e) => setBinForm({ ...binForm, zone: e.target.value })}
              className="input mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveBin} className="btn-primary flex-1">
                Save
              </button>
              <button
                onClick={() => setShowBinForm(false)}
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
