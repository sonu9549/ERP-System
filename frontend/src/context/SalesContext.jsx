// src/modules/sales/SalesContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import {
  generateOrders,
  generateMockStockLedger,
  mockProducts,
  mockWarehouses,
  mockBins,
} from "../data/salesData";

// === Context ===
const SalesContext = createContext();

// === Initial State ===
const initialState = {
  // Sales
  orders: [],
  invoices: [],
  customers: [],
  products: [],
  quotations: [],
  filters: { status: "all", dateRange: "all", customer: "all" },

  // Shipping & Returns
  shipments: [],
  returns: [],

  // Inventory
  warehouses: [],
  bins: [],
  stockLedger: [],

  loading: false,
  error: null,
};

// === Reducer ===
const salesReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOAD_DATA":
      return { ...state, ...action.payload, loading: false };

    // Sales
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case "DELETE_ORDER":
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
      };
    case "ADD_INVOICE":
      return { ...state, invoices: [...state.invoices, action.payload] };
    case "ADD_QUOTATION":
      return { ...state, quotations: [...state.quotations, action.payload] };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    // Shipping
    case "ADD_SHIPMENT":
      return { ...state, shipments: [...state.shipments, action.payload] };
    case "UPDATE_SHIPMENT":
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    // Returns
    case "ADD_RETURN":
      return { ...state, returns: [...state.returns, action.payload] };
    case "UPDATE_RETURN":
      return {
        ...state,
        returns: state.returns.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    // Inventory
    case "ADD_STOCK_TX":
      return { ...state, stockLedger: [...state.stockLedger, action.payload] };

    default:
      return state;
  }
};

