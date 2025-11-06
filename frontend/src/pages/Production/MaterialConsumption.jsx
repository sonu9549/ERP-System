// src/components/MaterialConsumption.jsx  (FULLY UPGRADED VERSION)

import { useProduction } from "../../context/ProductionContext";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Download,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const MaterialConsumption = () => {
  const {
    consumptionRecords = [],
    setConsumptionRecords,
    inventory = [],
  } = useProduction();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Stats
  const totalVariance = consumptionRecords.reduce(
    (sum, c) => sum + Math.abs(c.variance),
    0
  );
  const overConsumed = consumptionRecords.filter((c) => c.variance > 0).length;
  const underConsumed = consumptionRecords.filter((c) => c.variance < 0).length;
  const onTarget = consumptionRecords.filter(
    (c) => Math.abs(c.variance) < 0.1
  ).length;
  const accuracy =
    consumptionRecords.length > 0
      ? ((onTarget / consumptionRecords.length) * 100).toFixed(1)
      : 0;

  // Filtered Data
  const filtered = useMemo(() => {
    return consumptionRecords.filter((c) => {
      const matchesSearch =
        c.wo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.material.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "All" || c.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [consumptionRecords, searchTerm, filterStatus]);

  // Open Edit Modal
  const openEdit = (record) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  // Save Edited Record
  const saveEdit = () => {
    if (!editingRecord) return;

    const updated = consumptionRecords.map((r) =>
      r.id === editingRecord.id
        ? {
            ...editingRecord,
            variance: editingRecord.actual - editingRecord.planned,
            variancePercent:
              editingRecord.planned > 0
                ? ((editingRecord.actual - editingRecord.planned) /
                    editingRecord.planned) *
                  100
                : 0,
            status:
              editingRecord.actual > editingRecord.planned * 1.05
                ? "Over Consumed"
                : editingRecord.actual < editingRecord.planned * 0.95
                ? "Under Consumed"
                : "On Target",
          }
        : r
    );

    setConsumptionRecords(updated);
    setShowEditModal(false);
    setEditingRecord(null);
  };

  // Delete Record (with confirmation)
  const deleteRecord = (id) => {
    if (window.confirm("Delete kar de? Ye action irreversible hai!")) {
      setConsumptionRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "WO",
      "Item",
      "Material",
      "Planned",
      "Actual",
      "Variance",
      "%",
      "Status",
      "Issued By",
    ];
    const rows = filtered.map((c) => [
      c.wo,
      c.item,
      c.material,
      c.planned,
      c.actual,
      c.variance.toFixed(2),
      c.variancePercent.toFixed(1) + "%",
      c.status,
      c.issuedBy,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    saveAs(
      blob,
      `Material_Consumption_${format(new Date(), "dd-MMM-yyyy")}.csv`
    );
  };

  // Print Slip
  const printSlip = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MATERIAL ISSUE SLIP", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Slip ID: MIS-${record.id}`, 20, 40);
    doc.text(`Date: ${format(new Date(record.date), "dd MMM yyyy")}`, 20, 50);
    doc.text(`WO: ${record.wo} | Item: ${record.item}`, 20, 60);
    doc.text(`Issued By: ${record.issuedBy}`, 20, 70);

    autoTable(doc, {
      head: [["Material", "Planned", "Actual Issued", "Unit", "Variance"]],
      body: [
        [
          record.material,
          record.planned,
          record.actual,
          record.unit,
          `${record.variance > 0 ? "+" : ""}${record.variance.toFixed(
            2
          )} (${record.variancePercent.toFixed(1)}%)`,
        ],
      ],
      startY: 85,
      theme: "grid",
    });

    doc.setFontSize(11);
    doc.text(`Status: ${record.status}`, 20, 130);
    doc.save(`Issue_Slip_${record.wo}.pdf`);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Package className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Material Consumption
              </h1>
              {/* <p className="text-sm text-gray-600">
                BOM vs Actual • Live variance • Edit/Delete Enabled
              </p> */}
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus className="w-5 h-5" /> <span>Issue Material</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-600">Total Variance</p>
          <p className="text-2xl font-bold text-red-600">
            ±{totalVariance.toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-600">Accuracy</p>
          <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-600">Over</p>
          <p className="text-2xl font-bold text-orange-600">{overConsumed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-600">Under</p>
          <p className="text-2xl font-bold text-blue-600">{underConsumed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-600">On Target</p>
          <p className="text-2xl font-bold text-emerald-600">{onTarget}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 flex space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search WO / Item / Material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none"
        >
          <option value="All">All Status</option>
          <option>Over Consumed</option>
          <option>Under Consumed</option>
          <option>On Target</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-sm border">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  WO
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Material
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Planned
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actual
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Variance
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={`hover:bg-gray-50 ${
                    c.status === "Over Consumed" ? "bg-red-25" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium">{c.wo}</td>
                  <td className="px-4 py-3 text-sm">{c.item}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    {c.material}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {c.planned.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {c.actual.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    <span
                      className={
                        c.variance > 0
                          ? "text-red-600"
                          : c.variance < 0
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      {c.variance > 0 ? "+" : ""}
                      {c.variance.toFixed(2)}
                      <br />
                      <span className="text-xs">
                        ({c.variancePercent.toFixed(1)}%)
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        c.status === "Over Consumed"
                          ? "bg-red-100 text-red-800"
                          : c.status === "Under Consumed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {c.status === "Over Consumed" ? (
                        <XCircle className="w-3 h-3 inline mr-1" />
                      ) : c.status === "Under Consumed" ? (
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                      ) : (
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                      )}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => printSlip(c)}
                      className="text-green-600 hover:text-green-800 mr-3"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRecord(c.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Consumption Record</h2>
            <div className="space-y-4">
              <input
                value={editingRecord.wo}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, wo: e.target.value })
                }
                placeholder="WO"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                value={editingRecord.item}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, item: e.target.value })
                }
                placeholder="Item"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                value={editingRecord.material}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    material: e.target.value,
                  })
                }
                placeholder="Material"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={editingRecord.planned}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      planned: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Planned"
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  value={editingRecord.actual}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      actual: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Actual"
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <input
                value={editingRecord.unit}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, unit: e.target.value })
                }
                placeholder="Unit"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                value={editingRecord.issuedBy}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    issuedBy: e.target.value,
                  })
                }
                placeholder="Issued By"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRecord(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 inline mr-1" /> Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <Save className="w-4 h-4 inline mr-1" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialConsumption;
