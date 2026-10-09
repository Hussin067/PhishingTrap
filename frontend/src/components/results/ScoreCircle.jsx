import React, { useState, useEffect } from "react";

const getScoreColor = (score) => {
  if (score >= 80) {
    return {
      gradStart: "#10B981",
      gradEnd: "#2DD4BF",
      text: "text-success-600",
      glow: "rgba(16, 185, 129, 0.35)",
    };
  }
  if (score >= 50) {
    return {
      gradStart: "#6366F1",
      gradEnd: "#22D3EE",
      text: "text-brand-600",
      glow: "rgba(99, 102, 241, 0.35)",
    };
  }
  return {
    gradStart: "#F59E0B",
    gradEnd: "#F43F5E",
    text: "text-warning-600",
    glow: "rgba(245, 158, 11, 0.35)",
  };
};

const ScoreCircle = ({
  score = 0,
  size = 128,
  strokeWidth = 10,
  label = "Score",
}) => {
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = getScoreColor(clampedScore);

  // Mount animation for ring draw and score count-up
  const [mounted, setMounted] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Trigger ring animation
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);

    // Score count-up
    let current = 0;
    const duration = 800;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = clampedScore / totalSteps;

    const counter = setInterval(() => {
      current += increment;
      if (current >= clampedScore) {
        setAnimatedScore(clampedScore);
        clearInterval(counter);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, stepTime);

    return () => {
      clearTimeout(timer);
      clearInterval(counter);
    };
  }, [clampedScore]);

  const offset = mounted
    ? circumference - (clampedScore / 100) * circumference
    : circumference;

  const gradientId = `score-grad-${size}`;

  return (
    <div
      className="relative inline-flex items-center justify-center animate-scale-in"
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 0 12px ${colors.glow})`,
      }}
      role="img"
      aria-label={`${label}: ${clampedScore} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradStart} />
            <stop offset="100%" stopColor={colors.gradEnd} />
          </linearGradient>
        </defs>

        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(11, 18, 32, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated gradient progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>

      {/* Center label & animated score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-black tracking-tight font-heading ${colors.text}`}
          style={{ fontSize: size * 0.28 }}
        >
          {animatedScore}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-ink-400 mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
};

export default ScoreCircle;
