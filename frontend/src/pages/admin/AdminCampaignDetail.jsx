import { Link, useParams } from "react-router-dom";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import StatCard from "../../components/dashboard/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAdminData } from "../../components/admin/useAdminData";
import { ErrorNotice, PageTitle, formatDate, percent, scenarioLabel, tableCell, tableHead } from "../../components/admin/ui";
import { getCampaignDetail, previewUrl } from "../../services/adminApi";

const outcome = (r) =>
  r.clicked ? <Badge variant="danger">Clicked</Badge> : r.reported ? <Badge variant="success">Reported</Badge> : <Badge variant="neutral">No action yet</Badge>;

const AdminCampaignDetail = () => {
  const { campaignId } = useParams();
  const { data, error, loading, reload } = useAdminData(() => getCampaignDetail(campaignId), [campaignId]);

  if (error) return <ErrorNotice error={error} onRetry={reload} />;
  if (loading) return <LoadingSpinner message="Loading campaign..." />;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link to="/admin/campaigns" className="text-brand-600 hover:underline">← All campaigns</Link>
      </p>
      <PageTitle
        title={data.name}
        subtitle={`${data.description || ""} Created ${formatDate(data.created_at)}.`.trim()}
        actions={data.is_synthetic && <Badge variant="warning">Synthetic data</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Simulations" value={data.simulations} />
        <StatCard title="Clicked" value={data.clicks} description={percent(data.click_rate, 1)} />
        <StatCard title="Reported" value={data.reports} description={percent(data.report_rate, 1)} />
        <StatCard title="No action" value={data.ignored} description="Neither clicked nor reported" />
      </div>

      <Card className="mt-6 hover:translate-y-0">
        <h2 className="font-heading font-bold text-ink-900 mb-3">Results by employee</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem]">
            <thead>
              <tr>
                {["Employee", "Scenario", "Outcome", "Sent", "Email"].map((h) => (
                  <th key={h} className={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.simulation_id} className="border-t border-ink-50">
                  <td className={tableCell}>
                    <Link to={`/admin/employees/${r.employee_id}`} className="font-medium text-ink-900 hover:text-brand-600">
                      {r.employee_name}
                    </Link>
                    <p className="text-xs text-ink-400">{r.department || "No department"}</p>
                  </td>
                  <td className={tableCell}>{scenarioLabel(r.scenario)}</td>
                  <td className={tableCell}>{outcome(r)}</td>
                  <td className={`${tableCell} whitespace-nowrap`}>{formatDate(r.sent_at)}</td>
                  <td className={tableCell}>
                    <a href={previewUrl(r.simulation_id)} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                      Preview email
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.simulations > data.results_shown && (
          <p className="mt-3 text-xs text-ink-400">Showing the {data.results_shown} most recent of {data.simulations} results.</p>
        )}
      </Card>
    </>
  );
};

export default AdminCampaignDetail;
