#!/usr/bin/env bash
#
# The per-task check: what every task runs before it commits, in place of the
# full verify command. The full verify still runs — once, in the deployer's
# preflight (vibegod: the release gate and the loop's baseline) — so nothing
# ships without it. This is the fast half of that split.
#
# WHY (Michael, 2026-09-25). Measured that day on dominio-de-ingles: a task took
# 2 minutes of coding and 18+ minutes of the full verify (246 Playwright e2e
# tests in it); kalistenix and mathaverse document ~20 minutes of unit tests.
# "2min of coding and then 20+mins for testing is RIDICULOUS… we shouldnt just
# throw away all testing, but there should be another way." This is that way:
# check what the change can reach, fully, and nothing else.
#
# WHAT IT RUNS, over the files this task changed (tracked edits vs HEAD, staged,
# untracked-not-ignored, plus everything committed since $TASK_CHECK_SINCE /
# --since <rev> when given — the loop exports the iteration's starting commit):
#   1. typecheck — the project's own, whole-program, but incremental
#      (`tsc --noEmit --incremental --tsBuildInfoFile <this dir>/.tsbuildinfo`;
#      a `tsc --build` project keeps its own form, which is incremental already)
#   2. eslint on the changed lintable files only (the repo's config and ignores)
#   3. prettier --check on the changed files, only where the full verify checks
#      formatting (a `format:check` / `prettier` leg in the verify script)
#   4. the test runner's `related` mode on the changed files — every test that
#      imports the changed code, transitively — plus any test file that names a
#      changed non-code file (a guard test reading a shell script or a .md sees
#      it through fs, which no import graph can), plus the dist/ twin of a
#      changed workspace-package source file, so packages that import the
#      built output are followed too
#
# THE SAFETY VALVE: the whole unit suite (`npm run test`, never e2e) instead of
# step 4 when the change touches what the import graph cannot see — package.json
# or a lockfile, tsconfig*, a vitest/vite/eslint config, a test setup file named
# in a vitest config, prisma/drizzle schema or migrations, .env*, a pattern
# listed in <this dir>/task-check.global (the repo's documented global modules),
# or more than $TASK_CHECK_MAX_FILES (40) source files. --full forces it.
#
# Its last line is always `TASK_CHECK_EXIT=<0|1>` and its exit status matches.
# Poll for that marker, never for words in the output.
#
# Identical in every orchestrator repo (kalistenix, dominio-de-ingles,
# mathaverse, Wayfolk, vibegod). Everything repo-specific is derived from
# package.json and the config files, or read from task-check.global. Edit one,
# copy to all.
#
# orchestrator-kit additions (2026-09-25), the only differences from the fleet
# copy:
#   - a project that is not Node/vitest puts its own check in
#     task-check.local.sh beside this file; it is run instead, and must end
#     with the same TASK_CHECK_EXIT=<code> line;
#   - `--fingerprint` prints a hash of the code as it stands (ignoring the
#     backlog, the loop's own files and docs/REPO-MAP.md), and a passing run
#     stores it in .task-check-pass — the Stop hook skips a re-run when the
#     code has not changed since the agent's own passing check.
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
cd "$ROOT" || exit 1
STATE_DIR=${HERE#"$ROOT"/}            # .orchestrator, or .vibegod
MAX_FILES=${TASK_CHECK_MAX_FILES:-40}
SINCE=${TASK_CHECK_SINCE:-}
FORCE_FULL=0

usage() {
  echo "usage: $STATE_DIR/task-check.sh [--since <rev>] [--full]" >&2
}
fingerprint() {
  # Code only: a tick in BACKLOG.md or a note in the repo map changes nothing
  # a test can see.
  local spec=(-- . ':(exclude)BACKLOG.md' ':(exclude)BACKLOG-DONE.md' ":(exclude)$STATE_DIR" ':(exclude)docs/REPO-MAP.md')
  { git ls-files -s "${spec[@]}"; git diff HEAD "${spec[@]}"
    git ls-files -z --others --exclude-standard "${spec[@]}" | xargs -0 git hash-object -- ; } 2>/dev/null \
    | cksum | cut -d' ' -f1
}
if [[ "${1:-}" == "--fingerprint" ]]; then fingerprint; exit 0; fi

if [[ -x "$HERE/task-check.local.sh" ]]; then
  "$HERE/task-check.local.sh" "$@"
  code=$?
  [[ $code -eq 0 ]] && fingerprint > "$HERE/.task-check-pass"
  exit "$code"
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --since) [[ $# -ge 2 ]] || { usage; exit 2; }; SINCE=$2; shift 2 ;;
    --since=*) SINCE=${1#--since=}; shift ;;
    --full) FORCE_FULL=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

export PATH="$ROOT/node_modules/.bin:$PATH"
T0=$(date +%s)
FAILED=()

say() { printf '[task-check %3ss] %s\n' "$(( $(date +%s) - T0 ))" "$*"; }
finish() {
  local code=0
  if [[ ${#FAILED[@]} -gt 0 ]]; then
    code=1
    say "FAILED: ${FAILED[*]}"
  else
    say "passed"
  fi
  [[ $code -eq 0 ]] && fingerprint > "$HERE/.task-check-pass"
  echo "TASK_CHECK_EXIT=$code"
  exit "$code"
}

pkg_script() {  # the text of a package.json script, empty when absent
  node -e 'const s=(require(process.argv[1]).scripts||{})[process.argv[2]];process.stdout.write(s||"")' \
    "$ROOT/package.json" "$1" 2>/dev/null
}

# ─── What changed ────────────────────────────────────────────────────────────
if [[ -n "$SINCE" ]] && ! git rev-parse -q --verify "$SINCE^{commit}" >/dev/null; then
  say "warning: --since '$SINCE' is not a commit here; checking uncommitted work only"
  SINCE=
fi

CHANGED=()
while IFS= read -r -d '' f; do
  [[ -f "$f" ]] && CHANGED+=("$f")
done < <(
  {
    git diff --name-only -z HEAD --
    git diff --name-only -z --cached --
    git ls-files -z --others --exclude-standard
    [[ -n "$SINCE" ]] && git diff --name-only -z "$SINCE" HEAD --
  } 2>/dev/null | sort -zu
)

if [[ ${#CHANGED[@]} -eq 0 && $FORCE_FULL -eq 0 ]]; then
  say "no changed files${SINCE:+ since $SINCE} — nothing to check"
  finish
fi
say "${#CHANGED[@]} changed file(s)${SINCE:+ (including commits since ${SINCE:0:12})}"

CODE_RE='\.(ts|tsx|js|jsx|mjs|cjs|mts|cts)$'
GRAPH_RE='\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|json|css|scss|svg|md|mdx|txt|html|yml|yaml)$'
# A test file of any runner, e2e specs included; the runner's own include
# patterns decide which of them it actually runs.
TEST_RE='\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs|mts|cts)$'
GLOBAL_RE='(^|/)(package\.json|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$'
GLOBAL_RE+='|(^|/)[^/]*tsconfig[^/]*\.json$'
GLOBAL_RE+='|(^|/)(vitest|vite)[^/]*\.config\.[cm]?[jt]s$|(^|/)vitest\.(setup|workspace)[^/]*$'
GLOBAL_RE+='|(^|/)eslint\.config\.[cm]?[jt]s$|(^|/)\.eslintrc'
GLOBAL_RE+='|(^|/)(prisma|drizzle|migrations)/|\.prisma$|(^|/)(prisma|drizzle)\.config\.[cm]?[jt]s$'
GLOBAL_RE+='|(^|/)\.env[^/]*$'
if [[ -f "$HERE/task-check.global" ]]; then
  while IFS= read -r line; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    GLOBAL_RE+="|$line"
  done < "$HERE/task-check.global"
fi

# Test setup files are loaded by the config, not imported by any test.
VITEST_CONFIGS=()
while IFS= read -r -d '' f; do VITEST_CONFIGS+=("$f"); done < <(
  git ls-files -z -- 'vitest*.config.*' '*/vitest*.config.*' 2>/dev/null
)
named_in_vitest_config() {
  local stem
  stem=$(basename "$1"); stem=${stem%.*}
  [[ ${#VITEST_CONFIGS[@]} -gt 0 ]] || return 1
  grep -q -F -e "/$stem." -e "/$stem'" -e "/$stem\"" -- "${VITEST_CONFIGS[@]}" 2>/dev/null
}

CODE=() LINTABLE=() GRAPH=() OTHER=() WHY_FULL=()
for f in "${CHANGED[@]}"; do
  if [[ "$f" =~ $GLOBAL_RE ]]; then
    WHY_FULL+=("$f")
  elif [[ "$f" =~ $CODE_RE ]] && named_in_vitest_config "$f"; then
    WHY_FULL+=("$f (test setup)")
  fi
  if [[ "$f" =~ $CODE_RE ]]; then CODE+=("$f"); LINTABLE+=("$f"); fi
  if [[ "$f" =~ $GRAPH_RE ]]; then GRAPH+=("$f"); fi
  if ! [[ "$f" =~ $CODE_RE ]]; then OTHER+=("$f"); fi
done
if [[ ${#CODE[@]} -gt $MAX_FILES ]]; then
  WHY_FULL+=("${#CODE[@]} source files changed (> $MAX_FILES)")
fi
[[ $FORCE_FULL -eq 1 ]] && WHY_FULL+=("--full")

# ─── 1. Typecheck ────────────────────────────────────────────────────────────
needs_types=0
for f in "${CHANGED[@]}"; do
  [[ "$f" =~ \.(ts|tsx|js|jsx|mjs|cjs|mts|cts|json)$ ]] && { needs_types=1; break; }
done
tc=$(pkg_script typecheck)
if [[ $needs_types -eq 0 && $FORCE_FULL -eq 0 ]]; then
  say "typecheck: skipped — no code, config or data file changed"
elif [[ -z "$tc" ]]; then
  say "typecheck: skipped — package.json has no typecheck script"
else
  if [[ "$tc" == *"--build"* || "$tc" == *" -b"* ]]; then
    cmd="$tc"                                   # project references: already incremental
  elif [[ "$tc" == tsc* && "$tc" != *"&&"* && "$tc" != *"--incremental"* ]]; then
    cmd="$tc --incremental --tsBuildInfoFile $STATE_DIR/.tsbuildinfo"
  else
    cmd="$tc"
  fi
  say "typecheck: $cmd"
  if ! sh -c "$cmd"; then FAILED+=("typecheck"); fi
fi

# ─── 2. ESLint on the changed files ──────────────────────────────────────────
if [[ ${#LINTABLE[@]} -eq 0 ]]; then
  say "lint: skipped — no lintable file changed"
elif [[ -z "$(pkg_script lint)" ]]; then
  say "lint: skipped — package.json has no lint script"
else
  say "lint: eslint on ${#LINTABLE[@]} file(s)"
  out=$(eslint --no-warn-ignored --cache --cache-location "$STATE_DIR/.eslintcache" -- "${LINTABLE[@]}" 2>&1)
  status=$?
  [[ -n "$out" ]] && printf '%s\n' "$out"
  if [[ $status -ne 0 ]]; then
    if grep -q -E 'No files matching|all files matching the following patterns are ignored' <<<"$out"; then
      say "lint: eslint matched none of the changed files — treated as a pass"
    else
      FAILED+=("lint")
    fi
  fi
fi

# ─── 3. Formatting, only where the full verify checks it ─────────────────────
verify_script=$(pkg_script verify)
if [[ "$verify_script" == *"format:check"* || "$verify_script" == *"prettier"* ]]; then
  say "format: prettier --check on ${#CHANGED[@]} file(s)"
  if ! prettier --check --ignore-unknown --no-error-on-unmatched-pattern "${CHANGED[@]}"; then
    FAILED+=("format")
  fi
fi

# ─── 4. Tests ────────────────────────────────────────────────────────────────
# orchestrator-kit: before the first task scaffolds the project there is no
# package.json and no runner — that is "nothing to test yet", not a failure.
# (A non-Node stack puts its own check in task-check.local.sh.)
if [[ ! -f "$ROOT/package.json" ]] || ! command -v vitest >/dev/null 2>&1; then
  say "tests: skipped — no package.json or no vitest here yet (a non-Node stack uses task-check.local.sh)"
  finish
fi
if [[ ${#WHY_FULL[@]} -gt 0 ]]; then
  say "tests: FULL unit suite (npm run test, no e2e) — the import graph cannot see:"
  for w in "${WHY_FULL[@]}"; do say "    $w"; done
  if ! npm run --silent test; then FAILED+=("tests (full unit suite)"); fi
  finish
fi

# Test files that name a changed non-code file: they read it through fs.
NAMED=()
# Skipped: the queue files every task ticks, and the loop's own state notes
# (progress logs, gate-state) — neither changes what any test asserts, and
# their names are common enough to drag in every test that parses a backlog.
# A test qualifies when it names the file AND its parent directory, which is
# how a guard spells a path whether as 'dir/name' or path.join('dir', 'name').
for f in ${OTHER[@]+"${OTHER[@]}"}; do
  base=$(basename "$f")
  dir=$(dirname "$f")
  case "$f" in
    BACKLOG.md|BACKLOG-DONE.md) continue ;;
    "$STATE_DIR"/*.md|"$STATE_DIR"/logs/*) continue ;;
    "$STATE_DIR"/*.*) ;;
    "$STATE_DIR"/*) continue ;;
  esac
  while IFS= read -r -d '' t; do
    [[ "$t" =~ $TEST_RE && -f "$t" ]] || continue
    [[ "$dir" == . ]] || grep -q -F -e "$(basename "$dir")" "$t" || continue
    NAMED+=("$t")
  done < <(git grep -l -z -F -e "$base" -- '*.test.*' '*.spec.*' 2>/dev/null)
done

# A workspace package that other packages import through its BUILT output
# (package.json exports -> dist/) hides its dependents from the graph: they
# import dist/x.js, not src/x.ts. The typecheck above has just rebuilt dist
# (`tsc --build` emits), so name the built twin too and the dependents follow.
BUILT=()
for f in ${CODE[@]+"${CODE[@]}"}; do
  [[ "$f" == */src/* ]] || continue
  twin="${f%%/src/*}/dist/${f#*/src/}"
  twin="${twin%.*}.js"
  [[ -f "$twin" ]] && BUILT+=("$twin")
done

TARGETS=(${GRAPH[@]+"${GRAPH[@]}"} ${NAMED[@]+"${NAMED[@]}"} ${BUILT[@]+"${BUILT[@]}"})
if [[ ${#TARGETS[@]} -eq 0 ]]; then
  say "tests: none related — no changed file is one a test can import or name"
  finish
fi
if [[ ${#NAMED[@]} -gt 0 ]]; then
  say "tests: also running $(printf '%s\n' "${NAMED[@]}" | sort -u | wc -l | tr -d ' ') test file(s) that name a changed non-code file"
fi
say "tests: vitest related --run over ${#TARGETS[@]} path(s)"
log=$(mktemp -t task-check.XXXXXX)
UNIQ=()
while IFS= read -r t; do UNIQ+=("$t"); done < <(printf '%s\n' "${TARGETS[@]}" | sort -u)
# No `--` before the paths: the runner's CLI parser files everything after it
# under a separate key rather than as positional arguments.
json=$(mktemp -t task-check-json.XXXXXX)
vitest related --run --passWithNoTests --reporter=default --reporter=json \
  --outputFile.json="$json" "${UNIQ[@]}" > "$log" 2>&1
status=$?
if grep -q -E 'No test files found' "$log" && ! grep -q -E 'Test Files' "$log"; then
  :   # the runner's own "no files" message is a page of include globs; say it in one line below
else
  grep -v -E '^JSON report written to' "$log"
fi
# The default reporter does not list passing files when it is not on a
# terminal, so say which test files ran — that is the evidence of scope.
node -e '
  const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const files = (r.testResults || []).map(t => require("path").relative(process.cwd(), t.name));
  if (files.length) console.log(`[task-check] test files run (${files.length}):\n` + files.sort().map(f => "    " + f).join("\n"));
' "$json" 2>/dev/null || true
rm -f "$json"
if grep -q -E 'No test files found|No test files' "$log" && ! grep -q -E 'Test Files' "$log"; then
  say "tests: no test imports the changed code — nothing to run"
elif [[ $status -ne 0 ]]; then
  FAILED+=("tests (related)")
fi
rm -f "$log"
finish
