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

## Deploy: live URL via Vercel + GitHub Actions

The dashboard runs on Vercel (free tier); the scheduler runs as a GitHub Actions cron job.
Voice-to-Claude commits new entries to git, Vercel auto-redeploys, and the next cron tick
picks up any new reminders.

### 1. Push the repo to GitHub

```bash
git remote add origin git@github.com:<you>/Life.git
git push -u origin main
```

### 2. Deploy the dashboard to Vercel

1. Go to [vercel.com/new](https://vercel.com/new), import the repo.
2. **Important:** set **Root Directory** to `dashboard`. Framework auto-detects as Next.js.
3. Add environment variables:
   - `DASHBOARD_PASSWORD` — pick a strong password. Browser will prompt for it.
   - `GITHUB_TOKEN` — a fine-grained PAT with `Contents: Read & write` on this repo. Lets the dashboard's `/api/log` endpoint commit habit logs back to the vault.
   - `GITHUB_REPO` — `<you>/Life`.
   - `GITHUB_BRANCH` — `main` (default).
4. Deploy. You'll get a `*.vercel.app` URL — visit it, enter the password.
5. Optional: add a custom domain in the Vercel project settings.

Vercel auto-redeploys every time you push to `main`, so any commit Claude makes during a
voice session goes live in ~30 seconds.

### 3. Wire up the scheduler in GitHub Actions

The workflow at `.github/workflows/scheduler.yml` runs every 5 minutes. Add these
**repository secrets** at `Settings → Secrets and variables → Actions`:

- `NTFY_URL` — your ntfy topic URL.
- `NTFY_TOKEN` — only if your ntfy server requires auth.
- `DISCORD_WEBHOOK` — Discord channel webhook URL.

To test immediately, use the **Run workflow** button on the Actions tab (workflow_dispatch).
The scheduler will read the vault, fire any due reminders, and persist its dedupe state in
the GitHub Actions cache so it doesn't re-fire across runs.

### Notes on the deployed setup

- **Cron jitter.** GitHub Actions cron can be delayed several minutes under load. The
  scheduler's fire window is 15 min (vs. the 5 min cron) so a delayed tick still catches
  pending reminders. State dedupe ensures each reminder fires exactly once.
- **Read-only filesystem on Vercel.** `/api/log` (habit logging from the deployed UI)
  uses the GitHub API to commit log entries when `GITHUB_TOKEN` is set; on a local dev
  server it falls back to direct disk writes.
- **Vault privacy.** Use a private GitHub repo. Vercel respects that; nothing about your
  appointments, projects, or finances is exposed publicly.

## Adding new features

Phase 2 tabs (Finance, Health) already have working stubs that read existing data. To extend:

1. Decide on a frontmatter shape and add a template under `vault/templates/`.
2. Document the convention in `CLAUDE.md` so voice-to-Claude works for it.
3. Add a parser function in `dashboard/lib/vault.ts`.
4. Build the page under `dashboard/app/<tab>/page.tsx`.
5. If it needs notifications, wire it into `scheduler/vault.py::collect_all`.
