import Link from "next/link";
import {
  getDailies,
  getDailyLog,
  getCalendar,
  getQuests,
  getNutrition,
  getMorningReport,
} from "@/lib/vault";
import { todayLocal, LOCAL_TZ } from "@/lib/tz";

export const revalidate = 30;

function todayDow(): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: LOCAL_TZ, weekday: "short" })
    .format(new Date())
    .toLowerCase();
}

function longDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LOCAL_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso + "T12:00:00"));
}

export default function TodayPage() {
  const today = todayLocal();
  const dow = todayDow();
  const cfg = getMorningReport();
  const nutrition = getNutrition();

  const todaysCal = getCalendar().filter((c) => c.date === today);
  const events = todaysCal.filter((c) => c.kind === "event");
  const agenda = todaysCal.filter((c) => c.kind === "reminder" || c.kind === "task");

  const todaysDailies = getDailies().filter((d) => {
    if (d.cadence === "once") return d.date === today;
    if (!d.days || d.days.length === 0) return true;
    return d.days.includes(dow);
  });

  const goals = getQuests().filter((q) => q.status === "active");

  return (
    <div className="character">
      <header className="character-header">
        <h2>{cfg.greeting}</h2>
        <p className="subtitle">{longDate(today)}</p>
      </header>

      <div className="section-divider">On today</div>
      {events.length === 0 ? (
        <div className="empty">No events scheduled today.</div>
      ) : (
        <div className="cal-items">
          {events.map((c, i) => (
            <Link key={i} href={c.href} className="cal-item kind-event">
              {c.time && <span className="cal-time">{c.time}</span>}
              <span className="cal-title">{c.title}</span>
              {c.detail && <span className="badge">{c.detail}</span>}
            </Link>
          ))}
        </div>
      )}

      <div className="section-divider">Daily plan</div>
      {todaysDailies.length === 0 ? (
        <div className="empty">
          Nothing set. <Link href="/dailies">Add a daily →</Link>
        </div>
      ) : (
        <div className="cal-items">
          {todaysDailies.map((d) => {
            const log = getDailyLog(d.slug);
            const status = log.find((l) => l.date === today)?.status ?? "open";
            const tone = status === "done" ? "good" : status === "skip" ? "warn" : "";
            return (
              <Link
                key={d.slug}
                href={`/dailies/${d.slug}`}
                className={`cal-item kind-${d.cadence === "once" ? "task" : "daily"}`}
              >
                {d.time && <span className="cal-time">{d.time}</span>}
                <span className="cal-title">{d.title}</span>
                <span className={`badge ${tone}`}>{status}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="section-divider">Reminders &amp; deadlines</div>
      {agenda.length === 0 ? (
        <div className="empty">Nothing due today.</div>
      ) : (
        <div className="cal-items">
          {agenda.map((c, i) => (
            <Link key={i} href={c.href} className={`cal-item kind-${c.kind}`}>
              {c.time && <span className="cal-time">{c.time}</span>}
              <span className="cal-title">{c.title}</span>
              <span className={`badge ${c.kind === "task" ? "warn" : "good"}`}>{c.kind}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="section-divider">Fuel</div>
      {!nutrition ? (
        <div className="empty">No nutrition plan set.</div>
      ) : (
        <div className="health-layout">
          <div className="health-right">
            <div className="damage-section">
              <div className="section-title" style={{ marginTop: 0 }}>
                Target · <span className="badge good">{nutrition.phase}</span>
              </div>
              <div className="damage-row">
                <div className="damage-icon">◈</div>
                <div>
                  <div className="damage-value">{nutrition.target.calories.toLocaleString()}</div>
                  <div className="damage-label">kcal today</div>
                </div>
              </div>
            </div>
            <div className="damage-section">
              <div className="section-title">Macros</div>
              <div className="vitals-row"><span>Protein</span><strong>{nutrition.target.protein}g</strong></div>
              <div className="vitals-row"><span>Carbs</span><strong>{nutrition.target.carbs}g</strong></div>
              <div className="vitals-row"><span>Fats</span><strong>{nutrition.target.fats}g</strong></div>
            </div>
          </div>
        </div>
      )}

      <div className="section-divider">Goals in play</div>
      {goals.length === 0 ? (
        <div className="empty">No active quests.</div>
      ) : (
        goals.map((q) => (
          <Link href={`/quests/${q.slug}`} key={q.slug} className="card-link">
            <div className="card">
              <h3>{q.title}</h3>
              <div className="meta">
                {q.deadline ? `by ${q.deadline}` : "open-ended"}
                {typeof q.progress === "number" ? ` · ${q.progress}%` : ""}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
