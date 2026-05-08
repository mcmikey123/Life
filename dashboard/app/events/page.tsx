import Link from "next/link";
import { getEvents } from "@/lib/vault";
import { todayLocal } from "@/lib/tz";
import NewItemForm from "../_components/NewItemForm";

export const revalidate = 30;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function EventsPage() {
  const events = getEvents();
  const today = todayLocal();
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);

  return (
    <>
      <h2>Events</h2>
      <p className="subtitle">Upcoming engagements · {upcoming.length} scheduled · tap any to edit</p>

      <NewItemForm kind="event" />

      <div className="section-title">Upcoming</div>

      {upcoming.length === 0 ? (
        <div className="empty">No upcoming events</div>
      ) : (
        <div className="skill-grid">
          {upcoming.slice(0, 12).map((e) => {
            const days = daysUntil(e.date);
            const tone = days <= 0 ? "active" : days <= 3 ? "warn" : "";
            const [_, month, day] = e.date.split("-");
            const monthLabel = MONTHS[parseInt(month, 10) - 1] || "";
            return (
              <Link href={`/events/${e.slug}`} key={e.slug} className="card-link">
                <div className="skill-card">
                  <div className={`skill-level-badge ${tone}`}>
                    <div style={{ textAlign: "center" }}>
                      <div className="skill-level-number">{parseInt(day, 10)}</div>
                      <div className="skill-level-sub">{monthLabel}</div>
                    </div>
                  </div>
                  <div>
                    <div className="skill-name">{e.title}</div>
                    <div className="skill-meta" style={{ marginTop: 6 }}>
                      {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days}d`}
                      {e.time ? ` · ${e.time}` : ""}
                    </div>
                    {e.location && <div className="skill-meta">{e.location}</div>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="section-title">Past</div>
          <div className="event-list">
            {past.slice(-8).reverse().map((e) => {
              const [_, month, day] = e.date.split("-");
              const monthLabel = MONTHS[parseInt(month, 10) - 1] || "";
              return (
                <Link href={`/events/${e.slug}`} key={e.slug} className="card-link">
                  <div className="event-row">
                    <div className="event-date">
                      <span className="day">{parseInt(day, 10)}</span>
                      <span className="month">{monthLabel}</span>
                    </div>
                    <div>
                      <div className="event-title">{e.title}</div>
                      <div className="event-info">
                        {e.location || "—"}
                        {e.duration_minutes ? ` · ${e.duration_minutes} min` : ""}
                      </div>
                    </div>
                    <div className="event-time">{e.time || "—"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
