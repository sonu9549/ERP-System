// src/components/InventoryManagement.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  Package,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
  X,
  FileDown,
  FileSpreadsheet,
  Search,
  Filter,
  Barcode,
  MapPin,
  Plus,
  Check,
} from "lucide-react";
import { useState } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const InventoryManagement = () => {
  const { bomTemplates } = useProduction();

  // === INVENTORY WITH BIN + LOT/SERIAL ===
  const [inventory, setInventory] = useState([
    // Raw Materials
    {
      id: "RM-001",
      name: "Steel Sheet",
      type: "Raw",
      qty: 450,
      unit: "kg",
      min: 200,
      lot: "LOT-STL-001",
      bin: "A1-01",
      expiry: "2026-06-30",
      status: "OK",
    },
    {
      id: "RM-002",
      name: "Engine Oil",
      type: "Raw",
      qty: 80,
      unit: "L",
      min: 100,
      lot: "LOT-OIL-202",
      bin: "B2-05",
      expiry: "2025-12-15",
      status: "Low",
    },
    {
      id: "RM-003",
      name: "Tire",
      type: "Raw",
      qty: 120,
      unit: "pcs",
      min: 80,
      lot: "LOT-TIR-45",
      bin: "C3-12",
      expiry: null,
      status: "OK",
    },

    // WIP
    {
      id: "WIP-001",
      name: "Engine Sub-Assembly",
      type: "WIP",
      qty: 18,
      unit: "pcs",
      wo: "WO-002",
      bin: "WIP-Zone-A",
      status: "In Progress",
    },
    {
      id: "WIP-002",
      name: "Car Assembly",
      type: "WIP",
      qty: 6,
      unit: "pcs",
      wo: "WO-001",
      bin: "WIP-Zone-B",
      status: "In Progress",
    },

    // Finished Goods
    {
      id: "FG-001",
      name: "Car (Complete)",
      type: "FG",
      qty: 4,
      unit: "pcs",
      serial: "CAR-2025-001",
      bin: "FG-Rack-01",
      status: "Ready",
    },
    {
      id: "FG-002",
      name: "Engine (Spare)",
      type: "FG",
      qty: 2,
      unit: "pcs",
      serial: "ENG-2025-101",
      bin: "FG-Rack-02",
      status: "Ready",
    },
  ]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showReceive, setShowReceive] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    id: "",
    qty: 0,
    lot: "",
    bin: "",
  });

  // === FILTER & SEARCH ===
  const filteredInventory = inventory.filter((i) => {
    const matchesFilter = filter === "All" || i.type === filter;
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // === EXPORT ===
  const exportCSV = () => {
    const headers = [
      "ID",
      "Item",
      "Type",
      "Qty",
      "Unit",
      "Status",
      "Lot/Serial",
      "Bin",
      "WO",
      "Expiry",
    ];
    const rows = filteredInventory.map((i) => [
      i.id,
      i.name,
      i.type,
      i.qty,
      i.unit || "-",
      i.status,
      i.lot || i.serial || "-",
      i.bin,
      i.wo || "-",
      i.expiry || "-",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      filteredInventory.map((i) => ({
        ID: i.id,
        Item: i.name,
        Type: i.type,
        Qty: i.qty,
        Unit: i.unit || "-",
        Status: i.status,
        "Lot/Serial": i.lot || i.serial || "-",
        Bin: i.bin,
        WO: i.wo || "-",
        Expiry: i.expiry || "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(
      wb,
      `Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const printPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Inventory Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      head: [["ID", "Item", "Type", "Qty", "Bin", "Status"]],
      body: filteredInventory.map((i) => [
        i.id,
        i.name,
        i.type,
        i.qty,
        i.bin,
        i.status,
      ]),
      startY: 40,
    });
    doc.save("Inventory.pdf");
  };

  // === ACTIONS ===
  const renderAction = (act) => {
    const cfg = {
      Export: { icon: Download, color: "blue", menu: true },
      Print: { icon: Printer, color: "gray", fn: printPDF },
      Refresh: {
        icon: RefreshCw,
        color: "indigo",
        fn: () => alert("Inventory Synced!"),
      },
    }[act];
    if (!cfg) return null;
    const Icon = cfg.icon;

    if (cfg.menu) {
      return (
        <div key={act} className="relative group">
          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 hover:bg-blue-100">
            <Icon className="w-3.5 h-3.5" />
            <span>{act}</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible z-20">
            <button
              onClick={exportCSV}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileDown className="w-3 h-3" /> <span>CSV</span>
            </button>
            <button
              onClick={exportExcel}
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
        className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-${cfg.color}-50 text-${cfg.color}-700 hover:bg-${cfg.color}-100`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{act}</span>
      </button>
    );
  };

  const getStatusColor = (status) => {
    return status === "OK"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Low"
      ? "bg-orange-100 text-orange-700"
      : status === "Critical"
      ? "bg-red-100 text-red-700"
      : status === "In Progress"
      ? "bg-blue-100 text-blue-700"
      : "bg-green-100 text-green-700";
  };

  // === RECEIVE MATERIAL ===
  const handleReceive = () => {
    if (receiveForm.id && receiveForm.qty > 0 && receiveForm.bin) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === receiveForm.id
            ? {
                ...item,
                qty: item.qty + receiveForm.qty,
                lot: receiveForm.lot || item.lot,
              }
            : item
        )
      );
      setReceiveForm({ id: "", qty: 0, lot: "", bin: "" });
      setShowReceive(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Inventory & Materials
          </h1>
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-orange-600">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              {
                inventory.filter(
                  (i) => i.status === "Low" || i.status === "Critical"
                ).length
              }{" "}
              Low Stock
            </div>
            <div className="text-emerald-600">
              <Package className="w-4 h-4 inline mr-1" />
              {inventory
                .filter((i) => i.type === "FG")
                .reduce((a, b) => a + b.qty, 0)}{" "}
              FG Ready
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {["Export", "Print", "Refresh"].map(renderAction)}
            <button
              onClick={() => setShowReceive(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Receive</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Item / ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Raw">Raw Materials</option>
              <option value="WIP">WIP</option>
              <option value="FG">Finished Goods</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Item</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Qty</th>
                <th className="px-5 py-3 text-left">Unit</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Lot/Serial</th>
                <th className="px-5 py-3 text-left">Bin</th>
                <th className="px-5 py-3 text-left">WO</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-indigo-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{item.id}</td>
                  <td className="px-5 py-3">{item.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === "Raw"
                          ? "bg-purple-100 text-purple-700"
                          : item.type === "WIP"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">{item.qty}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {item.unit || "-"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono">
                    {item.lot || item.serial || "-"}
                  </td>
                  <td className="px-5 py-3 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-500" />
                    {item.bin}
                  </td>
                  <td className="px-5 py-3">{item.wo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIVE MODAL */}
      {showReceive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Receive Material</h3>
              <button onClick={() => setShowReceive(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item ID
                </label>
                <select
                  value={receiveForm.id}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Item</option>
                  {inventory
                    .filter((i) => i.type === "Raw")
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.id} - {i.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={receiveForm.qty}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, qty: +e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Lot Number
                </label>
                <input
                  type="text"
                  value={receiveForm.lot}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, lot: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="LOT-XXX-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Bin Location
                </label>
                <input
                  type="text"
                  value={receiveForm.bin}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, bin: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="A1-01"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReceive(false)}
                className="flex-1 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReceive}
                className="flex-1 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center justify-center"
              >
                <Check className="w-4 h-4 mr-2" /> Receive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
