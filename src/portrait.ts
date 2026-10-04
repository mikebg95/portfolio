// The ASCII portrait (SPEC §4.1), read from its single sources at build time: Vite inlines the files,
// so docs/source/ is the only copy and the page ships them as real text. Dense glyphs mark dark
// areas, so each theme needs its own: the light file for ink on paper, the dark file (density
// inverted) for light text on the blueprint's navy, where the light file reads as a negative.
import portrait from '../docs/source/ascii-portrait.txt?raw';
import portraitDark from '../docs/source/ascii-portrait-dark.txt?raw';

/** For the paper theme. */
export const PORTRAIT: string = portrait;
/** For the blueprint theme. */
export const PORTRAIT_DARK: string = portraitDark;
