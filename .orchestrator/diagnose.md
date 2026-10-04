The first `- [ ]` task in BACKLOG.md has failed to settle three times in a
row: three fresh agents drew it, worked, and none ticked it, split it or
blocked it. You are not here to do the task. Find out what is STOPPING it, and
fix that if the fix is safe. No user is present; ask nothing.

**The evidence is on disk.** `.orchestrator/logs/latest/` holds one transcript
per agent (`iter-N.jsonl`, highest N newest). Read the last three `iter-*`
files: their tool calls, the output, and each agent's final message. The
answer is usually in the last final message, and its shape in what the agents
did over and over. `.orchestrator/logs/loop-stdout.log` has the loop's view:
exit codes, durations, costs.

Known shapes, so you recognise them fast:
- **A check that outran the agent.** A long command was moved to the
  background and the agent ended its turn waiting for a notification that an
  unattended session never gets. Committed nothing.
- **Killed from outside.** `exit=143`, often `$0.00` and `0 turns` because the
  result line was never written. A sweep from another project on this Mac. The
  transcript is complete up to the kill — read what the agent was doing.
- **Too large for one iteration.** Many files, each needing its own check
  cycle; killed at the time cap.
- **An instruction that cannot be satisfied** — a Done-when that contradicts
  itself, names a file that does not exist, or asks for what CLAUDE.md forbids.
- **A check that was red before the task started**, so nothing can land.
- **A worked task that was never ticked** — the code is committed, the box
  still reads `- [ ]`.

What to do, in order of preference:

1. **Fix the cause** if it is small and safe: correct the task's wording,
   repair a broken check, tick a task whose work is verifiably committed (run
   the task check first), or record the fact the agents lacked where the next
   one will read it (docs/REPO-MAP.md or the task's own bullets).
2. **Split the task** into parts that each fit one iteration, replacing the
   original. Keep every requirement — never drop scope to make it fit.
3. **Block it** — `- [!] <text> - BLOCKED: <what you found>` — when the real
   fix needs a human decision.

Never weaken a test, never lower a bar, never tick what is not done. Commit
what you change with a message beginning `diagnose:` that states the cause.
Then stop.
