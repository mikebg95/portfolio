#!/bin/bash
# Stop hook: a loop TASK agent may not end its turn on a red task check.
# (From vibegod, where it is what made "done" mean green.)
#
# Only acts on agents the loop launched as tasks (ORCH_ROLE=task). The router,
# the review gates, the diagnosis, and every interactive session pass straight
# through — the router alone runs once per task and must never pay for a check.
#
# Cheap when the agent already ran the check: task-check.sh leaves a stamp of
# the code it passed on, and a stamp that still matches skips the re-run (ticks
# in BACKLOG.md and notes in docs do not change the stamp).
#
# Contract: stdout {"decision":"block","reason":…} keeps the agent working.
# Always exits 0 — a broken hook must never wedge a run.
set -uo pipefail
[ "${ORCH_ROLE:-}" = "task" ] || exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR" || exit 0
ORCH="$PROJECT_DIR/.orchestrator"
INPUT="$(cat)"

block() { jq -nc --arg r "$1" '{decision:"block", reason:$r}'; exit 0; }

# Already continuing because of this hook: let it stop, or it loops forever.
[ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0

# The agent declared its task blocked — forcing it on would burn the iteration.
if [ -n "${TASK_CHECK_SINCE:-}" ] && git diff "$TASK_CHECK_SINCE" -- BACKLOG.md 2>/dev/null | grep -q '^+- \[!\]'; then
  exit 0
fi

# Nothing changed this iteration: nothing to check.
if [ -n "${TASK_CHECK_SINCE:-}" ] && [ "$(git rev-parse HEAD)" = "$TASK_CHECK_SINCE" ] && [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

# A check already passed on exactly this code.
if [ -f "$ORCH/.task-check-pass" ] && [ "$(cat "$ORCH/.task-check-pass")" = "$("$ORCH/task-check.sh" --fingerprint)" ]; then
  exit 0
fi

OUTPUT="$("$ORCH/lock.sh" verify "$ORCH/task-check.sh" 2>&1)"
if [ $? -ne 0 ]; then
  block "The task check (.orchestrator/task-check.sh) is failing, so this task is not done. Fix the cause and re-run it until its last line is TASK_CHECK_EXIT=0, then commit. Never weaken, skip or delete a check. If the task truly cannot be finished, mark it '- [!] … - BLOCKED: <reason>' in BACKLOG.md, commit, and stop. Last 40 lines:

$(printf '%s\n' "$OUTPUT" | tail -n 40)"
fi
exit 0
