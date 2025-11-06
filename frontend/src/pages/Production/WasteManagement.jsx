import { useProduction } from "../../context/ProductionContext";
import {
  Trash2,
  AlertTriangle,
  Recycle,
  DollarSign,
  Download,
  Plus,
  Search,
  Filter,
  X,
  Edit,
  Save,
  TrendingUp,
  Package,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const WasteManagement = () => {
  const {
    wasteRecords = [],
    setWasteRecords,
    inventory = [],
  } = useProduction();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    wo: "",
    item: "",
    category: "Scrap",
    qty: "",
    unit: "pcs",
    cost: "",
    reason: "",
    reportedBy: "",
  });

  // Calculations
  const totalWasteCost = wasteRecords.reduce((sum, w) => sum + w.cost, 0);
  const wasteByCategory = wasteRecords.reduce((acc, w) => {
    acc[w.category] = (acc[w.category] || 0) + w.cost;
    return acc;
  }, {});

  const wastePercentage = ((totalWasteCost / 500000) * 100).toFixed(2); // assuming 5L monthly cost

  // Filtered data
  const filteredWaste = useMemo(() => {
    return wasteRecords.filter((w) => {
      const matchesSearch =
        w.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.wo.includes(searchTerm) ||
        w.reason.toLowerCase().includes(searchTerm);
      const matchesCategory =
        filterCategory === "All" || w.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [wasteRecords, searchTerm, filterCategory]);

  // Add/Edit waste
  const handleSave = () => {
    if (editingId) {
      setWasteRecords((prev) =>
        prev.map((w) =>
          w.id === editingId
            ? {
                ...w,
                ...formData,
                cost: parseFloat(formData.cost) || 0,
                qty: parseInt(formData.qty) || 0,
              }
            : w
        )
      );
    } else {
      const newWaste = {
        id: `W${String(wasteRecords.length + 1).padStart(3, "0")}`,
        date: new Date().toISOString().split("T")[0],
        status: formData.category === "Rework" ? "In Rework" : "Pending",
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        qty: parseInt(formData.qty) || 0,
      };
      setWasteRecords((prev) => [...prev, newWaste]);
    }
    setShowAddModal(false);
    setEditingId(null);
    setFormData({
      wo: "",
      item: "",
      category: "Scrap",
      qty: "",
      unit: "pcs",
      cost: "",
      reason: "",
      reportedBy: "",
    });
  };

  // Delete
  const handleDelete = (id) => {
    if (window.confirm("Sure delete karna hai?")) {
      setWasteRecords((prev) => prev.filter((w) => w.id !== id));
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "ID",
      "Date",
      "WO",
      "Item",
      "Category",
      "Qty",
      "Cost",
      "Reason",
      "Status",
    ];
    const rows = filteredWaste.map((w) => [
      w.id,
      w.date,
      w.wo,
      w.item,
      w.category,
      w.qty + w.unit,
      `₹${w.cost}`,
      w.reason,
      w.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    saveAs(blob, `Waste_Report_${format(new Date(), "dd-MMM-yyyy")}.csv`);
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Waste Management Report", 14, 20);
    doc.setFontSize(10);
    doc.text(
      `Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
      14,
      30
    );
    doc.text(
      `Total Waste Cost: ₹${totalWasteCost.toLocaleString()} (${wastePercentage}% of production)`,
      14,
      38
    );

    autoTable(doc, {
      head: [["ID", "WO", "Item", "Cat", "Qty", "Cost", "Reason", "Status"]],
      body: filteredWaste.map((w) => [
        w.id,
        w.wo,
        w.item,
        w.category,
        `${w.qty}${w.unit}`,
        `₹${w.cost}`,
        w.reason.slice(0, 20),
        w.status,
      ]),
      startY: 45,
      theme: "grid",
    });
    doc.save(`Waste_Report_${format(new Date(), "dd-MMM-yyyy")}.pdf`);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Trash2 className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Waste Management
              </h1>
              <p className="text-sm text-gray-600">
                Track, reduce, and analyze production waste
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Plus className="w-5 h-5" /> <span>Add Waste</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Waste Cost</p>
              <p className="text-3xl font-bold text-red-600">
                ₹{totalWasteCost.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Waste %</p>
              <p className="text-3xl font-bold text-orange-600">
                {wastePercentage}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Scrap Items</p>
              <p className="text-3xl font-bold text-gray-700">
                {wasteRecords.filter((w) => w.category === "Scrap").length}
              </p>
            </div>
            <Package className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Action</p>
              <p className="text-3xl font-bold text-yellow-600">
                {wasteRecords.filter((w) => w.status === "Pending").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search WO, item, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none"
        >
          <option value="All">All Categories</option>
          <option>Scrap</option>
          <option>Rework</option>
          <option>Spill</option>
          <option>Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  WO
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWaste.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{w.id}</td>
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(w.date), "dd MMM")}
                  </td>
                  <td className="px-4 py-3 text-sm">{w.wo}</td>
                  <td className="px-4 py-3 text-sm font-medium">{w.item}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        w.category === "Scrap"
                          ? "bg-red-100 text-red-800"
                          : w.category === "Rework"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {w.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {w.qty} {w.unit}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    ₹{w.cost.toLocaleString()}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate"
                    title={w.reason}
                  >
                    {w.reason}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        w.status === "Disposed"
                          ? "bg-gray-100 text-gray-800"
                          : w.status === "In Rework"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => {
                        setEditingId(w.id);
                        setFormData(w);
                        setShowAddModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit" : "Add"} Waste Entry
            </h2>
            <div className="space-y-4">
              <input
                placeholder="Work Order"
                value={formData.wo}
                onChange={(e) =>
                  setFormData({ ...formData, wo: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                placeholder="Item Name"
                value={formData.item}
                onChange={(e) =>
                  setFormData({ ...formData, item: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option>Scrap</option>
                <option>Rework</option>
                <option>Spill</option>
                <option>Expired</option>
                <option>Damage</option>
              </select>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.qty}
                  onChange={(e) =>
                    setFormData({ ...formData, qty: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  placeholder="Unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-24 px-3 py-2 border rounded-lg"
                />
              </div>
              <input
                type="number"
                placeholder="Cost (₹)"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                placeholder="Reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                placeholder="Reported By"
                value={formData.reportedBy}
                onChange={(e) =>
                  setFormData({ ...formData, reportedBy: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" /> <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteManagement;
