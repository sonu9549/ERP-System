// src/context/SalesContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  generateOrders,
  mockProducts,
  generateInvoices,
  generateQuotations,
  generateCustomers,
  generateDiscountSchemes,
} from "../data/salesData";
import { useInventory } from "./InventoryContext";

const SalesContext = createContext();

const initialState = {
  orders: [],
  invoices: [],
  customers: [],
  products: [],
  quotations: [],
  shipments: [],
  returns: [],
  contracts: [],
  rebates: [],
  filters: {
    status: "all",
    dateRange: "all",
    customer: "all",
    search: "",
    industry: "all",
    tier: "all",
  },

  pricingRules: [],
  discountSchemes: [],
  taxConfigurations: [],
  shippingRules: [],
  paymentTerms: [],
  specialPricing: [],
  atpChecks: [],
  inventory: [],
  stockMovements: [],
  creditLimits: [],
  creditApplications: [],
  agingReports: [],
  creditNotes: [],
  paymentCollections: [],
  loading: false,
  error: null,
};

const salesReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOAD_DATA":
      return { ...state, ...action.payload, loading: false };

    // === CUSTOMER ACTIONS ===
    case "ADD_CUSTOMER":
      return { ...state, customers: [action.payload, ...state.customers] };
    case "UPDATE_CUSTOMER":
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    case "DELETE_CUSTOMER":
      return {
        ...state,
        customers: state.customers.filter((c) => c.id !== action.payload),
      };
    case "BULK_UPDATE_CUSTOMERS":
      return { ...state, customers: action.payload };

    // ORDER ACTIONS

    case "ADD_ORDER":
      return { ...state, orders: [action.payload, ...state.orders] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      };
    case "DELETE_ORDER":
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
      };

    // === INVOICE ACTIONS ===
    case "ADD_INVOICE":
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case "UPDATE_INVOICE":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      };

    // === QUOTATION ACTIONS ===
    case "ADD_QUOTATION":
      return { ...state, quotations: [action.payload, ...state.quotations] };
    case "UPDATE_QUOTATION":
      return {
        ...state,
        quotations: state.quotations.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload } : q
        ),
      };

    // === SHIPMENT ACTIONS ===
    case "ADD_SHIPMENT":
      return { ...state, shipments: [action.payload, ...state.shipments] };
    case "UPDATE_SHIPMENT":
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    // === RETURN ACTIONS ===
    case "ADD_RETURN":
      return { ...state, returns: [action.payload, ...state.returns] };
    case "UPDATE_RETURN":
      return {
        ...state,
        returns: state.returns.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      };

    // === FILTER ACTIONS ===
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "CLEAR_FILTERS":
      return { ...state, filters: initialState.filters };

    // Pricing & discounts

    case "LOAD_PRICING_DATA":
      return {
        ...state,
        pricingRules: action.payload.pricingRules || [],
        discountSchemes: action.payload.discountSchemes || [],
        taxConfigurations: action.payload.taxConfigurations || [],
        shippingRules: action.payload.shippingRules || [],
        paymentTerms: action.payload.paymentTerms || [],
        specialPricing: action.payload.specialPricing || [],
      };

    case "ADD_PRICING_RULE":
      return {
        ...state,
        pricingRules: [action.payload, ...state.pricingRules],
      };

    case "UPDATE_PRICING_RULE":
      return {
        ...state,
        pricingRules: state.pricingRules.map((rule) =>
          rule.id === action.payload.id ? action.payload : rule
        ),
      };

    case "DELETE_PRICING_RULE":
      return {
        ...state,
        pricingRules: state.pricingRules.filter(
          (rule) => rule.id !== action.payload
        ),
      };

    case "ADD_DISCOUNT_SCHEME":
      return {
        ...state,
        discountSchemes: [action.payload, ...state.discountSchemes],
      };

    case "UPDATE_DISCOUNT_SCHEME":
      return {
        ...state,
        discountSchemes: state.discountSchemes.map((scheme) =>
          scheme.id === action.payload.id ? action.payload : scheme
        ),
      };

    case "LOAD_ATP_DATA":
      return {
        ...state,
        atpChecks: action.payload.atpChecks || [],
        inventory: action.payload.inventory || [],
        stockMovements: action.payload.stockMovements || [],
      };

    case "ADD_ATP_CHECK":
      return {
        ...state,
        atpChecks: [action.payload, ...state.atpChecks],
      };

    case "UPDATE_ATP_CHECK":
      return {
        ...state,
        atpChecks: state.atpChecks.map((check) =>
          check.id === action.payload.id ? action.payload : check
        ),
      };

    case "ADD_STOCK_MOVEMENT":
      return {
        ...state,
        stockMovements: [action.payload, ...state.stockMovements],
        inventory: state.inventory.map((item) => {
          if (item.productId === action.payload.productId) {
            return {
              ...item,
              availableStock:
                action.payload.type === "in"
                  ? item.availableStock + action.payload.quantity
                  : item.availableStock - action.payload.quantity,
            };
          }
          return item;
        }),
      };
    case "LOAD_CREDIT_DATA":
      return {
        ...state,
        creditLimits: action.payload.creditLimits || [],
        creditApplications: action.payload.creditApplications || [],
        paymentTerms: action.payload.paymentTerms || [],
        agingReports: action.payload.agingReports || [],
        creditNotes: action.payload.creditNotes || [],
        paymentCollections: action.payload.paymentCollections || [],
      };

    case "UPDATE_CREDIT_LIMIT":
      return {
        ...state,
        creditLimits: state.creditLimits.map((limit) =>
          limit.id === action.payload.id ? action.payload : limit
        ),
        customers: state.customers.map((customer) =>
          customer.id === action.payload.customerId
            ? { ...customer, creditLimit: action.payload.creditLimit }
            : customer
        ),
      };

    case "ADD_CREDIT_APPLICATION":
      return {
        ...state,
        creditApplications: [action.payload, ...state.creditApplications],
      };

    case "UPDATE_CREDIT_APPLICATION":
      return {
        ...state,
        creditApplications: state.creditApplications.map((app) =>
          app.id === action.payload.id ? action.payload : app
        ),
      };

    case "ADD_CREDIT_NOTE":
      return {
        ...state,
        creditNotes: [action.payload, ...state.creditNotes],
      };

    case "ADD_PAYMENT_COLLECTION":
      return {
        ...state,
        paymentCollections: [action.payload, ...state.paymentCollections],
        invoices: state.invoices.map((invoice) =>
          invoice.id === action.payload.invoiceId
            ? { ...invoice, status: "Paid", paidAmount: action.payload.amount }
            : invoice
        ),
      };

    default:
      return state;
  }
};

