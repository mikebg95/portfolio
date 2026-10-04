Read the first 300 lines of BACKLOG.md. Find the FIRST `- [ ]` task, top to
bottom. Ignore `- [~]` lines and the TODO-MANUAL section — never tasks.

Read that task's line and every nested bullet under it. Do not read the rest of
the repository. Classify ONLY that task, and stop. Do not implement it. Do not
edit any file.

Return JSON with exactly `model`, `effort` and `reason`.

## model

`"opus"` is the default and the answer whenever you are not certain. An
unnecessary `"opus"` costs money; a wrong `"sonnet"` costs a mistake that later
tasks build on while nobody is awake to catch it. These are not symmetric.

**Classify by what the task TOUCHES, never by what it produces.** "Write a
runbook", "build a settings page" are shapes of deliverable and tell you
nothing. A page deciding who may see someone's data is an authorization task.
Ask what the agent must understand, not what it hands back.

1. Go through the trigger list and note every entry the task hits.
2. If it hits even one, the answer is `"opus"`. Stop there.
3. Only if it hits none may you consider `"sonnet"`.

Answer `"opus"` if the task or any bullet touches ANY of:

- the domain data model, a schema or a migration — any entity, field,
  validation or relationship
- authentication or authorization — sign-in, sessions, credentials, roles, who
  may see or change data that is not their own
- personal data — anything logged, stored, encrypted, exported or deleted
- a third-party boundary — any external API, payment, storage, email, model or
  analytics provider, INCLUDING the internal port it sits behind and its fake
  driver
- correctness of the subject matter — anything where a wrong answer ships as
  content or advice a person acts on
- state that must survive a crash, a refresh or a second device — persistence,
  sync, caching, conflict resolution
- deployment, the release path, compliance or hardening
- a bullet asking to **prototype**, **judge how something feels**, **measure**,
  **prove**, or **decide** between options left open
- CLAUDE.md itself — the stack, the checks, a convention every task depends on
- the project's own triggers below

### This project's own triggers

(Filled in per project: the areas where a plausible wrong answer is the
failure nobody can see — e.g. the engine, the scoring, the doctrine, the
foundation tasks every later task builds on. Until filled in, nothing extra.)

## When sonnet is right

Answer `"sonnet"` only when ALL of these hold:

- the deliverable is EITHER documentation / a report / a mechanical update to
  fixtures or file references, OR **presentation-only code** — layout,
  styling, copy, an icon, where a menu item sits, moving or splitting an
  existing component — that changes no query, no stored value, no gate, and no
  rule about what the user is shown next
- no bullet asks for a judgement call, a prototype, or a proof
- nothing in the trigger list is touched

"It is only UI" is not the test. A surface that DECIDES what to show is not
presentation; a surface that shows what it was handed is.

**Consistency check:** read your `reason` back. If it names auth, personal
data, the data model, a migration, a third-party boundary or an open decision,
the answer is `"opus"` — fix the answer, not the reason.

## effort

- `"medium"` — the shape is already decided: bullets name the files, the
  pattern exists, it is plumbing. An opus task held only by a trigger can still
  be medium.
- `"high"` — real design content. The default, not the answer: most measured
  runs over-used it.
- `"xhigh"` — several interacting constraints, a stated trap, or a decision
  the bullets deliberately leave open.

If your reason says the shape is already decided, the effort is `"medium"`.

## reason

Twenty-five words or fewer. Name the task id and the bullet that decided it,
so a human can audit the call: "T-14: runbook only, no schema, auth or
third-party driver touched".
