"use client";

import { useEffect, useRef, useState } from "react";

type Entry = { sha: string; date: string; message: string };

// Color-codes log entry by which kind of action committed it.
function classify(message: string): string {
  if (/^update event|delete event|^add event/i.test(message)) return "event";
  if (/^update reminder/i.test(message)) return "reminder";
  if (/^update habit|^log /i.test(message)) return "habit";
  if (/^update project|^add cost|^add task|^toggle task/i.test(message)) return "project";
  if (/^adjust |^set /i.test(message)) return "health";
  return "other";
}

const KIND_USER: Record<string, string> = {
  event: "Calendar",
  reminder: "Bellman",
  habit: "Streakmonk",
  project: "Foreman",
  health: "Vitals",
  other: "Vault",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Feed() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [latest, setLatest] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/feed", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { entries: Entry[] };
        if (cancelled) return;
        setEntries((prev) => {
          const newest = data.entries[0]?.sha;
          if (newest && latest && newest !== latest) {
            setFlash(true);
            if (flashTimer.current) clearTimeout(flashTimer.current);
            flashTimer.current = setTimeout(() => setFlash(false), 1500);
          }
          if (newest) setLatest(newest);
          return data.entries;
        });
        setLoaded(true);
      } catch {
        /* network blip */
      }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [latest]);

  return (
    <aside className={`feed ${open ? "open" : "closed"} ${flash ? "flash" : ""}`}>
      <button className="feed-header" onClick={() => setOpen((o) => !o)}>
        <span className="feed-title">CHAT</span>
        <span className="feed-count">{entries.length > 0 && open ? `${entries.length}` : ""}</span>
        <span className="feed-toggle">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="feed-body">
          {!loaded ? (
            <div className="feed-empty">…</div>
          ) : entries.length === 0 ? (
            <div className="feed-empty">No vault commits yet.</div>
          ) : (
            entries.map((e) => {
              const kind = classify(e.message);
              const user = KIND_USER[kind] ?? "Vault";
              return (
                <div key={e.sha} className={`feed-row kind-${kind}`} title={`${e.sha} · ${e.date}`}>
                  <div className="chat-msg">{e.message}</div>
                  <div className="chat-meta">
                    <span className="chat-dot" aria-hidden />
                    <span className="chat-user">{user}</span>
                    <span className="chat-channel">@&nbsp;GLOBAL</span>
                    <span className="chat-time">{formatTime(e.date)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}
