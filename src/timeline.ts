// Sheet 02 timeline geometry (SPEC §4.2): pure maths from `YYYY-MM` months and the build date.
// Positions are month starts, so a bar `Feb 2021 – Oct 2023` spans 32 months (`2 Y 8 M`, as drawn).

export interface Span {
  start: string;
  end: string | null;
}

/** Ruler range as month indices (`year * 12 + month0`), plus the year columns it shows. */
export interface Ruler {
  start: number;
  end: number;
  years: number[];
}

export interface Placement {
  /** Left edge and width as percentages of the ruler. */
  left: number;
  width: number;
  /** Open end ("now"): drawn to the ruler's right edge. */
  open: boolean;
  /** Whole months the bar stands for; an open end counts to the build date, rounded. */
  months: number;
}

/** `2023-11` → month index. */
export const monthIndex = (month: string) => {
  const [year, mm] = month.split('-').map(Number);
  if (year === undefined || mm === undefined || !(mm >= 1 && mm <= 12)) {
    throw new Error(`not a YYYY-MM month: ${month}`);
  }
  return year * 12 + mm - 1;
};

/** The build date as a fractional month index (UTC, like the title block's REV). */
export const nowIndex = (now: Date) => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return year * 12 + month + (now.getUTCDate() - 1) / daysInMonth;
};

/** Jan of the earliest start year → the next January after the build date (or the last end). */
export const ruler = (spans: readonly Span[], now: Date): Ruler => {
  if (spans.length === 0) throw new Error('a timeline needs at least one span');
  const firstYear = Math.min(...spans.map((s) => Math.floor(monthIndex(s.start) / 12)));
  const lastYear = Math.max(
    now.getUTCFullYear(),
    ...spans.map((s) => (s.end === null ? -Infinity : Math.floor(monthIndex(s.end) / 12))),
  );
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  return { start: firstYear * 12, end: (lastYear + 1) * 12, years };
};

/** Where a span sits on the ruler. */
export const place = (span: Span, range: Ruler, now: Date): Placement => {
  const total = range.end - range.start;
  const start = monthIndex(span.start);
  const left = ((start - range.start) / total) * 100;
  if (span.end === null) {
    return { left, width: 100 - left, open: true, months: Math.round(nowIndex(now) - start) };
  }
  const months = monthIndex(span.end) - start;
  return { left, width: (months / total) * 100, open: false, months };
};

/**
 * Every entry placed on one ruler, sorted by start. An entry ending the month before the next one
 * starts (sabbatical May → OptieCon Jun) is drawn up to it: consecutive months leave no gap.
 */
export const layout = <T extends Span>(entries: readonly T[], now: Date) => {
  const range = ruler(entries, now);
  const sorted = [...entries].sort((a, b) => monthIndex(a.start) - monthIndex(b.start));
  const bars = sorted.map((entry, i) => {
    const next = sorted[i + 1];
    const butts =
      entry.end !== null &&
      next !== undefined &&
      monthIndex(next.start) - monthIndex(entry.end) === 1;
    const drawn = butts ? { start: entry.start, end: next.start } : entry;
    return { entry, ...place(drawn, range, now) };
  });
  return { ruler: range, bars };
};

/**
 * The phone's vertical ruler (experience-default-light-390): the build date at the top, then each
 * year's January down to the first one, as % from the top over `months` (now − first January).
 */
export const yearMarks = (spans: readonly Span[], now: Date) => {
  const { start, years } = ruler(spans, now);
  const top = nowIndex(now);
  const months = top - start;
  const marks = years
    .filter((year) => year * 12 <= top)
    .reverse()
    .map((year) => ({ year, at: ((top - year * 12) / months) * 100 }));
  return { months, marks };
};

/** `32` → `2 Y 8 M`. */
export const formatDuration = (months: number) => `${Math.floor(months / 12)} Y ${months % 12} M`;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * §M4 sweep: how far a bar at `start` % spanning `span` % of the ruler is drawn when a pen moving
 * along the ruler is at `sweep` (0–1).
 */
export const barProgress = (sweep: number, start: number, span: number) =>
  span > 0 ? clamp((sweep * 100 - start) / span) : sweep * 100 >= start ? 1 : 0;

/** `progress` rescaled so `from` → 0 and `to` → 1, clamped. */
export const between = (progress: number, from: number, to: number) =>
  clamp((progress - from) / (to - from));
