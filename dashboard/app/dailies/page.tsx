import Link from "next/link";
import { getDailies, getDailyLog } from "@/lib/vault";
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

export default function DailiesPage() {
  const dailies = getDailies();

  return (
    <>
      <h2>Dailies</h2>
      <p className="subtitle">
        What you{"’"}re working on today · {dailies.length} tracked · tap to edit
      </p>

      <NewItemForm kind="daily" />

      {dailies.length === 0 ? (
        <div className="empty">No dailies yet</div>
      ) : (
        <div className="skill-grid">
          {dailies.map((d) => {
            const log = getDailyLog(d.slug);
            const s = streak(log);
            const adh = adherence30(log);
            const tone = s >= 7 ? "active" : s >= 3 ? "warn" : "";
            const isOnce = d.cadence === "once";
            return (
              <Link href={`/dailies/${d.slug}`} key={d.slug} className="card-link">
                <div className="skill-card">
                  <div className={`skill-level-badge ${tone}`}>
                    <div style={{ textAlign: "center" }}>
                      <div className="skill-level-number">{isOnce ? "1" : s}</div>
                      <div className="skill-level-sub">{isOnce ? "Once" : "Streak"}</div>
                    </div>
                  </div>
                  <div>
                    <div className="skill-name">{d.title}</div>
                    <div className="skill-meta" style={{ marginTop: 6 }}>
                      {d.cadence}
                      {isOnce && d.date ? ` · ${d.date}` : ""}
                      {d.time ? ` · ${d.time}` : ""}
                      {!isOnce && d.days?.length ? ` · ${d.days.join("/")}` : ""}
                    </div>
                    {!isOnce && (
                      <div className="skill-meta">
                        {adh}% · 30d
                        {d.streak_target ? ` · target ${d.streak_target}` : ""}
                      </div>
                    )}
                    {d.linked_health_metric && (
                      <div className="skill-meta">↳ health: {d.linked_health_metric}</div>
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
