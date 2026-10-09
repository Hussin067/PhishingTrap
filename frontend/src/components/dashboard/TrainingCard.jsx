import React from "react";

const STATUS_STYLES = {
  "Not Started": {
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-300/50",
    dot: "bg-slate-400",
  },
  "In Progress": {
    badge: "bg-warning-50 text-warning-700 ring-1 ring-warning-500/30",
    dot: "bg-warning-500 animate-pulse",
  },
  Completed: {
    badge: "bg-success-50 text-success-700 ring-1 ring-success-500/30",
    dot: "bg-success-500",
  },
};

const DEFAULT_ACTION_LABEL = {
  "Not Started": "Start Training",
  "In Progress": "Continue Training",
  Completed: "Review Training",
};

const TrainingCard = ({
  title,
  category,
  difficulty,
  status = "Not Started",
  description,
  actionLabel,
  score,
  onAction = () => {},
}) => {
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES["Not Started"];
  const buttonLabel =
    actionLabel || DEFAULT_ACTION_LABEL[status] || "Start Training";

  return (
    <div className="group relative overflow-hidden bg-white/85 backdrop-blur-sm rounded-2xl border border-ink-100/70 shadow-card p-5 sm:p-6 flex flex-col gap-4 card-hover hover:border-brand-300/60 hover:shadow-card-hover transition-all duration-300">
      {/* Top subtle gradient highlight line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-400 opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Header row: title and status badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-ink-900 leading-snug font-heading group-hover:text-brand-600 transition-colors">
          {title}
        </h3>
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${statusStyle.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {status}
        </span>
      </div>

      {/* Meta tags / chips */}
      <div className="flex flex-wrap items-center gap-2">
        {category && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-600 ring-1 ring-brand-500/20">
            {category}
          </span>
        )}
        {difficulty && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-ink-50 text-ink-600 ring-1 ring-ink-300/40">
            {difficulty}
          </span>
        )}
        {score !== undefined && score !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-50 text-accent-700 ring-1 ring-accent-500/30">
            <svg
              className="w-3 h-3 text-accent-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Score: {score}%
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-ink-400 leading-relaxed line-clamp-3">
          {description}
        </p>
      )}

      {/* Action button */}
      <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={onAction}
          className="group/btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-glow-brand hover:from-brand-500 hover:to-brand-600 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span>{buttonLabel}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TrainingCard;
