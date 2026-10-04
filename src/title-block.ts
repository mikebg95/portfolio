// Values the footer title block computes (SPEC §3.2, design/copy.md Global); its strings live in `ui`.

const pad = (n: number) => String(n).padStart(2, '0');

/** `REV` — the build month as `YYYY.MM` (UTC, so the same build reads the same everywhere). */
export const formatRev = (date: Date) => `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}`;

/** `SHEET` — `03 / 05`; a page outside the set (404) reads `?? / 05`, as its label does. */
export const formatSheet = (number: number | undefined, total: number) =>
  `${number === undefined ? '??' : pad(number)} / ${pad(total)}`;
