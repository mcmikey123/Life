"""Scheduler entrypoint. Run from cron every minute:

    * * * * *  cd /path/to/Life && /path/to/.venv/bin/python -m scheduler.run >> logs/scheduler.log 2>&1

Idempotent: a small JSON state file tracks which (source_id, fire_at) have already fired.
Window: anything due in the past 5 minutes that hasn't fired yet gets sent.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# allow running as `python -m scheduler.run` or `python scheduler/run.py`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scheduler import notify, vault

STATE_FILE = Path(os.environ.get("SCHEDULER_STATE", Path(__file__).resolve().parent / ".state.json"))
# Fire any reminder due within the last WINDOW. Set wide enough to absorb cron
# jitter (GitHub Actions cron can be several minutes late). State dedup ensures
# each reminder still fires exactly once.
WINDOW = timedelta(minutes=int(os.environ.get("SCHEDULER_WINDOW_MINUTES", "15")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("scheduler")


def load_state() -> dict[str, str]:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_state(state: dict[str, str]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True))


def main() -> None:
    now = datetime.now().replace(microsecond=0)
    state = load_state()
    fired_count = 0

    for ev in vault.collect_all(now):
        key = f"{ev.source_id}@{ev.fire_at.isoformat()}"
        if key in state:
            continue
        if ev.fire_at <= now <= ev.fire_at + WINDOW:
            log.info("Firing %s -> %s", ev.source_id, ev.channels)
            results = notify.dispatch(ev.channels, ev.title, ev.body)
            if any(results.values()):
                state[key] = now.isoformat()
                fired_count += 1
            else:
                log.warning("All channels failed for %s; will retry next minute", ev.source_id)

    # gc state older than 30 days
    cutoff = (now - timedelta(days=30)).isoformat()
    state = {k: v for k, v in state.items() if v > cutoff}

    save_state(state)
    if fired_count:
        log.info("Scheduler tick: fired %d notifications", fired_count)


if __name__ == "__main__":
    main()
