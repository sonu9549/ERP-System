// src/context/ProductionContext.jsx
import { createContext, useContext, useState } from "react";
import {
  planningMenu,
  planningTabs,
  bomTemplates,
  initialWorkOrders,
  initialShopFloorData,
  initialQcRecords,
  initialInventory,
  initialWasteData,
  initialConsumptionData,
} from "../data/planningData";

const ProductionContext = createContext();

export const ProductionProvider = ({ children }) => {
  const [openSections, setOpenSections] = useState({});
  const [activeTab, setActiveTab] = useState("mps");
  const [activeBOM, setActiveBOM] = useState(bomTemplates[0]);
  const [explodedData, setExplodedData] = useState([]);
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [shopFloorData, setShopFloorData] = useState(initialShopFloorData);
  const [qcRecords, setQcRecords] = useState(initialQcRecords || []);
  const [inventory, setInventory] = useState(initialInventory || []);
  const [wasteRecords, setWasteRecords] = useState(initialWasteData);
  const [consumptionRecords, setConsumptionRecords] = useState(
    initialConsumptionData
  );

  const toggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };
  const explodeBOM = (bomId, parentQty = 1) => {
    const bom = bomTemplates.find((b) => b.id === bomId);
    if (!bom) return [];

    const result = [];
    bom.components.forEach((comp) => {
      const qty = parentQty * comp.qty;
      result.push({
        ...comp,
        level: result.length ? result[result.length - 1].level + 1 : 0,
        totalQty: qty,
        parent: bomId,
      });
      // Recurse for sub-components
      result.push(...explodeBOM(comp.id, qty));
    });
    setExplodedData(result);
    return result;
  };

  return (
    <ProductionContext.Provider
      value={{
        // Menu & Tabs
        planningMenu,
        openSections,
        toggleSection,
        planningTabs,
        activeTab,
        setActiveTab,

        // BOM
        bomTemplates,
        activeBOM,
        setActiveBOM,
        explodedData,
        explodeBOM,

        // Work Orders
        workOrders,
        setWorkOrders,

        // Shop Floor
        shopFloorData,
        setShopFloorData,

        qcRecords,
        setQcRecords,
        inventory,
        setInventory,
        wasteRecords,
        setWasteRecords,
        consumptionRecords,
        setConsumptionRecords,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
};

export const useProduction = () => useContext(ProductionContext);
