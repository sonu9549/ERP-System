// src/components/CostValuation.jsx  (PRODUCTION READY + STATUS UPDATE)

import { useProduction } from "../../context/ProductionContext";
import {
  DollarSign,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Package,
  Edit3,
  Save,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  History,
} from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";

const CostValuation = () => {
  const {
    workOrders = [],
    consumptionRecords = [],
    wasteRecords = [],
    setWorkOrders,
  } = useProduction();

  const [selectedWO, setSelectedWO] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [comment, setComment] = useState("");

  const valuation = useMemo(() => {
    return workOrders.map((wo) => {
      // Material Cost (₹850 avg per unit)
      const matCost = consumptionRecords
        .filter((c) => c.wo === wo.id)
        .reduce((sum, c) => sum + c.actual * 850, 0);

      // Waste Cost
      const wasteCost = wasteRecords
        .filter((w) => w.wo === wo.id)
        .reduce((sum, w) => sum + w.cost, 0);

      // Labor + Overhead
      const laborHrs = wo.actualHrs || wo.plannedHrs || 10;
      const laborCost = laborHrs * 800;
      const overhead = laborHrs * 500;

      const totalCost = matCost + wasteCost + laborCost + overhead;
      const sellingPrice = wo.qty * (wo.sellingPrice || 52000);
      const profit = sellingPrice - totalCost;
      const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      // Auto status if not manually set
      const currentStatus =
        wo.costStatus ||
        (margin > 20
          ? "High Margin"
          : margin > 10
          ? "Good Margin"
          : margin > 0
          ? "Low Margin"
          : margin > -10
          ? "Minor Loss"
          : "Critical Loss");

      return {
        wo: wo.id,
        item: wo.item,
        qty: wo.qty,
        totalCost,
        sellingPrice,
        profit,
        margin,
        status: currentStatus,
        rawStatus: wo.costStatus || null,
        comments: wo.costComments || [],
        lastUpdated: wo.costUpdatedAt || null,
      };
    });
  }, [workOrders, consumptionRecords, wasteRecords]);

  const totalProfit = valuation.reduce((s, v) => s + v.profit, 0);
  const avgMargin =
    valuation.length > 0
      ? valuation.reduce((s, v) => s + v.margin, 0) / valuation.length
      : 0;

  const saveStatus = () => {
    if (!selectedWO || !newStatus) return;

    const updatedOrders = workOrders.map((wo) =>
      wo.id === selectedWO.wo
        ? {
            ...wo,
            costStatus: newStatus,
            costComments: [
              ...(wo.costComments || []),
              {
                status: newStatus,
                comment: comment || "No comment",
                by: "Manager", // later from login
                at: new Date().toISOString(),
              },
            ],
            costUpdatedAt: new Date().toISOString(),
          }
        : wo
    );

    setWorkOrders(updatedOrders);
    setSelectedWO(null);
    setNewStatus("");
    setComment("");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <IndianRupee className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Cost Valuation & Profitability
              </h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-600">
              ₹{totalProfit.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Profit (Live)</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-600">Avg Margin</p>
          <p className="text-2xl font-bold text-emerald-600">
            {avgMargin.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-600">Critical Loss</p>
          <p className="text-2xl font-bold text-red-600">
            {valuation.filter((v) => v.status === "Critical Loss").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-600">Under Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {
              valuation.filter((v) => v.rawStatus === "Under Investigation")
                .length
            }
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-600">Corrected</p>
          <p className="text-2xl font-bold text-green-600">
            {valuation.filter((v) => v.rawStatus === "Corrected").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-600">Approved Loss</p>
          <p className="text-2xl font-bold text-orange-600">
            {valuation.filter((v) => v.rawStatus === "Approved Loss").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6 overflow-auto">
        <div className="bg-white rounded-xl shadow border">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">WO</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-center">Margin</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {valuation.map((v) => (
                <tr
                  key={v.wo}
                  className={`hover:bg-gray-50 ${
                    v.margin < -10
                      ? "bg-red-50"
                      : v.margin < 0
                      ? "bg-yellow-25"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{v.wo}</td>
                  <td className="px-4 py-3">{v.item}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{v.totalCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₹{v.sellingPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span
                      className={
                        v.profit > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      ₹{Math.abs(v.profit).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">
                    <span
                      className={
                        v.margin > 20
                          ? "text-emerald-600"
                          : v.margin > 10
                          ? "text-green-600"
                          : v.margin > 0
                          ? "text-yellow-600"
                          : v.margin > -10
                          ? "text-orange-600"
                          : "text-red-600"
                      }
                    >
                      {v.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        v.status.includes("Critical")
                          ? "bg-red-100 text-red-800"
                          : v.status.includes("Loss")
                          ? "bg-orange-100 text-orange-800"
                          : v.status.includes("Low")
                          ? "bg-yellow-100 text-yellow-800"
                          : v.status.includes("Good")
                          ? "bg-green-100 text-green-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {v.status === "Critical Loss" && (
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                      )}
                      {v.status === "Under Investigation" && (
                        <Clock className="w-3 h-3 inline mr-1" />
                      )}
                      {v.status === "Corrected" && (
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                      )}
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedWO(v)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedWO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Update Status: {selectedWO.wo}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Profit:</strong> ₹{selectedWO.profit.toLocaleString()}
                </div>
                <div>
                  <strong>Margin:</strong> {selectedWO.margin.toFixed(1)}%
                </div>
              </div>

              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-lg"
              >
                <option value="">Choose Action</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Corrected">Corrected (Fixed)</option>
                <option value="Approved Loss">Approved Loss</option>
                <option value="Escalated">Escalated to MD</option>
              </select>

              <textarea
                placeholder="Comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg h-24"
              />

              {/* History */}
              {selectedWO.comments.length > 0 && (
                <div className="border-t pt-4">
                  <p className="font-medium flex items-center">
                    <History className="w-4 h-4 mr-1" /> History
                  </p>
                  {selectedWO.comments
                    .slice(-3)
                    .reverse()
                    .map((c, i) => (
                      <div key={i} className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">{c.status}</span> -{" "}
                        {c.comment}
                        <span className="text-gray-400">
                          {" "}
                          by {c.by} @ {format(new Date(c.at), "dd MMM hh:mm a")}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedWO(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 inline mr-1" /> Cancel
              </button>
              <button
                onClick={saveStatus}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
              >
                <Save className="w-4 h-4 inline mr-1" /> Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostValuation;
