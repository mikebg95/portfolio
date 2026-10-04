You re-check blocked tasks. BACKLOG.md has one or more `- [!] … - BLOCKED:
<reason>` lines. A blocker is written once and nothing ever re-checks it; in
this fleet four of six turned out false — the file had been on disk for eight
days, the login was done, the account existed, the work had already shipped.
Each sat frozen, reading as "needs a human", with nothing waiting on it.

For each `- [!]` line in BACKLOG.md (not TODO-MANUAL bullets):

1. Read the reason. Name the concrete thing it says is missing.
2. **Check the machine for it** — the file or directory, the installed tool
   (`command -v`), the login (`… whoami`/`status`), the env var, the
   credential in Keychain, the commit that may already have done the work
   (`git log --oneline -S '<symbol>'`). Cheap, read-only checks only; change
   nothing outside BACKLOG.md.
3. **If the blocker no longer holds**, reopen the task: `- [!]` → `- [ ]`, drop
   the BLOCKED clause, and add a nested bullet
   `- Unblocked <date>: <what you checked and what it showed>`.
   If the work is in fact already done and committed, tick it `- [x]` instead,
   with the evidence.
4. **If it still holds**, leave the line exactly as it is.

Never unblock on a guess — only on a check you ran and can quote. A blocker
that is a genuine human decision (a business choice, a value only the owner
may set, a payment) stays blocked; you are checking facts, not making
decisions.

Commit BACKLOG.md once, message `blockers: re-checked N, reopened M`, then stop.
No user is present; ask nothing.
