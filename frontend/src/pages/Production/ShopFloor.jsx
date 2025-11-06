// src/components/ShopFloor.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  Package,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Barcode,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
  X,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ShopFloor = () => {
  const { shopFloorData, setShopFloorData, workOrders, setWorkOrders } =
    useProduction();

  const [selectedWO, setSelectedWO] = useState(null);
  const [showScan, setShowScan] = useState(false);
  const [barcode, setBarcode] = useState("");

  // Live Clock
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString()),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  // === EXPORT ===
  const exportCSV = () => {
    const headers = [
      "WO#",
      "Item",
      "Qty",
      "Done",
      "Status",
      "Operator",
      "Start",
      "Machine",
    ];
    const rows = shopFloorData.map((wo) => [
      wo.id,
      wo.item,
      wo.qty,
      wo.done,
      wo.status,
      wo.operator || "-",
      wo.start || "-",
      wo.machine,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    saveAs(blob, `ShopFloor_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      shopFloorData.map((wo) => ({
        "WO#": wo.id,
        Item: wo.item,
        Qty: wo.qty,
        Done: wo.done,
        Status: wo.status,
        Operator: wo.operator || "-",
        Start: wo.start || "-",
        Machine: wo.machine,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shop Floor");
    XLSX.writeFile(
      wb,
      `ShopFloor_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const printPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Shop Floor Status", 14, 20);
    doc.setFontSize(10);
    doc.text(`Live: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      head: [["WO#", "Item", "Done/Qty", "Status", "Operator", "Machine"]],
      body: shopFloorData.map((wo) => [
        wo.id,
        wo.item,
        `${wo.done}/${wo.qty}`,
        wo.status,
        wo.operator || "-",
        wo.machine,
      ]),
      startY: 40,
    });
    doc.save("ShopFloor.pdf");
  };

  // === ACTIONS ===
  const renderAction = (act) => {
    const cfg = {
      "Start WO": { icon: Play, color: "emerald", fn: () => alert("Start WO") },
      "Pause WO": { icon: Pause, color: "orange", fn: () => alert("Pause WO") },
      Export: { icon: Download, color: "blue", menu: true },
      Print: { icon: Printer, color: "gray", fn: printPDF },
      Refresh: {
        icon: RefreshCw,
        color: "indigo",
        fn: () => alert("Refreshing..."),
      },
    }[act];
    if (!cfg) return null;
    const Icon = cfg.icon;

    if (cfg.menu) {
      return (
        <div key={act} className="relative group">
          <button
            className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-${cfg.color}-50 text-${cfg.color}-700 hover:bg-${cfg.color}-100`}
          >
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
    const map = {
      Running: "bg-emerald-100 text-emerald-700",
      Queued: "bg-gray-100 text-gray-700",
      Completed: "bg-green-100 text-green-700",
      Issue: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  const handleScan = () => {
    if (barcode) {
      const wo = shopFloorData.find((w) => w.id === barcode);
      if (wo && wo.status === "Queued") {
        setShopFloorData((prev) =>
          prev.map((w) =>
            w.id === barcode
              ? {
                  ...w,
                  status: "Running",
                  operator: "Operator",
                  start: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : w
          )
        );
      }
      setBarcode("");
      setShowScan(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Shop Floor Execution
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <Clock className="w-4 h-4 inline mr-1" /> Live: {time}
            </div>
            <div className="text-sm font-medium text-emerald-600">
              {shopFloorData.filter((wo) => wo.status === "Running").length}{" "}
              Running
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex space-x-2">
          {["Start WO", "Pause WO", "Export", "Print", "Refresh"].map(
            renderAction
          )}
          <button
            onClick={() => setShowScan(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-purple-50 text-purple-700 hover:bg-purple-100"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Scan Start</span>
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopFloorData.map((wo) => (
            <div
              key={wo.id}
              onClick={() => setSelectedWO(wo)}
              className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg">{wo.id}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    wo.status
                  )}`}
                >
                  {wo.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{wo.item}</p>
              <div className="flex justify-between text-sm mb-3">
                <span>
                  Qty:{" "}
                  <strong>
                    {wo.done}/{wo.qty}
                  </strong>
                </span>
                <span>
                  Machine: <strong>{wo.machine}</strong>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    wo.done / wo.qty >= 1
                      ? "bg-green-600"
                      : wo.done / wo.qty >= 0.7
                      ? "bg-emerald-600"
                      : wo.done / wo.qty >= 0.4
                      ? "bg-orange-600"
                      : "bg-gray-600"
                  }`}
                  style={{ width: `${(wo.done / wo.qty) * 100}%` }}
                ></div>
              </div>
              {wo.operator && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  {wo.operator} • Started {wo.start}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SCAN MODAL */}
      {showScan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Scan to Start WO</h3>
              <button onClick={() => setShowScan(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mb-6">
              <Barcode className="w-20 h-20 text-purple-600 mx-auto mb-4" />
              <input
                type="text"
                placeholder="Scan WO#"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleScan()}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg text-center text-lg font-mono focus:border-purple-500"
                autoFocus
              />
            </div>
            <button
              onClick={handleScan}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" /> Start Production
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedWO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">
                {selectedWO.id} - {selectedWO.item}
              </h3>
              <button onClick={() => setSelectedWO(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <strong>Status:</strong> {selectedWO.status}
              </div>
              <div>
                <strong>Machine:</strong> {selectedWO.machine}
              </div>
              <div>
                <strong>Operator:</strong> {selectedWO.operator || "—"}
              </div>
              <div>
                <strong>Started:</strong> {selectedWO.start || "—"}
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span>Progress</span>
                <span className="font-bold">
                  {selectedWO.done} / {selectedWO.qty}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full bg-emerald-600 transition-all"
                  style={{
                    width: `${(selectedWO.done / selectedWO.qty) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button className="py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center">
                <Play className="w-5 h-5 mr-2" /> Resume
              </button>
              <button className="py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center">
                <Pause className="w-5 h-5 mr-2" /> Pause
              </button>
              <button className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" /> Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopFloor;
