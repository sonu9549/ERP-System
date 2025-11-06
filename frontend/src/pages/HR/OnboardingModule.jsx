// src/modules/hr/OnboardingModule.jsx
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Papa from "papaparse";
import { useFinance } from "../../context/FinanceContext";

const OnboardingModule = () => {
  const {
    postToGL,
    formatCurrency,
    logAudit: financeLogAudit,
    employees = [],
    branches = ["HQ", "Unit A", "Unit B"],
  } = useFinance();

  // === STATE ===
  const load = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  };

  const [activeSubTab, setActiveSubTab] = useState("onboarding"); // onboarding | requisitions
  const [onboarding, setOnboarding] = useState(() => load("hr_onboarding", []));
  const [requisitions, setRequisitions] = useState(() =>
    load("hr_requisitions", [])
  );
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);

  // Forms
  const [onboardForm, setOnboardForm] = useState({
    empId: "",
    offerLetter: null,
    idProof: null,
    photo: null,
    notes: "",
  });
  const [reqForm, setReqForm] = useState({
    title: "",
    department: "",
    branch: branches[0],
    type: "Full-time",
    openings: 1,
    salaryMin: 0,
    salaryMax: 0,
    description: "",
    status: "Open",
  });

  // === AUTO-SAVE ===
  useEffect(() => {
    localStorage.setItem("hr_onboarding", JSON.stringify(onboarding));
    localStorage.setItem("hr_requisitions", JSON.stringify(requisitions));
  }, [onboarding, requisitions]);

  // === AUDIT LOG ===
  const logHR = (action, details = {}) => {
    financeLogAudit?.("HR", action, details);
  };

  // === ONBOARDING ===
  const checklistTemplate = [
    { id: "hr", label: "HR Induction", assignedTo: "HR", status: "pending" },
    { id: "it", label: "Laptop & Email", assignedTo: "IT", status: "pending" },
    {
      id: "admin",
      label: "ID & Access",
      assignedTo: "Admin",
      status: "pending",
    },
    {
      id: "mgr",
      label: "Manager Meet",
      assignedTo: "Manager",
      status: "pending",
    },
  ];

  const startOnboarding = () => {
    const emp = employees.find((e) => e.id === +onboardForm.empId);
    if (!emp) return alert("Select employee");

    const cost = 5000;
    const newProcess = {
      id: Date.now(),
      empId: emp.id,
      empName: emp.name,
      startDate: new Date().toISOString().split("T")[0],
      status: "In Progress",
      checklist: checklistTemplate,
      documents: {
        offerLetter: onboardForm.offerLetter?.name || "",
        idProof: onboardForm.idProof?.name || "",
        photo: onboardForm.photo?.name || "",
      },
      notes: onboardForm.notes,
      cost,
    };

    setOnboarding((prev) => [...prev, newProcess]);
    logHR("Onboarding Started", { empId: emp.id });

    postToGL(
      "Onboarding Expense",
      "Cash",
      cost,
      `Onboarding - ${emp.name}`,
      `ONB-${newProcess.id}`
    );
    setShowOnboardModal(false);
    setOnboardForm({
      empId: "",
      offerLetter: null,
      idProof: null,
      photo: null,
      notes: "",
    });
  };

  const updateTask = (pid, tid, status) => {
    setOnboarding((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              checklist: p.checklist.map((t) =>
                t.id === tid ? { ...t, status } : t
              ),
            }
          : p
      )
    );
    logHR(`Task ${status}`, { pid, tid });
  };

  const completeOnboarding = (id) => {
    setOnboarding((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "Completed",
              endDate: new Date().toISOString().split("T")[0],
            }
          : p
      )
    );
    logHR("Onboarding Completed", { id });
  };

  // === REQUISITIONS ===
  const createRequisition = () => {
    const newReq = {
      id: Date.now(),
      ...reqForm,
      openings: +reqForm.openings,
      salaryMin: +reqForm.salaryMin,
      salaryMax: +reqForm.salaryMax,
      postedOn: new Date().toISOString().split("T")[0],
      candidates: [],
    };
    setRequisitions((prev) => [...prev, newReq]);
    logHR("Requisition Created", { id: newReq.id, title: newReq.title });
    setShowReqModal(false);
    setReqForm({
      ...reqForm,
      title: "",
      description: "",
      salaryMin: 0,
      salaryMax: 0,
    });
  };

  const addCandidate = (reqId) => {
    const name = prompt("Candidate Name:");
    const email = prompt("Email:");
    const resume = prompt("Resume URL (optional):");
    if (!name || !email) return;

    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              candidates: [
                ...r.candidates,
                {
                  id: Date.now(),
                  name,
                  email,
                  resume,
                  status: "Applied",
                  appliedOn: new Date().toISOString().split("T")[0],
                },
              ],
            }
          : r
      )
    );
    logHR("Candidate Added", { reqId, name });
  };

  const updateCandidateStatus = (reqId, candId, status) => {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              candidates: r.candidates.map((c) =>
                c.id === candId ? { ...c, status } : c
              ),
            }
          : r
      )
    );
    logHR(`Candidate ${status}`, { reqId, candId });
  };

  const closeRequisition = (id) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Closed" } : r))
    );
    logHR("Requisition Closed", { id });
  };

  // === EXPORT CSV ===
  const exportCSV = () => {
    const data =
      activeSubTab === "onboarding"
        ? onboarding.map((o) => ({
            Employee: o.empName,
            Start: o.startDate,
            Status: o.status,
            Progress: `${
              o.checklist.filter((t) => t.status === "done").length
            }/${o.checklist.length}`,
            Cost: formatCurrency(o.cost),
          }))
        : requisitions.map((r) => ({
            Title: r.title,
            Department: r.department,
            Openings: r.openings,
            Status: r.status,
            Candidates: r.candidates.length,
            Posted: r.postedOn,
          }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSubTab}_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          {activeSubTab === "onboarding"
            ? "Employee Onboarding"
            : "Recruitment & Requisitions"}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Export CSV
          </button>
          <button
            onClick={() =>
              activeSubTab === "onboarding"
                ? setShowOnboardModal(true)
                : setShowReqModal(true)
            }
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            {activeSubTab === "onboarding"
              ? "+ Start Onboarding"
              : "+ New Requisition"}
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {["onboarding", "requisitions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 font-medium capitalize border-b-2 transition ${
              activeSubTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600 hover:text-indigo-600"
            }`}
          >
            {tab === "onboarding" ? "Onboarding" : "Requisitions"}
          </button>
        ))}
      </div>

      {/* === ONBOARDING TAB === */}
      {activeSubTab === "onboarding" && (
        <div className="space-y-6">
          {onboarding.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No active onboarding processes
            </p>
          ) : (
            onboarding.map((p) => {
              const done = p.checklist.filter(
                (t) => t.status === "done"
              ).length;
              const total = p.checklist.length;
              return (
                <div
                  key={p.id}
                  className="bg-white border rounded-lg p-5 shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{p.empName}</h3>
                      <p className="text-sm text-gray-600">
                        Started: {p.startDate}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        p.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {p.status} ({done}/{total})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {p.checklist.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={t.status === "done"}
                            onChange={() =>
                              updateTask(
                                p.id,
                                t.id,
                                t.status === "done" ? "pending" : "done"
                              )
                            }
                            className="w-4 h-4"
                          />
                          <span
                            className={
                              t.status === "done"
                                ? "line-through text-gray-500"
                                : ""
                            }
                          >
                            {t.label}
                          </span>
                        </label>
                        <span className="text-xs text-gray-500">
                          {t.assignedTo}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Cost:</strong> {formatCurrency(p.cost)}
                    </p>
                  </div>
                  {done === total && p.status !== "Completed" && (
                    <button
                      onClick={() => completeOnboarding(p.id)}
                      className="mt-3 bg-green-600 text-white px-4 py-1 rounded text-sm"
                    >
                      Complete
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* === REQUISITIONS TAB === */}
      {activeSubTab === "requisitions" && (
        <div className="space-y-6">
          {requisitions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No job requisitions
            </p>
          ) : (
            requisitions.map((r) => (
              <div key={r.id} className="bg-white border rounded-lg p-5 shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{r.title}</h3>
                    <p className="text-sm text-gray-600">
                      {r.department} • {r.branch} • {r.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      Posted: {r.postedOn}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      r.status === "Closed"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {r.status} ({r.candidates.length} candidates)
                  </span>
                </div>
                <p className="text-sm mb-3">{r.description}</p>
                <p className="text-sm font-medium mb-3">
                  Salary: {formatCurrency(r.salaryMin)} -{" "}
                  {formatCurrency(r.salaryMax)} ({r.openings} openings)
                </p>

                <div className="mb-3">
                  <button
                    onClick={() => addCandidate(r.id)}
                    className="text-blue-600 text-sm hover:underline mr-4"
                  >
                    + Add Candidate
                  </button>
                  {r.status !== "Closed" && (
                    <button
                      onClick={() => closeRequisition(r.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Close Requisition
                    </button>
                  )}
                </div>

                {r.candidates.length > 0 && (
                  <table className="w-full text-xs border mt-3">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Email</th>
                        <th className="border p-2 text-left">Status</th>
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.candidates.map((c) => (
                        <tr key={c.id}>
                          <td className="border p-1">{c.name}</td>
                          <td className="border p-1">{c.email}</td>
                          <td className="border p-1">
                            <select
                              value={c.status}
                              onChange={(e) =>
                                updateCandidateStatus(
                                  r.id,
                                  c.id,
                                  e.target.value
                                )
                              }
                              className="text-xs border rounded p-1"
                            >
                              {[
                                "Applied",
                                "Screened",
                                "Interview",
                                "Offer",
                                "Rejected",
                                "Hired",
                              ].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="border p-1">
                            {c.status === "Hired" && (
                              <button
                                onClick={() => {
                                  const emp = employees.find(
                                    (e) => e.email === c.email
                                  );
                                  if (emp) {
                                    alert(`Employee ${c.name} already exists!`);
                                  } else {
                                    alert(
                                      `Auto-create employee from candidate: ${c.name}`
                                    );
                                    // Future: Trigger employee creation
                                  }
                                }}
                                className="text-green-600 text-xs hover:underline"
                              >
                                Create Employee
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* === ONBOARDING MODAL === */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Start Onboarding</h3>
            <select
              value={onboardForm.empId || ""}
              onChange={(e) =>
                setOnboardForm({ ...onboardForm, empId: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="">Select Employee</option>
              {employees
                .filter((e) => e.status === "Active")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.empId} - {e.name}
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input
                type="file"
                onChange={(e) =>
                  setOnboardForm({
                    ...onboardForm,
                    offerLetter: e.target.files[0],
                  })
                }
                className="text-sm"
                placeholder="Offer Letter"
              />
              <input
                type="file"
                onChange={(e) =>
                  setOnboardForm({ ...onboardForm, idProof: e.target.files[0] })
                }
                className="text-sm"
                placeholder="ID Proof"
              />
              <input
                type="file"
                onChange={(e) =>
                  setOnboardForm({ ...onboardForm, photo: e.target.files[0] })
                }
                className="text-sm"
                placeholder="Photo"
              />
            </div>
            <textarea
              placeholder="Notes"
              value={onboardForm.notes}
              onChange={(e) =>
                setOnboardForm({ ...onboardForm, notes: e.target.value })
              }
              className="w-full border rounded px-3 py-2 h-20 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOnboardModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={startOnboarding}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === REQUISITION MODAL === */}
      {showReqModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">New Job Requisition</h3>
            <div className="space-y-3">
              <input
                placeholder="Job Title"
                value={reqForm.title}
                onChange={(e) =>
                  setReqForm({ ...reqForm, title: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Department"
                  value={reqForm.department}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, department: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <select
                  value={reqForm.branch}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, branch: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                >
                  {branches.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={reqForm.type}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, type: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                >
                  {["Full-time", "Part-time", "Contract", "Intern"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Openings"
                  value={reqForm.openings}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, openings: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={reqForm.salaryMin}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, salaryMin: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={reqForm.salaryMax}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, salaryMax: e.target.value })
                  }
                  className="border rounded px-3 py-2 col-span-1"
                />
              </div>
              <textarea
                placeholder="Job Description"
                value={reqForm.description}
                onChange={(e) =>
                  setReqForm({ ...reqForm, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2 h-24"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReqModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createRequisition}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingModule;
