import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import Papa from "papaparse";

const TaxationCompliance = ({ accounts = [], journalEntries = [] }) => {
  const [activeTab, setActiveTab] = useState("config");
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [taxTypes, setTaxTypes] = useState([]);
  const [returns, setReturns] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const user = { name: "admin", ip: "192.168.1.10" };

  const tabs = [
    { id: "config", label: "Tax Configuration" },
    { id: "returns", label: "Tax Returns" },
    { id: "filing", label: "Filing Tracker" },
    { id: "reports", label: "Compliance Reports" },
    { id: "audit", label: "Audit Trail" },
    { id: "import", label: "Import / Export" },
  ];

  const branches = ["HQ", "Unit A", "Unit B"];
  const taxCategories = ["GST", "TDS", "TCS", "VAT", "Service Tax"];

  // Load from localStorage
  useEffect(() => {
    const data = {
      taxTypes: JSON.parse(localStorage.getItem("tax_types")) || [],
      returns: JSON.parse(localStorage.getItem("tax_returns")) || [],
      auditLogs: JSON.parse(localStorage.getItem("tax_audit")) || [],
    };

    if (data.taxTypes.length === 0) {
      const seed = [
        {
          id: 1,
          code: "GST18",
          name: "GST @18%",
          category: "GST",
          rate: 18,
          input: true,
          output: true,
          branch: "All",
          effectiveFrom: "2024-01-01",
          status: "Active",
        },
        {
          id: 2,
          code: "TDS194C",
          name: "TDS @2% (Contractor)",
          category: "TDS",
          rate: 2,
          input: false,
          output: true,
          branch: "HQ",
          effectiveFrom: "2024-01-01",
          status: "Active",
        },
      ];
      setTaxTypes(seed);
      localStorage.setItem("tax_types", JSON.stringify(seed));
    } else {
      setTaxTypes(data.taxTypes);
    }

    setReturns(data.returns);
    setAuditLogs(
      data.auditLogs.length
        ? data.auditLogs
        : [
            {
              timestamp: new Date().toISOString(),
              action: "Tax Module Initialized",
              user: user.name,
              ip: user.ip,
            },
          ]
    );
  }, []);

  // Save on change
  useEffect(
    () => localStorage.setItem("tax_types", JSON.stringify(taxTypes)),
    [taxTypes]
  );
  useEffect(
    () => localStorage.setItem("tax_returns", JSON.stringify(returns)),
    [returns]
  );
  useEffect(
    () => localStorage.setItem("tax_audit", JSON.stringify(auditLogs)),
    [auditLogs]
  );

  const logAudit = (action, details = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      user: user.name,
      ip: user.ip,
      details: JSON.stringify(details),
    };
    setAuditLogs((prev) => [...prev, log]);
  };

  // Filter journal entries by year and branch
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((e) => {
      const entryYear = new Date(e.date).getFullYear();
      const branchMatch = branchFilter === "All" || e.branch === branchFilter;
      return entryYear === yearFilter && branchMatch;
    });
  }, [journalEntries, yearFilter, branchFilter]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Taxation & Compliance
        </h1>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option>All</option>
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(+e.target.value)}
            className="border p-2 rounded w-20"
            placeholder="Year"
          />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow"
                : "bg-white border text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === "config" && (
          <TaxConfiguration
            taxTypes={taxTypes}
            setTaxTypes={setTaxTypes}
            branches={branches}
            taxCategories={taxCategories}
            logAudit={logAudit}
          />
        )}
        {activeTab === "returns" && (
          <TaxReturns
            taxTypes={taxTypes}
            filteredEntries={filteredEntries}
            accounts={accounts}
            returns={returns}
            setReturns={setReturns}
            logAudit={logAudit}
          />
        )}
        {activeTab === "filing" && (
          <FilingTracker
            returns={returns}
            setReturns={setReturns}
            logAudit={logAudit}
          />
        )}
        {activeTab === "reports" && (
          <ComplianceReports
            filteredEntries={filteredEntries}
            accounts={accounts}
            taxTypes={taxTypes}
            year={yearFilter}
          />
        )}
        {activeTab === "audit" && <TaxAuditTrail logs={auditLogs} />}
        {activeTab === "import" && (
          <TaxImportExport taxTypes={taxTypes} setTaxTypes={setTaxTypes} />
        )}
      </div>
    </div>
  );
};

/* ====================== SUB COMPONENTS ====================== */

