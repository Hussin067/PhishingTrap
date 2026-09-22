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
    <div className="flex items-center justify-between gap-3 pt-4">
      {/* Previous */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-600
          hover:bg-slate-50 hover:text-slate-900 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600"
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Previous
      </button>

      {/* Next / Submit */}
      {isLastQuestion ? (
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white
            bg-blue-600 shadow-md shadow-blue-600/30
            hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/40
            transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Submit Training
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white
            bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Next
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
      )}
    </div>
  );
};

export default TrainingNavigation;
