#!/usr/bin/env bash
# Unattended orchestrator: works BACKLOG.md one task per fresh agent, then
# checks, deploys, and compares the release with the designs.
#
# Merged 2026-09-25 from the five loops that ran on this Mac — kalistenix,
# dominio-de-ingles, mathaverse, Wayfolk and vibegod — keeping the newest fix
# of every fault any of them hit. Nothing project-specific lives here: settings
# are in .orchestrator/config.sh. See the kit's COMPARISON.md for where each
# piece came from.
#
# BACKLOG.md is the source of truth. The loop's measure of progress is work
# SETTLED — `- [x]` (in BACKLOG.md or BACKLOG-DONE.md) plus `- [!]` — never the
# remaining count, because a task may split itself and raise that count while
# genuinely making progress.
#
# Pause:  .orchestrator/stop.sh        (the task in flight finishes and commits)
# Status: .orchestrator/status.sh
set -uo pipefail

ORCH=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$ORCH/.." && pwd)
cd "$ROOT" || exit 1
ORCH_REL=${ORCH#"$ROOT"/}
SELF="$ORCH/run.sh"

stamp() { date '+%Y-%m-%dT%H:%M:%S%z'; }
say() { echo "$(stamp) $*"; }
die() { say "FATAL: $*" >&2; FINAL_STATE="FATAL"; exit 1; }

# shellcheck disable=SC1091
[[ -f "$ORCH/config.sh" ]] || { say "FATAL: $ORCH_REL/config.sh is missing" >&2; exit 1; }
# shellcheck disable=SC1091
source "$ORCH/config.sh"

LOG_ROOT="$ORCH/logs"
STATUS_FILE="$ORCH/STATUS"
PROGRESS="$ORCH/progress.md"        # plain-English, one line per event, for a human
PIDFILE="$ORCH/run.pid"
GATE_STATE_FILE="$ORCH/gate-state"
REGRESS_STATE="$ORCH/.regress-attempts"
DESIGN_CHECK_MARKER="$ORCH/design-check-done"
mkdir -p "$LOG_ROOT"

# ─── One driver per repository ───────────────────────────────────────────────
#
# Two drivers on one repo race on the same checkbox and corrupt each other's
# work. The fleet's guard was `pgrep -f "$PROJECT/.orchestrator/run.sh"`, which
# only sees loops started by that exact absolute path — a loop started by hand
# as `bash ./.orchestrator/run.sh` ran 21h invisible to it (2026-09-13). A pid
# file is checked by the driver itself however it was launched. `exec` keeps
# the pid, so the re-execs below pass their own check.
if [[ -f "$PIDFILE" ]]; then
  other=$(cat "$PIDFILE" 2>/dev/null)
  if [[ "$other" =~ ^[0-9]+$ && "$other" != "$$" ]] && kill -0 "$other" 2>/dev/null \
     && ps -o command= -p "$other" 2>/dev/null | grep -q 'run\.sh'; then
    say "FATAL: a driver is already running for this repository (pid $other)" >&2
    exit 1
  fi
fi
echo $$ > "$PIDFILE"

# ─── One log directory per run ───────────────────────────────────────────────
# The old loops wrote iter-1.jsonl … afresh on every start, so each restart
# overwrote the last run's transcripts — the evidence a diagnosis needs.
if [[ -z "${ORCH_RUN_DIR:-}" || ! -d "${ORCH_RUN_DIR:-}" ]]; then
  ORCH_RUN_DIR="$LOG_ROOT/run-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$ORCH_RUN_DIR"
  ln -sfn "$(basename "$ORCH_RUN_DIR")" "$LOG_ROOT/latest"
fi
export ORCH_RUN_DIR
LOG_DIR="$ORCH_RUN_DIR"
export ORCHESTRATOR_LOCK_WAIT_DIR="$LOG_ROOT/lock-wait"

# A fresh start forgets the last run's repair count; only the re-exec that
# follows a failed pre-deploy check carries it forward.
[[ "${ORCH_REGRESS_REDEPLOY:-0}" == "1" ]] || rm -f "$REGRESS_STATE"

# ─── Staying awake ───────────────────────────────────────────────────────────
# A nap freezes every `sleep` (macOS counts it on a clock that stops with the
# machine); a usage-limit wait overshot its reset by 18 minutes that way. Bound
# to $$ so it dies with this driver. The limit waits below also read the wall
# clock, so a nap that happens anyway costs one poll interval, not the nap.
command -v caffeinate >/dev/null 2>&1 && caffeinate -i -m -s -w $$ >/dev/null 2>&1 &

# ─── Environment ─────────────────────────────────────────────────────────────
#
# launchd and cron start with a bare PATH: `claude` (~/.local/bin) and
# coreutils' timeout were both missing, loops died with exit 127, and 127 was
# logged as "API refused the run". Homebrew is APPENDED so its node never
# outranks nvm's — prepending it silently moved a suite from v22 to v26.
PATH="$HOME/.local/bin:$PATH"
[[ -d /opt/homebrew/bin ]] && PATH="$PATH:/opt/homebrew/bin"
[[ -d /usr/local/bin ]] && PATH="$PATH:/usr/local/bin"
export PATH

# nvm first and unconditionally. A rescue-only nvm ("is there a usable node?")
# is satisfied by any unrelated node that is merely new enough.
# shellcheck disable=SC1090,SC1091
[[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]] && . "${NVM_DIR:-$HOME/.nvm}/nvm.sh" >/dev/null 2>&1

# An API key outranks the claude.ai login, silently: an unattended run once
# billed a pay-as-you-go account with no credit and burned its stalls in 20
# minutes on "Credit balance is too low".
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN

CLAUDE_BIN=${CLAUDE_BIN:-$(command -v claude 2>/dev/null || echo "$HOME/.local/bin/claude")}
[[ -x "$CLAUDE_BIN" ]] || die "no claude binary (looked for $CLAUDE_BIN) — set CLAUDE_BIN"

if command -v timeout >/dev/null 2>&1; then TIMEOUT_BIN=$(command -v timeout)
elif command -v gtimeout >/dev/null 2>&1; then TIMEOUT_BIN=$(command -v gtimeout)
else die "no timeout(1) on PATH — brew install coreutils"; fi

# jq is not optional: without it the rate-limit reset reads as empty and every
# usage limit becomes a blind backoff.
for bin in $REQUIRED_BINS; do
  command -v "$bin" >/dev/null 2>&1 || die "$bin is not on PATH — the loop or the suite needs it"
done

if [[ "$REQUIRE_NODE" == "auto" ]]; then
  if [[ -f package.json ]]; then REQUIRE_NODE=1; else REQUIRE_NODE=0; fi
fi
if [[ "$REQUIRE_NODE" == "1" ]]; then
  node_ok=$(node -p 'process.versions.node.split(".").slice(0,2).map(Number).reduce((a,b)=>a*1000+b)' 2>/dev/null || echo 0)
  (( node_ok >= MIN_NODE_VERSION )) || die "node $(node -v 2>/dev/null || echo 'not found') is too old to run the check"
  node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
  if [[ -n "$EXPECTED_NODE_MAJOR" && "$node_major" != "$EXPECTED_NODE_MAJOR" ]]; then
    say "WARNING: node $(node -v) — this repo is built on $EXPECTED_NODE_MAJOR.x; failures below may be the runtime, not the task"
  fi
  say "node $(node -v) at $(command -v node)"
fi

# ─── The loop's own inputs, checked before anything is spent ─────────────────
# A missing or EMPTY prompt does not fail the launch — the agent starts with no
# instructions and does something arbitrary while the loop counts it as normal.
for required in "$ORCH/prompt.md" BACKLOG.md; do
  [[ -s "$required" ]] || die "${required#"$ROOT"/} is missing or empty — an agent would launch with no instructions"
done
[[ "$ROUTER" == "1" && ! -s "$ORCH/route.md" ]] && { say "no route.md — every task runs $DEFAULT_MODEL/$DEFAULT_EFFORT"; ROUTER=0; }
if [[ -x "$ORCH/check-prompt-argv.sh" ]]; then
  "$ORCH/check-prompt-argv.sh" >/dev/null || die "a prompt spells a sweep-matchable command — see check-prompt-argv.sh output above"
fi

# ─── Counting ────────────────────────────────────────────────────────────────
# grep -c prints 0 AND exits 1 on no match; `|| echo 0` would make "0\n0".
count_in() { local n; n=$(grep -c "$1" "$2" 2>/dev/null) || n=0; echo "${n:-0}"; }
remaining() { count_in '^- \[ \]' BACKLOG.md; }
blocked() { count_in '^- \[!\]' BACKLOG.md; }
# Done tasks are pruned into BACKLOG-DONE.md in the same round they are ticked,
# so the archive must be counted or real progress reads as a stall.
settled() {
  echo $(( $(count_in '^- \[x\]' BACKLOG.md) + $(count_in '^- \[x\]' BACKLOG-DONE.md) + $(blocked) ))
}
current_task() { grep -m1 '^- \[ \]' BACKLOG.md 2>/dev/null | sed -E 's/^- \[ \] //; s/\*\*//g' | cut -c1-80; }
task_id() { sed -E 's/^- \[.\] \*\*([A-Za-z0-9._-]+).*/\1/' <<<"$1"; }

write_status() { printf '%s\n' "$*" > "$STATUS_FILE"; }
progress() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M')" "$*" >> "$PROGRESS"; }
notify() {
  [[ "$NOTIFY" == "1" ]] || return 0
  local t="${1//\"/}" m="${2//\"/}"
  osascript -e "display notification \"${m//\\/}\" with title \"${t//\\/}\"" >/dev/null 2>&1 || true
}
human_time() { date -r "$1" '+%a %H:%M' 2>/dev/null || date -d "@$1" '+%a %H:%M' 2>/dev/null || echo "$1"; }

# ─── Reading an agent's transcript ───────────────────────────────────────────
# The result record by TYPE, not `tail -5`: a session with background tasks
# still alive writes several lines after it, and a fixed window read $0.00.
iteration_cost() {
  grep '"type":"result"' "$1" 2>/dev/null | tail -1 | jq -Rrs '
    [ splits("\n") | select(length > 0) | (fromjson? // empty)
      | select(.type == "result") ] | last
    | if . then "\(.total_cost_usd // 0)|\(.num_turns // 0)|\(.usage.cache_read_input_tokens // 0)"
      else "0|0|0" end' 2>/dev/null || echo "0|0|0"
}

# The epoch second a refused window reopens. Only a `rejected` event means the
# run was refused — the same event type is an advisory while a run is still
# allowed, and sleeping on one would idle the loop for hours over nothing.
rate_limit_reset() {
  grep '"type":"rate_limit_event"' "$1" 2>/dev/null | tail -20 \
    | jq -Rr '(fromjson? // empty) | select(.rate_limit_info.status == "rejected")
              | .rate_limit_info.resetsAt // empty' 2>/dev/null | tail -1
}
hit_limit() { grep -qi 'hit your session limit\|hit your usage limit\|"api_error_status":429' "$1" 2>/dev/null; }

# The prompt never reached the model: exit 0, an assistant message, and not a
# single tool call. Any real task reads a file. A genuine refusal has no
# assistant message, so it does not match and falls through to the backoff.
prompt_swallowed() {
  grep -q '"type":"assistant"' "$1" 2>/dev/null && ! grep -q '"type":"tool_use"' "$1" 2>/dev/null
}

# The supervisor reads this to tell "asleep on a limit" from "wedged" — without
# it, it killed two loops mid-wait on 2026-09-21. Trusted only while resetsAt
# is in the future, so a note left by a SIGKILLed loop cannot fake liveness.
waiting_note() {
  if [[ -n "${1:-}" ]]; then
    printf '{"resetsAt":%s,"since":%s,"iteration":%s}\n' "$1" "$(date +%s)" "${2:-0}" > "$LOG_ROOT/waiting.json"
  else
    rm -f "$LOG_ROOT/waiting.json"
  fi
}

# Sleep to an ABSOLUTE time by polling the wall clock — a `sleep <duration>`
# stops counting while the Mac naps.
sleep_until() { local deadline=$1; while (( $(date +%s) < deadline )); do sleep 15; done; }

# A laptop that wakes without wifi must not spend backoffs discovering it. Any
# HTTP answer counts as reachable — this holds no credential to earn a 200.
wait_for_network() {
  local what="${1:-?}" waited=0
  while ! curl -sS --max-time 10 -o /dev/null https://api.anthropic.com >/dev/null 2>&1; do
    (( waited == 0 )) && say "$what: no route to the API — holding until the network is back"
    sleep 15; waited=$(( waited + 15 ))
  done
  (( waited > 0 )) && say "$what: network back after ${waited}s"
  return 0
}

# Wait out a usage limit named in LOG. 0 = waited, go again. 1 = no usable
# reset time (caller backs off). 2 = too far / too many waits (caller stops).
LIMIT_WAITS=0
wait_out_limit() {
  local log=$1 what=$2 reset now
  reset=$(rate_limit_reset "$log")
  now=$(date +%s)
  [[ "$reset" =~ ^[0-9]+$ ]] && (( reset > now )) || return 1
  LIMIT_WAITS=$(( LIMIT_WAITS + 1 ))
  if (( reset - now + RESET_GRACE_SECONDS > MAX_WAIT_SECONDS )); then
    say "$what: limit resets $(human_time "$reset"), $(( (reset - now) / 3600 ))h away — too far to wait out"
    return 2
  fi
  if (( LIMIT_WAITS > MAX_LIMIT_WAITS )); then
    say "$what: waited out $MAX_LIMIT_WAITS limit windows this run already"
    return 2
  fi
  say "$what: usage limit — sleeping until $(human_time "$reset") (+${RESET_GRACE_SECONDS}s), wait $LIMIT_WAITS/$MAX_LIMIT_WAITS"
  write_status "WAITING | usage limit resets $(human_time "$reset") | since $(date +%H:%M)"
  waiting_note "$reset" "$SEQ"
  sleep_until $(( reset + RESET_GRACE_SECONDS ))
  wait_for_network "$what"
  waiting_note ""
  say "$what: limit window reopened"
  return 0
}
RESET_GRACE_SECONDS=${RESET_GRACE_SECONDS:-90}
MAX_WAIT_SECONDS=${MAX_WAIT_SECONDS:-$((8 * 3600))}   # a weekly limit is a human's call
MAX_LIMIT_WAITS=${MAX_LIMIT_WAITS:-6}
MAX_BACKOFFS=${MAX_BACKOFFS:-8}                        # refusals with NO reset time, in a row
BACKOFF_SECONDS=${BACKOFF_SECONDS:-20}                 # doubles each time — a blip costs seconds
MAX_BACKOFF_SECONDS=${MAX_BACKOFF_SECONDS:-300}
MAX_SWALLOWED=${MAX_SWALLOWED:-5}
SHORT_RUN_SECONDS=${SHORT_RUN_SECONDS:-60}

# ─── Running an agent ────────────────────────────────────────────────────────
#
# run_capped <work-seconds> <backstop> <stdin-file> <command...>
#
# The agent runs in the background so the clock can skip time it spends queued
# on the machine-wide test lock (a `<pid>.wait` marker in the lock-wait dir):
# a check queued behind three other projects' suites must not eat the task.
# `timeout <backstop>` underneath catches a queue that never moves; it leads
# its own process group, so the whole tree can be killed. Returns 124 on
# either cap. stdin is redirected INSIDE, explicitly: a background job in a
# non-interactive shell otherwise gets /dev/null, which would silently deliver
# an empty prompt.
CAPPED_PID=""
lock_wait_live() {
  local m pid live=1
  for m in "$ORCHESTRATOR_LOCK_WAIT_DIR"/*.wait; do
    [[ -e "$m" ]] || continue
    pid=${m##*/}; pid=${pid%.wait}
    [[ "$pid" =~ ^[0-9]+$ ]] || continue
    if kill -0 "$pid" 2>/dev/null; then live=0; else rm -f "$m"; fi
  done
  return $live
}
run_capped() {
  local cap=$1 backstop=$2 input=$3 charged=0 tick=${LOCK_TICK_SECS:-5} status
  shift 3
  RUN_CAPPED_BY=""
  "$TIMEOUT_BIN" "$backstop" "$@" < "$input" &
  CAPPED_PID=$!
  while kill -0 "$CAPPED_PID" 2>/dev/null; do
    sleep "$tick"
    lock_wait_live || charged=$(( charged + tick ))
    if (( charged >= cap )) && kill -0 "$CAPPED_PID" 2>/dev/null; then
      RUN_CAPPED_BY=working
      kill -TERM -- "-$CAPPED_PID" 2>/dev/null || kill -TERM "$CAPPED_PID" 2>/dev/null
      local grace=0
      while kill -0 "$CAPPED_PID" 2>/dev/null && (( grace < 30 )); do sleep 1; grace=$(( grace + 1 )); done
      kill -KILL -- "-$CAPPED_PID" 2>/dev/null
      wait "$CAPPED_PID" 2>/dev/null
      CAPPED_PID=""
      return 124
    fi
  done
  wait "$CAPPED_PID"; status=$?
  CAPPED_PID=""
  (( status == 124 )) && RUN_CAPPED_BY=backstop
  return $status
}

# One agent call with a prompt FILE. The prompt goes on STDIN: as `-p "$(cat
# …)"` the whole file sits in argv, and `pkill -f '<build command>'` from any
# session on this Mac killed agents mid-task (five in one day). The argv form
# is only the fallback for when stdin demonstrably loses the prompt, and then
# check-prompt-argv.sh has kept the file free of sweepable literals.
#
# NO --exclude-dynamic-system-prompt-sections, anywhere: with the prompt on
# stdin it hands claude-sonnet-5 an EMPTY request (2026-09-22, four wasted
# iterations and a loop backing off with no error anywhere).
#
# ORCH_ROLE tells the Stop hook what kind of agent this is; it only checks
# `task` agents, never the router, a gate, or a human's interactive session.
agent() {  # agent <role> <prompt-file> <log> <work-seconds> <backstop> <model> <effort> <budget>
  local role=$1 prompt=$2 log=$3 work=$4 backstop=$5 model=$6 effort=$7 budget=$8
  local -a args=(--model "$model" --effort "$effort" --max-budget-usd "$budget"
                 --dangerously-skip-permissions --output-format stream-json --verbose)
  if [[ -f "$ORCH/prompt-on-argv" ]]; then
    ORCH_ROLE=$role run_capped "$work" "$backstop" /dev/null \
      "$CLAUDE_BIN" -p "$(cat "$prompt")" "${args[@]}" > "$log" 2>&1
  else
    ORCH_ROLE=$role run_capped "$work" "$backstop" "$prompt" \
      "$CLAUDE_BIN" -p "${args[@]}" > "$log" 2>&1
  fi
}

# ─── Routing ─────────────────────────────────────────────────────────────────
# One cheap Haiku pass reads the next task and picks the tier. Every failure
# lands on the default (opus/high) — a rate limit, a truncated reply or an
# unknown enum must never silently downgrade a task. Two attempts, because an
# unparseable reply is a coin toss that always lands on the expensive side.
ROUTE_SCHEMA='{"type":"object","properties":{"model":{"enum":["opus","sonnet"]},"effort":{"enum":["medium","high","xhigh"]},"reason":{"type":"string"}},"required":["model","effort","reason"]}'
route_next_task() {
  MODEL=$DEFAULT_MODEL; EFFORT=$DEFAULT_EFFORT; REASON="router off"
  [[ "$ROUTER" == "1" ]] || return 0
  local raw obj m e r attempt failure=""
  for attempt in 1 2; do
    # --effort low: without it the router inherits high effort and spends
    # ~800 thinking tokens on a two-field answer.
    raw=$(ORCH_ROLE=router "$TIMEOUT_BIN" 3m "$CLAUDE_BIN" -p --model haiku --effort low \
            --output-format json --json-schema "$ROUTE_SCHEMA" --dangerously-skip-permissions \
            < "$ORCH/route.md" 2>/dev/null) || { failure="router call failed"; continue; }
    obj=$(jq -c '[.. | objects | select(has("model") and has("effort"))] | first // empty' <<<"$raw" 2>/dev/null)
    if [[ -z "$obj" ]]; then
      obj=$(jq -r '.result // empty' <<<"$raw" 2>/dev/null | jq -c 'fromjson? // .' 2>/dev/null \
            | jq -c '[.. | objects | select(has("model") and has("effort"))] | first // empty' 2>/dev/null)
    fi
    [[ -n "$obj" ]] && break
    failure="router returned no usable JSON"
  done
  if [[ -z "$obj" ]]; then REASON="$failure twice — defaulting"; return 0; fi
  m=$(jq -r '.model // empty' <<<"$obj"); e=$(jq -r '.effort // empty' <<<"$obj")
  r=$(jq -r '.reason // empty' <<<"$obj" | tr '\n' ' ' | cut -c1-140)
  [[ "$m" =~ ^(opus|sonnet)$ ]] && MODEL=$m || r="${r:+$r; }unknown model '$m' — default"
  [[ "$e" =~ ^(medium|high|xhigh)$ ]] && EFFORT=$e || r="${r:+$r; }unknown effort '$e' — default"
  if [[ "$MODEL" == sonnet && -f "$ORCH/no-sonnet" ]]; then MODEL=opus; r="${r:+$r; }sonnet disabled by no-sonnet"; fi
  REASON=${r:-"no reason given"}
}

# ─── Keeping an edited run.sh from being ignored ─────────────────────────────
# Bash parses the whole loop body at startup, so a fix to this file never
# reached a loop already running — kills went on for hours after one landed.
# Between iterations (never mid-task) the driver checks whether run.sh or
# config.sh changed and, if the new file parses, re-execs itself onto it.
# Replace these files with `/bin/mv -f` (a new inode), never edit in place.
fingerprint() { cat "$SELF" "$ORCH/config.sh" 2>/dev/null | cksum | cut -d' ' -f1; }
START_FINGERPRINT=$(fingerprint)
reexec_if_changed() {
  [[ "$(fingerprint)" == "$START_FINGERPRINT" ]] && return 0
  if bash -n "$SELF" 2>/dev/null; then
    say "run.sh or config.sh changed on disk — re-executing onto the new version"
    ORCH_RUN_COST=$RUN_COST ORCH_SEQ=$SEQ exec bash "$SELF"
  fi
  say "run.sh changed on disk but does not parse — staying on the running version"
  START_FINGERPRINT=$(fingerprint)
}

# ─── The pre-deploy gate (a stage machine) ───────────────────────────────────
#
# An empty queue starts the gate rather than ending the run — when the gate is
# on (it is OFF by default; see config.sh). GATE_SEQUENCE is walked one stage
# at a time and each stage gets the queue to ITSELF: a stage that writes tasks
# returns to the loop, which fixes them, and only when the queue empties again
# does the next stage start — so qa walks the code simplify's tasks already
# changed, and verify checks fixes that have settled. A stage that finds
# nothing falls straight through. `verify` repeats up to VERIFY_MAX_ROUNDS
# while it still writes REGRESS- tasks, then the release goes out regardless
# (Michael: "repeat it maximum 3 times, after that deploy"). Nothing edits the
# app after verification.
#
# The position survives restarts (a reboot mid-gate once cost a whole second
# simplify+qa round), but only while every open task is one the gate wrote —
# otherwise new work would skip the stages that never saw it.
gate_owns_queue() {
  local foreign
  foreign=$(grep '^- \[ \]' BACKLOG.md 2>/dev/null | grep -cvE "^- \[ \] \*\*($GATE_TASK_PREFIXES)-") || foreign=0
  [[ "${foreign:-0}" == "0" ]]
}
save_gate_state() {
  printf 'stage_index=%s\nverify_rounds=%s\ngate_rounds=%s\n' "$STAGE_INDEX" "$VERIFY_ROUNDS" "$GATE_ROUNDS" > "$GATE_STATE_FILE"
}
load_gate_state() {
  STAGE_INDEX=0; VERIFY_ROUNDS=0; GATE_ROUNDS=0
  [[ -f "$GATE_STATE_FILE" ]] || return 0
  if ! gate_owns_queue; then
    say "gate: dropping the saved position — the queue holds work the gate did not write"
    rm -f "$GATE_STATE_FILE"; return 0
  fi
  local key value
  while IFS='=' read -r key value; do
    [[ "$value" =~ ^[0-9]+$ ]] || continue
    case "$key" in
      stage_index) STAGE_INDEX=$value ;; verify_rounds) VERIFY_ROUNDS=$value ;; gate_rounds) GATE_ROUNDS=$value ;;
    esac
  done < "$GATE_STATE_FILE"
  (( GATE_ROUNDS > 0 )) && say "gate: resuming at stage $((STAGE_INDEX + 1)) of the sequence, $GATE_ROUNDS round(s) run"
  return 0
}
read -r -a GATE_STAGES <<<"$GATE_SEQUENCE"
load_gate_state
GATE_EXHAUSTED=0

