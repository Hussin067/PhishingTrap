import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import TrainingHeader from "../components/training/TrainingHeader";
import LearningContent from "../components/training/LearningContent";
import ProgressBar from "../components/training/ProgressBar";
import QuestionCard from "../components/training/QuestionCard";
import TrainingNavigation from "../components/training/TrainingNavigation";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useNavigate, useParams } from "react-router-dom";
import { getTraining, getTrainingQuestions , submitTraining } from "../services/api";

const Training = () => {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  console.log("Training ID:", trainingId);
  const [activeItem] = useState("myTraining");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [training, setTraining] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting , setSubmitting ] = useState(false)
  useEffect(() => {
    const loadTraining = async () => {
      try {
        setLoading(true);
        setError("");

        const trainingData = await getTraining(trainingId);
        const questionData = await getTrainingQuestions(trainingId);

        setTraining(trainingData);
        setQuestions(
          questionData.map((question) => ({
            id: question.id,
            text: question.question,
            options: question.options,
          })),
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTraining();
  }, [trainingId]);
  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = (questionId, letter) => {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");
      const resualt = await submitTraining(trainingId , answers);
      console.log("Training submission result:" , resualt)
      navigate("/results" , {
        state : resualt ,
      });

    }catch (err) {
      setError(err.message);

    }
    finally {
      setSubmitting(false)
    }

  };
  const handleBack = () => {
    navigate("/my-training");
  };

  const handleLogout = () => {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <LoadingSpinner message="Preparing your training module..." fullScreen />
      </div>
    );
  }

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
          <h2 className="text-base font-bold text-ink-900 font-heading">
            Failed to load training
          </h2>
          <p className="mt-1 text-sm text-ink-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-glow-brand hover:from-brand-500 hover:to-brand-600 transition-all active:scale-95 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!training || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-ink-100/80 shadow-card p-8 text-center max-w-md animate-scale-in">
          <p className="text-ink-600 font-medium">No training questions available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col page-bg">
      <Header employeeName="Ahmed" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeItem} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <TrainingHeader
            title={training.title}
            category={training.category}
            difficulty={training.difficulty}
            onBack={handleBack}
          />

          <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 max-w-3xl mx-auto pb-16">
            <LearningContent
              heading={training.title}
              introduction={training.content}
              objectives={[]}
              tips={[]}
            />

            <ProgressBar
              currentIndex={currentIndex}
              totalQuestions={questions.length}
            />

            <QuestionCard
              questionId={currentQuestion.id}
              questionText={currentQuestion.text}
              options={currentQuestion.options}
              selectedAnswer={answers[currentQuestion.id] || null}
              onAnswerChange={handleAnswerChange}
            />

            <TrainingNavigation
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Training;
