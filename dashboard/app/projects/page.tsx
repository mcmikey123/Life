import Link from "next/link";
import { getProjects } from "@/lib/vault";
import NewItemForm from "../_components/NewItemForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "In Progress",
  planned: "Planned",
  planning: "Planning",
  done: "Complete",
  paused: "Paused",
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <>
      <h2>Projects</h2>
      <p className="subtitle">Active campaigns · {projects.length} tracked · tap to edit budget, costs, and tasks</p>

      <NewItemForm kind="project" />

      {projects.length === 0 ? (
        <div className="empty">No projects yet</div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => {
            const total = (p.tasks ?? []).length;
            const done = (p.tasks ?? []).filter((t) => t.done).length;
            const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;

            const actual = (p.costs ?? []).reduce((s, c) => s + (c.amount || 0), 0);
            const est = p.budget?.estimated ?? 0;
            const budgetPct = est ? Math.round((actual / est) * 100) : 0;

            const xpReward = total > 0 ? total * 50 : 100;
            const status = STATUS_LABEL[p.status] || p.status;

            return (
              <Link href={`/projects/${p.slug}`} key={p.slug} className="card-link">
                <div className="project-card">
                  <div className="project-status">{status}</div>
                  <div className="project-title">{p.title}</div>

                  <div className="project-meta">
                    {p.deadline ? `Due ${p.deadline}` : "No deadline"}
                    {p.priority ? ` · ${p.priority}` : ""}
                  </div>

                  <div className="project-progress">
                    <div className="progress-bar-project">
                      <div className="progress-fill-project" style={{ width: `${taskPct}%` }} />
                    </div>
                    <div className="progress-percent">
                      {taskPct}% · {done}/{total} tasks
                    </div>
                  </div>

                  {est > 0 && (
                    <div className="project-progress">
                      <div className="progress-bar-project">
                        <div
                          className="progress-fill-project"
                          style={{
                            width: `${Math.min(100, budgetPct)}%`,
                            background: budgetPct > 100
                              ? "linear-gradient(90deg, #e07e7e, #ffb1b1)"
                              : undefined,
                          }}
                        />
                      </div>
                      <div className="progress-percent">
                        ${actual.toFixed(0)} / ${est.toFixed(0)} {p.budget?.currency || ""}
                      </div>
                    </div>
                  )}

                  <div className="project-reward">+ {xpReward} XP</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
