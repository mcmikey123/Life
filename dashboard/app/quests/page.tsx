import Link from "next/link";
import { getQuests } from "@/lib/vault";
import NewItemForm from "../_components/NewItemForm";

export const revalidate = 30;

const HORIZON_LABEL: Record<string, string> = {
  long: "Long-term",
  medium: "Medium-term",
  short: "Short-term",
};

export default function QuestsPage() {
  const quests = getQuests();
  const active = quests.filter((q) => q.status === "active");
  const done = quests.filter((q) => q.status === "done");

  return (
    <>
      <h2>Quests</h2>
      <p className="subtitle">Long-term goals · {active.length} active · the things this life is aiming at</p>

      <NewItemForm kind="quest" />

      {active.length === 0 ? (
        <div className="empty">No quests yet. What are you actually building toward?</div>
      ) : (
        <div className="project-grid">
          {active.map((q) => {
            const pct = Math.max(0, Math.min(100, q.progress ?? 0));
            const horizon = HORIZON_LABEL[q.horizon || "long"] || q.horizon || "Long-term";
            return (
              <Link href={`/quests/${q.slug}`} key={q.slug} className="card-link">
                <div className="project-card">
                  <div className="project-status">{horizon}</div>
                  <div className="project-title">{q.title}</div>

                  <div className="project-meta">
                    {q.deadline ? `By ${q.deadline}` : "Open-ended"}
                    {q.linked_projects && q.linked_projects.length > 0
                      ? ` · ${q.linked_projects.length} linked`
                      : ""}
                  </div>

                  <div className="project-progress">
                    <div className="progress-bar-project">
                      <div className="progress-fill-project" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-percent">{pct}% progress</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <>
          <div className="section-title">Completed</div>
          <div className="event-list">
            {done.map((q) => (
              <Link href={`/quests/${q.slug}`} key={q.slug} className="card-link">
                <div className="event-row">
                  <div>
                    <div className="event-title">{q.title}</div>
                    <div className="event-info">
                      {q.deadline || "—"} · {HORIZON_LABEL[q.horizon || "long"]}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
