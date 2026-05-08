import Link from "next/link";
import {
  getProjects,
  getDailies,
  getDailyLog,
  getCalendar,
} from "@/lib/vault";
import { todayLocal, LOCAL_TZ } from "@/lib/tz";

export const revalidate = 30;

function todayDow(): string {
  // Intl returns "Mon", "Tue", ... in en-US. Lowercase keeps us consistent
  // with the day-of-week strings stored in vault frontmatter.
  return new Intl.DateTimeFormat("en-US", { timeZone: LOCAL_TZ, weekday: "short" })
    .format(new Date())
    .toLowerCase();
}

export default function CharacterPage() {
  const projects = getProjects();
  const dailies = getDailies();
  const today = todayLocal();
  const dow = todayDow();

  const upcoming = getCalendar().filter((c) => c.date >= today).slice(0, 12);
  const activeProjects = projects.filter((p) => p.status === "active");

  // Today's dailies: one-offs whose date === today, plus recurring whose
  // days list includes today (or whose days list is empty = every day).
  const todaysDailies = dailies.filter((d) => {
    if (d.cadence === "once") return d.date === today;
    if (!d.days || d.days.length === 0) return true;
    return d.days.includes(dow);
  });

  const grouped: Record<string, typeof upcoming> = {};
  for (const c of upcoming) (grouped[c.date] ||= []).push(c);

  return (
    <div className="character">
      <header className="character-header">
        <h2>Character</h2>
        <p className="subtitle">{today}</p>
      </header>

      <div className="section-divider">Calendar — upcoming</div>
      {Object.keys(grouped).length === 0 ? (
        <div className="empty">Nothing on the horizon.</div>
      ) : (
        Object.keys(grouped).sort().map((date) => (
          <div className="cal-day" key={date}>
            <div className="cal-date">{date}{date === today && " · today"}</div>
            <div className="cal-items">
              {grouped[date].map((c, i) => (
                <Link key={i} href={c.href} className={`cal-item kind-${c.kind}`}>
                  {c.time && <span className="cal-time">{c.time}</span>}
                  <span className="cal-title">{c.title}</span>
                  <span className={`badge ${c.kind === "task" ? "warn" : c.kind === "reminder" ? "good" : ""}`}>
                    {c.kind}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="section-divider">Today{"’"}s Dailies</div>
      {todaysDailies.length === 0 ? (
        <div className="empty">
          Nothing for today. <Link href="/dailies">Add a daily →</Link>
        </div>
      ) : (
        <div className="cal-items">
          {todaysDailies.map((d) => {
            const log = getDailyLog(d.slug);
            const todayEntry = log.find((l) => l.date === today);
            const status = todayEntry?.status ?? "open";
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

      <div className="section-divider">Active projects</div>
      {activeProjects.length === 0 ? (
        <div className="empty">No active projects.</div>
      ) : (
        activeProjects.map((p) => (
          <Link href={`/projects/${p.slug}`} key={p.slug} className="card-link">
            <div className="card">
              <h3>{p.title}</h3>
              <div className="meta">
                {p.deadline ? `due ${p.deadline} · ` : ""}
                {(p.tasks ?? []).filter((t) => !t.done).length} open tasks
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
