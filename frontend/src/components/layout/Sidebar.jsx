import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const icons = {
  dashboard: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  myTraining: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  ),
  completedTraining: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
      <path d="m9.5 12 1.8 1.8L14.8 10" />
    </svg>
  ),
  logout: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  menu: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const NavItem = ({ label, icon, active = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${
          active
            ? "bg-blue-50 text-blue-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-blue-600" />
      )}
      <span className={active ? "text-blue-600" : "text-slate-400"}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
};

const Sidebar = ({
  activeItem = "dashboard",
  onNavigate = () => {},
  onLogout = () => {},
}) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { key: "myTraining", label: "My Training", icon: icons.myTraining },
    {
      key: "completedTraining",
      label: "Completed Training",
      icon: icons.completedTraining,
    },
  ];

  const handleNavigate = (key) => {
    onNavigate(key);

    if (key === "dashboard") {
      navigate("/dashboard");
    }

    if (key === "myTraining") {
      navigate("/my-training");
    }

    if (key === "completedTraining") {
      navigate("/completed-Training");
    }

    setMobileOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setMobileOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.key}
            label={item.label}
            icon={item.icon}
            active={activeItem === item.key}
            onClick={() => handleNavigate(item.key)}
          />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <NavItem
          label="Logout"
          icon={icons.logout}
          active={false}
          onClick={handleLogout}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="text-slate-600 hover:text-slate-900"
          aria-label="Open navigation menu"
        >
          {icons.menu}
        </button>
      </div>

      <aside className="hidden lg:flex lg:flex-col w-60 h-screen bg-white border-r border-slate-200 flex-shrink-0">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-60 bg-white border-r border-slate-200 shadow-lg flex flex-col">
            <div className="flex items-center justify-end px-3 h-14 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-slate-500 hover:text-slate-900"
                aria-label="Close navigation menu"
              >
                {icons.close}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{SidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
