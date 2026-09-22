import React from "react";

const ResultSummary = ({
  scorePercentage,
  correctAnswers,
  totalQuestions,
  passed,
}) => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
      <div
        className={`mx-auto flex items-center justify-center w-16 h-16 rounded-full ${
          passed ? "bg-emerald-50" : "bg-amber-50"
        }`}
      >
        {passed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-emerald-600"
          >
            <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
            <path d="m9.5 12 1.8 1.8L14.8 10" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-amber-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <h2 className="mt-4 text-xl font-bold text-slate-900">
        {passed ? "Training Completed" : "Training Review Needed"}
      </h2>

      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
        {passed
          ? "Great work! You've successfully passed this training."
          : "You didn't reach the passing score this time.try again."}
      </p>

      <div className="mt-6">
        <span
          className={`text-5xl font-bold tracking-tight ${
            passed ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {scorePercentage}%
        </span>
        <p className="mt-1 text-sm text-slate-500">
          {correctAnswers} out of {totalQuestions} correct
        </p>
      </div>

      <div className="mt-5">
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
            passed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {passed ? "Passed" : "Failed"}
        </span>
      </div>
    </div>
  );
};

export default ResultSummary;
