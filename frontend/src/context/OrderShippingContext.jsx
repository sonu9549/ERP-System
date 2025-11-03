// src/context/OrderShippingContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  generateOrders,
  generateMockStockLedger,
  mockProducts,
  mockWarehouses,
  mockBins,
} from "../data/mockData";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. CONTEXT CREATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Global state for Orders, Shipping, Returns, and Inventory.
 * Used across Sales, Shipping, Returns, and Inventory modules.
 */
const OrderShippingContext = createContext();

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. PROVIDER COMPONENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps the entire app in <main.jsx> to provide shared state.
 * Loads mock data once on mount.
 */
export function OrderShippingProvider({ children }) {
  // ── Orders: Sales orders from customers
  const [orders, setOrders] = useState([]);

  // ── Shipments: Physical shipments created from orders
  const [shipments, setShipments] = useState([]);

  // ── Returns: Customer return requests
  const [returns, setReturns] = useState([]);

  // ── Inventory: Core stock management
  const [products, setProducts] = useState([]); // Product master data
  const [warehouses, setWarehouses] = useState([]); // Warehouse locations
  const [bins, setBins] = useState([]); // Bin locations inside warehouses
  const [stockLedger, setStockLedger] = useState([]); // FIFO stock ledger (perpetual inventory)

  /**
   * ── Load Mock Data Once ───────────────────────────────────────────────────
   * Runs only on first render. Populates all state with realistic data.
   */
  useEffect(() => {
    if (orders.length === 0) {
      setOrders(generateOrders());
      setProducts(mockProducts);
      setWarehouses(mockWarehouses);
      setBins(mockBins);
      setStockLedger(generateMockStockLedger());
    }
  }, [orders.length]);

  /**
   * ── SHIPMENT: Create from Order ───────────────────────────────────────────
   * Called when user clicks "Create Shipment" on an order.
   * - Generates unique shipmentNo
   * - Links to order
   * - Updates order.shippingStatus to "Shipped"
   */
  const createShipmentFromOrder = (order) => {
    const newShipment = {
      id: Date.now(),
      shipmentNo: `SH-${String(shipments.length + 1001).padStart(4, "0")}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      customerAddress: order.customerAddress ?? "N/A",
      carrier: "UPS",
      trackingNo: `TRK${Date.now().toString().slice(-6)}`,
      status: "Pending",
      weight: 5.0,
      cost: 25,
      notes: "",
    };

    setShipments((prev) => [...prev, newShipment]);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              shippingStatus: "Shipped",
              shipmentNo: newShipment.shipmentNo,
            }
          : o
      )
    );
  };

  /**
   * ── SHIPMENT: Update Status ───────────────────────────────────────────────
   * Called from Shipping page when status changes (e.g., In Transit → Delivered)
   * Syncs status back to the parent order.
   */
  const updateShipmentStatus = (shipmentId, newStatus) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, status: newStatus } : s))
    );

    const shipment = shipments.find((s) => s.id === shipmentId);
    if (shipment?.orderId) {
      const statusMap = {
        Pending: "Pending",
        Shipped: "Shipped",
        "In Transit": "In Transit",
        Delivered: "Delivered",
        Cancelled: "Cancelled",
      };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === shipment.orderId
            ? { ...o, shippingStatus: statusMap[newStatus] ?? "Pending" }
            : o
        )
      );
    }
  };

  /**
   * ── RETURN: Create New Return ─────────────────────────────────────────────
   * Called from Returns module when customer requests return.
   * - Generates returnNo
   * - Links to order
   * - Updates order.returnStatus to "Returned"
   */
  const createReturn = (returnData) => {
    const newReturn = {
      id: Date.now(),
      returnNo: `RT-${String(returns.length + 1001).padStart(4, "0")}`,
      ...returnData,
      status: "Pending",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setReturns((prev) => [...prev, newReturn]);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === returnData.orderId ? { ...o, returnStatus: "Returned" } : o
      )
    );
  };

  /**
   * ── RETURN: Update Status (e.g., Refunded) ───────────────────────────────
   * Called when return is processed and refunded.
   * Updates return.status and order.returnStatus.
   */
  const updateReturnStatus = (returnId, newStatus) => {
    setReturns((prev) =>
      prev.map((r) => (r.id === returnId ? { ...r, status: newStatus } : r))
    );

    if (newStatus === "Refunded") {
      const ret = returns.find((r) => r.id === returnId);
      if (ret?.orderId) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === ret.orderId ? { ...o, returnStatus: "Refunded" } : o
          )
        );
      }
    }
  };

  /**
   * ── STOCK: Add Transaction (FIFO-Safe) ───────────────────────────────────
   * Core inventory engine. Called on GRN, Issue, Transfer, Adjustment.
   * - Prevents negative stock
   * - Maintains running balance per product/warehouse/bin
   * - Supports batch/expiry
   */
  const addStockTransaction = (tx) => {
    setStockLedger((prev) => {
      // Calculate current balance for this product + location
      const currentBalance = prev
        .filter(
          (t) =>
            t.product_id === tx.product_id &&
            t.warehouse_id === tx.warehouse_id &&
            t.bin_id === tx.bin_id
        )
        .reduce((sum, t) => sum + t.qty_in - t.qty_out, 0);

      const newBalance = tx.transaction_type.includes("in")
        ? currentBalance + tx.qty
        : currentBalance - tx.qty;

      // Block negative stock
      if (newBalance < 0) {
        alert("Error: Cannot issue more than available stock!");
        return prev;
      }

      // Add new ledger entry
      return [
        ...prev,
        {
          ...tx,
          id: Date.now() + Math.random(),
          balance: newBalance,
          created_at: new Date().toISOString(),
        },
      ];
    });
  };

  /**
   * ── PROVIDE CONTEXT VALUE ────────────────────────────────────────────────
   * All state + functions are exposed to consuming components.
   */
  return (
    <OrderShippingContext.Provider
      value={{
        // ── Orders & Shipping
        orders,
        setOrders,
        shipments,
        setShipments,
        createShipmentFromOrder,
        updateShipmentStatus,

        // ── Returns
        returns,
        setReturns,
        createReturn,
        updateReturnStatus,

        // ── Inventory
        products,
        setProducts,
        warehouses,
        setWarehouses,
        bins,
        setBins,
        stockLedger,
        setStockLedger,
        addStockTransaction,
      }}
    >
      {children}
    </OrderShippingContext.Provider>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. CUSTOM HOOK
 * ─────────────────────────────────────────────────────────────────────────────
 * Safe hook to access context. Throws error if used outside provider.
 */
export function useOrderShipping() {
  const context = useContext(OrderShippingContext);
  if (!context) {
    throw new Error(
      "useOrderShipping must be used within <OrderShippingProvider>"
    );
  }
  return context;
}
