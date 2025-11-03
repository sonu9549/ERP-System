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

// ── 4. Generate Orders (Realistic) ───────────────────────────────────
export const generateOrders = () => {
  const statuses = ["Draft", "Confirmed", "Shipped", "Delivered", "Cancelled"];
  const shippingStatuses = [
    "Pending",
    "Shipped",
    "In Transit",
    "Delivered",
    "Cancelled",
  ];

  const base = [
    {
      id: 1,
      orderNo: "SO-1001",
      customerId: 1,
      customerName: "Acme Corp",
      customerEmail: "contact@acme.com",
      customerAddress: "123 Main St, NY",
      orderDate: "2025-03-15",
      status: "Confirmed",
      items: [
        {
          productId: 1,
          productName: "Laptop Pro",
          qty: 2,
          price: 1299,
          total: 2598,
        },
        {
          productId: 2,
          productName: "Wireless Mouse",
          qty: 5,
          price: 49,
          total: 245,
        },
      ],
      subtotal: 2843,
      tax: 284.3,
      total: 3127.3,
      shippingStatus: "Pending",
      shipmentNo: null,
      carrier: null,
    },
  ];

  const random = Array.from({ length: 18 }, (_, i) => {
    const cust = customers[Math.floor(Math.random() * customers.length)];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items = Array.from({ length: itemCount }, () => {
      const prod = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      return {
        productId: prod.id,
        productName: prod.name,
        qty,
        price: prod.price,
        total: qty * prod.price,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const tax = subtotal * 0.1;
    const hasShipment = Math.random() > 0.5;
    const carrier = hasShipment
      ? carriers[Math.floor(Math.random() * carriers.length)]
      : null;

    return {
      id: i + 2,
      orderNo: `SO-${String(1002 + i).padStart(4, "0")}`,
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      customerAddress: cust.address,
      orderDate: `2025-${String(Math.floor(Math.random() * 3) + 1).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      shippingStatus: hasShipment
        ? shippingStatuses.slice(1)[Math.floor(Math.random() * 4)]
        : "Pending",
      shipmentNo: hasShipment
        ? `SH-${String(1002 + i).padStart(4, "0")}`
        : null,
      carrier: carrier ? { id: carrier.id, name: carrier.name } : null,
    };
  });

  return [...base, ...random];
};

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
