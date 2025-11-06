// src/components/BOMManagement.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  FolderTree,
  Plus,
  Download,
  Printer,
  Play,
  Edit,
  ChevronDown,
  X,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BOMManagement = () => {
  const { bomTemplates, activeBOM, setActiveBOM, explodedData, explodeBOM } =
    useProduction();

  // UI State
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [exploding, setExploding] = useState(false);

  // Form State
  const [createForm, setCreateForm] = useState({ name: "", components: [] });
  const [editForm, setEditForm] = useState({ ...activeBOM });

  // -----------------------------------------------------------------
  // Export Functions
  // -----------------------------------------------------------------
  const exportCSV = (data, name) => {
    const headers = ["Level", "Component", "Qty/Parent", "Total Qty", "Cost"];
    const rows = data.map((r) => [
      r.level,
      r.name,
      r.qty,
      r.totalQty,
      `$${r.cost}`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${name}_BOM_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportExcel = async (data, name) => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      data.map((r) => ({
        Level: r.level,
        Component: r.name,
        "Qty/Parent": r.qty,
        "Total Qty": r.totalQty,
        Cost: `$${r.cost}`,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM");
    XLSX.writeFile(
      wb,
      `${name}_BOM_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const printPDF = (title, data) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      head: [["Level", "Component", "Qty", "Total Qty", "Cost"]],
      body: data.map((r) => [r.level, r.name, r.qty, r.totalQty, `$${r.cost}`]),
      startY: 40,
    });
    doc.save(`${title.replace(/\s/g, "_")}.pdf`);
  };

  // -----------------------------------------------------------------
  // Action Buttons
  // -----------------------------------------------------------------
  const actions = {
    "New BOM": () => {
      setCreateForm({ name: "", components: [] });
      setShowCreate(true);
    },
    "Explode BOM": () => {
      setExploding(true);
      setTimeout(() => {
        explodeBOM(activeBOM.id);
        setExploding(false);
      }, 1000);
    },
    Export: null,
    Print: () => printPDF(`BOM - ${activeBOM.name}`, explodedData),
    "Edit BOM": () => {
      setEditForm({ ...activeBOM });
      setShowEdit(true);
    },
  };

  const renderAction = (act) => {
    const cfg = {
      "New BOM": { icon: Plus, color: "indigo", fn: actions["New BOM"] },
      "Explode BOM": {
        icon: Play,
        color: "emerald",
        loading: exploding,
        fn: actions["Explode BOM"],
      },
      Export: { icon: Download, color: "blue", menu: true },
      Print: { icon: Printer, color: "gray", fn: actions["Print"] },
      "Edit BOM": { icon: Edit, color: "orange", fn: actions["Edit BOM"] },
    }[act];
    if (!cfg) return null;
    const Icon = cfg.icon;

    if (cfg.menu) {
      return (
        <div key={act} className="relative group">
          <button
            className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200 hover:bg-${cfg.color}-100 transition-all`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{act}</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
            <button
              onClick={() => exportCSV(explodedData, activeBOM.name)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileDown className="w-3 h-3" /> <span>CSV</span>
            </button>
            <button
              onClick={() => exportExcel(explodedData, activeBOM.name)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-3 h-3" /> <span>Excel</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        key={act}
        onClick={cfg.fn}
        disabled={cfg.loading}
        className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200 hover:bg-${cfg.color}-100 disabled:opacity-50 transition-all`}
      >
        {cfg.loading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
        <span>{act}</span>
      </button>
    );
  };

  // -----------------------------------------------------------------
  // Form Helpers (Create & Edit)
  // -----------------------------------------------------------------
  const addComponent = (form, setForm) => {
    setForm((f) => ({
      ...f,
      components: [
        ...f.components,
        { id: Date.now(), name: "", qty: 1, cost: 0 },
      ],
    }));
  };

  const removeComponent = (form, setForm, idx) => {
    setForm((f) => ({
      ...f,
      components: f.components.filter((_, i) => i !== idx),
    }));
  };

  const updateComponent = (form, setForm, idx, field, value) => {
    setForm((f) => {
      const comps = [...f.components];
      comps[idx][field] =
        field === "qty" || field === "cost" ? Number(value) : value;
      return { ...f, components: comps };
    });
  };

  const handleCreate = () => {
    if (createForm.name && createForm.components.some((c) => c.name)) {
      alert(
        `BOM "${createForm.name}" created with ${createForm.components.length} components`
      );
      setShowCreate(false);
    }
  };

  const handleEdit = () => {
    alert(`BOM "${editForm.name}" updated`);
    setShowEdit(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">BOM Management</h1>
        <div className="flex space-x-1 mt-3 -mb-px">
          {bomTemplates
            .filter((b) => b.components?.length > 0)
            .map((bom) => (
              <button
                key={bom.id}
                onClick={() => setActiveBOM(bom)}
                className={`flex items-center space-x-2 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200
                  ${
                    activeBOM.id === bom.id
                      ? "bg-white border-x border-t border-gray-300 text-indigo-700 shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>{bom.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex space-x-2">
          {["New BOM", "Explode BOM", "Export", "Print", "Edit BOM"].map(
            renderAction
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* BOM Structure */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-lg mb-4">BOM Structure</h3>
            <ul className="space-y-2 text-sm">
              {activeBOM.components.map((c, i) => (
                <li key={i} className="flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2 text-indigo-600" />
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-gray-500">(x{c.qty})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explosion Results */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-lg mb-4">Explosion Results</h3>
            {explodedData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Level</th>
                      <th className="px-3 py-2 text-left">Component</th>
                      <th className="px-3 py-2 text-left">Qty/Parent</th>
                      <th className="px-3 py-2 text-left">Total Qty</th>
                      <th className="px-3 py-2 text-left">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explodedData.map((r, i) => (
                      <tr
                        key={i}
                        className="border-t hover:bg-indigo-50 transition-colors"
                      >
                        <td className="px-3 py-2">{r.level}</td>
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2">{r.qty}</td>
                        <td className="px-3 py-2 font-bold text-indigo-700">
                          {r.totalQty}
                        </td>
                        <td className="px-3 py-2">${r.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Click <strong>Explode BOM</strong> to generate breakdown.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CREATE BOM MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Create New BOM</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              placeholder="BOM Name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
            />

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Components</span>
                <button
                  onClick={() => addComponent(createForm, setCreateForm)}
                  className="text-indigo-600 text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Component
                </button>
              </div>
              {createForm.components.map((c, idx) => (
                <div key={c.id} className="flex gap-2 mb-2 items-center">
                  <input
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) =>
                      updateComponent(
                        createForm,
                        setCreateForm,
                        idx,
                        "name",
                        e.target.value
                      )
                    }
                    className="flex-1 px-3 py-1 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={c.qty}
                    onChange={(e) =>
                      updateComponent(
                        createForm,
                        setCreateForm,
                        idx,
                        "qty",
                        e.target.value
                      )
                    }
                    className="w-20 px-3 py-1 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Cost"
                    value={c.cost}
                    onChange={(e) =>
                      updateComponent(
                        createForm,
                        setCreateForm,
                        idx,
                        "cost",
                        e.target.value
                      )
                    }
                    className="w-24 px-3 py-1 border rounded"
                  />
                  <button
                    onClick={() =>
                      removeComponent(createForm, setCreateForm, idx)
                    }
                    className="text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create BOM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOM MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Edit {activeBOM.name}</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-orange-500"
            />

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Components</span>
                <button
                  onClick={() => addComponent(editForm, setEditForm)}
                  className="text-orange-600 text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
              {editForm.components.map((c, idx) => (
                <div key={c.id} className="flex gap-2 mb-2 items-center">
                  <input
                    value={c.name}
                    onChange={(e) =>
                      updateComponent(
                        editForm,
                        setEditForm,
                        idx,
                        "name",
                        e.target.value
                      )
                    }
                    className="flex-1 px-3 py-1 border rounded"
                  />
                  <input
                    type="number"
                    value={c.qty}
                    onChange={(e) =>
                      updateComponent(
                        editForm,
                        setEditForm,
                        idx,
                        "qty",
                        e.target.value
                      )
                    }
                    className="w-20 px-3 py-1 border rounded"
                  />
                  <input
                    type="number"
                    value={c.cost}
                    onChange={(e) =>
                      updateComponent(
                        editForm,
                        setEditForm,
                        idx,
                        "cost",
                        e.target.value
                      )
                    }
                    className="w-24 px-3 py-1 border rounded"
                  />
                  <button
                    onClick={() => removeComponent(editForm, setEditForm, idx)}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEdit(false)}
                className="px-5 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-5 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMManagement;
