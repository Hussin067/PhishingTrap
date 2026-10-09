import React from "react";

/**
 * Visual styles per badge variant. Centralized here so variant styling
 * is defined once instead of via repeated conditionals in the JSX.
 */
const VARIANT_STYLES = {
  category: "bg-brand-50 text-brand-600 ring-1 ring-brand-500/20",
  difficulty: "bg-ink-50 text-ink-600 ring-1 ring-ink-300/40",
  success: "bg-success-50 text-success-600 ring-1 ring-success-500/25",
  warning: "bg-warning-50 text-warning-600 ring-1 ring-warning-500/25",
  danger: "bg-danger-50 text-danger-600 ring-1 ring-danger-500/25",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-300/40",
};

const VARIANT_DOTS = {
  category: "bg-brand-500",
  difficulty: "bg-ink-400",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  neutral: "bg-slate-400",
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
  const dotColor = VARIANT_DOTS[variant] || VARIANT_DOTS.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap tracking-wide transition-colors ${variantClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {children}
    </span>
  );
};

export default Badge;
