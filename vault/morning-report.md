---
type: morning_report
enabled: true
time: "07:00"             # Europe/London — when the digest push fires
channels: [ntfy, discord]
greeting: "Good morning."
---

# Morning report

Configures the daily morning digest that the scheduler pushes to your phone.
The **Today** tab on the dashboard shows the same report and is always available.

- `enabled: false` turns off the push (the Today tab still works).
- `time` is when the push fires (Europe/London).
- `greeting` is the line at the top of the report.
