import React from "react";

const mockData = {
  leads: 120,
  opportunities: 45,
  conversionRate: "23%",
  recentLeads: [
    {
      id: 1,
      name: "Acme Corp",
      contact: "John Doe",
      status: "In Progress",
      value: "$8,000",
    },
    {
      id: 2,
      name: "Beta Ltd",
      contact: "Jane Smith",
      status: "Converted",
      value: "$12,500",
    },
    {
      id: 3,
      name: "Delta Traders",
      contact: "Raj Patel",
      status: "New",
      value: "$5,400",
    },
  ],
};

const CRM = () => (
  <div className="p-6 bg-white rounded-2xl shadow-md">
    {/* Header */}
    <h1 className="text-2xl font-semibold mb-3">
      Customer Relationship Management (CRM)
    </h1>
    <p className="text-gray-600 mb-6">
      Manage leads, customer interactions, and sales opportunities.
    </p>

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm">
        <h3 className="text-gray-600 font-medium mb-2">Active Leads</h3>
        <p className="text-3xl font-bold text-blue-700">{mockData.leads}</p>
      </div>
      <div className="bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm">
        <h3 className="text-gray-600 font-medium mb-2">Opportunities</h3>
        <p className="text-3xl font-bold text-green-700">
          {mockData.opportunities}
        </p>
      </div>
      <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl shadow-sm">
        <h3 className="text-gray-600 font-medium mb-2">Conversion Rate</h3>
        <p className="text-3xl font-bold text-purple-700">
          {mockData.conversionRate}
        </p>
      </div>
    </div>

    {/* Recent Leads Table */}
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Recent Leads</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Contact Person</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            {mockData.recentLeads.map((lead) => (
              <tr
                key={lead.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="px-4 py-2">{lead.name}</td>
                <td className="px-4 py-2">{lead.contact}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === "Converted"
                        ? "bg-green-100 text-green-700"
                        : lead.status === "In Progress"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium">{lead.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="flex flex-wrap gap-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Add New Lead
      </button>
      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
        Manage Opportunities
      </button>
      <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
        Export CRM Data
      </button>
    </div>
  </div>
);

export default CRM;
