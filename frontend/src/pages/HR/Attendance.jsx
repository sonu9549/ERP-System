import React from "react";

const Attendance = () => {
  const attendance = [
    {
      id: 1,
      name: "Ravi Sharma",
      date: "2025-11-01",
      status: "Present",
      checkIn: "09:00 AM",
      checkOut: "06:00 PM",
    },
    {
      id: 2,
      name: "Neha Singh",
      date: "2025-11-01",
      status: "Leave",
      checkIn: "-",
      checkOut: "-",
    },
    {
      id: 3,
      name: "Amit Kumar",
      date: "2025-11-01",
      status: "Present",
      checkIn: "09:30 AM",
      checkOut: "06:15 PM",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Attendance & Time Management</h1>

      <div className="bg-white shadow-md rounded-2xl p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Attendance</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Export Report
          </button>
        </div>

        <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Check In</th>
              <th className="p-3 text-left">Check Out</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.date}</td>
                <td className="p-3">{a.checkIn}</td>
                <td className="p-3">{a.checkOut}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      a.status === "Present"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Attendance;
