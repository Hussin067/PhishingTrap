import React from "react";

const ResultActions = ({
  onReturnToDashboard = () => {},
  onReviewTraining = () => {},
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-6 w-full max-w-md">
      {/* Secondary Review Training Button */}
      <button
        type="button"
        onClick={onReviewTraining}
        className="group w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-white/80 backdrop-blur-sm text-ink-700 border border-ink-200/80 shadow-soft
          hover:bg-white hover:text-ink-950 hover:border-ink-300 transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-ink-500 transition-transform duration-200 group-hover:-rotate-45"
        >
          <path d="M3 12a9 9 0 1 0 2.6-6.3" />
          <polyline points="3 4 3 9 8 9" />
        </svg>
        <span>Review Training</span>
      </button>

      {/* Primary Return to Dashboard Button */}
      <button
        type="button"
        onClick={onReturnToDashboard}
        className="group w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
          bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-brand
          hover:from-brand-500 hover:to-brand-600 hover:shadow-lg
          transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <span>Return to Dashboard</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default ResultActions;
