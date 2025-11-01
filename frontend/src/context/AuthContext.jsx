// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";

export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  USER: 3,
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Mock user database (replace with API)
  const mockUsers = [
    {
      id: 1,
      email: "super@erp.com",
      password: "admin123",
      role: ROLES.SUPER_ADMIN,
      name: "Super Admin",
    },
    {
      id: 2,
      email: "user@erp.com",
      password: "user123",
      role: ROLES.USER,
      name: "John Doe",
    },
  ];

  const login = (email, password) => {
    const found = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      setUser({ ...found });
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => setUser(null);

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  return (
    <AuthContext.Provider value={{ user, login, logout, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
