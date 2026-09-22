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
    <div className="w-full">

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">
          Question {currentQuestion} of {totalQuestions}
        </span>

        <span className="text-sm font-medium text-blue-600">
          {percentage}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Question ${currentQuestion} of ${totalQuestions}`}
        className="w-full h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

    </div>
  );
};

export default ProgressBar;