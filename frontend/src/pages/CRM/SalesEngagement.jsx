// src/components/SalesEngagement.jsx
import React, { useState } from "react";
import { useCrm } from "../../context/CRmContext";
import { format, isToday, isPast } from "date-fns";

const SalesEngagement = () => {
  const { leads = [], customers = [], setLeads, logAudit } = useCrm();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedLead, setSelectedLead] = useState(null);
  const [nextDate, setNextDate] = useState("");
  const [callNote, setCallNote] = useState("");
  const [search, setSearch] = useState("");

  const today = new Date();

  // TODAY'S SUMMARY
  const todayLeads = leads.filter((l) => isToday(new Date(l.createdAt))).length;
  const todayCalls = leads.filter((l) =>
    l.notes?.some((n) => n.type === "call" && isToday(new Date(n.date)))
  ).length;
  const todayWon = leads.filter(
    (l) => l.stage === "Won" && isToday(new Date(l.createdAt))
  ).length;
  const todayRevenue = leads
    .filter((l) => l.stage === "Won" && isToday(new Date(l.createdAt)))
    .reduce((s, l) => s + (l.budget || 0), 0);

  // FOLLOW-UPS
  const allFollowUps = [
    ...leads.map((l) => ({ ...l, type: "lead" })),
    ...customers.map((c) => ({
      ...c,
      type: "customer",
      followUp: c.nextFollowUp || format(new Date(), "yyyy-MM-dd"),
    })),
  ].filter((f) => f.followUp);

  const todayTasks = allFollowUps.filter((f) => isToday(new Date(f.followUp)));
  const upcoming = allFollowUps.filter((f) => new Date(f.followUp) > today);
  const missed = allFollowUps.filter(
    (f) => isPast(new Date(f.followUp)) && f.stage !== "Won"
  );

  const scheduleFollowUp = () => {
    if (!selectedLead || !nextDate) return alert("Date chuno!");
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id ? { ...l, followUp: nextDate } : l
      )
    );
    logAudit("Follow-up Set", { name: selectedLead.name });
    alert("Done!");
    setNextDate("");
    setSelectedLead(null);
  };

  const logCall = () => {
    if (!selectedLead || !callNote) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id
          ? {
              ...l,
              notes: [
                ...(l.notes || []),
                {
                  text: callNote,
                  type: "call",
                  date: new Date().toISOString(),
                },
              ],
            }
          : l
      )
    );
    logAudit("Call Logged", { name: selectedLead.name });
    alert("Call Saved!");
    setCallNote("");
    setSelectedLead(null);
  };

  const sendWhatsApp = (mobile) => {
    window.open(`https://wa.me/91${mobile}?text=Hi! Let's connect!`, "_blank");
  };

  const tabs = ["dashboard", "today", "upcoming", "missed", "all"];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold text-blue-700">SALES ENGAGEMENT</h1>
          <p className="text-xl text-gray-600 mt-2">
            Daily Target + Follow-ups
          </p>
          <p className="text-lg text-blue-600">
            {format(today, "dd MMM yyyy")}
          </p>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-xl mb-6">
          <div className="flex flex-wrap border-b">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-bold text-lg capitalize ${
                  activeTab === tab ? "bg-blue-600 text-white" : "text-gray-700"
                } border-b-4 ${
                  activeTab === tab ? "border-blue-600" : "border-transparent"
                }`}
              >
                {tab === "dashboard"
                  ? "Target"
                  : tab === "today"
                  ? `Today (${todayTasks.length})`
                  : tab === "missed"
                  ? `Missed (${missed.length})`
                  : tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    label: "Leads",
                    value: todayLeads,
                    target: 10,
                    color: "bg-blue-100",
                  },
                  {
                    label: "Calls",
                    value: todayCalls,
                    target: 25,
                    color: "bg-green-100",
                  },
                  {
                    label: "Won",
                    value: todayWon,
                    target: 3,
                    color: "bg-purple-100",
                  },
                  {
                    label: "Revenue",
                    value: `₹${todayRevenue.toLocaleString()}`,
                    target: "₹50,000",
                    color: "bg-yellow-100",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`${item.color} rounded-2xl p-6 text-center shadow`}
                  >
                    <p className="text-4xl font-bold">{item.value}</p>
                    <p className="text-lg font-semibold mt-2">{item.label}</p>
                    <p className="text-sm text-gray-600">
                      Target: {item.target}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* OTHER TABS */}
            {activeTab !== "dashboard" && (
              <>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl mb-6"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeTab === "today"
                    ? todayTasks
                    : activeTab === "upcoming"
                    ? upcoming
                    : activeTab === "missed"
                    ? missed
                    : allFollowUps
                  )
                    .filter(
                      (f) =>
                        f.name?.toLowerCase().includes(search.toLowerCase()) ||
                        f.mobile?.includes(search)
                    )
                    .map((item, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedLead(item)}
                        className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
                          activeTab === "missed"
                            ? "border-red-400"
                            : "border-gray-200"
                        } hover:shadow-xl cursor-pointer`}
                      >
                        <div className="flex justify-between">
                          <h3 className="text-xl font-bold">{item.name}</h3>
                          {activeTab === "missed" && (
                            <span className="text-red-600 font-bold">
                              MISSED
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          ₹{item.budget?.toLocaleString() || 0}
                        </p>
                        <p className="text-gray-600">{item.mobile}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {format(new Date(item.followUp), "dd MMM")}
                        </p>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWhatsApp(item.mobile);
                            }}
                            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-sm"
                          >
                            WhatsApp
                          </button>
                          <button className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold text-sm">
                            Call
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* MODAL */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-3xl max-w-md w-full p-8">
              <h2 className="text-3xl font-bold text-center mb-6">
                {selectedLead.name}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block font-bold mb-2">Next Follow-up</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full p-4 border-2 border-blue-400 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Call Note</label>
                  <input
                    placeholder="Kya baat hui?"
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    className="w-full p-4 border-2 border-blue-400 rounded-xl"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={scheduleFollowUp}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={logCall}
                    className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold"
                  >
                    Log Call
                  </button>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="w-full bg-gray-500 text-white py-4 rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesEngagement;
