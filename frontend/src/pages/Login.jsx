// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield } from "lucide-react";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const email = watch("email") ?? "";
  const password = watch("password") ?? "";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Submit handler — Real API via Axios
  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data.email.trim(), data.password);
    if (!result.success) {
      const errorMsg =
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error);
      setError("root", { message: errorMsg });
    } else {
      navigate("/", { replace: true });
    }
    setIsLoading(false);
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
            {/* FORM */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              aria-label="Login form"
              noValidate
            >
              <fieldset disabled={isLoading} className="space-y-6">
                {/* Email */}
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Please enter a valid email",
                      },
                    })}
                    className="peer w-full px-4 py-4 bg-gray-700/50 backdrop-blur-md border border-gray-600 rounded-2xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                    placeholder="Email"
                    aria-invalid={!!errors.email}
                  />
                  <label
                    htmlFor="email"
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
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="relative group">
                  <input
                    type="password"
                    id="password"
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="peer w-full px-4 py-4 bg-gray-700/50 backdrop-blur-md border border-gray-600 rounded-2xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                    placeholder="Password"
                    aria-invalid={!!errors.password}
                  />
                  <label
                    htmlFor="password"
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
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Server Error */}
                {errors.root && (
                  <div
                    className="p-3 bg-red-900/30 border border-red-800/50 text-red-300 text-sm rounded-xl text-center backdrop-blur-sm"
                    role="alert"
                    aria-live="assertive"
                  >
                    {errors.root.message}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`relative w-full py-4 rounded-2xl font-bold text-white overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-100
                    bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800
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
              </fieldset>
            </form>

            {/* DEMO CREDENTIALS (Optional - for dev only) */}
            <div className="mt-6 p-4 bg-gray-700/30 backdrop-blur-md rounded-2xl border border-gray-600/50 text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-2">Demo Credentials</p>
              <div className="space-y-1">
                <p>
                  <strong>Super Admin:</strong> admin@nextgen.com / admin123
                </p>
                <p>
                  <strong>Sales Manager:</strong> sales@nextgen.com / sales123
                </p>
                <p>
                  <strong>Regular User:</strong> user@nextgen.com / user123
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-center text-gray-500 text-xs mt-8">
            © 2025 NextGen Ledger • Secure Enterprise Platform
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
