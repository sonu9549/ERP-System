import React, { useState, useMemo, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { MODULE_ACCESS } from "../config/moduleAccessConfig";
import {
  ChevronDown,
  Users,
  FileText,
  Clock,
  TrendingUp,
  Briefcase,
  ChartCandlestick,
  Warehouse,
  ShoppingCart,
  Truck,
  BarChart3,
  ClipboardList,
  ClipboardCheck,
  Package,
  Building2,
  Settings,
  Factory,
  Layers,
  Calculator,
  FileSpreadsheet,
  FileBarChart,
  LineChart,
  CheckSquare,
  RefreshCw,
  DollarSign,
  Mail,
  Target,
  Headphones,
  Repeat,
  HeartHandshake,
  ShieldCheck,
  FolderTree,
  AlertTriangle,
  Recycle,
  Database,
  Boxes,
} from "lucide-react";

// Reusable Icon Component
const MenuIcon = ({ icon: Icon, size = 16, className = "" }) => {
  return Icon ? <Icon size={size} className={className} /> : null;
};

// === MODULES (No minRole, No Hardcoding) ===
const modules = [
  { path: "/", label: "Dashboard", icon: BarChart3 },

  // INVENTORY
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    submodules: [
      { path: "/inventory/dashboard", label: "Dashboard", icon: BarChart3 },
      {
        path: "/inventory/stock",
        label: "Stock Management",
        icon: ChartCandlestick,
      },
      { path: "/inventory/warehouse", label: "Warehouse", icon: Warehouse },
      { path: "/inventory/products", label: "Products", icon: ShoppingCart },
      { path: "/inventory/suppliers", label: "Suppliers", icon: Users },
      { path: "/inventory/st", label: "Stock Transactions", icon: RefreshCw },
      {
        path: "/inventory/purchase_manage",
        label: "Purchase Management",
        icon: ClipboardList,
      },
      { path: "/inventory/reports", label: "Reports", icon: FileBarChart },
    ],
  },

  // SALES
  {
    id: "sales",
    label: "Sales",
    icon: DollarSign,
    submodules: [
      { path: "/sales", label: "Overview", icon: Users },
      { path: "/sales/cm", label: "Customers Master", icon: Users },
      { path: "/sales/orders", label: "Sales Order", icon: ClipboardCheck },
      { path: "/sales/shipping", label: "Shipping & Delivery", icon: Truck },
      { path: "/sales/invoice", label: "Billing & Invoicing", icon: FileText },
      { path: "/sales/analytics", label: "Sales Analytics", icon: LineChart },
      { path: "/sales/returns", label: "Returns", icon: RefreshCw },
    ],
  },

  // CRM
  {
    id: "crm",
    label: "CRM",
    icon: HeartHandshake,
    submodules: [
      { path: "/crm/cm", label: "Customer Master", icon: Users },
      { path: "/crm/leads", label: "Leads & Opportunity", icon: Target },
      {
        path: "/crm/customer-support",
        label: "Customer Support",
        icon: Headphones,
      },
      {
        path: "/crm/sef",
        label: "Sales Engagement & Follow-ups",
        icon: Repeat,
      },
      { path: "/crm/loyalty", label: "Loyalty Program", icon: HeartHandshake },
      { path: "/crm/analytics", label: "CRM Analytics", icon: BarChart3 },
    ],
  },

  // HR
  {
    id: "hr",
    label: "Human Resources",
    icon: Users,
    submodules: [
      { path: "/hr/employees", label: "Employee Management", icon: Users },
      {
        path: "/hr/recruitment",
        label: "Recruitment & Onboarding",
        icon: FileText,
      },
      { path: "/hr/attendance", label: "Attendance & Time", icon: Clock },
      { path: "/hr/payroll", label: "Payroll Management", icon: Briefcase },
      {
        path: "/hr/performance",
        label: "Performance & Appraisal",
        icon: TrendingUp,
      },
    ],
  },

  // FINANCE
  {
    id: "finance",
    label: "Finance",
    icon: Calculator,
    submodules: [
      {
        path: "/finance/ledger",
        label: "General Ledger",
        icon: FileSpreadsheet,
      },
      { path: "/finance/ap", label: "Accounts Payable", icon: ClipboardList },
      { path: "/finance/ar", label: "Accounts Receivable", icon: FileText },
      {
        path: "/finance/fam",
        label: "Fixed Assets Management",
        icon: Building2,
      },
      {
        path: "/finance/bf",
        label: "Budgeting and Forecasting",
        icon: LineChart,
      },
      {
        path: "/finance/co",
        label: "Cost Accounting/Controlling",
        icon: Calculator,
      },
      { path: "/finance/fscm", label: "Financial Supply Chain", icon: Boxes },
      {
        path: "/finance/taxcomp",
        label: "Taxation & Compliance",
        icon: ShieldCheck,
      },
      { path: "/finance/reports", label: "Reports", icon: FileBarChart },
    ],
  },

  // QUALITY
  {
    id: "quality",
    label: "Quality Management",
    icon: CheckSquare,
    submodules: [
      {
        path: "/quality/iqc",
        label: "Incoming Quality Control",
        icon: ClipboardCheck,
      },
      { path: "/quality/ipqc", label: "IPQC", icon: ClipboardList },
      { path: "/quality/fqc", label: "FQC", icon: FileText },
      { path: "/quality/ip", label: "Inspection Plan", icon: FolderTree },
      { path: "/quality/ncm", label: "NCM", icon: AlertTriangle },
      { path: "/quality/qc", label: "Quality Certificates", icon: ShieldCheck },
    ],
  },

  // LOGISTICS
  {
    id: "logistics",
    label: "Logistics",
    icon: Truck,
    submodules: [
      {
        path: "/logistics/warehouse",
        label: "Warehouse Management",
        icon: Warehouse,
      },
      {
        path: "/logistics/transport",
        label: "Transport Management",
        icon: Truck,
      },
      {
        path: "/logistics/cross-docking",
        label: "Cross-Docking & Transfer",
        icon: RefreshCw,
      },
      {
        path: "/logistics/packaghandling",
        label: "Packaging & Handling",
        icon: Boxes,
      },
    ],
  },

  // PRODUCTION
  {
    id: "production",
    label: "Production",
    icon: Factory,
    submodules: [
      {
        path: "/production/ps",
        label: "Planning/Scheduling",
        icon: ClipboardList,
      },
      { path: "/production/bom", label: "Bill of Materials", icon: Layers },
      { path: "/production/wo", label: "Work Orders", icon: Layers },
      { path: "/production/qc", label: "Quality Control", icon: Layers },
      { path: "/production/sfm", label: "Shop Floor Management", icon: Layers },
      { path: "/production/im", label: "Inventory Materials ", icon: Database },
      {
        path: "/production/mct",
        label: "Material Consumption",
        icon: ClipboardCheck,
      },
      { path: "/production/wm", label: "Wastage Management", icon: Recycle },
      {
        path: "/production/po",
        label: "Production Output & Yield",
        icon: FileSpreadsheet,
      },
      {
        path: "/production/cv",
        label: "Costing & Valuation",
        icon: Calculator,
      },
      {
        path: "/production/reporting",
        label: "Reporting/Analytics ",
        icon: Calculator,
      },
    ],
  },

  // PROCUREMENT
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    submodules: [
      {
        path: "/procurement/purchase-requisition",
        label: "Purchase Requisition",
        icon: ClipboardList,
      },
      { path: "/procurement/rq", label: "Request Quotation", icon: Mail },
      { path: "/procurement/po", label: "Purchase Orders", icon: FileText },
      { path: "/procurement/grn", label: "GRN", icon: ClipboardCheck },
      { path: "/procurement/pr", label: "Purchase Return", icon: RefreshCw },
      {
        path: "/procurement/vrec",
        label: "Vendor Reconciliation",
        icon: HeartHandshake,
      },
      {
        path: "/procurement/pa",
        label: "Procurement Analytics",
        icon: BarChart3,
      },
    ],
  },

  // SINGLE LINKS
  { path: "/multibranch", label: "Multibranch", icon: Building2 },
  { path: "/plant", label: "Plant Maintenance", icon: Factory },
  { path: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = () => {
  const { canAccess } = useAuth(); // Must have user.role
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // === FILTER VISIBLE MODULES ===
  const visible = useMemo(() => {
    return modules
      .map((module) => {
        if (module.submodules) {
          const accessibleSubs = module.submodules.filter((sub) =>
            canAccess(sub.path)
          );
          if (accessibleSubs.length === 0) return null;
          return { ...module, submodules: accessibleSubs };
        } else {
          return canAccess(module.path) ? module : null;
        }
      })
      .filter(Boolean);
  }, [canAccess]);

  const toggleMenu = useCallback((id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isParentActive = (submodules) => {
    return submodules.some((sub) => location.pathname.startsWith(sub.path));
  };

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 h-screen shadow-xl flex flex-col">
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 py-2">
        <ul className="space-y-1 px-2">
          {visible.map((module) => {
            const id = module.id || module.path;
            const hasSubmodules = !!module.submodules;
            const isOpen = openMenus[id];
            const isActiveParent =
              hasSubmodules && isParentActive(module.submodules);

            return (
              <li key={id}>
                {hasSubmodules ? (
                  <>
                    <button
                      onClick={() => toggleMenu(id)}
                      className={`
                        flex justify-between items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg
                        transition-all duration-200 group
                        ${
                          isActiveParent
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-800"
                        }
                      `}
                      aria-expanded={isOpen}
                      aria-controls={`submenu-${id}`}
                    >
                      <span className="flex items-center gap-3">
                        <MenuIcon
                          icon={module.icon}
                          size={18}
                          className="text-inherit"
                        />
                        <span>{module.label}</span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <ul
                      id={`submenu-${id}`}
                      role="menu"
                      className={`
                        ml-8 mt-1 space-y-1 overflow-hidden
                        grid transition-all duration-300 ease-in-out
                        ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
                      `}
                    >
                      <div className="min-h-0">
                        {module.submodules.map((sub) => {
                          const isActive = location.pathname === sub.path;
                          return (
                            <li key={sub.path} role="menuitem">
                              <NavLink
                                to={sub.path}
                                className={`
                                  flex items-center gap-2 px-3 py-1.5 text-sm rounded-md
                                  transition-colors duration-200
                                  ${
                                    isActive
                                      ? "bg-blue-600 text-white"
                                      : "hover:bg-gray-800 hover:text-white"
                                  }
                                `}
                              >
                                <MenuIcon
                                  icon={sub.icon}
                                  className="text-inherit"
                                />
                                <span>{sub.label}</span>
                              </NavLink>
                            </li>
                          );
                        })}
                      </div>
                    </ul>
                  </>
                ) : (
                  <NavLink
                    to={module.path}
                    className={({ isActive }) =>
                      `
                      flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-800 hover:text-white"
                      }
                    `
                    }
                  >
                    <MenuIcon icon={module.icon} size={18} />
                    <span>{module.label}</span>
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 text-xs text-gray-500 border-t border-gray-700">
        © 2025{" "}
        <span className="font-semibold text-gray-400">NextGen Ledger</span>
      </div>
    </aside>
  );
};
