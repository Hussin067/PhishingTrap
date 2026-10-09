/* eslint-disable react-refresh/only-export-components -- shared helpers live beside small components */
import Badge from "../common/Badge";

export const scenarioLabel = (scenario) =>
  scenario ? scenario.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "—";

export const percent = (value, digits = 0) =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;

export const formatDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const RISK = {
  low: ["success", "Low risk"],
  medium: ["warning", "Medium risk"],
  high: ["danger", "High risk"],
  insufficient_data: ["neutral", "Not enough data"],
};

export function RiskBadge({ level }) {
  const [variant, label] = RISK[level] || RISK.insufficient_data;
  return <Badge variant={variant}>{label}</Badge>;
}

const EVIDENCE = {
  none: ["neutral", "No data"],
  low: ["warning", "Low evidence"],
  moderate: ["category", "Moderate"],
  good: ["success", "Good evidence"],
};

export function EvidenceBadge({ level }) {
  const [variant, label] = EVIDENCE[level] || EVIDENCE.none;
  return <Badge variant={variant}>{label}</Badge>;
}

export function PageTitle({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 font-heading tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorNotice({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-600">
      <p className="font-semibold">Could not load this page</p>
      <p className="mt-1">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 underline font-medium cursor-pointer">
          Try again
        </button>
      )}
    </div>
  );
}

/** Horizontal bar: value is 0..1 (or null for "no data"). */
export function Bar({ value, tone = "brand", label }) {
  const width = value === null || value === undefined ? 0 : Math.max(2, Math.min(100, value * 100));
  const colors = {
    brand: "bg-brand-500",
    danger: "bg-danger-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
  };
  return (
    <div className="flex items-center gap-2 min-w-[8rem]">
      <div className="flex-1 h-2 rounded-full bg-ink-50 overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-12 text-right text-xs tabular-nums text-ink-600">{label ?? percent(value)}</span>
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="text-sm text-ink-400 py-6 text-center">{children}</p>;
}

export const tableHead = "text-left text-xs font-semibold uppercase tracking-wide text-ink-400 px-3 py-2";
export const tableCell = "px-3 py-3 text-sm text-ink-700";
