import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "../../components/admin/AdminContext";
import { clearAdminSession, getAdminSession } from "../../services/adminApi";

const icon = (path) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    {path}
  </svg>
);

const NAV = [
  { to: "/admin", label: "Dashboard", end: true, icon: icon(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>) },
  { to: "/admin/employees", label: "Employees", icon: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.7c2 .6 3.2 2.4 3.5 5.3" /></>) },
  { to: "/admin/campaigns", label: "Campaigns", icon: icon(<><path d="m3 11 18-8-8 18-2-8-8-2Z" /></>) },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-ink-200 hover:bg-white/5 hover:text-white"
  }`;

function DataBanner() {
  const { includeSynthetic, setIncludeSynthetic } = useAdmin();
  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        includeSynthetic
          ? "border-warning-500/30 bg-warning-50 text-warning-600"
          : "border-success-500/25 bg-success-50 text-success-600"
      }`}
    >
      <p>
        {includeSynthetic
          ? "Demo mode: synthetic training data is included. These are generated records, not real employee behavior."
          : "Showing recorded (non-synthetic) simulation data only."}
      </p>
      <label className="flex items-center gap-2 font-medium cursor-pointer">
        <input
          type="checkbox"
          checked={includeSynthetic}
          onChange={(e) => setIncludeSynthetic(e.target.checked)}
          className="h-4 w-4 accent-brand-600"
        />
        Include synthetic demo data
      </label>
    </div>
  );
}

function Shell({ email }) {
  const navigate = useNavigate();
  const signOut = () => {
    clearAdminSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface md:flex">
      <aside className="bg-ink-900 text-white md:w-64 md:min-h-screen md:sticky md:top-0 md:self-start flex flex-col">
        <div className="px-5 py-5 flex md:block items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-400">Phishing Trap AI</p>
            <p className="font-heading font-bold text-lg">Admin portal</p>
          </div>
          <button onClick={signOut} className="md:hidden text-sm text-ink-200 underline cursor-pointer">
            Sign out
          </button>
        </div>
        <nav className="flex md:flex-col gap-1 px-3 pb-3 md:pb-0 overflow-x-auto" aria-label="Admin navigation">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block mt-auto px-5 py-5 border-t border-white/10 text-sm">
          <p className="text-ink-200 truncate" title={email}>{email}</p>
          <button onClick={signOut} className="mt-2 text-accent-400 hover:text-accent-300 underline cursor-pointer">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-8">
        <DataBanner />
        <Outlet />
      </main>
    </div>
  );
}

const AdminLayout = () => {
  const session = getAdminSession();
  if (!session) return <Navigate to="/login" replace />;
  return (
    <AdminProvider email={session.email}>
      <Shell email={session.email} />
    </AdminProvider>
  );
};

export default AdminLayout;