// === Provider (All in One) ===
export const SalesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(salesReducer, initialState);

  // === Load Mock Data Once ===
  useEffect(() => {
    if (state.orders.length === 0) {
      const mockOrders = generateOrders();
      const mockStock = generateMockStockLedger();

      dispatch({
        type: "LOAD_DATA",
        payload: {
          orders: mockOrders,
          products: mockProducts,
          warehouses: mockWarehouses,
          bins: mockBins,
          stockLedger: mockStock,
          customers: mockOrders
            .map((o) => ({
              id: o.customerId,
              name: o.customerName,
              email: o.customerEmail || "N/A",
            }))
            .filter((c, i, a) => a.findIndex((t) => t.id === c.id) === i),
        },
      });
    }
  }, []);

  // === Auto-save to localStorage ===
  useEffect(() => {
    localStorage.setItem(
      "erp_sales_data",
      JSON.stringify({
        orders: state.orders,
        invoices: state.invoices,
        customers: state.customers,
        products: state.products,
        quotations: state.quotations,
        shipments: state.shipments,
        returns: state.returns,
        stockLedger: state.stockLedger,
      })
    );
  }, [state]);

  // === Actions ===

  // ── SALES ──
  const addOrder = (orderData) => {
    const newOrder = {
      id: Date.now(),
      orderNo: `SO-${String(state.orders.length + 1).padStart(4, "0")}`,
      ...orderData,
      status: "Confirmed",
      shippingStatus: "Pending",
      returnStatus: "None",
      createdAt: new Date().toISOString().split("T")[0],
    };

    dispatch({ type: "ADD_ORDER", payload: newOrder });

    // Auto-create shipment
    createShipmentFromOrder(newOrder);

    // Auto-stock out
    newOrder.items?.forEach((item) => {
      addStockTransaction({
        product_id: item.productId,
        warehouse_id: 1,
        bin_id: 1,
        transaction_type: "issue",
        qty: item.quantity,
        reference: newOrder.orderNo,
        notes: `Sales Order ${newOrder.orderNo}`,
      });
    });

    return newOrder;
  };

  const updateOrder = (updatedOrder) => {
    dispatch({ type: "UPDATE_ORDER", payload: updatedOrder });
    const shipment = state.shipments.find((s) => s.orderId === updatedOrder.id);
    if (shipment && updatedOrder.shippingStatus) {
      updateShipmentStatus(shipment.id, updatedOrder.shippingStatus);
    }
  };

  const deleteOrder = (id) => dispatch({ type: "DELETE_ORDER", payload: id });

  const generateInvoice = (order) => {
    const invoice = {
      id: Date.now(),
      invoiceNo: `INV-${String(state.invoices.length + 1).padStart(4, "0")}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customer: order.customerName,
      items: order.items,
      total: order.total,
      tax: order.tax || 0,
      grandTotal: (order.total || 0) + (order.tax || 0),
      status: "Unpaid",
      issueDate: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "ADD_INVOICE", payload: invoice });
    return invoice;
  };

  const addQuotation = (quotation) => {
    const newQuotation = {
      id: Date.now(),
      quoteNo: `QT-${String(state.quotations.length + 1).padStart(4, "0")}`,
      ...quotation,
      status: "Draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "ADD_QUOTATION", payload: newQuotation });
    return newQuotation;
  };

  const setFilters = (filters) =>
    dispatch({ type: "SET_FILTERS", payload: filters });

  // ── SHIPPING ──
  const createShipmentFromOrder = (order) => {
    const newShipment = {
      id: Date.now(),
      shipmentNo: `SH-${String(state.shipments.length + 1001).padStart(
        4,
        "0"
      )}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      customerAddress: order.customerAddress || "N/A",
      carrier: "UPS",
      trackingNo: `TRK${Date.now().toString().slice(-6)}`,
      status: "Pending",
      weight: 5.0,
      cost: 25,
      notes: "",
      createdAt: new Date().toISOString().split("T")[0],
    };

    dispatch({ type: "ADD_SHIPMENT", payload: newShipment });
    return newShipment;
  };

  const updateShipmentStatus = (shipmentId, newStatus) => {
    dispatch({
      type: "UPDATE_SHIPMENT",
      payload: { id: shipmentId, status: newStatus },
    });

    const shipment = state.shipments.find((s) => s.id === shipmentId);
    if (shipment?.orderId) {
      const statusMap = {
        Pending: "Pending",
        Shipped: "Shipped",
        "In Transit": "In Transit",
        Delivered: "Delivered",
        Cancelled: "Cancelled",
      };
      dispatch({
        type: "UPDATE_ORDER",
        payload: {
          id: shipment.orderId,
          shippingStatus: statusMap[newStatus] || "Pending",
        },
      });
    }
  };

  // ── RETURNS ──
  const createReturn = (returnData) => {
    const newReturn = {
      id: Date.now(),
      returnNo: `RT-${String(state.returns.length + 1001).padStart(4, "0")}`,
      ...returnData,
      status: "Pending",
      createdAt: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "ADD_RETURN", payload: newReturn });

    dispatch({
      type: "UPDATE_ORDER",
      payload: { id: returnData.orderId, returnStatus: "Returned" },
    });
    return newReturn;
  };

  const updateReturnStatus = (returnId, newStatus) => {
    dispatch({
      type: "UPDATE_RETURN",
      payload: { id: returnId, status: newStatus },
    });

    if (newStatus === "Refunded") {
      const ret = state.returns.find((r) => r.id === returnId);
      if (ret?.orderId) {
        dispatch({
          type: "UPDATE_ORDER",
          payload: { id: ret.orderId, returnStatus: "Refunded" },
        });
      }
    }
  };

  // ── INVENTORY ──
  const addStockTransaction = (tx) => {
    const currentBalance = state.stockLedger
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

    if (newBalance < 0) {
      alert("Error: Cannot issue more than available stock!");
      return;
    }

    const ledgerEntry = {
      ...tx,
      id: Date.now() + Math.random(),
      balance: newBalance,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: "ADD_STOCK_TX", payload: ledgerEntry });
  };

  // === Value ===
  const value = {
    // State
    ...state,

    // Actions
    addOrder,
    updateOrder,
    deleteOrder,
    generateInvoice,
    addQuotation,
    setFilters,

    createShipmentFromOrder,
    updateShipmentStatus,

    createReturn,
    updateReturnStatus,

    addStockTransaction,
  };

  return (
    <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
  );
};

// === Hook ===
export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSales must be used within SalesProvider");
  }
  return context;
};
