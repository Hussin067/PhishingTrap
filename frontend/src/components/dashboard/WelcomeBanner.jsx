import React from "react";

const WelcomeBanner = ({ employeeName = "there" }) => {
  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ink-950 via-brand-700 to-ink-900 px-6 py-8 sm:px-10 sm:py-10 shadow-elevated animate-fade-up"
      style={{
        backgroundSize: "200% 200%",
        animation: "gradient-shift 10s ease infinite, fade-up 0.5s ease-out both",
      }}
    >
      {/* Decorative blurred background orbs */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-28 w-48 h-48 rounded-full bg-accent-500/20 blur-2xl" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 w-32 h-32 rounded-full bg-brand-400/10 blur-xl" />

      {/* Subtle grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />

      <div className="relative flex items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-accent-300 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            Security Awareness Hub
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading">
            Welcome back, <span className="text-gradient">{employeeName}</span>
          </h1>

          <p className="mt-2.5 text-sm sm:text-base text-ink-100 leading-relaxed max-w-lg">
            Complete your assigned security awareness training and improve
            your ability to identify phishing attacks.
          </p>
        </div>

        {/* Floating glass tile with shield motif */}
        <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl glass-dark border border-white/15 shadow-glow-brand animate-float">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 md:w-12 md:h-12 text-accent-300"
          >
            <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
            <path d="m9.5 12 1.8 1.8L14.8 10" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
