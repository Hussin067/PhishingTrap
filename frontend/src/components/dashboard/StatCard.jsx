import React from "react";

const StatCard = ({ title, value, description, icon }) => {
  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur-sm rounded-2xl border border-ink-100/70 shadow-card p-5 sm:p-6 card-hover animate-fade-up">
      {/* Top subtle glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ink-400 truncate">
          {title}
        </h3>
        {icon && (
          <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 ring-1 ring-brand-500/15 shadow-soft">
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight font-heading">
        {value}
      </p>

      {description && (
        <p className="mt-1.5 text-sm text-ink-400">{description}</p>
      )}

      {/* Modern gradient accent indicator */}
      <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 opacity-70" />
    </div>
  );
};

export default StatCard;
