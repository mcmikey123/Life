import { getEvents, getProjects, getHabits, getReminders } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const events = getEvents();
  const projects = getProjects();
  const habits = getHabits();
  const reminders = getReminders();

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((e) => e.date >= today).slice(0, 5);
  const pendingReminders = reminders.filter((r) => r.status === "pending").slice(0, 5);
  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <>
      <h2>Overview</h2>
      <p className="subtitle">{today}</p>

      <div className="kpi-grid">
        <div className="kpi"><div className="label">Upcoming events</div><div className="value">{upcomingEvents.length}</div></div>
        <div className="kpi"><div className="label">Pending reminders</div><div className="value">{pendingReminders.length}</div></div>
        <div className="kpi"><div className="label">Active projects</div><div className="value">{activeProjects.length}</div></div>
        <div className="kpi"><div className="label">Habits tracked</div><div className="value">{habits.length}</div></div>
      </div>

      <div className="section-divider">Next up</div>
      {upcomingEvents.length === 0 ? (
        <div className="empty">No upcoming events.</div>
      ) : (
        upcomingEvents.map((e) => (
          <div className="card" key={e.slug}>
            <h3>{e.title}</h3>
            <div className="meta">{e.date} {e.time}{e.location ? ` · ${e.location}` : ""}</div>
          </div>
        ))
      )}

      <div className="section-divider">Active projects</div>
      {activeProjects.length === 0 ? (
        <div className="empty">No active projects.</div>
      ) : (
        activeProjects.map((p) => (
          <div className="card" key={p.slug}>
            <h3>{p.title}</h3>
            <div className="meta">
              {p.deadline ? `due ${p.deadline} · ` : ""}
              {(p.tasks ?? []).filter((t) => !t.done).length} open tasks
            </div>
          </div>
        ))
      )}
    </>
  );
}
