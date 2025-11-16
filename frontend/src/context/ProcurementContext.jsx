// src/context/ProcurementContext.jsx
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useInventory } from "./InventoryContext";

const ProcurementContext = createContext();

/* ------------------------------------------------------------------ */
/* Initial State                                                      */
/* ------------------------------------------------------------------ */
const initialState = {
  prs: [],
  rfqs: [],
  quotes: [],
  pos: [],
  grns: [],
  invoices: [],
  payments: [],
  stats: {
    totalPR: 0,
    pendingPR: 0,
    approvedPR: 0,
    totalSpend: 0,
    overduePO: 0,
    totalSuppliers: 0,
    activeRFQs: 0,
    avgApprovalTime: 0,
    monthlySpend: [],
    topCategories: [],
    recentPRs: [],
  },
  settings: {
    approvalMatrix: [],
    budgetAllocation: [],
    emailTemplates: {},
  },
  loading: true,
  error: null,
};

/* ------------------------------------------------------------------ */
/* Unique ID Generator                                                */
/* ------------------------------------------------------------------ */
let globalIdCounter = 1000000;
const generateId = () => ++globalIdCounter;

/* ------------------------------------------------------------------ */
/* Reducer                                                            */
/* ------------------------------------------------------------------ */
function procurementReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload, error: null };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_DATA":
      return {
        ...state,
        prs: action.payload.prs,
        stats: action.payload.stats,
        loading: false,
        error: null,
      };

    case "SET_POS":
      return { ...state, pos: action.payload, loading: false, error: null };

    case "SET_GRNS":
      return { ...state, grns: action.payload, loading: false, error: null };

    case "ADD_PR": {
      const newPR = action.payload;
      return {
        ...state,
        prs: [newPR, ...state.prs],
        stats: {
          ...state.stats,
          totalPR: state.stats.totalPR + 1,
          pendingPR: state.stats.pendingPR + 1,
          totalSpend: state.stats.totalSpend + newPR.amount,
        },
      };
    }

    case "UPDATE_PR_STATUS": {
      const { id, status } = action.payload;
      const pr = state.prs.find((p) => p.id === id);
      if (!pr) return state;

      const prevStatus = pr.status;
      const isLeavingPending = prevStatus === "pending" && status !== "pending";
      const isEnteringApproved =
        status === "approved" && prevStatus !== "approved";
      const isLeavingApproved =
        prevStatus === "approved" && status !== "approved";

      const statUpdates = {
        ...(isLeavingPending && { pendingPR: state.stats.pendingPR - 1 }),
        ...(isEnteringApproved && { approvedPR: state.stats.approvedPR + 1 }),
        ...(isLeavingApproved && { approvedPR: state.stats.approvedPR - 1 }),
        ...(status === "approved" && {
          totalSpend: state.stats.totalSpend + pr.amount,
        }),
      };

      return {
        ...state,
        prs: state.prs.map((p) => (p.id === id ? { ...p, status } : p)),
        stats: { ...state.stats, ...statUpdates },
      };
    }

    case "ADD_RFQ": {
      const newRFQ = action.payload;
      return {
        ...state,
        rfqs: [newRFQ, ...state.rfqs],
        stats: {
          ...state.stats,
          activeRFQs: state.stats.activeRFQs + 1,
        },
      };
    }

    case "ADD_QUOTE": {
      const newQuote = action.payload;
      return {
        ...state,
        quotes: [newQuote, ...state.quotes],
      };
    }

    case "AWARD_PO": {
      const { quote, pr, po } = action.payload;
      return {
        ...state,
        pos: [po, ...state.pos],
        quotes: state.quotes.map((q) =>
          q.id === quote.id ? { ...q, status: "awarded" } : q
        ),
        stats: {
          ...state.stats,
          activeRFQs: Math.max(0, state.stats.activeRFQs - 1),
        },
      };
    }

    case "UPDATE_PO": {
      const { id, updates } = action.payload;
      return {
        ...state,
        pos: state.pos.map((po) => (po.id === id ? { ...po, ...updates } : po)),
      };
    }

    case "CANCEL_PO": {
      const { id } = action.payload;
      return {
        ...state,
        pos: state.pos.map((po) =>
          po.id === id ? { ...po, status: "cancelled" } : po
        ),
      };
    }

    case "CREATE_GRN": {
      const { grn, poId, receivedQty } = action.payload;
      return {
        ...state,
        grns: [grn, ...state.grns],
        pos: state.pos.map((po) =>
          po.id === poId
            ? {
                ...po,
                items: po.items.map((item) => ({
                  ...item,
                  received:
                    (item.received || 0) + (receivedQty[item.description] || 0),
                })),
                status: grn.status === "completed" ? "delivered" : po.status,
              }
            : po
        ),
      };
    }

    case "UPDATE_GRN": {
      const { id, updates } = action.payload;
      return {
        ...state,
        grns: state.grns.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      };
    }

    case "CANCEL_GRN": {
      const { id } = action.payload;
      return {
        ...state,
        grns: state.grns.filter((g) => g.id !== id),
      };
    }

    case "SET_INVOICES":
      return { ...state, invoices: action.payload, loading: false };
    case "SET_PAYMENTS":
      return { ...state, payments: action.payload, loading: false };
    case "ADD_PAYMENT":
      return { ...state, payments: [action.payload, ...state.payments] };
    case "UPDATE_PAYMENT_STATUS":
      return {
        ...state,
        payments: state.payments.map((p) =>
          p.id === action.payload.id
            ? { ...p, status: action.payload.status }
            : p
        ),
      };
    case "LOAD_SETTINGS":
      return { ...state, settings: action.payload };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */
