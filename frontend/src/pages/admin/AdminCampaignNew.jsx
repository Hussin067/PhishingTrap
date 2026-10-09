import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAdmin } from "../../components/admin/AdminContext";
import { useAdminData } from "../../components/admin/useAdminData";
import { ErrorNotice, PageTitle, scenarioLabel, tableCell, tableHead } from "../../components/admin/ui";
import { getAdminEmployees, runCampaign } from "../../services/adminApi";

const SCENARIOS = [
  "password_reset", "account_verification", "invoice", "security_alert", "payment_request",
  "shipping_notification", "order_confirmation", "mfa_verification", "document_shared",
  "payroll_update", "hr_document", "benefits_update",
];

const field = "rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500";
const SKIP_TEXT = {
  recent_simulation: "received a simulation in the last 24 hours",
  inactive: "account is inactive",
  not_found: "unknown employee",
};

const AdminCampaignNew = () => {
  const { includeSynthetic } = useAdmin();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselected = params.get("employee");

  const employees = useAdminData(() => getAdminEmployees(includeSynthetic), [includeSynthetic]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState(preselected ? "adaptive" : "fixed");
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [audience, setAudience] = useState(preselected ? "selected" : "all");
  const [selected, setSelected] = useState(() => (preselected ? [Number(preselected)] : []));
  const [assignTraining, setAssignTraining] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (employees.error) return <ErrorNotice error={employees.error} onRetry={employees.reload} />;
  if (employees.loading) return <LoadingSpinner message="Loading employees..." />;

  const people = employees.data.employees;
  const names = Object.fromEntries(people.map((p) => [p.employee_id, p.name]));

  const requestBody = (dryRun) => ({
    name,
    description: description || null,
    mode,
    scenario: mode === "fixed" ? scenario : null,
    employee_ids: audience === "all" ? null : selected,
    assign_training: assignTraining,
    include_synthetic: includeSynthetic,
    dry_run: dryRun,
    confirm: !dryRun,
  });

  const invalidate = () => {
    setPlan(null);
    setConfirmed(false);
    setError("");
  };

  const canPreview = name.trim() && (mode === "adaptive" || scenario) && (audience === "all" || selected.length > 0);

  const preview = async () => {
    setBusy(true);
    setError("");
    try {
      setPlan(await runCampaign(requestBody(true)));
    } catch (err) {
      setPlan(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const launch = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await runCampaign(requestBody(false));
      navigate(`/admin/campaigns/${result.campaign_id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const toggle = (id) => {
    invalidate();
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  return (
    <>
      <p className="mb-2 text-sm">
        <Link to="/admin/campaigns" className="text-brand-600 hover:underline">← All campaigns</Link>
      </p>
      <PageTitle
        title="New campaign"
        subtitle="Create authorized internal phishing simulations. Review the plan first; nothing is created until you launch."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="hover:translate-y-0">
          <h2 className="font-heading font-bold text-ink-900 mb-4">1. Set up</h2>
          <div className="flex flex-col gap-4" onChange={invalidate}>
            <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
              Campaign name
              <input className={field} value={name} maxLength={150} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 HR document awareness" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
              Description (optional)
              <input className={field} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-ink-700 mb-1">How are scenarios chosen?</legend>
              <label className="flex items-start gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="radio" name="mode" checked={mode === "adaptive"} onChange={() => setMode("adaptive")} className="mt-1 accent-brand-600" />
                <span><b>Adaptive</b>: the agent picks a scenario and difficulty for each employee from their history, and recommends training where the evidence supports it.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="radio" name="mode" checked={mode === "fixed"} onChange={() => setMode("fixed")} className="mt-1 accent-brand-600" />
                <span><b>Fixed</b>: everyone receives the same scenario.</span>
              </label>
            </fieldset>

            {mode === "fixed" && (
              <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
                Scenario
                <select className={field} value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  {SCENARIOS.map((s) => <option key={s} value={s}>{scenarioLabel(s)}</option>)}
                </select>
              </label>
            )}

            {mode === "adaptive" && (
              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="checkbox" checked={assignTraining} onChange={(e) => setAssignTraining(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                Also assign recommended awareness training
              </label>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-ink-700 mb-1">Who receives it?</legend>
              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="radio" name="audience" checked={audience === "all"} onChange={() => setAudience("all")} className="accent-brand-600" />
                All active employees ({people.length})
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="radio" name="audience" checked={audience === "selected"} onChange={() => setAudience("selected")} className="accent-brand-600" />
                Selected employees ({selected.length})
              </label>
            </fieldset>

            {audience === "selected" && (
              <ul className="max-h-56 overflow-y-auto rounded-xl border border-ink-100 divide-y divide-ink-50" aria-label="Choose employees">
                {people.map((p) => (
                  <li key={p.employee_id}>
                    <label className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-brand-50/60">
                      <input type="checkbox" checked={selected.includes(p.employee_id)} onChange={() => toggle(p.employee_id)} className="h-4 w-4 accent-brand-600" />
                      <span className="text-ink-900">{p.name}</span>
                      <span className="ml-auto text-xs text-ink-400">{p.department || ""}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <Button onClick={preview} loading={busy && !plan} disabled={!canPreview}>
              Preview plan
            </Button>
          </div>
        </Card>

        <Card className="hover:translate-y-0">
          <h2 className="font-heading font-bold text-ink-900 mb-4">2. Review and launch</h2>

          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
          )}

          {!plan ? (
            <p className="text-sm text-ink-400 py-8 text-center">
              Fill in the form and choose "Preview plan" to see exactly who would receive what.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-600">
                <b>{plan.planned.length}</b> simulation{plan.planned.length === 1 ? "" : "s"} would be created in “{plan.name}”.
                {plan.data_source === "includes_synthetic" && " Adaptive choices use synthetic demo history."}
              </p>

              <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-ink-100">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      {["Employee", "Scenario", "Difficulty", "Training"].map((h) => <th key={h} className={tableHead}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.planned.map((row) => (
                      <tr key={row.employee_id} className="border-t border-ink-50">
                        <td className={tableCell}>{row.employee_name}</td>
                        <td className={tableCell}>{scenarioLabel(row.scenario)}</td>
                        <td className={tableCell}>{row.difficulty || "—"}</td>
                        <td className={tableCell}>
                          {row.training_topic && assignTraining ? <Badge variant="category">{scenarioLabel(row.training_topic)}</Badge> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {plan.skipped.length > 0 && (
                <div className="mt-3 rounded-xl bg-warning-50 p-3 text-sm text-warning-600">
                  <p className="font-semibold">Skipped</p>
                  <ul className="list-disc pl-5">
                    {plan.skipped.map((s) => (
                      <li key={`${s.employee_id}-${s.reason}`}>
                        {names[s.employee_id] || `Employee ${s.employee_id}`}: {SKIP_TEXT[s.reason] || s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
                Email delivery is not configured in this prototype: launching records the simulations and gives each a
                preview link. Connect a mail sender to an internal test inbox before using it with real staff.
              </p>

              <label className="mt-4 flex items-start gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                I confirm this is an authorized internal security-awareness simulation.
              </label>
              <Button className="mt-4 w-full" onClick={launch} loading={busy} disabled={!confirmed}>
                Launch campaign
              </Button>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminCampaignNew;
