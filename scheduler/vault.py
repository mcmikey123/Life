"""Read the markdown vault and emit reminder events.

A "reminder event" is a tuple of (fire_at_datetime, title, body, channels, source_id).
The scheduler dedupes by source_id + fire_at via a small JSON state file so a reminder
fires once even if cron runs every minute.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import frontmatter

VAULT_PATH = Path(os.environ.get("VAULT_PATH", Path(__file__).resolve().parent.parent / "vault"))

# All wall-clock fields in vault frontmatter (event date+time, reminder fire_at,
# habit time, project task deadline) are interpreted in this zone.
LOCAL_TZ = ZoneInfo("Europe/London")


@dataclass
class FireEvent:
    fire_at: datetime
    title: str
    body: str
    channels: list[str]
    source_id: str  # stable id used for dedupe


_OFFSET_RE = re.compile(r"^(\d+)\s*([smhdw])$")


def parse_offset(offset: str) -> timedelta:
    """Parse offsets like '1h', '30m', '2d', '1w' into a timedelta."""
    if not offset:
        return timedelta(0)
    m = _OFFSET_RE.match(offset.strip().lower())
    if not m:
        return timedelta(0)
    n = int(m.group(1))
    unit = m.group(2)
    return {
        "s": timedelta(seconds=n),
        "m": timedelta(minutes=n),
        "h": timedelta(hours=n),
        "d": timedelta(days=n),
        "w": timedelta(weeks=n),
    }[unit]


def parse_datetime(date: str, time: str | None = None) -> datetime | None:
    """Parse a vault wall-clock string and attach LOCAL_TZ. Always returns aware."""
    if not date:
        return None
    try:
        if time:
            naive = datetime.fromisoformat(f"{date}T{time}")
        elif "T" in date:
            naive = datetime.fromisoformat(date)
        else:
            naive = datetime.fromisoformat(f"{date}T09:00")
    except ValueError:
        return None
    # Drop any incoming tzinfo (legacy data) and re-anchor to LOCAL_TZ.
    return naive.replace(tzinfo=LOCAL_TZ)


def _iter_md(folder: str):
    d = VAULT_PATH / folder
    if not d.exists():
        return
    for p in d.glob("*.md"):
        if p.name.endswith(".log.md"):
            continue
        yield p


def collect_events() -> list[FireEvent]:
    out: list[FireEvent] = []
    for p in _iter_md("events"):
        post = frontmatter.load(p)
        meta = post.metadata
        if meta.get("type") != "event":
            continue
        start = parse_datetime(meta.get("date"), meta.get("time"))
        if not start:
            continue
        for r in meta.get("reminders") or []:
            fire = start - parse_offset(r.get("offset", "0m"))
            out.append(
                FireEvent(
                    fire_at=fire,
                    title=f"⏰ {meta['title']}",
                    body=f"{meta.get('date')} {meta.get('time') or ''} · {meta.get('location') or ''}".strip(),
                    channels=r.get("channels") or ["ntfy"],
                    source_id=f"event:{p.stem}:{r.get('offset', '0m')}",
                )
            )
    return out


def collect_project_tasks() -> list[FireEvent]:
    out: list[FireEvent] = []
    for p in _iter_md("projects"):
        post = frontmatter.load(p)
        meta = post.metadata
        if meta.get("type") != "project":
            continue
        for t in meta.get("tasks") or []:
            if t.get("done"):
                continue
            deadline = parse_datetime(t.get("deadline"))
            if not deadline:
                continue
            for r in t.get("reminders") or []:
                fire = deadline - parse_offset(r.get("offset", "0m"))
                out.append(
                    FireEvent(
                        fire_at=fire,
                        title=f"📋 {meta['title']}: {t['title']}",
                        body=f"due {t.get('deadline')}",
                        channels=r.get("channels") or ["ntfy"],
                        source_id=f"project:{p.stem}:{t['id']}:{r.get('offset', '0m')}",
                    )
                )
    return out


def collect_standalone_reminders() -> list[FireEvent]:
    out: list[FireEvent] = []
    for p in _iter_md("reminders"):
        post = frontmatter.load(p)
        meta = post.metadata
        if meta.get("type") != "reminder" or meta.get("status") != "pending":
            continue
        fire_at = parse_datetime(meta.get("fire_at"))
        if not fire_at:
            continue
        out.append(
            FireEvent(
                fire_at=fire_at,
                title=f"🔔 {meta['title']}",
                body=post.content.strip() or meta.get("title", ""),
                channels=meta.get("channels") or ["ntfy"],
                source_id=f"reminder:{p.stem}",
            )
        )
    return out


_DAY_INDEX = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


def collect_habits(now: datetime) -> list[FireEvent]:
    """Emit a fire event for each habit on its scheduled day, at its scheduled local time.

    `now` must be aware in LOCAL_TZ so weekday/hour reflect the user's clock.
    """
    out: list[FireEvent] = []
    now_local = now.astimezone(LOCAL_TZ)
    today_idx = now_local.weekday()
    for p in _iter_md("habits"):
        post = frontmatter.load(p)
        meta = post.metadata
        if meta.get("type") != "habit":
            continue
        if not (meta.get("reminder") or {}).get("enabled", True):
            continue
        days = [d.lower() for d in meta.get("days") or []]
        if days and today_idx not in {_DAY_INDEX[d] for d in days if d in _DAY_INDEX}:
            continue
        time_s = meta.get("time", "09:00")
        try:
            hh, mm = (int(x) for x in time_s.split(":"))
        except ValueError:
            continue
        fire = now_local.replace(hour=hh, minute=mm, second=0, microsecond=0)
        channels = (meta.get("reminder") or {}).get("channels") or ["ntfy"]
        out.append(
            FireEvent(
                fire_at=fire,
                title=f"🌱 {meta['title']}",
                body=f"daily habit · {time_s}",
                channels=channels,
                source_id=f"habit:{p.stem}:{fire.strftime('%Y-%m-%d')}",
            )
        )
    return out


def collect_all(now: datetime) -> list[FireEvent]:
    return (
        collect_events()
        + collect_project_tasks()
        + collect_standalone_reminders()
        + collect_habits(now)
    )
