import React from "react";


const StatCard = ({ title, value, description, icon }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
      
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-500 truncate">
          {title}
        </h3>
        {icon && (
          <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </span>
        )}
      </div>

      
      <p className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
        {value}
      </p>

     
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
};

export default StatCard;