# One stage, to completion. A walk keeps `$ORCH/<phase>-progress.md` (one
# `- [ ]` per screen/route/fix, written first, ticked as it goes), so a killed
# attempt resumes instead of starting over, and the phase is re-entered until
# the list is walked out — a walk is ONE task, never skipped and never done
# twice. The backstop is progress, not attempts: stop only after
# GATE_STUCK_ATTEMPTS attempts in a row tick nothing. A usage limit is waited
# out and NOT charged to the phase (two of six qa attempts once died on a
# limit and the round closed with fourteen screens never walked).
run_gate_phase() {
  local phase=$1 prompt="$ORCH/gate-$1.md" progress="$ORCH/$1-progress.md"
  local attempt=0 last_left=999999 stuck=0 left log
  [[ -s "$prompt" ]] || { say "gate: no gate-$phase.md — skipping $phase"; return 0; }
  while :; do
    attempt=$(( attempt + 1 )); SEQ=$(( SEQ + 1 ))
    log="$LOG_DIR/gate-$GATE_ROUNDS-$phase-$attempt.jsonl"
    say "gate round $GATE_ROUNDS: $phase (attempt $attempt)"
    write_status "GATE | $phase | round $GATE_ROUNDS | attempt $attempt | since $(date +%H:%M)"
    agent gate "$prompt" "$log" $(( $(to_seconds "$GATE_TIMEOUT") )) "$GATE_TIMEOUT" \
      "$GATE_MODEL" "$GATE_EFFORT" "$GATE_BUDGET_USD" || say "gate: $phase attempt $attempt exited non-zero — $log"
    if hit_limit "$log"; then
      wait_out_limit "$log" "gate $phase"
      case $? in 0) continue ;; 2) return 2 ;; esac
    fi
    [[ -f "$progress" ]] || break
    left=$(count_in '^- \[ \]' "$progress")
    if (( left == 0 )); then say "gate: $phase finished everything on its list"; rm -f "$progress"; break; fi
    if (( left >= last_left )); then stuck=$(( stuck + 1 )); else stuck=0; fi
    last_left=$left
    if (( stuck >= GATE_STUCK_ATTEMPTS )); then
      say "gate: $phase has $left entr(y/ies) left and $stuck attempts in a row ticked nothing — stopping the walk"
      mv -f "$progress" "$progress.abandoned-$(date +%Y%m%d-%H%M)"
      break
    fi
    say "gate: $phase has $left entr(y/ies) left — resuming"
  done
  [[ "$phase" == simplify ]] && git rev-parse HEAD > "$ORCH/.last-simplified" 2>/dev/null
  return 0
}
to_seconds() {  # 90m / 6h / 45 → seconds
  local v=$1
  case "$v" in *h) echo $(( ${v%h} * 3600 )) ;; *m) echo $(( ${v%m} * 60 )) ;; *s) echo "${v%s}" ;; *) echo "$v" ;; esac
}

