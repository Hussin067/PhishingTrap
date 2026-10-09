import React from "react";

const LETTERS = ["A", "B", "C", "D"];

const QuestionCard = ({
  questionId,
  questionText,
  options = [],
  selectedAnswer = null,
  onAnswerChange = () => {},
}) => {
  const groupName = `question-${questionId}`;

  return (
    <div key={questionId} className="animate-fade-up">
      <fieldset className="bg-white/85 backdrop-blur-sm rounded-3xl border border-ink-100/70 shadow-card p-6 sm:p-8">
        <legend className="text-base sm:text-lg lg:text-xl font-bold text-ink-900 leading-snug font-heading px-0 mb-2">
          {questionText}
        </legend>

        <div role="radiogroup" aria-label={questionText} className="mt-5 space-y-3">
          {options.map((option, index) => {
            const letter = LETTERS[index] || String(index + 1);
            const inputId = `${groupName}-${letter}`;
            const isSelected = selectedAnswer === letter;

            return (
              <div key={letter} className="relative">
                <input
                  type="radio"
                  id={inputId}
                  name={groupName}
                  value={letter}
                  checked={isSelected}
                  onChange={() => onAnswerChange(questionId, letter)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={inputId}
                  className={`group flex items-center gap-3.5 w-full rounded-2xl border px-4 sm:px-5 py-3.5 cursor-pointer transition-all duration-200
                    hover:-translate-y-0.5
                    ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/60 shadow-glow-brand ring-1 ring-brand-500/30"
                        : "border-ink-100 bg-white/90 hover:border-brand-300/80 hover:bg-brand-50/20 hover:shadow-soft"
                    }
                    peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2`}
                >
                  {/* Letter badge */}
                  <span
                    className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-soft scale-105"
                          : "bg-ink-50 text-ink-600 border border-ink-200/50 group-hover:border-brand-400/60 group-hover:text-brand-600"
                      }`}
                  >
                    {letter}
                  </span>

                  {/* Option text */}
                  <span
                    className={`text-sm sm:text-base leading-snug transition-colors ${
                      isSelected ? "text-ink-950 font-semibold" : "text-ink-700"
                    }`}
                  >
                    {option}
                  </span>

                  {/* Checkmark icon for selected item */}
                  {isSelected && (
                    <span className="ml-auto flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white animate-scale-in">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};

export default QuestionCard;
