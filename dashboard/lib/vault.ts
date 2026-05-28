import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const VAULT = path.resolve(process.cwd(), process.env.VAULT_PATH || "../vault");

export type Reminder = {
  offset?: string;
  fire_at?: string;
  channels: string[];
};

export type Task = {
  id: string;
  title: string;
  deadline?: string;
  done: boolean;
  reminders?: Reminder[];
};

export type Cost = {
  date: string;
  description: string;
  amount: number;
  currency: string;
};

export type EventItem = {
  slug: string;
  type: "event";
  title: string;
  date: string;
  time?: string;
  duration_minutes?: number;
  location?: string;
  tags?: string[];
  reminders?: Reminder[];
  body: string;
};

export type ProjectItem = {
  slug: string;
  type: "project";
  title: string;
  status: string;
  priority?: string;
  deadline?: string;
  tags?: string[];
  budget?: { currency: string; estimated: number; actual: number };
  costs?: Cost[];
  tasks?: Task[];
  body: string;
};

export type DailyItem = {
  slug: string;
  type: "daily";
  title: string;
  cadence: "daily" | "weekly" | "custom" | "once";
  /** Required when cadence === "once". YYYY-MM-DD, Europe/London. */
  date?: string;
  days: string[];
  time?: string;
  reminder?: { channels: string[]; enabled: boolean };
  linked_health_metric?: string;
  streak_target?: number;
  tags?: string[];
  body: string;
};

export type QuestItem = {
  slug: string;
  type: "quest";
  title: string;
  status: string;
  horizon?: string;
  deadline?: string;
  progress?: number;
  linked_projects?: string[];
  tags?: string[];
  body: string;
};

export type ReminderItem = {
  slug: string;
  type: "reminder";
  title: string;
  fire_at: string;
  recurrence?: string;
  channels: string[];
  status: string;
  linked_to?: string;
  body: string;
};

function readFolder(folder: string) {
  const dir = path.join(VAULT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.endsWith(".log.md"))
    .map((f) => {
      const full = path.join(dir, f);
      const raw = fs.readFileSync(full, "utf8");
      const { data, content } = matter(raw);
      return { slug: f.replace(/\.md$/, ""), data, body: content };
    });
}

export function getEvents(): EventItem[] {
  return readFolder("events")
    .map((e) => ({ slug: e.slug, body: e.body, ...(e.data as any) }) as EventItem)
    .filter((e) => e.type === "event")
    .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
}

export function getProjects(): ProjectItem[] {
  return readFolder("projects")
    .map((p) => ({ slug: p.slug, body: p.body, ...(p.data as any) }) as ProjectItem)
    .filter((p) => p.type === "project");
}

export function getDailies(): DailyItem[] {
  return readFolder("dailies")
    .map((d) => ({ slug: d.slug, body: d.body, ...(d.data as any) }) as DailyItem)
    .filter((d) => d.type === "daily");
}

export function getQuests(): QuestItem[] {
  return readFolder("quests")
    .map((q) => ({ slug: q.slug, body: q.body, ...(q.data as any) }) as QuestItem)
    .filter((q) => q.type === "quest");
}

export function getQuest(slug: string): QuestItem | null {
  return getQuests().find((q) => q.slug === slug) ?? null;
}

export function getReminders(): ReminderItem[] {
  return readFolder("reminders")
    .map((r) => ({ slug: r.slug, body: r.body, ...(r.data as any) }) as ReminderItem)
    .filter((r) => r.type === "reminder")
    .sort((a, b) => (a.fire_at || "").localeCompare(b.fire_at || ""));
}

