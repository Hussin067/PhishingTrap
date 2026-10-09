import React from "react";

const VARIANT_STYLES = {
  primary:
    "btn-glow text-white border border-transparent focus-visible:ring-brand-500",
  secondary:
    "bg-white/90 backdrop-blur-sm text-ink-800 border border-ink-100 hover:bg-white hover:border-ink-200 shadow-soft focus-visible:ring-brand-500",
  danger:
    "bg-gradient-to-r from-danger-600 to-danger-500 text-white border border-transparent hover:from-danger-500 hover:to-danger-600 shadow-glow-danger focus-visible:ring-danger-500",
  ghost:
    "bg-transparent text-ink-600 border border-transparent hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-brand-500",
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
      strokeWidth="3.5"
    />
    <path
      className="opacity-90"
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        active:scale-95 cursor-pointer
        ${variantClasses} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

export default Button;
