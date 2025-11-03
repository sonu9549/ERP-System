import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { OrderShippingProvider } from "./context/OrderShippingContext";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Super Admin Modules

import CRM from "./pages/CRM/CRM";
import HR from "./pages/HR/HR";
import Finance from "./pages/Finance/Finance";
import QualityManagement from "./pages/QualityManagement/QualityManagement";
import Logistics from "./pages/Logistics/Logistics";
import Production from "./pages/Production/Production";
import Procurement from "./pages/Procurement/Procurement";
import Settings from "./pages/Settings";
import Multibranch from "./pages/Multibranch/Multibranch";

// HR Submodules

import Attendance from "./pages/HR/Attendance";
import Payroll from "./pages/HR/Payroll";
import Leaves from "./pages/HR/Leaves";
import Performance from "./pages/HR/Performance";
import EmploymentManagement from "./pages/HR/EmployeeManagement";

// Finance
import GeneralLedger from "./pages/Finance/GeneralLedger";
import AccountPayable from "./pages/Finance/AccountsPayable";
import AccountReceivable from "./pages/Finance/AccountsReceivable";
import TaxationCompliance from "./pages/Finance/TaxationCompliance";
import FinancialReports from "./pages/Finance/Reports";

// Sales
import CustomerMaster from "./pages/Sales/CustomerMaster";
import SalesOrder from "./pages/Sales/SalesOrder";
import Invoice from "./pages/Sales/Invoice";
import Shipping from "./pages/Sales/ShippingDelivery";
import SalesAnalytics from "./pages/Sales/SalesAnalytics";
import Returns from "./pages/Sales/Returns";

//Inventory
import InventoryDashboard from "./pages/Inventory/Dashboard";
import StockManagement from "./pages/Inventory/StockManagement";
import StockTransactions from "./pages/Inventory/StockTransactions";
import PurchaseManagement from "./pages/Inventory/PurchaseManagement";
import WarehouseBins from "./pages/Inventory/Warehouse";
import Products from "./pages/Inventory/Products";
import Suppliers from "./pages/Inventory/Suppliers";
import Reports from "./pages/Inventory/Reports";
import { FinanceProvider } from "./context/FinanceContext";

/* ------------------------------------------------------------------ */
/* Layout (Navbar + Sidebar + Main) */
/* ------------------------------------------------------------------ */
const Layout = ({ children }) => (
  <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
    {/* Navbar */}
    <Navbar />

    {/* Main Layout */}
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <Sidebar />
      </aside>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Application Routes */
/* ------------------------------------------------------------------ */
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Protected Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/" element={<Dashboard />} />

                  {/* Inventory */}
                  <Route
                    path="/inventory/dashboard"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <InventoryDashboard />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/stock"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <StockManagement />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/st"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <StockTransactions />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/purchase_manage"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <PurchaseManagement />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/warehouse"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <WarehouseBins />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/products"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <Products />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/suppliers"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <Suppliers />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory/reports"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <Reports />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />

                  {/* Sales */}

                  <Route
                    path="/sales/cm"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <CustomerMaster />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales/orders"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <SalesOrder />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales/invoice"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Invoice />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales/shipping"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <Shipping />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales/analytics"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <SalesAnalytics />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales/returns"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <OrderShippingProvider>
                          <Returns />
                        </OrderShippingProvider>
                      </ProtectedRoute>
                    }
                  />

                  {/* CRM */}
                  <Route
                    path="/crm"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <CRM />
                      </ProtectedRoute>
                    }
                  />

                  {/* HR Module */}
                  <Route
                    path="/hr"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <HR />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hr/employees"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <EmploymentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hr/attendance"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Attendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hr/payroll"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Payroll />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hr/leave"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Leaves />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hr/performance"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Performance />
                      </ProtectedRoute>
                    }
                  />

                  {/* Finance */}
                  <Route
                    path="/finance"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Finance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/finance/ledger"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <FinanceProvider>
                          <GeneralLedger />
                        </FinanceProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/finance/ap"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <FinanceProvider>
                          <AccountPayable />
                        </FinanceProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/finance/ar"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <FinanceProvider>
                          <AccountReceivable />
                        </FinanceProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/finance/taxcomp"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <TaxationCompliance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/finance/reports"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <FinancialReports />
                      </ProtectedRoute>
                    }
                  />

                  {/* Quality Management */}
                  <Route
                    path="/quality"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <QualityManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Logistics */}
                  <Route
                    path="/logistics"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Logistics />
                      </ProtectedRoute>
                    }
                  />

                  {/* Production */}
                  <Route
                    path="/production"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Production />
                      </ProtectedRoute>
                    }
                  />

                  {/* Procurement */}
                  <Route
                    path="/procurement"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Procurement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Settings */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/multibranch"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Multibranch />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};
export default App;
