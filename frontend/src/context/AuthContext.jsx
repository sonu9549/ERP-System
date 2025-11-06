// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { MODULE_ACCESS } from "../config/moduleAccessConfig";
import { ROLES } from "../constants/roles";

export const ALL_PATHS = Object.keys(MODULE_ACCESS);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("current_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // allowedPaths hata do
        const { allowedPaths, ...cleanUser } = parsed;
        setUser(cleanUser);
      } catch (e) {
        console.error("Parse error:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("current_user");
    }
  }, [user]);

  // ASYNC LOGIN
  const login = async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          let users = JSON.parse(localStorage.getItem("erp_users_v2") || "[]");

          // Agar users nahi → default bana do (NO allowedPaths)
          if (users.length === 0) {
            const defaultUsers = [
              {
                id: 1,
                name: "Super Admin",
                email: "admin@nextgen.com",
                password: "admin123",
                role: ROLES.SUPER_ADMIN,
              },
              {
                id: 2,
                name: "Sales Manager",
                email: "sales@nextgen.com",
                password: "sales123",
                role: ROLES.SALES_MANAGER,
              },
              {
                id: 3,
                name: "Regular User",
                email: "user@nextgen.com",
                password: "user123",
                role: ROLES.USER,
              },
            ];
            users = defaultUsers;
            localStorage.setItem("erp_users_v2", JSON.stringify(defaultUsers));
          }

          const found = users.find(
            (u) =>
              u.email.toLowerCase() === email.toLowerCase().trim() &&
              u.password === password
          );

          if (found) {
            // allowedPaths HATA DO
            const { allowedPaths, ...loggedInUser } = found;
            setUser(loggedInUser);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: "Invalid email or password" });
          }
        } catch (e) {
          console.error(e);
          resolve({ success: false, error: "System error" });
        }
      }, 400);
    });
  };

  const logout = () => {
    setUser(null);
  };

  const canAccess = (path) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;

    const allowedRoles = MODULE_ACCESS[path];
    return allowedRoles ? allowedRoles.includes(user.role) : false;
  };

  const canAccessSettings = canAccess("/settings");

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
