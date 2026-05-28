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
import requests

VAULT_PATH = Path(os.environ.get("VAULT_PATH", Path(__file__).resolve().parent.parent / "vault"))

# All wall-clock fields in vault frontmatter (event date+time, reminder
# fire_at, daily time, daily date for one-offs, project task deadline) are
# interpreted in this zone.
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


def _d10(v: object) -> str:
    """First 10 chars of a date-ish value (handles str, date, datetime)."""
    return str(v or "")[:10]


def _load_one(relpath: str) -> dict | None:
    p = VAULT_PATH / relpath
    if not p.exists():
        return None
    try:
        return frontmatter.load(p).metadata
    except Exception:
        return None


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


def collect_dailies(now: datetime) -> list[FireEvent]:
    """Emit a fire event for each daily that's due today.

    Recurring dailies (cadence in {daily, weekly, custom}) fire on every day
    in their `days` list, at `time`. One-off dailies (cadence: once) fire only
    when their `date` matches today's London date.

    `now` must be aware so weekday/hour reflect the user's clock.
    """
    out: list[FireEvent] = []
    now_local = now.astimezone(LOCAL_TZ)
    today_idx = now_local.weekday()
    today_iso = now_local.strftime("%Y-%m-%d")
    for p in _iter_md("dailies"):
        post = frontmatter.load(p)
        meta = post.metadata
        if meta.get("type") != "daily":
            continue
        if not (meta.get("reminder") or {}).get("enabled", True):
            continue
        cadence = meta.get("cadence", "daily")
        if cadence == "once":
            if meta.get("date") != today_iso:
                continue
        else:
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
        body = "one-off" if cadence == "once" else f"{cadence} · {time_s}"
        out.append(
            FireEvent(
                fire_at=fire,
                title=f"🌱 {meta['title']}",
                body=body,
                channels=channels,
                source_id=f"daily:{p.stem}:{fire.strftime('%Y-%m-%d')}",
            )
        )
    return out


def get_nutrition_target() -> tuple[str, dict] | None:
    """Return (active_phase, targets) from health/nutrition.md, or None."""
    meta = _load_one("health/nutrition.md")
    if not meta:
        return None
    phases = meta.get("phases") or {}
    phase = meta.get("phase") or next(iter(phases), "")
    target = phases.get(phase) or next(iter(phases.values()), None)
    if not target:
        return None
    return phase, target


def get_morning_report_config() -> dict:
    meta = _load_one("morning-report.md") or {}
    return {
        "enabled": meta.get("enabled", True),
        "time": meta.get("time", "07:00"),
        "channels": meta.get("channels") or ["ntfy"],
        "greeting": meta.get("greeting", "Good morning."),
        "weather": meta.get("weather"),
    }


# WMO weather interpretation codes → short text (open-meteo.com/en/docs).
_WMO = {
    0: "clear", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "rime fog",
    51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
    56: "freezing drizzle", 57: "freezing drizzle",
    61: "light rain", 63: "rain", 65: "heavy rain",
    66: "freezing rain", 67: "freezing rain",
    71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
    80: "rain showers", 81: "rain showers", 82: "violent rain showers",
    85: "snow showers", 86: "snow showers",
    95: "thunderstorm", 96: "thunderstorm w/ hail", 99: "thunderstorm w/ hail",
}


def get_weather(cfg: dict) -> str | None:
    """Today's forecast line for the configured location, or None if unavailable."""
    w = cfg.get("weather")
    if not w:
        return None
    label = w.get("label", "")
    try:
        r = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": w.get("latitude"),
                "longitude": w.get("longitude"),
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                "timezone": "Europe/London",
                "forecast_days": 1,
            },
            timeout=10,
        )
        r.raise_for_status()
        d = r.json().get("daily", {})
        code = (d.get("weather_code") or [None])[0]
        tmax = (d.get("temperature_2m_max") or [None])[0]
        tmin = (d.get("temperature_2m_min") or [None])[0]
        pop = (d.get("precipitation_probability_max") or [None])[0]
    except (requests.RequestException, ValueError, KeyError, IndexError):
        return None
    if tmax is None or tmin is None:
        return None
    desc = _WMO.get(code, "")
    line = f"{label} · {desc}, {round(tmin)}–{round(tmax)}°C".replace(" · , ", " · ")
    if pop is not None:
        line += f", {pop}% rain"
    return line


