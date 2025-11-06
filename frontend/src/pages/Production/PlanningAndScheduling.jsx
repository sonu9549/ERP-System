// src/components/PlanningAndScheduling.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  Calendar,
  Package,
  Settings,
  TrendingUp,
  CalendarDays,
  Plus,
  Download,
  Printer,
  Play,
  AlertCircle,
  Eye,
  History,
  Edit,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  X,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PlanningAndScheduling = () => {
  const { planningTabs, activeTab, setActiveTab } = useProduction();

  // === STATE ===
  const [mpsData, setMpsData] = useState([
    { item: "Widget A", qty: 1200, due: "2025-11-15", status: "On Track" },
    { item: "Widget B", qty: 800, due: "2025-11-20", status: "Delayed" },
  ]);
  const [mrpRunning, setMrpRunning] = useState(false);
  const [mrpResult, setMrpResult] = useState(null);
  const [capacityUtil, setCapacityUtil] = useState(82);
  const [forecastAcc, setForecastAcc] = useState(null);
  const [forecastHistory, setForecastHistory] = useState([]);
  const [shifts, setShifts] = useState([
    { date: "2025-11-06", shift: "A (8-16)" },
    { date: "2025-11-07", shift: "B (16-00)" },
  ]);

  // === MODAL STATES ===
  const [showMpsModal, setShowMpsModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);

  // === FORM DATA ===
  const [mpsForm, setMpsForm] = useState({ item: "", qty: "", due: "" });
  const [shiftForm, setShiftForm] = useState({ date: "", shift: "" });
  const [whatIfDemand, setWhatIfDemand] = useState("");

  const iconMap = { Calendar, Package, Settings, TrendingUp, CalendarDays };

  // === EXPORT FUNCTIONS ===
  const exportCSV = (data, name) => {
    const headers = Object.keys(data[0] || {});
    const rows = data.map((r) => headers.map((h) => r[h]));
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `${name}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportExcel = (data, name) => {
    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(
        wb,
        `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    });
  };

  const printPDF = (title, cols, rows) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, { head: [cols], body: rows, startY: 40 });
    doc.save(`${title.replace(/\s/g, "_")}.pdf`);
  };

  // === ACTIONS ===
  const actions = {
    "New MPS": () => setShowMpsModal(true),
    Print: () =>
      printPDF(
        "MPS Report",
        ["Item", "Qty", "Due", "Status"],
        mpsData.map((r) => [r.item, r.qty, r.due, r.status])
      ),
    "Run MRP": async () => {
      setMrpRunning(true);
      await new Promise((r) => setTimeout(r, 2000));
      const po = Math.floor(Math.random() * 15) + 5;
      setMrpResult({ po, shortages: Math.floor(Math.random() * 3) });
      setMrpRunning(false);
    },
    "View Exceptions": () => alert(`3 critical shortages detected`),
    "Load Analysis": () =>
      setCapacityUtil((p) =>
        Math.min(100, p + Math.floor(Math.random() * 8) - 2)
      ),
    "What-If": () => setShowWhatIfModal(true),
    "Generate Forecast": () => setShowForecastModal(true),
    "Edit Models": () => alert("Opening Forecast Model Builder..."),
    History: () => {},
    "Add Shift": () => setShowShiftModal(true),
    Holidays: () => alert("Diwali: 2025-11-15\nChristmas: 2025-12-25"),
    "View Schedule": () => {},
  };

  // === RENDER ACTION BUTTON ===
  const renderAction = (act) => {
    const cfg = {
      "New MPS": { icon: Plus, color: "indigo" },
      Export: { icon: Download, color: "blue", menu: true },
      Print: { icon: Printer, color: "gray" },
      "Run MRP": { icon: Play, color: "emerald", loading: mrpRunning },
      "View Exceptions": { icon: AlertCircle, color: "red" },
      "Load Analysis": { icon: RefreshCw, color: "teal" },
      "What-If": { icon: Eye, color: "purple" },
      "Generate Forecast": { icon: TrendingUp, color: "green" },
      "Edit Models": { icon: Edit, color: "orange" },
      History: { icon: History, color: "cyan" },
      "Add Shift": { icon: Plus, color: "indigo" },
      Holidays: { icon: CalendarDays, color: "pink" },
      "View Schedule": { icon: Eye, color: "indigo" },
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
              onClick={() => exportCSV(mpsData, "MPS")}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileDown className="w-3 h-3" /> <span>CSV</span>
            </button>
            <button
              onClick={() => exportExcel(mpsData, "MPS")}
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
        onClick={actions[act]}
        disabled={cfg.loading}
        className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-sm
          bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200
          hover:bg-${cfg.color}-100 disabled:opacity-50`}
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

  // === FORM HANDLERS ===
  const handleMpsSubmit = () => {
    if (mpsForm.item && mpsForm.qty && mpsForm.due) {
      setMpsData([
        ...mpsData,
        { ...mpsForm, qty: +mpsForm.qty, status: "Planned" },
      ]);
      setMpsForm({ item: "", qty: "", due: "" });
      setShowMpsModal(false);
    }
  };

  const handleShiftSubmit = () => {
    if (shiftForm.date && shiftForm.shift) {
      setShifts([...shifts, { ...shiftForm }]);
      setShiftForm({ date: "", shift: "" });
      setShowShiftModal(false);
    }
  };

  const handleWhatIf = () => {
    alert(`Simulating +${whatIfDemand}% demand...`);
    setShowWhatIfModal(false);
  };

  const handleForecast = async () => {
    setForecastAcc(null);
    await new Promise((r) => setTimeout(r, 2500));
    const acc = Math.floor(Math.random() * 6) + 90;
    setForecastAcc(acc);
    setForecastHistory((p) => [
      { date: new Date().toLocaleDateString(), accuracy: acc },
      ...p.slice(0, 2),
    ]);
    setShowForecastModal(false);
  };

  const currentTab = planningTabs.find((t) => t.id === activeTab);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Planning & Scheduling
          </h1>
          <div className="text-sm text-gray-500">
            Plant: Mumbai | Period: Q4 2025
          </div>
        </div>
        <div className="flex space-x-1 mt-3 -mb-px">
          {planningTabs.map((tab) => {
            const Icon = iconMap[tab.icon];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? "bg-white border-x border-t border-gray-300 text-indigo-700 shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {currentTab.actions.map(renderAction)}
          </div>
          <div className="text-xs text-gray-500 flex items-center">
            <RefreshCw className="w-3 h-3 mr-1" />
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* === MPS === */}
          {activeTab === "mps" && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b bg-gradient-to-r from-indigo-50 to-white">
                <h3 className="text-lg font-semibold text-gray-800">
                  Master Production Schedule
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {mpsData.length} active items
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Item</th>
                      <th className="px-5 py-3 text-left font-medium">
                        Quantity
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Due Date
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mpsData.map((r, i) => (
                      <tr
                        key={i}
                        className="border-t hover:bg-indigo-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium">{r.item}</td>
                        <td className="px-5 py-3">{r.qty.toLocaleString()}</td>
                        <td className="px-5 py-3">{r.due}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              r.status === "On Track"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === MRP === */}
          {activeTab === "mrp" && (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              {mrpResult ? (
                <div className="space-y-4">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold">MRP Run Completed</h3>
                  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <p className="text-3xl font-bold text-emerald-700">
                        {mrpResult.po}
                      </p>
                      <p className="text-sm text-gray-600">Purchase Orders</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-3xl font-bold text-orange-700">
                        {mrpResult.shortages}
                      </p>
                      <p className="text-sm text-gray-600">Shortages</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Package className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    MRP Not Executed Today
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Run MRP to generate purchase requirements
                  </p>
                  <button
                    onClick={actions["Run MRP"]}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center mx-auto transition-all"
                  >
                    {mrpRunning ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    Run MRP Now
                  </button>
                </>
              )}
            </div>
          )}

          {/* === CAPACITY === */}
          {activeTab === "capacity" && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                <p className="text-5xl font-bold text-gray-800">
                  {capacityUtil}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Average Capacity Utilization
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl border">
                  <p className="text-sm text-gray-600">Machine Center A</p>
                  <p className="text-2xl font-bold text-yellow-700">78%</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl border">
                  <p className="text-sm text-gray-600">Machine Center B</p>
                  <p className="text-2xl font-bold text-emerald-700">91%</p>
                </div>
              </div>
            </div>
          )}

          {/* === FORECAST === */}
          {activeTab === "forecast" && (
            <div className="space-y-6">
              {forecastAcc !== null && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold text-green-800">
                    Latest Forecast Accuracy
                  </p>
                  <p className="text-5xl font-bold text-green-700 mt-2">
                    {forecastAcc}%
                  </p>
                </div>
              )}
              <button
                onClick={actions["Generate Forecast"]}
                className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-lg font-medium"
              >
                Generate New Forecast
              </button>

              {forecastHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h4 className="font-semibold mb-3">Forecast History</h4>
                  {forecastHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <span className="text-sm">{h.date}</span>
                      <span className="font-medium text-green-700">
                        {h.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === CALENDAR === */}
          {activeTab === "calendar" && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Shift Schedule - November 2025
              </h3>
              <div className="space-y-3">
                {shifts.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg"
                  >
                    <span className="font-medium">{s.date}</span>
                    <span className="text-indigo-700">{s.shift}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={actions["Add Shift"]}
                className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                + Add New Shift
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === MODALS === */}

      {/* MPS Modal */}
      {showMpsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Create MPS</h3>
              <button
                onClick={() => setShowMpsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Item Name"
                value={mpsForm.item}
                onChange={(e) =>
                  setMpsForm({ ...mpsForm, item: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={mpsForm.qty}
                onChange={(e) =>
                  setMpsForm({ ...mpsForm, qty: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={mpsForm.due}
                onChange={(e) =>
                  setMpsForm({ ...mpsForm, due: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMpsModal(false)}
                className="px-5 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMpsSubmit}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create MPS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-5">Add Shift</h3>
            <input
              type="date"
              value={shiftForm.date}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, date: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Shift (e.g. A 8-16)"
              value={shiftForm.shift}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, shift: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowShiftModal(false)}
                className="px-5 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleShiftSubmit}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What-If Modal */}
      {showWhatIfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-5">What-If Analysis</h3>
            <input
              placeholder="Demand Increase (%)"
              value={whatIfDemand}
              onChange={(e) => setWhatIfDemand(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowWhatIfModal(false)}
                className="px-5 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleWhatIf}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg"
              >
                Simulate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Progress Modal */}
      {showForecastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold mb-2">Generating Forecast...</h3>
            <p className="text-gray-600">
              Analyzing historical data and trends
            </p>
            {setTimeout(handleForecast, 2500)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningAndScheduling;
