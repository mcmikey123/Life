---
type: nutrition
phase: cut                 # cut | maintenance | bulk — which target is active today
phases:
  cut:
    calories: 2200
    protein: 210
    carbs: 160
    fats: 60
  maintenance:
    calories: 2600
    protein: 200
    carbs: 260
    fats: 75
  bulk:
    calories: 3000
    protein: 210
    carbs: 330
    fats: 85
updated: "{{created}}"
---

# Nutrition

Single source of truth for daily calorie + macro targets.

- Set `phase` to `cut`, `maintenance`, or `bulk`. The morning report and the
  Today tab show that phase's numbers.
- Edit the numbers under each phase to match your plan.
- Switching phase is a one-field change (voice: "put me on maintenance").
