import React, { useState, useEffect, useMemo } from "react";
import { useCrm } from "../../context/CRmContext";
import { format } from "date-fns";

/* -------------------------------------------------------------------------- */
/*                          LOYALTY + CRM + FINANCE HUB                        */
/* -------------------------------------------------------------------------- */
export default function LoyaltyProgram() {
  const {
    // === DATA FROM CONTEXT ===
    loyaltyPrograms,
    setLoyaltyPrograms,
    loyaltyRules,
    setLoyaltyRules,
    loyaltyLedger,
    setLoyaltyLedger,
    loyaltyTransactions,
    setLoyaltyTransactions,
    loyaltyRedemptions,
    setLoyaltyRedemptions,
    customers,
    sales,
    leads,
    supportTickets,
    setLeads,
    setTickets,
    setSales,

    // === ACTIONS ===
    recordSale,
    convertLead,
    closeSupportTicket,
    redeemPoints,
    postToGL,
    formatCurrency,
    getAccount,
    logAudit,

    // === QUICK ACCOUNTS ===
    cash,
    salesAccount,
  } = useCrm();

  /* --------------------------- LOCAL UI STATE --------------------------- */
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, sales, leads, support
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Form States
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });
  const [ruleForm, setRuleForm] = useState({
    trigger_type: "SALE",
    condition_json: { min_amount: 0 },
    points_awarded: 0,
  });
  const [saleForm, setSaleForm] = useState({
    customer_id: "",
    amount: 0,
    items: [],
  });
  const [leadForm, setLeadForm] = useState({
    customer_id: "",
    source: "",
    status: "NEW",
  });
  const [ticketForm, setTicketForm] = useState({
    customer_id: "",
    issue: "",
    status: "OPEN",
  });

  /* --------------------------- DERIVED DATA --------------------------- */
  const activePrograms = useMemo(
    () => loyaltyPrograms.filter((p) => p.is_active).length,
    [loyaltyPrograms]
  );
  const totalPointsIssued = useMemo(
    () => loyaltyLedger.reduce((sum, l) => sum + l.points, 0),
    [loyaltyLedger]
  );

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.email})`,
  }));

  /* --------------------------- LOAD ON MOUNT --------------------------- */
  useEffect(() => {
    // Auto-select first program if exists
    if (loyaltyPrograms.length > 0 && !selectedProgram) {
      setSelectedProgram(loyaltyPrograms[0]);
    }
  }, [loyaltyPrograms, selectedProgram]);

  /* ------------------------------------------------------------------ */
  /*                         PROGRAM CRUD FUNCTIONS                      */
  /* ------------------------------------------------------------------ */
  const openProgramModal = (prog = null) => {
    if (prog) {
      setProgramForm({
        ...prog,
        start_date: prog.start_date?.split("T")[0] || "",
        end_date: prog.end_date?.split("T")[0] || "",
      });
      setSelectedProgram(prog);
    } else {
      setProgramForm({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        is_active: true,
      });
    }
    setShowProgramModal(true);
  };

  const saveProgram = () => {
    const newProg = selectedProgram
      ? { ...selectedProgram, ...programForm }
      : { id: `prog-${Date.now()}`, ...programForm };

    setLoyaltyPrograms((prev) =>
      selectedProgram
        ? prev.map((p) => (p.id === selectedProgram.id ? newProg : p))
        : [...prev, newProg]
    );
    setShowProgramModal(false);
    logAudit(
      "Loyalty Program",
      selectedProgram ? "Updated" : "Created",
      newProg.name
    );
  };

  const deleteProgram = (id) => {
    if (!window.confirm("Delete program?")) return;
    setLoyaltyPrograms((prev) => prev.filter((p) => p.id !== id));
    logAudit("Loyalty Program", "Deleted", `ID: ${id}`);
  };

  /* ------------------------------------------------------------------ */
  /*                            RULES ENGINE                            */
  /* ------------------------------------------------------------------ */
  const openRuleModal = () => {
    setRuleForm({
      trigger_type: "SALE",
      condition_json: { min_amount: 0 },
      points_awarded: 0,
    });
    setShowRuleModal(true);
  };

  const saveRule = () => {
    if (!selectedProgram) return alert("Select a program first");
    const newRule = {
      id: `rule-${Date.now()}`,
      program_id: selectedProgram.id,
      ...ruleForm,
    };
    setLoyaltyRules((prev) => [...prev, newRule]);
    setShowRuleModal(false);
    logAudit(
      "Loyalty Rule",
      "Added",
      `${ruleForm.trigger_type} → ${ruleForm.points_awarded} pts`
    );
  };

  const getRulesForProgram = (pid) =>
    loyaltyRules.filter((r) => r.program_id === pid);

  /* ------------------------------------------------------------------ */
  /*                           REDEMPTION HANDLER                        */
  /* ------------------------------------------------------------------ */
  const handleRedeem = (redemption) => {
    if (!selectedCustomer) return alert("Select a customer");
    if (
      window.confirm(
        `Redeem ${redemption.title} for ${redemption.points_cost} points?`
      )
    ) {
      const success = redeemPoints(selectedCustomer.id, redemption.id);
      if (success) alert("Redeemed!");
    }
  };

  const getRedemptionsForProgram = (pid) =>
    loyaltyRedemptions.filter((r) => r.program_id === pid);

  /* ------------------------------------------------------------------ */
  /*                           SALES FORM                               */
  /* ------------------------------------------------------------------ */
  const openSaleModal = () => {
    setSaleForm({ customer_id: "", amount: 0, items: [] });
    setShowSaleModal(true);
  };

  const saveSale = () => {
    if (!saleForm.customer_id || saleForm.amount <= 0)
      return alert("Fill all fields");
    recordSale({
      customer_id: saleForm.customer_id,
      amount: saleForm.amount,
      items: saleForm.items,
    });
    setShowSaleModal(false);
  };

  /* ------------------------------------------------------------------ */
  /*                           LEAD CONVERSION                           */
  /* ------------------------------------------------------------------ */
  const openLeadModal = () => {
    setLeadForm({ customer_id: "", source: "", status: "NEW" });
    setShowLeadModal(true);
  };

  const saveLead = () => {
    const leadId = `lead-${Date.now()}`;
    setLeads((prev) => [...prev, { id: leadId, ...leadForm }]);
    if (leadForm.status === "CONVERTED") {
      convertLead(leadId, leadForm.customer_id);
    }
    setShowLeadModal(false);
  };

  /* ------------------------------------------------------------------ */
  /*                         SUPPORT TICKET CLOSURE                      */
  /* ------------------------------------------------------------------ */
  const openTicketModal = () => {
    setTicketForm({ customer_id: "", issue: "", status: "OPEN" });
    setShowTicketModal(true);
  };

  const saveTicket = () => {
    const ticketId = `ticket-${Date.now()}`;
    setTickets((prev) => [...prev, { id: ticketId, ...ticketForm }]);
    if (ticketForm.status === "CLOSED") {
      closeSupportTicket(ticketId, ticketForm.customer_id);
    }
    setShowTicketModal(false);
  };

  /* ------------------------------------------------------------------ */
  /*                              RENDER UI                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
      {/* ====================== TABS ====================== */}
      <div className="flex space-x-1 border-b">
        {["dashboard", "sales", "leads", "support"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ====================== DASHBOARD TAB ====================== */}
      {activeTab === "dashboard" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Active Programs</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {activePrograms}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Total Customers</h3>
              <p className="text-3xl font-bold text-green-600">
                {customers.length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Total Points</h3>
              <p className="text-3xl font-bold text-purple-600">
                {totalPointsIssued}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Total Sales</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(sales.reduce((s, v) => s + v.amount, 0))}
              </p>
            </div>
          </div>

          {/* Programs List */}
          <section className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Loyalty Programs</h2>
              <button
                onClick={() => openProgramModal()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                + New Program
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Start
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loyaltyPrograms.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          p.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.start_date
                        ? format(new Date(p.start_date), "dd MMM yyyy")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProgram(p);
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => openProgramModal(p)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProgram(p.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Program Detail: Rules + Redemptions */}
          {selectedProgram && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rules */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Earning Rules</h3>
                  <button
                    onClick={openRuleModal}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Add Rule
                  </button>
                </div>
                <div className="space-y-2">
                  {getRulesForProgram(selectedProgram.id).length === 0 ? (
                    <p className="text-gray-500">No rules</p>
                  ) : (
                    getRulesForProgram(selectedProgram.id).map((r) => (
                      <div
                        key={r.id}
                        className="p-3 border rounded bg-gray-50 flex justify-between"
                      >
                        <span>
                          <strong>{r.trigger_type}</strong>
                          {r.condition_json.min_amount > 0 &&
                            ` (min ₹${r.condition_json.min_amount})`}
                          <span className="ml-2 text-indigo-600 font-semibold">
                            → {r.points_awarded} pts
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Redemptions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Redemption Catalog</h3>
                <div className="space-y-3">
                  {getRedemptionsForProgram(selectedProgram.id).length === 0 ? (
                    <p className="text-gray-500">No items</p>
                  ) : (
                    getRedemptionsForProgram(selectedProgram.id).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border rounded bg-blue-50 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-600">
                            {item.points_cost} points
                          </p>
                        </div>
                        <button
                          onClick={() => handleRedeem(item)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          Redeem
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Points */}
          <section className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Customer:</label>
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  setSelectedCustomer(cust);
                }}
                className="border rounded px-3 py-1"
              >
                <option value="">-- Select --</option>
                {customerOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Points
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ref
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loyaltyTransactions
                    .filter(
                      (t) =>
                        loyaltyLedger.find((l) => l.id === t.ledger_id)
                          ?.customer_id === selectedCustomer.id
                    )
                    .map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(t.created_at), "dd MMM HH:mm")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              t.type === "EARN"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.points > 0 ? `+${t.points}` : t.points}
                        </td>
                        <td className="px-4 py-3 text-sm">{t.reference_id}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {/* ====================== SALES TAB ====================== */}
      {activeTab === "sales" && (
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Record Sale</h2>
            <button
              onClick={openSaleModal}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + New Sale
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    {format(new Date(s.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    {customers.find((c) => c.id === s.customer_id)?.name}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ====================== LEADS TAB ====================== */}
      {activeTab === "leads" && (
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Leads</h2>
            <button
              onClick={openLeadModal}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New Lead
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3">
                    {customers.find((c) => c.id === l.customer_id)?.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        l.status === "CONVERTED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ====================== SUPPORT TAB ====================== */}
      {activeTab === "support" && (
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Support Tickets</h2>
            <button
              onClick={openTicketModal}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              + New Ticket
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Issue
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {supportTickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">{t.issue}</td>
                  <td className="px-4 py-3">
                    {customers.find((c) => c.id === t.customer_id)?.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        t.status === "CLOSED"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ====================== MODALS ====================== */}
      {/* Program Modal */}
      {showProgramModal && (
        <Modal
          title={selectedProgram ? "Edit Program" : "New Program"}
          onClose={() => setShowProgramModal(false)}
        >
          <input
            placeholder="Name"
            value={programForm.name}
            onChange={(e) =>
              setProgramForm({ ...programForm, name: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            rows={3}
            value={programForm.description}
            onChange={(e) =>
              setProgramForm({ ...programForm, description: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <input
            type="date"
            value={programForm.start_date}
            onChange={(e) =>
              setProgramForm({ ...programForm, start_date: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <input
            type="date"
            value={programForm.end_date}
            onChange={(e) =>
              setProgramForm({ ...programForm, end_date: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={programForm.is_active}
              onChange={(e) =>
                setProgramForm({ ...programForm, is_active: e.target.checked })
              }
            />
            Active
          </label>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowProgramModal(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={saveProgram}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <Modal title="Add Rule" onClose={() => setShowRuleModal(false)}>
          <select
            value={ruleForm.trigger_type}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, trigger_type: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="SALE">Sale</option>
            <option value="LEAD_CONVERTED">Lead Converted</option>
            <option value="TICKET_CLOSED">Ticket Closed</option>
          </select>
          {ruleForm.trigger_type === "SALE" && (
            <input
              type="number"
              placeholder="Min Amount"
              value={ruleForm.condition_json.min_amount}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  condition_json: { min_amount: +e.target.value },
                })
              }
              className="w-full mb-3 p-2 border rounded"
            />
          )}
          <input
            type="number"
            placeholder="Points"
            value={ruleForm.points_awarded}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, points_awarded: +e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowRuleModal(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={saveRule}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <Modal title="New Sale" onClose={() => setShowSaleModal(false)}>
          <select
            value={saleForm.customer_id}
            onChange={(e) =>
              setSaleForm({ ...saleForm, customer_id: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="">Select Customer</option>
            {customerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={saleForm.amount}
            onChange={(e) =>
              setSaleForm({ ...saleForm, amount: +e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowSaleModal(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={saveSale}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Record Sale
            </button>
          </div>
        </Modal>
      )}

      {/* Lead Modal */}
      {showLeadModal && (
        <Modal title="New Lead" onClose={() => setShowLeadModal(false)}>
          <select
            value={leadForm.customer_id}
            onChange={(e) =>
              setLeadForm({ ...leadForm, customer_id: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="">Select Customer</option>
            {customerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Source (e.g. Website)"
            value={leadForm.source}
            onChange={(e) =>
              setLeadForm({ ...leadForm, source: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <select
            value={leadForm.status}
            onChange={(e) =>
              setLeadForm({ ...leadForm, status: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="NEW">New</option>
            <option value="CONVERTED">Converted</option>
          </select>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowLeadModal(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={saveLead}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save Lead
            </button>
          </div>
        </Modal>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <Modal
          title="New Support Ticket"
          onClose={() => setShowTicketModal(false)}
        >
          <select
            value={ticketForm.customer_id}
            onChange={(e) =>
              setTicketForm({ ...ticketForm, customer_id: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="">Select Customer</option>
            {customerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Issue Description"
            rows={3}
            value={ticketForm.issue}
            onChange={(e) =>
              setTicketForm({ ...ticketForm, issue: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          />
          <select
            value={ticketForm.status}
            onChange={(e) =>
              setTicketForm({ ...ticketForm, status: e.target.value })
            }
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowTicketModal(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={saveTicket}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Save Ticket
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                              REUSABLE MODAL                         */
/* ------------------------------------------------------------------ */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
