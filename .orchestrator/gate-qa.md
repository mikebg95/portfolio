You are the pre-deploy QA walk. The queue is empty and a release is about to
be cut. Walk the whole app the way a real person would, find what is broken,
and write it down. No user is present; ask nothing.

## First: the list, and resuming

Your resume record is `.orchestrator/qa-progress.md` (not tracked by git).

- **If it exists, CONTINUE it** — start at the first `- [ ]`, never rebuild it,
  and say in your summary that you resumed and where.
- **If it does not, write it FIRST, before walking anything:** one `- [ ]`
  line per route, enumerated from the router in the code (not from memory), so
  the list is complete. Say how many you enumerated.

Tick each route as you finish it, with a one-line verdict that says **what you
did there**. The loop re-enters you until every line is ticked, so you are not
required to finish in one attempt — twenty routes walked properly and the rest
honestly unticked is a good attempt; everything ticked shallowly is a wasted
one. "It rendered" is not a verdict. If you did not press anything, leave it
`[ ]`.

## Walking a route

Start the app the way CLAUDE.md says, with seeded data the way the e2e
helpers seed it. Drive it with Playwright. Write your scratch scripts under the
gitignored `.e2e/` — never inside the committed test folders.

On every screen: it renders without an error boundary or a 500; the console is
clean; every button and link goes where it claims; forms accept valid input
and refuse invalid input with a readable message; empty, loading and error
states behave; **every page is reachable from the menu** (not only by typed
URL); nothing is clipped, invisible or overlapping at 390px wide or on desktop.

## Re-test what earlier rounds fixed

Before anything new: every `QA-` task a previous round wrote and that is now
ticked (BACKLOG-DONE.md, under this walk's dated headings) — reproduce its
ORIGINAL steps and confirm the symptom is gone. Done by the same agent that
wrote the fix means "believed", not verified. A fix that did not hold is a new
finding saying which task it regresses. Report how many you re-tested and how
many held.

## Findings are TASKS, never fixes

Reproduce each defect twice — a false finding costs a whole extra round. Then
append it to BACKLOG.md as `- [ ] **QA-n <route> — <what is wrong>**` with
bullets: the route, what you did, what happened, what should have happened,
and a **Done when** line — under one heading `### QA walk, <date>`. Number
after the highest `QA-n` in BACKLOG.md and BACKLOG-DONE.md. A defect nobody can
reproduce from your text is not written well enough.

**Commit BACKLOG.md after each finding, the moment it is written.** You run
under a timeout; a finding in your context dies with you.

Kill only the PIDs you started, never by pattern. Stop every server before you
end.

If everything genuinely works, append NOTHING and say so — an unchanged queue
is the signal the release is ready.
