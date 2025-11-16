// src/constants/roles.js
export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  MANAGER: 3,
  SALES_MANAGER: 4,
  INVENTORY_MANAGER: 5,
  CRM_MANAGER: 6,
  HR_MANAGER: 7,
  FINANCE_MANAGER: 8,
  QUALITY_MANAGER: 9,
  LOGISTICS_MANAGER: 10,
  PRODUCTION_MANAGER: 11,
  PROCUREMENT_MANAGER: 12,
  PLANT_MANAGER: 13,
  SALES_REP: 14,
  USER: 99,
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.USER]: "User",
  [ROLES.SALES_MANAGER]: "Admin",
};

export const DEMO_EMAILS = [
  "admin@nextgen.com",
  "sales@nextgen.com",
  "user@nextgen.com",
];
