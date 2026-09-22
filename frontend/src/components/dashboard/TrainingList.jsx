import React from "react";
import TrainingCard from "./TrainingCard";


const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-slate-300 py-16 px-6">
    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7 text-blue-500"
      >
        <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
        <path d="m9.5 12 1.8 1.8L14.8 10" />
      </svg>
    </div>
    <h3 className="text-base font-semibold text-slate-900">
      No trainings assigned
    </h3>
    <p className="mt-1 text-sm text-slate-500 max-w-sm">
      You're all caught up. New security awareness trainings will appear
      here as soon as they're assigned to you.
    </p>
  </div>
);

const TrainingList = ({ trainings = [], onAction = () => {} }) => {
  if (!trainings || trainings.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      {trainings.map((training) => (
        <TrainingCard
          key={training.id}
          title={training.title}
          category={training.category}
          difficulty={training.difficulty}
          status={training.status}
          description={training.description}
          actionLabel={training.actionLabel}
          onAction={() => onAction(training.id)}
        />
      ))}
    </div>
  );
};

export default TrainingList;
