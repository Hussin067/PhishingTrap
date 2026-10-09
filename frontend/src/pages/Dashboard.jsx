import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import StatCard from "../components/dashboard/StatCard";
import TrainingList from "../components/dashboard/TrainingList";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { getEmployee, getEmployeeTrainings } from "../services/api";

const icons = {
  assigned: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  ),

  completed: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
      <path d="m9.5 12 1.8 1.8L14.8 10" />
    </svg>
  ),

  score: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [activeItem, setActiveItem] = useState("dashboard");

  const [employee, setEmployee] = useState(null);
  const [trainings, setTrainings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // Get the logged-in employee from localStorage
        const storedEmployee = localStorage.getItem("employee");

        if (!storedEmployee) {
          navigate("/login");
          return;
        }

        const loggedInEmployee = JSON.parse(storedEmployee);

        // Get fresh employee data from the backend
        const employeeData = await getEmployee(loggedInEmployee.id);

        // Get this employee's assigned training
        const trainingData = await getEmployeeTrainings(loggedInEmployee.id);

        setEmployee(employeeData);
        setTrainings(Array.isArray(trainingData) ? trainingData : []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("We couldn't load your dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleNavigate = (key) => {
    setActiveItem(key);

    if (key === "dashboard") {
      navigate("/dashboard");
    } else if (key === "myTraining") {
      navigate("/my-training");
    } else if (key === "completedTraining") {
      navigate("/completed-training");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("employee");
    navigate("/login");
  };

  const handleTrainingAction = (trainingId) => {
    navigate(`/training/${trainingId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <LoadingSpinner message="Loading your dashboard..." fullScreen />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-danger-500/20 shadow-card p-8 text-center max-w-md animate-scale-in">
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
          <p className="text-ink-800 font-semibold">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-glow-brand hover:from-brand-500 hover:to-brand-600 transition-all active:scale-95 cursor-pointer"
          >
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate dashboard statistics
  const assignedCount = trainings.length;

  const completedCount = trainings.filter(
    (training) => training.completed,
  ).length;

  const completedTrainings = trainings.filter(
    (training) => training.completed && training.score !== null,
  );

  const latestScore =
    completedTrainings.length > 0
      ? completedTrainings[completedTrainings.length - 1].score
      : "—";

  return (
    <div className="h-screen flex flex-col page-bg">
      <Header employeeName={employee?.name || "Employee"} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeItem={activeItem}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-7">
          <WelcomeBanner employeeName={employee?.name || "Employee"} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <StatCard
              title="Assigned Training"
              value={assignedCount}
              description="Trainings assigned to you"
              icon={icons.assigned}
            />

            <StatCard
              title="Completed Training"
              value={completedCount}
              description="Trainings you've finished"
              icon={icons.completed}
            />

            <StatCard
              title="Latest Score"
              value={latestScore === "—" ? "—" : `${latestScore}%`}
              description="Your most recent quiz result"
              icon={icons.score}
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-ink-900 font-heading">
                Assigned Modules
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-500/20">
                {assignedCount} Total
              </span>
            </div>

            <TrainingList trainings={trainings} onAction={handleTrainingAction} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
