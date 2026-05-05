import { getProjects } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <>
      <h2>Projects</h2>
      <p className="subtitle">Ongoing work, tasks, and project costs (rolled into Finance).</p>

      {projects.length === 0 && <div className="empty">No projects yet.</div>}

      {projects.map((p) => {
        const open = (p.tasks ?? []).filter((t) => !t.done);
        const done = (p.tasks ?? []).filter((t) => t.done);
        const actual = (p.costs ?? []).reduce((s, c) => s + (c.amount || 0), 0);
        const est = p.budget?.estimated ?? 0;
        const budgetPct = est ? Math.round((actual / est) * 100) : 0;
        const overBudget = actual > est && est > 0;

        return (
          <div className="card" key={p.slug}>
            <h3>{p.title}</h3>
            <div className="meta">
              <span className={`badge ${p.status === "active" ? "good" : ""}`}>{p.status}</span>
              {p.priority && <span className="tag">priority: {p.priority}</span>}
              {p.deadline && <span className="tag">due {p.deadline}</span>}
            </div>

            {est > 0 && (
              <div style={{ marginTop: 10, fontSize: 14 }}>
                Budget:{" "}
                <span className={overBudget ? "badge bad" : "badge"}>
                  {actual.toFixed(2)} / {est.toFixed(2)} {p.budget?.currency} ({budgetPct}%)
                </span>
              </div>
            )}

            {open.length > 0 && (
              <>
                <div className="section-divider" style={{ marginTop: 14 }}>Open tasks</div>
                {open.map((t) => (
                  <div className="task" key={t.id}>
                    <span>☐</span>
                    <span>{t.title}</span>
                    {t.deadline && <span className="deadline">due {t.deadline}</span>}
                  </div>
                ))}
              </>
            )}
            {done.length > 0 && (
              <>
                <div className="section-divider" style={{ marginTop: 14 }}>Completed</div>
                {done.map((t) => (
                  <div className="task done" key={t.id}>
                    <span>☑</span>
                    <span>{t.title}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
