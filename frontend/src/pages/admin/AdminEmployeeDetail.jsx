import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import StatCard from "../../components/dashboard/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAdmin } from "../../components/admin/AdminContext";
import { useAdminData } from "../../components/admin/useAdminData";
import {
  Bar,
  EmptyState,
  ErrorNotice,
  EvidenceBadge,
  PageTitle,
  RiskBadge,
  formatDate,
  percent,
  scenarioLabel,
  tableCell,
  tableHead,
} from "../../components/admin/ui";
import { getEmployeeDetail } from "../../services/adminApi";

const ACTIVITY = {
  simulation_sent: ["Simulation sent", "neutral"],
  click: ["Clicked the link", "danger"],
  report: ["Reported the email", "success"],
  training_assigned: ["Training assigned", "category"],
  training_completed: ["Training completed", "success"],
  agent_decision: ["Adaptive simulation approved", "category"],
  campaign_launch: ["Campaign simulation approved", "category"],
};

const MODE_TEXT = {
  cold_start: "Cold start: too little history to judge",
  exploration: "Exploration: gathering evidence",
  targeted: "Targeted: re-checking a known weakness",
};

const AdminEmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { includeSynthetic } = useAdmin();
  const { data, error, loading, reload } = useAdminData(
    () => getEmployeeDetail(employeeId, includeSynthetic),
    [employeeId, includeSynthetic]
  );

  if (error) return <ErrorNotice error={error} onRetry={reload} />;
  if (loading) return <LoadingSpinner message="Loading employee..." />;

  const { employee, summary, assessments, agent_proposal: proposal } = data;
  const ranked = [...assessments].sort((a, b) => b.estimated_risk - a.estimated_risk);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link to="/admin/employees" className="text-brand-600 hover:underline">← All employees</Link>
      </p>
      <PageTitle
        title={employee.name}
        subtitle={`${employee.department || "No department"} · ${employee.email}${employee.is_active ? "" : " · inactive"}`}
        actions={
          <>
            <RiskBadge level={data.risk_level} />
            {employee.is_active && (
              <Button variant="secondary" onClick={() => navigate(`/admin/campaigns/new?employee=${employee.id}`)}>
                Run a campaign for this employee
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Simulations" value={summary.total_simulations} description={summary.cold_start ? "Too few to rate" : "Recorded"} />
        <StatCard title="Click rate" value={percent(summary.click_rate)} description={`${summary.total_clicks} clicks`} />
        <StatCard title="Report rate" value={percent(summary.report_rate)} description={`${summary.total_reports} reports`} />
        <StatCard title="Recent failures" value={summary.recent_failures} description="Clicks in the last 5" />
      </div>

      {proposal && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading font-bold text-ink-900">What the agent recommends next</h2>
            <Badge variant={proposal.confidence === "moderate" ? "category" : "warning"}>
              {proposal.confidence} confidence
            </Badge>
          </div>
          <p className="text-sm text-ink-400">{MODE_TEXT[proposal.mode]}. This is a proposal for you to review, not an action.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Next simulation</p>
              <p className="mt-1 text-lg font-bold text-ink-900">{scenarioLabel(proposal.proposed_simulation.scenario)}</p>
              <p className="text-sm text-ink-600">Difficulty: {proposal.proposed_simulation.difficulty} (advisory label)</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Awareness training</p>
              {proposal.training_recommendation ? (
                <>
                  <p className="mt-1 text-lg font-bold text-ink-900">{scenarioLabel(proposal.training_recommendation.topic)}</p>
                  <p className="text-sm text-ink-600">
                    {proposal.training_recommendation.reason}
                    {proposal.training_recommendation.already_assigned && " (already assigned)"}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-600">None recommended: not enough evidence of a weakness.</p>
              )}
            </div>
          </div>

          <ul className="mt-4 list-disc pl-5 text-sm text-ink-600 space-y-1">
            {proposal.rationale.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <details className="mt-3 text-sm text-ink-400">
            <summary className="cursor-pointer font-medium">Guardrails and limitations</summary>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {[...proposal.guardrails_applied, ...proposal.limitations].map((line) => <li key={line}>{line}</li>)}
            </ul>
          </details>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-heading font-bold text-ink-900">Scenario vulnerability</h2>
        <p className="text-sm text-ink-400 mb-4">
          Sorted by estimated risk. Always read the estimate together with the number of attempts behind it.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead>
              <tr>
                {["Scenario", "Clicked / attempts", "Observed", "Estimated risk", "Likely range", "Model", "Evidence"].map((h) => (
                  <th key={h} className={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((a) => (
                <tr key={a.scenario} className="border-t border-ink-50">
                  <td className={`${tableCell} font-medium text-ink-900`}>{scenarioLabel(a.scenario)}</td>
                  <td className={`${tableCell} tabular-nums`}>{a.clicks} / {a.attempts}</td>
                  <td className={tableCell}>{percent(a.observed_click_rate)}</td>
                  <td className={tableCell}><Bar value={a.estimated_risk} tone={a.estimated_risk >= 0.4 ? "danger" : "brand"} /></td>
                  <td className={`${tableCell} text-xs text-ink-400 tabular-nums`}>{percent(a.interval_low)}–{percent(a.interval_high)}</td>
                  <td className={tableCell}>{percent(a.ml_click_probability)}</td>
                  <td className={tableCell}><EvidenceBadge level={a.evidence_level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          {data.disclaimer}{" "}
          {data.model_used
            ? `Model ${data.model_version} is experimental and was trained on synthetic data.`
            : "ML model not used; statistics only."}
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-heading font-bold text-ink-900 mb-3">Training</h2>
          {data.trainings.length === 0 ? (
            <EmptyState>No training assigned.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink-50">
              {data.trainings.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900 truncate">{t.title}</p>
                    <p className="text-xs text-ink-400">{scenarioLabel(t.category)} · {t.difficulty} · assigned {formatDate(t.created_at)}</p>
                  </div>
                  {t.completed ? <Badge variant="success">Done · {t.score}%</Badge> : <Badge variant="warning">Open</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-heading font-bold text-ink-900 mb-3">Decision audit</h2>
          {data.agent_audit.length === 0 ? (
            <EmptyState>No approved agent decisions yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink-50 text-sm">
              {data.agent_audit.map((entry) => (
                <li key={entry.event_id} className="py-3">
                  <p className="font-medium text-ink-900">
                    {scenarioLabel(entry.decision.scenario)} <span className="text-ink-400 font-normal">({entry.decision.mode})</span>
                  </p>
                  <p className="text-xs text-ink-400">
                    Approved by {entry.decision.approved_by} · {formatDate(entry.created_at)}
                    {entry.decision.model_version ? ` · model ${entry.decision.model_version}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-heading font-bold text-ink-900 mb-3">Activity timeline</h2>
        {data.activity.length === 0 ? (
          <EmptyState>No activity recorded.</EmptyState>
        ) : (
          <ol className="relative border-l border-ink-100 ml-2">
            {data.activity.map((item, index) => {
              const [label, variant] = ACTIVITY[item.type] || [item.type, "neutral"];
              return (
                <li key={`${item.type}-${item.simulation_id}-${index}`} className="ml-5 pb-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-white ring-2 ring-brand-500" />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant={variant}>{label}</Badge>
                    {item.scenario && <span className="font-medium text-ink-900">{scenarioLabel(item.scenario)}</span>}
                    <span className="ml-auto text-xs text-ink-400">{formatDate(item.at)}</span>
                  </div>
                  {item.detail && <p className="mt-0.5 text-xs text-ink-400">{item.detail}</p>}
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-xs text-ink-400">Showing the 100 most recent entries.</p>
      </Card>
    </>
  );
};

export default AdminEmployeeDetail;