export function ProcurementProvider({ children }) {
  const { addStockTransaction } = useInventory();
  const [state, dispatch] = useReducer(procurementReducer, initialState);

  /* ----------------------- MOCK: fetchPRs ----------------------- */
  const fetchPRs = useCallback(() => {
    dispatch({ type: "SET_LOADING", payload: true });
    setTimeout(() => {
      const mockPRs = [
        {
          id: generateId(),
          pr_number: "PR-2025-1101",
          user: "Rahul",
          dept: "IT",
          amount: 45000,
          status: "pending",
          items: [{ description: "Laptop", qty: 5, rate: 9000, amount: 45000 }],
          created_at: "2025-11-10",
        },
        {
          id: generateId(),
          pr_number: "PR-2025-1102",
          user: "Priya",
          dept: "HR",
          amount: 89000,
          status: "approved",
          items: [
            { description: "Office Chair", qty: 10, rate: 8900, amount: 89000 },
          ],
          created_at: "2025-11-09",
        },
        {
          id: generateId(),
          pr_number: "PR-2025-1103",
          user: "Amit",
          dept: "Operations",
          amount: 120000,
          status: "pending",
          items: [
            { description: "Printer", qty: 2, rate: 60000, amount: 120000 },
          ],
          created_at: "2025-11-08",
        },
      ];

      const stats = {
        totalPR: mockPRs.length,
        pendingPR: mockPRs.filter((p) => p.status === "pending").length,
        approvedPR: mockPRs.filter((p) => p.status === "approved").length,
        totalSpend: mockPRs.reduce((sum, p) => sum + p.amount, 0),
        overduePO: 3,
        totalSuppliers: 47,
        activeRFQs: 0,
        avgApprovalTime: 2.4,
        monthlySpend: [
          { month: "Jul", amount: 320000 },
          { month: "Aug", amount: 480000 },
          { month: "Sep", amount: 620000 },
          { month: "Oct", amount: 750000 },
          { month: "Nov", amount: 485000 },
        ],
        topCategories: [
          { name: "IT Hardware", value: 35 },
          { name: "Office Supplies", value: 25 },
          { name: "Services", value: 20 },
          { name: "Furniture", value: 12 },
          { name: "Others", value: 8 },
        ],
        recentPRs: mockPRs.slice(0, 3).map((p) => ({
          id: p.id,
          pr_number: p.pr_number,
          dept: p.dept,
          amount: p.amount,
          status: p.status,
        })),
      };

      dispatch({ type: "SET_DATA", payload: { prs: mockPRs, stats } });
    }, 800);
  }, []);

  /* ----------------------- MOCK: fetchPOs ----------------------- */
  const fetchPOs = useCallback(() => {
    setTimeout(() => {
      const mockPOs = [
        {
          id: generateId(),
          po_number: "PO-2025-0001",
          supplier: "TechCorp Ltd.",
          amount: 45000,
          pr_number: "PR-2025-1101",
          issue_date: "2025-11-10",
          due_date: "2025-11-20",
          status: "pending",
          items: [
            {
              description: "Laptop",
              qty: 5,
              rate: 9000,
              amount: 45000,
              received: 0,
            },
          ],
        },
        {
          id: generateId(),
          po_number: "PO-2025-0002",
          supplier: "OfficeWorld",
          amount: 89000,
          pr_number: "PR-2025-1102",
          issue_date: "2025-11-09",
          due_date: "2025-11-19",
          status: "delivered",
          items: [
            {
              description: "Office Chair",
              qty: 10,
              rate: 8900,
              amount: 89000,
              received: 10,
            },
          ],
        },
      ];
      dispatch({ type: "SET_POS", payload: mockPOs });
    }, 600);
  }, []);

  /* ----------------------- MOCK: fetchGRNs ----------------------- */
  const fetchGRNs = useCallback(() => {
    setTimeout(() => {
      const mockGRNs = [
        {
          id: generateId(),
          grn_number: "GRN-2025-0001",
          po_number: "PO-2025-0002",
          received_date: "2025-11-12",
          status: "completed",
          items: [{ description: "Office Chair", qty: 10 }],
        },
        {
          id: generateId(),
          grn_number: "GRN-2025-0002",
          po_number: "PO-2025-0001",
          received_date: "2025-11-13",
          status: "partial",
          items: [{ description: "Laptop", qty: 3 }],
        },
      ];
      dispatch({ type: "SET_GRNS", payload: mockGRNs });
    }, 500);
  }, []);

  /* ----------------------- MOCK: fetchInvoices ----------------------- */
  const fetchInvoices = useCallback(() => {
    setTimeout(() => {
      const mockInvoices = [
        {
          id: 1,
          invoice_number: "INV-2025-1101",
          po_number: "PO-2025-0002",
          vendor: "OfficeMart",
          amount: 102660,
          due_date: "2025-11-20",
          received_date: "2025-11-12",
          status: "matched",
        },
        {
          id: 2,
          invoice_number: "INV-2025-1102",
          po_number: "PO-2025-0001",
          vendor: "TechSolutions",
          amount: 49680,
          due_date: "2025-11-18",
          received_date: "2025-11-13",
          status: "matched",
        },
      ];
      dispatch({ type: "SET_INVOICES", payload: mockInvoices });
    }, 600);
  }, []);

  /* ----------------------- MOCK: fetchStats ----------------------- */
  const fetchStats = useCallback(() => {
    dispatch({ type: "SET_LOADING", payload: true });
    setTimeout(() => {
      const mockStats = {
        totalPR: state.prs.length,
        pendingPR: state.prs.filter((p) => p.status === "pending").length,
        approvedPR: state.prs.filter((p) => p.status === "approved").length,
        totalSpend: state.prs.reduce((s, p) => s + p.amount, 0),
        overduePO: state.pos.filter(
          (p) => new Date(p.due_date) < new Date() && p.status !== "delivered"
        ).length,
        totalSuppliers: 47,
        activeRFQs: state.rfqs.length,
        avgApprovalTime: 2.4,
        monthlySpend: [
          { month: "Jul", amount: 320000 },
          { month: "Aug", amount: 480000 },
          { month: "Sep", amount: 620000 },
          { month: "Oct", amount: 750000 },
          { month: "Nov", amount: 485000 },
        ],
        topCategories: [
          { name: "IT Hardware", value: 35 },
          { name: "Office Supplies", value: 25 },
          { name: "Services", value: 20 },
          { name: "Furniture", value: 12 },
          { name: "Others", value: 8 },
        ],
        recentPRs: state.prs.slice(0, 3).map((p) => ({
          id: p.id,
          pr_number: p.pr_number,
          dept: p.dept,
          amount: p.amount,
          status: p.status,
        })),
      };
      dispatch({
        type: "SET_DATA",
        payload: { prs: state.prs, stats: mockStats },
      });
    }, 300);
  }, []); //state.prs, state.pos, state.rfqs

  /* ----------------------- Auto-load on mount ----------------------- */
  useEffect(() => {
    fetchPRs();
    fetchPOs();
    fetchGRNs();
    fetchInvoices();
    fetchStats();

    // call stats once after initial mock load
    const timer = setTimeout(() => fetchStats(), 1500);
    return () => clearTimeout(timer);
  }, [fetchPRs, fetchPOs, fetchGRNs, fetchInvoices, fetchStats]);

  /* ----------------------- PR Actions ----------------------- */
  const raisePR = useCallback((prData) => {
    const newPR = {
      ...prData,
      id: generateId(),
      pr_number: `PR-2025-${String(globalIdCounter).slice(-4)}`,
      status: "pending",
      created_at: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "ADD_PR", payload: newPR });
    return newPR;
  }, []);

  const approvePR = useCallback((id) => {
    dispatch({ type: "UPDATE_PR_STATUS", payload: { id, status: "approved" } });
  }, []);

  const rejectPR = useCallback((id) => {
    dispatch({ type: "UPDATE_PR_STATUS", payload: { id, status: "rejected" } });
  }, []);

  /* ----------------------- RFQ & Quote ----------------------- */
  const raiseRFQ = useCallback((data) => {
    const newRFQ = {
      id: generateId(),
      pr_number: data.pr_number,
      suppliers: data.suppliers,
      status: "sent",
      sent_at: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "ADD_RFQ", payload: newRFQ });
    return newRFQ;
  }, []);

  const receiveQuote = useCallback((quoteData) => {
    const newQuote = {
      id: generateId(),
      rfq_id: quoteData.rfq_id,
      supplier: quoteData.supplier,
      amount: quoteData.amount,
      valid_till: quoteData.valid_till,
      status: "received",
    };
    dispatch({ type: "ADD_QUOTE", payload: newQuote });
    return newQuote;
  }, []);

  const awardPO = useCallback((quote, pr, po) => {
    dispatch({ type: "AWARD_PO", payload: { quote, pr, po } });
  }, []);

  /* ----------------------- PO Actions ----------------------- */
  const updatePO = useCallback((id, updates) => {
    dispatch({ type: "UPDATE_PO", payload: { id, updates } });
  }, []);

  const cancelPO = useCallback((id) => {
    dispatch({ type: "CANCEL_PO", payload: { id } });
  }, []);

  /* ----------------------- GRN Actions ----------------------- */
  const createGRN = useCallback(
    (grn, poId, receivedQty) => {
      dispatch({ type: "CREATE_GRN", payload: { grn, poId, receivedQty } });
      Object.entries(receivedQty).forEach(([desc, qty]) => {
        if (qty > 0) {
          addStockTransaction({
            product_id: desc,
            product_name: desc,
            warehouse_id: 1,
            bin_id: 1,
            transaction_type: "in",
            qty,
            reference: grn.grn_number,
            notes: `GRN Receipt - ${grn.po_number}`,
          });
        }
      });
    },
    [addStockTransaction]
  );

  const updateGRN = useCallback((id, updates) => {
    dispatch({ type: "UPDATE_GRN", payload: { id, updates } });
  }, []);

  const cancelGRN = useCallback((id) => {
    dispatch({ type: "CANCEL_GRN", payload: { id } });
  }, []);

  const makePayment = useCallback((payment) => {
    dispatch({ type: "ADD_PAYMENT", payload: payment });
  }, []);

  const updatePaymentStatus = useCallback((id, status) => {
    dispatch({ type: "UPDATE_PAYMENT_STATUS", payload: { id, status } });
  }, []);

  /* ----------------------- Settings ----------------------- */
  const loadSettings = useCallback(() => {
    const saved = localStorage.getItem("procurementSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      dispatch({ type: "LOAD_SETTINGS", payload: parsed });
      return parsed;
    }
    return null;
  }, []);

  const saveSettings = useCallback((newSettings) => {
    localStorage.setItem("procurementSettings", JSON.stringify(newSettings));
    dispatch({ type: "UPDATE_SETTINGS", payload: newSettings });
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* ----------------------- Context Value ----------------------- */
  const value = useMemo(
    () => ({
      prs: state.prs,
      rfqs: state.rfqs,
      quotes: state.quotes,
      pos: state.pos,
      grns: state.grns,
      invoices: state.invoices,
      payments: state.payments,
      stats: state.stats,
      loading: state.loading,
      error: state.error,

      fetchPRs,
      fetchPOs,
      fetchGRNs,
      fetchInvoices,
      fetchStats, // ← Now works with mock

      raisePR,
      approvePR,
      rejectPR,
      raiseRFQ,
      receiveQuote,
      awardPO,
      updatePO,
      cancelPO,
      createGRN,
      updateGRN,
      cancelGRN,
      makePayment,
      updatePaymentStatus,

      settings: state.settings,
      loadSettings,
      saveSettings,
    }),
    [
      state.prs,
      state.rfqs,
      state.quotes,
      state.pos,
      state.grns,
      state.invoices,
      state.payments,
      state.stats,
      state.loading,
      state.error,
      state.settings,
      fetchPRs,
      fetchPOs,
      fetchGRNs,
      fetchInvoices,
      fetchStats,
      raisePR,
      approvePR,
      rejectPR,
      raiseRFQ,
      receiveQuote,
      awardPO,
      updatePO,
      cancelPO,
      createGRN,
      updateGRN,
      cancelGRN,
      makePayment,
      updatePaymentStatus,
      loadSettings,
      saveSettings,
    ]
  );

  return (
    <ProcurementContext.Provider value={value}>
      {children}
    </ProcurementContext.Provider>
  );
}

export const useProcurement = () => {
  const context = useContext(ProcurementContext);
  if (!context)
    throw new Error("useProcurement must be used within ProcurementProvider");
  return context;
};
