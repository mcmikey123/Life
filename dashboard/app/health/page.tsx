import { getHabits, getHealthMetrics } from "@/lib/vault";
import { adjustHealthMetric } from "@/lib/actions";
import Stepper from "@/components/Stepper";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  const linkedHabits = getHabits().filter((h) => h.linked_health_metric);
  const metrics = getHealthMetrics();

  return (
    <>
      <h2>Health</h2>
      <p className="subtitle">Daily metrics. Use the arrows to adjust each value — every change writes back to <code>vault/health/metrics.md</code>.</p>

      <div className="section-divider">Vitals</div>
      {metrics.length === 0 ? (
        <div className="empty">
          No metrics yet. Create <code>vault/health/metrics.md</code> with a `metrics` list.
        </div>
      ) : (
        <div className="metrics-list">
          {metrics.map((m) => {
            const adjust = async (delta: number) => {
              "use server";
              await adjustHealthMetric(m.key, delta);
            };
            return (
              <div className="metric-row" key={m.key}>
                <div className="metric-label">{m.label}</div>
                <Stepper value={m.value} step={m.step} unit={m.unit} onAdjust={adjust} />
              </div>
            );
          })}
        </div>
      )}

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
          <li>Daily metrics history (charts in <code>vault/health/log/&lt;date&gt;.md</code>)</li>
          <li>Symptom / illness journal</li>
          <li>Doctor visit notes (already supported via Events)</li>
          <li>Medications + refill reminders</li>
        </ul>
      </div>
    </>
  );
}
