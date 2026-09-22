import React from "react";

const ObjectiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-blue-600 flex-shrink-0"
  >
    <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
    <path d="m9.5 12 1.8 1.8L14.8 10" />
  </svg>
);


const TipIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.7 18.3-8.6-14.9a1.2 1.2 0 0 0-2.2 0L2.3 18.3a1.2 1.2 0 0 0 1 1.7h17.4a1.2 1.2 0 0 0 1-1.7Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);


const TIP_STYLES = {
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    text: "text-blue-900",
  },
  warning: {
    container: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    text: "text-amber-900",
  },
  danger: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-600",
    text: "text-red-900",
  },
};


const LearningContent = ({
  heading,
  introduction,
  objectives = [],
  tips = [],
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
      
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        {heading}
      </h2>

      
      {introduction && (
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          {introduction}
        </p>
      )}

      
      {objectives.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Learning Objectives
          </h3>
          <ul className="mt-3 space-y-2.5">
            {objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <ObjectiveIcon />
                <span className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {objective}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

     
      {tips.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Important Security Tips
          </h3>
          {tips.map((tip, index) => {
            const style = TIP_STYLES[tip.level] || TIP_STYLES.warning;
            return (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${style.container}`}
              >
                <TipIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
                <p className={`text-sm leading-relaxed ${style.text}`}>
                  {tip.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningContent;