export const SalesProvider = ({ children }) => {
  const { addStockTransaction } = useInventory();
  const [state, dispatch] = useReducer(salesReducer, initialState);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        const savedData = localStorage.getItem("erp_sales_data");

        if (savedData) {
          const parsedData = JSON.parse(savedData);
          dispatch({ type: "LOAD_DATA", payload: parsedData });
        } else {
          const orders = generateOrders();
          const invoices = generateInvoices(orders);
          const quotations = generateQuotations();
          const customers = generateCustomers();

          const initialData = {
            orders,
            invoices,
            quotations,
            customers,
            products: mockProducts,
            shipments: [],
            returns: [],
            contracts: [],
            rebates: [],
          };

          dispatch({ type: "LOAD_DATA", payload: initialData });
          localStorage.setItem("erp_sales_data", JSON.stringify(initialData));
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
      }
    };

    loadInitialData();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.customers.length > 0) {
      const dataToSave = {
        orders: state.orders,
        invoices: state.invoices,
        quotations: state.quotations,
        shipments: state.shipments,
        returns: state.returns,
        contracts: state.contracts,
        rebates: state.rebates,
        customers: state.customers,
      };
      localStorage.setItem("erp_sales_data", JSON.stringify(dataToSave));
    }
  }, [state]);

  // === CUSTOMER ACTIONS ===
  const addCustomer = (customerData) => {
    try {
      const newCustomer = {
        id: Date.now(),
        customerCode: `CUST-${String(state.customers.length + 1001).padStart(
          4,
          "0"
        )}`,
        ...customerData,
        status: customerData.status || "Active",
        joinDate:
          customerData.joinDate || new Date().toISOString().split("T")[0],
        lastActivity: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        revenue: 0,
        satisfaction: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_CUSTOMER", payload: newCustomer });
      return newCustomer;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateCustomer = (customerId, updates) => {
    try {
      const updatedCustomer = {
        id: customerId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "UPDATE_CUSTOMER", payload: updatedCustomer });
      return updatedCustomer;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const deleteCustomer = (customerId) => {
    try {
      dispatch({ type: "DELETE_CUSTOMER", payload: customerId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const importCustomers = (customersData) => {
    try {
      const newCustomers = customersData.map((customer, index) => ({
        id: Date.now() + index,
        customerCode: `CUST-${String(
          state.customers.length + index + 1001
        ).padStart(4, "0")}`,
        ...customer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      dispatch({
        type: "BULK_UPDATE_CUSTOMERS",
        payload: [...state.customers, ...newCustomers],
      });
      return newCustomers;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // === ORDER ACTIONS ===
  const addOrder = (orderData) => {
    try {
      const newOrder = {
        id: Date.now(),
        orderNo: `SO-${String(state.orders.length + 1001).padStart(4, "0")}`,
        ...orderData,
        status: orderData.status || "Draft",
        shippingStatus: "Pending",
        returnStatus: "None",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_ORDER", payload: newOrder });

      // Auto-generate invoice if order is confirmed
      if (orderData.status === "Confirmed") {
        generateInvoice(newOrder);
      }

      return newOrder;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateOrder = (orderId, updates) => {
    try {
      const updatedOrder = {
        id: orderId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "UPDATE_ORDER", payload: updatedOrder });

      // Auto-create shipment if status changes to confirmed
      if (updates.status === "Confirmed") {
        const order = state.orders.find((o) => o.id === orderId);
        if (order && !order.shipmentNo) {
          createShipmentFromOrder({ ...order, ...updates });
        }
      }

      return updatedOrder;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const deleteOrder = (orderId) => {
    try {
      dispatch({ type: "DELETE_ORDER", payload: orderId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // === INVOICE ACTIONS ===
  const generateInvoice = (order) => {
    try {
      const invoice = {
        id: Date.now(),
        invoiceNo: `INV-${String(state.invoices.length + 1001).padStart(
          4,
          "0"
        )}`,
        orderId: order.id,
        orderNo: order.orderNo,
        customerId: order.customerId,
        customerName: order.customerName,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        grandTotal: order.total,
        status: "Unpaid",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_INVOICE", payload: invoice });
      return invoice;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateInvoiceStatus = (invoiceId, status) => {
    try {
      dispatch({ type: "UPDATE_INVOICE", payload: { id: invoiceId, status } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // === QUOTATION ACTIONS ===
  const addQuotation = (quotationData) => {
    try {
      const newQuotation = {
        id: Date.now(),
        quoteNo: `QT-${String(state.quotations.length + 1001).padStart(
          4,
          "0"
        )}`,
        ...quotationData,
        status: "Draft",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_QUOTATION", payload: newQuotation });
      return newQuotation;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateQuotationStatus = (quotationId, status) => {
    try {
      dispatch({
        type: "UPDATE_QUOTATION",
        payload: { id: quotationId, status },
      });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // === SHIPMENT ACTIONS ===
  const createShipmentFromOrder = (order) => {
    try {
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
        trackingNo: `TRK${Date.now().toString().slice(-8)}`,
        status: "Pending",
        weight: order.items.reduce((sum, item) => sum + item.quantity, 0) * 0.5,
        cost: 25,
        notes: "",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_SHIPMENT", payload: newShipment });
      return newShipment;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateShipmentStatus = (shipmentId, updates) => {
    try {
      const updatedShipment = {
        id: shipmentId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "UPDATE_SHIPMENT", payload: updatedShipment });

      const shipment = state.shipments.find((s) => s.id === shipmentId);
      if (shipment && updates.status) {
        updateOrder(shipment.orderId, { shippingStatus: updates.status });
      }

      return updatedShipment;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // === RETURN ACTIONS ===
  const createReturn = (returnData) => {
    try {
      const newReturn = {
        id: Date.now(),
        returnNo: `RT-${String(state.returns.length + 1001).padStart(4, "0")}`,
        ...returnData,
        status: "Pending",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_RETURN", payload: newReturn });
      updateOrder(returnData.orderId, { returnStatus: "Returned" });
      return newReturn;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateReturnStatus = (returnId, status) => {
    try {
      dispatch({ type: "UPDATE_RETURN", payload: { id: returnId, status } });

      if (status === "Refunded") {
        const returnItem = state.returns.find((r) => r.id === returnId);
        if (returnItem?.orderId) {
          updateOrder(returnItem.orderId, { returnStatus: "Refunded" });

          returnItem.items?.forEach((item) => {
            addStockTransaction({
              product_id: item.productId,
              product_name: item.productName,
              warehouse_id: 1,
              bin_id: 1,
              transaction_type: "return",
              qty: item.quantity,
              reference: returnItem.returnNo,
              notes: `Sales Return - ${returnItem.orderNo}`,
            });
          });
        }
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // === FILTER ACTIONS ===
  const setFilters = (filters) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: "CLEAR_FILTERS" });
  };

  const addPricingRule = (ruleData) => {
    try {
      const newRule = {
        id: Date.now(),
        ruleCode: `PR-${String(state.pricingRules.length + 1001).padStart(
          4,
          "0"
        )}`,
        ...ruleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_PRICING_RULE", payload: newRule });
      return newRule;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updatePricingRule = (ruleId, updates) => {
    try {
      const updatedRule = {
        id: ruleId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "UPDATE_PRICING_RULE", payload: updatedRule });
      return updatedRule;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const deletePricingRule = (ruleId) => {
    try {
      dispatch({ type: "DELETE_PRICING_RULE", payload: ruleId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const addDiscountScheme = (schemeData) => {
    try {
      const newScheme = {
        id: Date.now(),
        schemeCode: `DS-${String(state.discountSchemes.length + 1001).padStart(
          4,
          "0"
        )}`,
        ...schemeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_DISCOUNT_SCHEME", payload: newScheme });
      return newScheme;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // Price calculation engine
  const calculatePrice = (
    product,
    quantity,
    customer = null,
    orderTotal = 0
  ) => {
    let basePrice = product.price;
    let finalPrice = basePrice;
    let appliedRules = [];
    let discounts = [];

    // Apply pricing rules
    const applicableRules = state.pricingRules.filter(
      (rule) =>
        rule.isActive && isRuleApplicable(rule, product, customer, quantity)
    );

    applicableRules.forEach((rule) => {
      const calculatedPrice = applyPricingRule(rule, basePrice, quantity);
      if (calculatedPrice < finalPrice) {
        finalPrice = calculatedPrice;
        appliedRules.push(rule);
      }
    });

    // Apply discount schemes
    const applicableDiscounts = state.discountSchemes.filter(
      (scheme) =>
        scheme.isActive &&
        isDiscountApplicable(scheme, product, customer, orderTotal, quantity)
    );

    applicableDiscounts.forEach((scheme) => {
      const discountAmount = calculateDiscount(scheme, finalPrice, quantity);
      if (discountAmount > 0) {
        finalPrice -= discountAmount;
        discounts.push({
          scheme,
          amount: discountAmount,
          type: scheme.discountType,
        });
      }
    });

    return {
      basePrice,
      finalPrice,
      appliedRules,
      discounts,
      savings: basePrice - finalPrice,
      discountPercentage: ((basePrice - finalPrice) / basePrice) * 100,
    };
  };

  // Helper functions for price calculation
  const isRuleApplicable = (rule, product, customer, quantity) => {
    const now = new Date();
    const startDate = new Date(rule.validFrom);
    const endDate = new Date(rule.validTo);

    if (now < startDate || now > endDate) return false;

    // Check customer criteria
    if (rule.customerGroups && rule.customerGroups.length > 0) {
      if (!customer || !rule.customerGroups.includes(customer.customerTier))
        return false;
    }

    // Check product criteria
    if (rule.products && rule.products.length > 0) {
      if (!rule.products.includes(product.id)) return false;
    }

    // Check quantity criteria
    if (rule.minQuantity && quantity < rule.minQuantity) return false;
    if (rule.maxQuantity && quantity > rule.maxQuantity) return false;

    return true;
  };

  const applyPricingRule = (rule, basePrice, quantity) => {
    switch (rule.ruleType) {
      case "fixed_price":
        return rule.fixedPrice;
      case "percentage_discount":
        return basePrice * (1 - rule.discountValue / 100);
      case "fixed_discount":
        return Math.max(0, basePrice - rule.discountValue);
      case "tiered_pricing":
        const tier = rule.tiers.find(
          (t) => quantity >= t.minQty && (!t.maxQty || quantity <= t.maxQty)
        );
        return tier ? basePrice * (1 - tier.discount / 100) : basePrice;
      case "bundle_pricing":
        return basePrice * (1 - rule.bundleDiscount / 100);
      default:
        return basePrice;
    }
  };

  const isDiscountApplicable = (
    scheme,
    product,
    customer,
    orderTotal,
    quantity
  ) => {
    const now = new Date();
    const startDate = new Date(scheme.validFrom);
    const endDate = new Date(scheme.validTo);

    if (now < startDate || now > endDate) return false;

    // Check customer criteria
    if (scheme.customerGroups && scheme.customerGroups.length > 0) {
      if (!customer || !scheme.customerGroups.includes(customer.customerTier))
        return false;
    }

    // Check product criteria
    if (scheme.products && scheme.products.length > 0) {
      if (!scheme.products.includes(product.id)) return false;
    }

    // Check order value criteria
    if (scheme.minOrderValue && orderTotal < scheme.minOrderValue) return false;

    // Check quantity criteria
    if (scheme.minQuantity && quantity < scheme.minQuantity) return false;

    return true;
  };

  const calculateDiscount = (scheme, price, quantity) => {
    switch (scheme.discountType) {
      case "percentage":
        return price * (scheme.discountValue / 100);
      case "fixed_amount":
        return scheme.discountValue;
      case "buy_x_get_y":
        const freeItems =
          Math.floor(quantity / (scheme.buyQuantity + scheme.getQuantity)) *
          scheme.getQuantity;
        return freeItems * price;
      case "volume_discount":
        const volumeTier = scheme.volumeTiers.find(
          (tier) => quantity >= tier.minQty
        );
        return volumeTier ? price * quantity * (volumeTier.discount / 100) : 0;
      default:
        return 0;
    }
  };

  const checkATP = (productId, quantity, requiredDate, customerId = null) => {
    try {
      const product = products.find((p) => p.id === productId);
      const inventoryItem = state.inventory.find(
        (i) => i.productId === productId
      );

      if (!product || !inventoryItem) {
        throw new Error("Product or inventory data not found");
      }

      const availableStock = inventoryItem.availableStock || 0;
      const committedStock = calculateCommittedStock(productId);
      const plannedReceipts = calculatePlannedReceipts(productId, requiredDate);

      const atpQuantity = availableStock - committedStock + plannedReceipts;
      const canFulfill = atpQuantity >= quantity;
      const shortfall = canFulfill ? 0 : quantity - atpQuantity;
      const promisedDate = canFulfill
        ? requiredDate
        : calculatePromiseDate(productId, quantity, requiredDate);

      const atpResult = {
        id: Date.now(),
        productId,
        productName: product.name,
        requestedQuantity: quantity,
        requiredDate,
        customerId,
        availableStock,
        committedStock,
        plannedReceipts,
        atpQuantity,
        canFulfill,
        shortfall,
        promisedDate,
        checkedAt: new Date().toISOString(),
        status: canFulfill ? "Available" : "Backorder",
      };

      dispatch({ type: "ADD_ATP_CHECK", payload: atpResult });
      return atpResult;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const bulkATPCheck = (items, requiredDate, customerId = null) => {
    try {
      const results = items.map((item) =>
        checkATP(item.productId, item.quantity, requiredDate, customerId)
      );

      const overallStatus = results.every((r) => r.canFulfill)
        ? "Available"
        : results.some((r) => r.canFulfill)
        ? "Partial"
        : "Backorder";

      return {
        results,
        overallStatus,
        totalRequested: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAvailable: results.reduce(
          (sum, r) => sum + (r.canFulfill ? r.requestedQuantity : 0),
          0
        ),
        totalBackorder: results.reduce(
          (sum, r) => sum + (r.canFulfill ? 0 : r.shortfall),
          0
        ),
      };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const reserveStock = (productId, quantity, orderId, promiseDate) => {
    try {
      const movement = {
        id: Date.now(),
        productId,
        quantity,
        type: "reservation",
        orderId,
        promiseDate,
        createdAt: new Date().toISOString(),
        status: "reserved",
      };

      dispatch({ type: "ADD_STOCK_MOVEMENT", payload: movement });
      return movement;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // Helper functions
  const calculateCommittedStock = (productId) => {
    return state.stockMovements
      .filter(
        (movement) =>
          movement.productId === productId &&
          movement.type === "reservation" &&
          movement.status === "reserved"
      )
      .reduce((sum, movement) => sum + movement.quantity, 0);
  };

  const calculatePlannedReceipts = (productId, requiredDate) => {
    const plannedMovements = state.stockMovements.filter(
      (movement) =>
        movement.productId === productId &&
        movement.type === "planned_receipt" &&
        new Date(movement.expectedDate) <= new Date(requiredDate)
    );

    return plannedMovements.reduce(
      (sum, movement) => sum + movement.quantity,
      0
    );
  };

  const calculatePromiseDate = (productId, quantity, requiredDate) => {
    // Simplified logic - in real system, this would check production schedules, purchase orders, etc.
    const daysToAdd = quantity <= 100 ? 7 : quantity <= 500 ? 14 : 30;
    const promiseDate = new Date(requiredDate);
    promiseDate.setDate(promiseDate.getDate() + daysToAdd);
    return promiseDate.toISOString().split("T")[0];
  };

  const updateCreditLimit = (customerId, newLimit, reason = "") => {
    try {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Customer not found");

      const creditLimit = {
        id: Date.now(),
        customerId,
        customerName: customer.name,
        previousLimit: customer.creditLimit || 0,
        newLimit,
        changeDate: new Date().toISOString(),
        reason,
        changedBy: "System Admin", // In real app, get from auth context
        status: "Active",
      };

      dispatch({ type: "UPDATE_CREDIT_LIMIT", payload: creditLimit });
      return creditLimit;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const submitCreditApplication = (applicationData) => {
    try {
      const application = {
        id: Date.now(),
        applicationNo: `CA-${String(creditApplications.length + 1001).padStart(
          4,
          "0"
        )}`,
        ...applicationData,
        status: "Pending",
        appliedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_CREDIT_APPLICATION", payload: application });
      return application;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const processCreditApplication = (
    applicationId,
    decision,
    approvedLimit = 0,
    notes = ""
  ) => {
    try {
      const application = creditApplications.find(
        (app) => app.id === applicationId
      );
      if (!application) throw new Error("Application not found");

      const updatedApplication = {
        ...application,
        status: decision,
        approvedLimit: decision === "Approved" ? approvedLimit : 0,
        decisionDate: new Date().toISOString(),
        decisionNotes: notes,
        processedBy: "Credit Manager",
      };

      if (decision === "Approved") {
        updateCreditLimit(
          application.customerId,
          approvedLimit,
          "Credit application approved"
        );
      }

      dispatch({
        type: "UPDATE_CREDIT_APPLICATION",
        payload: updatedApplication,
      });
      return updatedApplication;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const createCreditNote = (noteData) => {
    try {
      const creditNote = {
        id: Date.now(),
        noteNo: `CN-${String(creditNotes.length + 1001).padStart(4, "0")}`,
        ...noteData,
        status: "Active",
        createdDate: new Date().toISOString(),
      };

      dispatch({ type: "ADD_CREDIT_NOTE", payload: creditNote });
      return creditNote;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const recordPayment = (paymentData) => {
    try {
      const payment = {
        id: Date.now(),
        receiptNo: `RCP-${String(paymentCollections.length + 1001).padStart(
          4,
          "0"
        )}`,
        ...paymentData,
        status: "Completed",
        processedDate: new Date().toISOString(),
      };

      dispatch({ type: "ADD_PAYMENT_COLLECTION", payload: payment });
      return payment;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  // Credit Risk Assessment
  const assessCreditRisk = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return null;

    const invoices = state.invoices.filter(
      (inv) => inv.customerId === customerId
    );
    const totalOutstanding = invoices
      .filter((inv) => inv.status === "Unpaid")
      .reduce((sum, inv) => sum + inv.total, 0);

    const paymentHistory = state.paymentCollections.filter(
      (p) => p.customerId === customerId
    );
    const averagePaymentDays = calculateAveragePaymentDays(paymentHistory);

    const creditUtilization =
      customer.creditLimit > 0
        ? (totalOutstanding / customer.creditLimit) * 100
        : 0;

    let riskScore = 0;
    let riskLevel = "Low";

    // Risk scoring logic
    if (creditUtilization > 90) riskScore += 30;
    else if (creditUtilization > 70) riskScore += 20;
    else if (creditUtilization > 50) riskScore += 10;

    if (averagePaymentDays > 60) riskScore += 30;
    else if (averagePaymentDays > 45) riskScore += 20;
    else if (averagePaymentDays > 30) riskScore += 10;

    if (totalOutstanding > customer.creditLimit * 0.8) riskScore += 40;

    if (riskScore >= 60) riskLevel = "High";
    else if (riskScore >= 30) riskLevel = "Medium";

    return {
      customerId,
      riskScore,
      riskLevel,
      creditUtilization,
      totalOutstanding,
      averagePaymentDays,
      assessmentDate: new Date().toISOString(),
    };
  };

  // Helper functions
  const calculateAveragePaymentDays = (payments) => {
    if (payments.length === 0) return 0;

    const totalDays = payments.reduce((sum, payment) => {
      const invoice = state.invoices.find(
        (inv) => inv.id === payment.invoiceId
      );
      if (!invoice) return sum;

      const dueDate = new Date(invoice.dueDate);
      const paymentDate = new Date(payment.paymentDate);
      const daysLate = Math.max(
        0,
        (paymentDate - dueDate) / (1000 * 60 * 60 * 24)
      );
      return sum + daysLate;
    }, 0);

    return Math.round(totalDays / payments.length);
  };

  const checkCreditLimit = (customerId, orderAmount) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return { allowed: false, reason: "Customer not found" };

    const outstandingInvoices = state.invoices
      .filter((inv) => inv.customerId === customerId && inv.status === "Unpaid")
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalExposure = outstandingInvoices + orderAmount;
    const availableCredit = customer.creditLimit - outstandingInvoices;

    if (totalExposure > customer.creditLimit) {
      return {
        allowed: false,
        reason: `Credit limit exceeded. Available: ${availableCredit}, Required: ${orderAmount}`,
        availableCredit,
        requiredAmount: orderAmount,
      };
    }

    return {
      allowed: true,
      availableCredit,
      utilizedCredit: outstandingInvoices,
      creditLimit: customer.creditLimit,
    };
  };

  const value = {
    ...state,
    // Customer
    addCustomer,
    updateCustomer,
    deleteCustomer,
    importCustomers,
    // Order
    addOrder,
    updateOrder,
    deleteOrder,
    // Invoice
    generateInvoice,
    updateInvoiceStatus,
    // Quotation
    addQuotation,
    updateQuotationStatus,
    // Shipment
    createShipmentFromOrder,
    updateShipmentStatus,
    // Return
    createReturn,
    updateReturnStatus,
    // Filter
    setFilters,
    clearFilters,
    // Utility
    dispatch,

    pricingRules: state.pricingRules,
    discountSchemes: state.discountSchemes,
    taxConfigurations: state.taxConfigurations,
    shippingRules: state.shippingRules,
    specialPricing: state.specialPricing,

    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    addDiscountScheme,
    calculatePrice,
    atpChecks: state.atpChecks,
    inventory: state.inventory,
    stockMovements: state.stockMovements,

    checkATP,
    bulkATPCheck,
    reserveStock,

    creditLimits: state.creditLimits,
    creditApplications: state.creditApplications,
    paymentTerms: state.paymentTerms,

    agingReports: state.agingReports,
    creditNotes: state.creditNotes,
    paymentCollections: state.paymentCollections,

    updateCreditLimit,
    submitCreditApplication,
    processCreditApplication,
    createCreditNote,
    recordPayment,
    assessCreditRisk,
    checkCreditLimit,
  };

  return (
    <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSales must be used within a SalesProvider");
  }
  return context;
};

export default SalesContext;
