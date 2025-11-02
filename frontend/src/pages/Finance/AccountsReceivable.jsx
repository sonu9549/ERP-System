import React, { useState } from "react";

const AccountReceivable = () => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Accounts Receivable</h1>
      <p className="text-gray-600">
        Manage customer invoices, collections, and outstanding receivables.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Customers</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Add / Manage Customers</li>
            <li>Customer Categories</li>
            <li>Credit Limits & Terms</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Invoices</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Create Sales Invoices</li>
            <li>Link with Sales Orders / Deliveries</li>
            <li>Monitor Due Dates & Credit Notes</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Receipts</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Record Customer Payments</li>
            <li>Apply Payments to Invoices</li>
            <li>Handle Partial & Advance Receipts</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-2">Reports</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Customer Aging Report</li>
          <li>Outstanding Receivables Summary</li>
          <li>Invoice Collection Report</li>
          <li>Cash Flow Forecast</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountReceivable;
