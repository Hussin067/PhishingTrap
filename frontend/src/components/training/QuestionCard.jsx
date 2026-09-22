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
    <fieldset className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <legend className="text-base sm:text-lg font-semibold text-slate-900 leading-snug px-0">
        {questionText}
      </legend>

      <div role="radiogroup" aria-label={questionText} className="mt-4 space-y-3">
        {options.map((option, index) => {
          const letter = LETTERS[index] || String(index + 1);
          const inputId = `${groupName}-${letter}`;
          const isSelected = selectedAnswer === letter;

          return (
            <div key={letter}>
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
                className="flex items-center gap-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 cursor-pointer transition-colors
                  hover:border-blue-300 hover:bg-blue-50/50
                  peer-checked:border-blue-600 peer-checked:bg-blue-50
                  peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2"
              >
                
                <span
                  className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold border
                    ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-slate-50 border-slate-300 text-slate-600"
                    }`}
                >
                  {letter}
                </span>

                
                <span
                  className={`text-sm sm:text-base leading-snug ${
                    isSelected ? "text-blue-900 font-medium" : "text-slate-700"
                  }`}
                >
                  {option}
                </span>

                
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-blue-600 ml-auto flex-shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

export default QuestionCard;
