// Content dates (`YYYY-MM`) as the sheets print them: `NOV 2023`, and `NOW` for an open end. The
// words come from `ui.dates`, so each language writes its own (`jun 2026` in Dutch, SPEC §3.6).

export interface DateWords {
  months: readonly string[];
  now: string;
}

/** `2023-11` → `NOV 2023`; `null` → `NOW`. */
export const formatMonth = (month: string | null, words: DateWords) => {
  if (month === null) return words.now;
  const [year, mm] = month.split('-');
  const name = words.months[Number(mm) - 1];
  if (year === undefined || name === undefined) throw new Error(`not a YYYY-MM month: ${month}`);
  return `${name} ${year}`;
};

/** `NOV 2023 – NOW`; the detail blocks pass ` — `. */
export const formatSpan = (
  span: { start: string; end: string | null },
  words: DateWords,
  separator = ' – ',
) => `${formatMonth(span.start, words)}${separator}${formatMonth(span.end, words)}`;
