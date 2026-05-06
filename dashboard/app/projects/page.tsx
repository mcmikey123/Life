import Link from "next/link";
import { getProjects } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <>
      <h2>Projects</h2>
      <p className="subtitle">Tap a project to edit budget, log costs, and add tasks (with reminders).</p>

      {projects.length === 0 && <div className="empty">No projects yet.</div>}

      {projects.map((p) => {
        const open = (p.tasks ?? []).filter((t) => !t.done).length;
        const actual = (p.costs ?? []).reduce((s, c) => s + (c.amount || 0), 0);
        const est = p.budget?.estimated ?? 0;
        const overBudget = actual > est && est > 0;

        return (
          <Link href={`/projects/${p.slug}`} key={p.slug} className="card-link">
            <div className="card">
              <h3>{p.title}</h3>
              <div className="meta">
                <span className={`badge ${p.status === "active" ? "good" : ""}`}>{p.status}</span>
                {p.priority && <span className="tag">priority: {p.priority}</span>}
                {p.deadline && <span className="tag">due {p.deadline}</span>}
              </div>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                <span className="meta">{open} open task(s) · </span>
                {est > 0 && (
                  <span className={overBudget ? "badge bad" : "badge"}>
                    ${actual.toFixed(0)} / ${est.toFixed(0)} {p.budget?.currency}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
