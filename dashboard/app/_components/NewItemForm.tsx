"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Kind = "event" | "reminder" | "project" | "habit";

const LABELS: Record<Kind, string> = {
  event: "Event",
  reminder: "Reminder",
  project: "Project",
  habit: "Habit",
};

export default function NewItemForm({ kind }: { kind: Kind }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  function set(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({});
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="new-btn" onClick={() => setOpen(true)}>
        + New {LABELS[kind]}
      </button>
    );
  }

  return (
    <form className="new-form" onSubmit={submit}>
      <div className="new-form-header">
        <strong>New {LABELS[kind]}</strong>
        <button type="button" className="link-btn" onClick={() => { setOpen(false); setError(null); }}>
          cancel
        </button>
      </div>

      <label>
        Title
        <input
          required
          autoFocus
          value={form.title || ""}
          onChange={(e) => set("title", e.target.value)}
        />
      </label>

      {kind === "event" && (
        <>
          <div className="row">
            <label>
              Date
              <input
                required
                type="date"
                value={form.date || ""}
                onChange={(e) => set("date", e.target.value)}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={form.time || "09:00"}
                onChange={(e) => set("time", e.target.value)}
              />
            </label>
            <label>
              Duration (min)
              <input
                type="number"
                min={5}
                value={form.duration_minutes || "60"}
                onChange={(e) => set("duration_minutes", e.target.value)}
              />
            </label>
          </div>
          <label>
            Location
            <input value={form.location || ""} onChange={(e) => set("location", e.target.value)} />
          </label>
          <label>
            Tags (comma-separated)
            <input value={form.tags || ""} onChange={(e) => set("tags", e.target.value)} />
          </label>
        </>
      )}

      {kind === "reminder" && (
        <>
          <label>
            Fire at (ISO, e.g. 2026-05-05T20:00)
            <input
              required
              type="datetime-local"
              value={form.fire_at || ""}
              onChange={(e) => set("fire_at", e.target.value)}
            />
          </label>
          <div className="row">
            <label>
              Recurrence
              <select value={form.recurrence || ""} onChange={(e) => set("recurrence", e.target.value)}>
                <option value="">(none)</option>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
              </select>
            </label>
            <label>
              Channels (comma-separated)
              <input
                value={form.channels || "ntfy,discord"}
                onChange={(e) => set("channels", e.target.value)}
              />
            </label>
          </div>
        </>
      )}

      {kind === "project" && (
        <>
          <div className="row">
            <label>
              Priority
              <select value={form.priority || "medium"} onChange={(e) => set("priority", e.target.value)}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
            <label>
              Deadline
              <input
                type="date"
                value={form.deadline || ""}
                onChange={(e) => set("deadline", e.target.value)}
              />
            </label>
            <label>
              Budget
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.budget || ""}
                onChange={(e) => set("budget", e.target.value)}
              />
            </label>
            <label>
              Currency
              <input
                value={form.currency || "USD"}
                onChange={(e) => set("currency", e.target.value)}
              />
            </label>
          </div>
          <label>
            Tags (comma-separated)
            <input value={form.tags || ""} onChange={(e) => set("tags", e.target.value)} />
          </label>
        </>
      )}

      {kind === "habit" && (
        <>
          <div className="row">
            <label>
              Cadence
              <select value={form.cadence || "daily"} onChange={(e) => set("cadence", e.target.value)}>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="custom">custom</option>
              </select>
            </label>
            <label>
              Time
              <input
                type="time"
                value={form.time || "08:00"}
                onChange={(e) => set("time", e.target.value)}
              />
            </label>
            <label>
              Streak target
              <input
                type="number"
                min={1}
                value={form.streak_target || "30"}
                onChange={(e) => set("streak_target", e.target.value)}
              />
            </label>
          </div>
          <div className="row">
            <label>
              Days (comma-separated)
              <input
                value={form.days || "mon,tue,wed,thu,fri,sat,sun"}
                onChange={(e) => set("days", e.target.value)}
              />
            </label>
            <label>
              Channels
              <input
                value={form.channels || "ntfy"}
                onChange={(e) => set("channels", e.target.value)}
              />
            </label>
          </div>
          <label>
            Linked health metric
            <input
              value={form.linked_health_metric || ""}
              onChange={(e) => set("linked_health_metric", e.target.value)}
              placeholder="e.g. weight, steps"
            />
          </label>
        </>
      )}

      {error && <div className="form-error">{error}</div>}

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : `Create ${LABELS[kind]}`}
        </button>
      </div>
    </form>
  );
}
