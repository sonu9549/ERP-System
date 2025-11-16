// src/context/PlantMaintenanceContext.jsx
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from "react";

const PlantMaintenanceContext = createContext();

const initialState = {
  assets: [],
  workOrders: [],
  pmSchedules: [],
  technicians: [],
  spareParts: [],
  stats: {
    totalAssets: 0,
    criticalAssets: 0,
    openWOs: 0,
    overduePM: 0,
    mttr: 0,
    mtbf: 0,
    downtimeHours: 0,
    recentWOs: [],
  },
  settings: {
    priorities: ["Low", "Medium", "High", "Critical"],
    categories: [
      "Electrical",
      "Mechanical",
      "Hydraulic",
      "Instrumentation",
      "Civil",
    ],
    statuses: ["Planned", "In Progress", "Completed", "Cancelled"],
  },
  loading: true,
};

let idCounter = 1000;
const genId = () => ++idCounter;

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "LOAD_DATA":
      return { ...state, ...action.payload, loading: false };
    case "ADD_ASSET":
      return { ...state, assets: [action.payload, ...state.assets] };
    case "UPDATE_ASSET":
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      };
    case "ADD_WO":
      return { ...state, workOrders: [action.payload, ...state.workOrders] };
    case "UPDATE_WO":
      return {
        ...state,
        workOrders: state.workOrders.map((wo) =>
          wo.id === action.payload.id ? { ...wo, ...action.payload } : wo
        ),
      };
    case "LOAD_SETTINGS":
      return { ...state, settings: action.payload };
    case "SAVE_SETTINGS":
      localStorage.setItem(
        "plantMaintenanceSettings",
        JSON.stringify(action.payload)
      );
      return { ...state, settings: action.payload };
    default:
      return state;
  }
}

export function PlantMaintenanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage
  const loadSettings = useCallback(() => {
    const saved = localStorage.getItem("plantMaintenanceSettings");
    if (saved) {
      dispatch({ type: "LOAD_SETTINGS", payload: JSON.parse(saved) });
    }
  }, []);

  const saveSettings = useCallback((settings) => {
    dispatch({ type: "SAVE_SETTINGS", payload: settings });
  }, []);

  // Mock Data Load
  const loadMockData = useCallback(() => {
    dispatch({ type: "SET_LOADING", payload: true });
    setTimeout(() => {
      const mockAssets = [
        {
          id: genId(),
          code: "M-001",
          name: "Main Motor",
          type: "Machine",
          location: "Shop Floor A",
          status: "Operational",
          lastPM: "2025-10-15",
        },
        {
          id: genId(),
          code: "P-101",
          name: "Boiler Pump",
          type: "Pump",
          location: "Boiler Room",
          status: "Under Maintenance",
          lastPM: "2025-09-20",
        },
        {
          id: genId(),
          code: "C-201",
          name: "Conveyor Belt",
          type: "Conveyor",
          location: "Line 2",
          status: "Operational",
          lastPM: "2025-11-01",
        },
      ];

      const mockWOs = [
        {
          id: genId(),
          woNumber: "WO-2025-001",
          assetId: mockAssets[0].id,
          title: "Motor Bearing Replacement",
          priority: "High",
          status: "In Progress",
          assignedTo: "Rajesh",
          createdAt: "2025-11-10",
          dueDate: "2025-11-15",
          downtime: 4,
        },
        {
          id: genId(),
          woNumber: "WO-2025-002",
          assetId: mockAssets[1].id,
          title: "Pump Seal Leak",
          priority: "Critical",
          status: "Planned",
          assignedTo: "Sunil",
          createdAt: "2025-11-12",
          dueDate: "2025-11-13",
          downtime: 0,
        },
      ];

      const stats = {
        totalAssets: mockAssets.length,
        criticalAssets: mockAssets.filter((a) => a.status !== "Operational")
          .length,
        openWOs: mockWOs.filter((wo) => wo.status !== "Completed").length,
        overduePM: 2,
        mttr: 6.5,
        mtbf: 480,
        downtimeHours: 28,
        recentWOs: mockWOs.slice(0, 3),
      };

      dispatch({
        type: "LOAD_DATA",
        payload: { assets: mockAssets, workOrders: mockWOs, stats },
      });
    }, 800);
  }, []);

  useEffect(() => {
    loadMockData();
    loadSettings();
  }, [loadMockData, loadSettings]);

  // Actions
  const addAsset = useCallback((asset) => {
    const newAsset = { ...asset, id: genId() };
    dispatch({ type: "ADD_ASSET", payload: newAsset });
    return newAsset;
  }, []);

  const updateAsset = useCallback((id, updates) => {
    dispatch({ type: "UPDATE_ASSET", payload: { id, ...updates } });
  }, []);

  const createWO = useCallback((wo) => {
    const newWO = {
      ...wo,
      id: genId(),
      woNumber: `WO-2025-${String(idCounter).padStart(3, "0")}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "ADD_WO", payload: newWO });
    return newWO;
  }, []);

  const updateWO = useCallback((id, updates) => {
    dispatch({ type: "UPDATE_WO", payload: { id, ...updates } });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      addAsset,
      updateAsset,
      createWO,
      updateWO,
      saveSettings,
    }),
    [state, addAsset, updateAsset, createWO, updateWO, saveSettings]
  );

  return (
    <PlantMaintenanceContext.Provider value={value}>
      {children}
    </PlantMaintenanceContext.Provider>
  );
}

export const usePlantMaintenance = () => {
  const context = useContext(PlantMaintenanceContext);
  if (!context)
    throw new Error(
      "usePlantMaintenance must be used within PlantMaintenanceProvider"
    );
  return context;
};
