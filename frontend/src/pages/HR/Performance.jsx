// src/components/hr/PerformanceAppraisal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useFinance } from "../../context/FinanceContext";

const Performance = () => {
  const { employees = [], logAudit } = useFinance() || {};

  // === LOAD APPRAISALS ===
  const loadAppraisals = () => {
    try {
      const saved = localStorage.getItem("hr_appraisals");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [appraisals, setAppraisals] = useState(loadAppraisals);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rating: 3,
    strengths: "",
    improvements: "",
    goals: "",
    reviewer: "HR Manager",
    reviewDate: format(new Date(), "yyyy-MM-dd"),
  });

  // === AUTO-SAVE ===
  useEffect(() => {
    localStorage.setItem("hr_appraisals", JSON.stringify(appraisals));
  }, [appraisals]);

  // === ALL EMPLOYEES (Active + Terminated) ===
  const allEmployees = useMemo(() => {
    return employees.map((emp) => ({
      ...emp,
      displayStatus:
        emp.status === "Active"
          ? "Active"
          : `Terminated (${emp.exitDate || "—"})`,
    }));
  }, [employees]);

  // === SUBMIT APPRAISAL (Only for Active) ===
  const submitAppraisal = () => {
    if (!selectedEmp) return alert("Select an employee");

    const emp = allEmployees.find((e) => e.id === +selectedEmp);
    if (!emp) return;

    if (emp.status !== "Active") {
      return alert("Appraisal can only be submitted for Active employees.");
    }

    const newAppraisal = {
      id: Date.now(),
      empId: +selectedEmp,
      empName: emp.name,
      empDept: emp.department,
      empStatus: emp.status,
      ...form,
      status: "Completed",
      submittedOn: new Date().toISOString(),
    };

    setAppraisals((prev) => [...prev, newAppraisal]);
    logAudit?.("Performance", "Appraisal Submitted", {
      empId: emp.empId,
      name: emp.name,
      rating: form.rating,
    });

    alert(`Appraisal submitted for ${emp.name}!`);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      rating: 3,
      strengths: "",
      improvements: "",
      goals: "",
      reviewer: "HR Manager",
      reviewDate: format(new Date(), "yyyy-MM-dd"),
    });
    setSelectedEmp("");
  };

  // === RATING STARS ===
  const RatingStars = ({ value, onChange, readOnly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange(star)}
            className={`text-2xl transition ${
              star <= value ? "text-yellow-400" : "text-gray-300"
            } ${!readOnly ? "hover:text-yellow-500" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // === FILTERED APPRAISALS (All History) ===
  const employeeAppraisals = useMemo(() => {
    return appraisals
      .filter((a) => !selectedEmp || a.empId === +selectedEmp)
      .sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn));
  }, [appraisals, selectedEmp]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Performance Appraisal
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            + New Appraisal
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-5 rounded-xl shadow">
            <h3 className="text-sm font-medium text-blue-700">
              Total Appraisals
            </h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {appraisals.length}
            </p>
          </div>
          <div className="bg-green-50 p-5 rounded-xl shadow">
            <h3 className="text-sm font-medium text-green-700">Avg Rating</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {appraisals.length > 0
                ? (
                    appraisals.reduce((s, a) => s + a.rating, 0) /
                    appraisals.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
          <div className="bg-yellow-50 p-5 rounded-xl shadow">
            <h3 className="text-sm font-medium text-yellow-700">This Month</h3>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {
                appraisals.filter(
                  (a) =>
                    format(parseISO(a.submittedOn), "yyyy-MM") ===
                    format(new Date(), "yyyy-MM")
                ).length
              }
            </p>
          </div>
          <div className="bg-purple-50 p-5 rounded-xl shadow">
            <h3 className="text-sm font-medium text-purple-700">
              Total Employees
            </h3>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {allEmployees.length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="border rounded px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
          >
            <option value="">All Employees</option>
            {allEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.empId} - {e.name} ({e.displayStatus})
              </option>
            ))}
          </select>
        </div>

        {/* Appraisals List */}
        <div className="space-y-4">
          {employeeAppraisals.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
              <p className="text-lg">No appraisals found</p>
              <p className="text-sm mt-1">
                Start by submitting a new appraisal
              </p>
            </div>
          ) : (
            employeeAppraisals.map((app) => {
              const emp = allEmployees.find((e) => e.id === app.empId);
              return (
                <div
                  key={app.id}
                  className={`bg-white p-6 rounded-xl shadow hover:shadow-md transition ${
                    emp?.status !== "Active" ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {app.empName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {app.empDept} • {emp?.displayStatus} • Reviewed on{" "}
                        {format(parseISO(app.submittedOn), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <RatingStars value={app.rating} readOnly />
                      <p className="text-xs text-gray-500 mt-1">
                        by {app.reviewer}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-700">Strengths</p>
                      <p className="text-gray-700 mt-1">
                        {app.strengths || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-700">
                        Improvements
                      </p>
                      <p className="text-gray-700 mt-1">
                        {app.improvements || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-indigo-700">Goals</p>
                      <p className="text-gray-700 mt-1">{app.goals || "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* NEW APPRAISAL MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-xl font-bold mb-5 text-gray-800">
                New Performance Appraisal
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Active Employee</option>
                    {allEmployees
                      .filter((e) => e.status === "Active")
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.empId} - {e.name} ({e.department})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only Active employees can be appraised.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Rating
                  </label>
                  <RatingStars
                    value={form.rating}
                    onChange={(v) => setForm({ ...form, rating: v })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {
                      [
                        "",
                        "Unsatisfactory",
                        "Needs Improvement",
                        "Meets Expectations",
                        "Exceeds Expectations",
                        "Outstanding",
                      ][form.rating]
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strengths
                  </label>
                  <textarea
                    value={form.strengths}
                    onChange={(e) =>
                      setForm({ ...form, strengths: e.target.value })
                    }
                    rows="3"
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Excellent team player, meets deadlines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Areas for Improvement
                  </label>
                  <textarea
                    value={form.improvements}
                    onChange={(e) =>
                      setForm({ ...form, improvements: e.target.value })
                    }
                    rows="3"
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Can improve time management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goals for Next Review
                  </label>
                  <textarea
                    value={form.goals}
                    onChange={(e) =>
                      setForm({ ...form, goals: e.target.value })
                    }
                    rows="3"
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Lead 2 client projects by Q2"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAppraisal}
                    disabled={
                      !selectedEmp ||
                      allEmployees.find((e) => e.id === +selectedEmp)
                        ?.status !== "Active"
                    }
                    className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Submit Appraisal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
