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

export const defaultBudgets = [
  { department: "Production", allocated: 500000, spent: 320000 },
  { department: "Sales", allocated: 400000, spent: 390000 },
];

export const defaultForecasts = [
  { month: "Nov", revenue: 800000, expense: 500000 },
  { month: "Dec", revenue: 850000, expense: 520000 },
];

export const defaultCostCenters = [
  { id: 1, name: "Manufacturing", cost: 250000 },
  { id: 2, name: "Marketing", cost: 100000 },
];

export const defaultFixedAssets = [
  { id: 1, name: "Office Building", value: 2000000, depreciationRate: 5 },
  { id: 2, name: "Machinery", value: 1200000, depreciationRate: 10 },
];

export const initialBudgets = [
  { id: 1, department: "Sales", year: 2025, allocated: 500000, spent: 420000 },
  {
    id: 2,
    department: "Marketing",
    year: 2025,
    allocated: 300000,
    spent: 250000,
  },
  { id: 3, department: "HR", year: 2025, allocated: 150000, spent: 140000 },
];

export const initialCostCenters = [
  {
    id: "CC001",
    name: "Production",
    department: "Manufacturing",
    manager: "John Smith",
    budget: 150000,
  },
  {
    id: "CC002",
    name: "Marketing",
    department: "Sales",
    manager: "Jane Doe",
    budget: 80000,
  },
];

export const initialAssets = [
  {
    id: "FA001",
    name: "CNC Machine",
    purchaseDate: "2023-05-10",
    cost: 1000000,
    depreciation: 10,
  },
  {
    id: "FA002",
    name: "Office Furniture",
    purchaseDate: "2024-03-20",
    cost: 200000,
    depreciation: 15,
  },
];
export const initialFinanceData = {
  vendors: [
    { id: 1, name: "ABC Supplies", due: 250000, paid: 180000 },
    { id: 2, name: "Global Parts", due: 150000, paid: 100000 },
    { id: 3, name: "Metro Tech", due: 200000, paid: 175000 },
  ],

  customers: [
    { id: 1, name: "Delta Traders", limit: 200000, used: 180000 },
    { id: 2, name: "Northline Co.", limit: 300000, used: 120000 },
    { id: 3, name: "Prime Distributors", limit: 250000, used: 240000 },
  ],

  cashFlow: [
    { month: "Jan", inflow: 500000, outflow: 420000 },
    { month: "Feb", inflow: 480000, outflow: 390000 },
    { month: "Mar", inflow: 520000, outflow: 470000 },
    { month: "Apr", inflow: 560000, outflow: 490000 },
  ],

  kpis: [
    { name: "DSO", value: 45 },
    { name: "DPO", value: 38 },
    { name: "Working Capital Ratio", value: 1.25 },
    { name: "Liquidity Coverage", value: 0.9 },
  ],

  budgets: [
    { department: "Production", budget: 800000, actual: 750000 },
    { department: "Sales", budget: 500000, actual: 530000 },
    { department: "HR", budget: 300000, actual: 280000 },
  ],

  costCenters: [
    { name: "Manufacturing", cost: 400000 },
    { name: "Logistics", cost: 200000 },
    { name: "Marketing", cost: 250000 },
  ],
};

