import { writeFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { THEMES, THEME_STORAGE_KEY } from '../../src/theme';
import { PAGES } from './helpers/routes';

// QA-63: WebKit on a 3× screen drew no left/right sides on a 1.5 px dashed border (it snaps to
// 1.33 px). Every dashed side on every page, in both themes, must put its own colour on screen: the
// middle of the side is photographed as is and with its colour made transparent, and the pixels that
// changed must be the border's colour over what lies behind it. Run it on webkit-iphone above all.

type Side = 'top' | 'right' | 'bottom' | 'left';
const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

interface DashedSide {
  index: number;
  side: Side;
  label: string;
}

const MARK = 'data-dashed-check';

/** Tags every visible element with a dashed side and lists those sides. */
function dashedSides(page: Page): Promise<DashedSide[]> {
  return page.evaluate(
    ([mark, sides]) => {
      const found: DashedSide[] = [];
      let index = 0;
      for (const el of document.querySelectorAll('body *')) {
        const style = getComputedStyle(el);
        const dashed = sides.filter(
          (side) =>
            style.getPropertyValue(`border-${side}-style`) === 'dashed' &&
            parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0,
        );
        if (dashed.length === 0) continue;
        if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        el.setAttribute(mark, String(index));
        const name = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
        for (const side of dashed) found.push({ index, side, label: name } as DashedSide);
        index += 1;
      }
      return found;
    },
    [MARK, SIDES] as const,
  );
}

/**
 * The middle half of one side and a little round it, in viewport CSS px, scrolled into the band
 * between the fixed header and tab bar. Only the middle: a side's colour also paints its share of
 * the two corners, which the neighbouring sides draw anyway. The side is found in the element's own
 * box and carried through its transform, so a rotated note, a turned plate and a round balloon are
 * clipped where they draw it.
 */
function sideClip(page: Page, { index, side }: DashedSide) {
  return page.evaluate(
    ([mark, index, side, header, footer]) => {
      const el = document.querySelector<HTMLElement>(`[${mark}="${index}"]`)!;
      const style = getComputedStyle(el);
      const width = parseFloat(style.getPropertyValue(`border-${side}-width`));
      type Point = { x: number; y: number };
      const ends = (): [Point, Point] => {
        const saved = el.style.transform;
        el.style.transform = 'none';
        const box = el.getBoundingClientRect();
        el.style.transform = saved;
        const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
        const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat) as [number, number];
        const at = (x: number, y: number): Point => {
          const p = new DOMPoint(x - ox, y - oy).matrixTransform(matrix);
          return { x: box.left + ox + p.x, y: box.top + oy + p.y };
        };
        const [w, h, half] = [box.width, box.height, width / 2];
        if (side === 'left') return [at(half, h / 4), at(half, (3 * h) / 4)];
        if (side === 'right') return [at(w - half, h / 4), at(w - half, (3 * h) / 4)];
        if (side === 'top') return [at(w / 4, half), at((3 * w) / 4, half)];
        return [at(w / 4, h - half), at((3 * w) / 4, h - half)];
      };
      const band = { top: header, bottom: innerHeight - footer };
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      const [first, last] = ends();
      scrollBy(0, (first.y + last.y - band.top - band.bottom) / 2);
      const [a, b] = ends();
      const pad = width / 2 + 3; // a round balloon's side bows in from the line between its ends
      const left = Math.max(Math.min(a.x, b.x) - pad, 0);
      const right = Math.min(Math.max(a.x, b.x) + pad, innerWidth);
      const top = Math.max(Math.min(a.y, b.y) - pad, band.top);
      const bottom = Math.min(Math.max(a.y, b.y) + pad, band.bottom);
      return { x: left, y: top, width: right - left, height: bottom - top };
    },
    [MARK, index, side, 64, 96] as const,
  );
}

