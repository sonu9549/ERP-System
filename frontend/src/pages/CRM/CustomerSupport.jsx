// src/components/CustomerSupport.jsx
import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import { format } from "date-fns";

const CustomerSupport = () => {
  const { customers, tickets = [], setTickets, logAudit } = useFinance();

  const [activeTab, setActiveTab] = useState("tickets");
  const [newTicket, setNewTicket] = useState({
    customerId: "",
    subject: "",
    issue: "",
    priority: "Medium",
    type: "Billing",
  });
  const [reply, setReply] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState("");

  const priorities = ["Low", "Medium", "High", "Urgent"];
  const types = ["Billing", "Technical", "Delivery", "Refund", "Other"];
  const statuses = ["Open", "In Progress", "Resolved", "Closed"];

  const createTicket = () => {
    if (!newTicket.customerId || !newTicket.subject)
      return alert("Customer & Subject required!");

    const ticket = {
      id: Date.now().toString(),
      ...newTicket,
      ticketNo: `TKT-${String(tickets.length + 1).padStart(4, "0")}`,
      status: "Open",
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setTickets((prev) => [...prev, ticket]);
    logAudit("Ticket Created", {
      ticketNo: ticket.ticketNo,
      customer: getCustomerName(ticket.customerId),
    });
    alert(`Ticket ${ticket.ticketNo} Created!`);
    setNewTicket({ ...newTicket, subject: "", issue: "" });
  };

  const addReply = () => {
    if (!reply.trim()) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              replies: [
                ...t.replies,
                { text: reply, by: "You", time: new Date().toISOString() },
              ],
              status: "In Progress",
            }
          : t
      )
    );
    setReply("");
  };

  const updateStatus = (id, status) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    logAudit("Ticket Updated", {
      ticketNo: tickets.find((t) => t.id === id)?.ticketNo,
      status,
    });
  };

  const getCustomerName = (id) =>
    customers.find((c) => c.id === id)?.name || "Unknown";

  const filteredTickets = (tickets || []).filter(
    (t) =>
      t.ticketNo.includes(search) ||
      getCustomerName(t.customerId)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-teal-700">
                Customer Support
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Happy Customers = More Business
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600">
                {tickets.filter((t) => t.status === "Resolved").length}
              </p>
              <p className="text-lg text-gray-600">Resolved Today</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b">
            {["tickets", "new", "knowledge"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-10 py-5 font-bold text-lg ${
                  activeTab === tab
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700"
                } hover:bg-teal-500 hover:text-white transition`}
              >
                {tab === "tickets"
                  ? "All Tickets"
                  : tab === "new"
                  ? "Create Ticket"
                  : "Help Center"}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* ALL TICKETS */}
            {activeTab === "tickets" && (
              <div>
                <input
                  type="text"
                  placeholder="Search by Ticket No, Customer, Subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-4 border-2 border-teal-300 rounded-xl text-lg mb-6"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-gradient-to-br from-white to-teal-50 p-6 rounded-2xl shadow-lg hover:shadow-2xl cursor-pointer border-2 border-teal-200 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-2xl font-bold text-teal-700">
                          {ticket.ticketNo}
                        </span>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold ${
                            ticket.priority === "Urgent"
                              ? "bg-red-500 text-white"
                              : ticket.priority === "High"
                              ? "bg-orange-500 text-white"
                              : "bg-yellow-500 text-black"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        by {getCustomerName(ticket.customerId)}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ticket.status === "Open"
                              ? "bg-blue-500 text-white"
                              : ticket.status === "Resolved"
                              ? "bg-green-500 text-white"
                              : "bg-purple-500 text-white"
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <p className="text-xs text-gray-500">
                          {format(new Date(ticket.createdAt), "dd MMM HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CREATE TICKET */}
            {activeTab === "new" && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-teal-700 mb-8 text-center">
                  Raise a New Ticket
                </h2>
                <div className="bg-teal-50 p-8 rounded-3xl border-2 border-teal-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <select
                      value={newTicket.customerId}
                      onChange={(e) =>
                        setNewTicket({
                          ...newTicket,
                          customerId: e.target.value,
                        })
                      }
                      className="p-4 border-2 border-teal-400 rounded-xl text-lg"
                    >
                      <option value="">Select Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.mobile})
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Subject *"
                      value={newTicket.subject}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, subject: e.target.value })
                      }
                      className="p-4 border-2 border-teal-400 rounded-xl text-lg"
                    />
                    <select
                      value={newTicket.priority}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, priority: e.target.value })
                      }
                      className="p-4 border-2 border-teal-400 rounded-xl text-lg"
                    >
                      {priorities.map((p) => (
                        <option key={p}>{p} Priority</option>
                      ))}
                    </select>
                    <select
                      value={newTicket.type}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, type: e.target.value })
                      }
                      className="p-4 border-2 border-teal-400 rounded-xl text-lg"
                    >
                      {types.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Describe your issue..."
                    value={newTicket.issue}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, issue: e.target.value })
                    }
                    rows="6"
                    className="w-full p-4 border-2 border-teal-400 rounded-xl text-lg mt-6"
                  />
                  <button
                    onClick={createTicket}
                    className="mt-8 w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-5 rounded-2xl text-2xl font-bold hover:shadow-2xl transition"
                  >
                    CREATE TICKET
                  </button>
                </div>
              </div>
            )}

            {/* TICKET DETAIL */}
            {selectedTicket && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-3xl max-w-4xl w-full max-h-screen overflow-y-auto">
                  <div className="bg-teal-600 text-white p-6 rounded-t-3xl">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-bold">
                        {selectedTicket.ticketNo}
                      </h2>
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="text-4xl"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xl mt-2">{selectedTicket.subject}</p>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="text-xl font-bold">
                          {getCustomerName(selectedTicket.customerId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) =>
                            updateStatus(selectedTicket.id, e.target.value)
                          }
                          className="p-3 border-2 border-teal-400 rounded-xl text-lg font-bold"
                        >
                          {statuses.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl mb-6">
                      <p className="text-gray-700">{selectedTicket.issue}</p>
                    </div>
                    <div className="space-y-4">
                      {selectedTicket.replies.map((r, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-2xl ${
                            r.by === "You"
                              ? "bg-teal-100 ml-12"
                              : "bg-gray-100 mr-12"
                          }`}
                        >
                          <p className="font-bold">{r.by}</p>
                          <p>{r.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(r.time), "dd MMM HH:mm")}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex gap-4">
                      <input
                        type="text"
                        placeholder="Type your reply..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addReply()}
                        className="flex-1 p-4 border-2 border-teal-400 rounded-xl text-lg"
                      />
                      <button
                        onClick={addReply}
                        className="px-8 py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KNOWLEDGE BASE */}
            {activeTab === "knowledge" && (
              <div className="text-center py-20">
                <h2 className="text-4xl font-bold text-teal-700 mb-8">
                  Help Center
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {[
                    "How to raise invoice?",
                    "GST Return Filing",
                    "Software Update",
                    "Payment Issues",
                    "Backup Guide",
                    "User Manual",
                  ].map((q, i) => (
                    <div
                      key={i}
                      className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition border-2 border-teal-200"
                    >
                      <div className="text-6xl mb-4">
                        {i < 3 ? "Question" : "Document"}
                      </div>
                      <h3 className="text-xl font-bold text-teal-700">{q}</h3>
                      <button className="mt-4 text-teal-600 font-bold hover:underline">
                        Read More
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