// src/data/data.js
export const sampleData = {
  customers: [
    {
      id: "c1",
      name: "Rahul Sharma",
      email: "rahul@xyz.com",
      phone: "+919876543210",
    },
    {
      id: "c2",
      name: "Priya Mehta",
      email: "priya@abc.com",
      phone: "+918765432109",
    },
    {
      id: "c3",
      name: "Amit Kumar",
      email: "amit@def.com",
      phone: "+917654321098",
    },
  ],

  loyaltyPrograms: [
    {
      id: "p1",
      name: "Gold Tier",
      description: "Earn 1 point per ₹100 spent",
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      is_active: true,
    },
    {
      id: "p2",
      name: "Welcome Bonus",
      description: "100 points on first purchase",
      start_date: "2025-01-01",
      end_date: null,
      is_active: true,
    },
  ],

  loyaltyRules: [
    {
      id: "r1",
      program_id: "p1",
      trigger_type: "SALE",
      trigger_ref_table: "sales",
      condition_json: { min_amount: 1000 },
      points_awarded: 10,
    },
    {
      id: "r2",
      program_id: "p1",
      trigger_type: "LEAD_CONVERTED",
      trigger_ref_table: "leads",
      condition_json: {},
      points_awarded: 50,
    },
    {
      id: "r3",
      program_id: "p1",
      trigger_type: "TICKET_CLOSED",
      trigger_ref_table: "support_tickets",
      condition_json: {},
      points_awarded: 20,
    },
  ],

  loyaltyLedger: [
    { id: "l1", customer_id: "c1", program_id: "p1", points: 320 },
    { id: "l2", customer_id: "c2", program_id: "p1", points: 180 },
    { id: "l3", customer_id: "c3", program_id: "p1", points: 90 },
  ],

  loyaltyTransactions: [
    {
      id: "t1",
      ledger_id: "l1",
      type: "EARN",
      points: 100,
      reference_id: "s1",
      notes: "Sale #1001",
      created_at: "2025-03-15T10:30:00Z",
    },
    {
      id: "t2",
      ledger_id: "l1",
      type: "EARN",
      points: 50,
      reference_id: "l1",
      notes: "Lead converted",
      created_at: "2025-03-16T14:20:00Z",
    },
    {
      id: "t3",
      ledger_id: "l1",
      type: "REDEEM",
      points: -30,
      reference_id: "red1",
      notes: "Gift Card",
      created_at: "2025-03-20T09:15:00Z",
    },
  ],

  loyaltyRedemptions: [
    {
      id: "red1",
      program_id: "p1",
      title: "₹500 Gift Card",
      description: "Valid at partner stores",
      points_cost: 30,
      max_per_user: 2,
      is_active: true,
    },
    {
      id: "red2",
      program_id: "p1",
      title: "Free Coffee",
      description: "At Cafe X",
      points_cost: 15,
      max_per_user: 5,
      is_active: true,
    },
  ],
};

// src/data/qualityData.js
export const qualityData = {
  suppliers: [
    {
      id: 1,
      name: "ABC Steel Suppliers",
      location: "Delhi",
      rating: 4.2,
      contact: "abc@steel.com",
    },
    {
      id: 2,
      name: "XYZ Electronics Pvt Ltd",
      location: "Mumbai",
      rating: 3.8,
      contact: "xyz@elec.com",
    },
    {
      id: 3,
      name: "Global Fabrics Co",
      location: "Bangalore",
      rating: 4.5,
      contact: "global@fabrics.com",
    },
  ],
  defects: [
    { id: 1, name: "Crack/Damage", category: "Visual", severity: "High" },
    {
      id: 2,
      name: "Dimension Out of Tolerance",
      category: "Measurement",
      severity: "Medium",
    },
    { id: 3, name: "Color Variation", category: "Visual", severity: "Low" },
    { id: 4, name: "Contamination", category: "Functional", severity: "High" },
  ],
  inspections: [
    {
      id: 101,
      batchNo: "BATCH-2025-001",
      supplierId: 1,
      date: "2025-11-01",
      item: "Steel Rods",
      quantityReceived: 1000,
      sampleSize: 50,
      defectsFound: 2,
      defectIds: [1, 2], // References defects array
      status: "Pass",
      notes: "Minor cracks fixed by supplier.",
      inspectedBy: "Super Admin",
    },
    {
      id: 102,
      batchNo: "BATCH-2025-002",
      supplierId: 2,
      date: "2025-11-03",
      item: "Circuit Boards",
      quantityReceived: 500,
      sampleSize: 32,
      defectsFound: 15,
      defectIds: [2, 4],
      status: "Fail",
      notes: "High contamination, batch rejected.",
      inspectedBy: "User",
    },
    {
      id: 103,
      batchNo: "BATCH-2025-003",
      supplierId: 3,
      date: "2025-11-04",
      item: "Cotton Fabric",
      quantityReceived: 2000,
      sampleSize: 80,
      defectsFound: 0,
      defectIds: [],
      status: "Pass",
      notes: "Perfect quality, no issues.",
      inspectedBy: "Super Admin",
    },
  ],
};
