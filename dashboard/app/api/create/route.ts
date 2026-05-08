import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { createVaultFile } from "@/lib/vault-write";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled";
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "");
}

function csv(s: string | undefined, fallback: string[] = []): string[] {
  if (s == null) return fallback;
  const t = s.trim();
  if (!t) return fallback;
  return t.split(",").map((x) => x.trim()).filter(Boolean);
}

async function write(relPath: string, data: Record<string, unknown>, body: string, commitMessage: string) {
  const content = matter.stringify(body, data) + "\n";
  const result = await createVaultFile(relPath, content, commitMessage);
  return result;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const kind = body.kind;
  if (!kind) return NextResponse.json({ error: "kind required" }, { status: 400 });

  const title: string = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  if (kind === "event") {
    const date: string = body.date;
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const slug = `${date}-${slugify(title)}`;
    const result = await write(
      `events/${slug}.md`,
      {
        type: "event",
        title,
        date,
        time: body.time || "09:00",
        duration_minutes: Number(body.duration_minutes) || 60,
        location: body.location || "",
        tags: csv(body.tags),
        reminders: [
          { offset: "1d", channels: ["ntfy", "discord"] },
          { offset: "1h", channels: ["ntfy"] },
        ],
        created: nowIso(),
      },
      `# ${title}\n`,
      `Add event: ${title} on ${date}`,
    );
    return NextResponse.json(result, { status: "error" in result ? 409 : 200 });
  }

  if (kind === "reminder") {
    const fireAt: string = body.fire_at;
    if (!fireAt) return NextResponse.json({ error: "fire_at required" }, { status: 400 });
    const stamp = fireAt.replace(/[:\-]/g, "").replace("T", "-").slice(0, 13);
    const slug = `${stamp}-${slugify(title)}`;
    const result = await write(
      `reminders/${slug}.md`,
      {
        type: "reminder",
        title,
        fire_at: fireAt,
        recurrence: body.recurrence || "",
        channels: csv(body.channels, ["ntfy", "discord"]),
        status: "pending",
        linked_to: body.linked_to || "",
        created: nowIso(),
      },
      `# ${title}\n`,
      `Add reminder: ${title} @ ${fireAt}`,
    );
    return NextResponse.json(result, { status: "error" in result ? 409 : 200 });
  }

  if (kind === "project") {
    const slug = slugify(title);
    const result = await write(
      `projects/${slug}.md`,
      {
        type: "project",
        title,
        status: "active",
        priority: body.priority || "medium",
        deadline: body.deadline || "",
        tags: csv(body.tags),
        budget: {
          currency: body.currency || "USD",
          estimated: Number(body.budget) || 0,
          actual: 0,
        },
        costs: [],
        tasks: [],
        created: nowIso(),
      },
      `# ${title}\n\n## Goal\n`,
      `Add project: ${title}`,
    );
    return NextResponse.json(result, { status: "error" in result ? 409 : 200 });
  }

  if (kind === "daily") {
    const cadence = body.cadence || "daily";
    if (cadence === "once" && !body.date) {
      return NextResponse.json({ error: "date required when cadence=once" }, { status: 400 });
    }
    // Slug includes the date for one-offs so two same-titled one-offs don't collide.
    const slug = cadence === "once" ? `${body.date}-${slugify(title)}` : slugify(title);
    const result = await write(
      `dailies/${slug}.md`,
      {
        type: "daily",
        title,
        cadence,
        date: cadence === "once" ? body.date : "",
        days: csv(body.days, ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
        time: body.time || "08:00",
        reminder: {
          channels: csv(body.channels, ["ntfy"]),
          enabled: body.reminder_enabled !== false,
        },
        linked_health_metric: body.linked_health_metric || "",
        streak_target: Number(body.streak_target) || 30,
        tags: csv(body.tags),
        created: nowIso(),
      },
      `# ${title}\n\n## Why\n`,
      `Add daily: ${title}`,
    );
    return NextResponse.json(result, { status: "error" in result ? 409 : 200 });
  }

  if (kind === "quest") {
    const slug = slugify(title);
    const result = await write(
      `quests/${slug}.md`,
      {
        type: "quest",
        title,
        status: "active",
        horizon: body.horizon || "long",
        deadline: body.deadline || "",
        progress: 0,
        linked_projects: csv(body.linked_projects),
        tags: csv(body.tags),
        created: nowIso(),
      },
      `# ${title}\n\n## Why this matters\n`,
      `Add quest: ${title}`,
    );
    return NextResponse.json(result, { status: "error" in result ? 409 : 200 });
  }

  return NextResponse.json({ error: `unknown kind: ${kind}` }, { status: 400 });
}
