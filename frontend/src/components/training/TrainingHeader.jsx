import React from "react";

const TrainingHeader = ({ title, category, difficulty, onBack = () => {} }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border-b border-white/5 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Background grid & subtle lights */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-accent-500/10 blur-2xl" />

      <div className="relative max-w-4xl mx-auto">
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-sm font-medium text-ink-300 hover:text-white transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1 text-brand-400"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back</span>
        </button>

        <h1 className="mt-3 text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
          {title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 ring-1 ring-brand-400/30 backdrop-blur-sm">
              {category}
            </span>
          )}
          {difficulty && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent-500/15 text-accent-300 ring-1 ring-accent-400/30 backdrop-blur-sm">
              {difficulty}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingHeader;