# 0 = ready to release. 1 = a stage wrote work; go drain it. 2 = stop (limit).
run_predeploy_gate() {
  # A re-exec to repair the full check or fix design mismatches goes straight
  # back to the release: the gate already passed it, and "fix those and deploy
  # again. thats it".
  if [[ "${ORCH_SKIP_GATE:-0}" == "1" ]]; then
    say "gate: skipped — this run is repairing the release it already reviewed"; return 0
  fi
  [[ "$PREDEPLOY_GATE" == "1" ]] || return 0
  local phase before after
  while (( STAGE_INDEX < ${#GATE_STAGES[@]} )); do
    if (( GATE_ROUNDS >= GATE_MAX_ROUNDS )); then
      say "gate: $GATE_ROUNDS rounds run and still finding work — shipping anyway, with a note"
      GATE_EXHAUSTED=1; return 0
    fi
    phase=${GATE_STAGES[$STAGE_INDEX]}
    if [[ "$phase" == verify ]]; then
      if (( VERIFY_ROUNDS >= VERIFY_MAX_ROUNDS )); then
        say "gate: $VERIFY_MAX_ROUNDS verification rounds spent — moving on"
        STAGE_INDEX=$(( STAGE_INDEX + 1 )); VERIFY_ROUNDS=0; save_gate_state; continue
      fi
      VERIFY_ROUNDS=$(( VERIFY_ROUNDS + 1 ))
    fi
    GATE_ROUNDS=$(( GATE_ROUNDS + 1 )); save_gate_state
    before=$(remaining)
    run_gate_phase "$phase" || return 2
    after=$(remaining)
    if (( after > before )); then
      # verify stays on its stage and comes back for another round once its
      # findings are fixed; every other stage advances.
      [[ "$phase" == verify ]] || STAGE_INDEX=$(( STAGE_INDEX + 1 ))
      save_gate_state
      say "gate: $phase wrote $(( after - before )) task(s) — fixing them before the next stage"
      progress "Review ($phase) found $(( after - before )) thing(s) to fix; working on them before shipping."
      return 1
    fi
    say "gate: $phase found nothing"
    STAGE_INDEX=$(( STAGE_INDEX + 1 )); VERIFY_ROUNDS=0; save_gate_state
  done
  say "gate: every stage is clean — the release is ready"
  return 0
}

# ─── Blockers ────────────────────────────────────────────────────────────────
# A `- [!]` was written once and never re-checked: four of six across the fleet
# were false on 2026-09-12 (the file had been there eight days, the login was
# done, the account existed). One agent per run start checks each against the
# machine and reopens the ones that no longer hold.
recheck_blockers() {
  [[ "$RECHECK_BLOCKERS" == "1" && -s "$ORCH/recheck-blockers.md" ]] || return 0
  (( $(blocked) > 0 )) || return 0
  local log="$LOG_DIR/recheck-blockers.jsonl" before
  before=$(blocked)
  say "blockers: re-checking $before blocked task(s) against the machine"
  SEQ=$(( SEQ + 1 ))
  agent blockers "$ORCH/recheck-blockers.md" "$log" 1800 45m opus medium 5 || true
  (( $(blocked) < before )) && progress "Re-checked the blocked tasks: $(( before - $(blocked) )) were not really blocked any more and are back in the queue."
  say "blockers: $(blocked) still blocked"
}

# ─── Exit ────────────────────────────────────────────────────────────────────
FINAL_STATE=""
on_exit() {
  local state=${FINAL_STATE:-INTERRUPTED}
  # A driver stopped hard takes its agent down with it rather than orphaning it.
  # (A graceful pause never gets here mid-task: stop.sh writes PAUSED and the
  # loop leaves between iterations.)
  if [[ -n "${CAPPED_PID:-}" ]]; then
    kill -TERM -- "-$CAPPED_PID" 2>/dev/null || kill -TERM "$CAPPED_PID" 2>/dev/null
  fi
  waiting_note ""
  write_status "$state | $(remaining) open, $(blocked) blocked | run \$${RUN_COST:-0} | ended $(date '+%a %H:%M')"
  [[ "$(cat "$PIDFILE" 2>/dev/null)" == "$$" ]] && rm -f "$PIDFILE"
}
trap on_exit EXIT
trap 'FINAL_STATE=STOPPED; exit 143' TERM INT HUP

# ─── Start ───────────────────────────────────────────────────────────────────
RUN_COST=${ORCH_RUN_COST:-0}
SEQ=${ORCH_SEQ:-0}
stalls=0; backoffs=0; swallowed=0

say "start: $(remaining) task(s) open, $(blocked) blocked — logs in ${LOG_DIR#"$ROOT"/}"
[[ -f "$ORCH/prompt-on-argv" ]] && say "the prompt goes on the command line ($ORCH_REL/prompt-on-argv is set)"
if command -v python3 >/dev/null 2>&1 && [[ -f "$ORCH/context-report.py" ]]; then
  while IFS= read -r line; do [[ -n "$line" ]] && say "$line"; done < <(python3 "$ORCH/context-report.py" 2>&1)
fi

if [[ "$BASELINE_VERIFY" == "1" && -z "${ORCH_RUN_COST:-}" ]]; then
  say "baseline: running the full check before the first task"
  if ! "$ORCH/verify.sh" > "$LOG_DIR/baseline-verify.log" 2>&1; then
    progress "Did not start: the project was already failing its checks before the first task. See ${LOG_DIR#"$ROOT"/}/baseline-verify.log."
    notify "$PROJECT_NAME: not started" "The project already fails its checks."
    FINAL_STATE="RED_BASELINE"; exit 1
  fi
fi

[[ -z "${ORCH_RUN_COST:-}" ]] && recheck_blockers
BLOCKED_AT_START=$(blocked)
[[ -z "${ORCH_RUN_COST:-}" ]] && progress "Started with $(remaining) task(s) to do."

# ─── The loop ────────────────────────────────────────────────────────────────
for ((i = 1; i <= MAX_ITERATIONS; i++)); do
  if [[ -f "$ORCH/PAUSED" ]]; then
    say "PAUSED file present — stopping between tasks"; FINAL_STATE="PAUSED"; break
  fi
  reexec_if_changed

  before=$(remaining)
  settled_before=$(settled)
  if (( before == 0 )); then
    run_predeploy_gate; gate=$?
    if (( gate == 0 )); then FINAL_STATE="QUEUE_EMPTY"; break; fi
    if (( gate == 2 )); then FINAL_STATE="RATE_LIMITED"; break; fi
    i=$(( i - 1 )); continue
  fi

  title=$(current_task)
  route_next_task
  [[ "${FORCE_OPUS:-0}" == "1" ]] && { MODEL=opus; REASON="retry after a lost prompt — forced opus"; FORCE_OPUS=0; }
  say "iter $i: $before open — $title"
  say "iter $i: routed $MODEL/$EFFORT — $REASON"
  write_status "WORKING | $title | $MODEL/$EFFORT | started $(date +%H:%M) | $before open | run \$$RUN_COST"

  # The task check diffs against this, so work committed as the task goes is
  # still checked whole. Inherited by the agent, its tools and the Stop hook.
  TASK_CHECK_SINCE=$(git rev-parse HEAD 2>/dev/null) && export TASK_CHECK_SINCE
  SEQ=$(( SEQ + 1 ))
  log="$LOG_DIR/iter-$SEQ.jsonl"
  started=$(date +%s)
  agent task "$ORCH/prompt.md" "$log" $(( ITERATION_WORK_MINUTES * 60 )) "${ITERATION_BACKSTOP_MINUTES}m" \
    "$MODEL" "$EFFORT" "$ITERATION_BUDGET_USD"
  status=$?
  elapsed=$(( $(date +%s) - started ))
  after=$(remaining)
  IFS='|' read -r cost turns cread <<<"$(iteration_cost "$log")"
  cost=$(awk -v c="$cost" 'BEGIN { printf "%.2f", c }')
  RUN_COST=$(awk -v a="$RUN_COST" -v b="$cost" 'BEGIN { printf "%.2f", a + b }')
  say "iter $i: exit=$status ${elapsed}s open=$after (was $before) · \$$cost · $turns turns · $cread cache-read · run \$$RUN_COST"
  (( status == 127 )) && die "the agent could not be started (exit 127) — $CLAUDE_BIN is not runnable"
  (( status == 124 )) && say "iter $i: KILLED at the ${RUN_CAPPED_BY:-time} cap — what it committed stays; the rest is drawn again"

  # ── Refused, limited, or the prompt never arrived: not an attempt ─────────
  # None of these ran the task, so none may cost a stall or an iteration.
  # A short run that SETTLED something was simply a quick task.
  if { (( elapsed < SHORT_RUN_SECONDS )) || grep -q '"terminal_reason":"api_error"' "$log" 2>/dev/null; } \
     && (( $(settled) == settled_before )); then
    i=$(( i - 1 ))
    if (( status == 0 )) && prompt_swallowed "$log"; then
      swallowed=$(( swallowed + 1 ))
      if (( swallowed <= MAX_SWALLOWED )); then
        # Lost prompts clustered on sonnet (2026-09-22/23). Retry on opus at
        # once; if opus loses it too, move the prompt to argv for good.
        if [[ "$MODEL" == sonnet ]]; then
          FORCE_OPUS=1
          (( swallowed >= 2 )) && [[ ! -f "$ORCH/no-sonnet" ]] && { touch "$ORCH/no-sonnet"; say "iter: sonnet lost the prompt twice — sonnet disabled ($ORCH_REL/no-sonnet)"; }
          say "iter: the prompt never reached the model (${elapsed}s, no tool used) — retrying at once on opus"
        elif [[ ! -f "$ORCH/prompt-on-argv" ]]; then
          echo 1 > "$ORCH/prompt-on-argv"
          say "iter: the prompt never reached the model (${elapsed}s, no tool used) — switching to the command-line route and retrying at once"
        else
          say "iter: the prompt never reached the model — retrying at once ($swallowed/$MAX_SWALLOWED)"
        fi
        continue
      fi
      say "iter: the prompt failed to arrive $MAX_SWALLOWED times in a row — treating it as a refusal"
    fi
    wait_out_limit "$log" "iter"
    case $? in
      0) backoffs=0; swallowed=0; continue ;;
      2) FINAL_STATE="RATE_LIMITED"
         progress "Stopped: the usage limit resets too far away to wait for. Nothing is lost; it continues when restarted."
         notify "$PROJECT_NAME stopped" "Usage limit resets too far away."
         break ;;
    esac
    backoffs=$(( backoffs + 1 ))
    if (( backoffs >= MAX_BACKOFFS )); then
      FINAL_STATE="REFUSED"
      say "ABORT: $MAX_BACKOFFS refusals in a row with no reset time — login or billing; see $log"
      progress "Stopped: Claude kept refusing to run (login or billing?). Nothing is lost."
      notify "$PROJECT_NAME stopped" "Claude keeps refusing to run — check the login."
      break
    fi
    wait=$(( BACKOFF_SECONDS * (1 << (backoffs - 1)) )); (( wait > MAX_BACKOFF_SECONDS )) && wait=$MAX_BACKOFF_SECONDS
    say "iter: refused after ${elapsed}s with no reset time — backoff $backoffs/$MAX_BACKOFFS, ${wait}s"
    sleep "$wait"
    wait_for_network "iter"
    continue
  fi
  backoffs=0; swallowed=0; LIMIT_WAITS=0

  # ── Progress, or three strikes on THIS task ────────────────────────────────
  # Three unsettled attempts are a signal about the task, not the run: ask a
  # diagnostic agent why (it has the transcripts); if it cannot settle it,
  # stash what was left, block the task, and carry on with the queue. A task
  # that would not settle used to end the whole night.
  if (( $(settled) > settled_before )); then
    stalls=0
  else
    stalls=$(( stalls + 1 ))
    say "iter $i: nothing settled — stall $stalls/$MAX_STALLS"
    if (( stalls >= MAX_STALLS )); then
      stalls=0
      settled_pre=$(settled)
      if [[ -s "$ORCH/diagnose.md" ]]; then
        say "iter $i: asking a diagnostic agent why"
        SEQ=$(( SEQ + 1 ))
        agent diagnose "$ORCH/diagnose.md" "$LOG_DIR/diagnose-$SEQ.jsonl" 2700 60m opus high 15 || true
      fi
      if (( $(settled) > settled_pre )) || [[ "$(current_task)" != "$title" ]]; then
        say "iter $i: the diagnosis settled or split it — continuing"
      else
        stuck=$(grep -m1 '^- \[ \]' BACKLOG.md); id=$(task_id "$stuck")
        [[ -n "$(git status --porcelain)" ]] && git stash push -u -m "left by $id after $MAX_STALLS stalls, $(stamp)" >/dev/null 2>&1 \
          && say "iter $i: stashed the work $id left behind"
        # The stuck task is by definition the first open line.
        python3 - <<'BLOCK'
import pathlib, re
p = pathlib.Path('BACKLOG.md'); s = p.read_text()
m = re.compile(r'^- \[ \] (.*)$', re.M).search(s)
if m:
    p.write_text(s[:m.start()] + '- [!] ' + m.group(1) + ' - BLOCKED: three agents in a row left it unsettled and the diagnosis could not fix it; see .orchestrator/logs/latest/diagnose-*.jsonl' + s[m.end():])
BLOCK
        git add BACKLOG.md && git commit -q -m "backlog: $id blocked after $MAX_STALLS stalls" -- BACKLOG.md >/dev/null 2>&1
        say "iter $i: BLOCKED $id — the run continues"
        progress "Gave up on $id after three tries and moved on; it is marked blocked."
      fi
    fi
  fi

  # ── Keep the queue a queue ─────────────────────────────────────────────────
  # BACKLOG.md is re-read on every turn; finished tasks left in it are paid for
  # a hundred times over. Moved verbatim to BACKLOG-DONE.md, never deleted.
  if [[ -f "$ORCH/prune-backlog.py" ]]; then
    out=$(python3 "$ORCH/prune-backlog.py" 2>&1); [[ -n "$out" ]] && say "$out"
  fi

  # A NEW blocker is a question for a human — say so once, and keep working
  # the rest of the queue. (Stopping on any blocker made vibegod do one task
  # per launch for a month over a standing errand.)
  if (( $(blocked) > BLOCKED_AT_START )); then
    newest=$(grep '^- \[!\]' BACKLOG.md | tail -1 | sed -E 's/^- \[!\] //; s/\*\*//g' | cut -c1-120)
    progress "Needs you: $newest"
    notify "$PROJECT_NAME needs you" "$newest"
    BLOCKED_AT_START=$(blocked)
  fi
done

if [[ -z "$FINAL_STATE" ]]; then
  FINAL_STATE="ITERATION_CAP"
  progress "Stopped at the $MAX_ITERATIONS-iteration cap with $(remaining) task(s) open; it continues when restarted."
fi
say "loop ended: $FINAL_STATE · $(remaining) open · run \$$RUN_COST"
[[ "$FINAL_STATE" == "QUEUE_EMPTY" ]] || exit 0

# ─── Release ─────────────────────────────────────────────────────────────────

# The note that replaces holding a release back when the gate ran out of rounds.
write_open_work_note() {
  {
    echo "# What to check by hand"; echo
    echo "Written $(date '+%Y-%m-%d %H:%M'). This release shipped with the list below still open:"
    echo "the review gate used all its rounds and was still finding things, and the"
    echo "rule is to ship anyway rather than hold the release. The next run picks these up."
    echo
    grep '^- \[ \]' BACKLOG.md | sed 's/^- \[ \] /- /' || echo "- nothing"
  } > WHAT-TO-CHECK.md
  git add WHAT-TO-CHECK.md && git commit -q -m "note: shipped with open review work, $(date +%F)" -- WHAT-TO-CHECK.md >/dev/null 2>&1
}

# The failing lines of a full-check log: test FAILs, ×-marks, tsc errors, eslint
# lines, Playwright numbered failures. Deduplicated, 40 at most.
failing_lines() {
  perl -pe 's/\e\[[0-9;]*[A-Za-z]//g' "$1" \
    | grep -E '(^| )FAIL |^ *(×|✗|✘) |error TS[0-9]+|^ +[0-9]+:[0-9]+ +error |^/.*\.(ts|tsx|js|jsx|mjs|cjs)$|\[warn\] |^ *[0-9]+\) \[|Test Files .*failed|problems? \([0-9]+ errors?' \
    | sed -E 's/^[[:space:]]+//' | tr -d '`' | awk '!seen[$0]++' | head -40
}

# Tasks run only the per-task check, so a regression it could not see is found
# here. It does not end the night: it becomes one REGRESS- task, and the loop
# re-execs to fix it and try again — at most REGRESS_MAX times per run.
regress_and_retry() {
  local vlog=$1 attempts=0 id lines
  attempts=$(cat "$REGRESS_STATE" 2>/dev/null); [[ "$attempts" =~ ^[0-9]+$ ]] || attempts=0
  if (( attempts >= REGRESS_MAX )); then
    say "release: the full check still fails after $attempts repair attempt(s) — stopping"
    progress "Not shipped: the full check still fails after $attempts repair attempts. Log: ${vlog#"$ROOT"/}"
    notify "$PROJECT_NAME: not shipped" "The full check still fails after $attempts repairs."
    return 0
  fi
  attempts=$(( attempts + 1 )); echo "$attempts" > "$REGRESS_STATE"
  id="REGRESS-$(date +%Y%m%d-%H%M%S)"
  lines=$(failing_lines "$vlog")
  {
    printf '\n- [ ] **%s Fix what the pre-deploy full check failed**\n' "$id"
    printf '  - The full check ran before the deploy and failed, so nothing shipped. Log: `%s` (repair %s of %s).\n' "${vlog#"$ROOT"/}" "$attempts" "$REGRESS_MAX"
    printf '  - What failed:\n'
    if [[ -n "$lines" ]]; then printf '%s\n' "$lines" | sed 's/^/    - `/; s/$/`/'
    else printf '    - (nothing recognised — read the log)\n'; fi
    printf '  - Done when: the cause is fixed (never weaken, skip or delete a test) and the named tests and the task check are green.\n'
  } >> BACKLOG.md
  git add BACKLOG.md && git commit -q -m "backlog: $id — the pre-deploy full check failed" -- BACKLOG.md
  say "release: the full check failed — wrote $id and re-running the loop to fix it (attempt $attempts of $REGRESS_MAX)"
  ORCH_REGRESS_REDEPLOY=1 ORCH_SKIP_GATE=1 ORCH_RUN_COST=$RUN_COST ORCH_SEQ=$SEQ exec bash "$SELF"
}

# One comparison of the release with the drawings. Mismatches become tasks; the
# loop fixes them and ships once more; the second release finds the marker and
# stops. Never a second check (Michael, 2026-09-23).
post_deploy_design_check() {
  if [[ -f "$DESIGN_CHECK_MARKER" ]]; then
    rm -f "$DESIGN_CHECK_MARKER"; say "post-deploy: design fixes shipped — done"; return 0
  fi
  case "$POST_DEPLOY_DESIGN_CHECK" in
    0) return 0 ;;
    auto) [[ -s "$ORCH/gate-design.md" && -d design ]] || return 0 ;;
  esac
  local before log="$LOG_DIR/post-deploy-design.jsonl"
  before=$(remaining)
  say "post-deploy: comparing the release with design/"
  SEQ=$(( SEQ + 1 ))
  agent gate "$ORCH/gate-design.md" "$log" $(( $(to_seconds "$GATE_TIMEOUT") )) "$GATE_TIMEOUT" \
    "$GATE_MODEL" "$GATE_EFFORT" "$GATE_BUDGET_USD" || say "post-deploy: design check exited non-zero — $log"
  if (( $(remaining) > before )); then
    touch "$DESIGN_CHECK_MARKER"
    say "post-deploy: $(( $(remaining) - before )) design mismatch task(s) — fixing, then shipping again"
    progress "Shipped, then found $(( $(remaining) - before )) screen(s) that differ from the designs; fixing them and shipping again."
    ORCH_SKIP_GATE=1 ORCH_RUN_COST=$RUN_COST ORCH_SEQ=$SEQ exec bash "$SELF"
  fi
  say "post-deploy: the release matches the designs"
}

