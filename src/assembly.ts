// Sheet 05 exploded assembly geometry (SPEC §4.6, components.md ExplodedAssembly): pure maths in
// drawing units (1 unit = 1 px at full size; the page scales them to the column's width).
// A plate is a square turned `rotateX(58deg) rotateZ(-45deg)`, so on paper it is a diamond as wide
// as the square's diagonal and cos 58° as tall. Its 7 px thickness is a box-shadow that the same
// transform turns into a horizontal offset, so it adds nothing to the diamond's height.

/** The part selected when the sheet opens (SPEC §4.6: the Minor Programming detail). */
export const DEFAULT_PART = 3;

export type PlateSize = 'full' | 'small';

/** Square side per plate size (components.md: CS50's plate is 150 px). */
export const PLATE_SIDE: Record<PlateSize, number> = { full: 250, small: 150 };

export const TILT_DEG = 58;

/** Space between one diamond's bottom corner and the next one's top corner. */
export const PLATE_GAP = 16;

/** The dashed centre axis runs this far past the top and bottom plates. */
export const AXIS_OVERRUN = 20;

/** Leader length from a full plate's right corner to its balloon. */
export const LEADER = 48;

export interface Diamond {
  width: number;
  height: number;
}

export const diamond = (side: number): Diamond => ({
  width: side * Math.SQRT2,
  height: side * Math.SQRT2 * Math.cos((TILT_DEG * Math.PI) / 180),
});

/** The fields of an `education` entry the geometry reads. */
export interface PlateInput {
  item: number;
  plate: { size: PlateSize };
}

export interface PlatePlacement<P extends PlateInput> {
  part: P;
  side: number;
  /** The diamond's centre: also the untransformed square's centre. */
  cx: number;
  cy: number;
  /** The diamond's top and bottom corners. */
  top: number;
  bottom: number;
  /** x of the diamond's right corner, where the leader starts. */
  right: number;
}

export interface Assembly<P extends PlateInput> {
  /** Highest item first: top of the drawing to the base plate. */
  plates: PlatePlacement<P>[];
  /** The centre axis's x; every plate is centred on it. */
  axis: number;
  /** x of every balloon's centre-left edge (the leaders end there). */
  balloon: number;
  width: number;
  height: number;
}

/** Stacks the plates top (highest item) to bottom (item 1, the base) on one vertical axis. */
export function layout<P extends PlateInput>(parts: readonly P[]): Assembly<P> {
  const widest = Math.max(...parts.map((p) => diamond(PLATE_SIDE[p.plate.size]).width));
  const axis = widest / 2;
  let y = AXIS_OVERRUN;
  const plates = [...parts]
    .sort((a, b) => b.item - a.item)
    .map((part) => {
      const side = PLATE_SIDE[part.plate.size];
      const d = diamond(side);
      const placement = {
        part,
        side,
        cx: axis,
        cy: y + d.height / 2,
        top: y,
        bottom: y + d.height,
        right: axis + d.width / 2,
      };
      y += d.height + PLATE_GAP;
      return placement;
    });
  const balloon = widest + LEADER;
  return { plates, axis, balloon, width: balloon, height: y - PLATE_GAP + AXIS_OVERRUN };
}

/** `#part-4` → 4 when 4 is one of `items`; anything else → undefined. */
export function partFromHash(hash: string, items: readonly number[]): number | undefined {
  const match = /^#part-(\d+)$/.exec(hash);
  const item = match ? Number(match[1]) : undefined;
  return item !== undefined && items.includes(item) ? item : undefined;
}

export const partHash = (item: number) => `#part-${item}`;
