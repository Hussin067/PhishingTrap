import React, { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ResultSummary from "../components/results/ResultSummary";
import ScoreCircle from "../components/results/ScoreCircle";
import ResultActions from "../components/results/ResultActions";
import { useNavigate , useLocation } from "react-router-dom";



const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state;
  if (!result) {
  navigate("/dashboard");
  return null;
}

  const scorePercentage = result?.score ?? 0;
  const correctAnswers = result?.correct_answers ?? 0;
  const totalQuestions = result?.total_questions ?? 0;
  const passed = result?.passed ?? false;
  const [activeItem] = useState("completedTraining");
  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  const handleReviewTraining = () => {
    navigate("/training/1");
  };
  const handleLogout = () => {};

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header employeeName="Ahmed" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeItem} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-md mx-auto flex flex-col items-center gap-6">
            <ScoreCircle score={scorePercentage} size={160} label="Score" />

            <ResultSummary
              scorePercentage={scorePercentage}
              correctAnswers={correctAnswers}
              totalQuestions={totalQuestions}
              passed={passed}
            />

            <ResultActions
              onReturnToDashboard={handleReturnToDashboard}
              onReviewTraining={handleReviewTraining}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;
