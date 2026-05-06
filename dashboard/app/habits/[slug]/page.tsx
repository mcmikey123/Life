import { notFound } from "next/navigation";
import Link from "next/link";
import { getHabit, getHabitLog } from "@/lib/vault";
import { updateHabit } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function HabitDetail({ params }: { params: { slug: string } }) {
  const h = getHabit(params.slug);
  if (!h) notFound();
  const log = getHabitLog(params.slug);

  const update = async (form: FormData) => {
    "use server";
    await updateHabit(params.slug, form);
  };

  return (
    <>
      <p className="subtitle"><Link href="/habits">← habits</Link></p>
      <h2>Edit habit</h2>

      <form action={update} className="form-card">
        <label>Title<input name="title" defaultValue={h.title} required /></label>
        <div className="form-row">
          <label>Cadence
            <select name="cadence" defaultValue={h.cadence}>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="custom">custom</option>
            </select>
          </label>
          <label>Time<input name="time" type="time" defaultValue={h.time || "08:00"} /></label>
          <label>Streak target<input name="streak_target" type="number" defaultValue={h.streak_target ?? 30} /></label>
        </div>
        <label>Days (comma-sep)<input name="days" defaultValue={(h.days || []).join(",")} placeholder="mon,tue,wed,..." /></label>
        <div className="form-row">
          <label>Linked health metric<input name="linked_health_metric" defaultValue={h.linked_health_metric || ""} placeholder="e.g. steps" /></label>
          <label>Reminder channels<input name="reminder_channels" defaultValue={(h.reminder?.channels || []).join(",")} placeholder="ntfy,discord" /></label>
        </div>
        <label className="checkbox">
          <input type="checkbox" name="reminder_enabled" defaultChecked={h.reminder?.enabled ?? true} />
          Reminders enabled
        </label>
        <label>Notes<textarea name="body" rows={4} defaultValue={h.body}></textarea></label>
        <div className="form-actions">
          <button type="submit">Save</button>
        </div>
      </form>

      <div className="section-divider">Adherence log</div>
      {log.length === 0 ? (
        <div className="empty">No log entries yet.</div>
      ) : (
        <table>
          <thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {log.slice().reverse().slice(0, 30).map((l, i) => (
              <tr key={i}>
                <td>{l.date}</td>
                <td><span className={`badge ${l.status === "done" ? "good" : "warn"}`}>{l.status}</span></td>
                <td>{l.note || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
