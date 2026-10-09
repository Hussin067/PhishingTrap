import { useNavigate } from "react-router-dom";
import { percent, scenarioLabel } from "./ui";

/**
 * Employees (rows) x phishing scenarios (columns). Colour = smoothed click
 * risk; the number in each cell is clicks/attempts so the evidence behind the
 * colour is always visible. A ring marks a weakness with enough evidence
 * (>= 3 attempts, >= 2 clicks). Cells without data stay grey.
 */
const cellStyle = (cell) => {
  if (cell.attempts === 0) return { background: "#EEF1F6" };
  const strength = Math.min(cell.estimated_risk / 0.7, 1);
  return { background: `rgba(244, 63, 94, ${0.12 + 0.78 * strength})` };
};

const WeaknessHeatmap = ({ matrix }) => {
  const navigate = useNavigate();

  if (!matrix.employees.length) {
    return <p className="text-sm text-ink-400 py-6 text-center">No employees to show.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left pr-3 font-semibold text-ink-400">Employee</th>
              {matrix.scenarios.map((scenario) => (
                <th key={scenario} className="h-28 min-w-[3.25rem] align-bottom">
                  <span
                    className="block origin-bottom-left -rotate-45 whitespace-nowrap font-medium text-ink-600 translate-x-4"
                    title={scenarioLabel(scenario)}
                  >
                    {scenarioLabel(scenario)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.employees.map((employee) => (
              <tr key={employee.employee_id}>
                <th scope="row" className="sticky left-0 bg-white text-left pr-3 font-medium text-ink-700 whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/admin/employees/${employee.employee_id}`)}
                    className="hover:text-brand-600 hover:underline cursor-pointer"
                  >
                    {employee.name}
                  </button>
                </th>
                {employee.cells.map((cell) => (
                  <td
                    key={cell.scenario}
                    title={`${employee.name} — ${scenarioLabel(cell.scenario)}: ${cell.clicks}/${cell.attempts} clicks, estimated risk ${percent(cell.estimated_risk)} (${cell.evidence_level} evidence)`}
                    style={cellStyle(cell)}
                    className={`h-8 min-w-[3.25rem] rounded-md text-center tabular-nums text-ink-900 ${
                      cell.established ? "ring-2 ring-ink-900" : ""
                    }`}
                  >
                    {cell.attempts ? `${cell.clicks}/${cell.attempts}` : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-400">
        <span className="flex items-center gap-2">
          Lower risk
          <span className="h-3 w-24 rounded" style={{ background: "linear-gradient(to right, rgba(244,63,94,.12), rgba(244,63,94,.9))" }} />
          Higher risk
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-ink-50 ring-1 ring-ink-100" /> No attempts yet
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded ring-2 ring-ink-900" /> Weakness with enough evidence
        </span>
        <span>Cell text = clicks/attempts</span>
      </div>
      <p className="mt-2 text-xs text-ink-400">{matrix.note}</p>
    </div>
  );
};

export default WeaknessHeatmap;
