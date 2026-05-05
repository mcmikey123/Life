import { getHabits } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  const linkedHabits = getHabits().filter((h) => h.linked_health_metric);

  return (
    <>
      <h2>Health</h2>
      <p className="subtitle">Phase 2 · Will track metrics; right now shows habits already wired to health metrics.</p>

      <div className="section-divider">Linked habits</div>
      {linkedHabits.length === 0 ? (
        <div className="empty">No habits linked to a health metric yet.</div>
      ) : (
        linkedHabits.map((h) => (
          <div className="card" key={h.slug}>
            <h3>{h.title}</h3>
            <div className="meta">→ <span className="tag">{h.linked_health_metric}</span></div>
          </div>
        ))
      )}

      <div className="section-divider">Roadmap</div>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Daily metrics (weight, sleep, steps, mood) in <code>vault/health/log/&lt;date&gt;.md</code></li>
          <li>Symptom / illness journal</li>
          <li>Doctor visit notes (already supported via Events)</li>
          <li>Medications + refill reminders (will use the reminders system)</li>
        </ul>
      </div>
    </>
  );
}
