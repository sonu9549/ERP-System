import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import {
  ChevronDown,
  ChevronRight,
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
  Clipboard,
  CheckSquare,
  RefreshCw,
  DollarSign,
  FileText as InvoiceIcon,
  Mail,
  Target,
  Headphones,
  Repeat,
  HeartHandshake,
  ShieldCheck,
  FolderTree,
  Database,
  Building,
  Boxes,
  AlertTriangle,
  Recycle,
} from "lucide-react";

const modules = [
  { path: "/", label: "Dashboard", icon: "📊" },

  // INVENTORY
  {
    label: "Inventory",
    icon: "📦",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/inventory/dashboard",
        label: "Dashboard",
        icon: <BarChart3 size={16} />,
      },
      {
        path: "/inventory/stock",
        label: "Stock Management",
        icon: <ChartCandlestick size={16} />,
      },
      {
        path: "/inventory/warehouse",
        label: "Warehouse",
        icon: <Warehouse size={16} />,
      },
      {
        path: "/inventory/products",
        label: "Products",
        icon: <ShoppingCart size={16} />,
      },
      {
        path: "/inventory/suppliers",
        label: "Suppliers",
        icon: <Users size={16} />,
      },
      {
        path: "/inventory/st",
        label: "Stock Transactions",
        icon: <RefreshCw size={16} />,
      },
      {
        path: "/inventory/purchase_manage",
        label: "Purchase Management",
        icon: <ClipboardList size={16} />,
      },
      {
        path: "/inventory/reports",
        label: "Reports",
        icon: <FileBarChart size={16} />,
      },
    ],
  },

  // SALES
  {
    label: "Sales",
    icon: <DollarSign size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/sales/cm",
        label: "Customers Master",
        icon: <Users size={16} />,
      },
      {
        path: "/sales/orders",
        label: "Sales Order",
        icon: <ClipboardCheck size={16} />,
      },
      {
        path: "/sales/shipping",
        label: "Shipping & Delivery",
        icon: <Truck size={16} />,
      },
      {
        path: "/sales/invoice",
        label: "Billing & Invoicing",
        icon: <InvoiceIcon size={16} />,
      },

      {
        path: "/sales/analytics",
        label: "Sales Analytics",
        icon: <LineChart size={16} />,
      },
      {
        path: "/sales/returns",
        label: "Returns",
        icon: <RefreshCw size={16} />,
      },
    ],
  },

  // CRM
  {
    label: "CRM",
    icon: <HeartHandshake size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/crm/cm", label: "Customer Master", icon: <Users size={16} /> },
      {
        path: "/crm/leads",
        label: "Leads & Opportunity",
        icon: <Target size={16} />,
      },
      {
        path: "/crm/customer-support",
        label: "Customer Support",
        icon: <Headphones size={16} />,
      },
      {
        path: "/crm/followups",
        label: "Follow-ups",
        icon: <Repeat size={16} />,
      },
      {
        path: "/crm/loyalty",
        label: "Loyalty Program",
        icon: <HeartHandshake size={16} />,
      },
      {
        path: "/crm/crm-analytics",
        label: "CRM Analytics",
        icon: <BarChart3 size={16} />,
      },
    ],
  },

  // HR MODULE
  {
    label: "Human Resources",
    icon: <Users size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/hr/employees",
        label: "Employee Management",
        icon: <Users size={14} />,
      },
      {
        path: "/hr/recruitment",
        label: "Recruitment & Onboarding",
        icon: <FileText size={14} />,
      },
      {
        path: "/hr/attendance",
        label: "Attendance & Time",
        icon: <Clock size={14} />,
      },
      {
        path: "/hr/payroll",
        label: "Payroll Management",
        icon: <Briefcase size={14} />,
      },
      {
        path: "/hr/performance",
        label: "Performance & Appraisal",
        icon: <TrendingUp size={14} />,
      },
    ],
  },

  // FINANCE
  {
    label: "Finance",
    icon: <Calculator size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/finance/ledger",
        label: "General Ledger",
        icon: <FileSpreadsheet size={16} />,
      },
      {
        path: "/finance/ap",
        label: "Accounts Payable",
        icon: <ClipboardList size={16} />,
      },
      {
        path: "/finance/ar",
        label: "Accounts Receivable",
        icon: <FileText size={16} />,
      },
      {
        path: "/finance/fam",
        label: "Fixed Assets Management",
        icon: <FileText size={16} />,
      },
      {
        path: "/finance/bf",
        label: "Budgeting and Forecasting",
        icon: <FileText size={16} />,
      },
      {
        path: "/finance/co",
        label: "Cost Accounting/Controlling(CO)",
        icon: <FileText size={16} />,
      },
      {
        path: "/finance/fscm",
        label: "Financial Supply Chain Management",
        icon: <FileText size={16} />,
      },
      {
        path: "/finance/taxcomp",
        label: "Taxation & Compliance",
        icon: <ShieldCheck size={16} />,
      },
      {
        path: "/finance/reports",
        label: "Reports",
        icon: <FileBarChart size={16} />,
      },
    ],
  },

  // QUALITY
  {
    label: "Quality Management",
    icon: <CheckSquare size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/quality/iqc",
        label: "Incoming Quality Control",
        icon: <ClipboardCheck size={16} />,
      },
      {
        path: "/quality/ipqc",
        label: "IPQC",
        icon: <ClipboardList size={16} />,
      },
      { path: "/quality/fqc", label: "FQC", icon: <FileText size={16} /> },
      {
        path: "/quality/qip",
        label: "Inspection Plan",
        icon: <FolderTree size={16} />,
      },
      { path: "/quality/ncm", label: "NCM", icon: <AlertTriangle size={16} /> },
      {
        path: "/quality/qc",
        label: "Quality Certificates",
        icon: <ShieldCheck size={16} />,
      },
    ],
  },

  // LOGISTICS
  {
    label: "Logistics",
    icon: "🚚",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/logistics/warehouse",
        label: "Warehouse Management",
        icon: <Warehouse size={16} />,
      },
      {
        path: "/logistics/transport",
        label: "Transport Management",
        icon: <Truck size={16} />,
      },
      {
        path: "/logistics/cross-docking",
        label: "Cross-Docking & Transfer",
        icon: <RefreshCw size={16} />,
      },
      {
        path: "/logistics/packaghandling",
        label: "Packaging & Handling",
        icon: <Boxes size={16} />,
      },
    ],
  },

  // PRODUCTION
  {
    label: "Production",
    icon: <Factory size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/production/mm",
        label: "Material Master",
        icon: <Database size={16} />,
      },
      {
        path: "/production/bom",
        label: "Bill of Materials",
        icon: <Layers size={16} />,
      },
      {
        path: "/production/pp",
        label: "Production Planning",
        icon: <ClipboardList size={16} />,
      },
      {
        path: "/production/mct",
        label: "Material Consumption Tracking",
        icon: <ClipboardCheck size={16} />,
      },
      {
        path: "/production/wm",
        label: "Wastage Management",
        icon: <Recycle size={16} />,
      },
      {
        path: "/production/po",
        label: "Production Output & Yield",
        icon: <FileSpreadsheet size={16} />,
      },
      {
        path: "/production/cv",
        label: "Costing & Valuation",
        icon: <Calculator size={16} />,
      },
    ],
  },

  // PROCUREMENT
  {
    label: "Procurement",
    icon: <ShoppingCart size={18} />,
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/procurement/purchase-requisition",
        label: "Purchase Requisition",
        icon: <ClipboardList size={16} />,
      },
      {
        path: "/procurement/rq",
        label: "Request Quotation",
        icon: <Mail size={16} />,
      },
      {
        path: "/procurement/po",
        label: "Purchase Orders",
        icon: <FileText size={16} />,
      },
      {
        path: "/procurement/grn",
        label: "GRN",
        icon: <ClipboardCheck size={16} />,
      },
      {
        path: "/procurement/pr",
        label: "Purchase Return",
        icon: <RefreshCw size={16} />,
      },
      {
        path: "/procurement/vrec",
        label: "Vendor Reconciliation",
        icon: <HeartHandshake size={16} />,
      },
      {
        path: "/procurement/pa",
        label: "Procurement Analytics",
        icon: <BarChart3 size={16} />,
      },
    ],
  },

  // MULTIBRANCH
  { path: "/multibranch", label: "Multibranch", icon: <Building2 size={18} /> },

  // PLANT MAINTENANCE
  { path: "/plant", label: "Plant Maintenance", icon: <Factory size={18} /> },

  // SETTINGS
  {
    path: "/settings",
    label: "Settings",
    icon: <Settings size={18} />,
    minRole: ROLES.SUPER_ADMIN,
  },
];

export const Sidebar = () => {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(null);

  const visible = modules.filter((m) => !m.minRole || isSuperAdmin);

  const toggleDropdown = (label) => {
    setOpen(open === label ? null : label);
  };

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 h-screen shadow-lg flex flex-col">
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        <ul className="mt-2 space-y-1">
          {visible.map((m) => (
            <li key={m.label || m.path}>
              {m.submodules ? (
                <>
                  <button
                    onClick={() => toggleDropdown(m.label)}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm font-medium hover:bg-gray-800 rounded-md transition"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{m.icon}</span>
                      {m.label}
                    </span>
                    {open === m.label ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>

                  <ul
                    className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${
                      open === m.label ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    {m.submodules.map((sub) => (
                      <li key={sub.path}>
                        <NavLink
                          to={sub.path}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                              isActive
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-800 hover:text-white"
                            }`
                          }
                        >
                          {sub.icon && <span>{sub.icon}</span>}
                          {sub.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <NavLink
                  to={m.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <span className="mr-3 text-lg">{m.icon}</span>
                  {m.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 text-xs text-gray-500 border-t border-gray-700">
        © 2025 NextGen Ledger
      </div>
    </aside>
  );
};
