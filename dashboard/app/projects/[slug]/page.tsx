import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/lib/vault";
import {
  updateProjectMeta,
  addProjectCost,
  addProjectTask,
  toggleProjectTask,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function ProjectDetail({ params }: { params: { slug: string } }) {
  const p = getProject(params.slug);
  if (!p) notFound();

  const open = (p.tasks ?? []).filter((t) => !t.done);
  const done = (p.tasks ?? []).filter((t) => t.done);
  const actual = (p.costs ?? []).reduce((s, c) => s + (c.amount || 0), 0);
  const est = p.budget?.estimated ?? 0;

  const updateMeta = async (form: FormData) => {
    "use server";
    await updateProjectMeta(params.slug, form);
  };
  const addCost = async (form: FormData) => {
    "use server";
    await addProjectCost(params.slug, form);
  };
  const addTask = async (form: FormData) => {
    "use server";
    await addProjectTask(params.slug, form);
  };

  return (
    <>
      <p className="subtitle"><Link href="/projects">← projects</Link></p>
      <h2>{p.title}</h2>

      <div className="section-divider">Project</div>
      <form action={updateMeta} className="form-card">
        <label>Title<input name="title" defaultValue={p.title} /></label>
        <div className="form-row">
          <label>Status
            <select name="status" defaultValue={p.status}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="done">done</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label>Priority
            <select name="priority" defaultValue={p.priority || "medium"}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>Deadline<input name="deadline" type="date" defaultValue={p.deadline || ""} /></label>
        </div>
        <div className="form-row">
          <label>Currency<input name="currency" defaultValue={p.budget?.currency || "USD"} /></label>
          <label>Estimated budget<input name="estimated" type="number" step="0.01" defaultValue={est} /></label>
        </div>
        <div className="form-actions">
          <span className="meta">Actual spend: <strong>${actual.toFixed(2)}</strong> of ${est.toFixed(2)}</span>
          <button type="submit">Save project</button>
        </div>
      </form>

      <div className="section-divider">Costs</div>
      <form action={addCost} className="form-card">
        <div className="form-row">
          <label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></label>
          <label>Description<input name="description" placeholder="e.g. lumber" required /></label>
          <label>Amount<input name="amount" type="number" step="0.01" placeholder="0.00" required /></label>
        </div>
        <div className="form-actions">
          <button type="submit">+ Add cost</button>
        </div>
      </form>
      {(p.costs ?? []).length > 0 && (
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            {(p.costs ?? []).slice().reverse().map((c, i) => (
              <tr key={i}>
                <td>{c.date}</td>
                <td>{c.description}</td>
                <td>{c.amount.toFixed(2)} {c.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-divider">Tasks</div>
      <form action={addTask} className="form-card">
        <label>Title<input name="title" placeholder="e.g. Get permit" required /></label>
        <div className="form-row">
          <label>Deadline<input name="deadline" type="date" /></label>
          <label>Reminder offset
            <select name="reminder_offset" defaultValue="1d">
              <option value="">none</option>
              <option value="1h">1h before</option>
              <option value="1d">1 day before</option>
              <option value="3d">3 days before</option>
              <option value="1w">1 week before</option>
            </select>
          </label>
          <label>Channels<input name="reminder_channels" defaultValue="ntfy" placeholder="ntfy,discord" /></label>
        </div>
        <div className="form-actions">
          <button type="submit">+ Add task</button>
        </div>
      </form>

      {open.length > 0 && (
        <>
          <div className="meta" style={{ marginTop: 12 }}>Open</div>
          {open.map((t) => {
            const toggle = async () => {
              "use server";
              await toggleProjectTask(params.slug, t.id);
            };
            return (
              <form action={toggle} key={t.id} className="task-row">
                <button type="submit" className="task-check" aria-label="mark done">☐</button>
                <span className="task-title">{t.title}</span>
                {t.deadline && <span className="deadline">due {t.deadline}</span>}
                {t.reminders?.[0] && (
                  <span className="tag">⏰ {t.reminders[0].offset} {t.reminders[0].channels.join("/")}</span>
                )}
              </form>
            );
          })}
        </>
      )}
      {done.length > 0 && (
        <>
          <div className="meta" style={{ marginTop: 12 }}>Done</div>
          {done.map((t) => {
            const toggle = async () => {
              "use server";
              await toggleProjectTask(params.slug, t.id);
            };
            return (
              <form action={toggle} key={t.id} className="task-row done">
                <button type="submit" className="task-check" aria-label="mark open">☑</button>
                <span className="task-title">{t.title}</span>
              </form>
            );
          })}
        </>
      )}
    </>
  );
}
