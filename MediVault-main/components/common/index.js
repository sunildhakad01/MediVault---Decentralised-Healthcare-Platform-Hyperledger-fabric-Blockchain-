import React from "react";

// ─── LoadingSpinner ────────────────────────────────────────────────────────────
const LoadingSpinner = ({ size = "medium", color = "emerald" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const colorClasses = {
    emerald: "text-emerald-600",
    teal: "text-teal-600",
    white: "text-white",
    gray: "text-gray-400",
    // kept for backward compat
    blue: "text-emerald-600",
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} ${colorClasses[color] ?? colorClasses.emerald} animate-spin`}>
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
};

// ─── Button ────────────────────────────────────────────────────────────────────
export const Button = ({
  children,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white focus:ring-emerald-500 shadow-md hover:shadow-lg hover:-translate-y-0.5",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-400",
    success:
      "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white focus:ring-green-500 shadow-md hover:shadow-lg",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white focus:ring-red-500 shadow-md hover:shadow-lg",
    outline:
      "border-2 border-emerald-500 hover:bg-emerald-50 text-emerald-700 focus:ring-emerald-500",
    ghost:
      "hover:bg-emerald-50 text-emerald-700 focus:ring-emerald-400",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2.5 text-sm",
    large: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant] ?? variants.primary} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="small" color="white" />}
      <span className={loading ? "ml-2" : ""}>{children}</span>
    </button>
  );
};

// ─── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = "", padding = "default" }) => {
  const paddingClasses = {
    none: "",
    small: "p-4",
    default: "p-6",
    large: "p-8",
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = "medium" }) => {
  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-lg",
    large: "max-w-4xl",
    xl: "max-w-6xl",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div
          className={`inline-block align-bottom bg-white rounded-2xl px-4 pt-6 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full sm:p-8`}
        >
          {title && (
            <div className="mb-5 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = "default", size = "medium", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-emerald-100 text-emerald-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    teal: "bg-teal-100 text-teal-800",
    cyan: "bg-cyan-100 text-cyan-800",
    // kept for backward compat
    blue: "bg-emerald-100 text-emerald-800",
  };

  const sizes = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant] ?? variants.default} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

// ─── Input ─────────────────────────────────────────────────────────────────────
export const Input = ({
  label,
  error,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 text-gray-900
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
          ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
          ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

// ─── Select ────────────────────────────────────────────────────────────────────
export const Select = ({
  label,
  error,
  required = false,
  children,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm text-gray-900
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white
          ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

// ─── FileUpload ────────────────────────────────────────────────────────────────
export const FileUpload = ({
  label,
  error,
  accept,
  onChange,
  required = false,
  preview = null,
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center space-x-4">
        <label className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer transition-colors">
          <input type="file" className="hidden" accept={accept} onChange={onChange} />
          Choose File
        </label>
        {preview && (
          <div className="w-16 h-16 border border-gray-300 rounded-xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default LoadingSpinner;
