import { getReminders, getEvents, getProjects } from "@/lib/vault";

export const dynamic = "force-dynamic";

type FlatReminder = {
  source: string;
  title: string;
  fire_at: string;
  channels: string[];
  status: string;
};

export default function RemindersPage() {
  const standalone = getReminders();
  const events = getEvents();
  const projects = getProjects();

  const flat: FlatReminder[] = [];

  for (const r of standalone) {
    flat.push({
      source: `reminder/${r.slug}`,
      title: r.title,
      fire_at: r.fire_at,
      channels: r.channels || [],
      status: r.status,
    });
  }

  for (const e of events) {
    for (const r of e.reminders || []) {
      flat.push({
        source: `event/${e.slug}`,
        title: `${e.title} (${r.offset || "@start"} before)`,
        fire_at: `${e.date} ${e.time || ""}`.trim(),
        channels: r.channels || [],
        status: "scheduled",
      });
    }
  }

  for (const p of projects) {
    for (const t of p.tasks || []) {
      for (const r of t.reminders || []) {
        flat.push({
          source: `project/${p.slug}/${t.id}`,
          title: `${p.title}: ${t.title} (${r.offset || "@deadline"} before)`,
          fire_at: t.deadline || "",
          channels: r.channels || [],
          status: t.done ? "done" : "scheduled",
        });
      }
    }
  }

  flat.sort((a, b) => a.fire_at.localeCompare(b.fire_at));

  return (
    <>
      <h2>Reminders</h2>
      <p className="subtitle">All scheduled pings — standalone, plus rolled up from events and project tasks.</p>

      {flat.length === 0 ? (
        <div className="empty">No reminders scheduled.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fire at</th>
              <th>Title</th>
              <th>Channels</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {flat.map((r, i) => (
              <tr key={i}>
                <td>{r.fire_at || "—"}</td>
                <td>{r.title}</td>
                <td>{r.channels.map((c) => <span key={c} className="tag">{c}</span>)}</td>
                <td>
                  <span className={`badge ${r.status === "done" ? "good" : r.status === "pending" ? "warn" : ""}`}>
                    {r.status}
                  </span>
                </td>
                <td><span className="meta">{r.source}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
