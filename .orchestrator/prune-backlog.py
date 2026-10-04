#!/usr/bin/env python3
"""Move finished tasks out of BACKLOG.md, so the queue stays a queue.

WHY THIS RUNS UNATTENDED, and is not left to the agent or to a house rule.

BACKLOG.md is re-sent to the agent on every turn, and an iteration takes 80-150
of them. A finished task left in the file is therefore paid for a hundred times
over, on every iteration, until somebody moves it. Measured on
dominio-de-ingles 2026-08-29: the file had drifted to 133 KB (~33k tokens) of
which three quarters was neither open nor live -- 27 completed tasks and one
157-line settled section. Cost per iteration tracked turns x context almost
exactly; the model the router picked barely moved it.

That drift happened AFTER a hand cleanup on 2026-08-26 and AFTER the file's own
header said done tasks belong in BACKLOG-DONE.md. Both were true and neither
held, which is the whole argument for this script: a rule an agent has to
remember at the end of a long task is a rule that comes back untidy. The loop
runs this between iterations instead, where it is mechanical and cannot be
forgotten.

WHAT IT WILL NOT DO

- It never deletes. Every block moves verbatim into BACKLOG-DONE.md, under the
  heading it sat beneath, so the archive still reads in context. Several done
  tasks carry the measurement or the refusal that explains why the code is the
  way it is; that is worth keeping, just not in the file read a hundred times
  per task.
- It only ever moves `- [x]`. Open, blocked and deferred tasks are left exactly
  where they are -- `- [!]` and `- [~]` in particular are LIVE state a human
  needs to see in the queue, not history.
- It refuses to run while BACKLOG.md has uncommitted changes. That is the
  signal that an agent is mid-write, and a concurrent edit there could clobber
  a tick the agent has not committed yet.

`--check` reports what it would move and changes nothing.
"""

import io
import os
import re
import subprocess
import sys

TASK = re.compile(r"^\s*- \[([ x!~])\]")
HEADING = re.compile(r"^(#{2,3})\s+\S")


def git(root, *args):
    return subprocess.run(
        ["git", "-C", root, *args], capture_output=True, text=True
    )


def repo_root(start):
    r = git(start, "rev-parse", "--show-toplevel")
    return r.stdout.strip() if r.returncode == 0 else None


def split_blocks(text):
    """Split the file into (marker, lines) chunks.

    A block runs from its `- [x]` line until the next task line or the next
    heading, whichever comes first. Stopping at a heading matters: without it a
    finished task at the end of a section swallows the heading of the next one
    and the archive grows a stray title while the queue loses it.
    """
    blocks, cur, marker = [], [], None
    for line in text.split("\n"):
        m = TASK.match(line)
        if m:
            if cur:
                blocks.append((marker, cur))
            cur, marker = [line], m.group(1)
            continue
        if HEADING.match(line) and cur:
            blocks.append((marker, cur))
            cur, marker = [line], None
            continue
        # orchestrator-kit: a task block is its line plus INDENTED bullets and
        # blank lines. The first un-indented line that is not a task (a `---`
        # rule, a paragraph of prose) belongs to what follows, not to the task
        # above it — otherwise the last finished task of a section carried the
        # separator before TODO-MANUAL off into the archive.
        if cur and marker is not None and line.strip() and not line[0].isspace():
            blocks.append((marker, cur))
            cur, marker = [line], None
            continue
        if cur:
            cur.append(line)
        else:
            cur, marker = [line], None
    if cur:
        blocks.append((marker, cur))
    return blocks


def main():
    check = "--check" in sys.argv
    here = os.path.dirname(os.path.abspath(__file__))
    root = repo_root(here)
    if not root:
        print("prune-backlog: not a git repository", file=sys.stderr)
        return 1

    backlog = os.path.join(root, "BACKLOG.md")
    archive = os.path.join(root, "BACKLOG-DONE.md")
    if not os.path.exists(backlog):
        return 0

    # An agent mid-write owns this file. Its tick is not committed yet, and
    # rewriting underneath it would lose it.
    dirty = git(root, "status", "--porcelain", "--", "BACKLOG.md").stdout.strip()
    if dirty and not check:
        print("prune-backlog: BACKLOG.md has uncommitted changes — skipping this round")
        return 0

    src = io.open(backlog, encoding="utf-8").read()
    blocks = split_blocks(src)
    done = [b for mark, b in blocks if mark == "x"]
    if not done:
        return 0

    # Track the heading each moved block sat under, so the archive keeps context.
    kept, moved, section = [], [], None
    for mark, block in blocks:
        if HEADING.match(block[0]):
            section = block[0]
        if mark == "x":
            moved.append((section, block))
        else:
            kept.extend(block)

    out = re.sub(r"\n{4,}", "\n\n\n", "\n".join(kept))
    if src.endswith("\n") and not out.endswith("\n"):
        out += "\n"   # orchestrator-kit: keep the final newline, or the next append joins the last line
    before, after = len(src), len(out)
    summary = (
        f"prune-backlog: moved {len(moved)} finished task(s) to BACKLOG-DONE.md — "
        f"{before:,} -> {after:,} bytes (~{before // 4:,} -> ~{after // 4:,} tokens)"
    )

    if check:
        print(summary + "  [--check, nothing written]")
        return 0

    io.open(backlog, "w", encoding="utf-8").write(out)

    chunks = ["\n\n## Pruned from the queue\n",
              f"\n{len(moved)} finished task(s), moved verbatim by "
              f"`prune-backlog.py` so the live queue holds only live work.\n"]
    last = None
    for sec, block in moved:
        if sec and sec != last:
            chunks.append(f"\n{sec}\n")
            last = sec
        chunks.append("\n" + "\n".join(block).rstrip() + "\n")
    with io.open(archive, "a", encoding="utf-8") as fh:
        fh.write("".join(chunks))

    git(root, "add", "--", "BACKLOG.md", "BACKLOG-DONE.md")
    git(root, "commit", "-q", "-m",
        f"backlog: prune {len(moved)} finished task(s) out of the queue\n\n"
        f"Automatic, between iterations. BACKLOG.md is re-sent on every turn and "
        f"an iteration takes 80-150 of them, so a finished task left here is paid "
        f"for a hundred times over. Moved verbatim, nothing deleted.\n\n"
        f"{before:,} -> {after:,} bytes (~{before // 4:,} -> ~{after // 4:,} tokens).")
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