const TaxConfiguration = ({
  taxTypes,
  setTaxTypes,
  branches,
  taxCategories,
  logAudit,
}) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "GST",
    rate: 0,
    input: true,
    output: true,
    branch: "All",
    effectiveFrom: "",
    status: "Active",
  });

  const handleAdd = () => {
    if (!form.code || !form.name) return alert("Code & Name required");
    const newTax = { ...form, id: Date.now(), rate: +form.rate };
    setTaxTypes((prev) => [...prev, newTax]);
    logAudit("Added Tax Type", { code: form.code, name: form.name });
    setForm({ ...form, code: "", name: "", rate: 0, effectiveFrom: "" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tax Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 rounded"
        >
          {taxCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Rate %"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          className="border p-2 rounded"
        >
          <option>All</option>
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <input
          type="date"
          value={form.effectiveFrom}
          onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
          className="border p-2 rounded"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.input}
            onChange={(e) => setForm({ ...form, input: e.target.checked })}
          />
          Input Tax
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.output}
            onChange={(e) => setForm({ ...form, output: e.target.checked })}
          />
          Output Tax
        </label>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white p-2 rounded col-span-3"
        >
          Add Tax Type
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Code</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Rate</th>
            <th className="border p-2 text-left">Branch</th>
            <th className="border p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {taxTypes.map((t) => (
            <tr key={t.id}>
              <td className="border p-1">{t.code}</td>
              <td className="border p-1">{t.name}</td>
              <td className="border p-1">{t.rate}%</td>
              <td className="border p-1">{t.branch}</td>
              <td className="border p-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    t.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {t.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TaxReturns = ({
  taxTypes,
  filteredEntries,
  accounts,
  returns,
  setReturns,
  logAudit,
}) => {
  const generateGSTR1 = () => {
    const outputTax = filteredEntries
      .flatMap((e) => e.lines)
      .filter((l) => {
        const acc = accounts.find((a) => a.id === l.accountId);
        return (
          acc?.taxCode && taxTypes.find((t) => t.code === acc.taxCode)?.output
        );
      })
      .reduce((sum, l) => sum + l.credit, 0);

    const newReturn = {
      id: Date.now(),
      type: "GSTR-1",
      period: `${yearFilter}-04`, // Apr
      generatedOn: new Date().toISOString().split("T")[0],
      taxableAmount: outputTax / 1.18,
      taxAmount: outputTax,
      status: "Draft",
    };
    setReturns((prev) => [...prev, newReturn]);
    logAudit("Generated GSTR-1", { period: newReturn.period });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Generate Tax Returns</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={generateGSTR1}
          className="bg-green-600 text-white p-4 rounded-lg shadow hover:bg-green-700"
        >
          Generate GSTR-1
        </button>
        <button className="bg-yellow-600 text-white p-4 rounded-lg shadow hover:bg-yellow-700">
          Generate GSTR-3B
        </button>
        <button className="bg-purple-600 text-white p-4 rounded-lg shadow hover:bg-purple-700">
          Generate TDS 24Q
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">Recent Returns</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Period</th>
            <th className="border p-2 text-left">Generated</th>
            <th className="border p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((r) => (
            <tr key={r.id}>
              <td className="border p-1">{r.type}</td>
              <td className="border p-1">{r.period}</td>
              <td className="border p-1">{r.generatedOn}</td>
              <td className="border p-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    r.status === "Filed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
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
  );
};

const FilingTracker = ({ returns, setReturns, logAudit }) => {
  const markFiled = (id) => {
    setReturns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Filed",
              filedOn: new Date().toISOString().split("T")[0],
            }
          : r
      )
    );
    logAudit("Marked Return as Filed", { id });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Filing Tracker</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Return</th>
            <th className="border p-2 text-left">Due Date</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((r) => (
            <tr key={r.id}>
              <td className="border p-1">
                {r.type} ({r.period})
              </td>
              <td className="border p-1">20th of next month</td>
              <td className="border p-1">{r.status}</td>
              <td className="border p-1">
                {r.status === "Draft" && (
                  <button
                    onClick={() => markFiled(r.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Mark Filed
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ComplianceReports = ({ filteredEntries, accounts, taxTypes, year }) => {
  const inputTax = filteredEntries
    .flatMap((e) => e.lines)
    .filter((l) => {
      const acc = accounts.find((a) => a.id === l.accountId);
      return (
        acc?.taxCode && taxTypes.find((t) => t.code === acc.taxCode)?.input
      );
    })
    .reduce((sum, l) => sum + l.debit, 0);

  const outputTax = filteredEntries
    .flatMap((e) => e.lines)
    .filter((l) => {
      const acc = accounts.find((a) => a.id === l.accountId);
      return (
        acc?.taxCode && taxTypes.find((t) => t.code === acc.taxCode)?.output
      );
    })
    .reduce((sum, l) => sum + l.credit, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Input vs Output Tax Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">
            Input Tax Credit (ITC)
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            ₹{inputTax.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">
            Output Tax Liability
          </h3>
          <p className="text-3xl font-bold text-red-600">
            ₹{outputTax.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="font-semibold">
          Net Payable / Refund: ₹{(outputTax - inputTax).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const TaxAuditTrail = ({ logs }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Tax Audit Trail</h2>
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Time</th>
          <th className="border p-2 text-left">User</th>
          <th className="border p-2 text-left">Action</th>
          <th className="border p-2 text-left">Details</th>
        </tr>
      </thead>
      <tbody>
        {logs
          .slice()
          .reverse()
          .map((log, i) => (
            <tr key={i}>
              <td className="border p-1">
                {format(parseISO(log.timestamp), "dd MMM yyyy HH:mm")}
              </td>
              <td className="border p-1">{log.user}</td>
              <td className="border p-1">{log.action}</td>
              <td className="border p-1">{log.details}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const TaxImportExport = ({ taxTypes, setTaxTypes }) => {
  const exportCSV = () => {
    const csv = Papa.unparse(taxTypes);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tax_types.csv";
    a.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const imported = results.data.map((d, i) => ({
          ...d,
          id: Date.now() + i,
        }));
        setTaxTypes(imported);
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Import / Export Tax Data</h2>
      <div className="space-y-4">
        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export Tax Types (CSV)
        </button>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={importCSV}
            className="border p-2 rounded"
          />
          <p className="text-sm text-gray-600 mt-1">
            Import Tax Types from CSV
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxationCompliance;
