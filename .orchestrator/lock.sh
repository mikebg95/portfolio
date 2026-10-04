#!/bin/bash
# Machine-wide queues, so loops sharing this Mac take turns instead of fighting.
#
#   .orchestrator/lock.sh verify <command...>          one test suite at a time
#   .orchestrator/lock.sh deploy <target> <command...> one deploy per box at a time
#
# Same lock FILES as vibegod's test-lock.sh and deploy-lock.sh (VG-48, VG-49):
# `~/.vibegod/locks/verify.lock` and `deploy-<box>.lock`. So this project queues
# behind vibegod's suites and deploys, and theirs behind this one. Four suites
# at once is how every one of them times out; two deploys to one Pi are two
# image transfers on one link and two migration runs on one SD card.
#
# The loser waits; it never dies. The lock is flock(2) taken by a stock tool
# (/usr/bin/lockf on macOS, flock on Linux), so a holder that dies releases it
# and there is no stale lock. Nothing is ever refused over bookkeeping: with no
# lock tool, or no lock folder, the command runs unlocked and says so.
#
# While queued for `verify`, `<pid>.wait` sits in $ORCHESTRATOR_LOCK_WAIT_DIR
# (run.sh exports it), so the iteration clock does not charge the wait.
set -u

usage() {
  echo "usage: $0 verify <command...>" >&2
  echo "       $0 deploy <target> <command...>" >&2
  exit 2
}
[ "$#" -ge 2 ] || usage
KIND="$1"; shift

LOCK_DIR="${VIBEGOD_LOCK_DIR:-$HOME/.vibegod/locks}"
case "$KIND" in
  verify)
    LOCK_FILE="$LOCK_DIR/verify.lock"
    ;;
  deploy)
    [ "$#" -ge 2 ] || usage
    # The box alone: user, port, path, scheme and `.local` dropped, so
    # pi@raspberrypi and raspberrypi.local meet on one lock. Keep in step with
    # vibegod's deploy-lock.sh.
    KEY=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E \
      -e 's/^[[:space:]]+//' -e 's/[[:space:]]+$//' \
      -e 's#^[a-z][a-z0-9+.-]*://##' -e 's/^.*@//' -e 's#[:/].*$##' \
      -e 's/\.+$//' -e 's/\.local$//' -e 's/[^a-z0-9.-]/-/g')
    shift
    [ -n "$KEY" ] || { echo "lock: deploy target names no machine" >&2; exit 2; }
    LOCK_FILE="$LOCK_DIR/deploy-$KEY.lock"
    ;;
  *) usage ;;
esac
COMMAND="$*"

if [ -x /usr/bin/lockf ]; then
  TOOL=(/usr/bin/lockf -k)
elif command -v flock >/dev/null 2>&1; then
  TOOL=(flock)
else
  echo "lock: no lockf or flock here — running unlocked" >&2
  exec /bin/sh -c "$COMMAND"
fi
if ! mkdir -p "$LOCK_DIR" 2>/dev/null; then
  echo "lock: cannot create $LOCK_DIR — running unlocked" >&2
  exec /bin/sh -c "$COMMAND"
fi

WAIT_DIR="${ORCHESTRATOR_LOCK_WAIT_DIR:-}"
if [ "$KIND" != verify ] || [ -z "$WAIT_DIR" ]; then
  exec "${TOOL[@]}" "$LOCK_FILE" /bin/sh -c "$COMMAND"
fi

# The marker goes down before queuing and the command removes it as its first
# act once the lock is held. A shell killed outright leaves one naming a dead
# pid, which run.sh ignores and removes.
m="$WAIT_DIR/$$.wait"
mkdir -p "$WAIT_DIR" 2>/dev/null
touch "$m" 2>/dev/null
trap 'rm -f "$m"; exit 143' HUP INT TERM
ORCH_LOCK_WAIT="$m" "${TOOL[@]}" "$LOCK_FILE" /bin/sh -c 'rm -f "$ORCH_LOCK_WAIT"; '"$COMMAND"
s=$?
rm -f "$m"
exit $s
