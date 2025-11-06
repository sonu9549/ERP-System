// src/components/GeneralLedger.jsx
import React, { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useFinance } from "../../context/FinanceContext";

/* ============================================= */
/*               MAIN COMPONENT                  */
/* ============================================= */
const GeneralLedger = () => {
  const {
    chartOfAccounts,
    setChartOfAccounts,
    journalEntries,
    setJournalEntries,
    auditLogs,
    setAuditLogs,
    postToGL,
    getBalance,
    formatCurrency,
    getAccount,
  } = useFinance();

  /* ---------- PRINT REF ---------- */
  const printRef = useRef(); // <-- this will be attached to the printable area
  const [printReady, setPrintReady] = useState(false);

  /* ---------- STATE ---------- */
  const [activeTab, setActiveTab] = useState("chart");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  /* ---------- PRINT HANDLER (created AFTER first render) ---------- */
  const handlePrint = useReactToPrint({
    content: () => printRef.current, // <-- always a real DOM node
    documentTitle: `GL_${activeTab}_${yearFilter}`,
    pageStyle: `
      @page { size: A4; margin: 1cm; }
      @media print { body { -webkit-print-color-scheme: light; } }
    `,
  });

  // Enable printing only after the ref is attached
  useEffect(() => {
    setPrintReady(true);
  }, []);

  /* ---------- PDF EXPORT ---------- */
  const exportPDF = (title, columns, data) => {
    if (!data?.length) {
      alert("No data to export!");
      return;
    }
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(16);
    doc.text(title, 15, 15);
    doc.setFontSize(10);
    doc.text(
      `Year: ${yearFilter} | ${format(new Date(), "dd MMM yyyy")}`,
      15,
      25
    );

    const rows = data.map((row) =>
      columns.map((col) => {
        const v = row[col.accessor];
        if (col.format === "currency") return formatCurrency(v || 0);
        if (col.format === "date") return format(parseISO(v), "dd MMM yyyy");
        return v ?? "";
      })
    );

    doc.autoTable({
      head: [columns.map((c) => c.Header)],
      body: rows,
      startY: 35,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 243] },
    });
    doc.save(`${title.replace(/\s+/g, "_")}_${yearFilter}.pdf`);
  };

  /* ---------- AUDIT LOG ---------- */
  const logAudit = (action, details = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      user: "Admin",
      details: JSON.stringify(details), // <-- store as **string**
    };
    setAuditLogs((prev) => [...prev, log]);
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* ==================== PRINTABLE AREA ==================== */}
      <div ref={printRef} className="max-w-7xl mx-auto bg-white shadow-lg">
        {/* HEADER */}
        <div className="border-b-4 border-blue-700 p-6 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                General Ledger
              </h1>
              <p className="text-gray-600">Financial Year: {yearFilter}</p>
            </div>
            <input
              type="number"
              value={yearFilter}
              onChange={(e) => setYearFilter(+e.target.value)}
              className="w-24 px-3 py-2 border-2 border-blue-500 rounded text-center font-bold text-blue-700"
              min="2000"
              max="2100"
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3">
          <button
            onClick={handlePrint}
            disabled={!printReady}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            Print
          </button>

          <button
            onClick={() =>
              exportPDF(
                "Trial Balance",
                [
                  { Header: "Account", accessor: "name" },
                  { Header: "Debit", accessor: "debit", format: "currency" },
                  { Header: "Credit", accessor: "credit", format: "currency" },
                ],
                chartOfAccounts.map((a) => {
                  const bal = getBalance(a.name, {
                    fromDate: `${yearFilter}-01-01`,
                    toDate: `${yearFilter}-12-31`,
                  });
                  return {
                    name: a.name,
                    debit: bal > 0 ? bal : 0,
                    credit: bal < 0 ? Math.abs(bal) : 0,
                  };
                })
              )
            }
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
          >
            Export PDF
          </button>
        </div>

        {/* TABS */}
        <div className="border-b bg-white">
          {[
            { id: "chart", label: "Chart of Accounts" },
            { id: "journal", label: "Journal Entries" },
            { id: "opening", label: "Opening Balances" },
            { id: "trial", label: "Trial Balance" },
            { id: "ledger", label: "General Ledger" },
            { id: "yearend", label: "Year‑End Closing" },
            { id: "audit", label: "Audit Trail" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-4 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-blue-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-6 bg-gray-50 min-h-screen">
          {activeTab === "chart" && <ChartOfAccountsTab logAudit={logAudit} />}
          {activeTab === "journal" && <JournalEntriesTab logAudit={logAudit} />}
          {activeTab === "opening" && (
            <OpeningBalancesTab year={yearFilter} logAudit={logAudit} />
          )}
          {activeTab === "trial" && <TrialBalanceTab year={yearFilter} />}
          {activeTab === "ledger" && <LedgerReportTab year={yearFilter} />}
          {activeTab === "yearend" && (
            <YearEndClosingTab year={yearFilter} logAudit={logAudit} />
          )}
          {activeTab === "audit" && <AuditTrailTab />}
        </div>
      </div>
    </div>
  );
};

/* ============================================= */
/*           OPENING BALANCES TAB                */
/* ============================================= */
const OpeningBalancesTab = ({ year, logAudit }) => {
  const { chartOfAccounts, postToGL } = useFinance();
  const [balances, setBalances] = useState({});

  const apply = () => {
    let totalDr = 0,
      totalCr = 0;

    Object.entries(balances).forEach(([id, val]) => {
      const amt = +val || 0;
      if (amt > 0) totalDr += amt;
      if (amt < 0) totalCr += Math.abs(amt);
    });

    if (totalDr !== totalCr) {
      alert(`Debits (₹${totalDr}) ≠ Credits (₹${totalCr})`);
      return;
    }

    Object.entries(balances).forEach(([id, val]) => {
      const amt = +val || 0;
      if (amt > 0)
        postToGL(id, null, amt, "Opening Balance", "OPEN", `${year}-01-01`);
      if (amt < 0)
        postToGL(
          null,
          id,
          Math.abs(amt),
          "Opening Balance",
          "OPEN",
          `${year}-01-01`
        );
    });

    logAudit("Opening Balances Applied", { year, totalDr, totalCr });
    alert("Opening balances applied!");
    setBalances({});
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Opening Balances ({year})
      </h2>
      <div className="bg-white border rounded p-4 shadow">
        <p className="mb-4 text-sm text-gray-600">+ve = Debit | -ve = Credit</p>
        <SimpleTable
          data={chartOfAccounts.map((a) => ({
            ...a,
            amount: balances[a.id] || "",
          }))}
          columns={[
            { Header: "Account", accessor: "name" },
            {
              Header: "Amount (±)",
              accessor: "amount",
              render: (row) => (
                <input
                  type="number"
                  value={balances[row.id] || ""}
                  onChange={(e) =>
                    setBalances({ ...balances, [row.id]: e.target.value })
                  }
                  className="w-full p-2 border rounded text-right font-mono"
                  placeholder="0"
                />
              ),
            },
          ]}
        />
        <button
          onClick={apply}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded font-bold hover:from-blue-700 hover:to-blue-800 transition text-lg"
        >
          APPLY OPENING BALANCES
        </button>
      </div>
    </div>
  );
};

/* ============================================= */
/*           CHART OF ACCOUNTS TAB               */
/* ============================================= */
const ChartOfAccountsTab = ({ logAudit }) => {
  const { chartOfAccounts, setChartOfAccounts } = useFinance();
  const [form, setForm] = useState({ code: "", name: "", type: "Asset" });

  const add = () => {
    if (!form.code || !form.name) {
      alert("Code & Name are required");
      return;
    }
    const newAcc = { id: Date.now().toString(), ...form };
    setChartOfAccounts((prev) => [...prev, newAcc]);
    logAudit("Account Created", form);
    setForm({ ...form, code: "", name: "" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Chart of Accounts
      </h2>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded mb-6 border shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {["Asset", "Liability", "Equity", "Income", "Expense"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-medium"
          >
            Add Account
          </button>
        </div>
      </div>

      <SimpleTable
        data={chartOfAccounts}
        columns={[
          { Header: "Code", accessor: "code" },
          { Header: "Name", accessor: "name" },
          { Header: "Type", accessor: "type" },
        ]}
      />
    </div>
  );
};

/* ============================================= */
/*           JOURNAL ENTRIES TAB                 */
/* ============================================= */
const JournalEntriesTab = ({ logAudit }) => {
  const { chartOfAccounts, postToGL } = useFinance();
  const [entry, setEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    ref: `JE-${Date.now().toString().slice(-4)}`,
    desc: "",
    lines: [
      { accountId: "", debit: "", credit: "", memo: "" },
      { accountId: "", debit: "", credit: "", memo: "" },
    ],
  });

  const addLine = () =>
    setEntry({
      ...entry,
      lines: [
        ...entry.lines,
        { accountId: "", debit: "", credit: "", memo: "" },
      ],
    });

  const updateLine = (i, field, val) => {
    const lines = [...entry.lines];
    lines[i][field] = field === "debit" || field === "credit" ? +val || 0 : val;
    setEntry({ ...entry, lines });
  };

  const totals = entry.lines.reduce(
    (s, l) => ({
      debit: s.debit + l.debit,
      credit: s.credit + l.credit,
    }),
    { debit: 0, credit: 0 }
  );

  const post = () => {
    if (totals.debit !== totals.credit) {
      alert(`Debits (₹${totals.debit}) ≠ Credits (₹${totals.credit})`);
      return;
    }

    entry.lines.forEach((l) => {
      // ---- GUARD: both accountId and amount must be present ----
      if (l.accountId && l.debit)
        postToGL(l.accountId, null, l.debit, entry.desc, entry.ref, entry.date);
      if (l.accountId && l.credit)
        postToGL(
          null,
          l.accountId,
          l.credit,
          entry.desc,
          entry.ref,
          entry.date
        );
    });

    logAudit("Journal Posted", { ref: entry.ref, amount: totals.debit });
    alert(`Posted ₹${totals.debit.toLocaleString()}`);
    setEntry({
      ...entry,
      desc: "",
      lines: [
        { accountId: "", debit: "", credit: "", memo: "" },
        { accountId: "", debit: "", credit: "", memo: "" },
      ],
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Post Journal Entry
      </h2>
      <div className="bg-white border rounded p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="date"
            value={entry.date}
            onChange={(e) => setEntry({ ...entry, date: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            value={entry.ref}
            readOnly
            className="p-2 bg-gray-100 rounded font-mono text-sm"
          />
          <input
            placeholder="Narration"
            value={entry.desc}
            onChange={(e) => setEntry({ ...entry, desc: e.target.value })}
            className="p-2 border rounded"
          />
        </div>

        {entry.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
            <select
              value={l.accountId}
              onChange={(e) => updateLine(i, "accountId", e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="">Select Account</option>
              {chartOfAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Dr"
              value={l.debit}
              onChange={(e) => updateLine(i, "debit", e.target.value)}
              className="p-2 border rounded text-right font-mono"
            />
            <input
              type="number"
              placeholder="Cr"
              value={l.credit}
              onChange={(e) => updateLine(i, "credit", e.target.value)}
              className="p-2 border rounded text-right font-mono"
            />
            <input
              placeholder="Memo"
              value={l.memo}
              onChange={(e) => updateLine(i, "memo", e.target.value)}
              className="p-2 border rounded text-sm"
            />
            <div />
          </div>
        ))}

        <div className="flex justify-between items-center mt-4 p-3 bg-gray-100 rounded">
          <button
            onClick={addLine}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            + Add Line
          </button>
          <div className="font-bold text-lg">
            Dr: <span className="text-green-600">₹{totals.debit}</span> | Cr:{" "}
            <span className="text-red-600">₹{totals.credit}</span>
          </div>
        </div>

        <button
          onClick={post}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded font-bold hover:from-blue-700 hover:to-blue-800 transition text-lg"
        >
          POST JOURNAL
        </button>
      </div>
    </div>
  );
};

/* ============================================= */
/*           TRIAL BALANCE TAB                   */
/* ============================================= */
const TrialBalanceTab = ({ year }) => {
  const { chartOfAccounts, getBalance, formatCurrency } = useFinance();

  const data = chartOfAccounts.map((a) => {
    const bal = getBalance(a.name, {
      fromDate: `${year}-01-01`,
      toDate: `${year}-12-31`,
    });
    return {
      ...a,
      debit: bal > 0 ? bal : 0,
      credit: bal < 0 ? Math.abs(bal) : 0,
    };
  });

  const totals = {
    debit: data.reduce((s, r) => s + r.debit, 0),
    credit: data.reduce((s, r) => s + r.credit, 0),
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Trial Balance {year}
      </h2>
      <SimpleTable
        data={data}
        columns={[
          { Header: "Account", accessor: "name" },
          { Header: "Debit", accessor: "debit", format: "currency" },
          { Header: "Credit", accessor: "credit", format: "currency" },
        ]}
        totals={totals}
      />
    </div>
  );
};

/* ============================================= */
/*           LEDGER REPORT TAB                   */
/* ============================================= */
const LedgerReportTab = ({ year }) => {
  const { chartOfAccounts, journalEntries } = useFinance();
  const [selected, setSelected] = useState("");
  const account = chartOfAccounts.find((a) => a.id === selected);

  const txns = journalEntries
    .filter((e) => new Date(e.date).getFullYear() <= year)
    .flatMap((e) =>
      e.lines.map((l) => ({
        ...l,
        date: e.date,
        ref: e.ref || "JE",
        desc: e.desc,
      }))
    )
    .filter((t) => t.accountId === selected)
    .sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = txns.map((t) => {
    balance += t.debit - t.credit;
    return { ...t, balance };
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        General Ledger Report
      </h2>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="p-3 border rounded w-full mb-4 text-lg"
      >
        <option value="">Select Account</option>
        {chartOfAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} - {a.name}
          </option>
        ))}
      </select>

      {account && (
        <div>
          <h3 className="text-xl font-bold mb-3 text-blue-700">
            {account.name}
          </h3>
          <SimpleTable
            data={rows}
            columns={[
              { Header: "Date", accessor: "date", format: "date" },
              { Header: "Ref", accessor: "ref" },
              { Header: "Desc", accessor: "desc" },
              { Header: "Dr", accessor: "debit", format: "currency" },
              { Header: "Cr", accessor: "credit", format: "currency" },
              { Header: "Bal", accessor: "balance", format: "currency" },
            ]}
          />
        </div>
      )}
    </div>
  );
};

/* ============================================= */
/*           YEAR END CLOSING TAB                */
/* ============================================= */
const YearEndClosingTab = ({ year, logAudit }) => {
  const close = () => {
    if (!confirm(`Close Financial Year ${year}? This is permanent!`)) return;
    logAudit("Year-End Closed", { year });
    alert(`Year ${year} closed!`);
  };

  return (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-red-600 mb-6">
        Close Financial Year {year}
      </h2>
      <button
        onClick={close}
        className="px-12 py-6 bg-red-600 text-white text-xl rounded hover:bg-red-700 transition font-bold"
      >
        CLOSE YEAR PERMANENTLY
      </button>
    </div>
  );
};

/* ============================================= */
/*           AUDIT TRAIL TAB                     */
/* ============================================= */
const AuditTrailTab = () => {
  const { auditLogs } = useFinance();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Audit Trail</h2>
      <SimpleTable
        data={(auditLogs || []).slice().reverse()}
        columns={[
          { Header: "Time", accessor: "timestamp", format: "datetime" },
          { Header: "User", accessor: "user" },
          { Header: "Action", accessor: "action" },
          {
            Header: "Details",
            accessor: "details",
            render: (row) => {
              try {
                const obj = JSON.parse(row.details);
                return (
                  <pre className="text-xs font-mono bg-gray-100 p-1 rounded">
                    {JSON.stringify(obj, null, 2)}
                  </pre>
                );
              } catch {
                return row.details || "-";
              }
            },
          },
        ]}
      />
    </div>
  );
};

/* ============================================= */
/*           REUSABLE SIMPLE TABLE               */
/* ============================================= */
const SimpleTable = ({ data, columns, totals }) => {
  const { formatCurrency } = useFinance();

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-8">No data available.</p>;
  }

  const safeRender = (value, format) => {
    if (value == null) return "-";

    if (typeof value === "object") {
      return (
        <pre className="text-xs font-mono bg-gray-100 p-1 rounded">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (format === "currency") return formatCurrency(value);
    if (format === "date")
      try {
        return format(parseISO(value), "dd MMM yyyy");
      } catch {
        return "-";
      }
    if (format === "datetime")
      try {
        return format(parseISO(value), "dd MMM yyyy HH:mm");
      } catch {
        return "-";
      }

    return String(value);
  };

  return (
    <div className="overflow-x-auto border rounded shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-blue-600 text-white">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="p-3 text-left font-semibold">
                {col.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover:bg-gray-50 transition">
              {columns.map((col, j) => (
                <td key={j} className="p-3">
                  {col.render
                    ? col.render(row)
                    : safeRender(row[col.accessor], col.format)}
                </td>
              ))}
            </tr>
          ))}
          {totals && (
            <tr className="bg-gray-800 text-white font-bold">
              <td className="p-3">TOTAL</td>
              {columns.slice(1).map((_, i) => (
                <td key={i} className="p-3 text-right">
                  {i === 0 && formatCurrency(totals.debit || 0)}
                  {i === 1 && formatCurrency(totals.credit || 0)}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GeneralLedger;
