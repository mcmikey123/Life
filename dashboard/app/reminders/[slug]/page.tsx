import { notFound } from "next/navigation";
import Link from "next/link";
import { getReminder } from "@/lib/vault";
import { updateReminder } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function ReminderDetail({ params }: { params: { slug: string } }) {
  const r = getReminder(params.slug);
  if (!r) notFound();

  const update = async (form: FormData) => {
    "use server";
    await updateReminder(params.slug, form);
  };

  // ISO 8601 → datetime-local input value
  const dt = r.fire_at?.length >= 16 ? r.fire_at.slice(0, 16) : r.fire_at || "";

  return (
    <>
      <p className="subtitle"><Link href="/reminders">← reminders</Link></p>
      <h2>Edit reminder</h2>

      <form action={update} className="form-card">
        <label>Title<input name="title" defaultValue={r.title} required /></label>
        <div className="form-row">
          <label>Fire at<input name="fire_at" type="datetime-local" defaultValue={dt} /></label>
          <label>Recurrence<input name="recurrence" defaultValue={r.recurrence || ""} placeholder="daily, weekly, etc." /></label>
        </div>
        <div className="form-row">
          <label>Status
            <select name="status" defaultValue={r.status}>
              <option value="pending">pending</option>
              <option value="sent">sent</option>
              <option value="acknowledged">acknowledged</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label>Channels<input name="channels" defaultValue={(r.channels || []).join(",")} placeholder="ntfy,discord" /></label>
        </div>
        <label>Notes<textarea name="body" rows={4} defaultValue={r.body}></textarea></label>
        <div className="form-actions">
          <button type="submit">Save</button>
        </div>
      </form>
    </>
  );
}
