import React from "react";

/**
 * Visual styles per badge variant. Centralized here so variant styling
 * is defined once instead of via repeated conditionals in the JSX.
 */
const VARIANT_STYLES = {
  category: "bg-blue-50 text-blue-600",
  difficulty: "bg-slate-100 text-slate-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  neutral: "bg-slate-100 text-slate-600",
};

/**
 * Badge
 *
 * Small reusable visual label used throughout the Phishing Trap AI
 * portal (e.g. category, difficulty, and status indicators). Purely
 * presentational — no API calls, navigation, or business logic.
 *
 * Props:
 * - children: Text displayed inside the badge.
 * - variant ("category" | "difficulty" | "success" | "warning" | "danger" | "neutral"):
 *     Controls the visual style. Defaults to "neutral".
 * - className (string, optional): Additional classes merged onto the badge.
 */
const Badge = ({ children, variant = "neutral", className = "" }) => {
  const variantClasses = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;

  return (
    <span
      className={`inline-flex items-center justify-center text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
