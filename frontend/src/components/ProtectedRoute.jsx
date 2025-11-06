import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requireSuperAdmin }) => {
  const { user, canAccess } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && user.role !== 1) {
    // ROLES.SUPER_ADMIN = 1
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
