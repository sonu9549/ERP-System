import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Login } from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Super Admin Modules
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales/Sales";
import CRM from "./pages/CRM";
import HR from "./pages/HR";
import Finance from "./pages/Finance";
import QualityManagement from "./pages/QualityManagement";
import Logistics from "./pages/Logistics";
import Production from "./pages/Production";
import Procurement from "./pages/Procurement";
import Settings from "./pages/Settings";

// HR Submodules
import Employees from "./pages/HR/Employees";
import Attendance from "./pages/HR/Attendance";
import Payroll from "./pages/HR/Payroll";
import Salary from "./pages/HR/Salary";
import Leaves from "./pages/HR/Leaves";
import Performance from "./pages/HR/Performance";

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
                    path="/inventory"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Inventory />
                      </ProtectedRoute>
                    }
                  />

                  {/* Sales */}
                  <Route
                    path="/sales"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Sales />
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
                        <Employees />
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
                  <Route
                    path="/hr/employee"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <Employees />
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
