import React from "react";

const Header = ({ employeeName = "Employee", avatarUrl = "" }) => {
  const initial = employeeName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      
      <div className="flex items-center gap-3 min-w-0">
        
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
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
          <span className="text-base sm:text-lg font-semibold text-slate-900 truncate">
            Phishing Trap AI
          </span>
          <span className="text-xs text-slate-500 truncate">
            Employee Portal
          </span>
        </div>
      </div>

      
      <div className="flex items-center gap-3 min-w-0">
        <span className="hidden sm:block text-sm font-medium text-slate-700 truncate max-w-[160px]">
          {employeeName}
        </span>

        
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={employeeName}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
            {initial}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
