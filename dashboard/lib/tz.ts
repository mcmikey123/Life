// Storage convention: every wall-clock field in the vault (event date+time,
// reminder fire_at, daily time, daily date for one-offs, project task
// deadline) is Europe/London local.
// The dashboard never converts when reading or writing — this helper exists
// only to compute the *current* London date for time-window filters where the
// host clock might differ (e.g. Vercel functions run in UTC).

export const LOCAL_TZ = "Europe/London";

export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LOCAL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
