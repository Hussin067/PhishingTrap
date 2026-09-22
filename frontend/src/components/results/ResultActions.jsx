import React from "react";


const ResultActions = ({
  onReturnToDashboard = () => {},
  onReviewTraining = () => {},
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
      
      <button
        type="button"
        onClick={onReviewTraining}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium
          bg-white text-slate-600 border border-slate-300
          hover:bg-slate-50 hover:text-slate-900 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M3 12a9 9 0 1 0 2.6-6.3" />
          <polyline points="3 4 3 9 8 9" />
        </svg>
        Review Training
      </button>

      <button
        type="button"
        onClick={onReturnToDashboard}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold
          bg-blue-600 text-white
          hover:bg-blue-700 transition-colors"
      >
        Return to Dashboard
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default ResultActions;
