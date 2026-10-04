#!/usr/bin/env bash
# Refuse to let an agent prompt carry a string another project's sweep matches.
#
# The prompt normally goes on stdin, where nothing can match it. But run.sh
# falls back to argv when stdin loses the prompt, and then every literal in the
# file sits in the agent's argv — where `pkill -f '<build command>'` from any
# session on this Mac SIGTERMs it mid-task. So the prompts never spell those
# commands; they name the scripts under .orchestrator/ that run them.
#
# If this fails, do not delete the pattern. Move the command into a script and
# name the script in the prompt.
set -uo pipefail
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
# shellcheck disable=SC1091
source "$HERE/config.sh"

bad=0
IFS='|' read -r -a patterns <<<"$SWEEP_LITERALS"
for f in "$HERE"/prompt.md "$HERE"/route.md "$HERE"/diagnose.md "$HERE"/recheck-blockers.md "$HERE"/gate-*.md; do
  [[ -f "$f" ]] || continue
  for pat in "${patterns[@]}"; do
    [[ -n "$pat" ]] || continue
    if hits=$(grep -n -F -- "$pat" "$f"); then
      bad=1
      echo "check-prompt-argv: ${f#"$ROOT"/} spells the sweep-matchable literal \"$pat\":" >&2
      printf '%s\n' "$hits" | sed 's/^/    /' >&2
    fi
  done
done
[[ "$bad" -eq 0 ]] || exit 1
echo "check-prompt-argv: no prompt carries a sweep-matchable literal"
