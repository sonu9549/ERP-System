import React, { useState } from "react";

const AccountPayable = () => {
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Accounts Payable</h1>
      <p className="text-gray-600">
        Manage vendor invoices, payments, and outstanding balances.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Vendors</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Add / Manage Vendors</li>
            <li>Vendor Categories</li>
            <li>Contact & Payment Info</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Invoices</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Record Purchase Invoices</li>
            <li>Match with Purchase Orders / Receipts</li>
            <li>Track Due Dates & Discounts</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-2">Payments</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Make Manual / Automated Payments</li>
            <li>Payment Vouchers & Approval Workflow</li>
            <li>Bank Reconciliation</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-2">Reports</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Vendor Aging Report</li>
          <li>Pending Payments Summary</li>
          <li>Invoice Register</li>
          <li>Expense Distribution</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountPayable;