def build_morning_report_body(now: datetime, cfg: dict | None = None) -> str:
    """Assemble the morning digest: weather, events, daily plan, agenda, fuel, goals."""
    now_local = now.astimezone(LOCAL_TZ)
    today_iso = now_local.strftime("%Y-%m-%d")
    today_idx = now_local.weekday()
    lines: list[str] = []

    weather = get_weather(cfg or {})
    if weather:
        lines.append(f"🌤 {weather}")
        lines.append("")

    events: list[str] = []
    for p in _iter_md("events"):
        meta = frontmatter.load(p).metadata
        if meta.get("type") != "event" or _d10(meta.get("date")) != today_iso:
            continue
        s = f"{meta.get('time') or ''} {meta.get('title')}".strip()
        if meta.get("location"):
            s += f" @ {meta.get('location')}"
        events.append(s)
    if events:
        lines.append("📅 On today")
        lines += [f"• {e}" for e in sorted(events)]
        lines.append("")

    dailies: list[str] = []
    for p in _iter_md("dailies"):
        meta = frontmatter.load(p).metadata
        if meta.get("type") != "daily":
            continue
        cadence = meta.get("cadence", "daily")
        if cadence == "once":
            if _d10(meta.get("date")) != today_iso:
                continue
        else:
            days = [d.lower() for d in meta.get("days") or []]
            if days and today_idx not in {_DAY_INDEX[d] for d in days if d in _DAY_INDEX}:
                continue
        dailies.append(str(meta.get("title") or p.stem))
    if dailies:
        lines.append("✅ Daily plan")
        lines += [f"• {d}" for d in dailies]
        lines.append("")

    agenda: list[str] = []
    for p in _iter_md("reminders"):
        meta = frontmatter.load(p).metadata
        if meta.get("type") != "reminder" or meta.get("status") != "pending":
            continue
        fa = str(meta.get("fire_at") or "")
        if _d10(fa) != today_iso:
            continue
        t = fa[11:16] if len(fa) >= 16 else ""
        agenda.append(f"{t} {meta.get('title')}".strip())
    for p in _iter_md("projects"):
        meta = frontmatter.load(p).metadata
        if meta.get("type") != "project":
            continue
        for tk in meta.get("tasks") or []:
            if tk.get("done"):
                continue
            if _d10(tk.get("deadline")) == today_iso:
                agenda.append(f"{meta.get('title')}: {tk.get('title')} (due)")
    if agenda:
        lines.append("🔔 Reminders & deadlines")
        lines += [f"• {a}" for a in agenda]
        lines.append("")

    nut = get_nutrition_target()
    if nut:
        phase, target = nut
        lines.append("🍽 Fuel")
        lines.append(
            f"• {phase}: {target.get('calories')} kcal "
            f"(P{target.get('protein')} / C{target.get('carbs')} / F{target.get('fats')})"
        )
        lines.append("")

    goals: list[str] = []
    for p in _iter_md("quests"):
        meta = frontmatter.load(p).metadata
        if meta.get("type") != "quest" or meta.get("status") != "active":
            continue
        dl = meta.get("deadline")
        goals.append(f"{meta.get('title')}" + (f" (by {dl})" if dl else ""))
    if goals:
        lines.append("🎯 Goals in play")
        lines += [f"• {g}" for g in goals]
        lines.append("")

    return "\n".join(lines).strip() or "Nothing scheduled. Make today count."


def collect_morning_report(now: datetime) -> list[FireEvent]:
    """One digest per day, fired at the configured morning time."""
    cfg = get_morning_report_config()
    if not cfg.get("enabled", True):
        return []
    now_local = now.astimezone(LOCAL_TZ)
    try:
        hh, mm = (int(x) for x in str(cfg.get("time", "07:00")).split(":"))
    except ValueError:
        return []
    fire = now_local.replace(hour=hh, minute=mm, second=0, microsecond=0)
    today_iso = now_local.strftime("%Y-%m-%d")
    return [
        FireEvent(
            fire_at=fire,
            title=f"☀️ {cfg.get('greeting', 'Good morning.')}",
            body=build_morning_report_body(now, cfg),
            channels=cfg.get("channels") or ["ntfy"],
            source_id=f"morning-report:{today_iso}",
        )
    ]


def collect_all(now: datetime) -> list[FireEvent]:
    return (
        collect_events()
        + collect_project_tasks()
        + collect_standalone_reminders()
        + collect_dailies(now)
        + collect_morning_report(now)
    )
