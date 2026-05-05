# Source this in your shell: source /path/to/Life/scripts/aliases.sh
LIFE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"

life-add()      { python "$LIFE_ROOT/scripts/add.py" "$@"; }
life-event()    { python "$LIFE_ROOT/scripts/add.py" event "$@"; }
life-remind()   { python "$LIFE_ROOT/scripts/add.py" reminder "$@"; }
life-project()  { python "$LIFE_ROOT/scripts/add.py" project "$@"; }
life-habit()    { python "$LIFE_ROOT/scripts/add.py" habit "$@"; }
life-task()     { python "$LIFE_ROOT/scripts/add.py" task "$@"; }
life-tick()     { (cd "$LIFE_ROOT" && python -m scheduler.run); }
life-dash()     { (cd "$LIFE_ROOT/dashboard" && npm run dev); }
