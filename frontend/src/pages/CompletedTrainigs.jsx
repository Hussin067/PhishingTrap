import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import TrainingCard from "../components/dashboard/TrainingCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getCompletedTrainings, getEmployee } from "../services/api";

function formatLabel(value) {
  if (!value) return "";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const CompletedTraining = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const storedEmployee = localStorage.getItem("employee");

      if (!storedEmployee) {
        navigate("/login");
        return;
      }

      const loggedInEmployee = JSON.parse(storedEmployee);

      const [employeeData, trainingData] = await Promise.all([
        getEmployee(loggedInEmployee.id),
        getCompletedTrainings(loggedInEmployee.id),
      ]);

      setEmployee(employeeData);
      setTrainings(Array.isArray(trainingData) ? trainingData : []);
    } catch (err) {
      console.error("Completed Training error:", err);
      setError(
        "We couldn't retrieve your completed training. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleReviewTraining = (trainingId) => {
    navigate(`/training/${trainingId}`);
  };

  const handleLogout = () => {};

  const averageScore =
    trainings.length > 0
      ? Math.round(
          trainings.reduce(
            (total, training) => total + (training.score ?? 0),
            0,
          ) / trainings.length,
        )
      : 0;

  return (
    <div className="h-screen flex flex-col page-bg">
      <Header employeeName={employee?.name || "Employee"} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem="completedTraining" onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-7">
          <div className="animate-fade-up">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight font-heading">
              Completed <span className="text-gradient">Training</span>
            </h1>

            <p className="mt-1.5 text-sm sm:text-base text-ink-400 max-w-2xl leading-relaxed">
              Review the security awareness training you have completed.
            </p>
          </div>

          {loading && (
            <LoadingSpinner message="Loading completed training..." />
          )}

          {!loading && error && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-danger-500/20 shadow-card p-8 text-center max-w-md mx-auto animate-scale-in">
              <div className="w-12 h-12 rounded-2xl bg-danger-50 text-danger-500 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                </svg>
              </div>

              <h2 className="text-base font-bold text-ink-900 font-heading">
                Unable to load completed training
              </h2>

              <p className="mt-1 text-sm text-ink-400">{error}</p>

              <button
                type="button"
                onClick={fetchTrainings}
                className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-glow-brand hover:from-brand-500 hover:to-brand-600 transition-all active:scale-95 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-fade-up">
                <StatCard
                  title="Completed"
                  value={trainings.length}
                  description="Trainings you've finished"
                />

                <StatCard
                  title="Average Score"
                  value={`${averageScore}%`}
                  description="Across completed training"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-ink-900 font-heading">
                    Training History
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success-50 text-success-600 ring-1 ring-success-500/20">
                    {trainings.length} Completed
                  </span>
                </div>

                {trainings.length === 0 ? (
                  <div className="bg-white/70 backdrop-blur-sm border border-dashed border-ink-200/80 rounded-3xl p-12 text-center animate-fade-up">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4 shadow-soft">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-7 h-7"
                      >
                        <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
                        <path d="m9.5 12 1.8 1.8L14.8 10" />
                      </svg>
                    </div>

                    <h3 className="text-base font-bold text-ink-900 font-heading">
                      No Completed Training
                    </h3>

                    <p className="mt-1 text-sm text-ink-400 max-w-sm mx-auto">
                      You have not completed any security awareness training
                      yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {trainings.map((training, index) => (
                      <div
                        key={training.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        <TrainingCard
                          title={training.title}
                          category={formatLabel(training.category)}
                          difficulty={formatLabel(training.difficulty)}
                          status="Completed"
                          description={training.content}
                          score={training.score}
                          onAction={() => handleReviewTraining(training.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CompletedTraining;