export function getDailyLog(slug: string): { date: string; status: string; note?: string }[] {
  const file = path.join(VAULT, "dailies", `${slug}.log.md`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw
    .split("\n")
    .filter((l) => l.startsWith("|") && !l.includes("---") && !l.includes("date"));
  return lines.map((l) => {
    const cells = l.split("|").map((c) => c.trim()).filter(Boolean);
    return { date: cells[0], status: cells[1], note: cells[2] };
  });
}

export function aggregateProjectCosts() {
  const projects = getProjects();
  return projects.map((p) => ({
    project: p.title,
    slug: p.slug,
    estimated: p.budget?.estimated ?? 0,
    actual: (p.costs ?? []).reduce((s, c) => s + (c.amount || 0), 0),
    currency: p.budget?.currency ?? "USD",
  }));
}

// ---- by-slug getters ----

export function getEvent(slug: string): EventItem | null {
  return getEvents().find((e) => e.slug === slug) ?? null;
}
export function getProject(slug: string): ProjectItem | null {
  return getProjects().find((p) => p.slug === slug) ?? null;
}
export function getDaily(slug: string): DailyItem | null {
  return getDailies().find((d) => d.slug === slug) ?? null;
}
export function getReminder(slug: string): ReminderItem | null {
  return getReminders().find((r) => r.slug === slug) ?? null;
}

// ---- health metrics ----

export type HealthMetric = {
  key: string;
  label: string;
  value: number;
  unit: string;
  step: number;
  min?: number;
  max?: number;
};

export function getHealthMetrics(): HealthMetric[] {
  const file = path.join(VAULT, "health", "metrics.md");
  if (!fs.existsSync(file)) return [];
  const { data } = matter(fs.readFileSync(file, "utf8"));
  return (data.metrics as HealthMetric[]) ?? [];
}

// ---- nutrition (diet phase + calorie/macro targets) ----

export type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type Nutrition = {
  phase: string;
  phases: Record<string, NutritionTargets>;
  /** Resolved target for the active phase (falls back to the first phase). */
  target: NutritionTargets;
};

export function getNutrition(): Nutrition | null {
  const file = path.join(VAULT, "health", "nutrition.md");
  if (!fs.existsSync(file)) return null;
  const { data } = matter(fs.readFileSync(file, "utf8"));
  const phases = (data.phases as Record<string, NutritionTargets>) ?? {};
  const phase = (data.phase as string) || Object.keys(phases)[0] || "";
  const target = phases[phase] ?? Object.values(phases)[0];
  if (!target) return null;
  return { phase, phases, target };
}

// ---- morning report config ----

export type MorningReportConfig = {
  enabled: boolean;
  time: string;
  channels: string[];
  greeting: string;
};

export function getMorningReport(): MorningReportConfig {
  const file = path.join(VAULT, "morning-report.md");
  const fallback: MorningReportConfig = {
    enabled: true,
    time: "07:00",
    channels: ["ntfy"],
    greeting: "Good morning.",
  };
  if (!fs.existsSync(file)) return fallback;
  const { data } = matter(fs.readFileSync(file, "utf8"));
  return {
    enabled: data.enabled ?? fallback.enabled,
    time: data.time ?? fallback.time,
    channels: (data.channels as string[]) ?? fallback.channels,
    greeting: data.greeting ?? fallback.greeting,
  };
}

// ---- dashboard config (music tracks etc) ----

export type DashboardConfig = {
  music?: { tracks?: { title?: string; src: string }[] };
};

export function getConfig(): DashboardConfig {
  const file = path.join(VAULT, "config.md");
  if (!fs.existsSync(file)) return {};
  const { data } = matter(fs.readFileSync(file, "utf8"));
  return data as DashboardConfig;
}

// ---- calendar feed: events + project task deadlines, chronologically ----

export type CalendarItem = {
  date: string;          // YYYY-MM-DD
  time?: string;         // HH:MM
  title: string;
  kind: "event" | "task" | "reminder";
  href: string;
  detail?: string;
};

export function getCalendar(): CalendarItem[] {
  const out: CalendarItem[] = [];

  for (const e of getEvents()) {
    out.push({
      date: e.date,
      time: e.time,
      title: e.title,
      kind: "event",
      href: `/events/${e.slug}`,
      detail: e.location || undefined,
    });
  }

  for (const p of getProjects()) {
    for (const t of p.tasks ?? []) {
      if (!t.deadline || t.done) continue;
      out.push({
        date: t.deadline,
        title: `${p.title}: ${t.title}`,
        kind: "task",
        href: `/projects/${p.slug}`,
      });
    }
  }

  for (const r of getReminders()) {
    if (r.status !== "pending" || !r.fire_at) continue;
    const [d, t] = r.fire_at.split("T");
    out.push({
      date: d,
      time: t?.slice(0, 5),
      title: r.title,
      kind: "reminder",
      href: `/reminders/${r.slug}`,
    });
  }

  return out.sort((a, b) =>
    (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))
  );
}
