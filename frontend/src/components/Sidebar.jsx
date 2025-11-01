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
} from "lucide-react";

const modules = [
  { path: "/", label: "Dashboard", icon: "📊" },

  // INVENTORY
  {
    label: "Inventory",
    icon: "📦",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/inventory/stock", label: "Stock" },
      { path: "/inventory/warehouse", label: "Warehouse" },
      { path: "/inventory/reorder", label: "Reorder Levels" },
    ],
  },

  // SALES
  {
    label: "Sales",
    icon: "💰",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/sales/orders", label: "Orders" },
      { path: "/sales/invoices", label: "Invoices" },
      { path: "/sales/customers", label: "Customers" },
    ],
  },

  // CRM
  {
    label: "CRM",
    icon: "🤝",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/crm/leads", label: "Leads" },
      { path: "/crm/contacts", label: "Contacts" },
      { path: "/crm/followups", label: "Follow-ups" },
    ],
  },

  // 🧩 HR MODULE (Enhanced)
  {
    label: "Human Resources",
    icon: "👥",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      {
        path: "/hr/employee",
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
    icon: "💼",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/finance/ledger", label: "General Ledger" },
      { path: "/finance/ap", label: "Accounts Payable" },
      { path: "/finance/ar", label: "Accounts Receivable" },
      { path: "/finance/taxcoml", label: "Taxation & Compliance" },
      { path: "/finance/reports", label: "Reports" },
    ],
  },

  // QUALITY
  {
    label: "Quality Management",
    icon: "🔍",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/quality/inspection", label: "Inspection" },
      { path: "/quality/audit", label: "Audit" },
    ],
  },

  // LOGISTICS
  {
    label: "Logistics",
    icon: "🚚",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/logistics/shipping", label: "Shipping" },
      { path: "/logistics/tracking", label: "Tracking" },
      { path: "/logistics/dispatch", label: "Dispatch" },
    ],
  },

  // PRODUCTION
  {
    label: "Production",
    icon: "🏭",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/production/orders", label: "Production Orders" },
      { path: "/production/planning", label: "Planning" },
      { path: "/production/machines", label: "Machines" },
    ],
  },

  // PROCUREMENT
  {
    label: "Procurement",
    icon: "🛒",
    minRole: ROLES.SUPER_ADMIN,
    submodules: [
      { path: "/procurement/purchase-orders", label: "Purchase Orders" },
      { path: "/procurement/vendors", label: "Vendors" },
    ],
  },

  // MULTIBRANCH
  { path: "/multibranch", label: "Multibranch", icon: "🏢" },

  // SETTINGS
  {
    path: "/settings",
    label: "Settings",
    icon: "⚙️",
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
                  {/* Main module button */}
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

                  {/* Submodule list */}
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
