# Everything project-specific about this loop lives in THIS file.
#
# run.sh, the helpers and the prompts are identical in every project that uses
# the kit. The fleet this was merged from (kalistenix, dominio-de-ingles,
# mathaverse, Wayfolk, vibegod) had five hand-edited copies of run.sh that
# drifted apart — each fix had to be ported four times and several never were.
# So: change settings here, never in run.sh. Every value can also be overridden
# from the environment for a single run (e.g. `PREDEPLOY_GATE=1 start.sh`).
#
# Sourced by run.sh with `set -u` on — give every variable a value.

# ─── The project ─────────────────────────────────────────────────────────────
PROJECT_NAME="${PROJECT_NAME:-portfolio}"

# The FULL check. Runs once per release, in front of the deploy — never per
# task (tasks run .orchestrator/task-check.sh; a full run cost 18-20 minutes
# a task in the old loops against two minutes of coding).
VERIFY_CMD="${VERIFY_CMD:-npm run verify}"

# Run the full check before the first task, and refuse to start on red? It
# costs one full run per start. Off by default: the pre-deploy check catches
# the same thing without making every restart wait.
BASELINE_VERIFY="${BASELINE_VERIFY:-0}"

# ─── Runtime ─────────────────────────────────────────────────────────────────
# auto = enforce the Node floor only once package.json exists.
REQUIRE_NODE="${REQUIRE_NODE:-auto}"
MIN_NODE_VERSION="${MIN_NODE_VERSION:-20012}"   # 20.12, as major*1000+minor
EXPECTED_NODE_MAJOR="${EXPECTED_NODE_MAJOR:-22}" # warn (never refuse) on any other
# Binaries the suite shells out to; the loop refuses to start without them
# rather than failing every task on an environment fault (e.g. pdftotext).
REQUIRED_BINS="${REQUIRED_BINS:-git jq python3 curl}"

# ─── Iterations ──────────────────────────────────────────────────────────────
# Generous on purpose: running out of iterations reads exactly like finishing.
# Refused / rate-limited attempts do not spend an iteration.
MAX_ITERATIONS="${MAX_ITERATIONS:-500}"
ITERATION_WORK_MINUTES="${ITERATION_WORK_MINUTES:-90}"  # time queued on the test lock is not charged
ITERATION_BACKSTOP_MINUTES="${ITERATION_BACKSTOP_MINUTES:-240}"  # wall clock, for a queue that never moves
ITERATION_BUDGET_USD="${ITERATION_BUDGET_USD:-25}"      # runaway backstop, not a budget
MAX_STALLS="${MAX_STALLS:-3}"                           # then diagnose, then block THAT task and go on

# Michael 2026-10-04: set up "the same as bib-nl" — every task on opus/high,
# gates simplify → qa → verify (max 3) → simplify. The "deploy" is only a
# production build: hosting for michaelgoldman.dev is chosen by hand after the
# loop (SPEC §7), and this lets the full check + post-build design comparison run.
# ─── Model routing ───────────────────────────────────────────────────────────
ROUTER="${ROUTER:-0}"               # 0 = every task on DEFAULT_MODEL/DEFAULT_EFFORT
DEFAULT_MODEL="${DEFAULT_MODEL:-opus}"
DEFAULT_EFFORT="${DEFAULT_EFFORT:-high}"
GATE_MODEL="${GATE_MODEL:-opus}"
GATE_EFFORT="${GATE_EFFORT:-high}"

# ─── Processes other loops' agents might sweep ───────────────────────────────
# Dev-server command-line pattern for reap-dev-servers.sh (kill-by-PID, never
# an agent). Literals prompt.md must never spell — check-prompt-argv.sh refuses
# to start if it does, because a prompt that falls back to argv would make this
# project's agents killable by any `pkill -f` on the Mac.
DEV_SERVER_PATTERN="${DEV_SERVER_PATTERN:-astro dev|astro preview|vite( |$)}"
SWEEP_LITERALS="${SWEEP_LITERALS:-npm run verify|vitest|astro dev|astro preview|playwright test|lhci}"

