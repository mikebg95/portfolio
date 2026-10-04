#!/usr/bin/env bash
# Pause this project's loop.
#
#   .orchestrator/stop.sh          graceful: the task in flight finishes and
#                                  commits, then the loop exits
#   .orchestrator/stop.sh --now    hard: the driver and its agent stop now
#                                  (uncommitted work of the agent is lost)
#
# Either way PAUSED is left behind, so the launchd supervisor does not start it
# again. `.orchestrator/start.sh` clears it.
set -uo pipefail
ORCH=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

echo "paused by stop.sh at $(date '+%Y-%m-%d %H:%M:%S')" > "$ORCH/PAUSED"
pid=$(cat "$ORCH/run.pid" 2>/dev/null || true)
if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
  echo "not running — PAUSED written"
  exit 0
fi
if [[ "${1:-}" == "--now" ]]; then
  kill -TERM "$pid" && echo "stopped pid $pid now"
else
  echo "pausing: pid $pid exits after the current task commits"
fi
