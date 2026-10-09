import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAdmin } from "../../components/admin/AdminContext";
import { useAdminData } from "../../components/admin/useAdminData";
import {
  EmptyState,
  ErrorNotice,
  PageTitle,
  RiskBadge,
  formatDate,
  percent,
  scenarioLabel,
  tableCell,
  tableHead,
} from "../../components/admin/ui";
import { getAdminEmployees } from "../../services/adminApi";

const RISK_ORDER = { high: 0, medium: 1, low: 2, insufficient_data: 3 };

const SORTS = {
  risk: (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level] || b.smoothed_click_rate - a.smoothed_click_rate,
  clickRate: (a, b) => (b.click_rate ?? -1) - (a.click_rate ?? -1),
  name: (a, b) => a.name.localeCompare(b.name),
};

const AdminEmployees = () => {
  const { includeSynthetic } = useAdmin();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAdminData(() => getAdminEmployees(includeSynthetic), [includeSynthetic]);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState("risk");

  const rows = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.employees
      .filter((e) => risk === "all" || e.risk_level === risk)
      .filter((e) => !term || `${e.name} ${e.department || ""}`.toLowerCase().includes(term))
      .sort(SORTS[sort]);
  }, [data, search, risk, sort]);

  if (error) return <ErrorNotice error={error} onRetry={reload} />;
  if (loading) return <LoadingSpinner message="Loading employees..." />;

  const select = "rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <>
      <PageTitle
        title="Employees"
        subtitle="Each employee's results and where the evidence points to a weakness. Select a row for the full profile."
      />
      <Card className="hover:translate-y-0">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search name or department"
            aria-label="Search employees"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${select} flex-1 min-w-[12rem]`}
          />
          <select aria-label="Filter by risk" value={risk} onChange={(e) => setRisk(e.target.value)} className={select}>
            <option value="all">All risk levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="insufficient_data">Not enough data</option>
          </select>
          <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} className={select}>
            <option value="risk">Sort: highest risk</option>
            <option value="clickRate">Sort: click rate</option>
            <option value="name">Sort: name</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState>No employees match.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem]">
              <thead>
                <tr>
                  {["Employee", "Simulations", "Clicks", "Reports", "Click rate", "Risk", "Weakness", "Training (open / done)", "Last simulation"].map((h) => (
                    <th key={h} className={tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.employee_id}
                    tabIndex={0}
                    onClick={() => navigate(`/admin/employees/${e.employee_id}`)}
                    onKeyDown={(event) => event.key === "Enter" && navigate(`/admin/employees/${e.employee_id}`)}
                    className="border-t border-ink-50 hover:bg-brand-50/60 cursor-pointer focus:outline-none focus-visible:bg-brand-50"
                  >
                    <td className={tableCell}>
                      <p className="font-medium text-ink-900">{e.name}</p>
                      <p className="text-xs text-ink-400">{e.department || "No department"}</p>
                    </td>
                    <td className={tableCell}>{e.simulations}</td>
                    <td className={tableCell}>{e.clicks}</td>
                    <td className={tableCell}>{e.reports}</td>
                    <td className={tableCell}>{percent(e.click_rate)}</td>
                    <td className={tableCell}><RiskBadge level={e.risk_level} /></td>
                    <td className={tableCell}>
                      {e.top_weakness ? (
                        <span>
                          <span className="font-medium text-danger-600">{scenarioLabel(e.top_weakness.scenario)}</span>
                          <span className="block text-xs text-ink-400">
                            {e.top_weakness.clicks}/{e.top_weakness.attempts} clicked
                          </span>
                        </span>
                      ) : e.scenario_to_watch ? (
                        <span className="text-ink-400">
                          None established
                          <span className="block text-xs">Watch: {scenarioLabel(e.scenario_to_watch)}</span>
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className={tableCell}>{e.open_trainings} / {e.completed_trainings}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{formatDate(e.last_simulation_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-400">
          A weakness is shown only with at least 3 attempts and 2 clicks in a scenario. "Watch" is a hint, not a finding.
        </p>
      </Card>
    </>
  );
};

export default AdminEmployees;
