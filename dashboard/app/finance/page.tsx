import { aggregateProjectCosts } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function FinancePage() {
  const projectCosts = aggregateProjectCosts();
  const totalActual = projectCosts.reduce((s, p) => s + p.actual, 0);
  const totalEstimated = projectCosts.reduce((s, p) => s + p.estimated, 0);

  return (
    <>
      <h2>Finance</h2>
      <p className="subtitle">Phase 2 · Currently aggregates project costs only. Income/recurring expenses TBD.</p>

      <div className="kpi-grid">
        <div className="kpi"><div className="label">Total project spend</div><div className="value">${totalActual.toFixed(2)}</div></div>
        <div className="kpi"><div className="label">Total project budget</div><div className="value">${totalEstimated.toFixed(2)}</div></div>
        <div className="kpi"><div className="label">Tracked projects</div><div className="value">{projectCosts.length}</div></div>
      </div>

      <div className="section-divider">By project</div>
      {projectCosts.length === 0 ? (
        <div className="empty">No project costs tracked yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Estimated</th>
              <th>Actual</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {projectCosts.map((p) => (
              <tr key={p.slug}>
                <td>{p.project}</td>
                <td>{p.estimated.toFixed(2)}</td>
                <td>{p.actual.toFixed(2)}</td>
                <td>{p.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-divider">Roadmap</div>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Recurring expenses (rent, subscriptions) defined in <code>vault/finance/recurring.md</code></li>
          <li>Income sources in <code>vault/finance/income.md</code></li>
          <li>Monthly burn / savings rate KPIs</li>
          <li>Optional: pull bank CSV imports into <code>vault/finance/transactions/</code></li>
        </ul>
      </div>
    </>
  );
}
