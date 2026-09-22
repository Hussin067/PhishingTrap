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
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "min-h-screen" : "py-12"
      }`}
    >
      <svg
        className="animate-spin text-blue-600"
        style={{ width: size, height: size }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
        />
      </svg>

      {message && (
        <p className="text-sm font-medium text-slate-500">{message}</p>
      )}

      <span className="sr-only">{message || "Loading"}</span>
    </div>
  );
};

export default LoadingSpinner;
