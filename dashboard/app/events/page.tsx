import Link from "next/link";
import { getEvents } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  const events = getEvents();
  const today = new Date().toISOString().slice(0, 10);

  const grouped = events.reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort();

  return (
    <>
      <h2>Events</h2>
      <p className="subtitle">Tap any event to edit it.</p>

      {dates.length === 0 && <div className="empty">No events yet. Add one with <code>python scripts/add.py event …</code> or via Claude voice.</div>}

      {dates.map((date) => {
        const isPast = date < today;
        return (
          <section key={date}>
            <div className="section-divider">
              {date}
              {date === today && " · today"}
              {isPast && " · past"}
            </div>
            {grouped[date].map((e) => (
              <Link href={`/events/${e.slug}`} key={e.slug} className="card-link">
                <div className="card">
                  <h3>{e.title}</h3>
                  <div className="meta">
                    {e.time}
                    {e.duration_minutes ? ` · ${e.duration_minutes} min` : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                  {e.tags?.length ? <div style={{ marginTop: 6 }}>{e.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div> : null}
                </div>
              </Link>
            ))}
          </section>
        );
      })}
    </>
  );
}
