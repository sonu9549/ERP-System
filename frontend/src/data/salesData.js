// src/data/mockData.js

// ── 1. Customers ─────────────────────────────────────────────────────
export const customers = [
  {
    id: 1,
    name: "Acme Corp",
    email: "contact@acme.com",
    address: "123 Main St, NY",
  },
  {
    id: 2,
    name: "Beta Systems",
    email: "info@betasys.com",
    address: "456 Tech Ave, CA",
  },
  {
    id: 3,
    name: "Gamma Tech",
    email: "sales@gamma.tech",
    address: "789 Innovate Rd, TX",
  },
];

// ── 2. Products (for Orders) ───────────────────────────────────────
export const products = [
  { id: 1, name: "Laptop Pro", price: 1299 },
  { id: 2, name: "Wireless Mouse", price: 49 },
  { id: 3, name: "USB-C Hub", price: 89 },
  { id: 4, name: 'Monitor 27"', price: 399 },
];

// ── 3. Carriers ─────────────────────────────────────────────────────
export const carriers = [
  { id: 1, name: "FedEx", rate: 15 },
  { id: 2, name: "UPS", rate: 12 },
  { id: 3, name: "DHL", rate: 18 },
];

// ── 5. Inventory: Products (with cost, reorder, etc.) ───────────────
export const mockProducts = [
  {
    id: 1,
    sku: "LAP-001",
    name: 'Laptop Pro 16"',
    uom: "PCS",
    cost_price: 1200,
    selling_price: 1599,
    min_stock: 5,
    reorder_point: 10,
    has_batch: false,
    has_serial: true,
  },
  {
    id: 2,
    sku: "MON-24",
    name: '24" Monitor',
    uom: "PCS",
    cost_price: 180,
    selling_price: 249,
    min_stock: 8,
    reorder_point: 15,
    has_batch: false,
    has_serial: false,
  },
  {
    id: 3,
    sku: "KBD-MECH",
    name: "Mechanical Keyboard",
    uom: "PCS",
    cost_price: 85,
    selling_price: 129,
    min_stock: 20,
    reorder_point: 30,
    has_batch: false,
    has_serial: false,
  },
  {
    id: 4,
    sku: "MOUSE-G",
    name: "Gaming Mouse",
    uom: "PCS",
    cost_price: 45,
    selling_price: 79,
    min_stock: 25,
    reorder_point: 40,
    has_batch: false,
    has_serial: false,
  },
  {
    id: 5,
    sku: "RAM-16GB",
    name: "16GB RAM Stick",
    uom: "PCS",
    cost_price: 75,
    selling_price: 119,
    min_stock: 10,
    reorder_point: 20,
    has_batch: true,
    has_serial: false,
  },
  {
    id: 6,
    sku: "SSD-1TB",
    name: "1TB NVMe SSD",
    uom: "PCS",
    cost_price: 110,
    selling_price: 169,
    min_stock: 12,
    reorder_point: 25,
    has_batch: true,
    has_serial: false,
  },
];

// ── 6. Warehouses & Bins ───────────────────────────────────────────
export const mockWarehouses = [
  {
    id: 1,
    name: "Main Warehouse",
    code: "WH1",
    address: "123 Industrial Rd, New York, NY",
  },
  {
    id: 2,
    name: "West Coast Hub",
    code: "WH2",
    address: "456 Pacific Ave, Los Angeles, CA",
  },
];

export const mockBins = [
  { id: 1, warehouse_id: 1, code: "A1", zone: "A" },
  { id: 2, warehouse_id: 1, code: "A2", zone: "A" },
  { id: 3, warehouse_id: 1, code: "B1", zone: "B" },
  { id: 4, warehouse_id: 2, code: "C1", zone: "C" },
  { id: 5, warehouse_id: 2, code: "C2", zone: "C" },
];

