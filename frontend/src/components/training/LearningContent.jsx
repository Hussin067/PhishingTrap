import React from "react";

const ObjectiveIcon = () => (
  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-500/20">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

const TipIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.7 18.3-8.6-14.9a1.2 1.2 0 0 0-2.2 0L2.3 18.3a1.2 1.2 0 0 0 1 1.7h17.4a1.2 1.2 0 0 0 1-1.7Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TIP_STYLES = {
  info: {
    container: "bg-brand-50/70 border-l-4 border-l-brand-500 border border-brand-200/60",
    icon: "text-brand-600",
    text: "text-brand-950",
  },
  warning: {
    container: "bg-warning-50/70 border-l-4 border-l-warning-500 border border-warning-200/60",
    icon: "text-warning-600",
    text: "text-amber-950",
  },
  danger: {
    container: "bg-danger-50/70 border-l-4 border-l-danger-500 border border-danger-200/60",
    icon: "text-danger-600",
    text: "text-rose-950",
  },
};

const LearningContent = ({
  heading,
  introduction,
  objectives = [],
  tips = [],
}) => {
  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-3xl border border-ink-100/70 shadow-card p-6 sm:p-8 animate-fade-up">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-ink-900 tracking-tight font-heading">
        {heading}
      </h2>

      {/* Introduction text */}
      {introduction && (
        <p className="mt-3.5 text-sm sm:text-base text-ink-500 leading-relaxed">
          {introduction}
        </p>
      )}

      {/* Objectives list */}
      {objectives.length > 0 && (
        <div className="mt-7 pt-6 border-t border-ink-100/60">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider font-heading">
              Learning Objectives
            </h3>
          </div>
          <ul className="space-y-3">
            {objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-3">
                <ObjectiveIcon />
                <span className="text-sm sm:text-base text-ink-700 leading-relaxed">
                  {objective}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips callouts */}
      {tips.length > 0 && (
        <div className="mt-7 pt-6 border-t border-ink-100/60 space-y-3.5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-500" />
            <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider font-heading">
              Important Security Tips
            </h3>
          </div>
          {tips.map((tip, index) => {
            const style = TIP_STYLES[tip.level] || TIP_STYLES.warning;
            return (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-soft transition-transform hover:-translate-y-0.5 ${style.container}`}
              >
                <TipIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
                <p className={`text-sm font-medium leading-relaxed ${style.text}`}>
                  {tip.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningContent;
