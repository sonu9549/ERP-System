import React, { useState } from "react";
import { useCrm } from "../../context/CRmContext";
import { format } from "date-fns";

const LeadsOpportunity = () => {
  const { customers, setCustomers, leads, setLeads, logAudit } = useCrm();

  const [activeTab, setActiveTab] = useState("leads");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    source: "Website",
    product: "ERP Software",
    budget: "",
    stage: "New",
    followUp: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    assignedTo: "You",
  });

  const [search, setSearch] = useState("");

  const sources = [
    "Website",
    "Facebook",
    "Google Ads",
    "Referral",
    "Instagram",
    "Event",
  ];
  const stages = [
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
  ];
  const products = [
    "ERP Software",
    "CRM Module",
    "GST Billing",
    "Inventory",
    "HR Payroll",
  ];

  const saveLead = () => {
    if (!form.name || !form.mobile) return alert("Name & Mobile required!");

    const newLead = {
      id: Date.now().toString(),
      ...form,
      budget: +form.budget || 0,
      createdAt: new Date().toISOString(),
      status: form.stage === "Won" ? "Converted" : "Open",
    };

    setLeads((prev) => [...prev, newLead]);
    logAudit("Lead Added", { name: form.name, stage: form.stage });
    alert("Lead Saved!");
    resetForm();
  };

  const convertToCustomer = (lead) => {
    if (!confirm(`Convert ${lead.name} to Customer?`)) return;

    const customer = {
      id: Date.now().toString(),
      code: `CUS${String(customers.length + 1).padStart(3, "0")}`,
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      gst: "",
      address: "",
      city: "",
      state: "Maharashtra",
      openingBal: 0,
      creditLimit: lead.budget,
      status: "Active",
      source: lead.source,
    };

    setCustomers((prev) => [...prev, customer]);
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: "Converted" } : l))
    );
    logAudit("Lead Converted", { name: lead.name });
    alert(`${lead.name} is now a Customer!`);
  };

  const updateStage = (id, newStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: newStage } : l))
    );
    const lead = leads.find((l) => l.id === id);
    logAudit("Stage Updated", { name: lead.name, stage: newStage });
  };

  const resetForm = () => {
    setForm({
      name: "",
      mobile: "",
      email: "",
      source: "Website",
      product: "ERP Software",
      budget: "",
      stage: "New",
      followUp: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      assignedTo: "You",
    });
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.mobile.includes(search) ||
      l.email.includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-10 p-1">
      <div className="max-w-9xl mx-auto">
        {/* HEADER */}
        <div className="bg-white  shadow-xl p-5 mb-1">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black-500">
                Leads & Opportunities
              </h1>
              <p className="text-gray-600 mt-1">Convert strangers into ₹₹₹</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-500">
                {leads.filter((l) => l.stage === "Won").length}
              </p>
              <p className="text-sm text-gray-600">Deals Won</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white shadow-lg overflow-hidden mb-4">
          <div className="flex border-b">
            {["leads", "pipeline", "won"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 font-bold capitalize ${
                  activeTab === tab
                    ? "bg-yellow-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab === "leads"
                  ? "All Leads"
                  : tab === "pipeline"
                  ? "Pipeline"
                  : "Won Deals"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border-1  mb-7"
            />

            {activeTab === "leads" && (
              <>
                {/* ADD LEAD FORM */}
                <div className=" from-indigo-50 to-gray-50 p-6 rounded-2xl border-2 border-gray-200 mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-blue-800">
                    Add New Lead
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                      placeholder="Name *"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      placeholder="Mobile *"
                      value={form.mobile}
                      onChange={(e) =>
                        setForm({ ...form, mobile: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <select
                      value={form.source}
                      onChange={(e) =>
                        setForm({ ...form, source: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    >
                      {sources.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={form.product}
                      onChange={(e) =>
                        setForm({ ...form, product: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    >
                      {products.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Budget (₹)"
                      value={form.budget}
                      onChange={(e) =>
                        setForm({ ...form, budget: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <input
                      type="date"
                      value={form.followUp}
                      onChange={(e) =>
                        setForm({ ...form, followUp: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    />
                    <textarea
                      placeholder="Notes"
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      className="p-3 border rounded-lg md:col-span-2"
                      rows="2"
                    ></textarea>
                  </div>
                  <button
                    onClick={saveLead}
                    className="mt-6 px-10 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl"
                  >
                    SAVE LEAD
                  </button>
                </div>

                {/* LEADS TABLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-xl shadow-md p-6 border-l-8 border-indigo-500 hover:shadow-xl transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold">{lead.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            lead.stage === "Won"
                              ? "bg-green-500 text-white"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {lead.stage}
                        </span>
                      </div>
                      <p className="text-gray-600">Mobile: {lead.mobile}</p>
                      <p className="text-sm text-gray-500">
                        Source: {lead.source}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ₹{lead.budget.toLocaleString()}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <select
                          value={lead.stage}
                          onChange={(e) => updateStage(lead.id, e.target.value)}
                          className="p-2 border rounded text-sm"
                        >
                          {stages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        {lead.stage === "Won" && (
                          <button
                            onClick={() => convertToCustomer(lead)}
                            className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "pipeline" && (
              <div className="space-y-6">
                {stages
                  .filter((s) => s !== "Won" && s !== "Lost")
                  .map((stage) => (
                    <div
                      key={stage}
                      className="bg-gray-50 rounded-xl p-6 border-2 border-gray-300"
                    >
                      <h3 className="text-xl font-bold text-indigo-700 mb-4">
                        {stage} (
                        {filteredLeads.filter((l) => l.stage === stage).length})
                      </h3>
                      <div className="space-y-3">
                        {filteredLeads
                          .filter((l) => l.stage === stage)
                          .map((lead) => (
                            <div
                              key={lead.id}
                              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold">{lead.name}</p>
                                <p className="text-sm text-gray-600">
                                  ₹{lead.budget.toLocaleString()} •{" "}
                                  {lead.product}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  updateStage(
                                    lead.id,
                                    stages[stages.indexOf(stage) + 1]
                                  )
                                }
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                              >
                                Next
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "won" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLeads
                  .filter((l) => l.stage === "Won")
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-300"
                    >
                      <h3 className="text-2xl font-bold text-green-700">
                        {lead.name}
                      </h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        ₹{lead.budget.toLocaleString()}
                      </p>
                      <p className="text-gray-600 mt-1">
                        Product: {lead.product}
                      </p>
                      <p className="text-sm text-gray-500 mt-3">
                        Won on {format(new Date(lead.createdAt), "dd MMM yyyy")}
                      </p>
                      {lead.status === "Converted" ? (
                        <p className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full inline-block">
                          Customer
                        </p>
                      ) : (
                        <button
                          onClick={() => convertToCustomer(lead)}
                          className="mt-4 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                        >
                          Convert to Customer
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsOpportunity;
