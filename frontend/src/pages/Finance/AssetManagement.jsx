import React, { useState } from "react";
import { useFinance } from "../../context/FinanceContext";

const FixedAssets = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { assets, setAssets } = useFinance();

  const [form, setForm] = useState({
    name: "",
    category: "",
    cost: "",
    location: "",
    purchaseDate: "",
  });

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    const newAsset = {
      id: assets.length + 1,
      ...form,
      status: "Active",
    };
    setAssets([...assets, newAsset]);
    setForm({
      name: "",
      category: "",
      cost: "",
      location: "",
      purchaseDate: "",
    });
    setActiveTab("overview");
  };

  const tabs = [
    { id: "overview", label: "Asset Overview" },
    { id: "add", label: "Add New Asset" },
    { id: "depreciation", label: "Depreciation" },
    { id: "transfer", label: "Transfer" },
    { id: "disposal", label: "Disposal" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Fixed Assets Management
      </h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Assets</h2>
            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Asset Name</th>
                  <th className="px-4 py-2 border">Category</th>
                  <th className="px-4 py-2 border">Cost</th>
                  <th className="px-4 py-2 border">Location</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {(assets || []).map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{asset.name}</td>
                    <td className="px-4 py-2 border">{asset.category}</td>
                    <td className="px-4 py-2 border">
                      ₹{asset.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border">{asset.location}</td>
                    <td className="px-4 py-2 border">{asset.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "add" && (
          <form onSubmit={handleAddAsset} className="space-y-4 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Add New Asset</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Asset Name"
                value={form.name}
                onChange={handleInputChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleInputChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                name="cost"
                placeholder="Cost"
                value={form.cost}
                onChange={handleInputChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleInputChange}
                className="border p-2 rounded"
              />
              <input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate}
                onChange={handleInputChange}
                className="border p-2 rounded"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Save Asset
            </button>
          </form>
        )}

        {activeTab === "depreciation" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Depreciation Calculation
            </h2>
            <p className="text-gray-600 mb-4">
              Automatically calculate depreciation using straight-line or
              declining balance methods.
            </p>
            <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Calculate Depreciation
            </button>
          </div>
        )}

        {activeTab === "transfer" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Transfer Asset</h2>
            <p className="text-gray-600 mb-4">
              Move assets between branches or departments.
            </p>
            <button className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700">
              Initiate Transfer
            </button>
          </div>
        )}

        {activeTab === "disposal" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Asset Disposal</h2>
            <p className="text-gray-600 mb-4">
              Dispose or write off assets at the end of their useful life.
            </p>
            <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
              Dispose Asset
            </button>
          </div>
        )}

        {activeTab === "reports" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
            <p className="text-gray-600 mb-4">
              Generate reports on asset valuation, depreciation trends, and
              disposal summary.
            </p>
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Download Summary Report
              </button>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                View Depreciation Chart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedAssets;
