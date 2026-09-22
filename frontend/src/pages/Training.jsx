import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import TrainingHeader from "../components/training/TrainingHeader";
import LearningContent from "../components/training/LearningContent";
import ProgressBar from "../components/training/ProgressBar";
import QuestionCard from "../components/training/QuestionCard";
import TrainingNavigation from "../components/training/TrainingNavigation";
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
  const handleBack = () => {};

  const handleLogout = () => {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading training...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">Failed to load training: {error}</p>
      </div>
    );
  }

  if (!training || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">No training questions available.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
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

          <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-3xl mx-auto">
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
