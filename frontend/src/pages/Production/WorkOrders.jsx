// src/components/WorkOrders.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  Package,
  Plus,
  Download,
  Printer,
  Play,
  Eye,
  Edit,
  ChevronDown,
  X,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const WorkOrders = () => {
  const { bomTemplates, workOrders, setWorkOrders } = useProduction();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ item: "", qty: 1, start: "", end: "" });

  // Export
  const exportCSV = (data) => {
    const headers = [
      "WO#",
      "Item",
      "Qty",
      "Status",
      "Start",
      "End",
      "Progress",
    ];
    const rows = data.map((wo) => [
      wo.id,
      wo.item,
      wo.qty,
      wo.status,
      wo.start,
      wo.end,
      `${wo.progress}%`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    saveAs(blob, `WorkOrders_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportExcel = async (data) => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      data.map((wo) => ({
        "WO#": wo.id,
        Item: wo.item,
        Qty: wo.qty,
        Status: wo.status,
        Start: wo.start,
        End: wo.end,
        Progress: `${wo.progress}%`,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work Orders");
    XLSX.writeFile(
      wb,
      `WorkOrders_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const printPDF = (data) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Work Orders Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      head: [["WO#", "Item", "Qty", "Status", "Start", "End", "Progress"]],
      body: data.map((wo) => [
        wo.id,
        wo.item,
        wo.qty,
        wo.status,
        wo.start,
        wo.end,
        `${wo.progress}%`,
      ]),
      startY: 40,
    });
    doc.save("WorkOrders.pdf");
  };

  // Actions
  const actions = {
    "New WO": () => setShowCreate(true),
    "Release All": () => alert("All Planned WOs released!"),
    Export: null,
    Print: () => printPDF(workOrders),
  };

  const renderAction = (act) => {
    const cfg = {
      "New WO": { icon: Plus, color: "indigo", fn: actions["New WO"] },
      "Release All": {
        icon: Play,
        color: "emerald",
        fn: actions["Release All"],
      },
      Export: { icon: Download, color: "blue", menu: true },
      Print: { icon: Printer, color: "gray", fn: actions["Print"] },
    }[act];
    if (!cfg) return null;
    const Icon = cfg.icon;

    if (cfg.menu) {
      return (
        <div key={act} className="relative group">
          <button
            className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200 hover:bg-${cfg.color}-100`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{act}</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible z-20">
            <button
              onClick={() => exportCSV(workOrders)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileDown className="w-3 h-3" /> <span>CSV</span>
            </button>
            <button
              onClick={() => exportExcel(workOrders)}
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
        className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200 hover:bg-${cfg.color}-100`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{act}</span>
      </button>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Released":
        return <Play className="w-4 h-4 text-emerald-600" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "Planned":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const handleCreate = () => {
    if (form.item && form.qty && form.start && form.end) {
      const newWO = {
        id: `WO-${String(workOrders.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Planned",
        progress: 0,
      };
      setWorkOrders([...workOrders, newWO]);
      setForm({ item: "", qty: 1, start: "", end: "" });
      setShowCreate(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Work Orders</h1>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex space-x-2">
          {["New WO", "Release All", "Export", "Print"].map(renderAction)}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left">WO#</th>
                <th className="px-5 py-3 text-left">Item (BOM)</th>
                <th className="px-5 py-3 text-left">Qty</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Start</th>
                <th className="px-5 py-3 text-left">End</th>
                <th className="px-5 py-3 text-left">Progress</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr
                  key={wo.id}
                  className="border-t hover:bg-indigo-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{wo.id}</td>
                  <td className="px-5 py-3">{wo.item}</td>
                  <td className="px-5 py-3">{wo.qty}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(wo.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          wo.status === "Released"
                            ? "bg-emerald-100 text-emerald-700"
                            : wo.status === "In Progress"
                            ? "bg-orange-100 text-orange-700"
                            : wo.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {wo.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{wo.start}</td>
                  <td className="px-5 py-3">{wo.end}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            wo.progress >= 100
                              ? "bg-green-600"
                              : wo.progress >= 70
                              ? "bg-emerald-600"
                              : wo.progress >= 40
                              ? "bg-orange-600"
                              : "bg-gray-600"
                          }`}
                          style={{ width: `${wo.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">
                        {wo.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-indigo-600 hover:text-indigo-800">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Create Work Order</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <select
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select BOM Item</option>
              {bomTemplates
                .filter((b) => b.components.length > 0)
                .map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: +e.target.value })}
              className="w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              placeholder="Start Date"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              placeholder="End Date"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500"
            />

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
                Create WO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
