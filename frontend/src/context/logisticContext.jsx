import { createContext, useContext } from "react";
import { warehouseData } from "../data/logisticData";

// Create Context
const LogisticContext = createContext();

// Provider Component
export function LogisticProvider({ children }) {
  return (
    <LogisticContext.Provider value={warehouseData}>
      {children}
    </LogisticContext.Provider>
  );
}

// Custom Hook to use context
export function useLogistic() {
  const context = useContext(LogisticContext);
  if (!context) {
    throw new Error("useWarehouse must be used within WarehouseProvider");
  }
  return context;
}