// ── 7. Stock Ledger (FIFO) ─────────────────────────────────────────
export const generateMockStockLedger = () => {
  const ledger = [];
  let id = 1;

  const addTx = (
    product_id,
    warehouse_id,
    bin_id,
    type,
    qty,
    cost,
    ref_type,
    ref_id,
    batch = null,
    expiry = null
  ) => {
    const last = ledger
      .filter(
        (t) =>
          t.product_id === product_id &&
          t.warehouse_id === warehouse_id &&
          t.bin_id === bin_id
      )
      .reduce((sum, t) => sum + t.qty_in - t.qty_out, 0);
    const balance = type.includes("in") ? last + qty : last - qty;
    if (balance < 0) return;

    ledger.push({
      id: id++,
      product_id,
      warehouse_id,
      bin_id,
      transaction_type: type,
      reference_type: ref_type,
      reference_id: ref_id,
      qty_in: type.includes("in") ? qty : 0,
      qty_out: type.includes("out") ? qty : 0,
      balance,
      unit_cost: cost,
      batch_no: batch,
      expiry_date: expiry,
      created_at: new Date(
        Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
      created_by: 1,
    });
  };

  // Realistic FIFO layers
  addTx(1, 1, 1, "receipt_in", 25, 1200, "GRN", 101);
  addTx(1, 1, 1, "issue_out", 8, 1200, "SO", 201);
  addTx(1, 1, 2, "receipt_in", 10, 1180, "GRN", 102);
  addTx(1, 1, 2, "issue_out", 3, 1180, "SO", 202);

  addTx(2, 1, 3, "receipt_in", 60, 180, "GRN", 103);
  addTx(2, 1, 3, "issue_out", 42, 180, "SO", 203);

  addTx(3, 2, 4, "receipt_in", 120, 85, "GRN", 104);
  addTx(3, 2, 4, "issue_out", 85, 85, "SO", 204);

  addTx(5, 1, 1, "receipt_in", 40, 75, "GRN", 105, "BATCH2025A", "2025-12-31");
  addTx(5, 1, 1, "issue_out", 38, 75, "SO", 205, "BATCH2025A");

  addTx(6, 2, 5, "receipt_in", 30, 110, "GRN", 106, "BATCH2025B", "2025-11-15");
  addTx(6, 2, 5, "issue_out", 5, 110, "SO", 206, "BATCH2025B");

  // Low stock trigger
  addTx(4, 1, 2, "receipt_in", 20, 45, "GRN", 107);
  addTx(4, 1, 2, "issue_out", 25, 45, "SO", 207); // balance = -5 → blocked

  return ledger;
};
export const sampleSalesData = {
  customers: [
    { id: 1, name: "ABC Corp", email: "abc@corp.com", phone: "9876543210" },
    { id: 2, name: "XYZ Ltd", email: "xyz@ltd.com", phone: "9123456789" },
  ],
  products: [
    { id: 1, name: "Steel Rod 12mm", price: 450, unit: "kg" },
    { id: 2, name: "Welding Electrode", price: 80, unit: "pack" },
  ],
};

// src/context/sales/demoData.js
export const mockProduct = [
  {
    id: 1,
    name: "Laptop Pro",
    sku: "LP-001",
    price: 1200,
    category: "Electronics",
    stock: 50,
  },
  {
    id: 2,
    name: "Wireless Mouse",
    sku: "WM-002",
    price: 25,
    category: "Electronics",
    stock: 200,
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    sku: "MK-003",
    price: 80,
    category: "Electronics",
    stock: 75,
  },
  {
    id: 4,
    name: "Monitor 24inch",
    sku: "MN-004",
    price: 300,
    category: "Electronics",
    stock: 30,
  },
  {
    id: 5,
    name: "Office Chair",
    sku: "OC-005",
    price: 150,
    category: "Furniture",
    stock: 40,
  },
];

export const generateOrders = () => {
  const customers = [
    { id: 1, name: "Acme Corp", email: "contact@acme.com" },
    { id: 2, name: "Beta Systems", email: "info@beta.com" },
    { id: 3, name: "Gamma Tech", email: "sales@gamma.com" },
    { id: 4, name: "Delta Solutions", email: "hello@delta.com" },
  ];

  const statuses = [
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  const shippingStatuses = ["Pending", "Shipped", "In Transit", "Delivered"];

  return Array.from({ length: 25 }, (_, i) => {
    const customer = customers[i % customers.length];
    const items = mockProducts.slice(0, 2 + (i % 3)).map((product, idx) => ({
      productId: product.id,
      productName: product.name,
      quantity: 1 + (idx % 3),
      price: product.price,
    }));

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return {
      id: i + 1,
      orderNo: `SO-${String(i + 1001).padStart(4, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      items: items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: statuses[i % statuses.length],
      shippingStatus: shippingStatuses[i % shippingStatuses.length],
      returnStatus: "None",
      createdAt: new Date(Date.now() - i * 86400000)
        .toISOString()
        .split("T")[0],
    };
  });
};

export const generateInvoices = (orders) => {
  return orders.map((order, index) => ({
    id: index + 1,
    invoiceNo: `INV-${String(index + 1001).padStart(4, "0")}`,
    orderId: order.id,
    orderNo: order.orderNo,
    customer: order.customerName,
    items: order.items,
    total: order.total,
    tax: order.tax,
    grandTotal: order.total,
    status: index % 3 === 0 ? "Paid" : "Unpaid",
    issueDate: order.createdAt,
    dueDate: new Date(new Date(order.createdAt).getTime() + 30 * 86400000)
      .toISOString()
      .split("T")[0],
  }));
};

export const generateQuotations = () => {
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    quoteNo: `QT-${String(i + 1001).padStart(4, "0")}`,
    customerName: `Customer ${i + 1}`,
    customerEmail: `customer${i + 1}@example.com`,
    total: 500 + i * 100,
    status: i % 3 === 0 ? "Accepted" : i % 3 === 1 ? "Pending" : "Draft",
    validity: 30,
    createdAt: new Date(Date.now() - i * 2 * 86400000)
      .toISOString()
      .split("T")[0],
  }));
};

// src/context/sales/demoData.js (Customer section)
export const generateCustomers = () => {
  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Education",
    "Energy",
  ];
  const customerTiers = ["Basic", "Standard", "Premium", "Enterprise"];
  const countries = [
    "USA",
    "UK",
    "India",
    "Germany",
    "Canada",
    "Australia",
    "Japan",
    "France",
  ];
  const cities = {
    USA: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
    UK: ["London", "Manchester", "Birmingham", "Liverpool", "Glasgow"],
    India: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
    Germany: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  };

  const baseCustomers = [
    {
      id: 1,
      customerCode: "CUST-1001",
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+1 234-567-8901",
      status: "Active",
      joinDate: "2023-01-15",
      lastActivity: "2024-01-15",
      revenue: 1250000,
      country: "USA",
      city: "New York",
      industry: "Technology",
      customerTier: "Premium",
      satisfaction: 4.8,
      totalOrders: 45,
      creditLimit: 50000,
      paymentTerms: "Net 30",
      accountManager: "John Smith",
      tags: ["VIP", "Enterprise", "Tech"],
      notes: "Key enterprise client with growing needs",
    },
    {
      id: 2,
      customerCode: "CUST-1002",
      name: "Beta Systems Ltd",
      email: "info@betasys.com",
      phone: "+44 20 7946 0958",
      status: "Active",
      joinDate: "2023-03-22",
      lastActivity: "2024-01-14",
      revenue: 890000,
      country: "UK",
      city: "London",
      industry: "Finance",
      customerTier: "Enterprise",
      satisfaction: 4.9,
      totalOrders: 32,
      creditLimit: 75000,
      paymentTerms: "Net 15",
      accountManager: "Sarah Johnson",
      tags: ["Financial", "High-Value"],
      notes: "Regular client with quarterly orders",
    },
  ];

  const additionalCustomers = Array.from({ length: 48 }, (_, i) => {
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const tier =
      customerTiers[Math.floor(Math.random() * customerTiers.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const city = cities[country]
      ? cities[country][Math.floor(Math.random() * cities[country].length)]
      : "Unknown";
    const status = Math.random() > 0.2 ? "Active" : "Inactive";
    const revenue = Math.floor(Math.random() * 3000000) + 20000;
    const totalOrders = Math.floor(Math.random() * 50) + 5;

    return {
      id: i + 3,
      customerCode: `CUST-${1003 + i}`,
      name: `${industry} Solutions ${i + 1} Inc`,
      email: `contact@${industry.toLowerCase()}solutions${i + 1}.com`,
      phone: `+1 555-${String(i + 100).padStart(3, "0")}-${String(
        i + 200
      ).padStart(3, "0")}`,
      status: status,
      joinDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      lastActivity: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      revenue: revenue,
      country: country,
      city: city,
      industry: industry,
      customerTier: tier,
      satisfaction: Number((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
      totalOrders: totalOrders,
      creditLimit: [10000, 25000, 50000, 100000][customerTiers.indexOf(tier)],
      paymentTerms: ["Net 30", "Net 15", "Net 45"][
        Math.floor(Math.random() * 3)
      ],
      accountManager: [
        "John Smith",
        "Sarah Johnson",
        "Mike Brown",
        "Emily Davis",
      ][Math.floor(Math.random() * 4)],
      tags: [industry, tier, Math.random() > 0.7 ? "VIP" : "Standard"].filter(
        Boolean
      ),
      notes: `${tier} tier customer in ${industry} industry`,
    };
  });

  return [...baseCustomers, ...additionalCustomers];
};

// src/context/sales/demoData.js (Add this section)

export const generatePricingRules = () => [
  {
    id: 1,
    ruleCode: "PR-1001",
    name: "Volume Discount - Premium Customers",
    ruleType: "percentage_discount",
    discountValue: 15,
    minQuantity: 10,
    maxQuantity: null,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    customerGroups: ["Premium", "Enterprise"],
    products: [],
    isActive: true,
    priority: 1,
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    ruleCode: "PR-1002",
    name: "Bulk Purchase - All Customers",
    ruleType: "tiered_pricing",
    minQuantity: 5,
    maxQuantity: null,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    customerGroups: [],
    products: [],
    isActive: true,
    priority: 2,
    tiers: [
      { minQty: 5, maxQty: 9, discount: 5 },
      { minQty: 10, maxQty: 24, discount: 10 },
      { minQty: 25, maxQty: null, discount: 15 },
    ],
    createdAt: "2024-01-01",
  },
  {
    id: 3,
    ruleCode: "PR-1003",
    name: "Seasonal Sale - Electronics",
    ruleType: "fixed_price",
    fixedPrice: 899,
    minQuantity: 1,
    maxQuantity: null,
    validFrom: "2024-06-01",
    validTo: "2024-08-31",
    customerGroups: [],
    products: [1, 4], // Laptop Pro and Monitor
    isActive: true,
    priority: 3,
    createdAt: "2024-05-15",
  },
];

export const generateDiscountSchemes = () => [
  {
    id: 1,
    schemeCode: "DS-1001",
    name: "First Order Discount",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 100,
    minQuantity: 0,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    customerGroups: ["Basic", "Standard"],
    products: [],
    isActive: true,
    maxUses: 1,
    usageCount: 45,
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    schemeCode: "DS-1002",
    name: "Buy 2 Get 1 Free - Accessories",
    discountType: "buy_x_get_y",
    discountValue: 2,
    getQuantity: 1,
    minOrderValue: 0,
    minQuantity: 3,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    customerGroups: [],
    products: [2, 3], // Mouse and USB Hub
    isActive: true,
    maxUses: null,
    usageCount: 23,
    createdAt: "2024-01-01",
  },
  {
    id: 3,
    schemeCode: "DS-1003",
    name: "Enterprise Volume Discount",
    discountType: "volume_discount",
    discountValue: 0,
    minOrderValue: 5000,
    minQuantity: 0,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    customerGroups: ["Enterprise"],
    products: [],
    isActive: true,
    maxUses: null,
    usageCount: 12,
    volumeTiers: [
      { minQty: 0, discount: 5 },
      { minQty: 10000, discount: 7 },
      { minQty: 25000, discount: 10 },
    ],
    createdAt: "2024-01-01",
  },
];

// src/context/sales/demoData.js - Add this section

export const generateInventory = () => [
  {
    id: 1,
    productId: 1,
    productName: "Laptop Pro",
    sku: "LP-001",
    availableStock: 45,
    safetyStock: 10,
    reorderPoint: 15,
    warehouse: "WH-001",
    location: "A1-02",
    lastUpdated: "2024-01-15",
  },
  {
    id: 2,
    productId: 2,
    productName: "Wireless Mouse",
    sku: "WM-002",
    availableStock: 185,
    safetyStock: 50,
    reorderPoint: 75,
    warehouse: "WH-001",
    location: "B2-15",
    lastUpdated: "2024-01-15",
  },
  {
    id: 3,
    productId: 3,
    productName: "Mechanical Keyboard",
    sku: "MK-003",
    availableStock: 32,
    safetyStock: 20,
    reorderPoint: 25,
    warehouse: "WH-001",
    location: "B2-18",
    lastUpdated: "2024-01-15",
  },
  {
    id: 4,
    productId: 4,
    productName: "Monitor 24inch",
    sku: "MN-004",
    availableStock: 28,
    safetyStock: 5,
    reorderPoint: 8,
    warehouse: "WH-001",
    location: "C3-05",
    lastUpdated: "2024-01-15",
  },
  {
    id: 5,
    productId: 5,
    productName: "Office Chair",
    sku: "OC-005",
    availableStock: 15,
    safetyStock: 5,
    reorderPoint: 8,
    warehouse: "WH-002",
    location: "D4-12",
    lastUpdated: "2024-01-15",
  },
];

export const generateStockMovements = () => [
  {
    id: 1,
    productId: 1,
    productName: "Laptop Pro",
    quantity: 50,
    type: "planned_receipt",
    expectedDate: "2024-01-20",
    reference: "PO-1001",
    status: "confirmed",
  },
  {
    id: 2,
    productId: 2,
    productName: "Wireless Mouse",
    quantity: 200,
    type: "planned_receipt",
    expectedDate: "2024-01-18",
    reference: "PO-1002",
    status: "confirmed",
  },
  {
    id: 3,
    productId: 1,
    productName: "Laptop Pro",
    quantity: 5,
    type: "reservation",
    orderId: 1,
    orderNo: "SO-1001",
    promiseDate: "2024-01-16",
    status: "reserved",
  },
  {
    id: 4,
    productId: 3,
    productName: "Mechanical Keyboard",
    quantity: 10,
    type: "reservation",
    orderId: 2,
    orderNo: "SO-1002",
    promiseDate: "2024-01-17",
    status: "reserved",
  },
];

// src/context/sales/demoData.js - Add this section

export const generateCreditLimits = () => [
  {
    id: 1,
    customerId: 1,
    customerName: "Acme Corporation",
    previousLimit: 50000,
    newLimit: 75000,
    changeDate: "2024-01-10",
    reason: "Increased based on payment history",
    changedBy: "John Smith",
    status: "Active",
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Beta Systems Ltd",
    previousLimit: 25000,
    newLimit: 50000,
    changeDate: "2024-01-05",
    reason: "New customer - standard limit",
    changedBy: "Sarah Johnson",
    status: "Active",
  },
  {
    id: 3,
    customerId: 3,
    customerName: "Gamma Tech",
    previousLimit: 10000,
    newLimit: 15000,
    changeDate: "2024-01-08",
    reason: "Good payment behavior",
    changedBy: "Mike Brown",
    status: "Active",
  },
];

export const generateCreditApplications = () => [
  {
    id: 1,
    applicationNo: "CA-1001",
    customerId: 4,
    customerName: "Delta Solutions",
    requestedLimit: 30000,
    annualRevenue: 500000,
    yearsInBusiness: 3,
    status: "Pending",
    appliedDate: "2024-01-15",
    creditScore: 720,
    riskRating: "Medium",
  },
  {
    id: 2,
    applicationNo: "CA-1002",
    customerId: 5,
    customerName: "Epsilon Industries",
    requestedLimit: 50000,
    annualRevenue: 1200000,
    yearsInBusiness: 8,
    status: "Approved",
    appliedDate: "2024-01-10",
    approvedLimit: 40000,
    decisionDate: "2024-01-12",
    decisionNotes: "Strong financials, approved with moderate limit",
    creditScore: 780,
    riskRating: "Low",
  },
];

export const generateAgingReport = () => [
  {
    id: 1,
    customerId: 1,
    customerName: "Acme Corporation",
    current: 15000,
    days30: 5000,
    days60: 2000,
    days90: 0,
    over90: 0,
    total: 22000,
    creditLimit: 75000,
    utilization: 29.3,
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Beta Systems Ltd",
    current: 8000,
    days30: 3000,
    days60: 1500,
    days90: 500,
    over90: 0,
    total: 13000,
    creditLimit: 50000,
    utilization: 26.0,
  },
  {
    id: 3,
    customerId: 3,
    customerName: "Gamma Tech",
    current: 5000,
    days30: 2000,
    days60: 0,
    days90: 0,
    over90: 0,
    total: 7000,
    creditLimit: 15000,
    utilization: 46.7,
  },
];

export const generateCreditNotes = () => [
  {
    id: 1,
    noteNo: "CN-1001",
    customerId: 1,
    customerName: "Acme Corporation",
    invoiceId: 101,
    invoiceNo: "INV-1001",
    amount: 500,
    reason: "Price adjustment",
    status: "Active",
    createdDate: "2024-01-12",
    createdBy: "John Smith",
  },
  {
    id: 2,
    noteNo: "CN-1002",
    customerId: 2,
    customerName: "Beta Systems Ltd",
    invoiceId: 102,
    invoiceNo: "INV-1002",
    amount: 250,
    reason: "Damaged goods return",
    status: "Applied",
    createdDate: "2024-01-08",
    createdBy: "Sarah Johnson",
  },
];

export const generatePaymentCollections = () => [
  {
    id: 1,
    receiptNo: "RCP-1001",
    customerId: 1,
    customerName: "Acme Corporation",
    invoiceId: 101,
    invoiceNo: "INV-1001",
    amount: 5000,
    paymentDate: "2024-01-14",
    paymentMethod: "Bank Transfer",
    reference: "BT-123456",
    status: "Completed",
    processedDate: "2024-01-14",
  },
  {
    id: 2,
    receiptNo: "RCP-1002",
    customerId: 2,
    customerName: "Beta Systems Ltd",
    invoiceId: 102,
    invoiceNo: "INV-1002",
    amount: 3000,
    paymentDate: "2024-01-12",
    paymentMethod: "Credit Card",
    reference: "CC-789012",
    status: "Completed",
    processedDate: "2024-01-12",
  },
];

