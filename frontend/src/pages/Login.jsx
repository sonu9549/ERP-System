// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Crown, Shield, User, LogIn } from "lucide-react";
import { ROLES } from "../constants/roles";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [demoUsers, setDemoUsers] = useState([]);
  const [activeDemo, setActiveDemo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm();

  const email = watch("email");
  const password = watch("password");

  // 1. Load demo users from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("erp_users_v2");
    if (stored) {
      try {
        const all = JSON.parse(stored);
        const demos = all.filter((u) =>
          [
            "admin@nextgen.com",
            "sales@nextgen.com",
            "user@nextgen.com",
          ].includes(u.email)
        );
        setDemoUsers(demos);
        if (demos.length > 0) setActiveDemo(demos[0]);
      } catch (e) {
        console.error("Failed to load demo users", e);
      }
    }
  }, []);

  // 2. Auto-fill form when demo tab clicked
  useEffect(() => {
    if (activeDemo) {
      setValue("email", activeDemo.email);
      setValue("password", activeDemo.password);
    }
  }, [activeDemo, setValue]);

  // 3. Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true }); // sabko dashboard pe
    }
  }, [user, navigate]);

  // 4. Submit handler
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email.trim(), data.password);
      if (!result.success) {
        setError("root", { message: result.error });
      }
      // success → redirect by useEffect
    } catch (err) {
      setError("root", { message: "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Role info for demo tabs
  const roleInfo = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return {
          icon: <Crown className="w-5 h-5" />,
          gradient: "from-purple-500 to-purple-700",
          hover: "hover:from-purple-600 hover:to-purple-800",
          label: "Super Admin",
        };
      case ROLES.ADMIN:
        return {
          icon: <Shield className="w-5 h-5" />,
          gradient: "from-blue-500 to-blue-700",
          hover: "hover:from-blue-600 hover:to-blue-800",
          label: "Admin",
        };
      default:
        return {
          icon: <User className="w-5 h-5" />,
          gradient: "from-green-500 to-green-700",
          hover: "hover:from-green-600 hover:to-green-800",
          label: "User",
        };
    }
  };

  return (
    <>
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* LOGO & TITLE */}
          <div className="text-center mb-10 animate-fade-down">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 backdrop-blur-md rounded-2xl mb-4 shadow-2xl border border-gray-700">
              <Shield className="w-8 h-8 text-gray-300" />
            </div>
            <h1 className="text-4xl font-bold text-white drop-shadow-md">
              NextGen LEDGER
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Enterprise Resource Planning System
            </p>
          </div>

          {/* GLASS CARD */}
          <div className="backdrop-blur-2xl bg-gray-800/40 border border-gray-700/50 rounded-3xl shadow-2xl p-8 animate-fade-up">
            {/* DEMO TABS */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {demoUsers.map((u) => {
                const info = roleInfo(u.role);
                const active = activeDemo?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setActiveDemo(u)}
                    className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
                      active
                        ? "border-gray-500 shadow-xl"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${info.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${info.hover}`}
                    />
                    <div
                      className={`relative z-10 flex flex-col items-center gap-2 ${
                        active ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {info.icon}
                      <span className="text-xs font-semibold">
                        {info.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div className="relative group">
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                  })}
                  className="peer w-full px-4 py-4 bg-gray-700/50 backdrop-blur-md border border-gray-600 rounded-2xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                  placeholder="Email"
                />
                <label
                  className={`absolute left-4 -top-2.5 bg-gray-800 px-2 text-xs font-medium text-gray-300 transition-all duration-300 
                  ${
                    email
                      ? "scale-75 -translate-y-4"
                      : "scale-100 translate-y-3"
                  } 
                  peer-focus:scale-75 peer-focus:-translate-y-4`}
                >
                  Email Address
                </label>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative group">
                <input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="peer w-full px-4 py-4 bg-gray-700/50 backdrop-blur-md border border-gray-600 rounded-2xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                  placeholder="Password"
                />
                <label
                  className={`absolute left-4 -top-2.5 bg-gray-800 px-2 text-xs font-medium text-gray-300 transition-all duration-300 
                  ${
                    password
                      ? "scale-75 -translate-y-4"
                      : "scale-100 translate-y-3"
                  } 
                  peer-focus:scale-75 peer-focus:-translate-y-4`}
                >
                  Password
                </label>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error */}
              {errors.root && (
                <div className="p-3 bg-red-900/30 border border-red-800/50 text-red-300 text-sm rounded-xl text-center backdrop-blur-sm">
                  {errors.root.message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`relative w-full py-4 rounded-2xl font-bold text-white overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-100
                  bg-gradient-to-r ${
                    activeDemo
                      ? roleInfo(activeDemo.role).gradient
                      : "from-gray-500 to-gray-700"
                  }
                  ${
                    activeDemo
                      ? roleInfo(activeDemo.role).hover
                      : "hover:from-gray-600 hover:to-gray-800"
                  }
                  shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Login
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            </form>

            {/* DEMO INFO */}
            {activeDemo && (
              <div className="mt-6 p-4 bg-gray-700/30 backdrop-blur-md rounded-2xl border border-gray-600/50">
                <p className="text-gray-300 text-xs font-medium mb-1">
                  Demo Account
                </p>
                <p className="text-gray-400 text-xs">
                  <strong>Email:</strong> {activeDemo.email}
                </p>
                <p className="text-gray-400 text-xs">
                  <strong>Pass:</strong> {activeDemo.password}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <p className="text-center text-gray-500 text-xs mt-8">
            © 2025 NextGen Ledger • Secure Enterprise Platform
          </p>
        </div>
      </div>

      {/* ANIMATIONS */}
      <div className="text-center mb-10 animate-fade-in"></div>
    </>
  );
};

export default Login;
