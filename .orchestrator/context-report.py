#!/usr/bin/env python3
"""Report what this run will re-read on every turn, and warn before it hurts.

WHY A REPORT AND NOT A TRIM

Measured on dominio-de-ingles 2026-08-30, from the stream logs of three real
iterations:

  cache read   73% of spend      re-sending the conversation, every turn
  cache write  26%               the conversation growing
  output        0.1%             the model barely writes anything

So essentially all of the money is context being re-sent. Of that, the FIXED
prefix -- system prompt and tool definitions, plus CLAUDE.md, the driver prompt
and BACKLOG.md -- is measurable exactly: it is turn 1's context, before any tool
result has landed. It came to 39,400 tokens, identical across three iterations
to within 13 tokens, and accounted for 23-62% of an iteration's total input
depending only on how long that iteration ran.

The rest is growth: turn 1 was 39k, turn 201 was 185k, all of it tool results
and file reads accumulating. That is why trimming files has a smaller effect
than it looks like it should, and why the number that really moves cost is TURN
COUNT -- iteration 13 cost $21.49 over 192 turns while iteration 3 cost $1.43
over 7.

None of which makes the prefix free. It is paid on every turn of every task, so
a file that doubles quietly doubles a bill nobody is watching. This reports it
so the growth is seen, rather than trimming anything -- because the CLAUDE.md
files measured here are 0-20% prose and the rest invariants, and deleting an
invariant to save tokens buys a few thousand and costs an agent rediscovering
it the expensive way.

The failure this exists to prevent is on the record: a sibling project let its
CLAUDE.md reach ~245,000 tokens -- larger than the context window -- at which
point its cheap router failed with `prompt_too_long` on every iteration and
every task fell back to the most expensive model. It got there ~150 lines at a
time, each reasonable on its own, with nothing ever watching the total.
"""

import io
import os
import subprocess
import sys

# Three characters to a token, matching the CLAUDE.md size check these loops
# already carry ("~3.3 bytes/token in practice; deliberately pessimistic").
#
# It is deliberately the SAME divisor as that check rather than a more accurate
# one. Four is closer for English prose, and using it printed 14,903 tokens for
# the very file the line below called 19,998 — two numbers for one file, in one
# log, a line apart. A reader then has to work out which to believe before they
# can act, which is worse than either number being slightly off. Pessimistic and
# consistent beats accurate and contradictory for a threshold nobody should have
# to think about.
CHARS_PER_TOKEN = 3

# Warn, never fail. A loop that refuses to start because a file grew would be
# worse than the growth: the run is the thing that matters, and a human reading
# the log is the intended fix.
WARN_TOKENS = {
    'CLAUDE.md': 10_000,
    'BACKLOG.md': 20_000,
}


def repo_root(start):
    r = subprocess.run(['git', '-C', start, 'rev-parse', '--show-toplevel'],
                       capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else start


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = repo_root(here)
    orch = os.path.basename(here)

    targets = [
        ('CLAUDE.md', os.path.join(root, 'CLAUDE.md')),
        ('BACKLOG.md', os.path.join(root, 'BACKLOG.md')),
        (f'{orch}/prompt.md', os.path.join(here, 'prompt.md')),
        (f'{orch}/harness-prompt.md', os.path.join(here, 'harness-prompt.md')),
    ]

    parts, total, warnings = [], 0, []
    for label, path in targets:
        try:
            size = len(io.open(path, encoding='utf-8', errors='replace').read())
        except OSError:
            continue
        tokens = size // CHARS_PER_TOKEN
        total += tokens
        parts.append(f'{label} ~{tokens:,}')
        limit = WARN_TOKENS.get(label)
        if limit and tokens > limit:
            warnings.append(
                f'{label} is ~{tokens:,} tokens, past the ~{limit:,} mark. '
                f'It is re-read on every turn of every task, so this is paid '
                f'hundreds of times a night. State invariants, not stories, and '
                f'move settled history into docs/.'
            )

    print(f'context re-read every turn: {" · ".join(parts)} · total ~{total:,} tokens')
    for line in warnings:
        print(f'WARNING: {line}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
