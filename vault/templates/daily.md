---
type: daily
title: "{{title}}"
cadence: daily          # daily | weekly | custom | once
date: ""                # YYYY-MM-DD, required only when cadence: once
days: [mon, tue, wed, thu, fri, sat, sun]
time: "08:00"
reminder:
  channels: [ntfy]
  enabled: true
linked_health_metric: ""   # e.g. "weight", "steps" — feeds health tab
streak_target: 30
tags: []
created: "{{created}}"
---

# {{title}}

## Why

## Notes

<!-- A "daily" is anything you want to do today.
   - cadence: daily / weekly / custom — recurring; uses `days` and `time`.
   - cadence: once — one-off, uses `date` (and optional `time`); fires once.
Adherence is logged per-slug at vault/dailies/<slug>.log.md as date,status,note.
-->
