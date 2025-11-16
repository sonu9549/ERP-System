// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { MODULE_ACCESS } from "../config/moduleAccessConfig";
import { ROLES } from "../constants/roles";

export const ALL_PATHS = Object.keys(MODULE_ACCESS);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login on refresh
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem("access_token")) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Save token
      localStorage.setItem("access_token", response.data.access_token);
      const res = await api.get("/users/me");
      setUser(res.data);

      return { ...response.data, success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.values(err.response.data)
              .flat()
              .map((e) => e.msg || e)
              .join(", ")
          : "Invalid email or password") ||
        "Login failed. Please try again.";

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const canAccess = (path) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    const allowed = MODULE_ACCESS[path];
    return allowed ? allowed.includes(user.role) : false;
  };

  const canAccessSettings = canAccess("/settings");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        canAccess,
        canAccessSettings,
        ROLES,
        ALL_PATHS,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
