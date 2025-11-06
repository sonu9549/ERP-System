// src/components/QualityControl.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
  X,
  FileDown,
  FileSpreadsheet,
  Package,
  User,
} from "lucide-react";
import { useState } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const QualityControl = () => {
  const { shopFloorData } = useProduction();

  // QC Records (Linked to Shop Floor WOs)
  const [qcRecords, setQcRecords] = useState([
    {
      id: "QC-001",
      woId: "WO-001",
      item: "Car Assembly",
      qty: 10,
      inspected: 6,
      pass: 5,
      fail: 1,
      status: "In Progress",
      inspector: "Amit Sharma",
      date: "2025-11-06",
    },
    {
      id: "QC-002",
      woId: "WO-002",
      item: "Engine Sub-Assembly",
      qty: 20,
      inspected: 18,
      pass: 18,
      fail: 0,
      status: "Completed",
      inspector: "Priya Verma",
      date: "2025-11-05",
    },
  ]);

  const [selectedQC, setSelectedQC] = useState(null);
  const [showInspect, setShowInspect] = useState(false);
  const [inspectForm, setInspectForm] = useState({
    pass: 0,
    fail: 0,
    notes: "",
  });

  // === EXPORT ===
  const exportCSV = () => {
    const headers = [
      "QC#",
      "WO#",
      "Item",
      "Inspected",
      "Pass",
      "Fail",
      "Status",
      "Inspector",
      "Date",
    ];
    const rows = qcRecords.map((q) => [
      q.id,
      q.woId,
      q.item,
      q.inspected,
      q.pass,
      q.fail,
      q.status,
      q.inspector,
      q.date,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `QualityControl_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      qcRecords.map((q) => ({
        "QC#": q.id,
        "WO#": q.woId,
        Item: q.item,
        Inspected: q.inspected,
        Pass: q.pass,
        Fail: q.fail,
        Status: q.status,
        Inspector: q.inspector,
        Date: q.date,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QC Report");
    XLSX.writeFile(
      wb,
      `QualityControl_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const printPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Quality Control Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      head: [["QC#", "WO#", "Item", "Pass", "Fail", "Status", "Inspector"]],
      body: qcRecords.map((q) => [
        q.id,
        q.woId,
        q.item,
        q.pass,
        q.fail,
        q.status,
        q.inspector,
      ]),
      startY: 40,
    });
    doc.save("QC_Report.pdf");
  };

  // === ACTIONS ===
  const renderAction = (act) => {
    const cfg = {
      Export: { icon: Download, color: "blue", menu: true },
      Print: { icon: Printer, color: "gray", fn: printPDF },
      Refresh: {
        icon: RefreshCw,
        color: "indigo",
        fn: () => alert("QC Data Refreshed!"),
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
    return status === "Completed"
      ? "bg-green-100 text-green-700"
      : status === "In Progress"
      ? "bg-orange-100 text-orange-700"
      : "bg-red-100 text-red-700";
  };

  const handleInspect = () => {
    const total = inspectForm.pass + inspectForm.fail;
    if (total > 0 && selectedQC) {
      setQcRecords((prev) =>
        prev.map((q) =>
          q.id === selectedQC.id
            ? {
                ...q,
                inspected: q.inspected + total,
                pass: q.pass + inspectForm.pass,
                fail: q.fail + inspectForm.fail,
                status:
                  q.inspected + total >= q.qty ? "Completed" : "In Progress",
              }
            : q
        )
      );
      setInspectForm({ pass: 0, fail: 0, notes: "" });
      setShowInspect(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quality Control</h1>
          <div className="text-sm font-medium text-emerald-600">
            {qcRecords.filter((q) => q.status === "Completed").length} /{" "}
            {qcRecords.length} Completed
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex space-x-2">
          {["Export", "Print", "Refresh"].map(renderAction)}
        </div>
      </div>

      {/* QC Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left">QC#</th>
                <th className="px-5 py-3 text-left">WO#</th>
                <th className="px-5 py-3 text-left">Item</th>
                <th className="px-5 py-3 text-left">Inspected</th>
                <th className="px-5 py-3 text-left">Pass</th>
                <th className="px-5 py-3 text-left">Fail</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Inspector</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {qcRecords.map((q) => (
                <tr
                  key={q.id}
                  className="border-t hover:bg-indigo-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{q.id}</td>
                  <td className="px-5 py-3">{q.woId}</td>
                  <td className="px-5 py-3">{q.item}</td>
                  <td className="px-5 py-3">
                    {q.inspected}/{q.qty}
                  </td>
                  <td className="px-5 py-3 text-green-600 font-medium">
                    {q.pass}
                  </td>
                  <td className="px-5 py-3 text-red-600 font-medium">
                    {q.fail}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        q.status
                      )}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">{q.inspector}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => {
                        setSelectedQC(q);
                        setShowInspect(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION MODAL */}
      {showInspect && selectedQC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Inspect {selectedQC.woId}</h3>
              <button onClick={() => setShowInspect(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Pass</span>
                <input
                  type="number"
                  min="0"
                  value={inspectForm.pass}
                  onChange={(e) =>
                    setInspectForm({ ...inspectForm, pass: +e.target.value })
                  }
                  className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Fail</span>
                <input
                  type="number"
                  min="0"
                  value={inspectForm.fail}
                  onChange={(e) =>
                    setInspectForm({ ...inspectForm, fail: +e.target.value })
                  }
                  className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="font-medium block mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={inspectForm.notes}
                  onChange={(e) =>
                    setInspectForm({ ...inspectForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows="3"
                  placeholder="Defect type, rework required..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInspect(false)}
                className="flex-1 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInspect}
                className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Submit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControl;
