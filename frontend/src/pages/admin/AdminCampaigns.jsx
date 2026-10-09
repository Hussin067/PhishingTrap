import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAdmin } from "../../components/admin/AdminContext";
import { useAdminData } from "../../components/admin/useAdminData";
import { EmptyState, ErrorNotice, PageTitle, formatDate, percent, tableCell, tableHead } from "../../components/admin/ui";
import { getAdminCampaigns } from "../../services/adminApi";

const AdminCampaigns = () => {
  const { includeSynthetic } = useAdmin();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAdminData(() => getAdminCampaigns(includeSynthetic), [includeSynthetic]);

  if (error) return <ErrorNotice error={error} onRetry={reload} />;
  if (loading) return <LoadingSpinner message="Loading campaigns..." />;

  return (
    <>
      <PageTitle
        title="Campaigns"
        subtitle="Authorized internal phishing simulations and how employees responded."
        actions={<Button onClick={() => navigate("/admin/campaigns/new")}>New campaign</Button>}
      />
      <Card className="hover:translate-y-0">
        {data.campaigns.length === 0 ? (
          <EmptyState>No campaigns yet. Create one to start simulating.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead>
                <tr>
                  {["Campaign", "Created", "Employees", "Simulations", "Click rate", "Report rate"].map((h) => (
                    <th key={h} className={tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-ink-50 hover:bg-brand-50/60">
                    <td className={tableCell}>
                      <Link to={`/admin/campaigns/${c.id}`} className="font-medium text-ink-900 hover:text-brand-600">
                        {c.name}
                      </Link>
                      {c.is_synthetic && <Badge variant="warning" className="ml-2">Synthetic</Badge>}
                      {c.description && <p className="text-xs text-ink-400 max-w-md truncate">{c.description}</p>}
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{formatDate(c.created_at)}</td>
                    <td className={tableCell}>{c.employees}</td>
                    <td className={tableCell}>{c.simulations}</td>
                    <td className={tableCell}>{percent(c.click_rate, 1)}</td>
                    <td className={tableCell}>{percent(c.report_rate, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};

export default AdminCampaigns;
