#!/usr/bin/env python3
"""Quick-add CLI for events, reminders, projects, habits.

Usage:
  python scripts/add.py event   --title "Dentist" --date 2026-05-12 --time 10:00 [--location "Dr Smith"]
  python scripts/add.py reminder --title "Take meds" --at 2026-05-05T20:00 [--repeat daily] [--channels ntfy,discord]
  python scripts/add.py project  --title "Garage Reno" [--deadline 2026-08-01] [--budget 5000]
  python scripts/add.py habit    --title "Morning walk" [--time 07:00] [--days mon,tue,wed,thu,fri,sat,sun]
  python scripts/add.py task     --project garage-renovation --title "Get quotes" --deadline 2026-05-20

The CLI exists for shell shortcuts. When using Claude Code voice, Claude writes
markdown directly using the templates in vault/templates/ (see CLAUDE.md).
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parent.parent
VAULT = ROOT / "vault"


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "untitled"


def now_iso() -> str:
    return datetime.now().replace(microsecond=0).isoformat()


def write_post(path: Path, meta: dict, body: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        print(f"Refusing to overwrite {path}", file=sys.stderr)
        sys.exit(1)
    post = frontmatter.Post(body, **meta)
    path.write_text(frontmatter.dumps(post) + "\n")
    print(f"Wrote {path.relative_to(ROOT)}")


def add_event(args):
    slug = f"{args.date}-{slugify(args.title)}"
    write_post(
        VAULT / "events" / f"{slug}.md",
        {
            "type": "event",
            "title": args.title,
            "date": args.date,
            "time": args.time,
            "duration_minutes": args.duration,
            "location": args.location or "",
            "tags": args.tags.split(",") if args.tags else [],
            "reminders": [
                {"offset": "1d", "channels": ["ntfy", "discord"]},
                {"offset": "1h", "channels": ["ntfy"]},
            ],
            "created": now_iso(),
        },
        f"# {args.title}\n",
    )


def add_reminder(args):
    fire = args.at
    slug = f"{fire.replace(':', '').replace('-', '').replace('T', '-')[:13]}-{slugify(args.title)}"
    write_post(
        VAULT / "reminders" / f"{slug}.md",
        {
            "type": "reminder",
            "title": args.title,
            "fire_at": fire,
            "recurrence": args.repeat or "",
            "channels": args.channels.split(","),
            "status": "pending",
            "created": now_iso(),
        },
        f"# {args.title}\n",
    )


def add_project(args):
    slug = slugify(args.title)
    write_post(
        VAULT / "projects" / f"{slug}.md",
        {
            "type": "project",
            "title": args.title,
            "status": "active",
            "priority": args.priority,
            "deadline": args.deadline or "",
            "tags": args.tags.split(",") if args.tags else [],
            "budget": {"currency": "USD", "estimated": args.budget or 0, "actual": 0},
            "costs": [],
            "tasks": [],
            "created": now_iso(),
        },
        f"# {args.title}\n\n## Goal\n",
    )


def add_habit(args):
    slug = slugify(args.title)
    write_post(
        VAULT / "habits" / f"{slug}.md",
        {
            "type": "habit",
            "title": args.title,
            "cadence": args.cadence,
            "days": args.days.split(","),
            "time": args.time,
            "reminder": {"channels": args.channels.split(","), "enabled": True},
            "linked_health_metric": args.health_metric or "",
            "streak_target": args.streak_target,
            "tags": args.tags.split(",") if args.tags else [],
            "created": now_iso(),
        },
        f"# {args.title}\n\n## Why\n",
    )


def add_task(args):
    """Append a task to an existing project's frontmatter."""
    path = VAULT / "projects" / f"{args.project}.md"
    if not path.exists():
        print(f"Project {args.project} not found at {path}", file=sys.stderr)
        sys.exit(1)
    post = frontmatter.load(path)
    tasks = post.metadata.get("tasks") or []
    next_id = f"t{len(tasks) + 1}"
    tasks.append(
        {
            "id": next_id,
            "title": args.title,
            "deadline": args.deadline or "",
            "done": False,
            "reminders": [{"offset": "1d", "channels": args.channels.split(",")}],
        }
    )
    post.metadata["tasks"] = tasks
    path.write_text(frontmatter.dumps(post) + "\n")
    print(f"Added task {next_id} to {args.project}")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    e = sub.add_parser("event")
    e.add_argument("--title", required=True)
    e.add_argument("--date", required=True, help="YYYY-MM-DD")
    e.add_argument("--time", default="09:00")
    e.add_argument("--duration", type=int, default=60)
    e.add_argument("--location", default="")
    e.add_argument("--tags", default="")
    e.set_defaults(func=add_event)

    r = sub.add_parser("reminder")
    r.add_argument("--title", required=True)
    r.add_argument("--at", required=True, help="ISO 8601, e.g. 2026-05-05T20:00")
    r.add_argument("--repeat", default="")
    r.add_argument("--channels", default="ntfy,discord")
    r.set_defaults(func=add_reminder)

    pr = sub.add_parser("project")
    pr.add_argument("--title", required=True)
    pr.add_argument("--priority", default="medium")
    pr.add_argument("--deadline", default="")
    pr.add_argument("--budget", type=float, default=0)
    pr.add_argument("--tags", default="")
    pr.set_defaults(func=add_project)

    h = sub.add_parser("habit")
    h.add_argument("--title", required=True)
    h.add_argument("--cadence", default="daily")
    h.add_argument("--days", default="mon,tue,wed,thu,fri,sat,sun")
    h.add_argument("--time", default="08:00")
    h.add_argument("--channels", default="ntfy")
    h.add_argument("--streak-target", dest="streak_target", type=int, default=30)
    h.add_argument("--health-metric", dest="health_metric", default="")
    h.add_argument("--tags", default="")
    h.set_defaults(func=add_habit)

    t = sub.add_parser("task")
    t.add_argument("--project", required=True, help="Project slug, e.g. garage-renovation")
    t.add_argument("--title", required=True)
    t.add_argument("--deadline", default="")
    t.add_argument("--channels", default="ntfy")
    t.set_defaults(func=add_task)

    return p


if __name__ == "__main__":
    args = build_parser().parse_args()
    args.func(args)