# ─── The pre-deploy review gate ──────────────────────────────────────────────
# OFF by default — Michael, 2026-09-23: "i do NOT want the pre-deploy gate!!!
# just deploy when done!!" Turn it on per project with PREDEPLOY_GATE=1.
# When on, the sequence below runs one stage at a time; a stage that writes
# tasks hands the queue back to the loop and the next stage waits until those
# are fixed. `verify` repeats (at most VERIFY_MAX_ROUNDS) while it still finds
# regressions; every other stage runs once. Nothing edits the app after
# verification. Stages: simplify, qa, ui, verify (gate-<stage>.md each).
PREDEPLOY_GATE="${PREDEPLOY_GATE:-1}"
GATE_SEQUENCE="${GATE_SEQUENCE:-qa verify}"  # Michael 2026-10-04: static site — click-through + one verify, no clean-up passes
VERIFY_MAX_ROUNDS="${VERIFY_MAX_ROUNDS:-1}"
GATE_MAX_ROUNDS="${GATE_MAX_ROUNDS:-10}"   # then ship anyway, with WHAT-TO-CHECK.md
GATE_TIMEOUT="${GATE_TIMEOUT:-6h}"         # per attempt; walks resume from their progress file
GATE_STUCK_ATTEMPTS="${GATE_STUCK_ATTEMPTS:-3}"
GATE_BUDGET_USD="${GATE_BUDGET_USD:-60}"
# Task-id prefixes the gates write. While every open task carries one of
# these, a saved gate position is resumed; otherwise it is dropped.
GATE_TASK_PREFIXES="${GATE_TASK_PREFIXES:-QA|SIMP|REGRESS|UIFIX|VERIFY|DESIGN-FIX|FLAKE}"

# ─── Deploying ───────────────────────────────────────────────────────────────
# Empty DEPLOY_CMD = this project does not deploy; the run ends at an empty
# queue. The loop runs VERIFY_CMD itself first (under the machine-wide test
# lock), then DEPLOY_CMD with ORCH_VERIFIED=1 and DEPLOY_GATE_DONE=1 exported
# so the deployer may skip its own copy of the full check.
DEPLOY_ON_FINISH="${DEPLOY_ON_FINISH:-1}"
# Michael 2026-10-04: live on michaelgoldman.dev via GitHub Pages — pushing main
# runs .github/workflows/pages.yml, which builds and publishes dist/.
DEPLOY_CMD="${DEPLOY_CMD:-npm run build && git push origin HEAD:main}"
DEPLOY_TARGET="${DEPLOY_TARGET:-github-pages}"   # tailnet name; .local is LAN-only
DEPLOY_RETRIES="${DEPLOY_RETRIES:-4}"              # failures NOT in the full check (network, docker, box)
DEPLOY_RETRY_SECONDS="${DEPLOY_RETRY_SECONDS:-60 300 900}"  # waits between attempts; last one repeats
REGRESS_MAX="${REGRESS_MAX:-2}"                    # full-check failures turned into REGRESS- tasks per run

# ─── After a deploy ──────────────────────────────────────────────────────────
# One comparison of the release with the drawings; mismatches become tasks,
# get fixed, and ship once more. Never a second check. auto = run when
# gate-design.md exists AND design/ exists.
POST_DEPLOY_DESIGN_CHECK="${POST_DEPLOY_DESIGN_CHECK:-auto}"

# ─── Housekeeping ────────────────────────────────────────────────────────────
# Re-check every `- [!]` blocker against the machine once per run start. Six
# blockers across the fleet were checked on 2026-09-12 and four were false.
RECHECK_BLOCKERS="${RECHECK_BLOCKERS:-1}"
NOTIFY="${NOTIFY:-1}"   # macOS notifications: shipped, needs you, gave up
