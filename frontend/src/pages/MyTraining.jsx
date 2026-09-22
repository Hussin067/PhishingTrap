import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import TrainingCard from "../components/dashboard/TrainingCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getEmployeeTrainings, getEmployee} from "../services/api";

function formatLabel(value) {
  if (!value) return "";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const MyTraining = () => {
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
        getEmployeeTrainings(loggedInEmployee.id),
      ]);

      setEmployee(employeeData);
      setTrainings(Array.isArray(trainingData) ? trainingData : []);
    } catch (err) {
      console.error("My Training error:", err);
      setError(
        "We couldn't retrieve your assigned training. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const completedCount = trainings.filter((t) => t.completed).length;
  const remainingCount = trainings.length - completedCount;

  const handleStartOrReview = (trainingId) => {
    navigate(`/training/${trainingId}`);
  };

  const handleLogout = () => {};

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header employeeName={employee?.name || "Employee"} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem="myTraining" onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Training</h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete your assigned security awareness training and strengthen
              your ability to recognize phishing threats.
            </p>
          </div>

          {loading && <LoadingSpinner message="Loading your training..." />}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
              <h2 className="text-base font-semibold text-red-700">
                Unable to load your training
              </h2>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchTrainings}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <StatCard
                  title="Assigned"
                  value={trainings.length}
                  description="Trainings assigned to you"
                />
                <StatCard
                  title="Completed"
                  value={completedCount}
                  description="Trainings you've finished"
                />
                <StatCard
                  title="Remaining"
                  value={remainingCount}
                  description="Trainings left to complete"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Your Training
                </h2>

                {trainings.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                    <h3 className="text-base font-semibold text-slate-900">
                      No Training Assigned
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      You currently have no security awareness training assigned
                      to you.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    {trainings.map((training) => (
                      <TrainingCard
                        key={training.id}
                        title={training.title}
                        category={formatLabel(training.category)}
                        difficulty={formatLabel(training.difficulty)}
                        status={
                          training.completed ? "Completed" : "Not Completed"
                        }
                        description={training.content}
                        score={training.completed ? training.score : undefined}
                        onAction={() => handleStartOrReview(training.id)}
                      />
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

export default MyTraining;
