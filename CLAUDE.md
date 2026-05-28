# Life — Claude instructions

This repo is a personal life dashboard. The "database" is the markdown vault at `vault/`.
Anything you add lands as a markdown file with YAML frontmatter; the dashboard reads files
on the fly and the scheduler fires notifications based on frontmatter.

## When the user asks you to add something (voice or text)

Pick the right folder by intent:

| User says…                                  | Folder                | Type       |
|---------------------------------------------|-----------------------|------------|
| "add an event / appointment / meeting"      | `vault/events/`       | event      |
| "remind me to X at Y"                       | `vault/reminders/`    | reminder   |
| "start a project / track project X"         | `vault/projects/`     | project    |
| "add a task to project X"                   | edit project file     | task       |
| "track a habit / I want to do X every day"  | `vault/dailies/`      | daily (cadence: daily/weekly/custom) |
| "I need to do X today" (one-off)            | `vault/dailies/`      | daily (cadence: once, with `date`)   |
| "log that I did/skipped my morning walk"    | `vault/dailies/<slug>.log.md` | daily_log |
| "put me on a cut / maintenance / bulk"      | edit `vault/health/nutrition.md` | nutrition (set `phase`) |

### Filename convention

- Events:        `vault/events/YYYY-MM-DD-<slug>.md`
- Reminders:     `vault/reminders/YYYYMMDD-HHMM-<slug>.md`
- Projects:      `vault/projects/<slug>.md`
- Dailies (recurring): `vault/dailies/<slug>.md`
- Dailies (one-off):   `vault/dailies/YYYY-MM-DD-<slug>.md`

`<slug>` = lowercase, hyphenated, no special chars.

### Frontmatter shape

Always copy from the matching template in `vault/templates/`:

- `vault/templates/event.md`
- `vault/templates/reminder.md`
- `vault/templates/project.md`
- `vault/templates/daily.md`

Fill all fields. For `created`, use `datetime.now().isoformat()` truncated to seconds.

### Time zone — Europe/London everywhere

All wall-clock fields in vault frontmatter (event `date` + `time`, reminder
`fire_at`, daily `time`, daily `date` for one-offs, project task `deadline`)
are **Europe/London local time**, no offset, no `Z`. The scheduler attaches `Europe/London` when parsing
and converts to UTC only when comparing against `datetime.now(timezone.utc)`.
Dashboard forms read and write these strings verbatim — no conversion.

Do NOT write UTC, mixed offsets, or naive-but-meant-as-UTC values into the
vault. If the user says "10am", store `time: "10:00"`.

### Reminder offsets

The scheduler accepts offsets like `30m`, `1h`, `1d`, `1w`. Default reminders for a new
event = `[1d, 1h]`. For a project task = `[3d, 1d]`. Channels default to `[ntfy]`; use
`[ntfy, discord]` for things the user explicitly wants louder.

### Voice intent → action

- "add a dentist appointment may 12 at 10am" → write event file, default reminders 1d + 1h.
- "remind me to take meds tonight at 8" → reminder file, fire_at = today 20:00, channels ntfy+discord.
- "I'm starting a kitchen renovation, budget 8000" → project file with budget.
- "add a task to garage renovation: get permit, due june 1" → edit `vault/projects/garage-renovation.md`, append to `tasks` array, give it the next `t<N>` id.
- "I went on my walk this morning" → POST to dashboard `/api/log` OR append a row to `vault/dailies/morning-walk.log.md`.
- "I'm tracking a new habit: drink water every day at 8am" → daily file with `cadence: daily`.
- "I need to call the bank today" → daily file with `cadence: once`, `date: <today>`.

### Don't ask, just do

For voice flows, prefer doing it with sensible defaults over asking clarifying questions.
If a date/time is ambiguous, pick the most likely interpretation (next occurrence) and
mention what you assumed in your reply. The user can always edit the file in Obsidian.

### Always commit + push after a voice add

The deployed dashboard (Vercel) and the scheduler (GitHub Actions) both read the vault
from the `main` branch on GitHub. After writing the markdown file:

1. `git add <the new/edited file>`
2. `git commit -m "<short summary>"` — single line, describe the entry
3. `git push origin main`

Vercel redeploys automatically (~30s). The next scheduler tick (≤5 min) picks up the
new reminders. If `git push` fails because of a network blip, retry with the standard
exponential backoff (2s, 4s, 8s, 16s).

If the user has multiple changes queued, batch them in one commit. If the user asks you
NOT to push (e.g. "draft this for me"), respect that and just leave it locally.

### Daily adherence

Logging done/skip writes a row to `vault/dailies/<slug>.log.md` like:

```
| 2026-05-05 | done | felt great |
```

If the file doesn't exist, create it with a frontmatter block:

```
---
type: daily_log
daily: "<slug>"
---

| date | status | note |
|------|--------|------|
```

### Project costs feed Finance

When the user logs a project expense ("spent $200 on lumber for the garage"), append to
the `costs` array in the project's frontmatter. The Finance tab aggregates from there.

### Morning report

The **Today** tab (`dashboard/app/today/`) is the daily landing page: it aggregates
today's events, the daily plan (today's dailies), reminders + task deadlines due today,
the active nutrition target, and active quests. The scheduler also pushes the same digest
once each morning.

- Calorie/macro targets live in `vault/health/nutrition.md` — one active `phase`
  (`cut`/`maintenance`/`bulk`) plus a numbers block per phase. Switching diet is a
  one-field change to `phase`. Template: `vault/templates/nutrition.md`.
- The morning push is configured by `vault/morning-report.md` (`enabled`, `time`,
  `channels`, `greeting`). Edit that file to retime or silence the push; the Today tab
  stays available regardless.

### What you should NOT do

- Don't create files outside `vault/`. The dashboard, scheduler, and scripts have their own homes.
- Don't run the dev server or scheduler proactively — only when explicitly asked.
- Don't change templates or library code as part of an "add X" voice request.

## Repo layout

```
vault/         markdown DB (Obsidian vault root is the repo root, vault/ is a subfolder)
dashboard/     Next.js app, reads vault/, runs on :3737
scheduler/     Python, run from cron, fires ntfy + Discord notifications
scripts/       CLI helpers (add.py)
templates/     repo-level templates (not vault templates)
```

## Running things (only when asked)

- Dashboard: `cd dashboard && npm install && npm run dev`
- Scheduler one-shot: `cd scheduler && python -m scheduler.run`
- Quick-add via CLI: `python scripts/add.py event --title "..." --date 2026-05-12 --time 10:00`
