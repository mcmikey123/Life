"use server";

import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { readVaultFile, writeVaultFile, vaultRoot } from "./writeVault";
import fs from "node:fs";
import path from "node:path";

function load(rel: string) {
  const raw = readVaultFile(rel);
  if (!raw) throw new Error(`Not found: ${rel}`);
  return matter(raw);
}

function save(rel: string, data: Record<string, unknown>, body: string, message: string) {
  const out = matter.stringify(body, data);
  return writeVaultFile(rel, out, message);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
}

// ---------- events ----------

export async function updateEvent(slug: string, form: FormData) {
  const rel = `events/${slug}.md`;
  const { data, content } = load(rel);
  data.title = String(form.get("title") || data.title);
  data.date = String(form.get("date") || data.date);
  data.time = String(form.get("time") || data.time);
  data.location = String(form.get("location") || "");
  data.duration_minutes = Number(form.get("duration_minutes") || data.duration_minutes || 60);
  const body = String(form.get("body") || content);
  await save(rel, data, body, `update event: ${data.title}`);
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath("/character");
}

export async function deleteEvent(slug: string) {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    // GitHub delete via Contents API
    const repoPath = `vault/events/${slug}.md`;
    const ghHeaders = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    };
    const branch = process.env.GITHUB_BRANCH || "main";
    const get = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${repoPath}?ref=${branch}`,
      { headers: ghHeaders, cache: "no-store" }
    );
    if (get.ok) {
      const { sha } = (await get.json()) as { sha: string };
      await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${repoPath}`, {
        method: "DELETE",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `delete event: ${slug}`, sha, branch }),
      });
    }
  } else {
    const full = path.join(vaultRoot(), "events", `${slug}.md`);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  revalidatePath("/events");
  revalidatePath("/character");
}

// ---------- reminders ----------

export async function updateReminder(slug: string, form: FormData) {
  const rel = `reminders/${slug}.md`;
  const { data, content } = load(rel);
  data.title = String(form.get("title") || data.title);
  data.fire_at = String(form.get("fire_at") || data.fire_at);
  data.recurrence = String(form.get("recurrence") || "");
  data.status = String(form.get("status") || data.status);
  data.channels = String(form.get("channels") || "ntfy,discord")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const body = String(form.get("body") || content);
  await save(rel, data, body, `update reminder: ${data.title}`);
  revalidatePath("/reminders");
  revalidatePath(`/reminders/${slug}`);
}

// ---------- habits ----------

export async function updateHabit(slug: string, form: FormData) {
  const rel = `habits/${slug}.md`;
  const { data, content } = load(rel);
  data.title = String(form.get("title") || data.title);
  data.cadence = String(form.get("cadence") || data.cadence);
  data.time = String(form.get("time") || data.time);
  data.days = String(form.get("days") || (data.days as string[]).join(","))
    .split(",").map((s) => s.trim()).filter(Boolean);
  data.linked_health_metric = String(form.get("linked_health_metric") || "");
  data.streak_target = Number(form.get("streak_target") || 30);
  const reminderChannels = String(form.get("reminder_channels") || "ntfy")
    .split(",").map((s) => s.trim()).filter(Boolean);
  data.reminder = {
    ...((data.reminder as object) || {}),
    channels: reminderChannels,
    enabled: form.get("reminder_enabled") === "on",
  };
  const body = String(form.get("body") || content);
  await save(rel, data, body, `update habit: ${data.title}`);
  revalidatePath("/habits");
  revalidatePath(`/habits/${slug}`);
}

// ---------- projects: budget, costs, tasks ----------

export async function updateProjectMeta(slug: string, form: FormData) {
  const rel = `projects/${slug}.md`;
  const { data, content } = load(rel);
  data.title = String(form.get("title") || data.title);
  data.status = String(form.get("status") || data.status);
  data.priority = String(form.get("priority") || data.priority);
  data.deadline = String(form.get("deadline") || "");
  const budget = (data.budget as { currency?: string; estimated?: number; actual?: number }) || {};
  data.budget = {
    currency: String(form.get("currency") || budget.currency || "USD"),
    estimated: Number(form.get("estimated") || budget.estimated || 0),
    actual: budget.actual || 0,
  };
  await save(rel, data, content, `update project: ${data.title}`);
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/finance");
}

export async function addProjectCost(slug: string, form: FormData) {
  const rel = `projects/${slug}.md`;
  const { data, content } = load(rel);
  const costs = (data.costs as Array<Record<string, unknown>>) || [];
  costs.push({
    date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
    description: String(form.get("description") || "expense"),
    amount: Number(form.get("amount") || 0),
    currency: (data.budget as { currency?: string })?.currency || "USD",
  });
  data.costs = costs;
  await save(rel, data, content, `add cost to ${data.title}`);
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/finance");
}

export async function addProjectTask(slug: string, form: FormData) {
  const rel = `projects/${slug}.md`;
  const { data, content } = load(rel);
  const tasks = (data.tasks as Array<Record<string, unknown>>) || [];
  const nextId = `t${tasks.length + 1}`;
  const reminderOffset = String(form.get("reminder_offset") || "1d");
  const reminderChannels = String(form.get("reminder_channels") || "ntfy")
    .split(",").map((s) => s.trim()).filter(Boolean);
  tasks.push({
    id: nextId,
    title: String(form.get("title") || "untitled"),
    deadline: String(form.get("deadline") || ""),
    done: false,
    reminders: reminderOffset
      ? [{ offset: reminderOffset, channels: reminderChannels }]
      : [],
  });
  data.tasks = tasks;
  await save(rel, data, content, `add task to ${data.title}`);
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/reminders");
  revalidatePath("/character");
}

export async function toggleProjectTask(slug: string, taskId: string) {
  const rel = `projects/${slug}.md`;
  const { data, content } = load(rel);
  const tasks = (data.tasks as Array<Record<string, unknown>>) || [];
  const t = tasks.find((x) => x.id === taskId);
  if (t) t.done = !t.done;
  await save(rel, data, content, `toggle task ${taskId}`);
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/character");
}

// ---------- health metrics ----------

export async function adjustHealthMetric(key: string, delta: number) {
  const rel = `health/metrics.md`;
  const { data, content } = load(rel);
  const metrics = (data.metrics as Array<Record<string, unknown>>) || [];
  const m = metrics.find((x) => x.key === key);
  if (!m) throw new Error(`metric ${key} not found`);
  const next = (Number(m.value) || 0) + delta;
  if (typeof m.min === "number" && next < m.min) return;
  if (typeof m.max === "number" && next > m.max) return;
  m.value = next;
  data.metrics = metrics;
  await save(rel, data, content, `adjust ${key} by ${delta}`);
  revalidatePath("/health");
  revalidatePath("/character");
}

export async function setHealthMetric(key: string, value: number) {
  const rel = `health/metrics.md`;
  const { data, content } = load(rel);
  const metrics = (data.metrics as Array<Record<string, unknown>>) || [];
  const m = metrics.find((x) => x.key === key);
  if (!m) throw new Error(`metric ${key} not found`);
  m.value = value;
  data.metrics = metrics;
  await save(rel, data, content, `set ${key} = ${value}`);
  revalidatePath("/health");
  revalidatePath("/character");
}
