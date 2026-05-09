---
type: health_metrics
metrics:
  - key: weight
    label: Weight
    value: 219
    unit: lbs
    step: 1
  - key: calories_target
    label: Calorie target
    value: 1900
    unit: kcal
    step: 50
    min: 0
  - key: protein_target
    label: Protein target
    value: 150
    unit: g
    step: 5
    min: 0
  - key: fat_target
    label: Fat target
    value: 200
    unit: g
    step: 5
    min: 0
  - key: steps_target
    label: Steps target
    value: 15000
    unit: ''
    step: 500
    min: 0
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

## Cutting macros

- Calories: 1900 kcal/day
- Protein: 150g (assumed default — adjust via stepper)
- Fat: 200g
- Carbs: remainder
- Steps target: 15,000/day
