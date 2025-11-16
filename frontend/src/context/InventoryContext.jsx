// src/context/InventoryContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from "react";

const InventoryContext = createContext();

// Low stock threshold
const LOW_STOCK_THRESHOLD = 5;

// Initial state
const initialState = {
  warehouses: [],
  bins: [],
  stockLedger: [],
  productMap: {}, // { product_id: product_name }
  loading: true,
  error: null,
};

// Reducer
const inventoryReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOAD_DATA":
      return { ...state, ...action.payload, loading: false };
    case "ADD_STOCK_TX":
      return { ...state, stockLedger: [...state.stockLedger, action.payload] };
    case "CLEAR_LEDGER":
      return { ...state, stockLedger: [] };
    default:
      return state;
  }
};

export const InventoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // Load from localStorage or mock data
  useEffect(() => {
    const saved = localStorage.getItem("erp_inventory_ledger");
    if (saved) {
      try {
        const ledger = JSON.parse(saved);
        const productMap = {};
        ledger.forEach((tx) => {
          productMap[tx.product_id] = tx.product_name;
        });
        dispatch({
          type: "LOAD_DATA",
          payload: {
            stockLedger: ledger,
            productMap,
            warehouses: [{ id: 1, name: "Main Warehouse" }],
            bins: [{ id: 1, name: "A1" }],
          },
        });
        return;
      } catch (e) {
        console.error("Failed to load ledger", e);
      }
    }

    // Mock data fallback
    const mockLedger = [
      {
        id: 1,
        product_id: "LAPTOP-001",
        product_name: "Dell XPS 13",
        warehouse_id: 1,
        warehouse_name: "Main Warehouse",
        bin_id: 1,
        bin_name: "A1",
        transaction_type: "in",
        qty: 10,
        reference: "GRN-2025-001",
        notes: "Initial stock",
        created_at: "2025-11-10T10:00:00Z",
      },
      {
        id: 2,
        product_id: "LAPTOP-001",
        product_name: "Dell XPS 13",
        warehouse_id: 1,
        warehouse_name: "Main Warehouse",
        bin_id: 1,
        bin_name: "A1",
        transaction_type: "issue",
        qty: 3,
        reference: "SO-0001",
        notes: "Sales order",
        created_at: "2025-11-11T14:00:00Z",
      },
      {
        id: 3,
        product_id: "CHAIR-001",
        product_name: "Ergonomic Chair",
        warehouse_id: 1,
        warehouse_name: "Main Warehouse",
        bin_id: 1,
        bin_name: "A1",
        transaction_type: "in",
        qty: 20,
        reference: "GRN-2025-002",
        notes: "Furniture delivery",
        created_at: "2025-11-12T09:00:00Z",
      },
    ];

    const productMap = {
      "LAPTOP-001": "Dell XPS 13",
      "CHAIR-001": "Ergonomic Chair",
    };

    dispatch({
      type: "LOAD_DATA",
      payload: {
        stockLedger: mockLedger,
        productMap,
        warehouses: [{ id: 1, name: "Main Warehouse" }],
        bins: [{ id: 1, name: "A1" }],
      },
    });
  }, []);

  // Auto-save ledger
  useEffect(() => {
    if (!state.loading && state.stockLedger.length > 0) {
      localStorage.setItem(
        "erp_inventory_ledger",
        JSON.stringify(state.stockLedger)
      );
    }
  }, [state.stockLedger, state.loading]);

  // Add stock transaction
  const addStockTransaction = (tx) => {
    const {
      product_id,
      warehouse_id = 1,
      bin_id = 1,
      transaction_type,
      qty,
    } = tx;

    if (
      !product_id ||
      qty <= 0 ||
      !["in", "issue", "return"].includes(transaction_type)
    ) {
      console.error("Invalid transaction", tx);
      return null;
    }

    const current = getCurrentStock(product_id, warehouse_id, bin_id);
    const newBalance =
      transaction_type === "in" || transaction_type === "return"
        ? current + qty
        : current - qty;

    if (newBalance < 0) {
      alert(`Not enough stock! Available: ${current}`);
      return null;
    }

    const product_name = state.productMap[product_id] || product_id;
    const warehouse = state.warehouses.find((w) => w.id === warehouse_id);
    const bin = state.bins.find((b) => b.id === bin_id);

    const entry = {
      ...tx,
      id: Date.now() + Math.random(),
      product_name:
        tx.product_name || state.productMap[tx.product_id] || "Unknown",
      warehouse_name: warehouse?.name || "Unknown",
      bin_name: bin?.name || "Unknown",
      balance: newBalance,
      qty_in: tx.transaction_type.includes("in") ? tx.qty : 0,
      qty_out: tx.transaction_type.includes("out") ? tx.qty : 0,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: "ADD_STOCK_TX", payload: entry });
    return entry;
  };

  // Get current stock for a specific product/location
  const getCurrentStock = (productId, warehouseId = 1, binId = 1) => {
    return state.stockLedger
      .filter(
        (t) =>
          t.product_id === productId &&
          t.warehouse_id === warehouseId &&
          t.bin_id === binId
      )
      .reduce(
        (sum, t) =>
          sum +
          (t.transaction_type === "in" || t.transaction_type === "return"
            ? t.qty
            : -t.qty),
        0
      );
  };

  // Live stock summary (array, not function)
  const stockSummary = useMemo(() => {
    const map = {};
    state.stockLedger.forEach((tx) => {
      const key = `${tx.product_id}-${tx.warehouse_id}-${tx.bin_id}`;
      if (!map[key]) {
        map[key] = {
          product_id: tx.product_id,
          product_name: tx.product_name,
          warehouse_id: tx.warehouse_id,
          warehouse_name: tx.warehouse_name,
          bin_id: tx.bin_id,
          bin_name: tx.bin_name,
          stock: 0,
        };
      }
      map[key].stock +=
        tx.transaction_type === "in" || tx.transaction_type === "return"
          ? tx.qty
          : -tx.qty;
    });
    return Object.values(map)
      .filter((s) => s.stock > 0)
      .sort((a, b) => b.stock - a.stock);
  }, [state.stockLedger]);

  // Low stock alert
  useEffect(() => {
    const lowStock = stockSummary.filter(
      (s) => s.stock <= LOW_STOCK_THRESHOLD && s.stock > 0
    );
    lowStock.forEach((item) => {
      console.log(`Low Stock: ${item.product_name} (${item.stock} left)`);
      // In real: sendEmail()
      // toast.warning(`Low Stock: ${item.product_name}`);
    });
  }, [stockSummary]);

  // Clear ledger (for testing)
  const clearLedger = () => {
    dispatch({ type: "CLEAR_LEDGER" });
    localStorage.removeItem("erp_inventory_ledger");
  };

  const value = {
    // State
    warehouses: state.warehouses,
    bins: state.bins,
    stockLedger: state.stockLedger,
    productMap: state.productMap,
    loading: state.loading,
    error: state.error,

    // Computed
    stockSummary, // ← Direct array

    // Actions
    addStockTransaction,
    getCurrentStock,
    clearLedger,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};
