// src/components/Navbar.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const roleLabel = (role) => {
  switch (role) {
    case 1:
      return "Super Admin";
    case 2:
      return "User";
    default:
      return "Guest";
  }
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white shadow-lg">
      {/* Brand */}
      <div className="text-xl font-bold tracking-wide">
        <Link to="/" className="hover:text-blue-400 transition-colors">
          NextGen Ledger
        </Link>
      </div>

      {/* Profile Dropdown */}
      <div className="relative">
        <button
          className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full font-semibold">
            {roleLabel(user.role).charAt(0)}
          </div>
          <span className="font-medium hidden sm:block">
            {roleLabel(user.role)}
          </span>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="px-4 py-2 text-sm text-gray-600 border-b">
              Logged in as{" "}
              <strong className="text-gray-900">{roleLabel(user.role)}</strong>
            </div>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-sm"
              onClick={() => alert("Profile settings coming soon")}
            >
              Settings
            </button>
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition text-sm"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="sm:hidden flex items-center justify-center ml-4 bg-gray-800 p-2 rounded-md hover:bg-gray-700 transition"
        onClick={() => setMobileMenuOpen(true)}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 bg-gray-900 text-white p-4 shadow-lg animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Example Sidebar content — replace with your <Sidebar /> */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="space-y-2">
              <Link
                to="/"
                className="block px-2 py-1 hover:bg-gray-800 rounded"
              >
                Dashboard
              </Link>
              <Link
                to="/finance"
                className="block px-2 py-1 hover:bg-gray-800 rounded"
              >
                Finance
              </Link>
              <Link
                to="/sales"
                className="block px-2 py-1 hover:bg-gray-800 rounded"
              >
                Sales
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
