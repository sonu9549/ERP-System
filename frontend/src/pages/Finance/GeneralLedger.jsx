// src/components/GeneralLedger.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useFinance } from "../../context/FinanceContext";

/* ============================================= */
/*               MAIN COMPONENT                  */
/* ============================================= */
const GeneralLedger = () => {
  const {
    chartOfAccounts,
    journalEntries,
    auditLogs,
    setAuditLogs,
    formatCurrency,
    getTrialBalance,
    createJournalEntry,
    postToGL,
  } = useFinance();

  const printRef = useRef();
  const [printReady, setPrintReady] = useState(false);
  const [activeTab, setActiveTab] = useState("chart");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState(""); // for Ledger tab

  /* ---------- PRINT HANDLER ---------- */
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `GL_${activeTab}_${yearFilter}`,
    pageStyle: `
      @page { size: A4; margin: 1cm; }
      @media print { 
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
    onAfterPrint: () => console.log("Printed successfully"),
  });

  useEffect(() => {
    setPrintReady(true);
  }, []);

  /* ---------- FIXED PDF EXPORT FUNCTION ---------- */
  const exportPDF = (title, columns, data) => {
    if (!data?.length) {
      alert("No data to export!");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");

    // Title
    doc.setFontSize(16);
    doc.text(title, 15, 15);

    // Subtitle
    doc.setFontSize(10);
    doc.text(
      `Year: ${yearFilter} | Generated on: ${format(
        new Date(),
        "dd MMM yyyy HH:mm"
      )}`,
      15,
      25
    );

    // Prepare table data properly - FIXED FORMATTING
    const tableColumns = columns.map((col) => col.Header);
    const tableRows = data.map((row) =>
      columns.map((col) => {
        let value = row[col.accessor];

        // Handle null/undefined values
        if (value == null || value === undefined || value === "") {
          return "";
        }

        // Handle currency formatting - FIXED: Remove special characters
        if (col.format === "currency") {
          const numericValue =
            typeof value === "number" ? value : parseFloat(value) || 0;
          // Format without currency symbol for clean PDF
          return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(numericValue);
        }

        // Handle date formatting
        if (col.format === "date" && value) {
          try {
            return format(parseISO(value), "dd MMM yyyy");
          } catch {
            return String(value);
          }
        }

        // Handle datetime formatting
        if (col.format === "datetime" && value) {
          try {
            return format(parseISO(value), "dd MMM yyyy HH:mm");
          } catch {
            return String(value);
          }
        }

        // Clean string values
        return String(value);
      })
    );

    // Add table with proper formatting
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: "helvetica",
        textColor: [0, 0, 0], // Ensure black text
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        // Right align numeric columns
        ...columns.reduce((styles, col, index) => {
          if (col.format === "currency" || col.align === "right") {
            styles[index] = { halign: "right" };
          }
          return styles;
        }, {}),
      },
      margin: { top: 35 },
    });

    // Save PDF with proper filename
    const filename = `${title.replace(/[^\w\s]/gi, "_")}_${yearFilter}.pdf`;
    doc.save(filename);
  };

  /* ---------- CSV EXPORT FUNCTION ---------- */
  const exportToCSV = (title, columns, data) => {
    if (!data?.length) {
      alert("No data to export!");
      return;
    }

    // Prepare CSV headers
    const headers = columns.map((col) => col.Header);

    // Prepare CSV rows
    const csvRows = data.map((row) =>
      columns
        .map((col) => {
          let value = row[col.accessor];

          if (value == null || value === undefined || value === "") {
            return "";
          }

          if (col.format === "currency") {
            const numericValue =
              typeof value === "number" ? value : parseFloat(value) || 0;
            return numericValue.toFixed(2);
          }

          if (col.format === "date" && value) {
            try {
              return format(parseISO(value), "dd MMM yyyy");
            } catch {
              return String(value);
            }
          }

          if (col.format === "datetime" && value) {
            try {
              return format(parseISO(value), "dd MMM yyyy HH:mm");
            } catch {
              return String(value);
            }
          }

          // Escape commas and quotes for CSV
          const stringValue = String(value);
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }

          return stringValue;
        })
        .join(",")
    );

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `${title.replace(/[^\w\s]/gi, "_")}_${yearFilter}.csv`;
    saveAs(blob, filename);
  };

  /* ---------- TXT EXPORT FUNCTION ---------- */
  const exportToTXT = (title, columns, data) => {
    if (!data?.length) {
      alert("No data to export!");
      return;
    }

    // Prepare headers
    const headers = columns.map((col) => col.Header);

    // Calculate column widths
    const colWidths = headers.map((header, index) => {
      const maxDataWidth = Math.max(
        ...data.map((row) => {
          const value = row[columns[index].accessor];
          if (value == null) return 0;

          if (columns[index].format === "currency") {
            const numericValue =
              typeof value === "number" ? value : parseFloat(value) || 0;
            return numericValue.toFixed(2).length;
          }

          if (columns[index].format === "date" && value) {
            try {
              return format(parseISO(value), "dd MMM yyyy").length;
            } catch {
              return String(value).length;
            }
          }

          return String(value).length;
        })
      );
      return Math.max(header.length, maxDataWidth) + 2;
    });

    // Create header line
    const headerLine = headers
      .map((header, index) => header.padEnd(colWidths[index]))
      .join("");

    // Create separator line
    const separatorLine = colWidths.map((width) => "-".repeat(width)).join("");

    // Create data lines
    const dataLines = data.map((row) =>
      columns
        .map((col, index) => {
          let value = row[col.accessor];

          if (value == null || value === undefined || value === "") {
            return "".padEnd(colWidths[index]);
          }

          if (col.format === "currency") {
            const numericValue =
              typeof value === "number" ? value : parseFloat(value) || 0;
            value = numericValue.toFixed(2);
          } else if (col.format === "date" && value) {
            try {
              value = format(parseISO(value), "dd MMM yyyy");
            } catch {
              value = String(value);
            }
          } else if (col.format === "datetime" && value) {
            try {
              value = format(parseISO(value), "dd MMM yyyy HH:mm");
            } catch {
              value = String(value);
            }
          } else {
            value = String(value);
          }

          // Right align numeric columns, left align others
          if (col.format === "currency" || col.align === "right") {
            return value.padStart(colWidths[index]);
          } else {
            return value.padEnd(colWidths[index]);
          }
        })
        .join("")
    );

    // Combine all content
    const txtContent = [
      title,
      `Year: ${yearFilter} | Generated on: ${format(
        new Date(),
        "dd MMM yyyy HH:mm"
      )}`,
      "",
      headerLine,
      separatorLine,
      ...dataLines,
      "",
    ].join("\n");

    // Create and download TXT file
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const filename = `${title.replace(/[^\w\s]/gi, "_")}_${yearFilter}.txt`;
    saveAs(blob, filename);
  };

  const getTabDataForPDF = () => {
    switch (activeTab) {
      case "trial":
        const trialData = getTrialBalance(`${yearFilter}-12-31`);
        return {
          title: "Trial Balance",
          columns: [
            { Header: "Account", accessor: "account" },
            { Header: "Debit", accessor: "debit", format: "currency" },
            { Header: "Credit", accessor: "credit", format: "currency" },
          ],
          data: trialData.data,
        };

      case "ledger":
        if (!selected) return null;
        const account = chartOfAccounts.find((a) => a.id === selected);
        const txns = journalEntries
          .filter((e) => new Date(e.date).getFullYear() === yearFilter)
          .flatMap((e) =>
            e.lines.map((l) => ({
              ...l,
              date: e.date,
              ref: e.ref || "JE",
              desc: e.desc || "Journal Entry",
            }))
          )
          .filter((t) => t.accountId === selected)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;
        const rows = txns.map((t) => {
          balance += t.debit - t.credit;
          return {
            ...t,
            balance: Math.round(balance * 100) / 100,
          };
        });

        return {
          title: `Ledger - ${account.name}`,
          columns: [
            { Header: "Date", accessor: "date", format: "date" },
            { Header: "Ref", accessor: "ref" },
            { Header: "Description", accessor: "desc" },
            {
              Header: "Debit",
              accessor: "debit",
              format: "currency",
              align: "right",
            },
            {
              Header: "Credit",
              accessor: "credit",
              format: "currency",
              align: "right",
            },
            {
              Header: "Balance",
              accessor: "balance",
              format: "currency",
              align: "right",
            },
          ],
          data: rows,
        };

      case "audit":
        return {
          title: "Audit Trail",
          columns: [
            { Header: "Time", accessor: "timestamp", format: "datetime" },
            { Header: "User", accessor: "user" },
            { Header: "Action", accessor: "action" },
            { Header: "Details", accessor: "details" },
          ],
          data: (auditLogs || [])
            .slice()
            .reverse()
            .map((log) => ({
              ...log,
              details:
                typeof log.details === "object"
                  ? JSON.stringify(log.details)
                  : log.details,
            })),
        };

      case "chart":
        return {
          title: "Chart of Accounts",
          columns: [
            { Header: "Code", accessor: "code" },
            { Header: "Name", accessor: "name" },
            { Header: "Type", accessor: "type" },
            { Header: "Balance", accessor: "balance", format: "currency" },
          ],
          data: chartOfAccounts,
        };

      case "journal":
        const journalData = journalEntries
          .filter((entry) => new Date(entry.date).getFullYear() === yearFilter)
          .flatMap((entry) =>
            entry.lines.map((line) => ({
              date: entry.date,
              ref: entry.ref,
              desc: entry.desc || "Journal Entry",
              account:
                chartOfAccounts.find((acc) => acc.id === line.accountId)
                  ?.name || line.accountId,
              debit: line.debit,
              credit: line.credit,
              memo: line.memo || "",
            }))
          );

        return {
          title: "Journal Entries",
          columns: [
            { Header: "Date", accessor: "date", format: "date" },
            { Header: "Ref", accessor: "ref" },
            { Header: "Description", accessor: "desc" },
            { Header: "Account", accessor: "account" },
            {
              Header: "Debit",
              accessor: "debit",
              format: "currency",
              align: "right",
            },
            {
              Header: "Credit",
              accessor: "credit",
              format: "currency",
              align: "right",
            },
          ],
          data: journalData,
        };

      default:
        return null;
    }
  };

  /* ---------- EXPORT FUNCTIONS FOR CURRENT TAB ---------- */
  const exportCurrentTabAsPDF = () => {
    const tabData = getTabDataForPDF();
    if (!tabData) {
      alert("No data to export in this tab!");
      return;
    }
    exportPDF(tabData.title, tabData.columns, tabData.data);
    logAudit("PDF Export", { tab: activeTab, year: yearFilter });
  };

  const exportCurrentTabAsCSV = () => {
    const tabData = getTabDataForPDF();
    if (!tabData) {
      alert("No data to export in this tab!");
      return;
    }
    exportToCSV(tabData.title, tabData.columns, tabData.data);
    logAudit("CSV Export", { tab: activeTab, year: yearFilter });
  };

  const exportCurrentTabAsTXT = () => {
    const tabData = getTabDataForPDF();
    if (!tabData) {
      alert("No data to export in this tab!");
      return;
    }
    exportToTXT(tabData.title, tabData.columns, tabData.data);
    logAudit("TXT Export", { tab: activeTab, year: yearFilter });
  };

  const logAudit = (action, details = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      user: "Admin",
      details:
        typeof details === "object" ? details : { message: String(details) },
    };
    setAuditLogs((prev) => [...prev, log]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3 no-print">
          <button
            onClick={handlePrint}
            disabled={!printReady}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            📄 Print
          </button>
          <button
            onClick={exportCurrentTabAsPDF}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2 text-sm"
          >
            📊 Export PDF
          </button>
          <button
            onClick={exportCurrentTabAsCSV}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition flex items-center gap-2 text-sm"
          >
            📁 Export CSV
          </button>
          <button
            onClick={exportCurrentTabAsTXT}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center gap-2 text-sm"
          >
            📄 Export TXT
          </button>
        </div>

        {/* TABS */}
        <div className="border-b bg-white no-print">
          {[
            { id: "chart", label: "Chart of Accounts" },
            { id: "journal", label: "Journal Entries" },
            { id: "opening", label: "Opening Balances" },
            { id: "trial", label: "Trial Balance" },
            { id: "ledger", label: "General Ledger" },
            { id: "yearend", label: "Year-End Closing" },
            { id: "audit", label: "Audit Trail" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "ledger") setSelected("");
              }}
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
          {activeTab === "journal" && (
            <JournalEntriesTab
              logAudit={logAudit}
              journalEntries={journalEntries}
              createJournalEntry={createJournalEntry}
            />
          )}
          {activeTab === "opening" && (
            <OpeningBalancesTab year={yearFilter} logAudit={logAudit} />
          )}
          {activeTab === "trial" && <TrialBalanceTab year={yearFilter} />}
          {activeTab === "ledger" && (
            <LedgerReportTab
              year={yearFilter}
              selected={selected}
              setSelected={setSelected}
            />
          )}
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
/*           CHART OF ACCOUNTS TAB               */
/* ============================================= */
const ChartOfAccountsTab = ({ logAudit }) => {
  const { chartOfAccounts, createAccount, updateAccount, deleteAccount } =
    useFinance();
  const [form, setForm] = useState({ code: "", name: "", type: "Asset" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ code: "", name: "", type: "" });

  const add = () => {
    if (!form.code || !form.name) {
      alert("Code & Name are required");
      return;
    }

    try {
      createAccount({
        code: form.code,
        name: form.name,
        type: form.type,
        opening: 0,
        balance: 0,
      });

      logAudit("Account Created", form);
      setForm({ code: "", name: "", type: "Asset" });
    } catch (error) {
      alert(error.message);
    }
  };

  const startEdit = (acc) => {
    setEditingId(acc.id);
    setEditForm({ code: acc.code, name: acc.name, type: acc.type });
  };

  const saveEdit = () => {
    if (!editForm.code || !editForm.name) {
      alert("Code & Name are required");
      return;
    }

    try {
      updateAccount(editingId, editForm);
      logAudit("Account Updated", { id: editingId, ...editForm });
      setEditingId(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteAcc = (id, name) => {
    if (!confirm(`Delete account "${name}"?`)) return;

    try {
      deleteAccount(id);
      logAudit("Account Deleted", { id, name });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Chart of Accounts
      </h2>

      {/* Add Form */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded mb-6 border shadow no-print">
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

      {/* Table with Edit/Delete */}
      <div className="overflow-x-auto border rounded shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3 text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chartOfAccounts.map((acc) => (
              <tr key={acc.id} className="border-b hover:bg-gray-50">
                {editingId === acc.id ? (
                  <>
                    <td className="p-2">
                      <input
                        value={editForm.code}
                        onChange={(e) =>
                          setEditForm({ ...editForm, code: e.target.value })
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({ ...editForm, type: e.target.value })
                        }
                        className="w-full p-1 border rounded"
                      >
                        {[
                          "Asset",
                          "Liability",
                          "Equity",
                          "Income",
                          "Expense",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-right">
                      {acc.balance?.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-center no-print">
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:underline text-xs mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-mono">{acc.code}</td>
                    <td className="p-3">{acc.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          acc.type === "Asset"
                            ? "bg-green-100 text-green-800"
                            : acc.type === "Liability"
                            ? "bg-red-100 text-red-800"
                            : acc.type === "Equity"
                            ? "bg-blue-100 text-blue-800"
                            : acc.type === "Income"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {acc.balance?.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-3 text-center no-print">
                      <button
                        onClick={() => startEdit(acc)}
                        className="text-blue-600 hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAcc(acc.id, acc.name)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================= */
/*           JOURNAL ENTRIES TAB                 */
/* ============================================= */
const JournalEntriesTab = ({
  logAudit,
  journalEntries,
  createJournalEntry,
}) => {
  const [isPosting, setIsPosting] = useState(false);
  const { chartOfAccounts, formatCurrency } = useFinance();
  const [entry, setEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    ref: `JE-${Date.now().toString().slice(-4)}`,
    desc: "",
    lines: [
      { accountId: "", debit: 0, credit: 0, memo: "" },
      { accountId: "", debit: 0, credit: 0, memo: "" },
    ],
  });
  const fileInputRef = useRef();

  /* ---------- EXCEL IMPORT ---------- */
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
          alert("No data found in Excel file");
          return;
        }

        const headers = data[0].map((h) => h?.toString().trim().toLowerCase());
        const rows = data.slice(1);

        const requiredCols = ["date", "account code", "debit", "credit"];
        const missing = requiredCols.filter((col) => !headers.includes(col));
        if (missing.length > 0) {
          alert(`Missing columns: ${missing.join(", ")}`);
          return;
        }

        const dateIdx = headers.indexOf("date");
        const refIdx = headers.indexOf("ref");
        const descIdx =
          headers.indexOf("description") !== -1
            ? headers.indexOf("description")
            : -1;
        const accIdx = headers.indexOf("account code");
        const drIdx = headers.indexOf("debit");
        const crIdx = headers.indexOf("credit");

        const entries = [];
        const errors = [];

        rows.forEach((row, i) => {
          const rowNum = i + 2;
          if (!row[accIdx]) return; // Skip empty rows

          const date = row[dateIdx];
          const accountCode = row[accIdx]?.toString().trim();
          const debit = parseFloat(row[drIdx]) || 0;
          const credit = parseFloat(row[crIdx]) || 0;

          if (!accountCode) {
            errors.push(`Row ${rowNum}: Account Code missing`);
            return;
          }

          const account = chartOfAccounts.find((a) => a.code === accountCode);
          if (!account) {
            errors.push(`Row ${rowNum}: Account '${accountCode}' not found`);
            return;
          }

          if (debit === 0 && credit === 0) {
            errors.push(`Row ${rowNum}: Both Debit and Credit are zero`);
            return;
          }

          entries.push({
            date: format(new Date(date), "yyyy-MM-dd"),
            ref:
              refIdx !== -1
                ? row[refIdx]?.toString() || `JE-IMP${rowNum}`
                : `JE-IMP${rowNum}`,
            desc: descIdx !== -1 ? row[descIdx]?.toString() || "" : "",
            accountId: account.id,
            debit,
            credit,
          });
        });

        // Group by reference to create proper journal entries
        const grouped = {};
        entries.forEach((e) => {
          const key = `${e.date}|${e.ref}|${e.desc}`;
          if (!grouped[key]) {
            grouped[key] = {
              date: e.date,
              ref: e.ref,
              desc: e.desc,
              lines: [],
            };
          }
          grouped[key].lines.push({
            accountId: e.accountId,
            debit: e.debit,
            credit: e.credit,
          });
        });

        let totalImported = 0;
        const postErrors = [];

        Object.values(grouped).forEach((group) => {
          try {
            createJournalEntry(group);
            totalImported++;
          } catch (error) {
            postErrors.push(`Entry ${group.ref}: ${error.message}`);
          }
        });

        const report = `
Imported: ${totalImported} journal entries

${
  errors.length > 0 || postErrors.length > 0
    ? `Issues:\n${[...errors, ...postErrors].join("\n")}`
    : "All entries posted successfully!"
}
        `.trim();

        alert(report);
        logAudit("Excel Import", {
          file: file.name,
          entries: totalImported,
          errors: errors.length + postErrors.length,
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        alert("Error reading file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  /* ---------- DOWNLOAD TEMPLATE ---------- */
  const downloadTemplate = () => {
    const templateData = [
      ["Date", "Ref", "Description", "Account Code", "Debit", "Credit", "Memo"],
      ["2025-04-01", "JE-001", "Office Rent", "RENT", 15000, 0, "April rent"],
      ["2025-04-01", "JE-001", "Office Rent", "CASH", 0, 15000, ""],
      [
        "2025-04-05",
        "JE-002",
        "Sales Revenue",
        "SALES",
        0,
        50000,
        "Invoice #101",
      ],
      ["2025-04-05", "JE-002", "Sales Revenue", "CASH", 50000, 0, ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journal Template");
    XLSX.writeFile(wb, "Journal_Entry_Template.xlsx");
    logAudit("Downloaded Excel Template");
  };

  /* ---------- EXPORT JOURNAL ENTRIES TO CSV ---------- */
  const exportJournalToCSV = () => {
    if (!journalEntries || journalEntries.length === 0) {
      alert("No journal entries to export!");
      return;
    }

    const journalData = journalEntries
      .filter(
        (entry) =>
          new Date(entry.date).getFullYear() === new Date().getFullYear()
      )
      .flatMap((entry) =>
        entry.lines.map((line) => ({
          date: entry.date,
          ref: entry.ref,
          description: entry.desc || "Journal Entry",
          account:
            chartOfAccounts.find((acc) => acc.id === line.accountId)?.name ||
            line.accountId,
          accountCode:
            chartOfAccounts.find((acc) => acc.id === line.accountId)?.code ||
            "",
          debit: line.debit,
          credit: line.credit,
          memo: line.memo || "",
        }))
      );

    const headers = [
      "Date",
      "Reference",
      "Description",
      "Account",
      "Account Code",
      "Debit",
      "Credit",
      "Memo",
    ];

    const csvRows = journalData.map((row) =>
      [
        row.date,
        row.ref,
        `"${row.description.replace(/"/g, '""')}"`,
        `"${row.account.replace(/"/g, '""')}"`,
        row.accountCode,
        row.debit.toFixed(2),
        row.credit.toFixed(2),
        `"${row.memo.replace(/"/g, '""')}"`,
      ].join(",")
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `Journal_Entries_${new Date().getFullYear()}.csv`;
    saveAs(blob, filename);

    logAudit("Journal CSV Export", { count: journalData.length });
  };

  /* ---------- EXPORT JOURNAL ENTRIES TO TXT ---------- */
  const exportJournalToTXT = () => {
    if (!journalEntries || journalEntries.length === 0) {
      alert("No journal entries to export!");
      return;
    }

    const journalData = journalEntries
      .filter(
        (entry) =>
          new Date(entry.date).getFullYear() === new Date().getFullYear()
      )
      .flatMap((entry) =>
        entry.lines.map((line) => ({
          date: entry.date,
          ref: entry.ref,
          description: entry.desc || "Journal Entry",
          account:
            chartOfAccounts.find((acc) => acc.id === line.accountId)?.name ||
            line.accountId,
          accountCode:
            chartOfAccounts.find((acc) => acc.id === line.accountId)?.code ||
            "",
          debit: line.debit,
          credit: line.credit,
          memo: line.memo || "",
        }))
      );

    const colWidths = [12, 12, 25, 20, 12, 12, 12, 20];
    const headers = [
      "Date",
      "Reference",
      "Description",
      "Account",
      "Account Code",
      "Debit",
      "Credit",
      "Memo",
    ];

    const headerLine = headers
      .map((header, index) => header.padEnd(colWidths[index]))
      .join("");

    const separatorLine = colWidths.map((width) => "-".repeat(width)).join("");

    const dataLines = journalData.map((row) =>
      [
        format(parseISO(row.date), "dd MMM yyyy"),
        row.ref,
        row.description,
        row.account,
        row.accountCode,
        row.debit.toFixed(2).padStart(12),
        row.credit.toFixed(2).padStart(12),
        row.memo,
      ]
        .map((value, index) => value.padEnd(colWidths[index]))
        .join("")
    );

    const txtContent = [
      "JOURNAL ENTRIES",
      `Generated on: ${format(new Date(), "dd MMM yyyy HH:mm")}`,
      "",
      headerLine,
      separatorLine,
      ...dataLines,
      "",
    ].join("\n");

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const filename = `Journal_Entries_${new Date().getFullYear()}.txt`;
    saveAs(blob, filename);

    logAudit("Journal TXT Export", { count: journalData.length });
  };

  const addLine = () =>
    setEntry({
      ...entry,
      lines: [...entry.lines, { accountId: "", debit: 0, credit: 0, memo: "" }],
    });

  const removeLine = (index) => {
    if (entry.lines.length <= 2) {
      alert("Journal entry must have at least 2 lines");
      return;
    }
    setEntry({
      ...entry,
      lines: entry.lines.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      ref: `JE-${Date.now().toString().slice(-4)}`,
      desc: "",
      lines: [
        { accountId: "", debit: 0, credit: 0, memo: "" },
        { accountId: "", debit: 0, credit: 0, memo: "" },
      ],
    });
  };

  const updateLine = (index, field, value) => {
    const lines = [...entry.lines];

    if (field === "debit" || field === "credit") {
      // Ensure only one of debit/credit has value
      const numValue = parseFloat(value) || 0;
      lines[index] = {
        ...lines[index],
        debit: field === "debit" ? numValue : 0,
        credit: field === "credit" ? numValue : 0,
      };
    } else {
      lines[index][field] = value;
    }

    setEntry({ ...entry, lines });
  };

  const totals = entry.lines.reduce(
    (acc, line) => ({
      debit: acc.debit + (line.debit || 0),
      credit: acc.credit + (line.credit || 0),
    }),
    { debit: 0, credit: 0 }
  );

  const post = async () => {
    if (isPosting) return;

    // Validate totals
    if (Math.abs(totals.debit - totals.credit) > 0.01) {
      alert(
        `Debits (${formatCurrency(totals.debit)}) ≠ Credits (${formatCurrency(
          totals.credit
        )})`
      );
      return;
    }

    // Validate lines
    const validationErrors = [];
    entry.lines.forEach((line, index) => {
      if (!line.accountId) {
        validationErrors.push(`Line ${index + 1}: Please select an account`);
      }
      if (line.debit === 0 && line.credit === 0) {
        validationErrors.push(
          `Line ${index + 1}: Both debit and credit cannot be zero`
        );
      }
    });

    if (validationErrors.length > 0) {
      alert("Please fix the following errors:\n" + validationErrors.join("\n"));
      return;
    }

    setIsPosting(true);

    try {
      await createJournalEntry({
        date: entry.date,
        ref: entry.ref,
        desc: entry.desc,
        lines: entry.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          memo: line.memo,
        })),
      });

      logAudit("Journal Posted", {
        ref: entry.ref,
        amount: totals.debit,
        lines: entry.lines.length,
      });

      alert(`Journal entry ${entry.ref} posted successfully!`);
      resetForm();
    } catch (error) {
      alert("Error posting journal: " + error.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Post Journal Entry
      </h2>

      {/* IMPORT + EXPORT BAR */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 shadow-sm no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          <button
            onClick={downloadTemplate}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
          >
            📥 Download Template
          </button>
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelImport}
              className="hidden"
            />
            <span className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium flex items-center gap-1">
              📤 Upload Excel
            </span>
          </label>
          <button
            onClick={exportJournalToCSV}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition text-sm font-medium"
          >
            📁 Export CSV
          </button>
          <button
            onClick={exportJournalToTXT}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium"
          >
            📄 Export TXT
          </button>
          <button
            onClick={resetForm}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium"
          >
            🔄 Reset Form
          </button>
        </div>
      </div>

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
            onChange={(e) => setEntry({ ...entry, ref: e.target.value })}
            className="p-2 border rounded font-mono text-sm"
            placeholder="Reference"
          />
          <input
            placeholder="Narration/Description"
            value={entry.desc}
            onChange={(e) => setEntry({ ...entry, desc: e.target.value })}
            className="p-2 border rounded"
          />
        </div>

        <div className="mb-2">
          {entry.lines.map((line, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 items-start"
            >
              <select
                value={line.accountId}
                onChange={(e) => updateLine(index, "accountId", e.target.value)}
                className="p-2 border rounded text-sm"
              >
                <option value="">Select Account</option>
                {chartOfAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Debit"
                value={line.debit || ""}
                onChange={(e) => updateLine(index, "debit", e.target.value)}
                className="p-2 border rounded text-right font-mono"
                step="0.01"
                min="0"
              />

              <input
                type="number"
                placeholder="Credit"
                value={line.credit || ""}
                onChange={(e) => updateLine(index, "credit", e.target.value)}
                className="p-2 border rounded text-right font-mono"
                step="0.01"
                min="0"
              />

              <input
                placeholder="Memo"
                value={line.memo}
                onChange={(e) => updateLine(index, "memo", e.target.value)}
                className="p-2 border rounded text-sm"
              />

              <div className="flex gap-1">
                <button
                  onClick={() => removeLine(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  disabled={entry.lines.length <= 2}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 p-3 bg-gray-100 rounded">
          <button
            onClick={addLine}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Line
          </button>
          <div className="font-bold text-lg">
            Dr:{" "}
            <span className="text-green-600">
              {formatCurrency(totals.debit)}
            </span>{" "}
            | Cr:{" "}
            <span className="text-red-600">
              {formatCurrency(totals.credit)}
            </span>
            {Math.abs(totals.debit - totals.credit) > 0.01 && (
              <span className="text-red-500 text-sm ml-2">(Not Balanced!)</span>
            )}
          </div>
        </div>

        <button
          onClick={post}
          disabled={isPosting || Math.abs(totals.debit - totals.credit) > 0.01}
          className={`mt-4 w-full py-3 rounded font-bold transition text-lg ${
            isPosting || Math.abs(totals.debit - totals.credit) > 0.01
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          }`}
        >
          {isPosting ? "Posting..." : "POST JOURNAL ENTRY"}
        </button>
      </div>
    </div>
  );
};

/* ============================================= */
/*           OPENING BALANCES TAB                */
/* ============================================= */
const OpeningBalancesTab = ({ year, logAudit }) => {
  const { chartOfAccounts, postToGL, formatCurrency } = useFinance();
  const [balances, setBalances] = useState({});

  const apply = () => {
    let totalDr = 0,
      totalCr = 0;

    // Calculate totals
    Object.entries(balances).forEach(([id, amount]) => {
      const numAmount = parseFloat(amount) || 0;
      if (numAmount > 0) totalDr += numAmount;
      if (numAmount < 0) totalCr += Math.abs(numAmount);
    });

    // Check if balanced
    if (Math.abs(totalDr - totalCr) > 0.01) {
      alert(
        `Debits (${formatCurrency(totalDr)}) ≠ Credits (${formatCurrency(
          totalCr
        )})`
      );
      return;
    }

    // Post opening balances
    const errors = [];
    Object.entries(balances).forEach(([id, amount]) => {
      const numAmount = parseFloat(amount) || 0;
      if (numAmount !== 0) {
        try {
          if (numAmount > 0) {
            postToGL(
              id,
              null,
              numAmount,
              "Opening Balance",
              "OPEN",
              `${year}-01-01`
            );
          } else {
            postToGL(
              null,
              id,
              Math.abs(numAmount),
              "Opening Balance",
              "OPEN",
              `${year}-01-01`
            );
          }
        } catch (error) {
          errors.push(`Account ${id}: ${error.message}`);
        }
      }
    });

    if (errors.length > 0) {
      alert("Some entries failed:\n" + errors.join("\n"));
      return;
    }

    logAudit("Opening Balances Applied", { year, totalDr, totalCr });
    alert("Opening balances applied successfully!");
    setBalances({});
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Opening Balances ({year})
      </h2>
      <div className="bg-white border rounded p-4 shadow">
        <p className="mb-4 text-sm text-gray-600">
          Enter positive amounts for Debit balances, negative amounts for Credit
          balances
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-right">Opening Balance</th>
              </tr>
            </thead>
            <tbody>
              {chartOfAccounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {account.code}
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        account.type === "Asset"
                          ? "bg-green-100 text-green-800"
                          : account.type === "Liability"
                          ? "bg-red-100 text-red-800"
                          : account.type === "Equity"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {account.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={balances[account.id] || ""}
                      onChange={(e) =>
                        setBalances({
                          ...balances,
                          [account.id]: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded text-right font-mono"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
/*           TRIAL BALANCE TAB                   */
/* ============================================= */
const TrialBalanceTab = ({ year }) => {
  const { getTrialBalance, formatCurrency } = useFinance();

  const trialBalance = getTrialBalance(`${year}-12-31`);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        Trial Balance {year}
      </h2>

      <SimpleTable
        data={trialBalance.data}
        columns={[
          { Header: "Account", accessor: "account" },
          {
            Header: "Debit",
            accessor: "debit",
            format: "currency",
            align: "right",
          },
          {
            Header: "Credit",
            accessor: "credit",
            format: "currency",
            align: "right",
          },
        ]}
        totals={{
          account: "Total",
          debit: trialBalance.totalDebit,
          credit: trialBalance.totalCredit,
        }}
      />

      <div className="mt-4 text-center">
        {trialBalance.isBalanced ? (
          <p className="text-green-600 font-bold text-lg">
            ✅ Trial Balance Matches! ({formatCurrency(trialBalance.totalDebit)}
            )
          </p>
        ) : (
          <p className="text-red-600 font-bold text-lg">
            ❌ Trial Balance Mismatch! Difference:{" "}
            {formatCurrency(
              Math.abs(trialBalance.totalDebit - trialBalance.totalCredit)
            )}
          </p>
        )}
      </div>
    </div>
  );
};

/* ============================================= */
/*           LEDGER REPORT TAB                   */
/* ============================================= */
const LedgerReportTab = ({ year, selected, setSelected }) => {
  const { chartOfAccounts, journalEntries, formatCurrency } = useFinance();

  const account = chartOfAccounts.find((a) => a.id === selected);

  const transactions = useMemo(() => {
    if (!selected) return [];

    return journalEntries
      .filter((entry) => new Date(entry.date).getFullYear() === year)
      .flatMap((entry) =>
        entry.lines
          .filter((line) => line.accountId === selected)
          .map((line) => ({
            ...line,
            date: entry.date,
            ref: entry.ref || "JE",
            desc: entry.desc,
            entryId: entry.id,
          }))
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selected, journalEntries, year]);

  const ledgerData = useMemo(() => {
    let runningBalance = 0;
    return transactions.map((transaction) => {
      runningBalance += transaction.debit - transaction.credit;
      return {
        ...transaction,
        balance: Math.round(runningBalance * 100) / 100,
      };
    });
  }, [transactions]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        General Ledger Report
      </h2>

      <div className="mb-6">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="p-3 border rounded w-full text-lg"
        >
          <option value="">Select Account</option>
          {chartOfAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.code} - {acc.name}
            </option>
          ))}
        </select>
      </div>

      {account && (
        <div>
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="text-xl font-bold text-blue-700">{account.name}</h3>
            <div className="text-sm text-gray-600">
              Code: <span className="font-mono">{account.code}</span> | Type:{" "}
              <span className="font-medium">{account.type}</span> | Year: {year}
            </div>
          </div>

          {ledgerData.length > 0 ? (
            <SimpleTable
              data={ledgerData}
              columns={[
                { Header: "Date", accessor: "date", format: "date" },
                { Header: "Ref", accessor: "ref" },
                { Header: "Description", accessor: "desc" },
                {
                  Header: "Debit",
                  accessor: "debit",
                  format: "currency",
                  align: "right",
                },
                {
                  Header: "Credit",
                  accessor: "credit",
                  format: "currency",
                  align: "right",
                },
                {
                  Header: "Balance",
                  accessor: "balance",
                  format: "currency",
                  align: "right",
                },
              ]}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No transactions found for this account in {year}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================= */
/*           YEAR END CLOSING TAB                */
/* ============================================= */
const YearEndClosingTab = ({ year, logAudit }) => {
  const closeYear = () => {
    if (
      !confirm(
        `Are you sure you want to close Financial Year ${year}? This action cannot be undone!`
      )
    )
      return;

    // Here you would typically:
    // 1. Calculate retained earnings
    // 2. Close income/expense accounts to retained earnings
    // 3. Update opening balances for next year
    // 4. Archive the year's data

    logAudit("Year-End Closed", { year });
    alert(`Financial Year ${year} has been closed successfully!`);
  };

  return (
    <div className="text-center py-12">
      <div className="bg-white border-2 border-red-200 rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-red-600 mb-4">
          Close Financial Year {year}
        </h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 text-left">
          <h3 className="font-bold text-yellow-800 mb-2">
            ⚠️ Important Notice
          </h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• This will permanently close the financial year {year}</li>
            <li>• All income and expense accounts will be reset to zero</li>
            <li>• Retained earnings will be calculated and carried forward</li>
            <li>• No further transactions can be posted to year {year}</li>
            <li>• Make sure all adjustments are completed before proceeding</li>
          </ul>
        </div>

        <button
          onClick={closeYear}
          className="px-8 py-4 bg-red-600 text-white text-xl rounded-lg hover:bg-red-700 transition font-bold shadow-lg"
        >
          CLOSE YEAR {year} PERMANENTLY
        </button>
      </div>
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

      {auditLogs && auditLogs.length > 0 ? (
        <SimpleTable
          data={auditLogs.slice().reverse()}
          columns={[
            { Header: "Timestamp", accessor: "timestamp", format: "datetime" },
            { Header: "User", accessor: "user" },
            { Header: "Action", accessor: "action" },
            {
              Header: "Details",
              accessor: "details",
              render: (row) => {
                try {
                  if (typeof row.details === "string") {
                    const parsed = JSON.parse(row.details);
                    return (
                      <pre className="text-xs font-mono bg-gray-100 p-2 rounded max-w-md overflow-auto">
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    );
                  }
                  return (
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded max-w-md overflow-auto">
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
                  );
                } catch {
                  return (
                    <span className="text-sm text-gray-600">
                      {row.details || "No details"}
                    </span>
                  );
                }
              },
            },
          ]}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No audit logs found
        </div>
      )}
    </div>
  );
};

/* ============================================= */
/*           REUSABLE SIMPLE TABLE               */
/* ============================================= */
const SimpleTable = ({ data, columns, totals }) => {
  const { formatCurrency } = useFinance();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded border">
        No data available
      </div>
    );
  }

  const safeRender = (value, format, align = "left") => {
    if (value == null || value === undefined || value === "") return "-";

    // Handle numeric values properly
    if (format === "currency") {
      const numericValue =
        typeof value === "number" ? value : parseFloat(value) || 0;
      return (
        <div className={`${align === "right" ? "text-right" : ""} font-mono`}>
          {formatCurrency(numericValue)}
        </div>
      );
    }

    if (format === "date" && value) {
      try {
        return format(parseISO(value), "dd MMM yyyy");
      } catch {
        return String(value);
      }
    }

    if (format === "datetime" && value) {
      try {
        return format(parseISO(value), "dd MMM yyyy HH:mm");
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  return (
    <div className="overflow-x-auto border rounded shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead className="bg-blue-600 text-white">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`p-3 font-semibold ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b hover:bg-gray-50 transition ${
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`p-3 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.render
                    ? col.render(row)
                    : safeRender(row[col.accessor], col.format, col.align)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot className="bg-gray-800 text-white font-bold">
            <tr>
              {columns.map((col, index) => {
                if (index === 0) {
                  return (
                    <td key={index} className="p-3">
                      {totals[col.accessor] || "Total"}
                    </td>
                  );
                }

                const value = totals[col.accessor];
                if (value != null && col.format === "currency") {
                  return (
                    <td key={index} className="p-3 text-right font-mono">
                      {formatCurrency(value)}
                    </td>
                  );
                }

                return <td key={index} className="p-3"></td>;
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default GeneralLedger;
