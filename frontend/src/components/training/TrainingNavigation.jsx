import React from "react";

/**
 * TrainingNavigation
 *
 * Bottom navigation controls for a training quiz: Previous, Next, and
 * Submit Training (shown only on the final question). Purely
 * presentational — behavior is wired up entirely through props.
 *
 * Props:
 * - currentIndex (number): Index of the current question (0-based).
 * - totalQuestions (number): Total number of questions in the quiz.
 * - onPrevious (function, optional): Called when Previous is clicked.
 * - onNext (function, optional): Called when Next is clicked.
 * - onSubmit (function, optional): Called when Submit Training is clicked.
 */
const TrainingNavigation = ({
  currentIndex,
  totalQuestions,
  onPrevious = () => {},
  onNext = () => {},
  onSubmit = () => {},
}) => {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between gap-3 pt-6">
      {/* Previous button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-white/80 backdrop-blur-sm border border-ink-200/80 text-ink-700 shadow-soft
          hover:bg-white hover:text-ink-950 hover:border-ink-300 transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Previous</span>
      </button>

      {/* Next or Submit button */}
      {isLastQuestion ? (
        <button
          type="button"
          onClick={onSubmit}
          className="group inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white
            bg-gradient-to-r from-brand-600 via-brand-500 to-accent-600 shadow-glow-brand
            hover:shadow-lg hover:from-brand-500 hover:to-accent-500
            transition-all duration-200 active:scale-95 animate-pulse-glow cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-white"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Submit Training</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-brand-600 to-brand-500 shadow-glow-brand
            hover:from-brand-500 hover:to-brand-600 hover:shadow-lg
            transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span>Next</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TrainingNavigation;
