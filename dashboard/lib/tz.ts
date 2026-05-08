// Timezone boundary helpers.
// Storage convention: vault frontmatter holds UTC strings (date/time/fire_at).
// User-facing surfaces (forms, display) show Europe/London. These helpers
// convert between the two without pulling in a library.

export const LOCAL_TZ = "Europe/London";

function tzParts(d: Date, tz: string): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
}

function offsetMs(d: Date, tz: string): number {
  const p = tzParts(d, tz);
  const hh = p.hour === "24" ? 0 : Number(p.hour);
  const utcOfLocal = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hh,
    Number(p.minute),
    Number(p.second),
  );
  return utcOfLocal - d.getTime();
}

function localToUtcDate(localStr: string, tz: string): Date {
  const padded = localStr.length === 16 ? `${localStr}:00` : localStr;
  const naiveAsUtc = new Date(`${padded}Z`);
  const off = offsetMs(naiveAsUtc, tz);
  let real = new Date(naiveAsUtc.getTime() - off);
  const off2 = offsetMs(real, tz);
  if (off2 !== off) real = new Date(naiveAsUtc.getTime() - off2);
  return real;
}

function utcDateToLocalStr(d: Date, tz: string): string {
  const p = tzParts(d, tz);
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hh}:${p.minute}:${p.second}`;
}

export function eventLocalToUtc(date: string, time: string): { date: string; time: string } {
  if (!date) return { date, time };
  const t = time || "00:00";
  const utc = localToUtcDate(`${date}T${t}`, LOCAL_TZ);
  const iso = utc.toISOString().slice(0, 16);
  const [d, ts] = iso.split("T");
  return { date: d, time: ts };
}

export function eventUtcToLocal(date: string, time?: string): { date: string; time: string } {
  if (!date) return { date: date || "", time: time || "" };
  const t = time || "00:00";
  const utcD = new Date(`${date}T${t}:00Z`);
  const local = utcDateToLocalStr(utcD, LOCAL_TZ);
  const [d, ts] = local.split("T");
  return { date: d, time: ts.slice(0, 5) };
}

export function fireAtLocalToUtc(localStr: string): string {
  if (!localStr) return "";
  const utc = localToUtcDate(localStr, LOCAL_TZ);
  return utc.toISOString().slice(0, 19);
}

export function fireAtUtcToLocal(utcStr: string): string {
  if (!utcStr) return "";
  const padded = utcStr.length === 16 ? `${utcStr}:00` : utcStr;
  const withZ = padded.endsWith("Z") ? padded : `${padded}Z`;
  const utcD = new Date(withZ);
  return utcDateToLocalStr(utcD, LOCAL_TZ).slice(0, 16);
}
