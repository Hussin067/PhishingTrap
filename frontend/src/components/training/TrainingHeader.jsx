import React from "react";


const TrainingHeader = ({ title, category, difficulty, onBack = () => {} }) => {
  return (
    <div className="bg-white px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      {/* Back navigation */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
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
        Back
      </button>

      
      <h1 className="mt-3 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
        {title}
      </h1>

      
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {category && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
            {category}
          </span>
        )}
        {difficulty && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
            {difficulty}
          </span>
        )}
      </div>
    </div>
  );
};

export default TrainingHeader;
