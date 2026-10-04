#!/usr/bin/env bash
# Kill dev-server corpses left by a killed iteration, and NOTHING else.
#
# A killed iteration orphans its dev server (reparented to PID 1), and a
# framework whose dev lock is per DIRECTORY then refuses every later start —
# the next agents meet a red check they did not cause (2026-09-04, twice).
#
# THE FILTER IS THE POINT. A bare `pkill -f` on the server's name also matches
# any agent carrying that string in its argv. So: kill by PID, and only after
# `ps` shows no argv WORD is the agent binary — anywhere in the command line,
# because agents run as `timeout 90m claude …` and a starts-with test missed
# them and killed one on 2026-09-06.
#
# Run it BEFORE a check, never during one: it cannot tell a corpse from the
# live server a running e2e leg just started.
set -uo pipefail
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
# shellcheck disable=SC1091
source "$HERE/config.sh"

killed=0
while read -r pid; do
  [[ -n "$pid" && "$pid" != "$$" ]] || continue
  cmd=$(ps -o command= -p "$pid" 2>/dev/null) || continue
  is_agent=""
  for word in $cmd; do
    case "$word" in claude|*/claude) is_agent=yes; break ;; esac
  done
  [[ -n "$is_agent" ]] && continue
  # Only this project's servers: their cwd is inside this repository.
  cwd=$(lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p')
  [[ "$cwd" == "$ROOT" || "$cwd" == "$ROOT"/* ]] || continue
  echo "reaping orphaned dev server $pid: ${cmd:0:100}"
  kill "$pid" 2>/dev/null && killed=$(( killed + 1 ))
done < <(pgrep -f "$DEV_SERVER_PATTERN" 2>/dev/null)

if [[ "$killed" -eq 0 ]]; then echo "no dev-server corpses"; else sleep 2; echo "reaped $killed"; fi
