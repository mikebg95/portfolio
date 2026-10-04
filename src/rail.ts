// The phone card rail (overview-default-light-390 "How I work"): a horizontal scroll-snap list
// whose position indicator follows the scroll. Without JS the list is a plain overflow scroller and
// the indicator stays hidden (it shows under `.js`). Markup: a `[data-rail]` list followed by its
// `[data-rail-index]` element with one child per card.

/**
 * The card the rail is showing: the one whose left edge is nearest the scroll position, or the
 * last once the rail is scrolled to its end (a last card narrower than the rail never reaches
 * the start).
 */
export function railIndex(
  scrollLeft: number,
  maxScroll: number,
  offsets: readonly number[],
): number {
  if (offsets.length === 0) return 0;
  if (maxScroll > 0 && scrollLeft >= maxScroll - 1) return offsets.length - 1;
  let nearest = 0;
  offsets.forEach((offset, i) => {
    if (Math.abs(offset - scrollLeft) < Math.abs((offsets[nearest] ?? 0) - scrollLeft)) nearest = i;
  });
  return nearest;
}

/**
 * Wires every `[data-rail]` list: marks the indicator's current bar, and makes the list a tab
 * stop only while it actually scrolls (desktop shows it as a grid, where a stop would be noise).
 */
export function rails(root: ParentNode = document): void {
  for (const rail of root.querySelectorAll<HTMLElement>('[data-rail]')) {
    const index = rail.nextElementSibling?.matches('[data-rail-index]')
      ? [...rail.nextElementSibling.children]
      : [];
    const cards = [...rail.children] as HTMLElement[];

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolls = rail.scrollWidth > rail.clientWidth + 1;
      if (scrolls) rail.tabIndex = 0;
      else rail.removeAttribute('tabindex');
      const first = cards[0]?.offsetLeft ?? 0;
      const current = railIndex(
        rail.scrollLeft,
        rail.scrollWidth - rail.clientWidth,
        cards.map((card) => card.offsetLeft - first),
      );
      index.forEach((bar, i) => bar.toggleAttribute('data-current', i === current));
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };

    rail.addEventListener('scroll', schedule, { passive: true });
    new ResizeObserver(schedule).observe(rail);
    update();
  }
}
