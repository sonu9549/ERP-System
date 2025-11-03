import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  parseISO,
  differenceInMinutes,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import Papa from "papaparse";

const Attendance = ({
  employees = [],
  leaves = [],
  attendance = [],
  setAttendance,
  logAudit = () => {},
  branchFilter = "All",
}) => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedEmp, setSelectedEmp] = useState("");
  const [showMonthly, setShowMonthly] = useState(false);
  const shiftStart = "09:00";

  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          (branchFilter === "All" || e.branch === branchFilter) &&
          e.status === "Active"
      ),
    [employees, branchFilter]
  );

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((a) => {
        const emp = employees.find((e) => e.id === a.empId);
        const inBranch = branchFilter === "All" || emp?.branch === branchFilter;
        const inDate =
          !showMonthly ||
          (new Date(a.date) >= startOfMonth(new Date(selectedDate)) &&
            new Date(a.date) <= endOfMonth(new Date(selectedDate)));
        return inBranch && inDate;
      }),
    [attendance, employees, branchFilter, selectedDate, showMonthly]
  );

  const clockIn = () => {
    if (!selectedEmp || !selectedDate) return alert("Select employee and date");
    const now = format(new Date(), "HH:mm");
    const existing = attendance.find(
      (a) => a.empId === +selectedEmp && a.date === selectedDate
    );
    if (existing) return alert("Already clocked in");

    const isLate = now > shiftStart;
    const newRecord = {
      id: Date.now(),
      empId: +selectedEmp,
      date: selectedDate,
      inTime: now,
      outTime: null,
      status: isLate ? "Late" : "Present",
      lateBy: isLate
        ? differenceInMinutes(
            parseISO(`2000-01-01T${now}`),
            parseISO(`2000-01-01T${shiftStart}`)
          )
        : 0,
    };
    setAttendance((prev) => [...prev, newRecord]);
    logAudit("Clocked In", { empId: selectedEmp, time: now });
  };

  const clockOut = (recordId) => {
    const now = format(new Date(), "HH:mm");
    const record = attendance.find((a) => a.id === recordId);
    if (!record || record.outTime) return;

    const totalMins = differenceInMinutes(
      parseISO(`2000-01-01T${now}`),
      parseISO(`2000-01-01T${record.inTime}`)
    );
    const overtime = totalMins > 540 ? totalMins - 540 : 0;

    setAttendance((prev) =>
      prev.map((a) =>
        a.id === recordId
          ? {
              ...a,
              outTime: now,
              totalHours: (totalMins / 60).toFixed(2),
              overtime: (overtime / 60).toFixed(2),
            }
          : a
      )
    );
    logAudit("Clocked Out", { empId: record.empId, time: now });
  };

  const markAbsent = () => {
    if (!selectedEmp || !selectedDate) return alert("Select employee and date");
    const existing = attendance.find(
      (a) => a.empId === +selectedEmp && a.date === selectedDate
    );
    if (existing) return alert("Already marked");

    const leave = leaves.find(
      (l) =>
        l.empId === +selectedEmp &&
        l.from <= selectedDate &&
        l.to >= selectedDate &&
        l.status === "Approved"
    );
    const status = leave ? `On Leave (${leave.type})` : "Absent";

    setAttendance((prev) => [
      ...prev,
      {
        id: Date.now(),
        empId: +selectedEmp,
        date: selectedDate,
        inTime: null,
        outTime: null,
        status,
      },
    ]);
    logAudit("Marked Absent", { empId: selectedEmp, status });
  };

  const exportCSV = () => {
    const data = filteredAttendance.map((a) => {
      const emp = employees.find((e) => e.id === a.empId);
      return {
        Date: a.date,
        "Emp ID": emp?.empId,
        Name: emp?.name,
        In: a.inTime || "-",
        Out: a.outTime || "-",
        Hours: a.totalHours || "-",
        Status: a.status,
        Late: a.lateBy ? `${a.lateBy} mins` : "-",
        Overtime: a.overtime ? `${a.overtime} hrs` : "-",
      };
    });
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Attendance Tracker</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={() => setShowMonthly(!showMonthly)}
            className="px-3 py-2 bg-gray-200 rounded text-sm"
          >
            {showMonthly ? "Daily" : "Monthly"}
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-blue-50 rounded">
        <select
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Employee</option>
          {filteredEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.empId} - {e.name}
            </option>
          ))}
        </select>
        <button
          onClick={clockIn}
          disabled={!selectedEmp}
          className="bg-green-600 text-white p-2 rounded disabled:bg-gray-400"
        >
          Clock In
        </button>
        <button
          onClick={markAbsent}
          disabled={!selectedEmp}
          className="bg-red-600 text-white p-2 rounded disabled:bg-gray-400"
        >
          Mark Absent
        </button>
        <div className="text-sm text-gray-700 self-center">
          Shift: 09:00 - 18:00
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Employee</th>
              <th className="border p-2">In</th>
              <th className="border p-2">Out</th>
              <th className="border p-2">Hours</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No attendance records
                </td>
              </tr>
            ) : (
              filteredAttendance.map((a) => {
                const emp = employees.find((e) => e.id === a.empId);
                const canClockOut =
                  a.date === format(new Date(), "yyyy-MM-dd") &&
                  a.inTime &&
                  !a.outTime;

                return (
                  <tr
                    key={a.id}
                    className={a.status.includes("Late") ? "bg-yellow-50" : ""}
                  >
                    <td className="border p-1">
                      {format(parseISO(a.date), "dd MMM")}
                    </td>
                    <td className="border p-1">{emp?.name}</td>
                    <td className="border p-1">{a.inTime || "-"}</td>
                    <td className="border p-1">{a.outTime || "-"}</td>
                    <td className="border p-1">{a.totalHours || "-"}</td>
                    <td className="border p-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          a.status === "Present"
                            ? "bg-green-100 text-green-800"
                            : a.status.includes("Late")
                            ? "bg-yellow-100 text-yellow-800"
                            : a.status.includes("Leave")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="border p-1">
                      {canClockOut && (
                        <button
                          onClick={() => clockOut(a.id)}
                          className="text-xs bg-orange-600 text-white px-2 py-1 rounded"
                        >
                          Clock Out
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
