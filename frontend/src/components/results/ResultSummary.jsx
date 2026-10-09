import React from "react";

const ResultSummary = ({
  scorePercentage,
  correctAnswers,
  totalQuestions,
  passed,
}) => {
  return (
    <div className="relative overflow-hidden w-full max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-3xl border border-ink-100/70 shadow-elevated p-6 sm:p-8 text-center animate-scale-in">
      {/* Decorative ambient glow or dots for celebratory effect */}
      {passed && (
        <>
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-success-500/15 blur-2xl animate-pulse-glow" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-accent-500/15 blur-2xl" />
        </>
      )}

      {/* Result Status Icon */}
      <div
        className={`mx-auto flex items-center justify-center w-16 h-16 rounded-2xl shadow-soft ${
          passed
            ? "bg-gradient-to-br from-success-50 to-success-100 ring-2 ring-success-500/30 text-success-600"
            : "bg-gradient-to-br from-warning-50 to-warning-100 ring-2 ring-warning-500/30 text-warning-600"
        }`}
      >
        {passed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-success-600 animate-scale-in"
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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-warning-600 animate-scale-in"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      {/* Heading */}
      <h2 className="mt-4 text-xl sm:text-2xl font-bold text-ink-900 font-heading">
        {passed ? "Training Completed" : "Training Review Needed"}
      </h2>

      {/* Subtitle / microcopy */}
      <p className="mt-2 text-sm text-ink-400 leading-relaxed max-w-xs mx-auto">
        {passed
          ? "Great work! You've successfully passed this training."
          : "You didn't reach the passing score this time. Please try again."}
      </p>

      {/* Score block */}
      <div className="mt-6 py-4 px-6 rounded-2xl bg-ink-50/60 border border-ink-100/60">
        <span
          className={`text-5xl font-extrabold tracking-tight font-heading ${
            passed ? "text-success-600" : "text-warning-600"
          }`}
        >
          {scorePercentage}%
        </span>
        <p className="mt-1 text-xs sm:text-sm font-medium text-ink-400">
          {correctAnswers} out of {totalQuestions} correct
        </p>
      </div>

      {/* Status chip */}
      <div className="mt-5">
        <span
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${
            passed
              ? "bg-success-50 text-success-700 ring-1 ring-success-500/30"
              : "bg-warning-50 text-warning-700 ring-1 ring-warning-500/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              passed ? "bg-success-500" : "bg-warning-500"
            }`}
          />
          {passed ? "Passed" : "Failed"}
        </span>
      </div>
    </div>
  );
};

export default ResultSummary;
