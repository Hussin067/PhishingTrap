import React from "react";


const VARIANT_STYLES = {
  primary:
    "bg-blue-600 text-white border border-transparent hover:bg-blue-700 focus-visible:ring-blue-500",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-blue-500",
  danger:
    "bg-red-600 text-white border border-transparent hover:bg-red-700 focus-visible:ring-red-500",
  ghost:
    "bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 focus-visible:ring-blue-500",
};


const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
    />
  </svg>
);


const Button = ({
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const variantClasses = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

export default Button;
