import Link from "next/link";
import {
  getEvents,
  getProjects,
  getHabits,
  getReminders,
  getHealthMetrics,
  getCalendar,
} from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function CharacterPage() {
  const events = getEvents();
  const projects = getProjects();
  const habits = getHabits();
  const reminders = getReminders();
  const metrics = getHealthMetrics();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = getCalendar().filter((c) => c.date >= today).slice(0, 12);
  const pendingReminders = reminders.filter((r) => r.status === "pending").slice(0, 5);
  const activeProjects = projects.filter((p) => p.status === "active");
  const totalSpend = projects.reduce(
    (s, p) => s + (p.costs ?? []).reduce((a, c) => a + (c.amount || 0), 0),
    0
  );

  // group calendar by date
  const grouped: Record<string, typeof upcoming> = {};
  for (const c of upcoming) (grouped[c.date] ||= []).push(c);

  return (
    <div className="character">
      <header className="character-header">
        <h2>Character</h2>
        <p className="subtitle">{today}</p>
      </header>

      <div className="character-grid">
        <section className="character-stats">
          <div className="section-divider">Stats</div>
          <StatLine label="Events" value={events.length} href="/events" />
          <StatLine label="Reminders pending" value={pendingReminders.length} href="/reminders" />
          <StatLine label="Active projects" value={activeProjects.length} href="/projects" />
          <StatLine label="Habits tracked" value={habits.length} href="/habits" />
          <StatLine label="Project spend" value={`$${totalSpend.toFixed(0)}`} href="/finance" />
        </section>

        <section className="character-vitals">
          <div className="section-divider">Vitals</div>
          {metrics.length === 0 ? (
            <div className="meta">No metrics tracked. Add some in <Link href="/health">Health</Link>.</div>
          ) : (
            metrics.slice(0, 5).map((m) => (
              <div className="vital" key={m.key}>
                <span className="label">{m.label}</span>
                <span className="value">{m.value}{m.unit ? ` ${m.unit}` : ""}</span>
              </div>
            ))
          )}
        </section>
      </div>

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

function StatLine({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href} className="stat-line">
      <span className="stat-value">{value}</span>
      <span className="stat-bar" />
      <span className="stat-label">{label}</span>
    </Link>
  );
}