if [[ "$DEPLOY_ON_FINISH" != "1" || -z "$DEPLOY_CMD" ]]; then
  FINAL_STATE="FINISHED"
  progress "All tasks done. (This project does not deploy.)"
  notify "$PROJECT_NAME: done" "All tasks done."
  exit 0
fi

(( GATE_EXHAUSTED )) && write_open_work_note

# A dirty tree means the release would not be the commits. What is left there
# at this point was abandoned by a killed agent — stash it (recoverable) rather
# than strand the release overnight on it.
if [[ -n "$(git status --porcelain)" ]]; then
  git status --short | sed "s/^/$(stamp) dirty: /"
  git stash push -u -m "left uncommitted at release time, $(stamp)" >/dev/null 2>&1 \
    && say "release: stashed uncommitted leftovers so the release is the commits"
fi

say "release: running the full check"
write_status "RELEASING | full check | since $(date +%H:%M)"
vlog="$LOG_DIR/release-verify-$(date +%H%M%S).log"
[[ -x "$ORCH/reap-dev-servers.sh" ]] && "$ORCH/reap-dev-servers.sh" >/dev/null 2>&1
if ! "$ORCH/verify.sh" > "$vlog" 2>&1; then
  regress_and_retry "$vlog"   # re-execs, or returns having given up
  FINAL_STATE="NOT_SHIPPED"; exit 0
