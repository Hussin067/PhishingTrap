import React from "react";


const WelcomeBanner = ({ employeeName = "there" }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-8 sm:px-10 sm:py-10">
      
      <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-24 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center justify-between gap-6">
        
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {employeeName}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Complete your assigned security awareness training and improve
            your ability to identify phishing attacks.
          </p>
        </div>

        
        <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 md:w-12 md:h-12 text-white"
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
