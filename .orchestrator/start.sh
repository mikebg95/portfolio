#!/usr/bin/env bash
# Start this project's loop, detached from whatever launched it.
#
#   .orchestrator/start.sh
#
# The `&` plus this script exiting reparents the loop to launchd, so closing a
# Claude Code session cannot take the run down with it. Every path is derived
# from this file's location — a renamed project needs no edit.
#
# Starting is an explicit act, so it clears a PAUSED marker — the fleet's
# `start.sh` did not, and a loop "started" that way was skipped by the
# supervisor on every tick afterwards. It refuses, though, when the marker was
# written in the last hour by someone else (another Claude session mid-swap);
# pass --force to override.
set -euo pipefail
ORCH=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT=$(cd "$ORCH/.." && pwd)
LOG="$ORCH/logs/loop-stdout.log"
mkdir -p "$(dirname "$LOG")"

# The driver guards itself with run.pid however it was launched; this check
# only gives the friendlier message.
if [[ -f "$ORCH/run.pid" ]]; then
  pid=$(cat "$ORCH/run.pid")
  if kill -0 "$pid" 2>/dev/null && ps -o command= -p "$pid" | grep -q 'run\.sh'; then
    echo "already running for $(basename "$PROJECT") — pid $pid" >&2
    exit 1
  fi
fi

[[ -f "$PROJECT/BACKLOG.md" ]] || { echo "no BACKLOG.md at $PROJECT — nothing to work on" >&2; exit 1; }

if [[ -f "$ORCH/PAUSED" ]]; then
  age=$(( $(date +%s) - $(stat -f %m "$ORCH/PAUSED" 2>/dev/null || stat -c %Y "$ORCH/PAUSED") ))
  if [[ "${1:-}" != "--force" ]] && (( age < 3600 )) && ! grep -q 'stop.sh' "$ORCH/PAUSED" 2>/dev/null; then
    echo "PAUSED was written $((age / 60))m ago by something other than stop.sh:" >&2
    sed 's/^/    /' "$ORCH/PAUSED" >&2
    echo "someone may be mid-operation — rerun with --force to start anyway" >&2
    exit 1
  fi
  rm -f "$ORCH/PAUSED"
fi

cd "$PROJECT"
nohup bash "$ORCH/run.sh" >> "$LOG" 2>&1 &
echo "$(basename "$PROJECT") loop started, pid $!"
echo "status: $ORCH/status.sh    pause: $ORCH/stop.sh"