fi
say "release: full check green"

# A deploy that fails anywhere but the check — network, Docker Hub, the box —
# is retried with backoff. One transient Docker Hub timeout at 23:43 once
# stranded a whole night because nothing retried it (2026-09-23).
read -r -a retry_waits <<<"$DEPLOY_RETRY_SECONDS"
attempt=0
while :; do
  attempt=$(( attempt + 1 ))
  dlog="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
  say "release: deploying to $DEPLOY_TARGET (attempt $attempt of $DEPLOY_RETRIES) — $dlog"
  write_status "DEPLOYING | attempt $attempt | since $(date +%H:%M)"
  wait_for_network "deploy"
  ORCH_VERIFIED=1 DEPLOY_GATE_DONE=1 DEPLOY_TARGET="$DEPLOY_TARGET" \
    "$ORCH/lock.sh" deploy "$DEPLOY_TARGET" "$DEPLOY_CMD" > "$dlog" 2>&1
  dstatus=$?
  if (( dstatus == 0 )); then
    git rev-parse HEAD > "$ORCH/.last-deployed"
    rm -f "$REGRESS_STATE" "$GATE_STATE_FILE" "$ORCH/.deploy-failures"
    say "deploy: done"
    progress "Shipped $(git rev-parse --short HEAD) to $DEPLOY_TARGET."
    notify "$PROJECT_NAME shipped" "Deployed $(git rev-parse --short HEAD)."
    FINAL_STATE="SHIPPED"
    break
  fi
  echo "$attempt" > "$ORCH/.deploy-failures"
  tail -15 "$dlog" | sed "s/^/$(stamp) deploy: /"
  if (( attempt >= DEPLOY_RETRIES )); then
    say "deploy: FAILED $attempt times — giving up; last log $dlog"
    progress "Not shipped: the deploy failed $attempt times (last error in ${dlog#"$ROOT"/}). Everything is built and checked; only the upload failed."
    notify "$PROJECT_NAME: deploy failed" "Failed $attempt times — the box may be offline."
    FINAL_STATE="DEPLOY_FAILED"
    exit 0
  fi
  idx=$(( attempt - 1 )); (( idx >= ${#retry_waits[@]} )) && idx=$(( ${#retry_waits[@]} - 1 ))
  say "deploy: failed (exit $dstatus) — retrying in ${retry_waits[$idx]}s"
  sleep "${retry_waits[$idx]}"
done

post_deploy_design_check
exit 0
