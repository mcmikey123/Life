import { getHabits, getHabitLog } from "@/lib/vault";

export const dynamic = "force-dynamic";

function streak(log: { date: string; status: string }[]): number {
  // Counts back from today; "done" extends streak, "skip" or missing breaks it.
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const entry = log.find((l) => l.date === iso);
    if (entry?.status === "done") count++;
    else if (entry?.status === "skip" || !entry) {
      if (i === 0 && !entry) continue; // today not logged yet, don't break
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
      <p className="subtitle">Daily/weekly habits with adherence tracking. Some link to Health metrics.</p>

      {habits.length === 0 && <div className="empty">No habits yet.</div>}

      {habits.map((h) => {
        const log = getHabitLog(h.slug);
        const s = streak(log);
        const adh = adherence30(log);
        return (
          <div className="card" key={h.slug}>
            <h3>{h.title}</h3>
            <div className="meta">
              <span className="tag">{h.cadence}</span>
              {h.time && <span className="tag">{h.time}</span>}
              {h.days && <span className="tag">{h.days.join("/")}</span>}
              {h.linked_health_metric && <span className="tag">↳ health: {h.linked_health_metric}</span>}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 24 }}>
              <div><strong>{s}</strong> day streak</div>
              <div><strong>{adh}%</strong> adherence (30d)</div>
              {h.streak_target && <div className="meta">target: {h.streak_target}</div>}
            </div>
          </div>
        );
      })}
    </>
  );
}
