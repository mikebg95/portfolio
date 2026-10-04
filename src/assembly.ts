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
  plate: { size: PlateSize; style?: 'solid' | 'dashed' };
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

// design/motion.md §M5: the drawing starts assembled and explodes to the layout above. Progress
// runs 0 → 1 (scrubbed by scroll, or played as one timeline); every window below is a slice of it.

/** Assembled, each solid plate sits this far above the one below it (§M5 "gap 6 px"). */
export const STACK_GAP = 6;

/** Progress windows: the axis draws, plates rise top first, a callout as its plate arrives. */
export const EXPLODE = {
  axis: [0, 0.6],
  move: 0.45,
  stagger: 0.12,
  callout: 0.12,
  /** The dashed (to-be-fitted) plate fades in last, its callout with it. */
  fade: [0.82, 1],
} as const;

export type Window = readonly [from: number, to: number];

export interface PlateExplosion {
  item: number;
  /** Drawing units the plate sits below its drawn position while assembled. */
  drop: number;
  /** When it rises; null for the base plate and a dashed one, which never move. */
  move: Window | null;
  /** When its leader draws, balloon pops and label fades in. */
  callout: Window;
  /** When it fades in; null for a solid plate, which is there from the start. */
  fade: Window | null;
}

/**
 * The assembled stack and the explosion's schedule. Solid plates pile onto the base plate,
 * `STACK_GAP` apart, and rise to their drawn positions top plate first; the base plate's callout
 * appears with the last one's; a dashed plate is not in the stack and fades in last.
 */
export function explode<P extends PlateInput>(assembly: Assembly<P>): PlateExplosion[] {
  const solid = assembly.plates.filter((p) => p.part.plate.style !== 'dashed');
  const base = solid.at(-1);
  const movers = solid.slice(0, -1);
  const arrival = (i: number) => i * EXPLODE.stagger + EXPLODE.move;
  const last = arrival(Math.max(0, movers.length - 1));
  return assembly.plates.map((plate) => {
    const item = plate.part.item;
    if (plate.part.plate.style === 'dashed') {
      return { item, drop: 0, move: null, callout: [1 - EXPLODE.callout, 1], fade: EXPLODE.fade };
    }
    const i = movers.indexOf(plate);
    const level = solid.length - 1 - solid.indexOf(plate);
    const drop = base ? base.cy - level * STACK_GAP - plate.cy : 0;
    const to = i < 0 ? last : arrival(i);
    return {
      item,
      drop,
      move: i < 0 ? null : [to - EXPLODE.move, to],
      callout: [to, to + EXPLODE.callout],
      fade: null,
    };
  });
}

/** `#part-4` → 4 when 4 is one of `items`; anything else → undefined. */
export function partFromHash(hash: string, items: readonly number[]): number | undefined {
  const match = /^#part-(\d+)$/.exec(hash);
  const item = match ? Number(match[1]) : undefined;
  return item !== undefined && items.includes(item) ? item : undefined;
}

export const partHash = (item: number) => `#part-${item}`;