/**
 * How many device pixels of `drawn` differ from `bare` by the border colour laid over it — wholly,
 * or partly where an edge is antialiased (a turned plate at 1×).
 */
function borderPixels(page: Page, drawn: Buffer, bare: Buffer, colour: string) {
  return page.evaluate(
    async ([drawn, bare, colour]) => {
      const pixels = async (png: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${png}`)).blob(),
        );
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      // Any CSS colour (color-mix, oklch…) to sRGB + alpha, through a 1 × 1 canvas.
      const probe = new OffscreenCanvas(1, 1).getContext('2d')!;
      probe.fillStyle = colour;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = [...probe.getImageData(0, 0, 1, 1).data] as number[];
      const ink = [r!, g!, b!];
      const alpha = a! / 255;
      const [on, off] = [await pixels(drawn), await pixels(bare)];
      let count = 0;
      for (let i = 0; i < on.length; i += 4) {
        const shown = [on[i]!, on[i + 1]!, on[i + 2]!];
        const behind = [off[i]!, off[i + 1]!, off[i + 2]!];
        // The full border colour over this pixel's background, and how far `shown` lies along the
        // way from the background to it (coverage), and off that line (another colour).
        const full = ink.map((c, k) => alpha * c + (1 - alpha) * behind[k]!);
        const step = full.map((c, k) => c - behind[k]!);
        const moved = shown.map((c, k) => c - behind[k]!);
        const length = step.reduce((sum, d) => sum + d * d, 0);
        if (length < 24 * 24 || moved.every((d) => Math.abs(d) <= 8)) continue;
        const coverage = moved.reduce((sum, d, k) => sum + d * step[k]!, 0) / length;
        const offLine = moved.map((d, k) => d - coverage * step[k]!);
        if (coverage >= 0.25 && coverage <= 1.15 && offLine.every((d) => Math.abs(d) <= 24)) {
          count += 1;
        }
      }
      return count;
    },
    [drawn.toString('base64'), bare.toString('base64'), colour] as const,
  );
}

for (const path of PAGES) {
  test(`${path}: every dashed border draws all its sides, both themes`, async ({
    page,
  }, testInfo) => {
    test.slow(); // two photographs per dashed side; Experience has dozens
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    for (const theme of THEMES) {
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key!, value!),
        [THEME_STORAGE_KEY, theme],
      );
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const missing: string[] = [];
      for (const found of await dashedSides(page)) {
        const element = page.locator(`[${MARK}="${found.index}"]`);
        const clip = await sideClip(page, found);
        if (clip.width <= 0 || clip.height <= 0) continue;
        const colour = await element.evaluate(
          (el, side) => getComputedStyle(el).getPropertyValue(`border-${side}-color`),
          found.side,
        );
        const drawn = await page.screenshot({ clip, animations: 'disabled' });
        await element.evaluate(
          (el, side) =>
            (el as HTMLElement).style.setProperty(`border-${side}-color`, 'transparent'),
          found.side,
        );
        const bare = await page.screenshot({ clip, animations: 'disabled' });
        await element.evaluate(
          (el, side) => (el as HTMLElement).style.removeProperty(`border-${side}-color`),
          found.side,
        );
        // A missing side changes nothing in its middle half; a drawn one shows a dash or more.
        const count = await borderPixels(page, drawn, bare, colour);
        if (count < 3) {
          const name = `${theme} ${found.label} ${found.side}`;
          missing.push(`${found.label} ${found.side} (${count} px)`);
          for (const [shot, body] of [
            ['drawn', drawn],
            ['bare', bare],
          ] as const) {
            const file = testInfo.outputPath(`${name} ${shot}.png`.replaceAll(/[^\w.-]+/g, '-'));
            writeFileSync(file, body);
            await testInfo.attach(`${name} ${shot}`, { path: file, contentType: 'image/png' });
          }
        }
      }
      expect(missing, `${theme}: dashed sides not drawn`).toEqual([]);
    }
  });
}
