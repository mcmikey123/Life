---
type: health_metrics
metrics:
  - key: weight
    label: Weight
    value: 180
    unit: lbs
    step: 1
  - key: sleep
    label: Sleep last night
    value: 7
    unit: hrs
    step: 0.5
    min: 0
    max: 24
  - key: steps
    label: Steps today
    value: 4500
    unit: ''
    step: 100
    min: 0
  - key: mood
    label: Mood
    value: 7
    unit: /10
    step: 1
    min: 1
    max: 10
  - key: energy
    label: Energy
    value: 8
    unit: /10
    step: 1
    min: 1
    max: 10
---

# Health Metrics

Edit values via the stepper arrows on the Health tab — each click writes a commit
to this file. Add or remove metrics by editing the `metrics:` list directly.
