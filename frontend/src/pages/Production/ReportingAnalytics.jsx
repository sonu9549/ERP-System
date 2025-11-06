// src/components/ReportingAnalytics.jsx
import { useProduction } from "../../context/ProductionContext";
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  LineChart,
  GripVertical,
  Plus,
  X,
  Save,
  FileText,
  LayoutDashboard,
  FileBarChart,
} from "lucide-react";
import { useState } from "react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const ReportingAnalytics = () => {
  // === CONTEXT DATA WITH FALLBACKS ===
  const {
    shopFloorData = [],
    qcRecords = [],
    inventory = [],
    workOrders = [],
  } = useProduction();

  // === TAB STATE ===
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "custom"

  // === STATIC KPI DATA (can be dynamic later) ===
  const [kpiData] = useState({
    oee: 78.5,
    availability: 85.2,
    performance: 92.1,
    quality: 99.8,
    yield: 94.3,
    downtime: 142,
    predictedDowntime: 38,
    topIssues: [
      { issue: "Machine Jam", count: 5, impact: 68 },
      { issue: "Tool Change", count: 8, impact: 42 },
      { issue: "Material Delay", count: 3, impact: 32 },
    ],
  });

  // === CHART DATA ===
  const oeeTrend = [
    { day: "Mon", oee: 76 },
    { day: "Tue", oee: 78 },
    { day: "Wed", oee: 77 },
    { day: "Thu", oee: 79 },
    { day: "Fri", oee: 78.5 },
  ];

  const yieldBreakdown = [
    { name: "Pass", value: 94.3, color: "#10b981" },
    { name: "Rework", value: 3.7, color: "#f59e0b" },
    { name: "Scrap", value: 2.0, color: "#ef4444" },
  ];

  // === CUSTOM REPORT: AVAILABLE METRICS ===
  const availableMetrics = [
    {
      id: "oee",
      name: "OEE (%)",
      type: "kpi",
      value: () => kpiData.oee.toFixed(1),
    },
    {
      id: "yield",
      name: "First Pass Yield (%)",
      type: "kpi",
      value: () => kpiData.yield.toFixed(1),
    },
    {
      id: "running_wos",
      name: "Running Work Orders",
      type: "count",
      value: () =>
        Array.isArray(shopFloorData)
          ? shopFloorData.filter((w) => w.status === "Running").length
          : 0,
    },
    {
      id: "completed_wos",
      name: "Completed Work Orders",
      type: "count",
      value: () =>
        Array.isArray(shopFloorData)
          ? shopFloorData.filter((w) => w.status === "Completed").length
          : 0,
    },
    {
      id: "qc_pass",
      name: "QC Pass Rate (%)",
      type: "percent",
      value: () => {
        // Defensive: ensure qcRecords is valid array
        if (!Array.isArray(qcRecords) || qcRecords.length === 0) return "0.0";
        const total = qcRecords.reduce((a, b) => a + (b.inspected || 0), 0);
        const pass = qcRecords.reduce((a, b) => a + (b.pass || 0), 0);
        return total > 0 ? ((pass / total) * 100).toFixed(1) : "0.0";
      },
    },
    {
      id: "low_stock",
      name: "Low Stock Items",
      type: "count",
      value: () =>
        Array.isArray(inventory)
          ? inventory.filter(
              (i) => i.status === "Low" || i.status === "Critical"
            ).length
          : 0,
    },
    {
      id: "fg_ready",
      name: "Finished Goods Ready",
      type: "count",
      value: () =>
        Array.isArray(inventory)
          ? inventory
              .filter((i) => i.type === "FG")
              .reduce((a, b) => a + (b.qty || 0), 0)
          : 0,
    },
    {
      id: "total_wo",
      name: "Total Work Orders",
      type: "count",
      value: () => (Array.isArray(workOrders) ? workOrders.length : 0),
    },
  ];

  // === CUSTOM REPORT STATE ===
  const [reportName, setReportName] = useState("Daily Production Summary");
  const [selectedMetrics, setSelectedMetrics] = useState([
    "oee",
    "yield",
    "running_wos",
    "completed_wos",
    "qc_pass",
    "low_stock",
    "fg_ready",
    "total_wo",
  ]);

  // === DRAG & DROP HANDLER ===
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedMetrics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedMetrics(items);
  };

  // === ADD / REMOVE METRICS ===
  const addMetric = (id) => {
    if (!selectedMetrics.includes(id)) {
      setSelectedMetrics([...selectedMetrics, id]);
    }
  };

  const removeMetric = (id) => {
    setSelectedMetrics(selectedMetrics.filter((m) => m !== id));
  };

  // === VALUE FORMATTING ===
  const formatValue = (val, type) => {
    if (type === "percent" || type === "kpi") return `${val}%`;
    return val;
  };

  // === EXPORT: CUSTOM PDF ===
  const exportCustomPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(reportName, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const body = selectedMetrics.map((id) => {
      const metric = availableMetrics.find((m) => m.id === id);
      if (!metric) return ["Unknown", "-"];
      const rawValue =
        typeof metric.value === "function" ? metric.value() : metric.value;
      return [metric.name, formatValue(rawValue, metric.type)];
    });

    autoTable(doc, {
      head: [["Metric", "Value"]],
      body,
      startY: 40,
      theme: "striped",
      styles: { fontSize: 10 },
    });

    doc.save(`${reportName.replace(/\s+/g, "_")}.pdf`);
  };

  // === EXPORT: CUSTOM CSV ===
  const exportCustomCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = selectedMetrics.map((id) => {
      const metric = availableMetrics.find((m) => m.id === id);
      if (!metric) return ["Unknown", "-"];
      const rawValue =
        typeof metric.value === "function" ? metric.value() : metric.value;
      return [metric.name, formatValue(rawValue, metric.type)];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${reportName.replace(/\s+/g, "_")}.csv`);
  };

  // === EXPORT: DASHBOARD CSV ===
  const exportDashboardCSV = () => {
    const headers = ["Metric", "Current", "Target", "Status"];
    const rows = [
      ["OEE", `${kpiData.oee}%`, "85%", kpiData.oee >= 85 ? "Good" : "Below"],
      [
        "Yield",
        `${kpiData.yield}%`,
        "95%",
        kpiData.yield >= 95 ? "Good" : "Low",
      ],
      [
        "Downtime",
        `${kpiData.downtime} mins`,
        "<120 mins",
        kpiData.downtime < 120 ? "Good" : "High",
      ],
    ];

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(
      blob,
      `Production_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // === PRINT DASHBOARD PDF ===
  const printPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Production KPI Dashboard", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
      head: [["Metric", "Current", "Target", "Status"]],
      body: [
        ["OEE", `${kpiData.oee}%`, "85%", kpiData.oee >= 85 ? "Good" : "Below"],
        [
          "Yield",
          `${kpiData.yield}%`,
          "95%",
          kpiData.yield >= 95 ? "Good" : "Low",
        ],
        [
          "Downtime",
          `${kpiData.downtime} mins`,
          "<120 mins",
          kpiData.downtime < 120 ? "Good" : "High",
        ],
      ],
      startY: 40,
      theme: "grid",
    });

    doc.save("Production_KPI_Dashboard.pdf");
  };

  // === RENDER ===
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          {/* Tabs */}
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "custom"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Custom Report</span>
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-2">
            {activeTab === "dashboard" ? (
              <>
                <button
                  onClick={exportDashboardCSV}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-3.5 h-3.5" /> <span>CSV</span>
                </button>
                <button
                  onClick={printPDF}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <Printer className="w-3.5 h-3.5" /> <span>Print</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={exportCustomCSV}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-3.5 h-3.5" /> <span>CSV</span>
                </button>
                <button
                  onClick={exportCustomPDF}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="w-3.5 h-3.5" /> <span>PDF</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                  <Save className="w-3.5 h-3.5" /> <span>Save</span>
                </button>
              </>
            )}
            <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-full border bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <RefreshCw className="w-3.5 h-3.5" /> <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <>
          {/* KPI Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* OEE */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600">OEE</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {kpiData.oee}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-xs text-gray-500">
                A: {kpiData.availability}% | P: {kpiData.performance}% | Q:{" "}
                {kpiData.quality}%
              </div>
            </div>

            {/* Yield */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600">Yield</p>
                  <p className="text-3xl font-bold text-green-600">
                    {kpiData.yield}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-xs text-gray-500">Target: 95%</div>
            </div>

            {/* Downtime */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600">Downtime</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {kpiData.downtime} mins
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-xs text-gray-500">
                Predicted: {kpiData.predictedDowntime} mins
              </div>
            </div>

            {/* Top Issues */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <p className="text-sm text-gray-600 mb-3">Top Issues</p>
              <div className="space-y-2">
                {kpiData.topIssues.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{i.issue}</span>
                    <span className="font-medium">{i.impact} mins</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OEE Trend */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-indigo-600" /> OEE Trend
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <RechartsLine
                  data={oeeTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[70, 85]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="oee"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1" }}
                  />
                </RechartsLine>
              </ResponsiveContainer>
            </div>

            {/* Yield Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-emerald-600" /> Yield
                Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPie data={yieldBreakdown}>
                  <Pie
                    data={yieldBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {yieldBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex justify-center mt-4 space-x-4 text-xs">
                {yieldBreakdown.map((d) => (
                  <div key={d.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: d.color }}
                    ></div>
                    <span>
                      {d.name}: {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* CUSTOM REPORT BUILDER TAB */}
      {activeTab === "custom" && (
        <div className="flex h-full">
          {/* Sidebar: Available Metrics */}
          <div className="w-80 bg-white border-r p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Available Metrics</h2>
            <div className="space-y-2">
              {availableMetrics.map((m) => {
                const currentValue =
                  typeof m.value === "function" ? m.value() : m.value;
                return (
                  <div
                    key={m.id}
                    onClick={() => addMetric(m.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMetrics.includes(m.id)
                        ? "bg-indigo-50 border-indigo-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{m.name}</span>
                      <Plus className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatValue(currentValue, m.type)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main: Report Builder */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name..."
                className="text-xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-indigo-600 outline-none mb-6 w-full"
              />

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="report">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {selectedMetrics.map((id, index) => {
                        const metric = availableMetrics.find(
                          (m) => m.id === id
                        );
                        if (!metric) return null;
                        const value =
                          typeof metric.value === "function"
                            ? metric.value()
                            : metric.value;

                        return (
                          <Draggable key={id} draggableId={id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {metric.name}
                                    </p>
                                    <p className="text-2xl font-bold text-indigo-600">
                                      {formatValue(value, metric.type)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeMetric(id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Empty State */}
              {selectedMetrics.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3" />
                  <p>Drag metrics from the left to build your report</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingAnalytics;
