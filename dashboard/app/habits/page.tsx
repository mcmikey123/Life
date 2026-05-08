import Link from "next/link";
import { getHabits, getHabitLog } from "@/lib/vault";
import NewItemForm from "../_components/NewItemForm";

export const revalidate = 30;

function streak(log: { date: string; status: string }[]): number {
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const entry = log.find((l) => l.date === iso);
    if (entry?.status === "done") count++;
    else if (entry?.status === "skip" || !entry) {
      if (i === 0 && !entry) continue;
      break;
    }
  }
  return count;
}

function adherence30(log: { date: string; status: string }[]): number {
  const today = new Date();
  let done = 0;
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const entry = log.find((l) => l.date === iso);
    if (entry) {
      total++;
      if (entry.status === "done") done++;
    }
  }
  return total ? Math.round((done / total) * 100) : 0;
}

export default function HabitsPage() {
  const habits = getHabits();

  return (
    <>
      <h2>Habits</h2>
      <p className="subtitle">Daily disciplines · {habits.length} tracked · tap to edit</p>

      <NewItemForm kind="habit" />

      {habits.length === 0 ? (
        <div className="empty">No habits yet</div>
      ) : (
        <div className="skill-grid">
          {habits.map((h) => {
            const log = getHabitLog(h.slug);
            const s = streak(log);
            const adh = adherence30(log);
            const tone = s >= 7 ? "active" : s >= 3 ? "warn" : "";
            return (
              <Link href={`/habits/${h.slug}`} key={h.slug} className="card-link">
                <div className="skill-card">
                  <div className={`skill-level-badge ${tone}`}>
                    <div style={{ textAlign: "center" }}>
                      <div className="skill-level-number">{s}</div>
                      <div className="skill-level-sub">Streak</div>
                    </div>
                  </div>
                  <div>
                    <div className="skill-name">{h.title}</div>
                    <div className="skill-meta" style={{ marginTop: 6 }}>
                      {h.cadence}
                      {h.time ? ` · ${h.time}` : ""}
                      {h.days?.length ? ` · ${h.days.join("/")}` : ""}
                    </div>
                    <div className="skill-meta">
                      {adh}% · 30d
                      {h.streak_target ? ` · target ${h.streak_target}` : ""}
                    </div>
                    {h.linked_health_metric && (
                      <div className="skill-meta">↳ health: {h.linked_health_metric}</div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
