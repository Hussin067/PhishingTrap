import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import StatCard from "../../components/dashboard/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import WeaknessHeatmap from "../../components/admin/WeaknessHeatmap";
import { useAdmin } from "../../components/admin/AdminContext";
import { useAdminData } from "../../components/admin/useAdminData";
import {
  Bar,
  EmptyState,
  ErrorNotice,
  PageTitle,
  formatDate,
  percent,
  scenarioLabel,
  tableCell,
  tableHead,
} from "../../components/admin/ui";
import { getOverview, getWeaknessMatrix } from "../../services/adminApi";

const RISK_SEGMENTS = [
  ["high", "High", "bg-danger-500"],
  ["medium", "Medium", "bg-warning-500"],
  ["low", "Low", "bg-success-500"],
  ["insufficient_data", "Not enough data", "bg-ink-100"],
];

const EVENT_LABELS = {
  click: "clicked a simulated link",
  report: "reported a simulated email",
  agent_decision: "was assigned an adaptive simulation",
  campaign_launch: "was included in a campaign",
};

function RiskDistribution({ distribution }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (!total) return <EmptyState>No employees yet.</EmptyState>;
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-ink-50" role="img" aria-label="Employees by risk level">
        {RISK_SEGMENTS.map(([key, , color]) =>
          distribution[key] ? (
            <div key={key} className={color} style={{ width: `${(distribution[key] / total) * 100}%` }} />
          ) : null
        )}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {RISK_SEGMENTS.map(([key, label, color]) => (
          <li key={key} className="flex items-center gap-2 text-ink-600">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            {label}
            <span className="ml-auto font-semibold tabular-nums">{distribution[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const AdminDashboard = () => {
  const { includeSynthetic } = useAdmin();
  const navigate = useNavigate();
  const overview = useAdminData(() => getOverview(includeSynthetic), [includeSynthetic]);
  const matrix = useAdminData(() => getWeaknessMatrix(includeSynthetic), [includeSynthetic]);

  if (overview.error) return <ErrorNotice error={overview.error} onRetry={overview.reload} />;
  if (overview.loading) return <LoadingSpinner message="Loading dashboard..." />;
  const data = overview.data;

  const scenarios = [...data.scenario_stats].sort((a, b) => (b.click_rate ?? -1) - (a.click_rate ?? -1));
  const completion = data.trainings_assigned ? data.trainings_completed / data.trainings_assigned : null;

  return (
    <>
      <PageTitle
        title="Dashboard"
        subtitle="Organisation-wide simulation results, where employees are most vulnerable, and what to do next."
        actions={<Button onClick={() => navigate("/admin/campaigns/new")}>Run a campaign</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Employees" value={data.employees_total} description="Active accounts" />
        <StatCard title="Simulations" value={data.simulations_total} description={`${data.clicks} clicks · ${data.reports} reports`} />
        <StatCard title="Click rate" value={percent(data.click_rate, 1)} description="Share of simulations clicked" />
        <StatCard title="Report rate" value={percent(data.report_rate, 1)} description="Share reported to security" />
        <StatCard title="Training completion" value={percent(completion)} description={`${data.trainings_completed} of ${data.trainings_assigned} assigned`} />
        <StatCard title="Campaigns" value={data.campaigns_total} description="Including adaptive runs" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-heading font-bold text-ink-900 mb-4">Employees by risk level</h2>
          <RiskDistribution distribution={data.risk_distribution} />
          <p className="mt-4 text-xs text-ink-400">
            Based on a smoothed click rate; employees with fewer than 5 simulations are not rated.
          </p>
        </Card>

        <Card>
          <h2 className="font-heading font-bold text-ink-900 mb-4">Click rate by scenario</h2>
          {data.simulations_total === 0 ? (
            <EmptyState>No simulations recorded yet.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {scenarios.map((s) => (
                <li key={s.scenario} className="grid grid-cols-[9.5rem_1fr] items-center gap-3 text-sm">
                  <span className="truncate text-ink-700" title={scenarioLabel(s.scenario)}>{scenarioLabel(s.scenario)}</span>
                  <Bar value={s.click_rate} tone="danger" label={s.attempts ? `${s.clicks}/${s.attempts}` : "—"} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-heading font-bold text-ink-900">Who is weak where</h2>
        <p className="text-sm text-ink-400 mb-4">Click an employee to see their full profile and the agent's recommendation.</p>
        {matrix.error ? (
          <ErrorNotice error={matrix.error} onRetry={matrix.reload} />
        ) : matrix.loading ? (
          <LoadingSpinner message="Building heatmap..." />
        ) : (
          <WeaknessHeatmap matrix={matrix.data} />
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-heading font-bold text-ink-900 mb-3">Highest risk employees</h2>
          {data.top_at_risk.length === 0 ? (
            <EmptyState>Not enough data to rate anyone yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink-50">
              {data.top_at_risk.map((employee) => (
                <li key={employee.employee_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/admin/employees/${employee.employee_id}`} className="font-medium text-ink-900 hover:text-brand-600">
                      {employee.name}
                    </Link>
                    <p className="text-xs text-ink-400">
                      {employee.top_weakness
                        ? `Weak on ${scenarioLabel(employee.top_weakness.scenario)} (${employee.top_weakness.clicks}/${employee.top_weakness.attempts})`
                        : "No weakness established yet"}
                    </p>
                  </div>
                  <Badge variant="danger">{percent(employee.smoothed_click_rate)} est.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-heading font-bold text-ink-900 mb-3">By department</h2>
          {data.department_stats.length === 0 ? (
            <EmptyState>No data.</EmptyState>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHead}>Department</th>
                  <th className={tableHead}>Employees</th>
                  <th className={tableHead}>Click rate</th>
                </tr>
              </thead>
              <tbody>
                {data.department_stats.map((d) => (
                  <tr key={d.department} className="border-t border-ink-50">
                    <td className={tableCell}>{d.department}</td>
                    <td className={tableCell}>{d.employees}</td>
                    <td className={tableCell}><Bar value={d.click_rate} tone="warning" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-heading font-bold text-ink-900 mb-3">Recent employee actions</h2>
        {data.recent_activity.length === 0 ? (
          <EmptyState>No activity recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-ink-50">
            {data.recent_activity.map((item, index) => (
              <li key={`${item.simulation_id}-${index}`} className="py-2.5 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link to={`/admin/employees/${item.employee_id}`} className="font-medium text-ink-900 hover:text-brand-600">
                  {item.employee_name}
                </Link>
                <span className="text-ink-600">{EVENT_LABELS[item.type] || item.type}</span>
                <Badge variant="category">{scenarioLabel(item.scenario)}</Badge>
                <span className="ml-auto text-xs text-ink-400">{formatDate(item.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 text-xs text-ink-400">
        {data.model.available
          ? `ML model ${data.model.model_version} (${data.model.status}): experimental, trained on synthetic data. Risk figures on this page use statistics only.`
          : "ML model not available; the agent uses statistics only."}
      </p>
    </>
  );
};

export default AdminDashboard;
