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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-600 text-sm">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Try Again
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
    <div className="h-screen flex flex-col bg-slate-50">
      <Header employeeName={employee?.name || "Employee"} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeItem={activeItem}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <WelcomeBanner employeeName={employee?.name || "Employee"} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
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

          <TrainingList trainings={trainings} onAction={handleTrainingAction} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
