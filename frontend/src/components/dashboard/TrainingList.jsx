import React from "react";
import TrainingCard from "./TrainingCard";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center bg-white/70 backdrop-blur-sm rounded-3xl border border-dashed border-ink-200/80 py-16 px-6 animate-fade-up">
    {/* Floating shield illustration with glow */}
    <div className="relative mb-5">
      <div className="absolute inset-0 w-16 h-16 rounded-full bg-brand-400/20 blur-xl animate-pulse-glow" />
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-200/50 flex items-center justify-center shadow-soft animate-float">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-brand-600"
        >
          <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
          <path d="m9.5 12 1.8 1.8L14.8 10" />
        </svg>
      </div>
    </div>

    <h3 className="text-base sm:text-lg font-bold text-ink-900 font-heading">
      No trainings assigned
    </h3>
    <p className="mt-1.5 text-sm text-ink-400 max-w-sm leading-relaxed">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {trainings.map((training, index) => (
        <div
          key={training.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 75}ms` }}
        >
          <TrainingCard
            title={training.title}
            category={training.category}
            difficulty={training.difficulty}
            status={training.status}
            description={training.description}
            actionLabel={training.actionLabel}
            onAction={() => onAction(training.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default TrainingList;
