export default function XpBar({
  level,
  current,
  max,
}: {
  level: number;
  current: number;
  max: number;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="xp-bar" role="progressbar" aria-valuenow={current} aria-valuemax={max}>
      <span className="xp-label">◇ Level {level}</span>
      <div className="xp-progress">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="xp-text">
        {current.toLocaleString()} / {max.toLocaleString()} XP
      </span>
    </div>
  );
}
