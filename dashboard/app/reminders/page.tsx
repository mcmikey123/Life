import Link from "next/link";
import { getReminders, getEvents, getProjects } from "@/lib/vault";
import { eventUtcToLocal, fireAtUtcToLocal } from "@/lib/tz";
import NewItemForm from "../_components/NewItemForm";

export const revalidate = 30;

type FlatReminder = {
  source: string;
  title: string;
  fire_at: string;
  channels: string[];
  status: string;
  href?: string;
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
      fire_at: fireAtUtcToLocal(r.fire_at).replace("T", " "),
      channels: r.channels || [],
      status: r.status,
      href: `/reminders/${r.slug}`,
    });
  }

  for (const e of events) {
    const local = eventUtcToLocal(e.date, e.time);
    for (const r of e.reminders || []) {
      flat.push({
        source: `event/${e.slug}`,
        title: `${e.title} (${r.offset || "@start"} before)`,
        fire_at: `${local.date} ${local.time || ""}`.trim(),
        channels: r.channels || [],
        status: "scheduled",
        href: `/events/${e.slug}`,
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
          href: `/projects/${p.slug}`,
        });
      }
    }
  }

  flat.sort((a, b) => a.fire_at.localeCompare(b.fire_at));

  return (
    <>
      <h2>Reminders</h2>
      <p className="subtitle">All scheduled pings · {flat.length} total · tap a row to open the source</p>

      <NewItemForm kind="reminder" />

      {flat.length === 0 ? (
        <div className="empty">No reminders scheduled</div>
      ) : (
        <>
          <div className="section-title">Queue</div>
          {flat.map((r, i) => {
            const row = (
              <div className="reminder-row">
                <div className="reminder-fire">{r.fire_at || "—"}</div>
                <div>
                  <div className="reminder-title">{r.title}</div>
                  <div className="skill-meta" style={{ marginTop: 4 }}>{r.source}</div>
                </div>
                <div>
                  {r.channels.map((c) => <span key={c} className="tag">{c}</span>)}
                </div>
                <div>
                  <span className={`badge ${r.status === "done" ? "good" : r.status === "pending" ? "warn" : ""}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            );
            return r.href ? (
              <Link href={r.href} key={i} className="card-link">{row}</Link>
            ) : (
              <div key={i}>{row}</div>
            );
          })}
        </>
      )}
    </>
  );
}
