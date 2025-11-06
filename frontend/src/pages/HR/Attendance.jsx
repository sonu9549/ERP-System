// src/components/hr/Attendance.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  format,
  parseISO,
  differenceInMinutes,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import Papa from "papaparse";

const Attendance = ({ branchFilter = "All" }) => {
  // === LOCAL STORAGE SYNC (Same as EmployeeManagement) ===
  const load = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [employees] = useState(() => load("hr_employees", []));
  const [attendance, setAttendance] = useState(() => load("hr_attendance", []));
  const [leaves] = useState(() => load("hr_leaves", []));

  // Auto-sync on change
  useEffect(() => {
    localStorage.setItem("hr_attendance", JSON.stringify(attendance));
  }, [attendance]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedEmp, setSelectedEmp] = useState("");
  const [showMonthly, setShowMonthly] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const shifts = {
    Morning: { start: "06:00", end: "14:00", lateAfter: "06:15" },
    General: { start: "09:00", end: "18:00", lateAfter: "09:15" },
    Evening: { start: "14:00", end: "22:00", lateAfter: "14:15" },
  };

  // === LOCATION & DEVICE ===
  useEffect(() => {
    if (isCapturing) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation(
            `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(
              4
            )}`
          ),
        () => setLocation("Denied"),
        { timeout: 5000 }
      );
      setDeviceInfo(
        `${navigator.platform} | ${navigator.userAgent.split(" ").pop()}`
      );
    }
  }, [isCapturing]);

  // === CAMERA ===
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert("Camera access denied");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, 320, 240);
      setPhoto(canvas.toDataURL("image/jpeg", 0.7));
      stopCamera();
    }
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    setIsCapturing(false);
  };

  const resetCapture = () => {
    setPhoto(null);
    setLocation(null);
    setIsCapturing(false);
    stopCamera();
  };

  // === FILTERED DATA ===
  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e?.status === "Active" &&
        (branchFilter === "All" || e?.branch === branchFilter)
    );
  }, [employees, branchFilter]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const emp = employees.find((e) => e?.id === a?.empId);
      const inBranch = branchFilter === "All" || emp?.branch === branchFilter;
      const inDate = showMonthly
        ? isWithinInterval(parseISO(a.date), {
            start: startOfMonth(parseISO(selectedDate)),
            end: endOfMonth(parseISO(selectedDate)),
          })
        : a.date === selectedDate;
      return inBranch && inDate;
    });
  }, [attendance, employees, branchFilter, selectedDate, showMonthly]);

  // === CLOCK IN ===
  const clockIn = () => {
    if (!selectedEmp || !photo) return alert("Select employee & capture photo");

    const emp = employees.find((e) => e?.id === +selectedEmp);
    if (!emp) return;

    const shift = shifts[emp.shift || "General"];
    const now = format(new Date(), "HH:mm");

    const existing = attendance.find(
      (a) => a?.empId === +selectedEmp && a?.date === selectedDate
    );
    if (existing?.inTime) return alert("Already clocked in");

    const isLate = now > shift.lateAfter;
    const lateMins = isLate
      ? differenceInMinutes(
          parseISO(`2000-01-01T${now}`),
          parseISO(`2000-01-01T${shift.lateAfter}`)
        )
      : 0;

    const newRecord = {
      id: Date.now(),
      empId: +selectedEmp,
      date: selectedDate,
      inTime: now,
      inPhoto: photo,
      inLocation: location || "Unknown",
      inDevice: deviceInfo,
      status: isLate ? "Late" : "Present",
      lateBy: lateMins,
      shift: emp.shift || "General",
    };

    setAttendance((prev) => [...prev, newRecord]);
    alert("Clocked in!");
    resetCapture();
  };

  // === CLOCK OUT ===
  const clockOut = (id) => {
    const record = attendance.find((a) => a?.id === id);
    if (!record || record.outTime) return;

    const emp = employees.find((e) => e?.id === record.empId);
    const shift = shifts[emp.shift || "General"];
    const now = format(new Date(), "HH:mm");

    const totalMins = differenceInMinutes(
      parseISO(`2000-01-01T${now}`),
      parseISO(`2000-01-01T${record.inTime}`)
    );

    const expectedMins = differenceInMinutes(
      parseISO(`2000-01-01T${shift.end}`),
      parseISO(`2000-01-01T${shift.start}`)
    );

    const overtime = totalMins > expectedMins ? totalMins - expectedMins : 0;
    const earlyOut = totalMins < expectedMins ? expectedMins - totalMins : 0;

    setAttendance((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              outTime: now,
              totalHours: (totalMins / 60).toFixed(2),
              overtime: overtime > 0 ? (overtime / 60).toFixed(2) : "0",
              earlyOut: earlyOut > 0 ? (earlyOut / 60).toFixed(2) : "0",
            }
          : a
      )
    );
    alert("Clocked out!");
  };

  // === MARK ABSENT ===
  const markAbsent = () => {
    if (!selectedEmp) return alert("Select employee");

    const leave = leaves.find(
      (l) =>
        l?.empId === +selectedEmp &&
        l?.from <= selectedDate &&
        l?.to >= selectedDate &&
        l?.status === "Approved"
    );

    const status = leave ? `On Leave (${leave.type})` : "Absent";
    const existing = attendance.find(
      (a) => a?.empId === +selectedEmp && a?.date === selectedDate
    );
    if (existing) return alert("Already recorded");

    setAttendance((prev) => [
      ...prev,
      {
        id: Date.now(),
        empId: +selectedEmp,
        date: selectedDate,
        status,
        note: leave ? "Approved Leave" : "No Show",
      },
    ]);
    alert("Marked absent");
  };

  // === EXPORT CSV ===
  const exportCSV = () => {
    const data = filteredAttendance.map((a) => {
      const emp = employees.find((e) => e?.id === a?.empId) || {};
      return {
        Date: a.date,
        "Emp ID": emp.empId || "",
        Name: emp.name || "",
        Shift: a.shift || "-",
        In: a.inTime || "-",
        Out: a.outTime || "-",
        Hours: a.totalHours || "-",
        Status: a.status,
        Late: a.lateBy > 0 ? `${a.lateBy}m` : "-",
        Overtime: a.overtime || "-",
        "Early Out": a.earlyOut || "-",
      };
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${showMonthly ? "monthly" : selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Tracker</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => setShowMonthly(!showMonthly)}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded text-sm font-medium"
          >
            {showMonthly ? "Daily" : "Monthly"}
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <select
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Select Employee</option>
          {filteredEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.empId} - {e.name} ({e.shift || "General"})
            </option>
          ))}
        </select>

        {!photo ? (
          <button
            onClick={startCamera}
            disabled={!selectedEmp}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
          >
            Capture Photo
          </button>
        ) : (
          <button
            onClick={clockIn}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Clock In
          </button>
        )}

        <button
          onClick={markAbsent}
          disabled={!selectedEmp}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
        >
          Mark Absent
        </button>

        <div className="text-xs text-gray-600 self-center col-span-2">
          Shift:{" "}
          {(selectedEmp &&
            employees.find((e) => e?.id === +selectedEmp)?.shift) ||
            "General"}
        </div>
      </div>

      {/* Camera Modal */}
      {isCapturing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Capture Photo</h3>
            <video ref={videoRef} autoPlay className="w-full rounded mb-4" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-3">
              <button
                onClick={capturePhoto}
                className="bg-green-600 text-white px-6 py-2 rounded"
              >
                Capture
              </button>
              <button
                onClick={resetCapture}
                className="bg-gray-500 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview */}
      {photo && !isCapturing && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
          <img src={photo} alt="Clock-in" className="h-32 mx-auto rounded" />
          <p className="text-xs text-gray-600 mt-2">
            Location: {location || "Fetching..."} | {deviceInfo}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Employee</th>
              <th className="border p-2 text-left">Shift</th>
              <th className="border p-2 text-left">In</th>
              <th className="border p-2 text-left">Out</th>
              <th className="border p-2 text-left">Hours</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  No records
                </td>
              </tr>
            ) : (
              filteredAttendance.map((a) => {
                const emp = employees.find((e) => e?.id === a?.empId) || {};
                const canClockOut =
                  a.date === format(new Date(), "yyyy-MM-dd") &&
                  a.inTime &&
                  !a.outTime;

                return (
                  <tr
                    key={a.id}
                    className={
                      a.status?.includes("Late")
                        ? "bg-yellow-50"
                        : a.status?.includes("Leave")
                        ? "bg-blue-50"
                        : a.status === "Absent"
                        ? "bg-red-50"
                        : ""
                    }
                  >
                    <td className="border p-1">
                      {format(parseISO(a.date), "dd MMM")}
                    </td>
                    <td className="border p-1">{emp.name || "-"}</td>
                    <td className="border p-1 text-xs">{a.shift || "-"}</td>
                    <td className="border p-1">{a.inTime || "-"}</td>
                    <td className="border p-1">{a.outTime || "-"}</td>
                    <td className="border p-1">{a.totalHours || "-"}</td>
                    <td className="border p-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          a.status === "Present"
                            ? "bg-green-100 text-green-800"
                            : a.status?.includes("Late")
                            ? "bg-yellow-100 text-yellow-800"
                            : a.status?.includes("Leave")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {a.status} {a.lateBy > 0 && `(+${a.lateBy}m)`}
                      </span>
                    </td>
                    <td className="border p-1 text-center">
                      {canClockOut && (
                        <button
                          onClick={() => clockOut(a.id)}
                          className="text-xs bg-orange-600 text-white px-3 py-1 rounded"
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
