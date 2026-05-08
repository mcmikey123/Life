import { getHealthMetrics } from "@/lib/vault";
import { adjustHealthMetric } from "@/lib/actions";
import Stepper from "@/components/Stepper";

export const revalidate = 30;

const TARGET = {
  calories: 2400,
  protein: 180,
  carbs: 260,
  fats: 80,
  steps: 10000,
};

const TODAY_INTAKE = {
  calories: 1850,
  protein: 142,
  carbs: 198,
  fats: 64,
  steps: 7420,
};

const WEIGHT = {
  current: 82.4,
  unit: "kg",
  delta: -1.2,
  goal: 78,
};

function pct(value: number, target: number) {
  return Math.min(100, Math.round((value / target) * 100));
}

export default function HealthPage() {
  const remainingCalories = TARGET.calories - TODAY_INTAKE.calories;
  const metrics = getHealthMetrics();

  return (
    <>
      <h2>Health</h2>
      <p className="subtitle">Vitals · macros · daily targets · use the steppers to log live values</p>

      {metrics.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}>Live metrics</div>
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
        </>
      )}

      <div className="health-layout">
        {/* LEFT — weight */}
        <div className="health-sidebar">
          <div className="section-title" style={{ marginTop: 0 }}>Weight</div>

          <div className="points-badge">
            <div className="points-number">{WEIGHT.current}</div>
            <div className="points-unit">{WEIGHT.unit}</div>
          </div>

          <div className="points-trend">
            <strong>{WEIGHT.delta > 0 ? "+" : ""}{WEIGHT.delta} {WEIGHT.unit}</strong> · last 30d
          </div>

          <div className="vitals-row"><span>Goal</span><strong>{WEIGHT.goal} {WEIGHT.unit}</strong></div>
          <div className="vitals-row"><span>Lean mass</span><strong>62.1 kg</strong></div>
          <div className="vitals-row"><span>Body fat</span><strong>18.2%</strong></div>
          <div className="vitals-row"><span>Resting HR</span><strong>58 bpm</strong></div>
          <div className="vitals-row"><span>Sleep</span><strong>7h 12m</strong></div>
        </div>

        {/* CENTER — macros + steps */}
        <div className="health-center">
          <div className="section-title" style={{ marginTop: 0 }}>Today</div>

          <div className="stat-row-health">
            <div className="stat-number">{TODAY_INTAKE.calories.toLocaleString()}</div>
            <div className="stat-content">
              <div className="stat-name">Calories</div>
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${pct(TODAY_INTAKE.calories, TARGET.calories)}%` }} />
              </div>
              <div className="stat-target">of {TARGET.calories.toLocaleString()} kcal</div>
            </div>
          </div>

          <div className="stat-row-health">
            <div className="stat-number">{TODAY_INTAKE.protein}g</div>
            <div className="stat-content">
              <div className="stat-name">Protein</div>
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${pct(TODAY_INTAKE.protein, TARGET.protein)}%` }} />
              </div>
              <div className="stat-target">of {TARGET.protein}g target</div>
            </div>
          </div>

          <div className="stat-row-health">
            <div className="stat-number">{TODAY_INTAKE.carbs}g</div>
            <div className="stat-content">
              <div className="stat-name">Carbs</div>
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${pct(TODAY_INTAKE.carbs, TARGET.carbs)}%` }} />
              </div>
              <div className="stat-target">of {TARGET.carbs}g target</div>
            </div>
          </div>

          <div className="stat-row-health">
            <div className="stat-number">{TODAY_INTAKE.fats}g</div>
            <div className="stat-content">
              <div className="stat-name">Fats</div>
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${pct(TODAY_INTAKE.fats, TARGET.fats)}%` }} />
              </div>
              <div className="stat-target">of {TARGET.fats}g target</div>
            </div>
          </div>

          <div className="stat-row-health">
            <div className="stat-number">{(TODAY_INTAKE.steps / 1000).toFixed(1)}k</div>
            <div className="stat-content">
              <div className="stat-name">Steps</div>
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${pct(TODAY_INTAKE.steps, TARGET.steps)}%` }} />
              </div>
              <div className="stat-target">of {TARGET.steps.toLocaleString()} step goal</div>
            </div>
          </div>
        </div>

        {/* RIGHT — calorie target */}
        <div className="health-right">
          <div className="damage-section">
            <div className="section-title" style={{ marginTop: 0 }}>Target</div>

            <div className="damage-row">
              <div className="damage-icon">◈</div>
              <div>
                <div className="damage-value">{TARGET.calories.toLocaleString()}</div>
                <div className="damage-label">Daily kcal</div>
              </div>
            </div>

            <div className="damage-row">
              <div className="damage-icon">↯</div>
              <div>
                <div className="damage-value">{remainingCalories.toLocaleString()}</div>
                <div className="damage-label">Remaining</div>
              </div>
            </div>
          </div>

          <div className="damage-section">
            <div className="section-title">Macros split</div>
            <div className="vitals-row"><span>Protein</span><strong>30%</strong></div>
            <div className="vitals-row"><span>Carbs</span><strong>43%</strong></div>
            <div className="vitals-row"><span>Fats</span><strong>27%</strong></div>
          </div>

          <div className="damage-section">
            <div className="section-title">Burn</div>
            <div style={{ fontSize: 11, color: "rgba(217,213,197,.55)", letterSpacing: ".12em", textTransform: "uppercase" }}>
              Active today
            </div>
            <div className="target-large">412</div>
            <div style={{ fontSize: 11, color: "rgba(217,213,197,.55)", letterSpacing: ".12em", textTransform: "uppercase", marginTop: 4 }}>
              kcal
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
