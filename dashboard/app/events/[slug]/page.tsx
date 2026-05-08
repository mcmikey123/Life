import { notFound } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEvent } from "@/lib/vault";
import { updateEvent, deleteEvent } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function EventDetail({ params }: { params: { slug: string } }) {
  const e = getEvent(params.slug);
  if (!e) notFound();

  const update = async (form: FormData) => {
    "use server";
    await updateEvent(params.slug, form);
  };
  const remove = async () => {
    "use server";
    await deleteEvent(params.slug);
    redirect("/events");
  };

  return (
    <>
      <p className="subtitle"><Link href="/events">← events</Link></p>
      <h2>Edit event</h2>

      <form action={update} className="form-card">
        <label>Title<input name="title" defaultValue={e.title} required /></label>
        <div className="form-row">
          <label>Date<input name="date" type="date" defaultValue={e.date} required /></label>
          <label>Time<input name="time" type="time" defaultValue={e.time || ""} /></label>
          <label>Duration (min)<input name="duration_minutes" type="number" defaultValue={e.duration_minutes || 60} /></label>
        </div>
        <label>Location<input name="location" defaultValue={e.location || ""} /></label>
        <label>Notes<textarea name="body" rows={6} defaultValue={e.body}></textarea></label>
        <div className="form-actions">
          <button type="submit">Save</button>
          <span className="meta">{(e.reminders ?? []).length} reminder(s) attached</span>
        </div>
      </form>

      <form action={remove} className="form-card" style={{ marginTop: 12 }}>
        <div className="form-actions">
          <button type="submit" className="danger">Delete event</button>
        </div>
      </form>
    </>
  );
}
