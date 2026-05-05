# Life

A self-hosted life dashboard built around an Obsidian-friendly markdown vault.

The "database" is `vault/` — a folder of markdown files with YAML frontmatter. The Next.js
dashboard reads them at request time, the Python scheduler reads them on a cron tick to fire
ntfy + Discord notifications, and Claude Code (with voice) creates new entries by writing
files following the templates.

## Tabs

**Phase 1**

- **Events** — dated schedule. Each event has reminders attached.
- **Reminders** — explicit standalone reminders + everything rolled up from events and project tasks.
- **Projects** — ongoing work, tasks with deadlines (each can have reminders), and a costs log that feeds Finance.
- **Habits** — daily/weekly habits with reminder time, days-of-week, streak + 30-day adherence. Optional link to a Health metric.

**Phase 2** (stubs in place)

- **Finance** — already aggregates project costs; will get recurring expenses, income, KPIs.
- **Health** — already lists habits linked to health metrics; will get daily metric logs, symptoms, meds.

## Repo layout

```
.
├── vault/                       # Obsidian vault root for your data
│   ├── events/                  # YYYY-MM-DD-<slug>.md
│   ├── reminders/               # YYYYMMDD-HHMM-<slug>.md
│   ├── projects/                # <slug>.md, costs + tasks in frontmatter
│   ├── habits/                  # <slug>.md + <slug>.log.md adherence
│   ├── health/   finance/       # phase 2 data
│   ├── daily/                   # Obsidian daily notes
│   └── templates/               # markdown templates Claude follows
├── dashboard/                   # Next.js app on :3737
│   ├── app/                     # routes per tab
│   └── lib/vault.ts             # frontmatter -> typed objects
├── scheduler/                   # cron-driven Python notifier
│   ├── vault.py                 # collect FireEvents from the vault
│   ├── notify.py                # ntfy + Discord adapters
│   └── run.py                   # entrypoint, idempotent via .state.json
├── scripts/
│   ├── add.py                   # CLI quick-add
│   └── aliases.sh               # shell aliases
└── CLAUDE.md                    # voice-to-Claude conventions
```

## Setup

### 1. Dashboard

```bash
cd dashboard
npm install
npm run dev          # http://localhost:3737
```

### 2. Scheduler

```bash
cd scheduler
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in NTFY_URL and DISCORD_WEBHOOK
```

Test once:

```bash
cd /path/to/Life
set -a; source scheduler/.env; set +a
python -m scheduler.run
```

Wire into cron (every minute):

```cron
* * * * *  cd /path/to/Life && set -a && . scheduler/.env && set +a && /path/to/Life/scheduler/.venv/bin/python -m scheduler.run >> /path/to/Life/logs/scheduler.log 2>&1
```

### 3. Obsidian

Open this repo's root as an Obsidian vault. The `.obsidian/` config is checked in; daily
notes, templates, and the file explorer are pre-configured. Recommended community plugins:
**Tasks**, **Dataview**, **Calendar** — all work natively with the frontmatter shapes here.

## Voice-to-Claude workflow

Run Claude Code in this directory and just talk:

> "Add a dentist appointment May 12 at 10am"
> "Remind me to take meds tonight at 8"
> "Start a project called kitchen renovation, budget 8000"
> "Add a task to garage renovation: get a permit, due June 1"
> "I'm tracking a new habit: drink water every day at 8am, ping me on ntfy"
> "I went on my walk this morning"

`CLAUDE.md` tells Claude exactly which folder, filename convention, and frontmatter shape
to use for each intent. Claude writes the markdown file; the next scheduler tick picks up
the new reminder; the dashboard shows it on next refresh.

## CLI quick-add (no Claude required)

```bash
source scripts/aliases.sh

life-event   --title "Dentist" --date 2026-05-12 --time 10:00 --location "Dr Smith"
life-remind  --title "Take meds" --at 2026-05-05T20:00 --channels ntfy,discord
life-project --title "Kitchen Renovation" --deadline 2026-09-01 --budget 8000
life-task    --project kitchen-renovation --title "Get permit" --deadline 2026-06-01
life-habit   --title "Drink water" --time 08:00 --channels ntfy
life-tick    # run scheduler one-shot for testing
```

## Notification channels

- **ntfy** — push notifications via [ntfy.sh](https://ntfy.sh) (free public, or self-hosted). Set `NTFY_URL` to your topic URL. For private topics use `NTFY_TOKEN`.
- **Discord** — set `DISCORD_WEBHOOK` to a channel webhook URL.

Each reminder declares which channels it uses in frontmatter. The scheduler is idempotent
— a `scheduler/.state.json` records what's already fired so cron can run every minute safely.

## Adding new features

Phase 2 tabs (Finance, Health) already have working stubs that read existing data. To extend:

1. Decide on a frontmatter shape and add a template under `vault/templates/`.
2. Document the convention in `CLAUDE.md` so voice-to-Claude works for it.
3. Add a parser function in `dashboard/lib/vault.ts`.
4. Build the page under `dashboard/app/<tab>/page.tsx`.
5. If it needs notifications, wire it into `scheduler/vault.py::collect_all`.
