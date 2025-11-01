import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        reset(); // clear form
        navigate("/", { replace: true });
      } else {
        setError("root", { message: result.error || "Invalid credentials" });
      }
    } catch (err) {
      setError("root", { message: "Server error. Please try again later." });
    }
  };

  return (
    <div className="login-container flex items-center justify-center min-h-screen bg-gray-100">
      <div className="login-card bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="login-header text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ERP Login</h2>
          <p className="text-gray-500">Sign in with your credentials</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="login-form space-y-5"
        >
          <div className="form-group">
            <label className="block mb-1 text-gray-700 font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <span className="error text-red-500 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="block mb-1 text-gray-700 font-medium">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <span className="error text-red-500 text-sm">
                {errors.password.message}
              </span>
            )}
          </div>

          {errors.root && (
            <div className="error server-error text-red-600 text-sm text-center">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="login-btn w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer mt-6 text-gray-600 text-sm text-center">
          <p className="font-semibold">Demo Accounts:</p>
          <p>
            Super Admin: <code>super@erp.com</code> / <code>admin123</code>
          </p>
          <p>
            User: <code>user@erp.com</code> / <code>user123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
