import React from "react";

const ProgressBar = ({ currentIndex, totalQuestions }) => {
  const safeTotal = totalQuestions > 0 ? totalQuestions : 1;
  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    safeTotal - 1
  );

  const currentQuestion = safeIndex + 1;
  const percentage = Math.round(
    (currentQuestion / safeTotal) * 100
  );

  return (
    <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-ink-100/60 p-4 shadow-soft">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-ink-700 tracking-wide">
            Question <span className="text-brand-600 font-bold">{currentQuestion}</span> of {totalQuestions}
          </span>
        </div>

        <span className="text-xs sm:text-sm font-bold text-gradient font-heading">
          {percentage}% Complete
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Question ${currentQuestion} of ${totalQuestions}`}
        className="w-full h-2.5 sm:h-3 bg-ink-50 rounded-full overflow-hidden p-0.5 border border-ink-100/60"
      >
        <div
          className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-accent-400 rounded-full transition-all duration-500 ease-out shimmer-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;