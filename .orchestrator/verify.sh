#!/usr/bin/env bash
# The full check, under a name no sibling project's `pkill -f` can match.
#
#   .orchestrator/verify.sh            the full check (VERIFY_CMD in config.sh)
#   .orchestrator/verify.sh e2e <spec> one browser spec, to tell a flake from a regression
#
# Why a script: an agent that TYPES the verify command carries that literal in
# its argv, and four loops plus interactive sessions on this Mac reap their own
# builds with `pkill -f '<that command>'` — which SIGTERMs the agent instead
# (exit 143, nothing committed; five iterations died that way on 2026-09-05).
# This script's own argv is just its path. It delegates to the package script
# and never restates its legs: restating them is how a check silently weakens.
#
# Queues on the machine-wide test lock. Prints `VERIFY_EXIT=<code>` as its
# LAST line and only then — poll for that marker, never for words in the output
# (a lint failure stops the chain before any "Test Files" line is printed).
set -uo pipefail
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
cd "$ROOT" || exit 1
# shellcheck disable=SC1091
source "$HERE/config.sh"

case "${1:-full}" in
  full)
    "$HERE/lock.sh" verify "$VERIFY_CMD"
    ;;
  e2e)
    shift
    [[ $# -gt 0 ]] || { echo "usage: verify.sh e2e <spec...>" >&2; exit 2; }
    "$HERE/lock.sh" verify "npx playwright test $*"
    ;;
  *)
    echo "usage: verify.sh [full | e2e <spec...>]" >&2
    exit 2
    ;;
esac
status=$?
echo "VERIFY_EXIT=$status"
exit "$status"
