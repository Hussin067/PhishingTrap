import React from "react";

/**
 * LoadingSpinner
 *
 * Centered, reusable loading indicator used throughout the Phishing Trap AI
 * portal (e.g. while training content, dashboards, or results are loading).
 *
 * Props:
 * - message (string, optional): Text shown below the spinner, e.g.
 *     "Loading training...". Omit to show the spinner alone.
 * - size (number, optional): Diameter of the spinner in pixels. Default 32.
 * - fullScreen (boolean, optional): When true, centers within the full
 *     viewport height instead of just its parent container. Default false.
 */
const LoadingSpinner = ({ message, size = 32, fullScreen = false }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "min-h-screen" : "py-12"
      }`}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Subtle background track */}
        <div
          className="absolute inset-0 rounded-full border-2 border-brand-200/50"
        />
        {/* Animated gradient spinner */}
        <svg
          className="animate-spin"
          style={{ width: size, height: size }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <defs>
            <linearGradient id="cyberSpinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke="url(#cyberSpinGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="42 20"
            fill="none"
          />
        </svg>
      </div>

      {message && (
        <p className="text-sm font-medium text-ink-400 animate-pulse tracking-wide">{message}</p>
      )}

      <span className="sr-only">{message || "Loading"}</span>
    </div>
  );
};

export default LoadingSpinner;
