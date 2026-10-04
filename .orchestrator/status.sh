#!/usr/bin/env bash
# One screen: is it running, what is it doing, how far, what did it cost.
#
#   .orchestrator/status.sh        summary
#   .orchestrator/status.sh -f     follow the loop log
set -uo pipefail
ORCH=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$ORCH/.." && pwd)
cd "$ROOT" || exit 1
[[ "${1:-}" == "-f" ]] && exec tail -f "$ORCH/logs/loop-stdout.log"

n() { local c; c=$(grep -c "$1" "$2" 2>/dev/null) || c=0; echo "${c:-0}"; }
open=$(n '^- \[ \]' BACKLOG.md)
blocked=$(n '^- \[!\]' BACKLOG.md)
done_n=$(( $(n '^- \[x\]' BACKLOG.md) + $(n '^- \[x\]' BACKLOG-DONE.md) ))

pid=$(cat "$ORCH/run.pid" 2>/dev/null || true)
if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
  state="RUNNING (pid $pid, up $(ps -o etime= -p "$pid" | tr -d ' '))"
else
  state="not running"
fi
[[ -f "$ORCH/PAUSED" ]] && state="$state · PAUSED"
if [[ -f "$ORCH/logs/waiting.json" ]]; then
  r=$(sed -n 's/.*"resetsAt":\([0-9]*\).*/\1/p' "$ORCH/logs/waiting.json")
  [[ -n "$r" ]] && (( r > $(date +%s) )) && state="$state · waiting for usage limit until $(date -r "$r" '+%a %H:%M')"
fi

echo "$(basename "$ROOT"): $state"
echo "tasks: $done_n done · $open open · $blocked blocked"
[[ -f "$ORCH/STATUS" ]] && echo "now:   $(cat "$ORCH/STATUS")"
if [[ -f "$ORCH/.last-deployed" ]]; then
  behind=$(git rev-list --count "$(cat "$ORCH/.last-deployed")"..HEAD 2>/dev/null || echo "?")
  echo "box:   deployed $(cut -c1-7 "$ORCH/.last-deployed") · $behind commit(s) since"
fi
cost=$(grep -o 'run \$[0-9.]*' "$ORCH/logs/loop-stdout.log" 2>/dev/null | tail -1)
[[ -n "$cost" ]] && echo "cost:  ${cost#run } this run"
if [[ -f "$ORCH/progress.md" ]]; then
  echo; echo "latest:"; tail -5 "$ORCH/progress.md" | sed 's/^/  /'
fi
if (( blocked > 0 )); then
  echo; echo "blocked:"; grep '^- \[!\]' BACKLOG.md | sed -E 's/^- \[!\] //; s/\*\*//g' | cut -c1-140 | sed 's/^/  /'
fi
