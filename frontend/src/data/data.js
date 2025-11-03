// data.js
// Sample mock data for development. In production, replace with API fetches.
// This includes shared data like chart of accounts, vendors, invoices, etc.
// Can be imported in components and context.

export const sampleChartOfAccounts = [
  { id: 1, code: "1001", name: "Cash", type: "Asset", balance: 50000 },
  {
    id: 2,
    code: "2001",
    name: "Accounts Payable",
    type: "Liability",
    balance: 0,
  },
  { id: 3, code: "5001", name: "Expenses", type: "Expense", balance: 0 },
  // Add more as needed for other submodules
];

export const sampleVendors = [
  { id: 1, name: "Vendor A", contact: "vendorA@example.com", balance: 0 },
  { id: 2, name: "Vendor B", contact: "vendorB@example.com", balance: 0 },
];

export const sampleInvoices = [
  {
    id: 1,
    vendorId: 1,
    amount: 1000,
    date: "2025-11-01",
    status: "Pending",
    description: "Purchase Invoice",
  },
  // Invoices will update GL when posted
];

export const sampleJournalEntries = []; // Shared with GL, will be updated from AP, AR, etc.

// src/data/apData.js
export const defaultVendors = [
  {
    id: "v1",
    name: "Acme Supplies Inc.",
    code: "ACME001",
    email: "ap@acme.com",
    phone: "(555) 123-4567",
    address: "123 Industrial Rd",
    taxId: "12-3456789",
    paymentTerms: 30,
    category: "Office Supplies",
  },
  {
    id: "v2",
    name: "TechGear Ltd.",
    code: "TECH002",
    email: "billing@techgear.com",
    phone: "(555) 987-6543",
    address: "456 Silicon Ave",
    taxId: "98-7654321",
    paymentTerms: 15,
    category: "IT Hardware",
  },
];

export const defaultInvoices = [
  {
    id: "i1",
    vendorId: "v1",
    invoiceNo: "INV-2025-00123",
    poNo: "PO-2025-0456",
    issueDate: "2025-10-15",
    dueDate: "2025-11-14",
    total: 2450.0,
    balance: 2450.0,
    status: "open",
    approval: "pending",
    file: null,
  },
  {
    id: "i2",
    vendorId: "v2",
    invoiceNo: "INV-2025-00987",
    issueDate: "2025-10-20",
    dueDate: "2025-11-04",
    total: 18750.0,
    balance: 7500.0,
    status: "partial",
    approval: "approved",
    file: null,
  },
  {
    id: "i3",
    vendorId: "v1",
    invoiceNo: "INV-2025-00156",
    issueDate: "2025-09-01",
    dueDate: "2025-09-30",
    total: 890.0,
    balance: 0,
    status: "paid",
    approval: "approved",
    file: null,
  },
];

export const defaultPayments = [
  {
    id: "p1",
    invoiceIds: ["i2"],
    vendorId: "v2",
    amount: 11250.0,
    date: "2025-10-25",
    method: "ACH",
    reference: "ACH-20251025-001",
    status: "cleared",
    reconciled: true,
  },
];

export const defaultBankTransactions = [
  {
    id: "b1",
    date: "2025-10-25",
    description: "ACH Payment - TechGear",
    amount: -11250.0,
    matched: true,
  },
  {
    id: "b2",
    date: "2025-10-28",
    description: "Check #1001",
    amount: -2450.0,
    matched: false,
  },
];

// src/data/arData.js
export const defaultCustomers = [
  {
    id: "c1",
    name: "Global Retail Corp",
    code: "CUST001",
    email: "ar@globalretail.com",
    phone: "(555) 555-0101",
    address: "789 Commerce Blvd",
    taxId: "11-2223334",
    creditLimit: 50000,
    paymentTerms: 30,
    category: "Retail",
  },
  {
    id: "c2",
    name: "TechStart Inc.",
    code: "CUST002",
    email: "billing@techstart.com",
    phone: "(555) 555-0202",
    address: "101 Innovation Dr",
    taxId: "22-3334445",
    creditLimit: 25000,
    paymentTerms: 15,
    category: "Tech Startup",
  },
];

export const defaultArInvoices = [
  {
    id: "ari1",
    customerId: "c1",
    invoiceNo: "AR-2025-00089",
    soNo: "SO-2025-1234",
    issueDate: "2025-10-01",
    dueDate: "2025-10-31",
    total: 12500.0,
    balance: 12500.0,
    status: "open",
    approval: "sent",
    file: null,
  },
  {
    id: "ari2",
    customerId: "c2",
    invoiceNo: "AR-2025-00123",
    issueDate: "2025-10-15",
    dueDate: "2025-10-30",
    total: 8750.0,
    balance: 4375.0,
    status: "partial",
    approval: "sent",
    file: null,
  },
  {
    id: "ari3",
    customerId: "c1",
    invoiceNo: "AR-2025-00056",
    issueDate: "2025-09-01",
    dueDate: "2025-09-30",
    total: 5600.0,
    balance: 0,
    status: "paid",
    approval: "sent",
    file: null,
  },
];

export const defaultReceipts = [
  {
    id: "r1",
    invoiceIds: ["ari2"],
    customerId: "c2",
    amount: 4375.0,
    date: "2025-10-20",
    method: "Wire",
    reference: "WIRE-20251020-001",
    status: "applied",
    reconciled: true,
  },
];

export const defaultBankDeposits = [
  {
    id: "d1",
    date: "2025-10-20",
    description: "Wire Receipt - TechStart",
    amount: 4375.0,
    matched: true,
  },
  {
    id: "d2",
    date: "2025-10-25",
    description: "Check Deposit",
    amount: 12500.0,
    matched: false,
  },
];
