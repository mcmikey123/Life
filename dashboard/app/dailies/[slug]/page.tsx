import { notFound } from "next/navigation";
import Link from "next/link";
import { getDaily, getDailyLog } from "@/lib/vault";
import { updateDaily } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function DailyDetail({ params }: { params: { slug: string } }) {
  const d = getDaily(params.slug);
  if (!d) notFound();
  const log = getDailyLog(params.slug);
  const isOnce = d.cadence === "once";

  const update = async (form: FormData) => {
    "use server";
    await updateDaily(params.slug, form);
  };

  return (
    <>
      <p className="subtitle"><Link href="/dailies">← dailies</Link></p>
      <h2>Edit daily</h2>

      <form action={update} className="form-card">
        <label>Title<input name="title" defaultValue={d.title} required /></label>
        <div className="form-row">
          <label>Cadence
            <select name="cadence" defaultValue={d.cadence}>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="custom">custom</option>
              <option value="once">once</option>
            </select>
          </label>
          <label>Time<input name="time" type="time" defaultValue={d.time || "08:00"} /></label>
          {!isOnce && (
            <label>Streak target<input name="streak_target" type="number" defaultValue={d.streak_target ?? 30} /></label>
          )}
        </div>
        {isOnce ? (
          <label>Date<input name="date" type="date" defaultValue={d.date || ""} required /></label>
        ) : (
          <label>Days (comma-sep)<input name="days" defaultValue={(d.days || []).join(",")} placeholder="mon,tue,wed,..." /></label>
        )}
        <div className="form-row">
          <label>Linked health metric<input name="linked_health_metric" defaultValue={d.linked_health_metric || ""} placeholder="e.g. steps" /></label>
          <label>Reminder channels<input name="reminder_channels" defaultValue={(d.reminder?.channels || []).join(",")} placeholder="ntfy,discord" /></label>
        </div>
        <label className="checkbox">
          <input type="checkbox" name="reminder_enabled" defaultChecked={d.reminder?.enabled ?? true} />
          Reminders enabled
        </label>
        <label>Notes<textarea name="body" rows={4} defaultValue={d.body}></textarea></label>
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
