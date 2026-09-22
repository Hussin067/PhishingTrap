import React from "react";


const getScoreColor = (score) => {
  if (score >= 80) return { ring: "#059669", text: "text-emerald-600" }; 
  if (score >= 50) return { ring: "#2563eb", text: "text-blue-600" }; 
  return { ring: "#d97706", text: "text-amber-600" }; 
};


const ScoreCircle = ({ score = 0, size = 128, strokeWidth = 10, label = "Score" }) => {
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const colors = getScoreColor(clampedScore);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clampedScore} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold tracking-tight ${colors.text}`} style={{ fontSize: size * 0.28 }}>
          {clampedScore}
        </span>
        <span className="text-xs font-medium text-slate-500 mt-0.5">{label}</span>
      </div>
    </div>
  );
};

export default ScoreCircle;
