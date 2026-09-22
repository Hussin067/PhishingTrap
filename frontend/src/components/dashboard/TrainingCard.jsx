import React from "react";


const STATUS_STYLES = {
  "Not Started": {
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  "In Progress": {
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  Completed: {
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
};


const DEFAULT_ACTION_LABEL = {
  "Not Started": "Start Training",
  "In Progress": "Continue Training",
  Completed: "Review Training",
};


const TrainingCard = ({
  title,
  category,
  difficulty,
  status = "Not Started",
  description,
  actionLabel,
  onAction = () => {},
}) => {
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES["Not Started"];
  const buttonLabel =
    actionLabel || DEFAULT_ACTION_LABEL[status] || "Start Training";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
    
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 leading-snug">
          {title}
        </h3>
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {status}
        </span>
      </div>

      
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
          {category}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
          {difficulty}
        </span>
      </div>

      
      {description && (
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      )}

     
      <button
        type="button"
        onClick={onAction}
        className="mt-auto self-start inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default TrainingCard;
