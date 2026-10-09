import React from "react";

const Header = ({ employeeName = "Employee", avatarUrl = "" }) => {
  const initial = employeeName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-ink-950/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow-brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
          >
            <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
            <path d="m9.5 12 1.8 1.8L14.8 10" />
          </svg>
        </div>

        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-base sm:text-lg font-bold text-gradient font-heading truncate">
            Phishing Trap AI
          </span>
          <span className="text-xs text-ink-300 truncate">
            Employee Portal
          </span>
        </div>
      </div>

      {/* User profile */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="hidden sm:block text-sm font-medium text-ink-200 truncate max-w-[160px]">
          {employeeName}
        </span>

        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={employeeName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/40 flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-ink-700 ring-2 ring-brand-500/30 flex items-center justify-center text-sm font-semibold text-brand-300 flex-shrink-0">
              {initial}
            </div>
          )}
          {/* Active online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-ink-950" />
        </div>
      </div>
    </header>
  );
};

export default Header;
